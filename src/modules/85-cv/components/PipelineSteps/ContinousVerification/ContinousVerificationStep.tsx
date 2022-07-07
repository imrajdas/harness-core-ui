/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { IconName } from '@wings-software/uicore'
import { connect, FormikErrors } from 'formik'
import { omit } from 'lodash-es'
import { StepViewType, StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'

import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'

import type { StringsMap } from 'stringTypes'
import type { ContinousVerificationData, ContinousVerificationVariableStepProps, spec } from './types'
import { ContinousVerificationWidgetWithRef } from './components/ContinousVerificationWidget/ContinousVerificationWidget'
import { ContinousVerificationInputSetStep } from './components/ContinousVerificationInputSetStep/ContinousVerificationInputSetStep'
import { ContinousVerificationVariableStep } from './components/ContinousVerificationVariableStep/ContinousVerificationVariableStep'
import {
  getMonitoredServiceYamlData,
  getSpecFormData,
  getSpecYamlData,
  validateField,
  validateMonitoredService,
  validateMonitoredServiceTemplateInputs,
  validateTimeout
} from './utils'
import { cvDefaultValues } from './constants'

const ContinousVerificationInputSetStepFormik = connect(ContinousVerificationInputSetStep)
export class ContinousVerificationStep extends PipelineStep<ContinousVerificationData> {
  constructor() {
    super()
    this._hasStepVariables = true
  }

  protected type = StepType.Verify
  protected stepName = 'Verify'
  protected stepIcon: IconName = 'cv-main'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.Verify'
  protected isHarnessSpecific = true
  protected defaultValues: ContinousVerificationData = cvDefaultValues

  renderStep(props: StepProps<ContinousVerificationData>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      stepViewType,
      inputSetData,
      formikRef,
      customStepProps,
      isNewStep,
      allowableTypes,
      onChange
    } = props

    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <ContinousVerificationInputSetStepFormik
          initialValues={initialValues}
          onUpdate={onUpdate}
          stepViewType={stepViewType}
          readonly={!!inputSetData?.readonly}
          template={inputSetData?.template}
          path={inputSetData?.path || ''}
          allowableTypes={allowableTypes}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <ContinousVerificationVariableStep
          {...(customStepProps as ContinousVerificationVariableStepProps)}
          originalData={initialValues}
        />
      )
    }
    return (
      <ContinousVerificationWidgetWithRef
        initialValues={this.getInitialValues(initialValues)}
        onUpdate={data => onUpdate?.(this.processFormData(data))}
        isNewStep={isNewStep}
        onChange={data => onChange?.(this.processFormData(data))}
        allowableTypes={allowableTypes}
        stepViewType={stepViewType}
        ref={formikRef}
      />
    )
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<ContinousVerificationData>): FormikErrors<ContinousVerificationData> {
    const errors: FormikErrors<ContinousVerificationData> = {}
    const { sensitivity, duration, baseline, deploymentTag } = (template?.spec?.spec as spec) || {}
    const { monitoredService } = template?.spec || {}
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    if (getString) {
      validateField(sensitivity as string, 'sensitivity', data, errors, getString, isRequired)
      validateField(duration as string, 'duration', data, errors, getString, isRequired)
      validateField(baseline as string, 'baseline', data, errors, getString, isRequired)
      validateField(deploymentTag as string, 'deploymentTag', data, errors, getString, isRequired)
      validateTimeout(getString, data, errors, template, isRequired)
      validateMonitoredService(data, errors, getString, isRequired, monitoredService)
      validateMonitoredServiceTemplateInputs(data, errors, getString, monitoredService)
    }
    return errors
  }

  private getInitialValues(initialValues: ContinousVerificationData): ContinousVerificationData {
    return {
      ...initialValues,
      spec: {
        ...initialValues?.spec,
        spec: getSpecFormData(initialValues?.spec?.spec)
      }
    }
  }

  processFormData(data: ContinousVerificationData): ContinousVerificationData {
    const output = {
      ...data,
      spec: {
        ...omit(data?.spec, ['monitoredServiceRef', 'healthSources', 'initialMonitoredService']),
        ...(data?.spec?.monitoredService?.type && { monitoredService: getMonitoredServiceYamlData(data?.spec) }),
        spec: getSpecYamlData(data?.spec?.spec, data?.spec?.type)
      }
    }
    return output
  }
}
