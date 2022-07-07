/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { cloneDeep, isNil, set } from 'lodash-es'
import React from 'react'
import { useParams } from 'react-router-dom'
import type {
  ExecutionGraphAddStepEvent,
  ExecutionGraphRefObj
} from '@pipeline/components/PipelineStudio/ExecutionGraph/ExecutionGraph'
import { DrawerTypes } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineActions'
import { addStepOrGroup } from '@pipeline/components/PipelineStudio/ExecutionGraph/ExecutionGraphUtil'
import { StepCategory, useGetStepsV2 } from 'services/pipeline-ng'
import { createStepNodeFromTemplate } from '@pipeline/utils/templateUtils'
import { AdvancedPanels } from '@pipeline/components/PipelineStudio/StepCommands/StepCommandTypes'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { useMutateAsGet } from '@common/hooks'
import { getStepPaletteModuleInfosFromStage } from '@pipeline/utils/stepUtils'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { FeatureFlag } from '@common/featureFlags'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { useTemplateSelector } from 'framework/Templates/TemplateSelectorContext/useTemplateSelector'

interface AddStepTemplateReturnType {
  addTemplate: (event: ExecutionGraphAddStepEvent) => Promise<void>
}

interface AddStepTemplate {
  executionRef: ExecutionGraphRefObj | null
}

export function useAddStepTemplate(props: AddStepTemplate): AddStepTemplateReturnType {
  const { executionRef } = props
  const { accountId } = useParams<ProjectPathProps>()
  const newPipelineStudioEnabled: boolean = useFeatureFlag(FeatureFlag.NEW_PIPELINE_STUDIO)
  const pipelineContext = usePipelineContext()
  const {
    state: {
      pipelineView,
      selectionState: { selectedStageId = '' }
    },
    updateStage,
    getStageFromPipeline,
    updatePipelineView
  } = pipelineContext
  const { getTemplate } = useTemplateSelector()
  const { stage: selectedStage } = getStageFromPipeline(selectedStageId)
  const [allChildTypes, setAllChildTypes] = React.useState<string[]>([])

  const { data: stepsData } = useMutateAsGet(useGetStepsV2, {
    queryParams: { accountId },
    body: {
      stepPalleteModuleInfos: getStepPaletteModuleInfosFromStage(selectedStage?.stage?.type, selectedStage?.stage)
    }
  })

  const getStepTypesFromCategories = (stepCategories: StepCategory[]): string[] => {
    const validStepTypes: string[] = []
    stepCategories.forEach(category => {
      if (category.stepCategories?.length) {
        validStepTypes.push(...getStepTypesFromCategories(category.stepCategories))
      } else if (category.stepsData?.length) {
        category.stepsData.forEach(stepData => {
          if (stepData.type) {
            validStepTypes.push(stepData.type)
          }
        })
      }
    })
    return validStepTypes
  }

  React.useEffect(() => {
    if (stepsData?.data?.stepCategories) {
      setAllChildTypes(getStepTypesFromCategories(stepsData.data.stepCategories))
    }
  }, [stepsData?.data?.stepCategories])

  const addTemplate = async (event: ExecutionGraphAddStepEvent) => {
    try {
      const { template, isCopied } = await getTemplate({ templateType: 'Step', allChildTypes })
      const newStepData = { step: createStepNodeFromTemplate(template, isCopied) }
      const { stage: pipelineStage } = cloneDeep(getStageFromPipeline(selectedStageId))
      if (pipelineStage && !pipelineStage.stage?.spec) {
        set(pipelineStage, 'stage.spec', {})
      }
      if (pipelineStage && isNil(pipelineStage.stage?.spec?.execution)) {
        if (event.isRollback) {
          set(pipelineStage, 'stage.spec.execution', { rollbackSteps: [] })
        } else {
          set(pipelineStage, 'stage.spec.execution', { steps: [] })
        }
      }
      executionRef?.stepGroupUpdated?.(newStepData.step)
      addStepOrGroup(
        event.entity,
        pipelineStage?.stage?.spec?.execution as any,
        newStepData,
        event.isParallel,
        event.isRollback,
        newPipelineStudioEnabled
      )
      if (pipelineStage?.stage) {
        await updateStage(pipelineStage?.stage)
      }
      updatePipelineView({
        ...pipelineView,
        isDrawerOpened: true,
        drawerData: {
          type: DrawerTypes.StepConfig,
          data: {
            stepConfig: {
              node: newStepData.step,
              stepsMap: event.stepsMap,
              onUpdate: executionRef?.stepGroupUpdated,
              isStepGroup: false,
              addOrEdit: 'edit',
              hiddenAdvancedPanels: [AdvancedPanels.PreRequisites]
            }
          }
        }
      })
    } catch (_) {
      // Do nothing.. user cancelled template selection
    }
  }

  return { addTemplate }
}
