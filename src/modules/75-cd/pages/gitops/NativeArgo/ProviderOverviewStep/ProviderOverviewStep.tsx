/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useRef, useState } from 'react'
import {
  Layout,
  Button,
  Formik,
  ModalErrorHandlerBinding,
  Text,
  Icon,
  ModalErrorHandler,
  FormikForm,
  FormInput,
  Container,
  ButtonVariation,
  shouldShowError
} from '@wings-software/uicore'

import { useParams } from 'react-router-dom'
import * as Yup from 'yup'
import { pick } from 'lodash-es'
import {
  GitOpsProvider,
  validateProviderIdentifierIsUniquePromise,
  Failure,
  useCreateGitOpsProvider,
  useUpdateGitOpsProvider,
  CreateGitOpsProviderQueryParams
} from 'services/cd-ng'
import { String, useStrings } from 'framework/strings'
import { NameIdDescriptionTags, PageSpinner, useToaster } from '@common/components'
import { saveCurrentStepData } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import type { BaseProviderStepProps } from '../../types'
import aboutHarnessAdapterIllustration from '../../images/aboutHarnessAdapterIllustration.svg'
const aboutHarnessAdapterURL = `https://docs.harness.io/article/ptlvh7c6z2-harness-argo-cd-git-ops-quickstart`
import css from './ProviderOverviewStep.module.scss'

export type ProviderOverviewStepProps = BaseProviderStepProps

type Params = {
  accountId: string
  projectIdentifier: string
  orgIdentifier: string
}

