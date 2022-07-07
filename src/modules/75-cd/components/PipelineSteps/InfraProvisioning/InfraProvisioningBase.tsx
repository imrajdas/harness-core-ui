/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useRef } from 'react'
import { Spinner } from '@blueprintjs/core'
import { Field, FormikContextType, FormikProps } from 'formik'
import { Container, Formik, FormikForm, FormInput } from '@wings-software/uicore'
import { cloneDeep, defaultTo, get, isEmpty, set } from 'lodash-es'
import { useParams } from 'react-router-dom'
import type { StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { useStrings } from 'framework/strings'
import { DrawerTypes } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineActions'
import { AdvancedPanels } from '@pipeline/components/PipelineStudio/StepCommands/StepCommandTypes'
import ExecutionGraph, {
  ExecutionGraphAddStepEvent,
  ExecutionGraphEditStepEvent,
  ExecutionGraphRefObj
} from '@pipeline/components/PipelineStudio/ExecutionGraph/ExecutionGraph'
import {
  getInitialValuesInCorrectFormat,
  getFormValuesInCorrectFormat
} from '@pipeline/components/PipelineSteps/Steps/StepsTransformValuesUtils'
import { addStepOrGroup } from '@pipeline/components/PipelineStudio/ExecutionGraph/ExecutionGraphUtil'
import { StepCategory, useGetStepsV2 } from 'services/pipeline-ng'
import { createStepNodeFromTemplate } from '@pipeline/utils/templateUtils'
import { useMutateAsGet } from '@common/hooks'
import { getStepPaletteModuleInfosFromStage } from '@pipeline/utils/stepUtils'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { getFlattenedStages } from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilderUtil'
import { FeatureFlag } from '@common/featureFlags'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { useTemplateSelector } from 'framework/Templates/TemplateSelectorContext/useTemplateSelector'
import useChooseProvisioner from './ChooseProvisioner'
import type { InfraProvisioningData, InfraProvisioningDataUI, InfraProvisioningProps } from './InfraProvisioning'
import { transformValuesFieldsConfig } from './InfraProvisioningFunctionConfigs'
import css from './InfraProvisioning.module.scss'

export const InfraProvisioningBase = (
  { initialValues, onUpdate, onChange }: InfraProvisioningProps,
  _formikRef: StepFormikFowardRef<InfraProvisioningData>
): JSX.Element => {
  const {
    stepsFactory,
    state: {
      pipelineView,
      selectionState: { selectedStageId = '' },
      templateTypes,
      pipeline
    },
    updateStage,
    updatePipelineView,
    isReadonly,
    getStageFromPipeline,
    getStagePathFromPipeline
  } = usePipelineContext()
  const { getTemplate } = useTemplateSelector()
  const { getString } = useStrings()
  const { stage: selectedStage } = getStageFromPipeline(defaultTo(selectedStageId, ''))
  const stagePath = getStagePathFromPipeline(selectedStageId || '', 'pipeline.stages')
  const [allChildTypes, setAllChildTypes] = React.useState<string[]>([])
  const executionRef = React.useRef<ExecutionGraphRefObj | null>(null)
  const { accountId } = useParams<ProjectPathProps>()
  const formikRef = useRef<FormikContextType<InfraProvisioningDataUI>>()

  const newPipelineStudioEnabled: boolean = useFeatureFlag(FeatureFlag.NEW_PIPELINE_STUDIO)
  const { showModal } = useChooseProvisioner({
    onSubmit: (data: any) => {
      onUpdate?.(data)
      //  setTypeEnabled(true)
    },
    onClose: () => {
      formikRef.current?.resetForm()
    }
  })

  const {
    data: stepsData,
    loading: stepsDataLoading,
    refetch: getStepTypes
  } = useMutateAsGet(useGetStepsV2, {
    queryParams: { accountId },
    body: {
      stepPalleteModuleInfos: getStepPaletteModuleInfosFromStage(
        selectedStage?.stage?.type,
        undefined,
        'Provisioner',
        getFlattenedStages(pipeline).stages
      )
    },
    lazy: true
  })

  useEffect(() => {
    if (isEmpty(allChildTypes) && initialValues.provisionerEnabled) {
      getStepTypes()
    }
  }, [initialValues.provisionerEnabled])

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
      const { template, isCopied } = await getTemplate({
        templateType: 'Step',
        allChildTypes
      })
      const newStepData = { step: createStepNodeFromTemplate(template, isCopied) }
      const { stage: pipelineStage } = cloneDeep(getStageFromPipeline(selectedStageId || ''))
      executionRef.current?.stepGroupUpdated?.(newStepData.step)
      if (pipelineStage && !get(pipelineStage?.stage, 'spec.infrastructure.infrastructureDefinition.provisioner')) {
        set(pipelineStage, 'stage.spec.infrastructure.infrastructureDefinition.provisioner', {
          steps: [],
          rollbackSteps: []
        })
      }
      const provisioner = get(pipelineStage?.stage, 'spec.infrastructure.infrastructureDefinition.provisioner')
      // set empty arrays
      if (!event.isRollback && !provisioner.steps) {
        provisioner.steps = []
      }
      if (event.isRollback && !provisioner.rollbackSteps) {
        provisioner.rollbackSteps = []
      }

      addStepOrGroup(
        event.entity,
        provisioner,
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
          type: DrawerTypes.ProvisionerStepConfig,
          data: {
            stepConfig: {
              node: newStepData.step,
              stepsMap: event.stepsMap,
              onUpdate: executionRef.current?.stepGroupUpdated,
              isStepGroup: false,
              addOrEdit: 'edit',
              hiddenAdvancedPanels: [AdvancedPanels.PreRequisites]
            }
          }
        }
      })
    } catch (_) {
      // Do nothing
    }
  }

  const isProvisionerDisabled = (provisionerSnippetLoading: boolean): boolean => {
    return isReadonly || provisionerSnippetLoading || stepsDataLoading
  }

  return (
    <Formik
      enableReinitialize={true}
      initialValues={getInitialValuesInCorrectFormat<InfraProvisioningData, InfraProvisioningDataUI>(
        initialValues,
        transformValuesFieldsConfig
      )}
      formName="infraProvisionerBase"
      validate={(_values: InfraProvisioningDataUI) => {
        const schemaValues = getFormValuesInCorrectFormat<InfraProvisioningDataUI, InfraProvisioningData>(
          _values,
          transformValuesFieldsConfig
        )
        onChange?.(schemaValues)
      }}
      onSubmit={(_values: InfraProvisioningDataUI) => {
        const schemaValues = getFormValuesInCorrectFormat<InfraProvisioningDataUI, InfraProvisioningData>(
          _values,
          transformValuesFieldsConfig
        )
        onUpdate?.(schemaValues)
      }}
    >
      {(formik: FormikProps<InfraProvisioningDataUI>) => {
        formikRef.current = formik
        return (
          <FormikForm className={css.provisionerForm}>
            <FormInput.CheckBox
              name={`provisionerEnabled`}
              disabled={isProvisionerDisabled(formik.values.provisionerSnippetLoading as boolean)}
              label={getString('pipelineSteps.deploy.provisioner.enableProvisionerLabel')}
              onChange={(event: React.FormEvent<HTMLInputElement>) => {
                if (!event.currentTarget.checked) {
                  formik.values.provisioner.stage.spec.execution = { steps: [], rollbackSteps: [] }
                  formik.setFieldValue('provisioner', formik.values.provisioner)
                  onUpdate?.({
                    provisioner: formik.values.provisioner.stage.spec.execution,
                    provisionerEnabled: event.currentTarget.checked
                  })
                } else {
                  showModal({
                    provisioner: formik.values.provisioner.stage.spec.execution,
                    provisionerEnabled: true
                  })
                }
              }}
            />
            {formik.values.provisionerSnippetLoading || stepsDataLoading ? (
              <Container>
                <Spinner />
              </Container>
            ) : formik.values.provisionerEnabled ? (
              <div className={css.graphContainer}>
                <Field name="provisioner">
                  {(_props: any) => {
                    return (
                      <ExecutionGraph
                        gridStyle={{ startX: 50, startY: 80 }}
                        rollBackPropsStyle={{ top: '10px' }}
                        rollBackBannerStyle={{ top: '10px', backgroundColor: 'rgba(0,0,0,0)' }}
                        canvasButtonsLayout={'horizontal'}
                        canvasButtonsTooltipPosition={'top'}
                        allowAddGroup={true}
                        isReadonly={isReadonly}
                        hasRollback={true}
                        hasDependencies={false}
                        stepsFactory={stepsFactory}
                        templateTypes={templateTypes}
                        stage={formik.values.provisioner as any}
                        originalStage={formik.values.originalProvisioner as any}
                        ref={executionRef}
                        updateStage={stageData => {
                          formik.setFieldValue('provisioner', stageData)
                          onUpdate?.({
                            provisioner: stageData.stage?.spec?.execution || ({} as any),
                            provisionerEnabled: formik.values.provisionerEnabled
                          })
                        }}
                        // Check and update the correct stage path here
                        pathToStage={`${stagePath}.stage.spec.execution`}
                        onAddStep={(event: ExecutionGraphAddStepEvent) => {
                          if (event.isTemplate) {
                            addTemplate(event)
                          } else {
                            updatePipelineView({
                              ...pipelineView,
                              isDrawerOpened: true,
                              drawerData: {
                                type: DrawerTypes.AddProvisionerStep,
                                data: {
                                  paletteData: {
                                    entity: event.entity,
                                    stepsMap: event.stepsMap,
                                    onUpdate: executionRef.current?.stepGroupUpdated,
                                    isRollback: event.isRollback,
                                    isParallelNodeClicked: event.isParallel,
                                    hiddenAdvancedPanels: [AdvancedPanels.PreRequisites]
                                  }
                                }
                              }
                            })
                          }
                          formik.submitForm()
                        }}
                        onEditStep={(event: ExecutionGraphEditStepEvent) => {
                          updatePipelineView({
                            ...pipelineView,
                            isDrawerOpened: true,
                            drawerData: {
                              type: DrawerTypes.ProvisionerStepConfig,
                              data: {
                                stepConfig: {
                                  node: event.node as any,
                                  stepsMap: event.stepsMap,
                                  onUpdate: executionRef.current?.stepGroupUpdated,
                                  isStepGroup: event.isStepGroup,
                                  isUnderStepGroup: event.isUnderStepGroup,
                                  addOrEdit: event.addOrEdit,
                                  hiddenAdvancedPanels: [AdvancedPanels.PreRequisites]
                                }
                              }
                            }
                          })
                        }}
                      />
                    )
                  }}
                </Field>
              </div>
            ) : null}
          </FormikForm>
        )
      }}
    </Formik>
  )
}

export const InfraProvisioningBaseWithRef = React.forwardRef(InfraProvisioningBase)
