/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { SetStateAction, Dispatch } from 'react'
import {
  Formik,
  FormInput,
  FormikForm,
  MultiTypeInputType,
  Accordion,
  Container,
  SelectOption,
  Text,
  Layout,
  RUNTIME_INPUT_VALUE
} from '@wings-software/uicore'
import type { FormikProps } from 'formik'
import { FontVariation, Color } from '@harness/design-system'
import { get } from 'lodash-es'
import type { StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'
import cx from 'classnames'
import { setFormikRef } from '@pipeline/components/AbstractSteps/Step'
import type { ConnectorInfoDTO } from 'services/cd-ng'
import { useParams } from 'react-router-dom'
import { useQueryParams } from '@common/hooks'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { useStrings, UseStringsReturn } from 'framework/strings'
import StepCommonFields, {
  GetImagePullPolicyOptions
} from '@ci/components/PipelineSteps/StepCommonFields/StepCommonFields'
import { getConnectorRefWidth, isRuntimeInput, CodebaseTypes } from '@pipeline/utils/CIUtils'
import { sslVerifyOptions } from '@pipeline/utils/constants'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import {
  getInitialValuesInCorrectFormat,
  getFormValuesInCorrectFormat
} from '@pipeline/components/PipelineSteps/Steps/StepsTransformValuesUtils'
import { validate } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import {
  getBuildTypeLabels,
  getBuildTypeInputLabels,
  CodeBaseType
} from '@pipeline/components/PipelineInputSetForm/CICodebaseInputSetForm'

import {
  renderConnectorAndRepoName,
  runtimeInputGearWidth,
  CodebaseRuntimeInputsInterface
} from '@pipeline/components/PipelineStudio/RightBar/RightBarUtils'
import { getOptionalSubLabel } from '@pipeline/components/Volumes/Volumes'
import { CIStepOptionalConfig } from '../CIStep/CIStepOptionalConfig'
import { FormMultiTypeRadioGroupField } from '@common/components/MultiTypeRadioGroup/MultiTypeRadioGroup'
import { transformValuesFieldsConfig, getEditViewValidateFieldsConfig } from './GitCloneStepFunctionConfigs'
import type { GitCloneStepProps, GitCloneStepData, GitCloneStepDataUI } from './GitCloneStep'
import { CIStep } from '../CIStep/CIStep'
import { AllMultiTypeInputTypesForStep, useGetPropagatedStageById } from '../CIStep/StepUtils'
import type { CIBuildInfrastructureType } from '../../../constants/Constants'
import css from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import { MultiTypeTextField } from '@common/components/MultiTypeText/MultiTypeText'
import { MultiTypeSelectField } from '@common/components/MultiTypeSelect/MultiTypeSelect'

const renderCodeBaseTypeInput = ({
  type,
  inputLabels,
  readonly,
  expressions
}: {
  type: CodeBaseType
  inputLabels: Record<string, string>
  readonly?: boolean
  expressions?: string[]
}): JSX.Element => {
  const newType = type === CodebaseTypes.PR ? 'number' : type
  return (
    <Container className={cx(css.lg, css.formGroup)}>
      <FormInput.MultiTextInput
        label={<Text font={{ variation: FontVariation.FORM_LABEL }}>{inputLabels[type]}</Text>}
        name={`spec.build.spec.${newType}`}
        multiTextInputProps={{
          expressions,
          allowableTypes: AllMultiTypeInputTypesForStep
        }}
        disabled={readonly}
        className={css.bottomMargin1}
      />
    </Container>
  )
}

export const renderBuild = ({
  expressions,
  readonly,
  getString,
  codeBaseType,
  setCodeBaseType,
  formik
}: {
  expressions: string[]
  setCodeBaseType: Dispatch<SetStateAction<CodeBaseType | string | undefined>>
  codeBaseType?: CodeBaseType | string
  getString: UseStringsReturn['getString']
  formik: any
  connectorType?: ConnectorInfoDTO['type']
  readonly?: boolean
}) => {
  const radioLabels = getBuildTypeLabels(getString)
  const inputLabels = getBuildTypeInputLabels(getString)
  // TO delete after InputSetForm
  // const formattedPath = ''
  // const buildPath = 'spec.build'
  // const buildPath = `${formattedPath}properties.ci.codebase.build`
  // const buildSpecPath = `${formattedPath}properties.ci.codebase.build.spec`
  // const codeBaseTypePath = `spec.build.type`
  // const [codeBaseType, setCodeBaseType] = React.useState<CodeBaseType | undefined>(
  //   get(formik?.values, codeBaseTypePath)
  // )
  // const buildTypeError = formik?.errors?.spec?.build?.type
  // const savedValues = React.useRef<Record<string, string>>({
  //   branch: '',
  //   tag: '',
  //   PR: ''
  // })

  // Maybe don't need
  // React.useEffect(() => {
  //   // OnEdit Case, persists saved ciCodebase build spec
  //   if (codeBaseType) {
  //     savedValues.current = Object.assign(savedValues.current, {
  //       [codeBaseType]: get(
  //         formik?.values,
  //         `${formattedPath}properties.ci.codebase.build.spec.${buildTypeInputNames[codeBaseType]}`,
  //         ''
  //       )
  //     })
  //     formik?.setFieldValue(buildSpecPath, { [buildTypeInputNames[codeBaseType]]: savedValues.current[codeBaseType] })
  //   }
  // }, [codeBaseType])

  // React.useEffect(() => {
  //   if (formik?.values?.spec?.connectorRef === RUNTIME_INPUT_VALUE) {
  //     formik?.setFieldValue(buildPath, RUNTIME_INPUT_VALUE)
  //     // set build as <+input>
  //   }
  // }, [formik?.values?.spec?.connectorRef])

  const handleTypeChange = (newType: any = CodebaseTypes.branch): void => {
    const newValuesSpec = formik.values.spec
    if (isRuntimeInput(newType)) {
      newValuesSpec.build = newType
    } else {
      newValuesSpec.build = { type: newType }
    }
    if (newValuesSpec.build?.spec) {
      delete newValuesSpec.build.spec.branch
      delete newValuesSpec.build.spec.tag
      delete newValuesSpec.build.spec.number
    }

    formik?.setValues({ ...formik.values, spec: newValuesSpec })
    setCodeBaseType(newType)
  }

  // React.useEffect(() => {
  //   if (get(formik?.values, buildPath) === RUNTIME_INPUT_VALUE) {
  //     setCodeBaseType(undefined)
  //   }
  // }, [get(formik?.values, buildPath)])

  return (
    <Container
      className={cx(css.lg, css.topMargin5, !isRuntimeInput(formik?.values?.spec?.build) && css.bottomMargin5)}
    >
      <Container width={385}>
        <FormMultiTypeRadioGroupField
          name="spec.build.type"
          label={getString('filters.executions.buildType')}
          options={[
            { label: radioLabels['branch'], value: CodebaseTypes.branch },
            { label: radioLabels['tag'], value: CodebaseTypes.tag }
          ]}
          onChange={handleTypeChange}
          className={css.radioGroup}
          multiTypeRadioGroup={{
            name: 'spec.build.type',
            expressions,
            disabled: readonly,
            allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME]
          }}
        />
      </Container>
      {/* </Container> */}
      {/* {formik?.submitCount > 0 && buildTypeError ? (
        <FormError name="spec.build.type" errorMessage={buildTypeError} />
      ) : null} */}
      {/* <Container> */}
      {codeBaseType === CodebaseTypes.branch
        ? renderCodeBaseTypeInput({ inputLabels, type: codeBaseType, readonly })
        : null}
      {codeBaseType === CodebaseTypes.tag
        ? renderCodeBaseTypeInput({ inputLabels, type: codeBaseType, readonly })
        : null}
      {/* </Container> */}
    </Container>
  )
}

