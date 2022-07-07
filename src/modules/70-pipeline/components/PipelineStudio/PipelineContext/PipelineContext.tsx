/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { deleteDB, IDBPDatabase, openDB } from 'idb'
import { cloneDeep, defaultTo, get, isEmpty, isEqual, isNil, omit, pick } from 'lodash-es'
import { parse } from 'yaml'
import { IconName, MultiTypeInputType, VisualYamlSelectedView as SelectedView } from '@wings-software/uicore'
import merge from 'lodash-es/merge'
import type { GetDataError } from 'restful-react'
import type { PermissionCheck } from 'services/rbac'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import SessionToken from 'framework/utils/SessionToken'
import type { YamlBuilderHandlerBinding } from '@common/interfaces/YAMLBuilderProps'
import {
  PipelineInfoConfig,
  StageElementConfig,
  StageElementWrapperConfig,
  createPipelinePromise,
  CreatePipelineQueryParams,
  createPipelineV2Promise,
  EntityGitDetails,
  ErrorNodeSummary,
  EntityValidityDetails,
  Failure,
  getPipelinePromise,
  GetPipelineQueryParams,
  putPipelinePromise,
  PutPipelineQueryParams,
  putPipelineV2Promise,
  ResponsePMSPipelineResponseDTO,
  validateTemplateInputsPromise,
  ValidateTemplateInputsQueryParams,
  YamlSchemaErrorWrapperDTO
} from 'services/pipeline-ng'
import { useGlobalEventListener, useLocalStorage, useQueryParams } from '@common/hooks'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import type { PipelineStageWrapper } from '@pipeline/utils/pipelineTypes'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { Scope } from '@common/interfaces/SecretsInterface'
import { getTemplateTypesByRef } from '@pipeline/utils/templateUtils'
import type { StoreMetadata } from '@common/constants/GitSyncTypes'
import {
  ActionReturnType,
  DefaultNewPipelineId,
  DefaultPipeline,
  DrawerTypes,
  initialState,
  PipelineContextActions,
  PipelineReducer,
  PipelineReducerState,
  PipelineViewData,
  SelectionState
} from './PipelineActions'
import type { AbstractStepFactory } from '../../AbstractSteps/AbstractStepFactory'
import type { PipelineStagesProps } from '../../PipelineStages/PipelineStages'
import { PipelineSelectionState, usePipelineQuestParamState } from '../PipelineQueryParamState/usePipelineQueryParam'
import {
  getStageFromPipeline as _getStageFromPipeline,
  getStagePathFromPipeline as _getStagePathFromPipeline
} from './helpers'

interface PipelineInfoConfigWithGitDetails extends PipelineInfoConfig {
  gitDetails?: EntityGitDetails
  entityValidityDetails?: EntityValidityDetails
  templateError?: GetDataError<Failure | Error> | null
  yamlSchemaErrorWrapper?: YamlSchemaErrorWrapperDTO
}

const logger = loggerFor(ModuleName.CD)
const DBNotFoundErrorMessage = 'There was no DB found'

export const getPipelineByIdentifier = (
  params: GetPipelineQueryParams,
  identifier: string,
  signal?: AbortSignal
): Promise<PipelineInfoConfigWithGitDetails> => {
  return getPipelinePromise(
    {
      pipelineIdentifier: identifier,
      queryParams: {
        accountIdentifier: params.accountIdentifier,
        orgIdentifier: params.orgIdentifier,
        projectIdentifier: params.projectIdentifier,
        ...(params.branch ? { branch: params.branch } : {}),
        ...(params.repoIdentifier ? { repoIdentifier: params.repoIdentifier } : {})
      },
      requestOptions: {
        headers: {
          'content-type': 'application/yaml'
        }
      }
    },
    signal
  ).then((response: ResponsePMSPipelineResponseDTO & { message?: string }) => {
    let obj = {} as ResponsePMSPipelineResponseDTO
    if ((typeof response as unknown) === 'string') {
      obj = defaultTo(parse(response as string)?.data?.yamlPipeline, {})
    } else if (response.data?.yamlPipeline) {
      obj = response
    }
    if (obj.status === 'SUCCESS' && obj.data?.yamlPipeline) {
      let yamlPipelineDetails = null
      try {
        yamlPipelineDetails = parse(obj.data?.yamlPipeline)
      } catch (e) {
        // caught YAMLSemanticError, YAMLReferenceError, YAMLSyntaxError, YAMLWarning
      }

      return {
        ...(yamlPipelineDetails !== null && { ...yamlPipelineDetails.pipeline }),
        gitDetails: obj.data.gitDetails ?? {},
        entityValidityDetails: obj.data.entityValidityDetails ?? {},
        yamlSchemaErrorWrapper: obj.data.yamlSchemaErrorWrapper ?? {}
      }
    } else {
      return {
        templateError: {
          message: response?.message,
          data: {
            message: defaultTo(response?.message, '')
          },
          status: response?.status
        }
      }
    }
  })
}

