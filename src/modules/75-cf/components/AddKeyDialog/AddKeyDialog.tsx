/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactNode } from 'react'
import { Spinner } from '@blueprintjs/core'
import * as yup from 'yup'
import {
  Button,
  ButtonProps,
  ButtonVariation,
  CardSelect,
  Container,
  Dialog,
  Formik,
  FormikForm,
  FormInput,
  Layout,
  Text
} from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { useModalHook } from '@harness/use-modal'
import type { FormikErrors } from 'formik'
import { NameSchema } from '@common/utils/Validation'
import { AddAPIKeyQueryParams, ApiKey, useAddAPIKey } from 'services/cf/index'
import { useEnvStrings } from '@cf/hooks/environment'
import { useToaster } from '@common/exports'
import { getIdentifierFromName } from '@common/utils/StringUtils'
import { EnvironmentSDKKeyType, getErrorMessage, showToaster } from '@cf/utils/CFUtils'
import type { EnvironmentResponseDTO } from 'services/cd-ng'
import RbacButton from '@rbac/components/Button/Button'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { Category, FeatureActions } from '@common/constants/TrackingConstants'
import nodejs from '@cf/images/icons/nodejs.svg'
import android from '@cf/images/icons/android.svg'
import dotnet from '@cf/images/icons/dotnet.svg'
import golang from '@cf/images/icons/golang.svg'
import ios from '@cf/images/icons/ios.svg'
import java from '@cf/images/icons/java.svg'
import javascript from '@cf/images/icons/javascript.svg'
import python from '@cf/images/icons/python.svg'
import css from './AddKeyDialog.module.scss'

export interface AddKeyDialogProps {
  disabled?: boolean
  primary?: boolean
  environment: EnvironmentResponseDTO
  onCreate: (newKey: ApiKey, hideModal: () => void) => void
  buttonProps?: ButtonProps
  keyType?: EnvironmentSDKKeyType
  apiKeys?: ApiKey[]
}

interface KeyValues {
  name: string
  type: EnvironmentSDKKeyType
}

