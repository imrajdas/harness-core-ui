/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { forwardRef } from 'react'
import * as Yup from 'yup'
import { isEmpty } from 'lodash-es'
import { IconName, getMultiTypeFromValue, MultiTypeInputType } from '@harness/uicore'
import { yupToFormErrors, FormikErrors } from 'formik'
import { StepViewType, StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import type { StringsMap } from 'stringTypes'
import type {
  AzureSlotDeploymentStepInfo,
  AzureSlotDeploymentData,
  AzureSlotDeploymentVariableStepProps
} from './AzureSlotDeploymentInterface.types'
import { AzureSlotDeploymentRef } from './AzureSlotDeploymentRef'
import { AzureSlotDeploymentVariableStep } from './AzureSlotDeploymentVariableView'
import AzureSlotDeploymentInputSet from './AzureSlotDeploymentInputSet'
const AzureSlotDeploymentStackWithRef = forwardRef(AzureSlotDeploymentRef)

export class AzureSlotDeployment extends PipelineStep<AzureSlotDeploymentStepInfo> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }

  protected type = StepType.AzureSlotDeployment
  protected stepIcon: IconName = 'slot-deployment'
  protected stepName = 'Azure Web Apps Rollback'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.AzureSlotDeployment'
  protected stepIconSize = 25

  protected defaultValues = {
    type: StepType.AzureSlotDeployment,
    name: '',
    identifier: '',
    timeout: '10m'
  }

  /* istanbul ignore next */
  validateInputSet({ data, template, getString, viewType }: ValidateInputSetProps<any>): FormikErrors<any> {
    const errors = {} as any
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    if (getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME) {
      let timeoutSchema = getDurationValidationSchema({ minimum: '10s' })
      if (isRequired) {
        timeoutSchema = timeoutSchema.required(getString?.('validation.timeout10SecMinimum'))
      }
      const timeout = Yup.object().shape({
        timeout: timeoutSchema
      })
      try {
        timeout.validateSync(data)
      } catch (e) {
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    }
    if (isEmpty(errors.spec)) {
      delete errors.spec
    }
    return errors
  }

  processFormData(data: AzureSlotDeploymentData): AzureSlotDeploymentData {
    return data
  }

  private getInitialValues(data: AzureSlotDeploymentData): AzureSlotDeploymentData {
    return data
  }

  renderStep(props: StepProps<any, unknown>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      onChange,
      allowableTypes,
      stepViewType,
      formikRef,
      isNewStep,
      readonly,
      inputSetData,
      path,
      customStepProps
    } = props

    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <AzureSlotDeploymentInputSet
          initialValues={initialValues}
          allowableTypes={allowableTypes}
          allValues={inputSetData?.allValues}
          stepViewType={stepViewType}
          readonly={inputSetData?.readonly}
          inputSetData={inputSetData}
          path={path}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <AzureSlotDeploymentVariableStep
          {...(customStepProps as AzureSlotDeploymentVariableStepProps)}
          initialValues={initialValues}
        />
      )
    }

    return (
      <AzureSlotDeploymentStackWithRef
        initialValues={this.getInitialValues(initialValues)}
        onUpdate={data => onUpdate?.(this.processFormData(data))}
        onChange={data => onChange?.(this.processFormData(data))}
        allowableTypes={allowableTypes}
        isNewStep={isNewStep}
        ref={formikRef}
        readonly={readonly}
      />
    )
  }
}
