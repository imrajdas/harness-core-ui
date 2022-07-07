/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { isEmpty } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { Dialog, Intent } from '@blueprintjs/core'
import cx from 'classnames'
import * as Yup from 'yup'
import { FieldArray, FormikProps } from 'formik'
import {
  Accordion,
  Button,
  FormError,
  Formik,
  FormikForm,
  FormInput,
  getMultiTypeFromValue,
  MultiTypeInputType,
  PageSpinner,
  Text
} from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { setFormikRef, StepFormikFowardRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { String, useStrings } from 'framework/strings'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import {
  JiraFieldNG,
  JiraProjectBasicNG,
  JiraProjectNG,
  useGetJiraIssueCreateMetadata,
  useGetJiraProjects
} from 'services/cd-ng'
import type {
  AccountPathProps,
  GitQueryParams,
  PipelinePathProps,
  PipelineType
} from '@common/interfaces/RouteInterfaces'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { useQueryParams } from '@common/hooks'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import type { JiraProjectSelectOption } from '../JiraApproval/types'
import { getGenuineValue, setIssueTypeOptions } from '../JiraApproval/helper'
import { isApprovalStepFieldDisabled } from '../Common/ApprovalCommons'
import { JiraDynamicFieldsSelector } from './JiraDynamicFieldsSelector'
import type {
  JiraCreateData,
  JiraCreateFieldType,
  JiraCreateFormContentInterface,
  JiraCreateStepModeProps,
  JiraFieldNGWithValue
} from './types'
import {
  getInitialValueForSelectedField,
  getKVFieldsToBeAddedInForm,
  getSelectedFieldsToBeAddedInForm,
  isRuntimeOrExpressionType,
  processFormData,
  resetForm
} from './helper'
import { JiraFieldsRenderer } from './JiraFieldsRenderer'
import { getNameAndIdentifierSchema } from '../StepsValidateUtils'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './JiraCreate.module.scss'

function FormContent({
  formik,
  refetchProjects,
  refetchProjectMetadata,
  projectsResponse,
  projectMetadataFetchError,
  projectsFetchError,
  projectMetaResponse,
  fetchingProjects,
  fetchingProjectMetadata,
  isNewStep,
  allowableTypes,
  stepViewType,
  readonly
}: JiraCreateFormContentInterface): JSX.Element {
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()
  const { expressions } = useVariablesExpression()
  const { accountId, projectIdentifier, orgIdentifier } =
    useParams<PipelineType<PipelinePathProps & AccountPathProps>>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const [projectOptions, setProjectOptions] = useState<JiraProjectSelectOption[]>([])
  const [projectMetadata, setProjectMetadata] = useState<JiraProjectNG>()
  const [count, setCount] = React.useState(0)
  const [connectorValueType, setConnectorValueType] = useState<MultiTypeInputType>(MultiTypeInputType.FIXED)
  const [projectValueType, setProjectValueType] = useState<MultiTypeInputType>(MultiTypeInputType.FIXED)
  const [issueValueType, setIssueValueType] = useState<MultiTypeInputType>(MultiTypeInputType.FIXED)
  const jiraType = 'createMode'
  const commonParams = {
    accountIdentifier: accountId,
    projectIdentifier,
    orgIdentifier,
    repoIdentifier,
    branch
  }
  const connectorRefFixedValue = getGenuineValue(formik.values.spec.connectorRef)
  const projectKeyFixedValue =
    typeof formik.values.spec.projectKey === 'object'
      ? (formik.values.spec.projectKey as JiraProjectSelectOption).key
      : undefined
  const issueTypeFixedValue =
    typeof formik.values.spec.issueType === 'object'
      ? (formik.values.spec.issueType as JiraProjectSelectOption).key
      : undefined

  useEffect(() => {
    // If connector value changes in form, fetch projects
    // second block is needed so that we don't fetch projects if type is expression
    // CDC-15633
    if (connectorRefFixedValue && connectorValueType === MultiTypeInputType.FIXED) {
      refetchProjects({
        queryParams: {
          ...commonParams,
          connectorRef: connectorRefFixedValue.toString()
        }
      })
    } else if (connectorRefFixedValue !== undefined || isRuntimeOrExpressionType(connectorValueType)) {
      // Undefined check is needed so that form is not set to dirty as soon as we open
      // This means we've cleared the value or marked runtime/expression
      // Flush the selected optional fields, and move everything to key value fields
      // formik.setFieldValue('spec.fields', getKVFields(formik.values))
      formik.setFieldValue('spec.selectedRequiredFields', [])
      formik.setFieldValue('spec.selectedOptionalFields', [])
    }
  }, [connectorRefFixedValue])

  useEffect(() => {
    // If project value changes in form, fetch metadata
    if (connectorRefFixedValue && projectKeyFixedValue) {
      refetchProjectMetadata({
        queryParams: {
          ...commonParams,
          connectorRef: connectorRefFixedValue.toString(),
          projectKey: projectKeyFixedValue.toString()
        }
      })
    } else if (
      (connectorRefFixedValue !== undefined && projectKeyFixedValue !== undefined) ||
      isRuntimeOrExpressionType(projectValueType)
    ) {
      // Undefined check is needed so that form is not set to dirty as soon as we open
      // This means we've cleared the value or marked runtime/expression
      // Flush the selected optional and required fields, and move everything to key value fields
      // formik.setFieldValue('spec.fields', getKVFields(formik.values))
      formik.setFieldValue('spec.selectedRequiredFields', [])
      formik.setFieldValue('spec.selectedOptionalFields', [])
    }
  }, [projectKeyFixedValue])

  useEffect(() => {
    // If issuetype changes in form, set status and field list
    if (issueTypeFixedValue) {
      const issueTypeData = projectMetadata?.issuetypes[issueTypeFixedValue]
      const fieldKeys = Object.keys(issueTypeData?.fields || {})
      const formikOptionalFields: JiraFieldNGWithValue[] = []
      const formikRequiredFields: JiraFieldNGWithValue[] = []
      fieldKeys.forEach(keyy => {
        const field = issueTypeData?.fields[keyy]
        if (field) {
          const savedValueForThisField = getInitialValueForSelectedField(formik.values.spec.fields, field)
          if (savedValueForThisField && !field.required) {
            formikOptionalFields.push({ ...field, value: savedValueForThisField })
          } else if (field.required) {
            formikRequiredFields.push({
              ...field,
              //this check is needed for multiselect or single select fields
              //as these fields accepts value in the form of array and if savedValueForThisField which is
              //of string is empty, we need to ensure the value is set to empty array
              value: !isEmpty(field.allowedValues) && !savedValueForThisField ? [] : savedValueForThisField
            })
          }
        }
      })
      formik.setFieldValue('spec.selectedRequiredFields', formikRequiredFields)
      formik.setFieldValue('spec.selectedOptionalFields', formikOptionalFields)
      const toBeUpdatedKVFields = getKVFieldsToBeAddedInForm(
        formik.values.spec.fields,
        [],
        formikOptionalFields,
        formikRequiredFields
      )
      formik.setFieldValue('spec.fields', toBeUpdatedKVFields)
    } else if (issueTypeFixedValue !== undefined || isRuntimeOrExpressionType(issueValueType)) {
      // Undefined check is needed so that form is not set to dirty as soon as we open
      // This means we've cleared the value or marked runtime/expression
      // Flush the selected additional fields, and move everything to key value fields
      // formik.setFieldValue('spec.fields', getKVFields(formik.values))
      formik.setFieldValue('spec.selectedRequiredFields', [])
      formik.setFieldValue('spec.selectedOptionalFields', [])
    }
  }, [issueTypeFixedValue, projectMetadata])

  useEffect(() => {
    let options: JiraProjectSelectOption[] = []
    const projectResponseList: JiraProjectBasicNG[] = projectsResponse?.data || []
    options =
      projectResponseList.map((project: JiraProjectBasicNG) => ({
        label: project.name || '',
        value: project.id || '',
        key: project.key || ''
      })) || []

    setProjectOptions(options)
  }, [projectsResponse?.data])

  useEffect(() => {
    if (projectKeyFixedValue && projectMetaResponse?.data?.projects) {
      const projectMD: JiraProjectNG = projectMetaResponse?.data?.projects[projectKeyFixedValue]
      setProjectMetadata(projectMD)
    }
  }, [projectMetaResponse?.data])

  const [showDynamicFieldsModal, hideDynamicFieldsModal] = useModalHook(() => {
    return (
      <Dialog
        className={css.addFieldsModal}
        enforceFocus={false}
        isOpen
        onClose={hideDynamicFieldsModal}
        title={getString('pipeline.jiraCreateStep.addFields')}
      >
        <JiraDynamicFieldsSelector
          connectorRef={connectorRefFixedValue || ''}
          selectedProjectKey={projectKeyFixedValue || ''}
          selectedIssueTypeKey={issueTypeFixedValue || ''}
          jiraType={jiraType}
          projectOptions={projectOptions}
          selectedFields={formik.values.spec.selectedOptionalFields}
          addSelectedFields={(fieldsToBeAdded: JiraFieldNG[]) => {
            formik.setFieldValue(
              'spec.selectedOptionalFields',
              getSelectedFieldsToBeAddedInForm(
                fieldsToBeAdded,
                formik.values.spec.selectedOptionalFields,
                formik.values.spec.fields
              )
            )
            hideDynamicFieldsModal()
          }}
          provideFieldList={(fields: JiraCreateFieldType[]) => {
            formik.setFieldValue(
              'spec.fields',
              getKVFieldsToBeAddedInForm(fields, formik.values.spec.fields, formik.values.spec.selectedOptionalFields)
            )
            hideDynamicFieldsModal()
          }}
          onCancel={hideDynamicFieldsModal}
        />
      </Dialog>
    )
  }, [projectOptions, connectorRefFixedValue, formik.values.spec.selectedOptionalFields, formik.values.spec.fields])

  function AddFieldsButton(): React.ReactElement {
    return (
      <Text
        onClick={() => {
          if (!isApprovalStepFieldDisabled(readonly)) {
            showDynamicFieldsModal()
          }
        }}
        style={{
          cursor: isApprovalStepFieldDisabled(readonly) ? 'not-allowed' : 'pointer'
        }}
        tooltipProps={{ dataTooltipId: 'jiraCreateAddFields' }}
        intent="primary"
      >
        {getString('pipeline.jiraCreateStep.fieldSelectorAdd')}
      </Text>
    )
  }

  return (
    <React.Fragment>
      {stepViewType !== StepViewType.Template && (
        <div className={cx(stepCss.formGroup, stepCss.lg)}>
          <FormInput.InputWithIdentifier
            inputLabel={getString('name')}
            isIdentifierEditable={isNewStep}
            inputGroupProps={{
              placeholder: getString('pipeline.stepNamePlaceholder'),
              disabled: isApprovalStepFieldDisabled(readonly)
            }}
          />
        </div>
      )}

      <div className={cx(stepCss.formGroup, stepCss.sm)}>
        <FormMultiTypeDurationField
          name="timeout"
          label={getString('pipelineSteps.timeoutLabel')}
          disabled={isApprovalStepFieldDisabled(readonly)}
          multiTypeDurationProps={{
            expressions,
            allowableTypes,
            enableConfigureOptions: false
          }}
        />
        {getMultiTypeFromValue(formik.values.timeout) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            value={formik.values.timeout || ''}
            type="String"
            variableName="timeout"
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            onChange={value => formik.setFieldValue('timeout', value)}
            isReadonly={readonly}
          />
        )}
      </div>
      <div className={stepCss.divider} />

      <div className={cx(stepCss.formGroup, stepCss.lg)}>
        <FormMultiTypeConnectorField
          name="spec.connectorRef"
          label={getString('pipeline.jiraApprovalStep.connectorRef')}
          className={css.connector}
          connectorLabelClass={css.connectorLabel}
          width={390}
          placeholder={getString('connectors.selectConnector')}
          accountIdentifier={accountId}
          projectIdentifier={projectIdentifier}
          orgIdentifier={orgIdentifier}
          multiTypeProps={{ expressions, allowableTypes }}
          type="Jira"
          enableConfigureOptions={false}
          selected={formik?.values?.spec.connectorRef as string}
          onChange={(value: any, _unused, multiType) => {
            // Clear dependent fields
            setConnectorValueType(multiType)
            if (value?.record?.identifier !== connectorRefFixedValue) {
              resetForm(formik, 'connectorRef')
              setCount(count + 1)
              if (multiType !== MultiTypeInputType.FIXED) {
                setProjectOptions([])
                setProjectMetadata(undefined)
              }
            }
          }}
          disabled={isApprovalStepFieldDisabled(readonly)}
          gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
        />
        {getMultiTypeFromValue(formik.values.spec.connectorRef) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            style={{ marginTop: 14 }}
            value={formik.values.spec.connectorRef as string}
            type="String"
            variableName="spec.connectorRef"
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            onChange={value => formik.setFieldValue('spec.connectorRef', value)}
            isReadonly={readonly}
          />
        )}
      </div>
      <React.Fragment key={count}>
        <div className={cx(stepCss.formGroup, stepCss.lg)}>
          <FormInput.MultiTypeInput
            selectItems={
              fetchingProjects
                ? [{ label: getString('pipeline.jiraApprovalStep.fetchingProjectsPlaceholder'), value: '' }]
                : projectOptions
            }
            label={getString('pipeline.jiraApprovalStep.project')}
            name="spec.projectKey"
            placeholder={
              fetchingProjects
                ? getString('pipeline.jiraApprovalStep.fetchingProjectsPlaceholder')
                : projectsFetchError?.message
                ? projectsFetchError?.message
                : getString('pipeline.jiraCreateStep.selectProject')
            }
            disabled={isApprovalStepFieldDisabled(readonly, fetchingProjects)}
            multiTypeInputProps={{
              expressions,
              allowableTypes,
              onChange: (value: unknown, _unused, multiType) => {
                // Clear dependent fields
                setProjectValueType(multiType)
                if ((value as JiraProjectSelectOption)?.key !== projectKeyFixedValue) {
                  resetForm(formik, 'projectKey')
                  setCount(count + 1)
                  setProjectMetadata(undefined)
                }
              }
            }}
          />
          {getMultiTypeFromValue(formik.values.spec.projectKey) === MultiTypeInputType.RUNTIME && (
            <ConfigureOptions
              value={formik.values.spec.projectKey as string}
              type="String"
              variableName="spec.projectKey"
              showRequiredField={false}
              showDefaultField={false}
              showAdvanced={true}
              onChange={value => formik.setFieldValue('spec.projectKey', value)}
              isReadonly={readonly}
            />
          )}
        </div>
        {projectsFetchError ? (
          <FormError
            className={css.marginTop}
            errorMessage={
              <Text
                lineClamp={1}
                width={350}
                margin={{ bottom: 'medium' }}
                intent={Intent.DANGER}
                tooltipProps={{ isDark: true, popoverClassName: css.tooltip }}
              >
                {getRBACErrorMessage(projectsFetchError)}
              </Text>
            }
            name="spec.projectKey"
          ></FormError>
        ) : null}

        <div className={cx(stepCss.formGroup, stepCss.lg)}>
          <FormInput.MultiTypeInput
            selectItems={
              fetchingProjectMetadata
                ? [{ label: getString('pipeline.jiraApprovalStep.fetchingIssueTypePlaceholder'), value: '' }]
                : setIssueTypeOptions(projectMetadata?.issuetypes)
            }
            label={getString('pipeline.jiraApprovalStep.issueType')}
            name="spec.issueType"
            placeholder={
              fetchingProjectMetadata
                ? getString('pipeline.jiraApprovalStep.fetchingIssueTypePlaceholder')
                : projectMetadataFetchError?.message
                ? projectMetadataFetchError?.message
                : getString('pipeline.jiraApprovalStep.issueTypePlaceholder')
            }
            disabled={isApprovalStepFieldDisabled(readonly, fetchingProjectMetadata)}
            multiTypeInputProps={{
              expressions,
              allowableTypes,
              onChange: (value: unknown, _unused, multiType) => {
                setIssueValueType(multiType)
                // Clear dependent fields
                if ((value as JiraProjectSelectOption)?.key !== issueTypeFixedValue) {
                  resetForm(formik, 'issueType')
                  formik.setFieldValue('spec.selectedRequiredFields', [])
                  setCount(count + 1)
                }
              }
            }}
          />
          {getMultiTypeFromValue(formik.values.spec.issueType) === MultiTypeInputType.RUNTIME && (
            <ConfigureOptions
              value={formik.values.spec.issueType as string}
              type="String"
              variableName="spec.issueType"
              showRequiredField={false}
              showDefaultField={false}
              showAdvanced={true}
              onChange={value => formik.setFieldValue('spec.issueType', value)}
              isReadonly={readonly}
            />
          )}
        </div>
        <div>
          <JiraFieldsRenderer
            selectedFields={formik.values.spec.selectedRequiredFields}
            renderRequiredFields={true}
            readonly={readonly}
          />
        </div>

        <div className={stepCss.noLookDivider} />
      </React.Fragment>

      <Accordion activeId="" className={stepCss.accordion}>
        <Accordion.Panel
          id="optional-config"
          summary={getString('common.optionalConfig')}
          details={
            <div>
              {fetchingProjectMetadata ? (
                <PageSpinner message={getString('pipeline.jiraCreateStep.fetchingFields')} className={css.fetching} />
              ) : (
                <>
                  <JiraFieldsRenderer
                    selectedFields={formik.values.spec.selectedOptionalFields}
                    readonly={readonly}
                    onDelete={(index, selectedField) => {
                      const selectedOptionalFieldsAfterRemoval = formik.values.spec.selectedOptionalFields?.filter(
                        (_unused, i) => i !== index
                      )
                      formik.setFieldValue('spec.selectedOptionalFields', selectedOptionalFieldsAfterRemoval)
                      const customFields = formik.values.spec.fields?.filter(field => field.name !== selectedField.name)
                      formik.setFieldValue('spec.fields', customFields)
                    }}
                  />

                  {!isEmpty(formik.values.spec.fields) ? (
                    <FieldArray
                      name="spec.fields"
                      render={({ remove }) => {
                        return (
                          <div>
                            <div className={css.headerRow}>
                              <String className={css.label} stringID="keyLabel" />
                              <String className={css.label} stringID="valueLabel" />
                            </div>
                            {formik.values.spec.fields?.map((_unused: JiraCreateFieldType, i: number) => (
                              <div className={css.headerRow} key={i}>
                                <FormInput.Text
                                  name={`spec.fields[${i}].name`}
                                  disabled={isApprovalStepFieldDisabled(readonly)}
                                  placeholder={getString('pipeline.keyPlaceholder')}
                                />
                                <FormInput.MultiTextInput
                                  name={`spec.fields[${i}].value`}
                                  label=""
                                  placeholder={getString('common.valuePlaceholder')}
                                  disabled={isApprovalStepFieldDisabled(readonly)}
                                  multiTextInputProps={{
                                    allowableTypes: allowableTypes.filter(item => item !== MultiTypeInputType.RUNTIME),
                                    expressions
                                  }}
                                />
                                <Button
                                  minimal
                                  icon="main-trash"
                                  disabled={isApprovalStepFieldDisabled(readonly)}
                                  data-testid={`remove-fieldList-${i}`}
                                  onClick={() => remove(i)}
                                />
                              </div>
                            ))}
                          </div>
                        )
                      }}
                    />
                  ) : null}
                </>
              )}

              <AddFieldsButton />
            </div>
          }
        />
      </Accordion>
    </React.Fragment>
  )
}

