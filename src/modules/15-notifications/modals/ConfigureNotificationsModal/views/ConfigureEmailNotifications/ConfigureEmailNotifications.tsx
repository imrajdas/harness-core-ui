/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import * as Yup from 'yup'
import {
  FormikForm,
  FormInput,
  Button,
  Formik,
  Layout,
  Container,
  Icon,
  Heading,
  ButtonProps,
  ButtonVariation,
  getErrorInfoFromErrorObject
} from '@wings-software/uicore'
import { Popover, Spinner } from '@blueprintjs/core'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import { isEmpty } from 'lodash-es'
import { EmailSchema, EmailSchemaWithoutRequired } from '@common/utils/Validation'
import { useToaster } from '@common/components'
import UserGroupsInput from '@common/components/UserGroupsInput/UserGroupsInput'
import type { EmailNotificationConfiguration } from '@notifications/interfaces/Notifications'
import { TestStatus, NotificationType } from '@notifications/interfaces/Notifications'
import { useTestNotificationSetting, EmailSettingDTO } from 'services/notifications'
import { useStrings } from 'framework/strings'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import css from '../../ConfigureNotificationsModal.module.scss'

interface EmailTestConfigData {
  to: string
  subject: string
  body: string
}

interface ConfigureEmailNotificationsProps {
  onSuccess: (notificationConfiguration: EmailNotificationConfiguration) => void
  hideModal: () => void
  isStep?: boolean
  onBack?: (config?: EmailNotificationConfiguration) => void
  withoutHeading?: boolean
  submitButtonText?: string
  config?: EmailNotificationConfiguration
}

interface TestEmailConfigProps {
  handleTest: (formData: EmailTestConfigData) => void
}

export const TestEmailConfig: React.FC<TestEmailConfigProps> = props => {
  const { getString } = useStrings()
  const handleSubmit = (_formData: EmailTestConfigData): void => {
    props.handleTest(_formData)
    // call test api
  }

  return (
    <Container padding={'large'}>
      <Formik<EmailTestConfigData>
        onSubmit={handleSubmit}
        formName="configureTestEmailNotifications"
        validationSchema={Yup.object().shape({
          to: EmailSchema(),
          subject: Yup.string().trim().required(getString('common.smtp.validationSubject')),
          body: Yup.string().trim().required(getString('common.smtp.validationBody'))
        })}
        initialValues={{
          to: '',
          subject: '',
          body: ''
        }}
      >
        {formik => {
          return (
            <FormikForm>
              <FormInput.Text name={'to'} label={getString('common.smtp.labelTo')} />
              <FormInput.Text name={'subject'} label={getString('common.smtp.labelSubject')} />
              <FormInput.Text name={'body'} label={getString('common.smtp.labelBody')} />
              <Button
                text={getString('notifications.buttonSend')}
                onClick={event => {
                  event.stopPropagation()
                  formik.submitForm()
                }}
              />
            </FormikForm>
          )
        }}
      </Formik>
    </Container>
  )
}