const getTemplateErrorNodeSummary = (
  queryParams: ValidateTemplateInputsQueryParams
): Promise<ErrorNodeSummary | undefined> => {
  return validateTemplateInputsPromise({ queryParams })
    .then(response => {
      if (response && response.status === 'SUCCESS') {
        if (response.data?.validYaml === false && response.data.errorNodeSummary) {
          return response.data.errorNodeSummary
        }
      }
      throw response
    })
    .catch(_error => {
      return undefined
    })
}

export const savePipeline = (
  params: CreatePipelineQueryParams & PutPipelineQueryParams,
  pipeline: PipelineInfoConfig,
  isEdit = false,
  useAPIV2 = false
): Promise<Failure | undefined> => {
  const createPipeline = useAPIV2 ? createPipelineV2Promise : createPipelinePromise
  const updatePipeline = useAPIV2 ? putPipelineV2Promise : putPipelinePromise

  // we need to do this due to https://github.com/eemeli/yaml/issues/239
  // can remove it once fixed
  const body = yamlStringify(
    JSON.parse(
      JSON.stringify({
        pipeline: { ...pipeline, ...pick(params, 'projectIdentifier', 'orgIdentifier') }
      })
    ),
    { version: '1.1' }
  )
  return isEdit
    ? updatePipeline({
        pipelineIdentifier: pipeline.identifier,
        queryParams: {
          ...params
        },
        body: body as any,
        requestOptions: { headers: { 'Content-Type': 'application/yaml' } }
      })
        .then((response: any) => {
          if ((typeof response as unknown) === 'string') {
            return JSON.parse(response as string) as Failure
          } else {
            return response
          }
        })
        .catch(err => {
          return err
        })
    : createPipeline({
        body: body as any,
        queryParams: {
          ...params
        },
        requestOptions: { headers: { 'Content-Type': 'application/yaml' } }
      })
        .then(async (response: unknown) => {
          if (typeof response === 'string') {
            return JSON.parse(response as unknown as string) as Failure
          } else {
            return response as unknown as Failure
          }
        })
        .catch(err => {
          return err
        })
}

const DBInitializationFailed = 'DB Creation retry exceeded.'

let IdbPipeline: IDBPDatabase | undefined
const IdbPipelineStoreName = 'pipeline-cache'
export const PipelineDBName = 'pipeline-db'
const KeyPath = 'identifier'

export interface StageAttributes {
  name: string
  type: string
  icon: IconName
  iconColor: string
  isApproval: boolean
  openExecutionStrategy: boolean
}
export interface StagesMap {
  [key: string]: StageAttributes
}

export interface PipelineContextInterface {
  state: PipelineReducerState
  stagesMap: StagesMap
  stepsFactory: AbstractStepFactory
  view: string
  contextType: string
  allowableTypes: MultiTypeInputType[]
  isReadonly: boolean
  scope: Scope
  setSchemaErrorView: (flag: boolean) => void
  setView: (view: SelectedView) => void
  renderPipelineStage: (args: Omit<PipelineStagesProps, 'children'>) => React.ReactElement<PipelineStagesProps>
  fetchPipeline: (args: FetchPipelineUnboundProps) => Promise<void>
  setYamlHandler: (yamlHandler: YamlBuilderHandlerBinding) => void
  setTemplateTypes: (data: { [key: string]: string }) => void
  updatePipeline: (pipeline: PipelineInfoConfig) => Promise<void>
  updatePipelineStoreMetadata: (storeMetadata: StoreMetadata, gitDetails: EntityGitDetails) => Promise<void>
  updateGitDetails: (gitDetails: EntityGitDetails) => Promise<void>
  updateEntityValidityDetails: (entityValidityDetails: EntityValidityDetails) => Promise<void>
  updatePipelineView: (data: PipelineViewData) => void
  deletePipelineCache: (gitDetails?: EntityGitDetails) => Promise<void>
  getStageFromPipeline<T extends StageElementConfig = StageElementConfig>(
    stageId: string,
    pipeline?: PipelineInfoConfig | StageElementWrapperConfig
  ): PipelineStageWrapper<T>
  runPipeline: (identifier: string) => void
  pipelineSaved: (pipeline: PipelineInfoConfig) => void
  updateStage: (stage: StageElementConfig) => Promise<void>
  /** @deprecated use `setSelection` */
  setSelectedStageId: (selectedStageId: string | undefined) => void
  /** @deprecated use `setSelection` */
  setSelectedStepId: (selectedStepId: string | undefined) => void
  /** @deprecated use `setSelection` */
  setSelectedSectionId: (selectedSectionId: string | undefined) => void
  setSelection: (selectionState: PipelineSelectionState) => void
  getStagePathFromPipeline(stageId: string, prefix?: string, pipeline?: PipelineInfoConfig): string
}

interface PipelinePayload {
  identifier: string
  pipeline: PipelineInfoConfig | undefined
  originalPipeline?: PipelineInfoConfig
  isUpdated: boolean
  storeMetadata?: StoreMetadata
  gitDetails: EntityGitDetails
  entityValidityDetails?: EntityValidityDetails
  templateInputsErrorNodeSummary?: ErrorNodeSummary
  yamlSchemaErrorWrapper?: YamlSchemaErrorWrapperDTO
}

const getId = (
  accountIdentifier: string,
  orgIdentifier: string,
  projectIdentifier: string,
  pipelineIdentifier: string,
  repoIdentifier = '',
  branch = ''
): string =>
  `${accountIdentifier}_${orgIdentifier}_${projectIdentifier}_${pipelineIdentifier}_${repoIdentifier}_${branch}`

