/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { IconName, MultiTypeInputType } from '@wings-software/uicore'
import type { FormikErrors } from 'formik'
import type { StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { validateInputSet } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { getFormValuesInCorrectFormat } from '@pipeline/components/PipelineSteps/Steps/StepsTransformValuesUtils'
import type {
  MultiTypeSelectOption,
  MultiTypeMapType,
  MultiTypeMapUIType,
  MultiTypeConnectorRef,
  Resources,
  MultiTypeListUIType,
  MultiTypeListType
} from '@pipeline/components/PipelineSteps/Steps/StepsTypes'
import type { StringsMap } from 'stringTypes'
import type { ConnectorReferenceFieldProps } from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'
import { GitCloneStepBaseWithRef } from './GitCloneStepBase'
import { GitCloneStepInputSet } from './GitCloneStepInputSet'
import { GitCloneStepVariables, GitCloneStepVariablesProps } from './GitCloneStepVariables'
import { getInputSetViewValidateFieldsConfig, transformValuesFieldsConfig } from './GitCloneStepFunctionConfigs'

export interface GitCloneStepSpec {
  connectorRef: string
  repoName?: string
  build:
    | {
        type: string
        spec: {
          branch?: string
          tag?: string
        }
      }
    | string // hardcoded <+input> when connectorRef is a runtimeinput
  cloneDirectory: string
  // image: string
  // privileged?: boolean
  // reports?: {
  //   type: 'JUnit'
  //   spec: {
  //     paths: MultiTypeListType
  //   }
  // }
  // settings?: MultiTypeMapType
  // imagePullPolicy?: MultiTypeSelectOption
  runAsUser?: string
  resources?: Resources
  depth?: number
  sslVerify?: boolean
}

export interface GitCloneStepData {
  identifier: string
  name?: string
  description?: string
  type: string
  timeout?: string
  spec: GitCloneStepSpec
  // UNSURE FOR NOW
  // connectorRef?: ConnectorReferenceFieldProps['selected']
}

export interface GitCloneStepSpecUI
  extends Omit<GitCloneStepSpec, 'connectorRef' | 'reports' | 'settings' | 'pull' | 'resources'> {
  connectorRef: MultiTypeConnectorRef
  // reportPaths?: MultiTypeListUIType
  // settings?: MultiTypeMapUIType
  // TODO: Right now we do not support Image Pull Policy but will do in the future
  // pull?: MultiTypeSelectOption
  // runAsUser?: string
  limitMemory?: string
  limitCPU?: string
}

// Interface for the form
export interface GitCloneStepDataUI extends Omit<GitCloneStepData, 'spec'> {
  spec: GitCloneStepSpecUI
}

export interface GitCloneStepProps {
  initialValues: GitCloneStepData
  template?: GitCloneStepData
  path?: string
  isNewStep?: boolean
  readonly?: boolean
  stepViewType: StepViewType
  onUpdate?: (data: GitCloneStepData) => void
  onChange?: (data: GitCloneStepData) => void
  allowableTypes: MultiTypeInputType[]
  formik?: any
}

export class GitCloneStep extends PipelineStep<GitCloneStepData> {
  constructor() {
    super()
    this._hasStepVariables = true
  }

  protected type = StepType.GitClone
  protected stepName = 'Configure Git Clone Step'
  protected stepIcon: IconName = 'git-clone-step'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.GitClone'

  protected stepPaletteVisible = false

  protected defaultValues: GitCloneStepData = {
    identifier: '',
    type: StepType.GitClone as string,
    spec: {
      connectorRef: '',
      build: { type: '', spec: {} },
      cloneDirectory: '/harness'
    }
  }

  /* istanbul ignore next */
  processFormData<T>(data: T): GitCloneStepData {
    return getFormValuesInCorrectFormat<T, GitCloneStepData>(data, transformValuesFieldsConfig)
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<GitCloneStepData>): FormikErrors<GitCloneStepData> {
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    if (getString) {
      return validateInputSet(data, template, getInputSetViewValidateFieldsConfig(isRequired), { getString }, viewType)
    }

    return {}
  }

  renderStep(props: StepProps<GitCloneStepData>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      stepViewType,
      inputSetData,
      formikRef,
      customStepProps,
      isNewStep,
      readonly,
      onChange,
      allowableTypes
    } = props

    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <GitCloneStepInputSet
          initialValues={initialValues}
          template={inputSetData?.template}
          path={inputSetData?.path || ''}
          readonly={!!inputSetData?.readonly}
          stepViewType={stepViewType}
          onUpdate={onUpdate}
          onChange={onChange}
          allowableTypes={allowableTypes}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <GitCloneStepVariables
          {...(customStepProps as GitCloneStepVariablesProps)}
          initialValues={initialValues}
          onUpdate={onUpdate}
        />
      )
    }

    return (
      <GitCloneStepBaseWithRef
        initialValues={initialValues}
        allowableTypes={allowableTypes}
        onChange={onChange}
        stepViewType={stepViewType || StepViewType.Edit}
        onUpdate={onUpdate}
        readonly={readonly}
        isNewStep={isNewStep}
        ref={formikRef}
      />
    )
  }
}