const AddKeyDialog: React.FC<AddKeyDialogProps> = ({
  disabled,
  primary,
  environment,
  onCreate,
  buttonProps,
  keyType,
  apiKeys = []
}) => {
  const { showError } = useToaster()
  const { getString, getEnvString } = useEnvStrings()
  const { mutate: createKey, loading } = useAddAPIKey({
    queryParams: {
      accountIdentifier: environment.accountId as string,
      environmentIdentifier: environment.identifier as string,
      orgIdentifier: environment.orgIdentifier as string,
      projectIdentifier: environment.projectIdentifier as string
    } as AddAPIKeyQueryParams
  })

  const keyTypes = [
    {
      text: getEnvString('apiKeys.clientType'),
      value: EnvironmentSDKKeyType.CLIENT
    },
    {
      text: getEnvString('apiKeys.serverType'),
      value: EnvironmentSDKKeyType.SERVER
    }
  ].filter(type => !keyType || keyType === type.value)

  const initialValues: KeyValues = {
    name: '',
    type: keyType || EnvironmentSDKKeyType.SERVER
  }

  const getTypeOption = (value: string) => keyTypes.find(k => k.value === value) || keyTypes[0]

  const handleSubmit = (values: KeyValues): void => {
    trackEvent(FeatureActions.CreateSDKKeySubmit, {
      category: Category.FEATUREFLAG,
      data: values
    })
    createKey({
      identifier: getIdentifierFromName(values.name),
      name: values.name,
      type: values.type === 'server' ? 'Server' : 'Client'
    })
      .then((created: ApiKey) => {
        onCreate(created, hideModal)
        showToaster(getString('cf.environments.apiKeys.create'))
      })
      .catch(error => showError(getErrorMessage(error), undefined, 'cf.create.key.error'))
  }

  const { trackEvent } = useTelemetry()

  const languagesApplicable = (value: string): ReactNode => {
    return (
      <Layout.Vertical flex={{ alignItems: 'start' }} spacing="medium" padding={{ top: 'medium' }}>
        <Text color={Color.GREY_600} font={{ variation: FontVariation.SMALL }} flex={{ justifyContent: 'flex-end' }}>
          {getEnvString('apiKeys.applicableLanguages')}
        </Text>
        {value == 'server' ? (
          <Layout.Horizontal spacing="small">
            <img className={css.languageIcon} src={nodejs} alt="NodeJS" />
            <img className={css.languageIcon} src={java} alt="Java" />
            <img className={css.languageIcon} src={golang} alt="Golang" />
            <img className={css.languageIcon} src={dotnet} alt="DotNet" />
            <img className={css.languageIcon} src={python} alt="Python" />
          </Layout.Horizontal>
        ) : (
          <Layout.Horizontal spacing="small">
            <img className={css.languageIcon} src={javascript} alt="JavaScript" />
            <img className={css.languageIcon} src={android} alt="Android" />
            <img className={css.languageIcon} src={ios} alt="IOS" />
          </Layout.Horizontal>
        )}
      </Layout.Vertical>
    )
  }

  const handleValidation = (values: KeyValues): FormikErrors<KeyValues> => {
    const errors: { name?: string } = {}

    if (apiKeys.some((key: ApiKey) => key.name === values.name)) {
      errors.name = getEnvString('apiKeys.duplicateKey')
    }
    return errors
  }

  const [openModal, hideModal] = useModalHook(() => {
    return (
      <Dialog isOpen enforceFocus={false} onClose={hideModal} title={getEnvString('apiKeys.addKeyTitle')}>
        <Formik
          initialValues={initialValues}
          formName="addKeyDialog"
          validationSchema={yup.object().shape({
            name: NameSchema({ requiredErrorMsg: getEnvString('apiKeys.emptyName') })
          })}
          onSubmit={handleSubmit}
          onReset={() => {
            trackEvent(FeatureActions.CreateSDKKeySubmit, {
              category: Category.FEATUREFLAG
            })
            hideModal()
          }}
          validate={handleValidation}
        >
          {formikProps => (
            <FormikForm>
              <Layout.Vertical className={css.container} spacing="small" padding={{ left: 'xsmall', right: 'xsmall' }}>
                <FormInput.Text
                  className={css.nameTextbox}
                  label={getString('name')}
                  name="name"
                  inputGroup={{ autoFocus: true }}
                />

                {keyTypes.length > 1 && (
                  <>
                    <Text
                      color={Color.GREY_600}
                      font={{ weight: 'bold', variation: FontVariation.FORM_INPUT_TEXT }}
                      padding={{ top: 'medium' }}
                    >
                      {getEnvString('apiKeys.keyType')}
                    </Text>
                    <Container flex={{ justifyContent: 'left' }}>
                      <CardSelect
                        cornerSelected
                        data={keyTypes}
                        selected={getTypeOption(formikProps.values.type)}
                        className={css.cardSelect}
                        onChange={nextValue => formikProps.setFieldValue('type', nextValue.value)}
                        renderItem={cardData => (
                          <Container flex={{ align: 'center-center' }} className={css.cardBody}>
                            <Text font={{ variation: FontVariation.SMALL }}>{cardData.text}</Text>
                          </Container>
                        )}
                      />
                      {languagesApplicable(formikProps.values.type)}
                    </Container>
                  </>
                )}

                <Layout.Vertical spacing="medium" padding={{ bottom: 'medium', top: 'medium' }}>
                  <Text>
                    {formikProps.values.type == 'server'
                      ? getEnvString('apiKeys.serverDescription')
                      : getEnvString('apiKeys.clientDescription')}
                  </Text>
                  {keyTypes.length <= 1 ? languagesApplicable(formikProps.values.type) : null}
                </Layout.Vertical>
                <Layout.Horizontal className={css.buttonContainer} spacing="small" padding={{ top: 'xxlarge' }}>
                  <Button
                    text={getString('createSecretYAML.create')}
                    type="submit"
                    intent="primary"
                    disabled={loading}
                    variation={ButtonVariation.PRIMARY}
                  />
                  <Button text={getString('cancel')} type="reset" minimal variation={ButtonVariation.TERTIARY} />
                  {loading && <Spinner size={16} />}
                </Layout.Horizontal>
              </Layout.Vertical>
            </FormikForm>
          )}
        </Formik>
      </Dialog>
    )
  }, [loading, keyType])

  return (
    <RbacButton
      icon="plus"
      disabled={disabled}
      variation={ButtonVariation.PRIMARY}
      onClick={() => {
        trackEvent(FeatureActions.CreateSDKKeyClick, {
          category: Category.FEATUREFLAG
        })
        openModal()
      }}
      text={getString('cf.environments.apiKeys.addKey')}
      minimal={!primary}
      intent="primary"
      permission={{
        resource: { resourceType: ResourceType.ENVIRONMENT, resourceIdentifier: environment.identifier },
        permission: PermissionIdentifier.EDIT_ENVIRONMENT
      }}
      {...buttonProps}
    />
  )
}

export default AddKeyDialog
