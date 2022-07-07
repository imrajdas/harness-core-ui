/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { FieldArray } from 'formik'
import { get, isEmpty } from 'lodash-es'
import { Color } from '@harness/design-system'
import {
  Button,
  FormInput,
  HarnessDocTooltip,
  Icon,
  Layout,
  MultiTypeInputType,
  Radio,
  SelectOption,
  Text
} from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import type { JiraFieldNG } from 'services/cd-ng'
import { FormMultiTypeTextAreaField } from '@common/components/MultiTypeTextArea/MultiTypeTextArea'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import {
  ApprovalRejectionCriteriaCondition,
  ApprovalRejectionCriteriaProps,
  ApprovalRejectionCriteriaType,
  ConditionsInterface
} from '@pipeline/components/PipelineSteps/Steps/Common/types'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { errorCheck } from '@common/utils/formikHelpers'
import { isApprovalStepFieldDisabled } from './ApprovalCommons'
import {
  filterOutMultiOperators,
  handleOperatorChange,
  operatorValues,
  removeDuplicateFieldKeys,
  setAllowedValuesOptions
} from '../JiraApproval/helper'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './ApprovalRejectionCriteria.module.scss'

function RenderValueSelects({
  condition,
  allowedValuesForFields,
  mode,
  index,
  expressions,
  readonly
}: {
  condition: ApprovalRejectionCriteriaCondition
  allowedValuesForFields: Record<string, SelectOption[]>
  mode: string
  index: number
  expressions: string[]
  readonly?: boolean
}) {
  const { getString } = useStrings()
  if (condition.operator === 'in' || condition.operator === 'not in') {
    return (
      <FormInput.MultiSelectTypeInput
        label=""
        className={css.multiSelect}
        name={`spec.${mode}.spec.conditions[${index}].value`}
        selectItems={allowedValuesForFields[condition.key]}
        placeholder={getString('common.valuePlaceholder')}
        multiSelectTypeInputProps={{
          allowableTypes: [MultiTypeInputType.EXPRESSION, MultiTypeInputType.FIXED],
          expressions
        }}
        disabled={isApprovalStepFieldDisabled(readonly)}
      />
    )
  }
  return (
    <FormInput.MultiTypeInput
      label=""
      name={`spec.${mode}.spec.conditions[${index}].value`}
      selectItems={allowedValuesForFields[condition.key]}
      placeholder={getString('common.valuePlaceholder')}
      multiTypeInputProps={{
        allowableTypes: [MultiTypeInputType.EXPRESSION, MultiTypeInputType.FIXED],
        expressions
      }}
      disabled={isApprovalStepFieldDisabled(readonly)}
    />
  )
}

export function Conditions({
  values,
  onChange,
  mode,
  isFetchingFields,
  allowedValuesForFields,
  allowedFieldKeys,
  formik,
  fieldList,
  readonly,
  stepType
}: ConditionsInterface) {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const name = `spec.${mode}.spec.conditions`
  const approvalRejectionCriteriaError = get(formik?.errors, name)
  if (isFetchingFields) {
    return <div className={css.fetching}>{getString('pipeline.approvalCriteria.fetchingFields')}</div>
  }

  return (
    <div className={css.conditionalContent}>
      <Layout.Horizontal className={css.alignConditions} spacing="xxxlarge">
        <span>{getString('pipeline.approvalCriteria.match')}</span>
        <Radio
          onClick={() => onChange({ ...values, spec: { ...values.spec, matchAnyCondition: false } })}
          disabled={isApprovalStepFieldDisabled(readonly)}
          checked={!values.spec.matchAnyCondition}
        >
          {getString('pipeline.approvalCriteria.allConditions')}
        </Radio>
        <Radio
          onClick={() => onChange({ ...values, spec: { ...values.spec, matchAnyCondition: true } })}
          disabled={isApprovalStepFieldDisabled(readonly)}
          checked={values.spec.matchAnyCondition}
        >
          {getString('pipeline.approvalCriteria.anyCondition')}
        </Radio>
      </Layout.Horizontal>

      <div className={stepCss.formGroup}>
        <FieldArray
          name={name}
          render={({ push, remove }) => {
            return (
              <div className={css.criteriaRow}>
                <div className={css.headers}>
                  <span>
                    {stepType === StepType.JiraApproval
                      ? getString('pipeline.jiraApprovalStep.jiraField')
                      : getString('pipeline.approvalCriteria.field')}
                  </span>
                  <span>{getString('common.operator')}</span>
                  <span>{getString('valueLabel')}</span>
                </div>
                {values.spec.conditions?.map((condition: ApprovalRejectionCriteriaCondition, i: number) => (
                  <div className={css.headers} key={i}>
                    {isEmpty(fieldList) ? (
                      <FormInput.Text
                        disabled={isApprovalStepFieldDisabled(readonly)}
                        name={`spec.${mode}.spec.conditions[${i}].key`}
                        placeholder={getString('pipeline.keyPlaceholder')}
                      />
                    ) : (
                      <FormInput.Select
                        items={allowedFieldKeys}
                        name={`spec.${mode}.spec.conditions[${i}].key`}
                        placeholder={getString('pipeline.keyPlaceholder')}
                        disabled={isApprovalStepFieldDisabled(readonly)}
                      />
                    )}
                    <FormInput.Select
                      items={allowedValuesForFields[condition.key] ? operatorValues : filterOutMultiOperators()}
                      name={`spec.${mode}.spec.conditions[${i}].operator`}
                      placeholder={getString('pipeline.operatorPlaceholder')}
                      disabled={isApprovalStepFieldDisabled(readonly)}
                      onChange={(selectedOperator: SelectOption) => {
                        handleOperatorChange(selectedOperator, onChange, values, i)
                      }}
                    />
                    {allowedValuesForFields[condition.key] ? (
                      <RenderValueSelects
                        condition={condition}
                        allowedValuesForFields={allowedValuesForFields}
                        mode={mode}
                        index={i}
                        expressions={expressions}
                        readonly={readonly}
                      />
                    ) : (
                      <FormInput.MultiTextInput
                        label=""
                        name={`spec.${mode}.spec.conditions[${i}].value`}
                        placeholder={getString('common.valuePlaceholder')}
                        disabled={isApprovalStepFieldDisabled(readonly)}
                        multiTextInputProps={{
                          expressions,
                          allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
                        }}
                      />
                    )}

                    <Button
                      minimal
                      disabled={isApprovalStepFieldDisabled(readonly)}
                      icon="main-trash"
                      data-testid={`remove-conditions-${i}`}
                      onClick={() => remove(i)}
                    />
                  </div>
                ))}
                <Button
                  icon="plus"
                  minimal
                  intent="primary"
                  data-testid="add-conditions"
                  disabled={isApprovalStepFieldDisabled(readonly)}
                  onClick={() =>
                    push({ key: stepType === StepType.JiraApproval ? 'Status' : '', operator: 'equals', value: '' })
                  }
                >
                  {getString('add')}
                </Button>
              </div>
            )
          }}
        />
      </div>
      {errorCheck(name, formik) && typeof approvalRejectionCriteriaError === 'string' ? (
        <Layout.Horizontal spacing="xsmall" margin={{ top: 'small' }}>
          <Icon name="circle-cross" color={Color.RED_600} size={12} style={{ marginTop: 'var(--spacing-tiny)' }} />
          <Text className={css.formikError} intent="danger">
            {approvalRejectionCriteriaError}
          </Text>
        </Layout.Horizontal>
      ) : null}
    </div>
  )
}

