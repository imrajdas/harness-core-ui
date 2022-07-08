/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  FormikForm,
  FormInput,
  Button,
  Layout,
  Icon,
  Text,
  ButtonProps,
  Formik,
  ButtonVariation,
  getErrorInfoFromErrorObject,
  MultiTypeInputType
} from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import * as Yup from 'yup'
import cx from 'classnames'
import { FormGroup } from '@blueprintjs/core'
import { get, isEmpty } from 'lodash-es'
import { connect, FormikContextType, FormikErrors } from 'formik'
import { useToaster } from '@common/exports'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { MSTeamsNotificationConfiguration, NotificationType, TestStatus } from '@notifications/interfaces/Notifications'
import { useStrings } from 'framework/strings'
import { MSTeamSettingDTO, useTestNotificationSetting } from 'services/notifications'
import { ListInput } from '@common/components/ListInput/ListInput'
import UserGroupsInput from '@common/components/UserGroupsInput/UserGroupsInput'

import css from '@notifications/modals/ConfigureNotificationsModal/ConfigureNotificationsModal.module.scss'

interface MSTeamsNotificationsData {
  msTeamKeys: string[]
  userGroups: string[]
}

interface ConfigureMSTeamsNotificationsProps {
  onSuccess: (config: MSTeamsNotificationConfiguration) => void
  hideModal: () => void
  withoutHeading?: boolean
  isStep?: boolean
  onBack?: (config?: MSTeamsNotificationConfiguration) => void
  submitButtonText?: string
  config?: MSTeamsNotificationConfiguration
  expressions?: string[]
}

export const TestMSTeamsNotifications: React.FC<{
  data: MSTeamsNotificationsData
  errors: FormikErrors<MSTeamsNotificationsData>
  onClick?: () => Promise<boolean>
  buttonProps?: ButtonProps
}> = ({ data, onClick, buttonProps, errors }) => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const [testStatus, setTestStatus] = useState<TestStatus>(TestStatus.INIT)
  const { mutate: testNotificationSetting } = useTestNotificationSetting({})
  const { showSuccess, showError } = useToaster()

  const handleTest = async (testData: MSTeamsNotificationsData): Promise<void> => {
    if (onClick) {
      const success = await onClick()
      if (!success) return
    }
    try {
      setTestStatus(TestStatus.INIT)
      const resp = await testNotificationSetting({
        accountId,
        type: 'MSTEAMS',
        recipient: testData.msTeamKeys?.join(','),
        notificationId: 'MSTeams'
      } as MSTeamSettingDTO)
      if (resp.status === 'SUCCESS' && resp.data) {
        showSuccess(getString('notifications.msTestSuccess'))
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
      <Button
        text={getString('test')}
        disabled={Object.keys(errors).length > 0}
        onClick={() => handleTest(data)}
        {...buttonProps}
      />
      {testStatus === TestStatus.SUCCESS ? <Icon name="tick" className={cx(css.statusIcon, css.green)} /> : null}
      {testStatus === TestStatus.FAILED || testStatus === TestStatus.ERROR ? (
        <Icon name="cross" className={cx(css.statusIcon, css.red)} />
      ) : null}
    </>
  )
}

interface TeamsUrlListInputProps {
  name: string
  label: string
  formik?: FormikContextType<any>
  expressions?: string[]
  onTypeChange?: (typeMap: Record<string, string>) => void
}

function TeamsUrlListInputInternal(props: TeamsUrlListInputProps) {
  const [urlTypeMap, setUrlTypeMap] = useState<Record<string, string>>({})
  const { name, label, formik, expressions } = props
  const { getString } = useStrings()

  const value = get(formik?.values, name)

  React.useEffect(() => {
    if (isEmpty(value)) {
      formik?.setFieldValue(name, [''])
    }
  }, [])

  return (
    <FormGroup label={label} labelFor={name}>
      <ListInput
        name={name}
        elementList={value}
        deleteIconProps={{
          size: 18
        }}
        listItemRenderer={(_, index: number) =>
          expressions ? (
            <FormInput.MultiTextInput
              name={`${name}.${index}`}
              placeholder={getString('notifications.enterMicrosoftTeamsUrl')}
              label=""
              className={css.urlInput}
              multiTextInputProps={{
                allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION],
                expressions,
                onTypeChange: type => {
                  const map = {
                    ...urlTypeMap,
                    [`${name}.${index}`]: type
                  }
                  setUrlTypeMap(map)
                  props.onTypeChange?.(map)
                }
              }}
            />
          ) : (
            <FormInput.Text
              name={`${name}.${index}`}
              placeholder={getString('notifications.enterMicrosoftTeamsUrl')}
              className={css.urlInput}
            />
          )
        }
      />
    </FormGroup>
  )
}

const TeamsUrlListInput = connect(TeamsUrlListInputInternal)

const ConfigureMSTeamsNotifications: React.FC<ConfigureMSTeamsNotificationsProps> = props => {
  const [disableTestConnection, setDisableTestConnection] = useState<boolean>(false)
  const { getString } = useStrings()

  const handleSubmit = (formData: MSTeamsNotificationConfiguration): void => {
    props.onSuccess(formData)
  }

  return (
    <div className={css.body}>
      <Layout.Vertical spacing="large">
        <Text>{getString('notifications.helpMSTeams')}</Text>

        <a
          href="https://docs.harness.io/article/xcb28vgn82-send-notifications-to-microsoft-teams"
          rel="noreferrer"
          target="_blank"
        >
          {getString('learnMore')}
        </a>
        <Formik<MSTeamsNotificationConfiguration>
          onSubmit={handleSubmit}
          formName="configureMSTeamsNotifications"
          validationSchema={Yup.object().shape({
            msTeamKeys: Yup.array().when('userGroups', {
              is: val => isEmpty(val),
              then: Yup.array().of(Yup.string().required(getString('notifications.errors.msTeamUrlRequired')))
            })
          })}
          initialValues={{
            msTeamKeys: [],
            userGroups: [],
            type: NotificationType.MsTeams,
            ...props.config
          }}
        >
          {formik => {
            return (
              <FormikForm>
                <TeamsUrlListInput
                  name={'msTeamKeys'}
                  label={getString('notifications.labelMSTeam')}
                  expressions={props.expressions}
                  onTypeChange={map => {
                    setDisableTestConnection(Object.values(map).includes(MultiTypeInputType.EXPRESSION))
                  }}
                />
                <Layout.Horizontal margin={{ bottom: 'xxlarge' }} style={{ alignItems: 'center' }}>
                  <TestMSTeamsNotifications
                    data={formik.values}
                    errors={formik.errors}
                    buttonProps={{ disabled: disableTestConnection }}
                  />
                </Layout.Horizontal>
                <UserGroupsInput name="userGroups" label={getString('notifications.labelMSTeamsUserGroups')} />
                {props.isStep ? (
                  <Layout.Horizontal spacing="large" margin={{ bottom: 'medium' }} className={css.buttonGroupSlack}>
                    <Button
                      text={getString('back')}
                      variation={ButtonVariation.SECONDARY}
                      onClick={() => {
                        props.onBack?.(formik.values)
                      }}
                    />
                    <Button
                      text={props.submitButtonText || getString('next')}
                      variation={ButtonVariation.PRIMARY}
                      type="submit"
                    />
                  </Layout.Horizontal>
                ) : (
                  <Layout.Horizontal spacing={'medium'} margin={{ top: 'xxlarge', bottom: 'medium' }}>
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

export default ConfigureMSTeamsNotifications