export interface FetchPipelineBoundProps {
  dispatch: React.Dispatch<ActionReturnType>
  queryParams: GetPipelineQueryParams
  pipelineIdentifier: string
  gitDetails: EntityGitDetails
}

export interface FetchPipelineUnboundProps {
  forceFetch?: boolean
  forceUpdate?: boolean
  newPipelineId?: string
  signal?: AbortSignal
  repoIdentifier?: string
  branch?: string
}

export const findAllByKey = (keyToFind: string, obj?: PipelineInfoConfig): string[] => {
  return obj
    ? Object.entries(obj).reduce(
        (acc: string[], [key, value]) =>
          key === keyToFind
            ? acc.concat(value as string)
            : typeof value === 'object'
            ? acc.concat(findAllByKey(keyToFind, value))
            : acc,
        []
      )
    : []
}

const getTemplateType = (pipeline: PipelineInfoConfig, queryParams: GetPipelineQueryParams) => {
  const templateRefs = findAllByKey('templateRef', pipeline)
  return getTemplateTypesByRef(
    {
      accountIdentifier: queryParams.accountIdentifier,
      orgIdentifier: queryParams.orgIdentifier,
      projectIdentifier: queryParams.projectIdentifier,
      templateListType: 'Stable',
      repoIdentifier: queryParams.repoIdentifier,
      branch: queryParams.branch,
      getDefaultFromOtherRepo: true
    },
    templateRefs
  )
}

const getRepoIdentifierName = (gitDetails?: EntityGitDetails) => {
  return gitDetails?.repoIdentifier || gitDetails?.repoName || ''
}