function JiraCreateStepMode(props: JiraCreateStepModeProps, formikRef: StepFormikFowardRef<JiraCreateData>) {
  const { onUpdate, isNewStep, readonly, onChange, stepViewType, allowableTypes } = props
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } =
    useParams<PipelineType<PipelinePathProps & AccountPathProps & GitQueryParams>>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const commonParams = {
    accountIdentifier: accountId,
    projectIdentifier,
    orgIdentifier,
    repoIdentifier,
    branch
  }

  const {
    refetch: refetchProjects,
    data: projectsResponse,
    error: projectsFetchError,
    loading: fetchingProjects
  } = useGetJiraProjects({
    lazy: true,
    queryParams: {
      ...commonParams,
      connectorRef: ''
    }
  })

  const {
    refetch: refetchProjectMetadata,
    data: projectMetaResponse,
    error: projectMetadataFetchError,
    loading: fetchingProjectMetadata
  } = useGetJiraIssueCreateMetadata({
    lazy: true,
    queryParams: {
      ...commonParams,
      connectorRef: '',
      projectKey: ''
    }
  })

  return (
    <Formik<JiraCreateData>
      onSubmit={values => {
        onUpdate?.(processFormData(values))
      }}
      formName="jiraCreate"
      initialValues={props.initialValues}
      validate={data => {
        onChange?.(processFormData(data))
      }}
      validationSchema={Yup.object().shape({
        ...getNameAndIdentifierSchema(getString, stepViewType),
        timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString('validation.timeout10SecMinimum')),
        spec: Yup.object().shape({
          connectorRef: Yup.string().required(getString('pipeline.jiraApprovalStep.validations.connectorRef')),
          projectKey: Yup.string().required(getString('pipeline.jiraApprovalStep.validations.project')),
          issueType: Yup.string().required(getString('pipeline.jiraApprovalStep.validations.issueType')),
          selectedRequiredFields: Yup.array().of(
            Yup.object().shape({
              value: Yup.string().required(getString('pipeline.jiraApprovalStep.validations.requiredField'))
            })
          )
        })
      })}
    >
      {(formik: FormikProps<JiraCreateData>) => {
        setFormikRef(formikRef, formik)
        return (
          <FormikForm>
            <FormContent
              formik={formik}
              allowableTypes={allowableTypes}
              stepViewType={stepViewType}
              refetchProjects={refetchProjects}
              refetchProjectMetadata={refetchProjectMetadata}
              fetchingProjects={fetchingProjects}
              fetchingProjectMetadata={fetchingProjectMetadata}
              projectMetaResponse={projectMetaResponse}
              projectsResponse={projectsResponse}
              projectsFetchError={projectsFetchError}
              projectMetadataFetchError={projectMetadataFetchError}
              isNewStep={isNewStep}
              readonly={readonly}
            />
          </FormikForm>
        )
      }}
    </Formik>
  )
}

const JiraCreateStepModeWithRef = React.forwardRef(JiraCreateStepMode)
export default JiraCreateStepModeWithRef
