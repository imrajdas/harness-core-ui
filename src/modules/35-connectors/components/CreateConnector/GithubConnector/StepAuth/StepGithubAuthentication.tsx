/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { get, isEmpty, set } from 'lodash-es'
import cx from 'classnames'
import {
  Layout,
  Button,
  Formik,
  FormInput,
  Text,
  FormikForm as Form,
  StepProps,
  Container,
  SelectOption,
  ButtonVariation,
  PageSpinner,
  useToaster,
  Icon
} from '@wings-software/uicore'
import * as Yup from 'yup'
import { Color, FontVariation } from '@harness/design-system'
import type { FormikContextType, FormikProps } from 'formik'
import { getRequestOptions } from 'framework/app/App'
import { Status } from '@common/utils/Constants'
import { useHostedBuilds } from '@common/hooks/useHostedBuild'
import { Scope } from '@common/interfaces/SecretsInterface'
import {
  setupGithubFormData,
  GitConnectionType,
  saveCurrentStepData
} from '@connectors/pages/connectors/utils/ConnectorUtils'
import type { SecretReferenceInterface } from '@secrets/utils/SecretField'
import type {
  ConnectorConfigDTO,
  ConnectorRequestBody,
  ConnectorInfoDTO,
  ConnectorConnectivityDetails
} from 'services/cd-ng'
import MultiTypeSecretInput from '@secrets/components/MutiTypeSecretInput/MultiTypeSecretInput'
import SecretInput from '@secrets/components/SecretInput/SecretInput'
import SSHSecretInput from '@secrets/components/SSHSecretInput/SSHSecretInput'
import TextReference, { TextReferenceInterface, ValueType } from '@secrets/components/TextReference/TextReference'
import { useStrings } from 'framework/strings'
import { GitAuthTypes, GitAPIAuthTypes } from '@connectors/pages/connectors/utils/ConnectorHelper'
import {
  ConnectorSecretScope,
  getBackendServerUrl,
  isEnvironmentAllowedForOAuth,
  MAX_TIMEOUT_OAUTH,
  OAUTH_PLACEHOLDER_VALUE,
  OAUTH_REDIRECT_URL_PREFIX
} from '../../CreateConnectorUtils'
import commonStyles from '@connectors/components/CreateConnector/commonSteps/ConnectorCommonStyles.module.scss'
import css from './StepGithubAuthentication.module.scss'
import commonCss from '../../commonSteps/ConnectorCommonStyles.module.scss'

interface StepGithubAuthenticationProps extends ConnectorInfoDTO {
  name: string
  isEditMode?: boolean
}

interface GithubAuthenticationProps {
  onConnectorCreated: (data?: ConnectorRequestBody) => void | Promise<void>
  isEditMode: boolean
  setIsEditMode: (val: boolean) => void
  setFormData?: (formData: ConnectorConfigDTO) => void
  connectorInfo: ConnectorInfoDTO | void
  status?: ConnectorConnectivityDetails
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
}

interface GithubFormInterface {
  connectionType: string
  authType: string
  username: TextReferenceInterface | void
  accessToken: SecretReferenceInterface | void
  installationId: string
  applicationId: string
  privateKey: SecretReferenceInterface | void
  sshKey: SecretReferenceInterface | void
  apiAccessToken: SecretReferenceInterface | void
  enableAPIAccess: boolean
  apiAuthType: string
}

const defaultInitialFormData: GithubFormInterface = {
  connectionType: GitConnectionType.HTTP,
  authType: GitAuthTypes.USER_TOKEN,
  username: undefined,
  accessToken: undefined,
  installationId: '',
  applicationId: '',
  privateKey: undefined,
  sshKey: undefined,
  apiAccessToken: undefined,
  enableAPIAccess: false,
  apiAuthType: GitAPIAuthTypes.TOKEN
}

const RenderGithubAuthForm: React.FC<{ formikProps: FormikProps<GithubFormInterface>; gitAuthType?: GitAuthTypes }> =
  props => {
    const { formikProps, gitAuthType } = props
    const { getString } = useStrings()
    switch (gitAuthType) {
      case GitAuthTypes.USER_TOKEN:
        return (
          <>
            <TextReference
              name="username"
              stringId="username"
              type={formikProps.values.username ? formikProps.values.username?.type : ValueType.TEXT}
            />
            <SecretInput name="accessToken" label={getString('personalAccessToken')} />
          </>
        )
      case GitAuthTypes.OAUTH:
      default:
        return null
    }
  }