const _fetchPipeline = async (props: FetchPipelineBoundProps, params: FetchPipelineUnboundProps): Promise<void> => {
  const { dispatch, queryParams, pipelineIdentifier: identifier, gitDetails } = props
  const { forceFetch = false, forceUpdate = false, newPipelineId, signal, repoIdentifier, branch } = params
  const pipelineId = defaultTo(newPipelineId, identifier)
  let id = getId(
    queryParams.accountIdentifier,
    defaultTo(queryParams.orgIdentifier, ''),
    defaultTo(queryParams.projectIdentifier, ''),
    pipelineId,
    defaultTo(gitDetails.repoIdentifier, ''),
    defaultTo(gitDetails.branch, '')
  )
  dispatch(PipelineContextActions.fetching())

  let data: PipelinePayload | undefined
  try {
    data =
      IdbPipeline?.objectStoreNames?.contains(IdbPipelineStoreName) &&
      (await IdbPipeline?.get(IdbPipelineStoreName, id))
  } catch (_) {
    logger.info(DBNotFoundErrorMessage)
  }

  if ((!data || forceFetch) && pipelineId !== DefaultNewPipelineId) {
    const templateInputsErrorNodeSummary = await getTemplateErrorNodeSummary({
      ...queryParams,
      identifier: pipelineId,
      repoIdentifier,
      branch,
      getDefaultFromOtherRepo: true
    })

    const pipelineWithGitDetails: PipelineInfoConfigWithGitDetails = await getPipelineByIdentifier(
      { ...queryParams, ...(repoIdentifier ? { repoIdentifier } : {}), ...(branch ? { branch } : {}) },
      pipelineId,
      signal
    )
    if (pipelineWithGitDetails?.templateError) {
      dispatch(PipelineContextActions.error({ templateError: pipelineWithGitDetails?.templateError }))
      return
    } else {
      delete pipelineWithGitDetails.templateError
    }

    id = getId(
      queryParams.accountIdentifier,
      defaultTo(queryParams.orgIdentifier, ''),
      defaultTo(queryParams.projectIdentifier, ''),
      pipelineId,
      defaultTo(gitDetails.repoIdentifier, getRepoIdentifierName(pipelineWithGitDetails.gitDetails)),
      defaultTo(gitDetails.branch, defaultTo(pipelineWithGitDetails?.gitDetails?.branch, ''))
    )

    try {
      data = await IdbPipeline?.get(IdbPipelineStoreName, id)
    } catch (_) {
      logger.info(DBNotFoundErrorMessage)
    }
    const pipeline: PipelineInfoConfig = omit(
      pipelineWithGitDetails,
      'gitDetails',
      'entityValidityDetails',
      'repo',
      'branch',
      'connectorRef',
      'filePath',
      'yamlSchemaErrorWrapper'
    )
    const payload: PipelinePayload = {
      [KeyPath]: id,
      pipeline,
      originalPipeline: cloneDeep(pipeline),
      isUpdated: false,
      gitDetails:
        pipelineWithGitDetails?.gitDetails?.objectId || pipelineWithGitDetails?.gitDetails?.commitId
          ? pipelineWithGitDetails.gitDetails
          : data?.gitDetails ?? {},
      entityValidityDetails: defaultTo(
        pipelineWithGitDetails?.entityValidityDetails,
        defaultTo(data?.entityValidityDetails, {})
      ),
      templateInputsErrorNodeSummary,
      yamlSchemaErrorWrapper: defaultTo(
        pipelineWithGitDetails?.yamlSchemaErrorWrapper,
        defaultTo(data?.yamlSchemaErrorWrapper, {})
      )
    }
    const templateQueryParams = {
      ...queryParams,
      repoIdentifier: defaultTo(
        gitDetails.repoIdentifier,
        defaultTo(pipelineWithGitDetails?.gitDetails?.repoIdentifier, '')
      ),
      branch: defaultTo(gitDetails.branch, defaultTo(pipelineWithGitDetails?.gitDetails?.branch, ''))
    }
    if (data && !forceUpdate) {
      const templateTypes = data.pipeline ? await getTemplateType(data.pipeline, templateQueryParams) : {}
      dispatch(
        PipelineContextActions.success({
          error: '',
          pipeline: data.pipeline,
          originalPipeline: cloneDeep(pipeline),
          isBEPipelineUpdated: !isEqual(pipeline, data.originalPipeline),
          isUpdated: !isEqual(pipeline, data.pipeline),
          gitDetails:
            pipelineWithGitDetails?.gitDetails?.objectId || pipelineWithGitDetails?.gitDetails?.commitId
              ? pipelineWithGitDetails.gitDetails
              : defaultTo(data?.gitDetails, {}),
          templateTypes,
          entityValidityDetails: defaultTo(
            pipelineWithGitDetails?.entityValidityDetails,
            defaultTo(data?.entityValidityDetails, {})
          ),
          templateInputsErrorNodeSummary,
          yamlSchemaErrorWrapper: defaultTo(
            pipelineWithGitDetails?.yamlSchemaErrorWrapper,
            defaultTo(data?.yamlSchemaErrorWrapper, {})
          )
        })
      )
    } else {
      try {
        await IdbPipeline?.put(IdbPipelineStoreName, payload)
      } catch (_) {
        logger.info(DBNotFoundErrorMessage)
      }
      const templateTypes = await getTemplateType(pipeline, templateQueryParams)
      dispatch(
        PipelineContextActions.success({
          error: '',
          pipeline,
          originalPipeline: cloneDeep(pipeline),
          isBEPipelineUpdated: false,
          isUpdated: false,
          gitDetails: payload.gitDetails,
          entityValidityDetails: payload.entityValidityDetails,
          templateTypes,
          templateInputsErrorNodeSummary,
          yamlSchemaErrorWrapper: payload?.yamlSchemaErrorWrapper
        })
      )
    }
    dispatch(PipelineContextActions.initialized())
  } else {
    dispatch(
      PipelineContextActions.success({
        error: '',
        pipeline: defaultTo(data?.pipeline, {
          ...DefaultPipeline,
          projectIdentifier: queryParams.projectIdentifier,
          orgIdentifier: queryParams.orgIdentifier
        }),
        originalPipeline: defaultTo(
          cloneDeep(data?.pipeline),
          cloneDeep({
            ...DefaultPipeline,
            projectIdentifier: queryParams.projectIdentifier,
            orgIdentifier: queryParams.orgIdentifier
          })
        ),
        isUpdated: true,
        isBEPipelineUpdated: false,
        gitDetails: defaultTo(data?.gitDetails, {}),
        entityValidityDetails: defaultTo(data?.entityValidityDetails, {}),
        yamlSchemaErrorWrapper: defaultTo(data?.yamlSchemaErrorWrapper, {})
      })
    )
    dispatch(PipelineContextActions.initialized())
  }
}

const _softFetchPipeline = async (
  dispatch: React.Dispatch<ActionReturnType>,
  queryParams: GetPipelineQueryParams,
  pipelineId: string,
  originalPipeline: PipelineInfoConfig,
  pipeline: PipelineInfoConfig,
  pipelineView: PipelineReducerState['pipelineView'],
  selectionState: PipelineReducerState['selectionState'],
  gitDetails: EntityGitDetails
): Promise<void> => {
  const id = getId(
    queryParams.accountIdentifier,
    queryParams.orgIdentifier || '',
    queryParams.projectIdentifier || '',
    pipelineId,
    gitDetails.repoIdentifier || '',
    gitDetails.branch || ''
  )
  if (IdbPipeline) {
    try {
      const data: PipelinePayload = await IdbPipeline.get(IdbPipelineStoreName, id)
      if (data?.pipeline && !isEqual(data.pipeline, pipeline)) {
        const isUpdated = !isEqual(originalPipeline, data.pipeline)
        if (!isEmpty(selectionState.selectedStageId) && selectionState.selectedStageId) {
          const stage = _getStageFromPipeline(selectionState.selectedStageId, data.pipeline).stage
          if (isNil(stage)) {
            dispatch(
              PipelineContextActions.success({
                error: '',
                pipeline: data.pipeline,
                isUpdated,
                pipelineView: {
                  ...pipelineView,
                  isSplitViewOpen: false,
                  isDrawerOpened: false,
                  drawerData: { type: DrawerTypes.StepConfig },
                  splitViewData: {}
                }
              })
            )
          } else {
            dispatch(PipelineContextActions.success({ error: '', pipeline: data.pipeline, isUpdated }))
          }
        } else {
          dispatch(PipelineContextActions.success({ error: '', pipeline: data.pipeline, isUpdated }))
        }
      }
    } catch (err) {
      dispatch(PipelineContextActions.success({ error: 'DB is not initialized' }))
    }
  } else {
    dispatch(PipelineContextActions.success({ error: 'DB is not initialized' }))
  }
}

