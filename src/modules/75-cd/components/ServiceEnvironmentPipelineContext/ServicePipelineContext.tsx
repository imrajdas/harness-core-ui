/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { cloneDeep, defaultTo, isEmpty, isEqual, merge, noop, set } from 'lodash-es'
import { MultiTypeInputType, VisualYamlSelectedView as SelectedView } from '@harness/uicore'
import produce from 'immer'
import {
  PipelineContext,
  PipelineContextType
} from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { yamlParse } from '@common/utils/YamlHelperMethods'
import {
  ActionReturnType,
  DefaultNewPipelineId,
  initialState,
  PipelineContextActions,
  PipelineReducer,
  PipelineViewData
} from '@pipeline/components/PipelineStudio/PipelineContext/PipelineActions'
import { useLocalStorage, useQueryParams } from '@common/hooks'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { stagesCollection } from '@pipeline/components/PipelineStudio/Stages/StagesCollection'
import { useStrings } from 'framework/strings'
import type { PipelineStageWrapper } from '@pipeline/utils/pipelineTypes'
import {
  getStageFromPipeline as _getStageFromPipeline,
  getStagePathFromPipeline as _getStagePathFromPipeline
} from '@pipeline/components/PipelineStudio/PipelineContext/helpers'
import { getServiceV2Promise, GetServiceV2QueryParams, NGServiceConfig, ServiceResponseDTO } from 'services/cd-ng'
import type { PipelineSelectionState } from '@pipeline/components/PipelineStudio/PipelineQueryParamState/usePipelineQueryParam'
import type {
  GetPipelineQueryParams,
  StageElementConfig,
  PipelineInfoConfig,
  StageElementWrapperConfig
} from 'services/pipeline-ng'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import {
  initialServiceState,
  DefaultNewStageName,
  DefaultNewStageId,
  ServicePipelineConfig
} from '../Services/utils/ServiceUtils'

interface FetchServiceBoundProps {
  dispatch: React.Dispatch<ActionReturnType>
  queryParams: GetServiceV2QueryParams
  serviceIdentifier: string
}

interface FetchServiceUnboundProps {
  forceFetch?: boolean
  forceUpdate?: boolean
  signal?: AbortSignal
}

export interface ServicePipelineProviderProps {
  queryParams: GetPipelineQueryParams
  initialValue: PipelineInfoConfig
  onUpdatePipeline: (pipeline: ServicePipelineConfig) => void
  contextType: PipelineContextType
  isReadOnly: boolean
  serviceIdentifier: string
}
const getServiceByIdentifier = (
  queryParams: GetServiceV2QueryParams,
  identifier: string,
  signal?: AbortSignal
): Promise<ServiceResponseDTO> => {
  return getServiceV2Promise(
    {
      queryParams,
      serviceIdentifier: identifier
    },
    signal
  )
    .then(response => {
      if (response.status === 'SUCCESS' && response.data?.service) {
        return response.data?.service
      }
      throw new Error()
    })
    .catch(error => {
      throw new Error(error)
    })
}