export function Jexl(props: ApprovalRejectionCriteriaProps) {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  return (
    <div className={css.conditionalContentJexl}>
      <FormMultiTypeTextAreaField
        name={`spec.${props.mode}.spec.expression`}
        disabled={isApprovalStepFieldDisabled(props.readonly)}
        label={
          props.mode === 'approvalCriteria'
            ? getString('pipeline.approvalCriteria.jexlExpressionLabelApproval')
            : getString('pipeline.approvalCriteria.jexlExpressionLabelRejection')
        }
        className={css.jexlExpression}
        placeholder={getString('pipeline.jiraApprovalStep.jexlExpressionPlaceholder')}
        multiTypeTextArea={{
          expressions
        }}
      />
    </div>
  )
}

export function ApprovalRejectionCriteria(props: ApprovalRejectionCriteriaProps): React.ReactElement {
  const { values, onChange, title, readonly, stepType } = props
  const [type, setType] = useState<ApprovalRejectionCriteriaType>(values.type)
  const [allowedFieldKeys, setAllowedFieldKeys] = useState<SelectOption[]>([])
  const [allowedValuesForFields, setAllowedValuesForFields] = useState<Record<string, SelectOption[]>>({})
  const { getString } = useStrings()

  useEffect(() => {
    const allowedFieldKeysToSet: SelectOption[] = [{ label: 'Status', value: 'Status' }]
    const allowedValuesForFieldsToSet: Record<string, SelectOption[]> = {}
    if (!isEmpty(props.statusList)) {
      // If the status list is non empty, initialise it so that status is by default a dropdown
      allowedValuesForFieldsToSet['Status'] = props.statusList.map(status => ({ label: status.name, value: status.id }))
    }
    props.fieldList.forEach((field: JiraFieldNG) => {
      const fieldName = field.name || field.key
      if (!field.schema.array) {
        if (field.schema.type === 'string') {
          allowedFieldKeysToSet.push({
            label: fieldName,
            value: fieldName
          })
        } else if (field.allowedValues && field.schema.type === 'option' && fieldName) {
          allowedFieldKeysToSet.push({
            label: fieldName,
            value: fieldName
          })
          allowedValuesForFieldsToSet[fieldName] = setAllowedValuesOptions(field.allowedValues)
        }
      }
    })
    setAllowedFieldKeys(removeDuplicateFieldKeys(allowedFieldKeysToSet))
    setAllowedValuesForFields(allowedValuesForFieldsToSet)
  }, [props.fieldList, props.statusList])

  useEffect(() => {
    onChange({
      ...values,
      type
    })
  }, [type])

  const tooltipId = stepType === StepType.JiraApproval ? `jiraApproval${props.mode}` : `approval${props.mode}`

  return (
    <div className={css.box}>
      <div className="ng-tooltip-native">
        <div data-tooltip-id={tooltipId} className={stepCss.stepSubSectionHeading}>
          {title}
        </div>
        <HarnessDocTooltip tooltipId={tooltipId} useStandAlone={true} />
      </div>

      <div className={css.tabs}>
        <Radio
          onClick={() => setType(ApprovalRejectionCriteriaType.KeyValues)}
          disabled={isApprovalStepFieldDisabled(readonly)}
          checked={type === ApprovalRejectionCriteriaType.KeyValues}
          className={css.tab}
        >
          {getString('conditions')}
        </Radio>
        <Radio
          onClick={() => setType(ApprovalRejectionCriteriaType.Jexl)}
          disabled={isApprovalStepFieldDisabled(readonly)}
          checked={type === ApprovalRejectionCriteriaType.Jexl}
          className={css.tab}
        >
          {getString('common.jexlExpression')}
        </Radio>
      </div>

      {type === ApprovalRejectionCriteriaType.KeyValues ? (
        <Conditions {...props} allowedFieldKeys={allowedFieldKeys} allowedValuesForFields={allowedValuesForFields} />
      ) : (
        <Jexl {...props} />
      )}
    </div>
  )
}