const RenderAPIAccessForm: React.FC<FormikProps<GithubFormInterface>> = props => {
  const { getString } = useStrings()
  switch (props.values.apiAuthType) {
    case GitAPIAuthTypes.GITHUB_APP:
      return (
        <Container>
          <Container className={css.formRow}>
            <FormInput.Text name="installationId" label={getString('common.git.installationId')} />
            <FormInput.Text name="applicationId" label={getString('common.git.applicationId')} />
          </Container>
          <Container width={'42.5%'}>
            <MultiTypeSecretInput name="privateKey" label={getString('common.git.privateKey')} />
          </Container>
        </Container>
      )
    case GitAPIAuthTypes.TOKEN:
      return (
        <Container data-tooltip-id="gitHubPersonalAccessTooltip">
          <SecretInput
            name="apiAccessToken"
            label={getString('personalAccessToken')}
            tooltipProps={{ dataTooltipId: 'gitHubPersonalAccessTooltip' }}
          />
        </Container>
      )
    default:
      return null
  }
}

const RenderAPIAccessFormWrapper: React.FC<FormikProps<GithubFormInterface>> = formikProps => {
  const { getString } = useStrings()

  const apiAuthOptions: Array<SelectOption> = [
    {
      label: getString('personalAccessToken'),
      value: GitAPIAuthTypes.TOKEN
    },
    {
      label: getString('common.git.gitHubApp'),
      value: GitAPIAuthTypes.GITHUB_APP
    }
  ]

  return (
    <>
      <Container className={css.authHeaderRow}>
        <Text font={{ variation: FontVariation.H6 }} tooltipProps={{ dataTooltipId: 'githubApiAuthentication' }}>
          {getString('common.git.APIAuthentication')}
        </Text>
        <FormInput.Select name="apiAuthType" items={apiAuthOptions} className={commonStyles.authTypeSelect} />
      </Container>
      <RenderAPIAccessForm {...formikProps} />
    </>
  )
}

