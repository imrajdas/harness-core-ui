/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import {
  Button,
  ButtonVariation,
  Color,
  Container,
  FontVariation,
  FormError,
  FormInput,
  Icon,
  Layout,
  Text
} from '@harness/uicore'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Form, FormikContextType, FormikProps } from 'formik'
import { useParams } from 'react-router-dom'
import { defaultTo, set } from 'lodash-es'
import produce from 'immer'
import { useStrings } from 'framework/strings'
import TextReference, { TextReferenceInterface, ValueType } from '@secrets/components/TextReference/TextReference'
import type { SecretReferenceInterface } from '@secrets/utils/SecretField'
import { buildKubPayload, DelegateTypes } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { AuthTypes } from '@connectors/pages/connectors/utils/ConnectorHelper'
import SecretInput from '@secrets/components/SecretInput/SecretInput'
import { TestStatus } from '@common/components/TestConnectionWidget/TestConnectionWidget'
import {
  DelegateOptions,
  DelegateSelector,
  DelegatesFoundState
} from '@connectors/components/CreateConnector/commonSteps/DelegateSelectorStep/DelegateSelector/DelegateSelector'
import { Connectors } from '@connectors/constants'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import type { ResponseConnectorResponse, ResponseMessage } from 'services/cd-ng'
import useCreateEditConnector, { BuildPayloadProps } from '@connectors/hooks/useCreateEditConnector'
import VerifyOutOfClusterDelegate from '@connectors/common/VerifyOutOfClusterDelegate/VerifyOutOfClusterDelegate'
import { CLIENT_KEY_ALGO_OPTIONS } from '../DeployProvisioningWizard/Constants'
import { getUniqueEntityIdentifier } from '../cdOnboardingUtils'
import { useCDOnboardingContext } from '../CDOnboardingStore'
import commonStyles from '@connectors/components/CreateConnector/commonSteps/ConnectorCommonStyles.module.scss'
import css from '../DeployProvisioningWizard/DeployProvisioningWizard.module.scss'

interface DelegateSelectorStepData extends BuildPayloadProps {
  delegateSelectors: Array<string>
}

export interface SelectAuthenticationMethodRef {
  values: SelectAuthenticationMethodInterface
  validate: () => boolean
  connectorResponse?: ResponseConnectorResponse
  submitForm?: FormikProps<SelectAuthenticationMethodInterface>['submitForm']
}

export type SelectAuthMethodForwardRef =
  | ((instance: SelectAuthenticationMethodRef | null) => void)
  | React.MutableRefObject<SelectAuthenticationMethodRef | null>
  | null

export interface SelectAuthenticationMethodInterface {
  connectorName: string
  connectorIdentifier?: string
  delegateType: string
  masterUrl: string
  authType?: string
  username: TextReferenceInterface | void
  password: SecretReferenceInterface | void
  serviceAccountToken: SecretReferenceInterface | void
  oidcIssuerUrl: string
  oidcUsername: TextReferenceInterface | void
  oidcPassword: SecretReferenceInterface | void
  oidcCleintId: SecretReferenceInterface | void
  oidcCleintSecret: SecretReferenceInterface | void
  oidcScopes: string
  clientKey: SecretReferenceInterface | void
  clientKeyPassphrase: SecretReferenceInterface | void
  clientKeyCertificate: SecretReferenceInterface | void
  clientKeyAlgo: string
  clientKeyCACertificate: SecretReferenceInterface | void
}

interface AuthOptionInterface {
  label: string
  value: string
}

interface SelectAuthenticationMethodProps {
  disableNextBtn: () => void
  enableNextBtn: () => void
  authValues?: SelectAuthenticationMethodInterface

  onSuccess?: (value: any) => void
  formikProps: FormikProps<any>
}