interface UpdateGitDetailsArgs {
  dispatch: React.Dispatch<ActionReturnType>
  queryParams: GetPipelineQueryParams
  identifier: string
  originalPipeline: PipelineInfoConfig
  pipeline: PipelineInfoConfig
}

const _updateStoreMetadata = async (
  args: UpdateGitDetailsArgs,
  storeMetadata: StoreMetadata,
  gitDetails: EntityGitDetails
): Promise<void> => {
  const { dispatch, queryParams, identifier, originalPipeline, pipeline } = args
  await _deletePipelineCache(queryParams, identifier, {})
  const id = getId(
    queryParams.accountIdentifier,
    queryParams.orgIdentifier || '',
    queryParams.projectIdentifier || '',
    identifier,
    getRepoIdentifierName(gitDetails),
    gitDetails.branch || ''
  )
  const isUpdated = !isEqual(originalPipeline, pipeline)
  try {
    if (IdbPipeline) {
      const payload: PipelinePayload = {
        [KeyPath]: id,
        pipeline,
        originalPipeline,
        isUpdated,
        storeMetadata,
        gitDetails
      }
      await IdbPipeline.put(IdbPipelineStoreName, payload)
    }
    dispatch(PipelineContextActions.success({ error: '', pipeline, isUpdated, storeMetadata, gitDetails }))
  } catch (_) {
    logger.info(DBNotFoundErrorMessage)
    dispatch(PipelineContextActions.success({ error: '', pipeline, isUpdated, storeMetadata, gitDetails }))
  }
}

const _updateGitDetails = async (args: UpdateGitDetailsArgs, gitDetails: EntityGitDetails): Promise<void> => {
  const { dispatch, queryParams, identifier, originalPipeline, pipeline } = args
  await _deletePipelineCache(queryParams, identifier, {})
  const id = getId(
    queryParams.accountIdentifier,
    queryParams.orgIdentifier || '',
    queryParams.projectIdentifier || '',
    identifier,
    gitDetails.repoIdentifier || '',
    gitDetails.branch || ''
  )
  const isUpdated = !isEqual(originalPipeline, pipeline)
  try {
    if (IdbPipeline) {
      const payload: PipelinePayload = {
        [KeyPath]: id,
        pipeline,
        originalPipeline,
        isUpdated,
        gitDetails
      }
      await IdbPipeline.put(IdbPipelineStoreName, payload)
    }
    dispatch(PipelineContextActions.success({ error: '', pipeline, isUpdated, gitDetails }))
  } catch (_) {
    logger.info(DBNotFoundErrorMessage)
    dispatch(PipelineContextActions.success({ error: '', pipeline, isUpdated, gitDetails }))
  }
}

interface UpdateEntityValidityDetailsArgs {
  dispatch: React.Dispatch<ActionReturnType>
  queryParams: GetPipelineQueryParams
  identifier: string
  originalPipeline: PipelineInfoConfig
  pipeline: PipelineInfoConfig
  gitDetails: EntityGitDetails
}

const _updateEntityValidityDetails = async (
  args: UpdateEntityValidityDetailsArgs,
  entityValidityDetails: EntityValidityDetails
): Promise<void> => {
  const { dispatch, queryParams, identifier, originalPipeline, pipeline, gitDetails } = args
  await _deletePipelineCache(queryParams, identifier, {})
  const id = getId(
    queryParams.accountIdentifier,
    queryParams.orgIdentifier || '',
    queryParams.projectIdentifier || '',
    identifier,
    gitDetails.repoIdentifier || '',
    gitDetails.branch || ''
  )
  if (IdbPipeline) {
    const payload: PipelinePayload = {
      [KeyPath]: id,
      pipeline,
      originalPipeline,
      isUpdated: false,
      gitDetails,
      entityValidityDetails
    }
    await IdbPipeline.put(IdbPipelineStoreName, payload)
  }
  dispatch(PipelineContextActions.success({ error: '', pipeline, entityValidityDetails }))
}

interface UpdatePipelineArgs {
  dispatch: React.Dispatch<ActionReturnType>
  queryParams: GetPipelineQueryParams
  identifier: string
  originalPipeline: PipelineInfoConfig
  pipeline: PipelineInfoConfig
  gitDetails: EntityGitDetails
}

