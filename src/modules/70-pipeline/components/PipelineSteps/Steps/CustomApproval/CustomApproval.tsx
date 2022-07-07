/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { IconName, getMultiTypeFromValue, MultiTypeInputType } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { isEmpty, set, get, isArray, merge } from 'lodash-es'
import * as Yup from 'yup'
import { FormikErrors, yupToFormErrors } from 'formik'
import { v4 as uuid } from 'uuid'
import { CompletionItemKind } from 'vscode-languageserver-types'
import { parse } from 'yaml'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import { StepProps, StepViewType, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { listSecretsV2Promise, SecretResponseWrapper } from 'services/cd-ng'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { Scope } from '@common/interfaces/SecretsInterface'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { getDefaultCriterias } from '@pipeline/components/PipelineSteps/Steps/JiraApproval/helper'
import { getApprovalRejectionCriteriaForSubmit } from '@pipeline/components/PipelineSteps/Steps/Common/ApprovalCommons'
import type { ApprovalRejectionCriteria } from '@pipeline/components/PipelineSteps/Steps/Common/types'

import type { StringsMap } from 'stringTypes'
import { customApprovalType } from './BaseCustomApproval'

import { CustomApprovalData, CustomApprovalFormData, variableSchema } from './types'
import CustomApprovalInputSetStep from './CustomApprovalInputSetStep'
import { CustomApprovalWidgetWithRef } from './CustomApprovalWidget'
import { CustomApprovalVariablesView, CustomApprovalVariablesViewProps } from './CustomApprovalVariablesView'

const logger = loggerFor(ModuleName.CD)
const ConnectorRefRegex = /^.+step\.spec\.executionTarget\.connectorRef$/

const getConnectorValue = (connector?: SecretResponseWrapper): string =>
  `${
    connector?.secret?.orgIdentifier && connector?.secret?.projectIdentifier
      ? connector?.secret?.identifier
      : connector?.secret?.orgIdentifier
      ? `${Scope.ORG}.${connector?.secret?.identifier}`
      : `${Scope.ACCOUNT}.${connector?.secret?.identifier}`
  }` || ''

const getConnectorName = (connector?: SecretResponseWrapper): string =>
  `${
    connector?.secret?.orgIdentifier && connector?.secret?.projectIdentifier
      ? `${connector?.secret?.type}: ${connector?.secret?.name}`
      : connector?.secret?.orgIdentifier
      ? `${connector?.secret?.type}[Org]: ${connector?.secret?.name}`
      : `${connector?.secret?.type}[Account]: ${connector?.secret?.name}`
  }` || ''

export class CustomApproval extends PipelineStep<CustomApprovalData> {
  constructor() {
    super()
    this.invocationMap.set(ConnectorRefRegex, this.getSecretsListForYaml.bind(this))
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }

  renderStep(props: StepProps<CustomApprovalData>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      onChange,
      allowableTypes,
      stepViewType,
      inputSetData,
      formikRef,
      customStepProps,
      isNewStep,
      readonly
    } = props

    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <CustomApprovalInputSetStep
          initialValues={this.getInitialValues(initialValues)}
          onUpdate={data => onUpdate?.(this.processFormData(data))}
          stepViewType={stepViewType}
          readonly={!!inputSetData?.readonly}
          template={inputSetData?.template}
          path={inputSetData?.path || ''}
          allowableTypes={allowableTypes}
        />
      )
    }

    if (stepViewType === StepViewType.InputVariable) {
      return (
        <CustomApprovalVariablesView
          {...(customStepProps as CustomApprovalVariablesViewProps)}
          originalData={initialValues}
        />
      )
    }
    return (
      <CustomApprovalWidgetWithRef
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
  }: ValidateInputSetProps<CustomApprovalData>): FormikErrors<CustomApprovalData> {
    const errors: FormikErrors<CustomApprovalData> = {}
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm

    /* istanbul ignore else */
    if (isArray(template?.spec?.outputVariables) && isRequired && getString) {
      try {
        const schema = Yup.object().shape({
          spec: Yup.object().shape({
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

    /* istanbul ignore else */
    if (
      getMultiTypeFromValue(template?.spec?.source?.spec?.script) === MultiTypeInputType.RUNTIME &&
      isRequired &&
      isEmpty(data?.spec?.source?.spec?.script)
    ) {
      set(errors, 'spec.source.spec.script', getString?.('fieldRequired', { field: 'Script' }))
    }

    /* istanbul ignore else */
    if (
      typeof template?.spec?.approvalCriteria?.spec?.expression === 'string' &&
      getMultiTypeFromValue(template?.spec?.approvalCriteria?.spec?.expression) === MultiTypeInputType.RUNTIME &&
      isEmpty(data?.spec?.approvalCriteria?.spec?.expression?.trim())
    ) {
      errors.spec = {
        ...errors.spec,
        approvalCriteria: {
          spec: { expression: getString?.('pipeline.approvalCriteria.validations.expression') }
        }
      }
    }

    if (getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME) {
      const timeout = Yup.object().shape({
        timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString?.('validation.timeout10SecMinimum'))
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

    if (
      isRequired &&
      (getMultiTypeFromValue(template?.spec.retryInterval) === MultiTypeInputType.RUNTIME ||
        getMultiTypeFromValue(template?.spec.scriptTimeout) === MultiTypeInputType.RUNTIME)
    ) {
      const retryAndScriptTimeoutSchema = Yup.object().shape({
        spec: Yup.object().shape({
          scriptTimeout: getDurationValidationSchema({ minimum: '10s' }).required(
            getString?.('pipeline.customApprovalStep.validation.minimumScriptTimeoutIs10Secs')
          ),
          retryInterval: getDurationValidationSchema({ minimum: '10s' }).required(
            getString?.('pipeline.customApprovalStep.validation.minimumRetryIntervalIs10Secs')
          )
        })
      })

      try {
        retryAndScriptTimeoutSchema.validateSync(data, { abortEarly: false })
      } catch (validationErrorsObj) {
        /* istanbul ignore else */
        if (validationErrorsObj instanceof Yup.ValidationError) {
          validationErrorsObj.inner?.forEach(valError => {
            const err = yupToFormErrors(valError)
            merge(errors, err)
          })
        }
      }
    }

    return errors
  }

  protected type = StepType.CustomApproval
  protected stepName = 'Custom Approval'
  protected stepIcon: IconName = 'custom-approval'
  protected stepIconColor = Color.GREY_700
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.CustomApproval'
  protected isHarnessSpecific = true
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()

  protected defaultValues: CustomApprovalData = {
    identifier: '',
    timeout: '1d',
    name: '',
    spec: {
      rejectionCriteria: getDefaultCriterias(),
      approvalCriteria: getDefaultCriterias(),
      scriptTimeout: '10m',
      retryInterval: '10s',
      shell: customApprovalType[0].value,
      onDelegate: 'targethost',
      source: {
        type: 'Inline',
        spec: {
          script: ''
        }
      }
    },
    type: StepType.CustomApproval
  }

  protected async getSecretsListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err) {
      logger.error('Error while parsing the yaml', err)
    }
    const { accountId } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.connectorRef', ''))
      if (obj) {
        const listOfSecrets = await listSecretsV2Promise({
          queryParams: {
            accountIdentifier: accountId,
            includeSecretsFromEverySubScope: true,
            types: ['SecretText', 'SSHKey'],
            pageIndex: 0,
            pageSize: 10
          }
        }).then(response =>
          response?.data?.content?.map(connector => {
            return {
              label: getConnectorName(connector),
              insertText: getConnectorValue(connector),
              kind: CompletionItemKind.Field
            }
          })
        )
        return listOfSecrets || []
      }
    }

    return new Promise(resolve => {
      resolve([])
    })
  }

  private getInitialValues(initialValues: CustomApprovalData): CustomApprovalFormData {
    return {
      ...initialValues,
      spec: {
        ...initialValues.spec,
        shell: 'Bash',
        onDelegate: initialValues.spec?.onDelegate ? 'delegate' : 'targethost',
        source: {
          type: 'Inline',
          ...(initialValues?.spec?.source || {})
        },
        environmentVariables: Array.isArray(initialValues.spec?.environmentVariables)
          ? initialValues.spec?.environmentVariables.map(variable => ({
              ...variable,
              id: uuid()
            }))
          : [],

        outputVariables: Array.isArray(initialValues.spec?.outputVariables)
          ? initialValues.spec?.outputVariables.map(variable => ({
              ...variable,
              id: uuid()
            }))
          : []
      }
    }
  }

  /* istanbul ignore next */
  processFormData(data: CustomApprovalFormData): CustomApprovalData {
    return {
      ...data,
      spec: {
        ...data.spec,
        onDelegate: data.spec?.onDelegate !== 'targethost',
        approvalCriteria: getApprovalRejectionCriteriaForSubmit(data.spec?.approvalCriteria),
        rejectionCriteria: getApprovalRejectionCriteriaForSubmit(
          data.spec?.rejectionCriteria as ApprovalRejectionCriteria
        ),
        source: {
          ...data.spec?.source,
          spec: {
            ...data.spec?.source?.spec,
            script: data.spec?.source?.spec?.script
          }
        },
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
