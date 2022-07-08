/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Button,
  ButtonSize,
  ButtonVariation,
  Formik,
  FormikForm,
  FormInput,
  getMultiTypeFromValue,
  IconName,
  Label,
  Dialog,
  Layout,
  MultiTypeInputType,
  SelectOption,
  ThumbnailSelect,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle,
  getErrorInfoFromErrorObject,
  Container,
  PageSpinner
} from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import * as Yup from 'yup'
import { defaultTo, get, isEmpty, isNil, noop, omit, isEqual } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { Classes } from '@blueprintjs/core'
import { parse } from 'yaml'
import { CompletionItemKind } from 'vscode-languageserver-types'
import { connect, FormikErrors, FormikProps } from 'formik'
import cx from 'classnames'
import {
  EnvironmentRequestDTO,
  EnvironmentResponseDTO,
  EnvironmentYaml,
  getEnvironmentListPromise,
  PipelineInfrastructure,
  useGetEnvironmentAccessList,
  useGetEnvironmentList,
  useUpsertEnvironmentV2,
  useCreateEnvironmentV2,
  useGetYamlSchema
} from 'services/cd-ng'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { NameIdDescriptionTags } from '@common/components'
import { useStrings } from 'framework/strings'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import { Step, StepProps, StepViewType, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import type { PipelineType } from '@common/interfaces/RouteInterfaces'
import { useToaster } from '@common/exports'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'

import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type {
  YamlBuilderHandlerBinding,
  YamlBuilderProps,
  CompletionItemInterface
} from '@common/interfaces/YAMLBuilderProps'

import YAMLBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import { usePermission } from '@rbac/hooks/usePermission'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import { getEnvironmentRefSchema } from '@cd/components/PipelineSteps/PipelineStepsUtil'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { Category, EnvironmentActions, ExitModalActions } from '@common/constants/TrackingConstants'
import ExperimentalInput from '../K8sServiceSpec/K8sServiceSpecForms/ExperimentalInput'
import css from './DeployEnvStep.module.scss'

const logger = loggerFor(ModuleName.CD)
export interface DeployEnvData extends Omit<PipelineInfrastructure, 'environmentRef'> {
  environmentRef?: string
}

export interface NewEditEnvironmentModalProps {
  isEdit: boolean
  isEnvironment: boolean
  data: EnvironmentResponseDTO
  envIdentifier?: string
  onCreateOrUpdate(data: EnvironmentRequestDTO): void
  closeModal?: () => void
}

const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
  fileName: `environment.yaml`,
  entityType: 'Environment',
  width: '100%',
  height: 220,
  showSnippetSection: false,
  yamlSanityConfig: {
    removeEmptyString: false,
    removeEmptyObject: false,
    removeEmptyArray: false
  }
}
// SONAR recommendation
const flexStart = 'flex-start'

const cleanData = (values: EnvironmentResponseDTO): EnvironmentRequestDTO => {
  const newDescription = values.description?.toString().trim()
  const newId = values.identifier?.toString().trim()
  const newName = values.name?.toString().trim()
  const newType = values.type?.toString().trim()
  return {
    name: newName,
    identifier: newId,
    orgIdentifier: values.orgIdentifier,
    projectIdentifier: values.projectIdentifier,
    description: newDescription,
    tags: values.tags,
    type: newType as 'PreProduction' | 'Production'
  }
}