export const TestEmailNotifications: React.FC<{ onClick?: () => void; buttonProps?: ButtonProps }> = ({
  onClick,
  buttonProps
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const { showSuccess, showError } = useToaster()
  const [testStatus, setTestStatus] = useState<TestStatus>(TestStatus.INIT)
  const { mutate: testNotificationSetting, loading } = useTestNotificationSetting({})

  const handleTest = async (testData: EmailTestConfigData): Promise<void> => {
    setIsOpen(false)
    setTestStatus(TestStatus.LOADING)
    try {
      const resp = await testNotificationSetting({
        accountId,
        type: 'EMAIL',
        recipient: testData.to,
        notificationId: 'asd',
        subject: testData.subject,
        body: testData.body
      } as EmailSettingDTO)
      if (resp.status === 'SUCCESS' && resp.data) {
        showSuccess(getString('notifications.emailTestSuccess'))
        setTestStatus(TestStatus.SUCCESS)
      } else {
        showError(getString('somethingWentWrong'))
        setTestStatus(TestStatus.FAILED)
      }
    } catch (err) {
      showError(getErrorInfoFromErrorObject(err))
      setTestStatus(TestStatus.ERROR)
    }
  }

  return (
    <>
      <Popover isOpen={isOpen} onInteraction={setIsOpen}>
        <Button
          text={loading ? <Spinner size={Spinner.SIZE_SMALL} /> : getString('test')}
          disabled={loading}
          onClick={onClick}
          tooltipProps={{ dataTooltipId: 'testEmailConfigButton' }}
          {...buttonProps}
        />
        <TestEmailConfig handleTest={handleTest} />
      </Popover>
      {testStatus === TestStatus.SUCCESS ? <Icon name="tick" className={cx(css.statusIcon, css.green)} /> : null}
      {testStatus === TestStatus.FAILED || testStatus === TestStatus.ERROR ? (
        <Icon name="cross" className={cx(css.statusIcon, css.red)} />
      ) : null}
    </>
  )
}

interface EmailNotificationData {
  emailIds: string
  userGroups: string[]
}

const ConfigureEmailNotifications: React.FC<ConfigureEmailNotificationsProps> = props => {
  const { getString } = useStrings()

  const handleSubmit = (formData: EmailNotificationData): void => {
    props.onSuccess(convertFormData(formData))
    props.hideModal()
  }

  const convertFormData = (formData: EmailNotificationData) => {
    return {
      type: NotificationType.Email,
      emailIds: formData.emailIds
        .split(',')
        .map(email => email.trim())
        .filter(email => email),
      userGroups: formData.userGroups
    }
  }
  return (
    <div className={css.body}>
      <Layout.Vertical spacing="large">
        {props.withoutHeading ? null : <Heading className={css.title}>{getString('notifications.titleEmail')}</Heading>}
        <Formik
          onSubmit={handleSubmit}
          validationSchema={Yup.object().shape({
            emailIds: Yup.string().when('userGroups', {
              is: val => isEmpty(val),
              then: EmailSchema({ allowMultiple: true, emailSeparator: ',' }),
              otherwise: EmailSchemaWithoutRequired({ allowMultiple: true, emailSeparator: ',' })
            })
          })}
          initialValues={{
            emailIds: props.config?.emailIds.toString() || '',
            userGroups: props.config?.userGroups || []
          }}
          formName="configureEmailNotifications"
          enableReinitialize={true}
        >
          {formik => {
            return (
              <FormikForm>
                <FormInput.TextArea name={'emailIds'} label={getString('notifications.emailRecipients')} />
                <UserGroupsInput name="userGroups" label={getString('notifications.labelEmailUserGroups')} />
                <Layout.Horizontal style={{ alignItems: 'center' }}>
                  <TestEmailNotifications />
                </Layout.Horizontal>
                {props.isStep ? (
                  <Layout.Horizontal spacing="large" className={css.buttonGroupEmail}>
                    <Button
                      text={getString('back')}
                      variation={ButtonVariation.SECONDARY}
                      onClick={() => {
                        props.onBack?.(convertFormData(formik.values))
                      }}
                    />
                    <Button
                      text={props.submitButtonText || getString('next')}
                      variation={ButtonVariation.PRIMARY}
                      type="submit"
                    />
                  </Layout.Horizontal>
                ) : (
                  <Layout.Horizontal spacing={'medium'} margin={{ top: 'huge' }}>
                    <Button
                      type={'submit'}
                      variation={ButtonVariation.PRIMARY}
                      text={props.submitButtonText || getString('submit')}
                    />
                    <Button
                      text={getString('cancel')}
                      variation={ButtonVariation.SECONDARY}
                      onClick={props.hideModal}
                    />
                  </Layout.Horizontal>
                )}
              </FormikForm>
            )
          }}
        </Formik>
      </Layout.Vertical>
    </div>
  )
}

export default ConfigureEmailNotifications
