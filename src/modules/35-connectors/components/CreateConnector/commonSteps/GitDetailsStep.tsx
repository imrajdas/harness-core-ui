/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useRef, useState } from 'react'
import cx from 'classnames'
import {
  Layout,
  Button,
  Formik,
  StepProps,
  ModalErrorHandlerBinding,
  ModalErrorHandler,
  FormikForm,
  Container,
  FormInput,
  Text,
  ButtonVariation
} from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { FontVariation } from '@harness/design-system'
import * as Yup from 'yup'
import type { IOptionProps } from '@blueprintjs/core'
import type { FormikProps } from 'formik'
import {
  ConnectorConfigDTO,
  ConnectorInfoDTO,
  ResponseBoolean,
  validateTheIdentifierIsUniquePromise,
  Failure
} from 'services/cd-ng'
import { GitAuthTypes } from '@connectors/pages/connectors/utils/ConnectorHelper'
import { String, useStrings } from 'framework/strings'
import { GitUrlType, GitConnectionType, saveCurrentStepData } from '@connectors/pages/connectors/utils/ConnectorUtils'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { Connectors } from '@connectors/constants'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import css from './ConnectorDetailsStep.module.scss'
import commonCss from './ConnectorCommonStyles.module.scss'

interface ConnectorDetailsStepProps extends StepProps<ConnectorInfoDTO> {
  type: ConnectorInfoDTO['type']
  name: string
  setFormData?: (formData: ConnectorConfigDTO) => void
  formData?: ConnectorConfigDTO
  isEditMode?: boolean
  connectorInfo: ConnectorInfoDTO | void
  mock?: ResponseBoolean
}

interface DetailsStepInterface {
  urlType: string
  connectionType: string
  url: string
  validationRepo?: string
}

/**
 * Function to getTooltipAnchorForHeading
 */
const getTooltipAnchorForHeading = (connectorType: ConnectorInfoDTO['type']): string => {
  if (connectorType === 'Aws') {
    return 'awsCCDetailsTooltip'
  } else if (connectorType === 'Git') {
    return 'gitConnectorDetailsTooltip'
  } else if (connectorType === 'Github') {
    return 'githubConnectorDetailsTooltip'
  } else if (connectorType === 'Bitbucket') {
    return 'bitbucketConnectorDetailsTooltip'
  } else if (connectorType === Connectors.AZURE_REPO) {
    return 'azureReposConnectorDetailsTooltip'
  } else if (connectorType === 'Gitlab') {
    return 'gitlabConnectorDetailsTooltip'
  }
  return 'connectorDetailsTooltip'
}

/**
 * Function to GitDetailsStep
 */
