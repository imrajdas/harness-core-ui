/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Button, Container, FontVariation, FormError, Formik, FormInput, Layout, Text } from '@harness/uicore'
import React, { useCallback, useEffect, useRef } from 'react'
import { Form, FormikContextType, FormikProps } from 'formik'
import { useStrings } from 'framework/strings'
import TextReference, { TextReferenceInterface, ValueType } from '@secrets/components/TextReference/TextReference'
import type { SecretReferenceInterface } from '@secrets/utils/SecretField'
import { DelegateTypes } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { AuthTypes } from '@connectors/pages/connectors/utils/ConnectorHelper'
import SecretInput from '@secrets/components/SecretInput/SecretInput'
import { CLIENT_KEY_ALGO_OPTIONS } from '../DeployProvisioningWizard/Constants'
import css from '../DeployProvisioningWizard/DeployProvisioningWizard.module.scss'
import commonStyles from '@connectors/components/CreateConnector/commonSteps/ConnectorCommonStyles.module.scss'

export interface SelectAuthenticationMethodRef {
  values: SelectAuthenticationMethodInterface
  // setFieldTouched(
  //   field: keyof SelectAuthenticationMethodInterface & string,
  //   isTouched?: boolean,
  //   shouldValidate?: boolean
  // ): void
  validate: () => boolean
  // showValidationErrors: () => void
  // validatedSecret?: SecretDTOV2
}

export type SelectAuthMethodForwardRef =
  | ((instance: SelectAuthenticationMethodRef | null) => void)
  | React.MutableRefObject<SelectAuthenticationMethodRef | null>
  | null

interface SelectAuthenticationMethodInterface {
  connectorName: string
  delegateType: string
  authType?: string
  masterUrl: string
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

const defaultInitialFormData: SelectAuthenticationMethodInterface = {
  connectorName: '',
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
  clientKeyCACertificate: undefined
}

interface AuthOptionInterface {
  label: string
  value: string
}

interface SelectAuthenticationMethodProps {
  disableNextBtn: () => void
  enableNextBtn: () => void
}

const SelectAuthenticationMethodRef = (
  _props: SelectAuthenticationMethodProps,
  forwardRef: SelectAuthMethodForwardRef
): React.ReactElement => {
  const { getString } = useStrings()
  const formikRef = useRef<FormikContextType<SelectAuthenticationMethodInterface>>()

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
    } = formikRef?.current?.values || {}
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
        // setFieldTouched: setFieldTouched
        validate: validateAuthMethodSetup
        // showValidationErrors: markFieldsTouchedToShowValidationErrors,
        // validatedSecret
      }
    }
  }

  useEffect(() => {
    if (formikRef.current?.values && formikRef.current?.setFieldTouched) {
      setForwardRef({
        values: formikRef.current.values
        // setFieldTouched: formikRef.current.setFieldTouched
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

  return (
    <Layout.Vertical width="70%">
      <Formik<SelectAuthenticationMethodInterface>
        initialValues={defaultInitialFormData}
        formName="infraAuthentication"
        onSubmit={(values: SelectAuthenticationMethodInterface) => Promise.resolve(values)}
      >
        {formikProps => {
          formikRef.current = formikProps

          return (
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
                    }}
                    intent={DelegateTypes.DELEGATE_OUT_CLUSTER === formikProps.values.delegateType ? 'primary' : 'none'}
                  />
                  <Button
                    className={css.credentialsButton}
                    round
                    text={'Use from a specific harness Delegate'}
                    onClick={() => {
                      formikProps?.setFieldValue('delegateType', DelegateTypes.DELEGATE_IN_CLUSTER)
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
                  <Layout.Vertical>
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
              </Layout.Vertical>
            </Form>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export const SelectAuthenticationMethod = React.forwardRef(SelectAuthenticationMethodRef)
