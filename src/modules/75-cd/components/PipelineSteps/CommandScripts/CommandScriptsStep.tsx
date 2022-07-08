/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { IconName, getMultiTypeFromValue, MultiTypeInputType } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { isArray } from 'lodash-es'
import * as Yup from 'yup'
import { FormikErrors, yupToFormErrors } from 'formik'
import { v4 as uuid } from 'uuid'
import { StepProps, StepViewType, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'

import type { StringsMap } from 'stringTypes'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import { getSanitizedflatObjectForVariablesView } from '@pipeline/components/PipelineSteps/Steps/Common/ApprovalCommons'
import type { VariableMergeServiceResponse } from 'services/pipeline-ng'
import { CommandScriptsData, variableSchema, CommandScriptsFormData } from './CommandScriptsTypes'
import { CommandScriptsEdit } from './CommandScriptsEdit'
import { CommandScriptsInputSet } from './CommandScriptsInputSet'
import pipelineVariablesCss from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

export class CommandScriptsStep extends PipelineStep<CommandScriptsData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }

  renderStep(props: StepProps<CommandScriptsData>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      onChange,
      allowableTypes,
      stepViewType,
      formikRef,
      customStepProps,
      isNewStep,
      readonly,
      inputSetData
    } = props

    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <CommandScriptsInputSet
          initialValues={this.getInitialValues(initialValues)}
          stepViewType={stepViewType}
          inputSetData={{
            template: inputSetData?.template,
            path: inputSetData?.path,
            readonly: inputSetData?.readonly
          }}
          allowableTypes={allowableTypes}
        />
      )
    }

    if (stepViewType === StepViewType.InputVariable) {
      const customTypeVar = customStepProps as {
        variablesData: CommandScriptsData
        metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
      }
      return (
        <VariablesListTable
          data={getSanitizedflatObjectForVariablesView(customTypeVar.variablesData)}
          originalData={initialValues as Record<string, any>}
          metadataMap={customTypeVar.metadataMap}
          className={pipelineVariablesCss.variablePaddingL3}
        />
      )
    }

    return (
      <CommandScriptsEdit
        initialValues={this.getInitialValues(initialValues)}
        onUpdate={data => onUpdate?.(this.processFormData(data))}
        onChange={data => onChange?.(this.processFormData(data))}
        allowableTypes={allowableTypes}
        stepViewType={stepViewType}
        isNewStep={isNewStep}
        readonly={readonly}
        ref={formikRef}
      />
    )
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<CommandScriptsData>): FormikErrors<CommandScriptsData> {
    const errors: FormikErrors<CommandScriptsData> = {}
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
        /* istanbul ignore else */
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    }

    /* istanbul ignore else */
    if (
      (isArray(template?.spec?.environmentVariables) || isArray(template?.spec?.outputVariables)) &&
      isRequired &&
      getString
    ) {
      try {
        const schema = Yup.object().shape({
          spec: Yup.object().shape({
            environmentVariables: variableSchema(getString),
            outputVariables: variableSchema(getString)
          })
        })
        schema.validateSync(data)
      } catch (e) {
        /* istanbul ignore else */
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    }

    return errors
  }

  protected type = StepType.Command
  protected stepName = 'Command Scripts'
  protected stepIcon: IconName = 'command-shell-script'
  protected stepIconColor = Color.GREY_700
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.SHELLSCRIPT'
  protected isHarnessSpecific = true
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()

  protected defaultValues: CommandScriptsData = {
    identifier: '',
    timeout: '10m',
    name: '',
    type: StepType.Command,
    spec: {
      onDelegate: false
    }
  }

  private getInitialValues(initialValues: CommandScriptsData): CommandScriptsFormData {
    return {
      ...initialValues,
      spec: {
        ...initialValues.spec,
        environmentVariables: Array.isArray(initialValues.spec?.environmentVariables)
          ? initialValues.spec.environmentVariables.map(variable => ({
              ...variable,
              id: uuid()
            }))
          : [],
        outputVariables: Array.isArray(initialValues.spec?.outputVariables)
          ? initialValues.spec.outputVariables.map(variable => ({
              ...variable,
              id: uuid()
            }))
          : []
      }
    }
  }

  processFormData(data: CommandScriptsFormData): CommandScriptsData {
    return {
      ...data,
      spec: {
        ...data.spec,
        environmentVariables: Array.isArray(data.spec?.environmentVariables)
          ? data.spec?.environmentVariables.filter(variable => variable.value).map(({ id, ...variable }) => variable)
          : undefined,
        outputVariables: Array.isArray(data.spec?.outputVariables)
          ? data.spec?.outputVariables.filter(variable => variable.value).map(({ id, ...variable }) => variable)
          : undefined
      }
    }
  }
}