const SelectAuthenticationMethodRef = (
  props: SelectAuthenticationMethodProps,
  forwardRef: SelectAuthMethodForwardRef
): React.ReactElement => {
  const scrollRef = useRef<Element>()
  const { getString } = useStrings()
  const formikRef = useRef<FormikContextType<SelectAuthenticationMethodInterface>>()
  const { formikProps } = props
  const validateAuthMethodSetup = (): boolean => {
    const {
      connectorName,
      delegateType,
      masterUrl,
      authType,
      username,
      password,
      serviceAccountToken,
      oidcCleintId,
      oidcIssuerUrl,
      oidcPassword,
      oidcUsername,
      clientKey,
      clientKeyCertificate,
      clientKeyAlgo
    } = formikProps?.values || {}
    if (!delegateType || !connectorName) {
      return false
    } else if (delegateType === DelegateTypes.DELEGATE_OUT_CLUSTER) {
      if (!masterUrl) return false
      else if (masterUrl) {
        if (authType === AuthTypes.USER_PASSWORD) {
          if (!username || !password) return false
        }
        if (authType === AuthTypes.SERVICE_ACCOUNT) {
          if (!serviceAccountToken) return false
        }
        if (authType === AuthTypes.OIDC) {
          if (!oidcCleintId || !oidcIssuerUrl || !oidcPassword || !oidcUsername) return false
        }
        if (authType === AuthTypes.CLIENT_KEY_CERT) {
          if (!clientKey || !clientKeyAlgo || !clientKeyCertificate) return false
        }
      }
    }
    return true
  }

  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const isDelegateSelectorMandatory = (): boolean => {
    return DelegateTypes.DELEGATE_IN_CLUSTER === formikProps?.values?.delegateType
  }

  const [delegateSelectors, setDelegateSelectors] = useState<Array<string>>([])
  const [mode, setMode] = useState<DelegateOptions>(
    delegateSelectors.length || isDelegateSelectorMandatory()
      ? DelegateOptions.DelegateOptionsSelective
      : DelegateOptions.DelegateOptionsAny
  )
  const [connectorResponse, setConnectorResponse] = useState<ResponseConnectorResponse>()
  const [delegatesFound, setDelegatesFound] = useState<DelegatesFoundState>(DelegatesFoundState.ActivelyConnected)
  const [testConnectionStatus, setTestConnectionStatus] = useState<TestStatus>(TestStatus.NOT_INITIATED)
  const [testConnectionErrors, setTestConnectionErrors] = useState<ResponseMessage[]>()

  const {
    saveEnvironmentData,
    state: { environment: environmentData }
  } = useCDOnboardingContext()

  const defaultInitialFormData: SelectAuthenticationMethodInterface = {
    authType: AuthTypes.USER_PASSWORD,
    delegateType: '',
    masterUrl: '',
    username: undefined,
    password: undefined,
    serviceAccountToken: undefined,
    oidcIssuerUrl: '',
    oidcUsername: undefined,
    oidcPassword: undefined,
    oidcCleintId: undefined,
    oidcCleintSecret: undefined,
    oidcScopes: '',
    clientKey: undefined,
    clientKeyCertificate: undefined,
    clientKeyPassphrase: undefined,
    clientKeyAlgo: '',
    clientKeyCACertificate: undefined,
    connectorName: ''
  }

  const afterSuccessHandler = (response: ResponseConnectorResponse): void => {
    if (response?.status === 'SUCCESS') {
      setConnectorResponse(response)
      setTestConnectionStatus(TestStatus.SUCCESS)
    } else {
      setTestConnectionStatus(TestStatus.FAILED)
    }
  }

  const { onInitiate, loading } = useCreateEditConnector<DelegateSelectorStepData>({
    accountId,
    isEditMode: false,
    isGitSyncEnabled: false,
    afterSuccessHandler
  })

  useEffect(() => {
    if (scrollRef) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [testConnectionErrors?.length])

  useEffect(() => {
    if (validateAuthMethodSetup()) {
      setTestConnectionStatus(TestStatus.NOT_INITIATED)
    }
  }, [formikProps?.values?.delegateType])

  const TestConnection = (): React.ReactElement => {
    switch (testConnectionStatus) {
      case TestStatus.FAILED:
      case TestStatus.NOT_INITIATED:
        return (
          <Layout.Vertical>
            <Button
              variation={ButtonVariation.PRIMARY}
              text={getString('common.smtp.testConnection')}
              width={300}
              type="submit"
              disabled={
                (isDelegateSelectorMandatory() && delegateSelectors.length === 0) ||
                (mode === DelegateOptions.DelegateOptionsSelective && delegateSelectors.length === 0) ||
                loading
              }
              onClick={() => {
                if (validateAuthMethodSetup()) {
                  setTestConnectionStatus(TestStatus.IN_PROGRESS)
                  setTestConnectionErrors([])
                  // formikRef.current?.submitForm()
                  const authValues = formikProps?.values

                  const connectorIdentifier = getUniqueEntityIdentifier(authValues.connectorName)
                  const connectorData = {
                    ...authValues,
                    name: authValues.connectorName,
                    identifier: connectorIdentifier,
                    projectIdentifier: projectIdentifier,
                    orgIdentifier: orgIdentifier,
                    delegateSelectors: mode === DelegateOptions.DelegateOptionsAny ? [] : delegateSelectors
                  }
                  formikProps.setFieldValue('connectorIdentifier', connectorIdentifier)
                  onInitiate({
                    connectorFormData: connectorData,
                    buildPayload: buildKubPayload
                  })
                }
              }}
            />
          </Layout.Vertical>
        )
      case TestStatus.IN_PROGRESS:
        return (
          <Layout.Horizontal flex={{ alignItems: 'center', justifyContent: 'flex-start' }} spacing="small">
            <Icon name="steps-spinner" color={Color.PRIMARY_7} />
            <Text font={{ variation: FontVariation.BODY2 }} color={Color.PRIMARY_7}>
              {getString('common.test.inProgress')}
            </Text>
          </Layout.Horizontal>
        )
      case TestStatus.SUCCESS:
        return (
          <Layout.Horizontal flex={{ alignItems: 'center', justifyContent: 'flex-start' }} spacing="small">
            <Icon name="success-tick" />
            <Text font={{ variation: FontVariation.BODY2 }} color={Color.GREEN_700}>
              {getString('common.test.connectionSuccessful')}
            </Text>
          </Layout.Horizontal>
        )
      default:
        return <></>
    }
  }

  const setForwardRef = ({
    values
  }: // setFieldTouched
  Omit<SelectAuthenticationMethodRef, 'validate'>): void => {
    if (!forwardRef) {
      return
    }
    if (typeof forwardRef === 'function') {
      return
    }

    if (values) {
      forwardRef.current = {
        values,
        connectorResponse,
        validate: validateAuthMethodSetup,
        submitForm: formikProps?.submitForm
      }
    }
  }

  useEffect(() => {
    if (formikRef.current?.values && formikRef.current?.setFieldTouched) {
      setForwardRef({
        values: formikRef.current.values
      })
    }
  }, [formikRef.current?.values])

  const authOptions: Array<AuthOptionInterface> = [
    {
      label: getString('usernamePassword'),
      value: AuthTypes.USER_PASSWORD
    },
    {
      label: getString('serviceAccount'),
      value: AuthTypes.SERVICE_ACCOUNT
    },
    {
      label: getString('connectors.k8.authLabels.OIDC'),
      value: AuthTypes.OIDC
    },
    {
      label: getString('connectors.k8.authLabels.clientKeyCertificate'),
      value: AuthTypes.CLIENT_KEY_CERT
    }
  ]

  const renderK8AuthForm = useCallback((props: FormikProps<SelectAuthenticationMethodInterface>): JSX.Element => {
    switch (props.values.authType) {
      case AuthTypes.USER_PASSWORD:
        return (
          <Container width={'42%'}>
            <TextReference
              name="username"
              stringId="username"
              type={props.values.username ? props.values.username?.type : ValueType.TEXT}
            />
            <SecretInput name={'password'} label={getString('password')} />
          </Container>
        )
      case AuthTypes.SERVICE_ACCOUNT:
        return (
          <Container className={css.authFormField}>
            <SecretInput name={'serviceAccountToken'} label={getString('connectors.k8.serviceAccountToken')} />
            <SecretInput name={'clientKeyCACertificate'} label={getString('connectors.k8.clientKeyCACertificate')} />
          </Container>
        )
      case AuthTypes.OIDC:
        return (
          <>
            <FormInput.Text
              name="oidcIssuerUrl"
              label={getString('connectors.k8.OIDCIssuerUrl')}
              className={css.authFormField}
            />
            <Container flex={{ justifyContent: 'flex-start' }}>
              <Container width={'42%'}>
                <TextReference
                  name="oidcUsername"
                  stringId="connectors.k8.OIDCUsername"
                  type={props.values.oidcUsername ? props.values.oidcUsername.type : ValueType.TEXT}
                />

                <SecretInput name={'oidcPassword'} label={getString('connectors.k8.OIDCPassword')} />
              </Container>

              <Container width={'42%'} margin={{ top: 'medium', left: 'xxlarge' }}>
                <SecretInput name={'oidcCleintId'} label={getString('connectors.k8.OIDCClientId')} />
                <SecretInput name={'oidcCleintSecret'} label={getString('connectors.k8.clientSecretOptional')} />
              </Container>
            </Container>

            <FormInput.Text
              name="oidcScopes"
              label={getString('connectors.k8.OIDCScopes')}
              className={css.authFormField}
            />
          </>
        )

      case AuthTypes.CLIENT_KEY_CERT:
        return (
          <>
            <Container flex={{ justifyContent: 'flex-start' }}>
              <Container className={css.authFormField}>
                <SecretInput name={'clientKey'} label={getString('connectors.k8.clientKey')} />
                <SecretInput name={'clientKeyCertificate'} label={getString('connectors.k8.clientCertificate')} />
              </Container>

              <Container className={css.authFormField} margin={{ left: 'xxlarge' }}>
                <SecretInput name={'clientKeyPassphrase'} label={getString('connectors.k8.clientKeyPassphrase')} />
                <FormInput.Select
                  items={CLIENT_KEY_ALGO_OPTIONS}
                  name="clientKeyAlgo"
                  label={getString('connectors.k8.clientKeyAlgorithm')}
                  value={
                    // If we pass the value as undefined, formik will kick in and value will be updated as per uicore logic
                    // If we've added a custom value, then just add it as a label value pair
                    CLIENT_KEY_ALGO_OPTIONS.find(opt => opt.value === props.values.clientKeyAlgo)
                      ? undefined
                      : { label: props.values.clientKeyAlgo, value: props.values.clientKeyAlgo }
                  }
                  selectProps={{
                    allowCreatingNewItems: true,
                    inputProps: {
                      placeholder: getString('connectors.k8.clientKeyAlgorithmPlaceholder')
                    }
                  }}
                />
              </Container>
            </Container>
            <Container>
              <SecretInput name={'clientKeyCACertificate'} label={getString('connectors.k8.clientKeyCACertificate')} />
            </Container>
          </>
        )
      default:
        return <></>
    }
  }, [])

  const handleSubmit = async (
    values: SelectAuthenticationMethodInterface
  ): Promise<SelectAuthenticationMethodInterface> => {
    const connectorData = {
      ...values,
      name: values.connectorName,
      identifier: getUniqueEntityIdentifier(values.connectorName),
      projectIdentifier: projectIdentifier,
      orgIdentifier: orgIdentifier,
      delegateSelectors: mode === DelegateOptions.DelegateOptionsAny ? [] : delegateSelectors
    }
    onInitiate({
      connectorFormData: connectorData,
      buildPayload: buildKubPayload
    })

    const updatedContextService = produce(environmentData as any, (draft: any) => {
      set(draft, 'data.authValue', connectorData)
    })

    saveEnvironmentData({ environment: updatedContextService })
    const data = props?.onSuccess?.(connectorData) || {}
    return Promise.resolve(data as any)
  }

  return (
    <Layout.Vertical width="70%">
      {/* <Formik<SelectAuthenticationMethodInterface>
        initialValues={{
          ...defaultInitialFormData,
          connectorName: defaultTo(authValues?.connectorName, '')
        }}
        formName="infraAuthentication"
        onSubmit={handleSubmit}
      >
        {formikProps => {
          formikRef.current = formikProps

          return ( */}
      <Form>
        <Layout.Vertical>
          <FormInput.Text
            label={getString('name')}
            name="connectorName"
            tooltipProps={{ dataTooltipId: 'connectorDetailsStepFormK8sCluster_name' }}
            className={css.formInput}
          />
          <Layout.Horizontal spacing="medium">
            <Button
              className={css.credentialsButton}
              round
              text={getString('connectors.k8.delegateOutClusterInfo')}
              onClick={() => {
                formikProps?.setFieldValue('delegateType', DelegateTypes.DELEGATE_OUT_CLUSTER)
                setTestConnectionStatus(TestStatus.NOT_INITIATED)
              }}
              intent={DelegateTypes.DELEGATE_OUT_CLUSTER === formikProps.values.delegateType ? 'primary' : 'none'}
            />
            <Button
              className={css.credentialsButton}
              round
              text={'Use from a specific harness Delegate'}
              onClick={() => {
                formikProps?.setFieldValue('delegateType', DelegateTypes.DELEGATE_IN_CLUSTER)
                setTestConnectionStatus(TestStatus.NOT_INITIATED)
              }}
              intent={DelegateTypes.DELEGATE_IN_CLUSTER === formikProps.values.delegateType ? 'primary' : 'none'}
            />
          </Layout.Horizontal>
          {formikProps.touched.delegateType && !formikProps.values.delegateType ? (
            <Container padding={{ top: 'xsmall' }}>
              <FormError
                name={'delegateType'}
                errorMessage={getString('connectors.chooseMethodForConnection', {
                  name: getString('connectors.k8sConnection')
                })}
              />
            </Container>
          ) : null}
          {DelegateTypes.DELEGATE_OUT_CLUSTER === formikProps.values.delegateType ? (
            <Layout.Vertical margin={{ bottom: 'small' }}>
              <FormInput.Text
                label={getString('connectors.k8.masterUrlLabel')}
                placeholder={getString('UrlLabel')}
                name="masterUrl"
                className={css.authFormField}
                tooltipProps={{ dataTooltipId: 'k8ClusterForm_masterUrl' }}
              />
              <Container className={css.authHeaderRow}>
                <Text
                  font={{ variation: FontVariation.H5 }}
                  tooltipProps={{ dataTooltipId: 'K8sAuthenticationTooltip' }}
                >
                  {getString('authentication')}
                </Text>
                <FormInput.Select
                  name="authType"
                  items={authOptions}
                  disabled={false}
                  className={commonStyles.authTypeSelect}
                />
              </Container>
              {renderK8AuthForm(formikProps)}
            </Layout.Vertical>
          ) : (
            <></>
          )}
          {validateAuthMethodSetup() ? (
            <>
              <Text font={{ variation: FontVariation.H5 }} width={300} padding={{ top: 'large' }}>
                {getString('cd.getStartedWithCD.setupDelegate')}
              </Text>

              <DelegateSelector
                mode={mode}
                setMode={setMode}
                delegateSelectors={delegateSelectors}
                setDelegateSelectors={setDelegateSelectors}
                setDelegatesFound={setDelegatesFound}
                delegateSelectorMandatory={isDelegateSelectorMandatory()}
                accountId={accountId}
                orgIdentifier={orgIdentifier}
                projectIdentifier={projectIdentifier}
              />
              <TestConnection />

              {testConnectionStatus === TestStatus.SUCCESS || testConnectionStatus === TestStatus.FAILED ? (
                <VerifyOutOfClusterDelegate
                  name={getString('connectors.stepThreeName')}
                  connectorInfo={connectorResponse?.data?.connector}
                  type={Connectors.KUBERNETES_CLUSTER}
                  setIsEditMode={() => false}
                />
              ) : null}
            </>
          ) : null}
        </Layout.Vertical>
      </Form>
      {/* ) */}
      {/* }} */}
      {/* </Formik> */}
    </Layout.Vertical>
  )
}

export const SelectAuthenticationMethod = React.forwardRef(SelectAuthenticationMethodRef)