const ProviderOverviewStep: React.FC<ProviderOverviewStepProps> = props => {
  const { prevStepData, nextStep, provider } = props
  const { getRBACErrorMessage } = useRBACError()
  const { showSuccess, showError } = useToaster()
  const {
    accountId,
    projectIdentifier: projectIdentifierFromUrl,
    orgIdentifier: orgIdentifierFromUrl
  } = useParams<Params>()
  const projectIdentifier = provider ? provider.projectIdentifier : projectIdentifierFromUrl
  const orgIdentifier = provider ? provider.orgIdentifier : orgIdentifierFromUrl
  const [providerName, setProviderName] = useState(props?.provider?.name)

  const mounted = useRef(false)
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding | undefined>()
  const [loading, setLoading] = useState(false)
  const isEdit = props.isEditMode
  const { getString } = useStrings()

  const { mutate: createConnector, loading: creating } = useCreateGitOpsProvider({
    queryParams: { accountIdentifier: accountId }
  })
  const { mutate: updateConnector, loading: updating } = useUpdateGitOpsProvider({
    queryParams: { accountIdentifier: accountId }
  })

  const handleCreateOrEdit = async (payload: GitOpsProvider): Promise<any> => {
    modalErrorHandler?.hide()
    const queryParams: CreateGitOpsProviderQueryParams = {}

    const response = props.isEditMode
      ? await updateConnector(payload, {
          queryParams: {
            ...queryParams
          }
        })
      : await createConnector(payload, { queryParams: queryParams })

    return {
      status: response.status,
      nextCallback: afterSuccessHandler.bind(null, response)
    }
  }

  const isSaveButtonDisabled = creating || updating

  const afterSuccessHandler = (response: any): void => {
    props.onUpdateMode?.(true)
    nextStep?.({ ...props.provider, ...response?.data })
  }

  const handleSave = (formData: GitOpsProvider): void => {
    const data: GitOpsProvider = {
      ...formData,
      projectIdentifier: projectIdentifier,
      orgIdentifier: orgIdentifier
    }

    setProviderName(formData.name)

    handleCreateOrEdit(data)
      .then(res => {
        if (res.status === 'SUCCESS') {
          props.isEditMode
            ? showSuccess(getString('cd.updatedSuccessfully'))
            : showSuccess(getString('cd.createdSuccessfully'))

          res.nextCallback?.()
        }
      })
      .catch(e => {
        if (shouldShowError(e)) {
          showError(getRBACErrorMessage(e))
        }
      })
  }

  const handleSubmit = async (formData: GitOpsProvider): Promise<void> => {
    mounted.current = true
    if (isEdit) {
      handleSave(formData)
      return
    }
    setLoading(true)
    try {
      const response = await validateProviderIdentifierIsUniquePromise({
        queryParams: {
          identifier: formData.identifier,
          accountIdentifier: accountId,
          orgIdentifier: orgIdentifier,
          projectIdentifier: projectIdentifier
        }
      })
      setLoading(false)

      if ('SUCCESS' !== response.status) {
        modalErrorHandler?.showDanger((response as Failure)?.message || '')
        return
      }
      if (response.data) {
        handleSave(formData)
      } else {
        modalErrorHandler?.showDanger(
          getString('cd.duplicateIdError', {
            providerName: formData.name,
            providerIdentifier: formData.identifier
          })
        )
      }
    } catch (error) {
      setLoading(false)
      modalErrorHandler?.showDanger(error.message)
    }
  }

  const getInitialValues = (): GitOpsProvider => {
    if (isEdit) {
      return pick(props.provider, ['name', 'identifier', 'description', 'tags', 'spec']) as GitOpsProvider
    } else {
      return {
        name: '',
        description: '',
        identifier: '',
        tags: {},
        spec: {
          type: 'CONNECTED_ARGO_PROVIDER'
        }
      }
    }
  }

  return (
    <>
      {creating || updating ? (
        <PageSpinner
          message={
            creating
              ? getString('cd.creating', { name: providerName })
              : getString('cd.updating', { name: providerName })
          }
        />
      ) : null}

      <Layout.Vertical spacing="xxlarge" className={css.stepContainer}>
        <div className={css.heading}>{getString('overview')}</div>
        <Container className={css.connectorForm}>
          <Formik<GitOpsProvider>
            onSubmit={formData => {
              handleSubmit(formData)
            }}
            enableReinitialize={true}
            formName={`GitOpsProviderStepForm${provider?.spec?.type}`}
            validationSchema={Yup.object().shape({
              name: NameSchema(),
              identifier: IdentifierSchema(),
              spec: Yup.object().shape({
                adapterUrl: Yup.string()
                  .trim()
                  .url('Please enter a valid Adapter URL')
                  .required('Please enter a valid Adapter URL')
              })
            })}
            initialValues={{
              ...getInitialValues(),
              ...prevStepData
            }}
          >
            {formikProps => {
              saveCurrentStepData(props.getCurrentStepData, formikProps.values)
              return (
                <FormikForm>
                  <Container className={css.mainContainer} style={{ minHeight: 460, maxHeight: 460 }}>
                    <ModalErrorHandler
                      bind={setModalErrorHandler}
                      style={{
                        maxWidth: '740px',
                        marginBottom: '20px',
                        borderRadius: '3px',
                        borderColor: 'transparent'
                      }}
                    />
                    <div className={css.contentContainer}>
                      <div className={css.formContainer}>
                        <NameIdDescriptionTags
                          className={css.formElm}
                          formikProps={formikProps}
                          identifierProps={{ inputName: 'name', isIdentifierEditable: !isEdit }}
                          tooltipProps={{
                            dataTooltipId: `GitOpsProviderStepFormNameIdDescriptionTags`
                          }}
                        />

                        <FormInput.Text className={css.adapterUrl} name="spec.adapterUrl" label={'Adapter URL'} />
                      </div>

                      <div className={css.aboutHarnessAdapterContainer}>
                        <Text className={css.aboutHarnessAdapterQuestion} margin={{ bottom: 'small' }}>
                          {getString('cd.whatIsHarnessAdapter')}
                        </Text>
                        <Text className={css.aboutHarnessAdapterAnswer} margin={{ top: 'small', bottom: 'small' }}>
                          {getString('cd.aboutHarnessAdapter')}
                        </Text>

                        <img src={aboutHarnessAdapterIllustration} className={css.aboutHarnessAdapterIllustration} />

                        <div className={css.aboutHarnessAdapterUrl}>
                          <Icon intent="primary" style={{ marginRight: '8px' }} size={16} name="info" />

                          <a href={aboutHarnessAdapterURL} rel="noreferrer" target="_blank">
                            {getString('cd.learnMoreAboutHarnessAdapter')}
                          </a>
                        </div>
                      </div>
                    </div>
                  </Container>
                  <Layout.Horizontal>
                    <Button
                      type="submit"
                      variation={ButtonVariation.PRIMARY}
                      rightIcon="chevron-right"
                      disabled={loading || isSaveButtonDisabled}
                    >
                      <String stringID="saveAndContinue" />
                    </Button>
                  </Layout.Horizontal>
                </FormikForm>
              )
            }}
          </Formik>
        </Container>
      </Layout.Vertical>
    </>
  )
}

export default ProviderOverviewStep
