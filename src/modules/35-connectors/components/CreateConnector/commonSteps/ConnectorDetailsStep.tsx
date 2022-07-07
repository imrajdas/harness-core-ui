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
  StepProps,
  ModalErrorHandlerBinding,
  ModalErrorHandler,
  FormikForm,
  Container,
  Text,
  ButtonVariation
} from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import * as Yup from 'yup'
import { pick } from 'lodash-es'
import {
  ConnectorConfigDTO,
  ConnectorInfoDTO,
  ResponseBoolean,
  validateTheIdentifierIsUniquePromise,
  Failure
} from 'services/cd-ng'
import { String, useStrings } from 'framework/strings'
import { NameIdDescriptionTags } from '@common/components'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import GitContextForm, { GitContextProps, IGitContextFormProps } from '@common/components/GitContextForm/GitContextForm'
import { saveCurrentStepData } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { useConnectorWizard } from '@connectors/components/CreateConnectorWizard/ConnectorWizardContext'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { getHeadingIdByType } from '../../../pages/connectors/utils/ConnectorHelper'
import css from './ConnectorDetailsStep.module.scss'

export type DetailsForm = Pick<ConnectorInfoDTO, 'name' | 'identifier' | 'description' | 'tags'> & GitContextProps

interface ConnectorDetailsStepProps extends StepProps<ConnectorInfoDTO> {
  type: ConnectorInfoDTO['type']
  name: string
  setFormData?: (formData: ConnectorConfigDTO) => void
  formData?: ConnectorConfigDTO
  isEditMode?: boolean
  connectorInfo?: ConnectorInfoDTO | void
  gitDetails?: IGitContextFormProps
  mock?: ResponseBoolean
  disableGitSync?: boolean
  helpPanelReferenceId?: string
}

type Params = {
  accountId: string
  projectIdentifier: string
  orgIdentifier: string
}

const ConnectorDetailsStep: React.FC<StepProps<ConnectorConfigDTO> & ConnectorDetailsStepProps> = props => {
  const { prevStepData, nextStep, disableGitSync, connectorInfo } = props
  const {
    accountId,
    projectIdentifier: projectIdentifierFromUrl,
    orgIdentifier: orgIdentifierFromUrl
  } = useParams<Params>()
  const projectIdentifier = connectorInfo ? connectorInfo.projectIdentifier : projectIdentifierFromUrl
  const orgIdentifier = connectorInfo ? connectorInfo.orgIdentifier : orgIdentifierFromUrl
  const { isGitSyncEnabled: gitSyncAppStoreEnabled } = useAppStore()
  const isGitSyncEnabled = gitSyncAppStoreEnabled && !disableGitSync
  const showGitContextForm = isGitSyncEnabled && orgIdentifier && projectIdentifier

  const mounted = useRef(false)
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding | undefined>()
  const [loading, setLoading] = useState(false)
  const isEdit = props.isEditMode || prevStepData?.isEdit
  const { getString } = useStrings()
  useConnectorWizard({
    helpPanel: props.helpPanelReferenceId ? { referenceId: props.helpPanelReferenceId, contentWidth: 900 } : undefined
  })

  const handleSubmit = async (formData: ConnectorConfigDTO): Promise<void> => {
    mounted.current = true
    if (isEdit) {
      //In edit mode validateTheIdentifierIsUnique API not required
      props.setFormData?.(formData)
      nextStep?.({ ...props.connectorInfo, ...prevStepData, ...formData })
      return
    }
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

      if ('SUCCESS' !== response.status) {
        modalErrorHandler?.showDanger((response as Failure)?.message || '')
        return
      }
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
    } catch (error) {
      setLoading(false)
      modalErrorHandler?.showDanger(error.message)
    }
  }

  const getInitialValues = () => {
    if (isEdit) {
      return { ...pick(props.connectorInfo, ['name', 'identifier', 'description', 'tags']) }
    } else if (prevStepData) {
      return { ...pick(prevStepData, ['name', 'identifier', 'description', 'tags']) }
    } else {
      return {
        name: '',
        description: '',
        identifier: '',
        tags: {}
      }
    }
  }
  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.ConnectorDetailsStepLoad, {
    category: Category.CONNECTOR
  })

  return (
    <Layout.Vertical spacing="xxlarge" className={css.firstep}>
      <Text font={{ variation: FontVariation.H3 }} data-cy="connector-overview-heading">
        {getString(getHeadingIdByType(props.type))}
      </Text>
      <ModalErrorHandler bind={setModalErrorHandler} style={{ maxWidth: '740px' }} />

      <Container className={css.connectorForm}>
        <Formik<DetailsForm>
          onSubmit={formData => {
            trackEvent(ConnectorActions.ConnectorDetailsStepSubmit, {
              category: Category.CONNECTOR
            })
            handleSubmit(formData)
          }}
          formName={`connectorDetailsStepForm${props.type}`}
          validationSchema={Yup.object().shape({
            name: NameSchema(),
            identifier: IdentifierSchema()
          })}
          initialValues={{
            ...(getInitialValues() as DetailsForm),
            ...props.formData
          }}
        >
          {formikProps => {
            saveCurrentStepData<ConnectorInfoDTO>(
              props.getCurrentStepData,
              formikProps.values as unknown as ConnectorInfoDTO
            )
            return (
              <FormikForm>
                <Container style={{ minHeight: 460 }}>
                  <NameIdDescriptionTags
                    className={css.formElm}
                    formikProps={formikProps}
                    identifierProps={{ inputName: 'name', isIdentifierEditable: !isEdit }}
                  />

                  {showGitContextForm ? (
                    <GitSyncStoreProvider>
                      <GitContextForm
                        formikProps={formikProps as any}
                        gitDetails={props.gitDetails}
                        className={'gitDetailsContainer'}
                      />
                    </GitSyncStoreProvider>
                  ) : (
                    <></>
                  )}
                </Container>
                <Layout.Horizontal>
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
      </Container>
    </Layout.Vertical>
  )
}

export default ConnectorDetailsStep
