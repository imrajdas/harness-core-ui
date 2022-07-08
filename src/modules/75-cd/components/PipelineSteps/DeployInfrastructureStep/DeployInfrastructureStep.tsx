/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { FormikErrors } from 'formik'
import { get, isEmpty, set } from 'lodash-es'

import { getMultiTypeFromValue, IconName, MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@harness/uicore'
import type { UseStringsReturn } from 'framework/strings'

import { Step, StepProps, StepViewType, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { AllNGVariables } from '@pipeline/utils/types'

import type { DeployStageConfig } from '@pipeline/utils/DeployStageInterface'
import { DeployInfrastructureWidget } from './DeployInfrastructureWidget'
import DeployInfrastructureInputStep from './DeployInfrastructureInputStep'
import {
  processNonGitOpsInitialValues,
  processGitOpsEnvGroupInitialValues,
  processGitOpsEnvironmentInitialValues,
  processNonGitOpsFormValues,
  processGitOpsEnvironmentFormValues,
  processGitOpsEnvGroupFormValues
} from './utils'

export class DeployInfrastructureStep extends Step<DeployStageConfig> {
  lastFetched: number

  protected stepPaletteVisible = false
  protected type = StepType.DeployInfrastructure
  protected stepName = 'Deploy Infrastructure'
  protected stepIcon: IconName = 'main-environments'

  protected defaultValues: DeployStageConfig = {} as DeployStageConfig

  constructor() {
    super()
    this.lastFetched = new Date().getTime()
  }

  private processInitialValues(
    initialValues: DeployStageConfig,
    getString: UseStringsReturn['getString']
  ): DeployStageConfig {
    const gitOpsEnabled = initialValues.gitOpsEnabled
    const isEnvGroup = Boolean(initialValues.environmentGroup)
    return {
      gitOpsEnabled,
      ...(!gitOpsEnabled && processNonGitOpsInitialValues(initialValues)),
      ...(gitOpsEnabled && {
        ...(!isEnvGroup && processGitOpsEnvironmentInitialValues(initialValues, getString)),
        ...(isEnvGroup && processGitOpsEnvGroupInitialValues(initialValues, getString))
      })
    }
  }

  private processFormData(data: DeployStageConfig, getString: UseStringsReturn['getString']): any {
    const gitOpsEnabled = data.gitOpsEnabled
    const isEnvGroup = data.isEnvGroup

    return {
      ...(gitOpsEnabled === false && processNonGitOpsFormValues(data)),
      ...(gitOpsEnabled === true && {
        ...(data.environmentOrEnvGroupRef === RUNTIME_INPUT_VALUE
          ? {
              ...(data.environmentOrEnvGroupAsRuntime === 'Environment' &&
                processGitOpsEnvironmentFormValues(data, getString)),
              ...(data.environmentOrEnvGroupAsRuntime === 'Environment Group' &&
                processGitOpsEnvGroupFormValues(data, getString))
            }
          : {
              ...(!isEnvGroup && processGitOpsEnvironmentFormValues(data, getString)),
              ...(isEnvGroup && processGitOpsEnvGroupFormValues(data, getString))
            })
      })
    }
  }

  renderStep(props: StepProps<DeployStageConfig>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      stepViewType,
      inputSetData,
      readonly = false,
      allowableTypes,
      customStepProps
    } = props

    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <DeployInfrastructureInputStep
          initialValues={initialValues}
          readonly={readonly}
          onUpdate={data => onUpdate?.(this.processFormData(data, (customStepProps as any).getString))}
          stepViewType={stepViewType}
          allowableTypes={allowableTypes}
          inputSetData={inputSetData}
          gitOpsEnabled={(customStepProps as any).gitOpsEnabled}
        />
      )
    }

    return (
      <DeployInfrastructureWidget
        initialValues={this.processInitialValues(initialValues, (customStepProps as any).getString)}
        readonly={readonly}
        onUpdate={data => onUpdate?.(this.processFormData(data, (customStepProps as any).getString))}
        stepViewType={stepViewType}
        allowableTypes={allowableTypes}
        serviceRef={(customStepProps as any).serviceRef}
      />
    )
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<DeployStageConfig>): FormikErrors<DeployStageConfig> {
    const errors: FormikErrors<DeployStageConfig> = {}
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm

    data?.environment?.serviceOverrideInputs?.variables?.forEach((variable: AllNGVariables, index: number) => {
      const currentVariableTemplate = get(template, `environment.serviceOverrideInputs.variables[${index}].value`, '')

      if (
        isRequired &&
        ((isEmpty(variable.value) && variable.type !== 'Number') ||
          (variable.type === 'Number' && (typeof variable.value !== 'number' || isNaN(variable.value)))) &&
        getMultiTypeFromValue(currentVariableTemplate) === MultiTypeInputType.RUNTIME
      ) {
        set(
          errors,
          `serviceOverrideInputs.variables.[${index}].value`,
          getString?.('fieldRequired', { field: variable.name })
        )
      }
    })

    if (!(errors as any)?.serviceOverrideInputs?.variables?.length) {
      delete (errors as any)?.serviceOverrideInputs
    }

    data?.environment?.environmentInputs?.variables?.forEach((variable: AllNGVariables, index: number) => {
      const currentVariableTemplate = get(template, `environment.environmentInputs.variables[${index}].value`, '')

      if (
        isRequired &&
        ((isEmpty(variable.value) && variable.type !== 'Number') ||
          (variable.type === 'Number' && (typeof variable.value !== 'number' || isNaN(variable.value)))) &&
        getMultiTypeFromValue(currentVariableTemplate) === MultiTypeInputType.RUNTIME
      ) {
        set(
          errors,
          `environmentInputs.variables.[${index}].value`,
          getString?.('fieldRequired', { field: variable.name })
        )
      }
    })

    if (!(errors as any)?.environmentInputs?.variables?.length) {
      delete (errors as any)?.environmentInputs
    }

    return errors
  }
}