export const NewEditEnvironmentModal: React.FC<NewEditEnvironmentModalProps> = ({
  isEdit,
  data,
  isEnvironment,
  onCreateOrUpdate,
  closeModal
}): JSX.Element => {
  const { getString } = useStrings()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    orgIdentifier: string
    projectIdentifier: string
    accountId: string
  }>()
  const [yamlHandler, setYamlHandler] = React.useState<YamlBuilderHandlerBinding | undefined>()
  const [selectedView, setSelectedView] = React.useState<SelectedView>(SelectedView.VISUAL)
  const { loading: createLoading, mutate: createEnvironment } = useCreateEnvironmentV2({
    queryParams: {
      accountIdentifier: accountId
    }
  })
  const { loading: updateLoading, mutate: updateEnvironment } = useUpsertEnvironmentV2({
    queryParams: {
      accountIdentifier: accountId
    }
  })
  const { showSuccess, showError, clear } = useToaster()
  const { trackEvent } = useTelemetry()

  React.useEffect(() => {
    !isEdit &&
      trackEvent(EnvironmentActions.StartCreateEnvironment, {
        category: Category.ENVIRONMENT
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = React.useCallback(
    async (value: Required<EnvironmentRequestDTO>) => {
      try {
        const values = cleanData(value)
        if (!values.name) {
          showError(getString('fieldRequired', { field: 'Environment' }))
        } else if (!values.identifier) {
          showError(getString('common.validation.fieldIsRequired', { name: 'Identifier' }))
        } else if (!(isEqual(values.type, 'PreProduction') || isEqual(values.type, 'Production'))) {
          showError(getString('cd.typeError'))
        } else if (isEdit && id !== values.identifier) {
          showError(getString('cd.editIdError', { id: id }))
        } else if (isEdit && !isEnvironment) {
          const response = await updateEnvironment({
            ...omit(values, 'accountId', 'deleted'),
            orgIdentifier,
            projectIdentifier
          })
          if (response.status === 'SUCCESS') {
            clear()
            showSuccess(getString('cd.environmentUpdated'))
            onCreateOrUpdate(values)
          }
        } else {
          const response = await createEnvironment({ ...values, orgIdentifier, projectIdentifier })
          if (response.status === 'SUCCESS') {
            clear()
            showSuccess(getString('cd.environmentCreated'))
            onCreateOrUpdate(values)
          }
        }
      } catch (e) {
        showError(getErrorInfoFromErrorObject(e, true))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onCreateOrUpdate, orgIdentifier, projectIdentifier, isEdit, isEnvironment]
  )
  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])
  const typeList: { label: string; value: string }[] = [
    {
      label: getString('production'),
      value: 'Production'
    },
    {
      label: getString('cd.preProduction'),
      value: 'PreProduction'
    }
  ]
  const formikRef = React.useRef<FormikProps<EnvironmentResponseDTO>>()
  const id = data.identifier
  const { data: environmentSchema } = useGetYamlSchema({
    queryParams: {
      entityType: 'Environment',
      projectIdentifier,
      orgIdentifier,
      accountIdentifier: accountId,
      scope: getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })
    }
  })
  const handleModeSwitch = React.useCallback(
    (view: SelectedView) => {
      if (view === SelectedView.VISUAL) {
        const yaml = defaultTo(yamlHandler?.getLatestYaml(), '')
        const envSetYamlVisual = parse(yaml).environment as EnvironmentResponseDTO
        if (envSetYamlVisual) {
          formikRef.current?.setValues({
            ...omit(cleanData(envSetYamlVisual) as EnvironmentResponseDTO)
          })
        }
      }
      setSelectedView(view)
    },
    [yamlHandler?.getLatestYaml, data]
  )

  return (
    <>
      {(createLoading || updateLoading) && <PageSpinner />}
      <Container className={css.yamlToggleEnv}>
        <Layout.Horizontal flex={{ justifyContent: flexStart }} padding={{ top: 'small' }}>
          <VisualYamlToggle
            selectedView={selectedView}
            onChange={nextMode => {
              handleModeSwitch(nextMode)
            }}
          />
        </Layout.Horizontal>
      </Container>
      <Layout.Vertical>
        <Formik<Required<EnvironmentResponseDTO>>
          initialValues={data as Required<EnvironmentResponseDTO>}
          formName="deployEnv"
          onSubmit={values => {
            onSubmit(values)
            !isEdit &&
              trackEvent(EnvironmentActions.SaveCreateEnvironment, {
                category: Category.ENVIRONMENT
              })
          }}
          validationSchema={Yup.object().shape({
            name: NameSchema({ requiredErrorMsg: getString?.('fieldRequired', { field: 'Environment' }) }),
            type: Yup.string().required(getString?.('fieldRequired', { field: 'Type' })),
            identifier: IdentifierSchema()
          })}
        >
          {formikProps => {
            formikRef.current = formikProps as FormikProps<EnvironmentResponseDTO> | undefined
            return (
              <>
                {selectedView === SelectedView.VISUAL ? (
                  <FormikForm>
                    <NameIdDescriptionTags
                      formikProps={formikProps}
                      identifierProps={{
                        inputLabel: getString('name'),
                        inputGroupProps: {
                          inputGroup: {
                            inputRef: ref => (inputRef.current = ref)
                          }
                        },
                        isIdentifierEditable: !isEdit
                      }}
                    />
                    <Layout.Vertical spacing={'small'} style={{ marginBottom: 'var(--spacing-medium)' }}>
                      <Label className={cx(Classes.LABEL, css.label)}>{getString('envType')}</Label>
                      <ThumbnailSelect className={css.thumbnailSelect} name={'type'} items={typeList} />
                    </Layout.Vertical>
                    <Layout.Horizontal spacing="small" padding={{ top: 'xlarge' }}>
                      <Button
                        variation={ButtonVariation.PRIMARY}
                        type={'submit'}
                        text={getString('save')}
                        data-id="environment-save"
                      />
                      <Button
                        variation={ButtonVariation.TERTIARY}
                        text={getString('cancel')}
                        onClick={() => {
                          !isEdit &&
                            trackEvent(ExitModalActions.ExitByCancel, {
                              category: Category.ENVIRONMENT
                            })
                          closeModal?.()
                        }}
                      />
                    </Layout.Horizontal>
                  </FormikForm>
                ) : (
                  <Container>
                    <YAMLBuilder
                      {...yamlBuilderReadOnlyModeProps}
                      existingJSON={{
                        environment: {
                          ...omit(formikProps?.values),
                          description: defaultTo(formikProps.values.description, ''),
                          tags: defaultTo(formikProps.values.tags, {}),
                          type: defaultTo(formikProps.values.type, '')
                        }
                      }}
                      schema={environmentSchema?.data}
                      bind={setYamlHandler}
                      showSnippetSection={false}
                    />

                    <Layout.Horizontal spacing="small" padding={{ top: 'large' }}>
                      <Button
                        variation={ButtonVariation.PRIMARY}
                        type="submit"
                        text={getString('save')}
                        onClick={() => {
                          const latestYaml = defaultTo(yamlHandler?.getLatestYaml(), '')
                          const errorMsg = yamlHandler?.getYAMLValidationErrorMap()
                          if (errorMsg?.size) {
                            showError(errorMsg.entries().next().value[1])
                          } else {
                            onSubmit(parse(latestYaml)?.environment)
                          }
                        }}
                      />
                      <Button
                        variation={ButtonVariation.TERTIARY}
                        onClick={() => {
                          !isEdit &&
                            trackEvent(ExitModalActions.ExitByCancel, {
                              category: Category.ENVIRONMENT
                            })
                          closeModal?.()
                        }}
                        text={getString('cancel')}
                      />
                    </Layout.Horizontal>
                  </Container>
                )}
              </>
            )
          }}
        </Formik>
      </Layout.Vertical>
    </>
  )
}

