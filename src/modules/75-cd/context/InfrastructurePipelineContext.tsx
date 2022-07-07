/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { cloneDeep, isEqual, noop } from 'lodash-es'
import { MultiTypeInputType, VisualYamlSelectedView as SelectedView } from '@wings-software/uicore'
import {
  PipelineContext,
  PipelineContextType
} from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
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
import type { PipelineStagesProps } from '@pipeline/components/PipelineStages/PipelineStages'
import type { PipelineSelectionState } from '@pipeline/components/PipelineStudio/PipelineQueryParamState/usePipelineQueryParam'
import type {
  GetPipelineQueryParams,
  PipelineInfoConfig,
  StageElementConfig,
  StageElementWrapperConfig
} from 'services/pipeline-ng'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'

export interface InfrastructurePipelineProviderProps {
  queryParams: GetPipelineQueryParams
  initialValue: PipelineInfoConfig
  isReadOnly: boolean
}

export function InfrastructurePipelineProvider({
  queryParams,
  initialValue,
  isReadOnly,
  children
}: React.PropsWithChildren<InfrastructurePipelineProviderProps>): React.ReactElement {
  const allowableTypes = [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
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
    return <div>{args}</div>
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

  const initalizePipeline = async () => {
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
    initalizePipeline()
  }, [initialValue])

  return (
    <PipelineContext.Provider
      value={{
        state,
        view,
        contextType: PipelineContextType.Standalone,
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