const GitDetailsStep: React.FC<StepProps<ConnectorConfigDTO> & ConnectorDetailsStepProps> = props => {
  const { prevStepData, nextStep } = props
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const mounted = useRef(false)
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding | undefined>()
  const [loading, setLoading] = useState(false)
  const isEdit = props.isEditMode || prevStepData?.isEdit
  const { getString } = useStrings()

  const getUrlTypeOptions = (connectorType: ConnectorInfoDTO['type']): IOptionProps[] => {
    return [
      ...[
        connectorType === Connectors.AZURE_REPO
          ? {
              label: getString('projectLabel'),
              value: GitUrlType.PROJECT
            }
          : {
              label: getString('account'),
              value: GitUrlType.ACCOUNT
            }
      ],
      {
        label: getString('repository'),
        value: GitUrlType.REPO
      }
    ]
  }

  const connectionTypeOptions: IOptionProps[] = [
    {
      label: getString('HTTP'),
      value: GitConnectionType.HTTP
    },
    {
      label: getString('SSH'),
      value: GitConnectionType.SSH
    }
  ]

  /**
   * Function to getUrlLabel
   */
  const getUrlLabel = (connectorType: ConnectorInfoDTO['type'], urlType: string): string => {
    switch (connectorType) {
      case Connectors.GIT:
        return urlType === GitUrlType.ACCOUNT
          ? getString('common.git.gitAccountUrl')
          : getString('common.git.gitRepoUrl')
      case Connectors.GITHUB:
        return urlType === GitUrlType.ACCOUNT
          ? getString('common.git.gitHubAccountUrl')
          : getString('common.git.gitHubRepoUrl')
      case Connectors.GITLAB:
        return urlType === GitUrlType.ACCOUNT
          ? getString('common.git.gitLabAccountUrl')
          : getString('common.git.gitLabRepoUrl')
      case Connectors.BITBUCKET:
        return urlType === GitUrlType.ACCOUNT
          ? getString('common.git.bitbucketAccountUrl')
          : getString('common.git.bitbucketRepoUrl')
      case Connectors.AZURE_REPO:
        return urlType === GitUrlType.PROJECT
          ? getString('common.git.azureReposProjectUrl')
          : getString('common.git.azureReposRepoUrl')
      default:
        return ''
    }
  }

  /**
   * Function to getUrlLabelPlaceholder
   */
  const getUrlLabelPlaceholder = (
    connectorType: ConnectorInfoDTO['type'],
    connectionType: string,
    urlType: string
  ): string => {
    switch (connectorType) {
      case Connectors.GIT:
      case Connectors.GITHUB:
        return connectionType === GitConnectionType.HTTP
          ? getString('common.git.gitHubUrlPlaceholder')
          : getString('common.git.gitHubUrlPlaceholderSSH')
      case Connectors.GITLAB:
        return connectionType === GitConnectionType.HTTP
          ? getString('common.git.gitLabUrlPlaceholder')
          : getString('common.git.gitLabUrlPlaceholderSSH')
      case Connectors.BITBUCKET:
        return connectionType === GitConnectionType.HTTP
          ? getString('common.git.bitbucketUrlPlaceholder')
          : getString('common.git.bitbucketPlaceholderSSH')
      case Connectors.AZURE_REPO:
        if (connectionType === GitConnectionType.HTTP) {
          return urlType == GitUrlType.PROJECT
            ? getString('common.git.azureReposUrlPlaceholder')
            : getString('common.git.azureReposUrlPlaceholderRepoHttp')
        }
        return urlType == GitUrlType.PROJECT
          ? getString('common.git.azureReposPlaceholderSSH')
          : getString('common.git.azureReposPlaceholderRepoSSH')
      default:
        return ''
    }
  }

  /**
   * Function to handleSubmit
   */
  const handleSubmit = async (formData: ConnectorConfigDTO): Promise<void> => {
    trackEvent(ConnectorActions.DetailsStepSubmit, {
      category: Category.CONNECTOR,
      connector_type: Connectors.Git
    })
    mounted.current = true
    if (isEdit) {
      //In edit mode validateTheIdentifierIsUnique API not required
      props.setFormData?.(formData)
      nextStep?.({ ...props.connectorInfo, ...prevStepData, ...formData })
    } else {
      setLoading(true)
      try {
        const response = await validateTheIdentifierIsUniquePromise({
          queryParams: {
            identifier: formData.identifier,
            accountIdentifier: accountId,
            orgIdentifier: orgIdentifier,
            projectIdentifier: projectIdentifier
          },
          mock: props.mock
        })
        setLoading(false)

        if ('SUCCESS' === response.status) {
          if (response.data) {
            props.setFormData?.(formData)
            nextStep?.({ ...props.connectorInfo, ...prevStepData, ...formData })
          } else {
            modalErrorHandler?.showDanger(
              getString('validation.duplicateIdError', {
                connectorName: formData.name,
                connectorIdentifier: formData.identifier
              })
            )
          }
        } else {
          throw response as Failure
        }
      } catch (error) {
        setLoading(false)
        modalErrorHandler?.showDanger(error.message)
      }
    }
  }

  /**
   * Function to getInitialValues
   */
  const getInitialValues = (): DetailsStepInterface => {
    if (isEdit && props.connectorInfo) {
      return {
        urlType:
          props.type === Connectors.GIT ? props.connectorInfo?.spec?.connectionType : props.connectorInfo?.spec?.type,
        url: props.connectorInfo?.spec?.url,
        validationRepo: props.connectorInfo?.spec?.validationRepo,
        connectionType:
          props.type === Connectors.GIT
            ? props.connectorInfo?.spec?.type
            : props.connectorInfo?.spec?.authentication?.type
      }
    } else {
      return {
        urlType: props.type === Connectors.AZURE_REPO ? GitUrlType.PROJECT : GitUrlType.ACCOUNT,
        connectionType: GitConnectionType.HTTP,
        url: ''
      }
    }
  }

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.DetailsStepLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.Git
  })

  return (
    <Layout.Vertical className={cx(css.gitDetails, css.firstep, commonCss.stepContainer)}>
      <ModalErrorHandler bind={setModalErrorHandler} />
      <Text
        font={{ variation: FontVariation.H3 }}
        tooltipProps={{ dataTooltipId: getTooltipAnchorForHeading(props.type) }}
      >
        {getString('details')}
      </Text>

      <Formik
        onSubmit={formData => {
          handleSubmit(formData)
        }}
        formName="gitDetailsStepForm"
        validationSchema={Yup.object().shape({
          url: Yup.string().test('isValidUrl', getString('validation.urlIsNotValid'), function (_url) {
            if (!_url) return false
            const trimmedUrl = _url?.trim() || ''
            if (trimmedUrl.includes(' ')) {
              return false
            }
            if (this.parent.connectionType === GitConnectionType.SSH) {
              return trimmedUrl.startsWith('git@') || trimmedUrl.startsWith('ssh://') ? true : false
            } else if (this.parent.connectionType === GitConnectionType.HTTP) {
              return trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://') ? true : false
            }
            try {
              const url = new URL(_url)
              return url.protocol === 'http:' || url.protocol === 'https:'
            } catch (_) {
              return false
            }
          }),
          validationRepo: Yup.string()
            .nullable()
            .when('urlType', {
              is: 'Account',
              then: Yup.string().required(getString('common.validation.testRepoIsRequired'))
            })
        })}
        initialValues={{
          ...getInitialValues(),
          ...prevStepData,
          ...props.formData
        }}
      >
        {(formikProps: FormikProps<DetailsStepInterface>) => {
          saveCurrentStepData<ConnectorInfoDTO>(
            props.getCurrentStepData,
            formikProps.values as unknown as ConnectorInfoDTO
          )
          return (
            <FormikForm className={cx(css.connectorForm, commonCss.fullHeight, commonCss.fullHeightDivsWithFlex)}>
              <Layout.Vertical className={commonCss.paddingTop8}>
                <Container className={commonCss.bottomPadding1}>
                  <Layout.Vertical spacing="xsmall">
                    <Text
                      tooltipProps={{ dataTooltipId: `${props.type.toLocaleLowerCase()}URLType` }}
                      font={{ variation: FontVariation.FORM_LABEL }}
                    >
                      {getString('common.git.urlType')}
                    </Text>
                    <FormInput.RadioGroup
                      style={{ fontSize: 'normal' }}
                      radioGroup={{ inline: true }}
                      name="urlType"
                      items={getUrlTypeOptions(props.type)}
                    />
                  </Layout.Vertical>
                  <Layout.Vertical spacing="xsmall">
                    <Text
                      tooltipProps={{ dataTooltipId: `${props.type.toLocaleLowerCase()}ConnectionType` }}
                      font={{ variation: FontVariation.FORM_LABEL }}
                    >
                      {getString('common.git.connectionType')}
                    </Text>
                    <FormInput.RadioGroup
                      style={{ fontSize: 'normal' }}
                      name="connectionType"
                      radioGroup={{ inline: true }}
                      items={connectionTypeOptions}
                      onChange={val => {
                        // initialize authType for only 1 option
                        if (val.currentTarget.value === GitConnectionType.HTTP && props.type === Connectors.BITBUCKET) {
                          formikProps.setFieldValue('authType', GitAuthTypes.USER_PASSWORD)
                        }
                      }}
                    />
                  </Layout.Vertical>
                </Container>
                <FormInput.Text
                  name="url"
                  className={css.formElm}
                  label={
                    <Text font={{ variation: FontVariation.FORM_LABEL }}>
                      {getUrlLabel(props.type, formikProps.values.urlType)}
                    </Text>
                  }
                  placeholder={getUrlLabelPlaceholder(
                    props.type,
                    formikProps.values.connectionType,
                    formikProps.values.urlType
                  )}
                  tooltipProps={{ dataTooltipId: `${props.type.toLocaleLowerCase()}DetailsStepForm_url` }}
                />

                {(formikProps.values.urlType === GitUrlType.ACCOUNT ||
                  formikProps.values.urlType === GitUrlType.PROJECT) && (
                  <Container>
                    <Text
                      font={{ variation: FontVariation.BODY }}
                      className={cx(commonCss.bottomMargin5, commonCss.topMargin1)}
                    >
                      {getString('common.git.testRepositoryDescription', {
                        scope: formikProps.values.urlType.toLocaleLowerCase()
                      })}
                    </Text>
                    <FormInput.Text
                      name="validationRepo"
                      className={css.formElm}
                      label={
                        <Text font={{ variation: FontVariation.FORM_LABEL }}>
                          {getString('common.git.testRepository')}
                        </Text>
                      }
                      placeholder={getString('common.git.selectRepoLabel')}
                      tooltipProps={{
                        dataTooltipId: `${props.type.toLocaleLowerCase()}DetailsStepForm_validationRepo`
                      }}
                    />
                  </Container>
                )}
              </Layout.Vertical>
              <Layout.Horizontal spacing="medium">
                <Button
                  text={getString('back')}
                  icon="chevron-left"
                  onClick={() => props?.previousStep?.(props?.prevStepData)}
                  data-name="commonGitBackButton"
                  variation={ButtonVariation.SECONDARY}
                />
                <Button
                  type="submit"
                  intent="primary"
                  rightIcon="chevron-right"
                  disabled={loading}
                  variation={ButtonVariation.PRIMARY}
                >
                  <String stringID="continue" />
                </Button>
              </Layout.Horizontal>
            </FormikForm>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export default GitDetailsStep