export function ServicePipelineProvider({
  queryParams,
  initialValue,
  serviceIdentifier,
  onUpdatePipeline,
  isReadOnly,
  contextType,
  children
}: React.PropsWithChildren<ServicePipelineProviderProps>): React.ReactElement {
  const allowableTypes = [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]

  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const { getString } = useStrings()
  const scope = getScopeFromDTO(queryParams)
  const [state, dispatch] = React.useReducer(PipelineReducer, initialState)
  const [view, setView] = useLocalStorage<SelectedView>('pipeline_studio_view', SelectedView.VISUAL)
  const setSchemaErrorView = React.useCallback(flag => {
    dispatch(PipelineContextActions.updateSchemaErrorsFlag({ schemaErrors: flag }))
  }, [])
  const getStageFromPipeline = React.useCallback(
    <T extends StageElementConfig = StageElementConfig>(
      stageId: string,
      pipeline?: PipelineInfoConfig
    ): PipelineStageWrapper<T> => {
      return _getStageFromPipeline(stageId, pipeline || state.pipeline)
    },
    [state.pipeline, state.pipeline?.stages]
  )

  const updatePipeline = async (
    pipelineArg: PipelineInfoConfig | ((p: PipelineInfoConfig) => PipelineInfoConfig)
  ): Promise<void> => {
    let pipeline = pipelineArg
    if (typeof pipelineArg === 'function') {
      if (state.pipeline) {
        pipeline = pipelineArg(state.pipeline)
      } else {
        pipeline = {} as PipelineInfoConfig
      }
    }
    const isUpdated = !isEqual(state.originalPipeline, pipeline)
    await dispatch(PipelineContextActions.success({ error: '', pipeline: pipeline as PipelineInfoConfig, isUpdated }))

    if (view === SelectedView.VISUAL) {
      onUpdatePipeline?.(pipeline as ServicePipelineConfig)
    }
  }

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

  const _fetchService = async (props: FetchServiceBoundProps, params: FetchServiceUnboundProps): Promise<void> => {
    const { serviceIdentifier: identifier } = props
    const { forceFetch = false, forceUpdate = false, signal } = params

    dispatch(PipelineContextActions.fetching())
    if (forceFetch && forceUpdate) {
      const serviceDetails: ServiceResponseDTO = await getServiceByIdentifier(
        { ...queryParams, ...(repoIdentifier && branch ? { repoIdentifier, branch } : {}) },
        identifier,
        signal
      )
      const serviceYaml = yamlParse<NGServiceConfig>(defaultTo(serviceDetails.yaml, ''))
      const serviceData = merge(serviceYaml, initialServiceState)

      const defaultPipeline = {
        identifier: defaultTo(serviceDetails.identifier, DefaultNewPipelineId),
        name: serviceDetails.name as string,
        description: serviceData.service.description,
        tags: serviceData.service.tags,
        gitOpsEnabled: defaultTo(serviceData.service.gitOpsEnabled, false)
      }
      const refetchedPipeline = produce({ ...defaultPipeline }, draft => {
        if (!isEmpty(serviceData.service.serviceDefinition)) {
          set(draft, 'stages[0].stage.name', DefaultNewStageName)
          set(draft, 'stages[0].stage.identifier', DefaultNewStageId)
          set(
            draft,
            'stages[0].stage.spec.serviceConfig.serviceDefinition',
            cloneDeep(serviceData.service.serviceDefinition)
          )
          set(draft, 'stages[0].stage.spec.serviceConfig.serviceRef', serviceDetails.identifier)
        }
      })

      dispatch(
        PipelineContextActions.success({
          error: '',
          pipeline: refetchedPipeline,
          originalPipeline: cloneDeep(refetchedPipeline),
          isBEPipelineUpdated: false,
          isUpdated: false
        })
      )
      dispatch(PipelineContextActions.initialized())
      onUpdatePipeline?.(refetchedPipeline as ServicePipelineConfig)
    }
  }

  const fetchPipeline = _fetchService.bind(null, {
    dispatch,
    queryParams,
    serviceIdentifier
  })

  const updatePipelineView = React.useCallback((data: PipelineViewData) => {
    dispatch(PipelineContextActions.updatePipelineView({ pipelineView: data }))
  }, [])

  const fetchCurrentPipeline = async (): Promise<void> => {
    dispatch(
      PipelineContextActions.success({
        error: '',
        pipeline: initialValue,
        originalPipeline: cloneDeep(initialValue),
        isBEPipelineUpdated: false,
        isUpdated: false
      })
    )
    dispatch(PipelineContextActions.initialized())
  }

  const setSelection = (selectedState: PipelineSelectionState): void => {
    dispatch(
      PipelineContextActions.updateSelectionState({
        selectionState: {
          selectedStageId: selectedState.stageId as string,
          selectedStepId: selectedState.stepId as string,
          selectedSectionId: selectedState.sectionId as string
        }
      })
    )
  }

  const getStagePathFromPipeline = React.useCallback(
    (stageId: string, prefix = '', pipeline?: PipelineInfoConfig) => {
      const localPipeline = pipeline || state.pipeline
      return _getStagePathFromPipeline(stageId, prefix, localPipeline)
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.pipeline, state.pipeline?.stages]
  )

  React.useEffect(() => {
    fetchCurrentPipeline()
    setSelection({ stageId: initialValue.stages?.[0]?.stage?.identifier })
  }, [initialValue])

  return (
    <PipelineContext.Provider
      value={{
        state,
        view,
        contextType,
        allowableTypes,
        setView,
        scope,
        runPipeline: noop,
        stepsFactory: factory,
        setSchemaErrorView,
        stagesMap: stagesCollection.getAllStagesAttributes(getString),
        getStageFromPipeline,
        // eslint-disable-next-line react/display-name
        renderPipelineStage: () => <div />,
        fetchPipeline,
        updatePipelineStoreMetadata: Promise.resolve,
        updateGitDetails: Promise.resolve,
        updateEntityValidityDetails: Promise.resolve,
        updatePipeline,
        updateStage,
        updatePipelineView,
        pipelineSaved: noop,
        deletePipelineCache: Promise.resolve,
        isReadonly: isReadOnly,
        setYamlHandler: noop,
        setSelectedStageId: noop,
        setSelectedStepId: noop,
        setSelectedSectionId: noop,
        setSelection,
        getStagePathFromPipeline,
        setTemplateTypes: noop
      }}
    >
      {children}
    </PipelineContext.Provider>
  )
}