const _updatePipeline = async (
  args: UpdatePipelineArgs,
  pipelineArg: PipelineInfoConfig | ((p: PipelineInfoConfig) => PipelineInfoConfig)
): Promise<void> => {
  const { dispatch, queryParams, identifier, originalPipeline, pipeline: latestPipeline, gitDetails } = args
  const id = getId(
    queryParams.accountIdentifier,
    queryParams.orgIdentifier || '',
    queryParams.projectIdentifier || '',
    identifier,
    gitDetails.repoIdentifier || '',
    gitDetails.branch || ''
  )

  let pipeline = pipelineArg
  if (typeof pipelineArg === 'function') {
    try {
      const dbPipeline = await IdbPipeline?.get(IdbPipelineStoreName, id)
      if (dbPipeline?.pipeline) {
        pipeline = pipelineArg(dbPipeline.pipeline)
      } else {
        throw new Error(DBNotFoundErrorMessage) //'Pipeline does not exist in the db'
      }
    } catch (_) {
      pipeline = pipelineArg(latestPipeline)
      logger.info(DBNotFoundErrorMessage)
    }
  }
  const isUpdated = !isEqual(omit(originalPipeline, 'repo', 'branch'), pipeline)
  const payload: PipelinePayload = {
    [KeyPath]: id,
    pipeline: pipeline as PipelineInfoConfig,
    originalPipeline,
    isUpdated,
    gitDetails
  }
  try {
    await IdbPipeline?.put(IdbPipelineStoreName, payload)
  } catch (_) {
    logger.info(DBNotFoundErrorMessage)
  }
  dispatch(PipelineContextActions.success({ error: '', pipeline: pipeline as PipelineInfoConfig, isUpdated }))
}

const cleanUpDBRefs = (): void => {
  if (IdbPipeline) {
    IdbPipeline.close()
    IdbPipeline = undefined
  }
}

const _initializeDb = async (dispatch: React.Dispatch<ActionReturnType>, version: number, trial = 0): Promise<void> => {
  if (!IdbPipeline) {
    try {
      dispatch(PipelineContextActions.updating())
      IdbPipeline = await openDB(PipelineDBName, version, {
        upgrade(db) {
          try {
            db.deleteObjectStore(IdbPipelineStoreName)
          } catch (_) {
            // logger.error(DBNotFoundErrorMessage)
            dispatch(PipelineContextActions.error({ error: DBNotFoundErrorMessage }))
          }
          if (!db.objectStoreNames.contains(IdbPipelineStoreName)) {
            const objectStore = db.createObjectStore(IdbPipelineStoreName, { keyPath: KeyPath, autoIncrement: false })
            objectStore.createIndex(KeyPath, KeyPath, { unique: true })
          }
        },
        async blocked() {
          cleanUpDBRefs()
        },
        async blocking() {
          cleanUpDBRefs()
        }
      })
      dispatch(PipelineContextActions.dbInitialized())
    } catch (e) {
      logger.info('DB downgraded, deleting and re creating the DB')

      await deleteDB(PipelineDBName)
      IdbPipeline = undefined

      ++trial

      if (trial < 5) {
        await _initializeDb(dispatch, version, trial)
      } else {
        logger.error(DBInitializationFailed)
        dispatch(PipelineContextActions.error({ error: DBInitializationFailed }))
      }
    }
  } else {
    dispatch(PipelineContextActions.dbInitialized())
  }
}

const deletePipelineCacheFromIDB = async (IdbPipelineDatabase: IDBPDatabase | undefined, id: string): Promise<void> => {
  if (IdbPipelineDatabase) {
    try {
      await IdbPipelineDatabase.delete(IdbPipelineStoreName, id)
    } catch (_) {
      logger.info(DBNotFoundErrorMessage)
    }
  }
}
const _deletePipelineCache = async (
  queryParams: GetPipelineQueryParams,
  identifier: string,
  gitDetails?: EntityGitDetails
): Promise<void> => {
  const id = getId(
    queryParams.accountIdentifier,
    queryParams.orgIdentifier || '',
    queryParams.projectIdentifier || '',
    identifier,
    getRepoIdentifierName(gitDetails),
    gitDetails?.branch || ''
  )
  deletePipelineCacheFromIDB(IdbPipeline, id)

  // due to async operation, IdbPipeline may be undefined
  const defaultId = getId(
    queryParams.accountIdentifier,
    queryParams.orgIdentifier || '',
    queryParams.projectIdentifier || '',
    DefaultNewPipelineId,
    getRepoIdentifierName(gitDetails),
    gitDetails?.branch || ''
  )
  deletePipelineCacheFromIDB(IdbPipeline, defaultId)
}

export enum PipelineContextType {
  Pipeline = 'Pipeline',
  StageTemplate = 'StageTemplate',
  PipelineTemplate = 'PipelineTemplate',
  Standalone = 'Standalone'
}

export const PipelineContext = React.createContext<PipelineContextInterface>({
  state: initialState,
  stepsFactory: {} as AbstractStepFactory,
  stagesMap: {},
  setSchemaErrorView: () => undefined,
  isReadonly: false,
  scope: Scope.PROJECT,
  view: SelectedView.VISUAL,
  contextType: PipelineContextType.Pipeline,
  allowableTypes: [],
  updatePipelineStoreMetadata: () => new Promise<void>(() => undefined),
  updateGitDetails: () => new Promise<void>(() => undefined),
  updateEntityValidityDetails: () => new Promise<void>(() => undefined),
  setView: () => void 0,
  runPipeline: () => undefined,
  // eslint-disable-next-line react/display-name
  renderPipelineStage: () => <div />,
  fetchPipeline: () => new Promise<void>(() => undefined),
  updatePipelineView: () => undefined,
  updateStage: () => new Promise<void>(() => undefined),
  getStageFromPipeline: () => ({ stage: undefined, parent: undefined }),
  setYamlHandler: () => undefined,
  setTemplateTypes: () => undefined,
  updatePipeline: () => new Promise<void>(() => undefined),
  pipelineSaved: () => undefined,
  deletePipelineCache: () => new Promise<void>(() => undefined),
  setSelectedStageId: (_selectedStageId: string | undefined) => undefined,
  setSelectedStepId: (_selectedStepId: string | undefined) => undefined,
  setSelectedSectionId: (_selectedSectionId: string | undefined) => undefined,
  setSelection: (_selectedState: PipelineSelectionState | undefined) => undefined,
  getStagePathFromPipeline: () => ''
})