export const GitCloneStepBase = (
  { initialValues, onUpdate, isNewStep = true, readonly, stepViewType, onChange }: GitCloneStepProps,
  formikRef: StepFormikFowardRef<GitCloneStepData>
): JSX.Element => {
  const {
    state: {
      selectionState: { selectedStageId }
    },
    isReadonly
  } = usePipelineContext()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()

  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()

  const currentStage = useGetPropagatedStageById(selectedStageId || '')

  const buildInfrastructureType: CIBuildInfrastructureType = get(currentStage, 'stage.spec.infrastructure.type')
  const [connectionType, setConnectionType] = React.useState('')
  const [connectorUrl, setConnectorUrl] = React.useState('')
  const codebaseConnector = initialValues?.spec?.connectorRef
  // const connectorId = getIdentifierFromValue(codebaseConnector || '')
  // const initialScope = getScopeFromValue(codebaseConnector || '')
  const [codebaseRuntimeInputs, setCodebaseRuntimeInputs] = React.useState<CodebaseRuntimeInputsInterface>({
    ...(isRuntimeInput(codebaseConnector) && { connectorRef: true, repoName: true })
  })
  // const gitScope = useGitScope()

  // const {
  //   data: connector,
  //   loading,
  //   refetch
  // } = useGetConnector({
  //   identifier: connectorId,
  //   queryParams: {
  //     accountIdentifier: accountId,
  //     orgIdentifier: initialScope === Scope.ORG || initialScope === Scope.PROJECT ? orgIdentifier : undefined,
  //     projectIdentifier: initialScope === Scope.PROJECT ? projectIdentifier : undefined,
  //     ...(gitScope?.repo && gitScope.branch
  //       ? { repoIdentifier: gitScope.repo, branch: gitScope.branch, getDefaultFromOtherRepo: true }
  //       : {})
  //   },
  //   lazy: true,
  //   debounce: 300
  // })

  // if (connector?.data?.connector && initialValues?.spec) {
  //   const scope = getScopeFromDTO<ConnectorInfoDTO>(connector?.data?.connector)
  //   initialValues.connectorRef = {
  //     label: connector?.data?.connector.name || '',
  //     value: `${scope !== Scope.PROJECT ? `${scope}.` : ''}${connector?.data?.connector.identifier}`,
  //     scope: scope,
  //     live: connector?.data?.status?.status === 'SUCCESS',
  //     connector: connector?.data?.connector
  //   }
  // }

  // React.useEffect(() => {
  //   if (!loading && !isUndefined(connector)) {
  //     setConnectorType(get(connector, 'data.connector.type', '') as ConnectorInfoDTO['type'])
  //   }

  //   if (connector?.data?.connector) {
  //     setConnectionType(
  //       connector?.data?.connector?.type === Connectors.GIT
  //         ? connector?.data?.connector.spec.connectionType
  //         : connector?.data?.connector.spec.type
  //     )
  //     setConnectorUrl(connector?.data?.connector.spec.url)
  //     if (
  //       connector?.data?.connector?.spec?.type === ConnectionType.Repo ||
  //       connector?.data?.connector?.spec?.type === ConnectionType.Region
  //     ) {
  //       formik.setFieldValue(codeBaseInputFieldFormName.repoName, undefined)
  //     }
  //   }
  // }, [loading, connector])

  // React.useEffect(() => {
  //   const type = get(formik?.values, codeBaseTypePath) as CodeBaseType
  //   if (type) {
  //     setCodeBaseType(type)
  //   }
  //   const typeOfConnector = get(formik?.values, 'connectorRef.connector.type', '') as ConnectorInfoDTO['type']
  //   if (typeOfConnector) {
  //     setConnectorType(typeOfConnector)
  //   } else {
  //     let ctrRef = get(originalPipeline, 'properties.ci.codebase.connectorRef') as string
  //     if (isConnectorExpression) {
  //       return
  //     }
  //     if (isRuntimeInput(ctrRef)) {
  //       ctrRef = get(formik?.values, codeBaseInputFieldFormName.connectorRef, '')
  //     }

  //     setConnectorRef(ctrRef)
  //     setConnectorId(getIdentifierFromValue(ctrRef))
  //   }
  // }, [formik?.values])

  // React.useEffect(() => {
  //   if (!isEmpty(codebaseConnector)) {
  //     refetch()
  //   }
  // }, [codebaseConnector])

  return (
    <Formik
      initialValues={getInitialValuesInCorrectFormat<GitCloneStepData, GitCloneStepDataUI>(
        initialValues,
        transformValuesFieldsConfig,
        { imagePullPolicyOptions: GetImagePullPolicyOptions() }
      )}
      formName="GitCloneStep"
      validate={valuesToValidate => {
        const schemaValues = getFormValuesInCorrectFormat<GitCloneStepDataUI, GitCloneStepData>(
          valuesToValidate,
          transformValuesFieldsConfig
        )
        onChange?.(schemaValues)
        return validate(
          valuesToValidate,
          getEditViewValidateFieldsConfig(
            !isRuntimeInput(valuesToValidate?.spec?.connectorRef) && !isRuntimeInput(valuesToValidate?.spec?.build)
          ),
          {
            initialValues,
            steps: currentStage?.stage?.spec?.execution?.steps || {},
            serviceDependencies: currentStage?.stage?.spec?.serviceDependencies || {},
            getString
          },
          stepViewType
        )
      }}
      onSubmit={(_values: GitCloneStepDataUI) => {
        const schemaValues = getFormValuesInCorrectFormat<GitCloneStepDataUI, GitCloneStepData>(
          _values,
          transformValuesFieldsConfig
        )
        onUpdate?.(schemaValues)
      }}
    >
      {(formik: FormikProps<GitCloneStepData>) => {
        // This is required
        setFormikRef?.(formikRef, formik)
        const connectorWidth = getConnectorRefWidth('DefaultView')
        const connectorRefValue = formik.values.spec?.connectorRef
        const isConnectorRuntimeInput = isRuntimeInput(connectorRefValue)
        const codeBaseTypePath = `spec.build.type`
        const [codeBaseType, setCodeBaseType] = React.useState<CodeBaseType | string | undefined>(
          get(formik?.values, codeBaseTypePath)
        )
        React.useEffect(() => {
          if (formik?.values?.spec?.connectorRef === RUNTIME_INPUT_VALUE) {
            const newValuesSpec = { ...formik?.values?.spec }
            newValuesSpec.repoName = RUNTIME_INPUT_VALUE
            // newValuesSpec.build
            // const newBuildValue = { ...formik?.values?.spec?.build }
            // newBuildValue.spec = RUNTIME_INPUT_VALUE
            // spec.build and reponame
            // formik?.setFieldValue(buildPath, RUNTIME_INPUT_VALUE)
            formik?.setValues({ ...formik?.values, spec: newValuesSpec })
            // set build as <+input>
            setCodeBaseType(undefined)
          }
        }, [formik?.values?.spec?.connectorRef])
        return (
          <FormikForm>
            <CIStep
              isNewStep={isNewStep}
              readonly={readonly}
              stepViewType={stepViewType}
              enableFields={{
                name: {},
                description: {},
                ['spec.connectorAndRepo']: {
                  connectorUrl,
                  connectionType,
                  connectorWidth: isConnectorRuntimeInput ? connectorWidth - runtimeInputGearWidth : connectorWidth,
                  setConnectionType,
                  setConnectorUrl,
                  repoIdentifier,
                  branch,
                  isReadonly,
                  setCodebaseRuntimeInputs,
                  codebaseRuntimeInputs,
                  connectorAndRepoNamePath: 'spec'
                },
                ['spec.build']: { setCodeBaseType, codeBaseType },
                ['spec.cloneDirectory']: { tooltipId: 'cloneDirectory' }
              }}
              formik={formik}
            />
            {/* {renderConnectorAndRepoName({
              values: formik.values,
              setFieldValue: formik.setFieldValue,
              connectorUrl,
              connectionType,
              connectorWidth: isConnectorRuntimeInput ? connectorWidth - runtimeInputGearWidth : connectorWidth,
              setConnectionType,
              setConnectorUrl,
              getString,
              errors: formik.errors,
              loading: false,
              accountId,
              projectIdentifier,
              orgIdentifier,
              repoIdentifier,
              branch,
              expressions,
              isReadonly,
              setCodebaseRuntimeInputs,
              codebaseRuntimeInputs,
              connectorAndRepoNamePath: 'spec',
              classnames: cx(css.formGroup, css.lg, css.bottomMargin5)
            })} */}

            {/* {renderBuild({
              expressions,
              readonly,
              getString,
              formik,
              setCodeBaseType,
              codeBaseType
            })} */}
            {/* <Container className={cx(css.lg, css.formGroup)}>
              <FormInput.MultiTextInput
                name="spec.cloneDirectory"
                label={getString('pipeline.gitCloneStep.cloneDirectory')}
                multiTextInputProps={{
                  expressions,
                  allowableTypes: AllMultiTypeInputTypesForStep
                }}
                style={{ marginBottom: 0, flexGrow: 1 }}
              />
            </Container> */}
            <Accordion className={css.accordion}>
              <Accordion.Panel
                id="optional-config"
                summary={getString('common.optionalConfig')}
                details={
                  <Container margin={{ top: 'medium' }}>
                    <CIStepOptionalConfig
                      stepViewType={stepViewType}
                      readonly={readonly}
                      enableFields={{
                        'spec.depth': {},
                        'spec.sslVerify': {}
                      }}
                    />
                    <StepCommonFields disabled={readonly} buildInfrastructureType={buildInfrastructureType} />
                  </Container>
                }
              />
            </Accordion>
          </FormikForm>
        )
      }}
    </Formik>
  )
}

export const GitCloneStepBaseWithRef = React.forwardRef(GitCloneStepBase)