export interface DeployEnvironmentProps {
  initialValues: DeployEnvData
  onUpdate?: (data: DeployEnvData) => void
  stepViewType?: StepViewType
  readonly: boolean
  inputSetData?: {
    template?: DeployEnvData
    path?: string
    readonly?: boolean
  }
  allowableTypes: MultiTypeInputType[]
}

interface DeployEnvironmentState {
  isEdit: boolean
  isEnvironment: boolean
  formik?: FormikProps<DeployEnvData>
  data?: EnvironmentResponseDTO
}

function isEditEnvironment(data: DeployEnvData): boolean {
  if (getMultiTypeFromValue(data.environmentRef) !== MultiTypeInputType.RUNTIME && !isEmpty(data.environmentRef)) {
    return true
  } else if (data.environment && !isEmpty(data.environment.identifier)) {
    return true
  }
  return false
}

export const DeployEnvironmentWidget: React.FC<DeployEnvironmentProps> = ({
  initialValues,
  onUpdate,
  readonly,
  allowableTypes
}): JSX.Element => {
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<
    PipelineType<{
      orgIdentifier: string
      projectIdentifier: string
      pipelineIdentifier: string
      accountId: string
    }>
  >()

  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const {
    data: environmentsResponse,
    loading,
    error
  } = useGetEnvironmentList({
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier }
  })

  const [environments, setEnvironments] = React.useState<EnvironmentYaml[]>()
  const [selectOptions, setSelectOptions] = React.useState<SelectOption[]>()

  const [state, setState] = React.useState<DeployEnvironmentState>({
    isEdit: false,
    isEnvironment: false,
    data: { name: '', identifier: '' }
  })

  const updateEnvironmentsList = (value: EnvironmentRequestDTO) => {
    formikRef.current?.setValues({ environmentRef: value.identifier, ...(state.isEnvironment && { environment: {} }) })
    if (!isNil(environments)) {
      const newEnvironment = {
        description: value.description,
        identifier: defaultTo(value.identifier, ''),
        name: value.name || '',
        tags: value.tags,
        type: value.type
      }
      const newEnvironmentsList = [...environments]
      const existingIndex = newEnvironmentsList.findIndex(item => item.identifier === value.identifier)
      if (existingIndex >= 0) {
        newEnvironmentsList.splice(existingIndex, 1, newEnvironment)
      } else {
        newEnvironmentsList.unshift(newEnvironment)
      }
      setEnvironments(newEnvironmentsList)
    }
  }

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        onClose={onClose}
        title={state.isEdit ? getString('editEnvironment') : getString('newEnvironment')}
      >
        <NewEditEnvironmentModal
          data={{
            name: defaultTo(state.data?.name, ''),
            identifier: defaultTo(state.data?.identifier, ''),
            orgIdentifier,
            projectIdentifier,
            ...state.data
          }}
          isEnvironment={state.isEnvironment}
          isEdit={state.isEdit}
          onCreateOrUpdate={value => {
            updateEnvironmentsList(value)
            onClose.call(null)
          }}
          closeModal={onClose}
        />
      </Dialog>
    ),
    [state]
  )

  const onClose = React.useCallback(() => {
    setState({ isEdit: false, isEnvironment: false })
    hideModal()
  }, [hideModal])

  React.useEffect(() => {
    if (!isNil(selectOptions) && initialValues.environmentRef) {
      if (getMultiTypeFromValue(initialValues.environmentRef) === MultiTypeInputType.FIXED) {
        const doesExist = selectOptions.filter(env => env.value === initialValues.environmentRef).length > 0
        if (!doesExist) {
          if (!readonly) {
            formikRef.current?.setFieldValue('environmentRef', '')
          } else {
            const options = [...selectOptions]
            options.push({
              label: initialValues.environmentRef,
              value: initialValues.environmentRef
            })
            setSelectOptions(options)
          }
        }
      }
    }
  }, [selectOptions])

  React.useEffect(() => {
    if (!isNil(environments)) {
      setSelectOptions(
        environments.map(environment => {
          return { label: environment.name, value: environment.identifier }
        })
      )
    }
  }, [environments])

  React.useEffect(() => {
    if (!loading) {
      const envList: EnvironmentYaml[] = []
      if (environmentsResponse?.data?.content?.length) {
        environmentsResponse.data.content.forEach(env => {
          envList.push({
            description: env.environment?.description,
            identifier: env.environment?.identifier || '',
            name: env.environment?.name || '',
            tags: env.environment?.tags,
            type: env.environment?.type || 'PreProduction'
          })
        })
      }
      if (initialValues.environment) {
        const identifier = initialValues.environment.identifier
        const isExist = envList.filter(env => env.identifier === identifier).length > 0
        if (initialValues.environment && identifier && !isExist) {
          envList.push({
            description: initialValues.environment.description,
            identifier: initialValues.environment.identifier || '',
            name: initialValues.environment.name || '',
            tags: initialValues.environment.tags,
            type: initialValues.environment.type || 'PreProduction'
          })
        }
      }
      setEnvironments(envList)
    }
  }, [loading, environmentsResponse, environmentsResponse?.data?.content?.length])

  if (error?.message) {
    showError(getRBACErrorMessage(error), undefined, 'cd.env.list.error')
  }

  const { expressions } = useVariablesExpression()

  const [canEdit] = usePermission({
    resource: {
      resourceType: ResourceType.ENVIRONMENT,
      resourceIdentifier: environments ? (environments[0]?.identifier as string) : ''
    },
    permissions: [PermissionIdentifier.EDIT_ENVIRONMENT],
    options: {
      skipCondition: ({ resourceIdentifier }) => !resourceIdentifier
    }
  })

  const [canCreate] = usePermission({
    resource: {
      resourceType: ResourceType.ENVIRONMENT
    },
    permissions: [PermissionIdentifier.EDIT_ENVIRONMENT]
  })

  const { subscribeForm, unSubscribeForm } = React.useContext(StageErrorContext)

  const formikRef = React.useRef<FormikProps<unknown> | null>(null)

  React.useEffect(() => {
    subscribeForm({ tab: DeployTabs.INFRASTRUCTURE, form: formikRef })
    return () => unSubscribeForm({ tab: DeployTabs.INFRASTRUCTURE, form: formikRef })
  }, [])

  const environmentRef = initialValues?.environment?.identifier || initialValues?.environmentRef

  const [type, setType] = React.useState<MultiTypeInputType>(getMultiTypeFromValue(environmentRef))

  return (
    <>
      <Formik<DeployEnvData>
        formName="deployEnvStepForm"
        onSubmit={noop}
        validate={values => {
          if (!isEmpty(values.environment)) {
            onUpdate?.({ ...omit(values, 'environmentRef') })
          } else {
            onUpdate?.({ ...omit(values, 'environment'), environmentRef: values.environmentRef })
          }
        }}
        initialValues={{
          ...initialValues,
          ...{ environmentRef }
        }}
        validationSchema={Yup.object().shape({
          environmentRef: getEnvironmentRefSchema(getString)
        })}
      >
        {formik => {
          window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: DeployTabs.INFRASTRUCTURE }))
          formikRef.current = formik as FormikProps<unknown> | null
          const { values, setFieldValue } = formik
          return (
            <FormikForm>
              <Layout.Horizontal
                className={css.formRow}
                spacing="medium"
                flex={{ alignItems: flexStart, justifyContent: flexStart }}
              >
                <FormInput.MultiTypeInput
                  label={getString('cd.pipelineSteps.environmentTab.specifyYourEnvironment')}
                  tooltipProps={{ dataTooltipId: 'specifyYourEnvironment' }}
                  name="environmentRef"
                  useValue
                  disabled={readonly || (type === MultiTypeInputType.FIXED && loading)}
                  placeholder={
                    loading ? getString('loading') : getString('cd.pipelineSteps.environmentTab.selectEnvironment')
                  }
                  multiTypeInputProps={{
                    onTypeChange: setType,
                    width: 300,
                    onChange: val => {
                      if (
                        values.environment?.identifier &&
                        (val as SelectOption).value !== values.environment.identifier
                      ) {
                        setEnvironments(environments?.filter(env => env.identifier !== values.environment?.identifier))
                        setFieldValue('environment', undefined)
                      }
                    },
                    selectProps: {
                      addClearBtn: !readonly,
                      items: selectOptions || []
                    },
                    expressions,
                    allowableTypes
                  }}
                  selectItems={selectOptions || []}
                />
                {type === MultiTypeInputType.FIXED && (
                  <Button
                    size={ButtonSize.SMALL}
                    variation={ButtonVariation.LINK}
                    disabled={readonly || (isEditEnvironment(values) ? !canEdit : !canCreate)}
                    onClick={() => {
                      const isEdit = isEditEnvironment(values)
                      if (isEdit) {
                        if (values.environment?.identifier) {
                          setState({
                            isEdit,
                            formik,
                            isEnvironment: true,
                            data: values.environment
                          })
                        } else {
                          setState({
                            isEdit,
                            formik,
                            isEnvironment: false,
                            data: environments?.find(env => env.identifier === values.environmentRef)
                          })
                        }
                      } else {
                        setState({
                          isEdit: false,
                          isEnvironment: false,
                          formik
                        })
                      }
                      showModal()
                    }}
                    text={
                      isEditEnvironment(values)
                        ? getString('editEnvironment')
                        : getString('cd.pipelineSteps.environmentTab.plusNewEnvironment')
                    }
                    id={isEditEnvironment(values) ? 'edit-environment' : 'add-new-environment'}
                  />
                )}
              </Layout.Horizontal>
            </FormikForm>
          )
        }}
      </Formik>
    </>
  )
}