export interface PipelineProviderProps {
  queryParams: GetPipelineQueryParams
  pipelineIdentifier: string
  stepsFactory: AbstractStepFactory
  stagesMap: StagesMap
  runPipeline: (identifier: string) => void
  renderPipelineStage: PipelineContextInterface['renderPipelineStage']
}

export function PipelineProvider({
  queryParams,
  pipelineIdentifier,
  children,
  renderPipelineStage,
  stepsFactory,
  stagesMap,
  runPipeline
}: React.PropsWithChildren<PipelineProviderProps>): React.ReactElement {
  const contextType = PipelineContextType.Pipeline
  const allowableTypes = [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const abortControllerRef = React.useRef<AbortController | null>(null)
  const isMounted = React.useRef(false)
  const [state, dispatch] = React.useReducer(
    PipelineReducer,
    merge(
      {
        pipeline: {
          projectIdentifier: queryParams.projectIdentifier,
          orgIdentifier: queryParams.orgIdentifier
        },
        originalPipeline: {
          projectIdentifier: queryParams.projectIdentifier,
          orgIdentifier: queryParams.orgIdentifier
        }
      },
      initialState
    )
  )
  const [view, setView] = useLocalStorage<SelectedView>(
    'pipeline_studio_view',
    state.entityValidityDetails.valid === false ? SelectedView.YAML : SelectedView.VISUAL
  )
  state.pipelineIdentifier = pipelineIdentifier
  const fetchPipeline = _fetchPipeline.bind(null, {
    dispatch,
    queryParams,
    pipelineIdentifier,
    gitDetails: {
      repoIdentifier,
      branch
    }
  })

  const updatePipelineStoreMetadata = _updateStoreMetadata.bind(null, {
    dispatch,
    queryParams,
    identifier: pipelineIdentifier,
    originalPipeline: state.originalPipeline,
    pipeline: state.pipeline
  })

  const updateGitDetails = _updateGitDetails.bind(null, {
    dispatch,
    queryParams,
    identifier: pipelineIdentifier,
    originalPipeline: state.originalPipeline,
    pipeline: state.pipeline
  })

  const updateEntityValidityDetails = _updateEntityValidityDetails.bind(null, {
    dispatch,
    queryParams,
    identifier: pipelineIdentifier,
    originalPipeline: state.originalPipeline,
    pipeline: state.pipeline,
    gitDetails: state.gitDetails
  })
  const updatePipeline = _updatePipeline.bind(null, {
    dispatch,
    queryParams,
    identifier: pipelineIdentifier,
    originalPipeline: state.originalPipeline,
    pipeline: state.pipeline,
    gitDetails: state.gitDetails
  })

  const [isEdit] = usePermission(
    {
      resourceScope: {
        accountIdentifier: queryParams.accountIdentifier,
        orgIdentifier: queryParams.orgIdentifier,
        projectIdentifier: queryParams.projectIdentifier
      },
      resource: {
        resourceType: ResourceType.PIPELINE,
        resourceIdentifier: pipelineIdentifier
      },
      permissions: [PermissionIdentifier.EDIT_PIPELINE],
      options: {
        skipCache: true,
        skipCondition: (permissionCheck: PermissionCheck) => {
          return permissionCheck.resourceIdentifier === '-1'
        }
      }
    },
    [queryParams.accountIdentifier, queryParams.orgIdentifier, queryParams.projectIdentifier, pipelineIdentifier]
  )
  const scope = getScopeFromDTO(queryParams)
  const isReadonly = !isEdit
  const deletePipelineCache = _deletePipelineCache.bind(null, queryParams, pipelineIdentifier)
  const pipelineSaved = React.useCallback(
    async (pipeline: PipelineInfoConfig) => {
      await deletePipelineCache(state.gitDetails)
      dispatch(PipelineContextActions.pipelineSavedAction({ pipeline, originalPipeline: cloneDeep(pipeline) }))
    },
    [deletePipelineCache, state.gitDetails]
  )
  const setYamlHandler = React.useCallback((yamlHandler: YamlBuilderHandlerBinding) => {
    dispatch(PipelineContextActions.setYamlHandler({ yamlHandler }))
  }, [])

  const updatePipelineView = React.useCallback((data: PipelineViewData) => {
    dispatch(PipelineContextActions.updatePipelineView({ pipelineView: data }))
  }, [])

  // stage/step selection
  const queryParamStateSelection = usePipelineQuestParamState()
  const setSelection = (selectedState: PipelineSelectionState) => {
    queryParamStateSelection.setPipelineQuestParamState(selectedState)
  }
  /** @deprecated use `setSelection` */
  const setSelectedStageId = (selectedStageId: string | undefined): void => {
    queryParamStateSelection.setPipelineQuestParamState({ stageId: selectedStageId })
  }
  /** @deprecated use `setSelection` */
  const setSelectedStepId = (selectedStepId: string | undefined): void => {
    queryParamStateSelection.setPipelineQuestParamState({ stepId: selectedStepId })
  }
  /** @deprecated use `setSelection` */
  const setSelectedSectionId = (selectedSectionId: string | undefined): void => {
    queryParamStateSelection.setPipelineQuestParamState({ sectionId: selectedSectionId })
  }

  const updateSelectionState = React.useCallback((data: SelectionState) => {
    dispatch(PipelineContextActions.updateSelectionState({ selectionState: data }))
  }, [])

  React.useEffect(() => {
    updateSelectionState({
      selectedStageId: queryParamStateSelection.stageId as string,
      selectedStepId: queryParamStateSelection.stepId as string,
      selectedSectionId: queryParamStateSelection.sectionId as string
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParamStateSelection.stepId, queryParamStateSelection.stageId, queryParamStateSelection.sectionId])

  React.useEffect(() => {
    const templateRefs = findAllByKey('templateRef', state.pipeline).filter(templateRef =>
      isEmpty(get(state.templateTypes, templateRef))
    )
    getTemplateTypesByRef(
      {
        ...queryParams,
        templateListType: 'Stable',
        repoIdentifier: state.gitDetails.repoIdentifier,
        branch: state.gitDetails.repoIdentifier,
        getDefaultFromOtherRepo: true
      },
      templateRefs
    ).then(resp => {
      setTemplateTypes(merge(state.templateTypes, resp))
    })
  }, [state.pipeline])

  const getStageFromPipeline = React.useCallback(
    <T extends StageElementConfig = StageElementConfig>(
      stageId: string,
      pipeline?: PipelineInfoConfig
    ): PipelineStageWrapper<T> => {
      const localPipeline = pipeline || state.pipeline
      return _getStageFromPipeline(stageId, localPipeline)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.pipeline, state.pipeline?.stages]
  )

  const getStagePathFromPipeline = React.useCallback(
    (stageId: string, prefix = '', pipeline?: PipelineInfoConfig) => {
      const localPipeline = pipeline || state.pipeline
      return _getStagePathFromPipeline(stageId, prefix, localPipeline)
    },
    [state.pipeline, state.pipeline?.stages]
  )

  const setTemplateTypes = React.useCallback(templateTypes => {
    dispatch(PipelineContextActions.setTemplateTypes({ templateTypes }))
  }, [])

  const setSchemaErrorView = React.useCallback(flag => {
    dispatch(PipelineContextActions.updateSchemaErrorsFlag({ schemaErrors: flag }))
  }, [])

  const updateStage = React.useCallback(
    async (newStage: StageElementConfig) => {
      function _updateStages(stages: StageElementWrapperConfig[]): StageElementWrapperConfig[] {
        return stages.map(node => {
          if (node.stage?.identifier === newStage.identifier) {
            return { stage: newStage }
          } else if (node.parallel) {
            return {
              parallel: _updateStages(node.parallel)
            }
          }

          return node
        })
      }

      return updatePipeline(originalPipeline => ({
        ...originalPipeline,
        stages: _updateStages(originalPipeline.stages || [])
      }))
    },
    [updatePipeline]
  )

  useGlobalEventListener('focus', () => {
    _softFetchPipeline(
      dispatch,
      queryParams,
      pipelineIdentifier,
      state.originalPipeline,
      state.pipeline,
      state.pipelineView,
      state.selectionState,
      state.gitDetails
    )
  })

  React.useEffect(() => {
    if (state.isDBInitialized) {
      abortControllerRef.current = new AbortController()
      fetchPipeline({ forceFetch: true, signal: abortControllerRef.current?.signal })

      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isDBInitialized])

  React.useEffect(() => {
    isMounted.current = true
    const time = SessionToken.getLastTokenSetTime()
    _initializeDb(dispatch, time || +new Date())

    return () => {
      isMounted.current = false
      cleanUpDBRefs()
    }
  }, [])

  return (
    <PipelineContext.Provider
      value={{
        state,
        view,
        contextType,
        allowableTypes,
        setView,
        runPipeline,
        stepsFactory,
        setSchemaErrorView,
        stagesMap,
        getStageFromPipeline,
        renderPipelineStage,
        fetchPipeline,
        updatePipelineStoreMetadata,
        updateGitDetails,
        updateEntityValidityDetails,
        updatePipeline,
        updateStage,
        updatePipelineView,
        pipelineSaved,
        deletePipelineCache,
        isReadonly,
        scope,
        setYamlHandler,
        setSelectedStageId,
        setSelectedStepId,
        setSelectedSectionId,
        setSelection,
        getStagePathFromPipeline,
        setTemplateTypes
      }}
    >
      {children}
    </PipelineContext.Provider>
  )
}

export function usePipelineContext(): PipelineContextInterface {
  // disabling this because this the definition of usePipelineContext
  // eslint-disable-next-line no-restricted-syntax
  return React.useContext(PipelineContext)
}