const StepGithubAuthentication: React.FC<StepProps<StepGithubAuthenticationProps> & GithubAuthenticationProps> =
  props => {
    const { getString } = useStrings()
    const { prevStepData, nextStep, accountId } = props
    const [initialValues, setInitialValues] = useState(defaultInitialFormData)
    const [loadingConnectorSecrets, setLoadingConnectorSecrets] = useState(props.isEditMode)
    const oAuthSecretIntercepted = useRef<boolean>(false)
    const { showError, clear } = useToaster()
    const [oAuthStatus, setOAuthStatus] = useState<Status>(Status.TO_DO)
    const formikRef = useRef<FormikContextType<any>>()
    const [isOAuthGettingRelinked, setIsOAuthGettingRelinked] = useState<boolean>(false)
    const [isAccessRevoked, setIsAccessRevoked] = useState<boolean>(false)
    const { enabledHostedBuildsForFreeUsers } = useHostedBuilds()
    const [gitAuthType, setGitAuthType] = useState<GitAuthTypes>()

    const authOptions: Array<SelectOption> = [
      {
        label: getString('usernameToken'),
        value: GitAuthTypes.USER_TOKEN
      }
    ]
    enabledHostedBuildsForFreeUsers &&
      authOptions.push({ label: getString('common.oAuthLabel'), value: GitAuthTypes.OAUTH })

    const isGithubConnectorOAuthBased = useMemo((): boolean => {
      return get(prevStepData, 'spec.authentication.spec.type') === GitAuthTypes.OAUTH
    }, [prevStepData])

    const isExistingOAuthConnectionHealthy = useMemo((): boolean => {
      return (
        isGithubConnectorOAuthBased &&
        (!isEmpty(get(prevStepData, 'spec.authentication.spec.spec.tokenRef')) ||
          props.status?.status === Status.SUCCESS)
      )
    }, [prevStepData, isGithubConnectorOAuthBased, props.status?.status])

    const markOAuthAsFailed = useCallback(() => {
      setOAuthStatus(Status.FAILURE)
      clear()
      showError(getString('connectors.oAuth.failed'))
    }, [])

    const handleOAuthLinking = useCallback(async () => {
      setTimeout(() => {
        if (oAuthStatus !== Status.SUCCESS) {
          markOAuthAsFailed()
        }
      }, MAX_TIMEOUT_OAUTH)
      setOAuthStatus(Status.IN_PROGRESS)
      if (isExistingOAuthConnectionHealthy) {
        setIsOAuthGettingRelinked(true)
      }
      oAuthSecretIntercepted.current = false
      try {
        const { headers } = getRequestOptions()
        const oauthRedirectEndpoint = `${OAUTH_REDIRECT_URL_PREFIX}?provider=github&accountId=${accountId}`
        const response = await fetch(oauthRedirectEndpoint, {
          headers
        })
        const oAuthURL = await response.text()
        if (typeof oAuthURL === 'string') {
          window.open(oAuthURL, '_blank')
        }
      } catch (e) {
        markOAuthAsFailed()
      }
    }, [isExistingOAuthConnectionHealthy, accountId])

    const handleOAuthServerEvent = useCallback(
      (event: MessageEvent): void => {
        if (oAuthStatus === Status.IN_PROGRESS) {
          if (event.origin !== getBackendServerUrl() && !isEnvironmentAllowedForOAuth()) {
            markOAuthAsFailed()
            return
          }
          if (!event || !event.data) {
            markOAuthAsFailed()
            return
          }
          const { accessTokenRef, refreshTokenRef, status, errorMessage } = event.data
          // valid oauth event from server will always have some value
          if (accessTokenRef && refreshTokenRef && status && errorMessage) {
            // safeguard against backend server sending multiple oauth events
            if (!oAuthSecretIntercepted.current) {
              if (
                accessTokenRef !== OAUTH_PLACEHOLDER_VALUE &&
                (status as string).toLowerCase() === Status.SUCCESS.toLowerCase()
              ) {
                setOAuthStatus(Status.SUCCESS)
                oAuthSecretIntercepted.current = true

                // update formik
                const formValuesCopy = { ...formikRef.current?.values }
                let updatedFormValues = set(
                  formValuesCopy,
                  'oAuthAccessTokenRef',
                  `${ConnectorSecretScope[Scope.ACCOUNT]}${accessTokenRef}`
                )
                if (refreshTokenRef !== OAUTH_PLACEHOLDER_VALUE) {
                  updatedFormValues = set(
                    updatedFormValues,
                    'oAuthRefreshTokenRef',
                    `${ConnectorSecretScope[Scope.ACCOUNT]}${refreshTokenRef}`
                  )
                }
                formikRef.current?.setValues(updatedFormValues)
              } else if (errorMessage !== OAUTH_PLACEHOLDER_VALUE) {
                markOAuthAsFailed()
              }
            }
          }
        }
      },
      [formikRef.current?.values, markOAuthAsFailed, oAuthStatus, handleOAuthLinking]
    )

    useEffect(() => {
      window.addEventListener('message', handleOAuthServerEvent)

      return () => {
        window.removeEventListener('message', handleOAuthServerEvent)
      }
    }, [handleOAuthServerEvent])

    useEffect(() => {
      if (isGithubConnectorOAuthBased) {
        setIsAccessRevoked(props.status?.status !== Status.SUCCESS)
      }
    }, [props.status])

    useEffect(() => {
      if (oAuthSecretIntercepted.current) {
        window.removeEventListener('message', handleOAuthServerEvent) // remove event listener once oauth is done
      }
    }, [oAuthSecretIntercepted.current])

    useEffect(() => {
      setGitAuthType(
        get(prevStepData, 'authType') || get(prevStepData, 'spec.authentication.spec.type') || GitAuthTypes.USER_TOKEN
      )
    }, [prevStepData])

    useEffect(() => {
      if (loadingConnectorSecrets && props.isEditMode) {
        if (props.connectorInfo) {
          setupGithubFormData(props.connectorInfo, accountId).then(data => {
            setInitialValues(data as GithubFormInterface)
            setLoadingConnectorSecrets(false)
          })
        } else {
          setLoadingConnectorSecrets(false)
        }
      }
    }, [loadingConnectorSecrets])

    useEffect(() => {
      saveCurrentStepData<ConnectorInfoDTO>(props.getCurrentStepData, formikRef.current?.values)
    }, [formikRef.current?.values])

    const handleSubmit = (formData: ConnectorConfigDTO) => {
      nextStep?.({ ...props.connectorInfo, ...prevStepData, ...formData } as StepGithubAuthenticationProps)
    }

    const renderOAuthStatus = useCallback((): JSX.Element => {
      if (oAuthStatus === Status.TO_DO && isAccessRevoked) {
        return (
          <Layout.Horizontal spacing="xsmall" flex={{ justifyContent: 'flex-start' }}>
            <Icon size={20} name="danger-icon" />
            <Text font={{ variation: FontVariation.SMALL }}>{getString('connectors.oAuth.accessRevoked')}</Text>
          </Layout.Horizontal>
        )
      }
      if (isExistingOAuthConnectionHealthy || oAuthStatus === Status.SUCCESS) {
        return (
          <Layout.Horizontal
            className={css.oAuthSuccess}
            flex={{ justifyContent: 'flex-start' }}
            padding={{ left: 'small', top: 'xsmall', right: 'small', bottom: 'xsmall' }}
            spacing="xsmall"
          >
            <Icon name="success-tick" size={24} />
            <Text font={{ weight: 'semi-bold' }} color={Color.GREEN_800}>
              {getString(isOAuthGettingRelinked ? 'connectors.oAuth.reConfigured' : 'connectors.oAuth.configured')}
            </Text>
          </Layout.Horizontal>
        )
      }
      return <></>
    }, [oAuthStatus, isAccessRevoked, prevStepData, isOAuthGettingRelinked, isExistingOAuthConnectionHealthy])

    return loadingConnectorSecrets ||
      (formikRef.current?.values.authType === GitAuthTypes.OAUTH && oAuthStatus === Status.IN_PROGRESS) ? (
      <PageSpinner
        message={
          formikRef.current?.values.authType === GitAuthTypes.OAUTH && oAuthStatus === Status.IN_PROGRESS
            ? getString('connectors.oAuth.inProgress')
            : ''
        }
      />
    ) : (
      <Layout.Vertical width="60%" style={{ minHeight: 460 }} className={cx(css.secondStep, commonCss.stepContainer)}>
        <Text font={{ variation: FontVariation.H3 }}>{getString('credentials')}</Text>

        <Formik
          initialValues={{
            ...initialValues,
            ...prevStepData
          }}
          formName="stepGithubAuthForm"
          validationSchema={
            gitAuthType === GitAuthTypes.OAUTH
              ? Yup.object().shape({})
              : Yup.object().shape({
                  username: Yup.string()
                    .nullable()
                    .when('connectionType', {
                      is: val => val === GitConnectionType.HTTP,
                      then: Yup.string().trim().required(getString('validation.username'))
                    }),
                  authType: Yup.string().when('connectionType', {
                    is: val => val === GitConnectionType.HTTP,
                    then: Yup.string().trim().required(getString('validation.authType'))
                  }),
                  sshKey: Yup.object().when('connectionType', {
                    is: val => val === GitConnectionType.SSH,
                    then: Yup.object().required(getString('validation.sshKey')),
                    otherwise: Yup.object().nullable()
                  }),
                  accessToken: Yup.object().when(['connectionType', 'authType'], {
                    is: (connectionType, authType) =>
                      connectionType === GitConnectionType.HTTP && authType === GitAuthTypes.USER_TOKEN,

                    then: Yup.object().required(getString('validation.accessToken')),
                    otherwise: Yup.object().nullable()
                  }),
                  apiAccessToken: Yup.object().when(['enableAPIAccess', 'apiAuthType'], {
                    is: (enableAPIAccess, apiAuthType) => enableAPIAccess && apiAuthType === GitAPIAuthTypes.TOKEN,
                    then: Yup.object().required(getString('validation.accessToken')),
                    otherwise: Yup.object().nullable()
                  }),
                  privateKey: Yup.string().when(['enableAPIAccess', 'apiAuthType'], {
                    is: (enableAPIAccess, apiAuthType) => enableAPIAccess && apiAuthType === GitAPIAuthTypes.GITHUB_APP,
                    then: Yup.string().required(getString('validation.privateKey')),
                    otherwise: Yup.string().nullable()
                  }),
                  apiAuthType: Yup.string().when('enableAPIAccess', {
                    is: val => val,
                    then: Yup.string().trim().required(getString('validation.authType'))
                  }),
                  installationId: Yup.string().when(['enableAPIAccess', 'apiAuthType'], {
                    is: (enableAPIAccess, apiAuthType) => enableAPIAccess && apiAuthType === GitAPIAuthTypes.GITHUB_APP,
                    then: Yup.string().trim().required(getString('validation.installationId'))
                  }),
                  applicationId: Yup.string().when(['enableAPIAccess', 'apiAuthType'], {
                    is: (enableAPIAccess, apiAuthType) => enableAPIAccess && apiAuthType === GitAPIAuthTypes.GITHUB_APP,
                    then: Yup.string().trim().required(getString('validation.applicationId'))
                  })
                })
          }
          onSubmit={handleSubmit}
        >
          {formikProps => {
            saveCurrentStepData<ConnectorInfoDTO>(
              props.getCurrentStepData,
              Object.assign(formikProps.values, {
                authType: gitAuthType,
                ...(gitAuthType === GitAuthTypes.OAUTH && { apiAuthType: GitAuthTypes.OAUTH })
              }) as unknown as ConnectorInfoDTO
            )
            formikRef.current = formikProps
            return (
              <Form className={cx(commonCss.fullHeight, commonCss.fullHeightDivsWithFlex)}>
                <Container className={cx(css.stepFormWrapper, commonCss.paddingTop8)}>
                  {formikProps.values.connectionType === GitConnectionType.SSH ? (
                    <Layout.Horizontal spacing="medium" flex={{ alignItems: 'baseline' }}>
                      <Text
                        tooltipProps={{ dataTooltipId: 'githubAuthentication' }}
                        font={{ variation: FontVariation.H6 }}
                      >
                        {getString('authentication')}
                      </Text>
                      <SSHSecretInput name="sshKey" label={getString('SSH_KEY')} />
                    </Layout.Horizontal>
                  ) : (
                    <Container>
                      <Container className={css.authHeaderRow} flex={{ alignItems: 'baseline' }}>
                        <Text
                          font={{ variation: FontVariation.H6 }}
                          tooltipProps={{ dataTooltipId: 'githubAuthentication' }}
                        >
                          {getString('authentication')}
                        </Text>
                        <FormInput.Select
                          name="authType"
                          items={authOptions}
                          disabled={false}
                          className={commonStyles.authTypeSelect}
                          onChange={(selection: SelectOption) => {
                            const selectedOption = selection.value as GitAuthTypes
                            setGitAuthType(selectedOption)
                            formikProps.setValues({
                              ...formikProps.values,
                              authType: selectedOption,
                              ...(selectedOption === GitAuthTypes.OAUTH && { apiAuthType: selectedOption })
                            })
                          }}
                        />
                      </Container>

                      <RenderGithubAuthForm formikProps={formikProps} gitAuthType={gitAuthType} />
                    </Container>
                  )}

                  {gitAuthType === GitAuthTypes.OAUTH && enabledHostedBuildsForFreeUsers ? (
                    <Layout.Vertical spacing="xlarge">
                      {renderOAuthStatus()}
                      <Button
                        intent="primary"
                        text={getString(
                          isExistingOAuthConnectionHealthy
                            ? 'connectors.relinkToGitProvider'
                            : 'connectors.linkToGitProvider',
                          {
                            gitProvider: getString('common.repo_provider.githubLabel')
                          }
                        )}
                        onClick={handleOAuthLinking}
                        variation={ButtonVariation.PRIMARY}
                        className={css.linkToGitBtn}
                      />
                    </Layout.Vertical>
                  ) : (
                    <>
                      <FormInput.CheckBox
                        name="enableAPIAccess"
                        label={getString('common.git.enableAPIAccess')}
                        padding={{ left: 'xxlarge' }}
                      />
                      <Text font="small" className={commonCss.bottomMargin4}>
                        {getString('common.git.APIAccessDescription')}
                      </Text>
                      {formikProps.values.enableAPIAccess ? <RenderAPIAccessFormWrapper {...formikProps} /> : null}
                    </>
                  )}
                </Container>

                <Layout.Horizontal padding={{ top: 'small' }} spacing="medium">
                  <Button
                    text={getString('back')}
                    icon="chevron-left"
                    onClick={() => props?.previousStep?.(props?.prevStepData)}
                    data-name="githubBackButton"
                    variation={ButtonVariation.SECONDARY}
                  />
                  <Button
                    type="submit"
                    intent="primary"
                    text={getString('continue')}
                    rightIcon="chevron-right"
                    variation={ButtonVariation.PRIMARY}
                    disabled={
                      !isGithubConnectorOAuthBased &&
                      formikProps.values.authType === GitAuthTypes.OAUTH &&
                      oAuthStatus !== Status.SUCCESS
                    }
                  />
                </Layout.Horizontal>
              </Form>
            )
          }}
        </Formik>
      </Layout.Vertical>
    )
  }

export default StepGithubAuthentication
