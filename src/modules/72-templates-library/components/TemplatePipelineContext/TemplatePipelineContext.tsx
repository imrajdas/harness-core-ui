/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { cloneDeep, get, isEmpty, isEqual, noop } from 'lodash-es'
import { MultiTypeInputType, VisualYamlSelectedView as SelectedView } from '@wings-software/uicore'
import merge from 'lodash-es/merge'
import {
  findAllByKey,
  PipelineContext,
  PipelineContextType
} from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { getTemplateTypesByRef } from '@pipeline/utils/templateUtils'
import {
  initialState,
  PipelineContextActions,
  PipelineReducer,
  PipelineViewData
} from '@pipeline/components/PipelineStudio/PipelineContext/PipelineActions'
import { useLocalStorage } from '@common/hooks'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { stagesCollection } from '@pipeline/components/PipelineStudio/Stages/StagesCollection'
import { useStrings } from 'framework/strings'
import type { PipelineStageWrapper } from '@pipeline/utils/pipelineTypes'
import {
  getStageFromPipeline as _getStageFromPipeline,
  getStagePathFromPipeline as _getStagePathFromPipeline
} from '@pipeline/components/PipelineStudio/PipelineContext/helpers'
import type {
  PipelineInfoConfig,
  StageElementConfig,
  StageElementWrapperConfig,
  GetPipelineQueryParams
} from 'services/pipeline-ng'
import { PipelineStages, PipelineStagesProps } from '@pipeline/components/PipelineStages/PipelineStages'
import { StageType } from '@pipeline/utils/stageHelpers'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import type { PipelineSelectionState } from '@pipeline/components/PipelineStudio/PipelineQueryParamState/usePipelineQueryParam'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'

export interface TemplatePipelineProviderProps {
  queryParams: GetPipelineQueryParams
  initialValue: PipelineInfoConfig
  onUpdatePipeline: (pipeline: PipelineInfoConfig) => void
  contextType: PipelineContextType
  isReadOnly: boolean
}

export function TemplatePipelineProvider({
  queryParams,
  initialValue,
  onUpdatePipeline,
  isReadOnly,
  contextType,
  children
}: React.PropsWithChildren<TemplatePipelineProviderProps>): React.ReactElement {
  const allowableTypes = [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
  const { licenseInformation } = useLicenseStore()
  const isCDEnabled = useFeatureFlag(FeatureFlag.CDNG_ENABLED) && !!licenseInformation['CD']
  const isCIEnabled = useFeatureFlag(FeatureFlag.CING_ENABLED) && !!licenseInformation['CI']
  const isCFEnabled = useFeatureFlag(FeatureFlag.CFNG_ENABLED) && !!licenseInformation['CF']
  const isSTOEnabled = useFeatureFlag(FeatureFlag.SECURITY_STAGE)
  const isCustomStageEnabled = useFeatureFlag(FeatureFlag.NG_CUSTOM_STAGE)
  const { getString } = useStrings()
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

  const renderPipelineStage = (args: Omit<PipelineStagesProps, 'children'>) => {
    return (
      <PipelineStages {...args}>
        {stagesCollection.getStage(StageType.BUILD, isCIEnabled, getString)}
        {stagesCollection.getStage(StageType.DEPLOY, isCDEnabled, getString)}
        {stagesCollection.getStage(StageType.APPROVAL, true, getString)}
        {stagesCollection.getStage(StageType.FEATURE, isCFEnabled, getString)}
        {stagesCollection.getStage(StageType.SECURITY, isSTOEnabled, getString)}
        {stagesCollection.getStage(StageType.PIPELINE, false, getString)}
        {stagesCollection.getStage(StageType.CUSTOM, isCustomStageEnabled, getString)}
        {stagesCollection.getStage(StageType.Template, false, getString)}
      </PipelineStages>
    )
  }

  const updatePipeline = async (pipelineArg: PipelineInfoConfig | ((p: PipelineInfoConfig) => PipelineInfoConfig)) => {
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
    onUpdatePipeline?.(pipeline as PipelineInfoConfig)
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

  const updatePipelineView = React.useCallback((data: PipelineViewData) => {
    dispatch(PipelineContextActions.updatePipelineView({ pipelineView: data }))
  }, [])

  const fetchPipeline = async () => {
    const templateRefs = findAllByKey('templateRef', initialValue)
    dispatch(
      PipelineContextActions.success({
        error: '',
        pipeline: initialValue,
        originalPipeline: cloneDeep(initialValue),
        isBEPipelineUpdated: false,
        isUpdated: false
      })
    )
    if (templateRefs.length > 0) {
      dispatch(
        PipelineContextActions.setTemplateTypes({
          templateTypes: await getTemplateTypesByRef(
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
        })
      )
    }
    dispatch(PipelineContextActions.initialized())
  }

  const setSelection = (selectedState: PipelineSelectionState) => {
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

  const scope = getScopeFromDTO(queryParams)

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
      PipelineContextActions.setTemplateTypes({ templateTypes: merge(state.templateTypes, resp) })
    })
  }, [state.pipeline])

  React.useEffect(() => {
    fetchPipeline()
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
        renderPipelineStage,
        fetchPipeline: Promise.resolve,
        updateGitDetails: Promise.resolve,
        updatePipelineStoreMetadata: Promise.resolve,
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