const DeployEnvironmentInputStep: React.FC<DeployEnvironmentProps & { formik?: any }> = ({
  inputSetData,
  initialValues,
  formik,
  allowableTypes
}) => {
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<
    PipelineType<{
      orgIdentifier: string
      projectIdentifier: string
      pipelineIdentifier: string
      accountId: string
    }>
  >()

  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const [state, setState] = React.useState<DeployEnvironmentState>({
    isEdit: false,
    isEnvironment: false,
    data: { name: '', identifier: '' }
  })
  const { expressions } = useVariablesExpression()
  const {
    data: environmentsResponse,
    error,
    refetch
  } = useGetEnvironmentAccessList({
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier },
    lazy: true
  })
  const [environments, setEnvironments] = React.useState<SelectOption[]>([])

  React.useEffect(() => {
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={onClose}
        isCloseButtonShown
        title={state.isEdit ? getString('editEnvironment') : getString('newEnvironment')}
        className={'padded-dialog'}
      >
        <NewEditEnvironmentModal
          data={{
            name: defaultTo(state.data?.name, ''),
            identifier: defaultTo(state.data?.identifier, ''),
            orgIdentifier,
            projectIdentifier,
            ...state.data
          }}
          isEnvironment={state.isEnvironment}
          isEdit={state.isEdit}
          onCreateOrUpdate={values => {
            refetch()
            formik?.setFieldValue(
              `${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}environmentRef`,
              values.identifier
            )
            onClose.call(null)
          }}
          closeModal={onClose}
        />
      </Dialog>
    ),
    [state]
  )
  const onClose = React.useCallback(() => {
    setState({ isEdit: false, isEnvironment: false })
    hideModal()
  }, [hideModal])

  React.useEffect(() => {
    if (environmentsResponse?.data?.length) {
      setEnvironments(
        environmentsResponse.data.map(env => ({
          label: env.environment?.name || env.environment?.identifier || '',
          value: env.environment?.identifier || ''
        }))
      )
    }
  }, [environmentsResponse, environmentsResponse?.data?.length])
  const [canEdit] = usePermission({
    resource: {
      resourceType: ResourceType.ENVIRONMENT,
      resourceIdentifier: environments[0]?.value as string
    },
    permissions: [PermissionIdentifier.EDIT_ENVIRONMENT],
    options: {
      skipCondition: ({ resourceIdentifier }) => !resourceIdentifier
    }
  })

  const [canCreate] = usePermission({
    resource: {
      resourceType: ResourceType.ENVIRONMENT
    },
    permissions: [PermissionIdentifier.EDIT_ENVIRONMENT]
  })
  if (error?.message) {
    showError(getRBACErrorMessage(error), undefined, 'cd.env.list.error')
  }
  return (
    <>
      {getMultiTypeFromValue(inputSetData?.template?.environmentRef) === MultiTypeInputType.RUNTIME && (
        <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }}>
          <ExperimentalInput
            label={getString('cd.pipelineSteps.environmentTab.specifyYourEnvironment')}
            tooltipProps={{ dataTooltipId: 'specifyYourEnvironment' }}
            name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}environmentRef`}
            placeholder={getString('cd.pipelineSteps.environmentTab.selectEnvironment')}
            selectItems={environments}
            useValue
            multiTypeInputProps={{
              allowableTypes,
              selectProps: {
                addClearBtn: !inputSetData?.readonly,
                items: environments
              },
              expressions
            }}
            disabled={inputSetData?.readonly}
            className={css.inputWidth}
            formik={formik}
          />
          {getMultiTypeFromValue(initialValues?.environmentRef) === MultiTypeInputType.FIXED && (
            <Button
              size={ButtonSize.SMALL}
              variation={ButtonVariation.LINK}
              disabled={inputSetData?.readonly || (isEditEnvironment(initialValues) ? !canEdit : !canCreate)}
              onClick={() => {
                const isEdit = isEditEnvironment(initialValues)
                if (isEdit) {
                  setState({
                    isEdit,
                    isEnvironment: false,
                    data: environmentsResponse?.data?.filter(
                      env => env.environment?.identifier === initialValues.environmentRef
                    )?.[0]?.environment as EnvironmentResponseDTO
                  })
                }
                showModal()
              }}
              text={
                isEditEnvironment(initialValues)
                  ? getString('editEnvironment')
                  : getString('cd.pipelineSteps.environmentTab.plusNewEnvironment')
              }
            />
          )}
        </Layout.Horizontal>
      )}
    </>
  )
}
const DeployEnvironmentInputStepFormik = connect(DeployEnvironmentInputStep)
const EnvironmentRegex = /^.+stage\.spec\.infrastructure\.environmentRef$/
export class DeployEnvironmentStep extends Step<DeployEnvData> {
  lastFetched: number
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()
  constructor() {
    super()
    this.lastFetched = new Date().getTime()
    this.invocationMap.set(EnvironmentRegex, this.getEnvironmentListForYaml.bind(this))
  }

  protected getEnvironmentListForYaml(
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
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.infrastructure.environmentRef', ''))
      if (obj.type === 'Deployment') {
        return getEnvironmentListPromise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier
          }
        }).then(response => {
          const data =
            response?.data?.content?.map(service => ({
              label: service.environment?.name || '',
              insertText: service.environment?.identifier || '',
              kind: CompletionItemKind.Field
            })) || []
          return data
        })
      }
    }

    return new Promise(resolve => {
      resolve([])
    })
  }
  renderStep(props: StepProps<DeployEnvData>): JSX.Element {
    const { initialValues, onUpdate, stepViewType, inputSetData, readonly = false, allowableTypes } = props
    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <DeployEnvironmentInputStepFormik
          initialValues={initialValues}
          readonly={readonly}
          onUpdate={onUpdate}
          stepViewType={stepViewType}
          inputSetData={inputSetData}
          allowableTypes={allowableTypes}
        />
      )
    }
    return (
      <DeployEnvironmentWidget
        readonly={readonly}
        initialValues={initialValues}
        onUpdate={onUpdate}
        stepViewType={stepViewType}
        allowableTypes={allowableTypes}
      />
    )
  }
  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<DeployEnvData>): FormikErrors<DeployEnvData> {
    const errors: FormikErrors<DeployEnvData> = {}
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    if (
      isEmpty(data?.environmentRef) &&
      isRequired &&
      getMultiTypeFromValue(template?.environmentRef) === MultiTypeInputType.RUNTIME
    ) {
      errors.environmentRef = getString?.('cd.pipelineSteps.environmentTab.environmentIsRequired')
    }
    return errors
  }
  protected stepPaletteVisible = false
  protected type = StepType.DeployEnvironment
  protected stepName = 'Deploy Environment'
  protected stepIcon: IconName = 'main-environments'

  protected defaultValues: DeployEnvData = {}
}
