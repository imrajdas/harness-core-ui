/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { Spinner } from '@blueprintjs/core'
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
import * as Yup from 'yup'
import { EnvironmentResponseDTO, ResponseEnvironmentResponseDTO, useCreateEnvironment } from 'services/cd-ng'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { Description } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'
import { useToaster } from '@common/exports'
import { useEnvStrings } from '@cf/hooks/environment'
import { getErrorMessage } from '@cf/utils/CFUtils'
import { EnvironmentType } from '@common/constants/EnvironmentType'
import RbacButton from '@rbac/components/Button/Button'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import usePlanEnforcement from '@cf/hooks/usePlanEnforcement'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { Category, FeatureActions } from '@common/constants/TrackingConstants'
import css from './EnvironmentDialog.module.scss'

export interface EnvironmentDialogProps {
  disabled?: boolean
  onCreate: (response?: ResponseEnvironmentResponseDTO) => void
  buttonProps?: ButtonProps
  environments?: EnvironmentResponseDTO[]
}

interface EnvironmentValues {
  name: string
  identifier: string
  description: string
  tags: string[]
  type: EnvironmentType
}

const EnvironmentDialog: React.FC<EnvironmentDialogProps> = ({ disabled, onCreate, buttonProps, environments }) => {
  const { showError } = useToaster()
  const { getString, getEnvString } = useEnvStrings()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<Record<string, string>>()
  const { mutate: createEnv, loading } = useCreateEnvironment({
    queryParams: {
      accountId
    }
  })

  const envTypes = [
    {
      text: getString('production'),
      value: EnvironmentType.PRODUCTION
    },
    {
      text: getString('nonProduction'),
      value: EnvironmentType.NON_PRODUCTION
    }
  ]

  const getTypeOption = (v: string) => envTypes.find(x => x.value === v) || envTypes[0]

  const initialValues: EnvironmentValues = {
    name: '',
    identifier: '',
    description: '',
    type: EnvironmentType.NON_PRODUCTION,
    tags: []
  }

  const handleSubmit = (values: EnvironmentValues) => {
    trackEvent(FeatureActions.CreateEnvSubmit, {
      category: Category.FEATUREFLAG,
      data: values
    })
    createEnv({
      name: values.name,
      identifier: values.identifier,
      description: values.description,
      projectIdentifier,
      orgIdentifier,
      type: values.type,
      tags: values.tags.length > 0 ? values.tags.reduce((acc, next) => ({ ...acc, [next]: next }), {}) : {}
    })
      .then(response => {
        hideModal()
        onCreate(response)
      })
      .catch(error => {
        showError(getErrorMessage(error), 0, 'cf.create.env.error')
      })
  }

  const { isPlanEnforcementEnabled } = usePlanEnforcement()

  const planEnforcementProps = isPlanEnforcementEnabled
    ? {
        featuresProps: {
          featuresRequest: {
            featureNames: [FeatureIdentifier.MAUS]
          }
        }
      }
    : undefined

  const handleValidation = (values: EnvironmentValues): FormikErrors<EnvironmentValues> => {
    const errors: { name?: string } = {}

    if (environments?.some(env => env.name === values.name)) {
      errors.name = getEnvString('create.duplicateName')
    }
    return errors
  }
  const { trackEvent } = useTelemetry()

  const [openModal, hideModal] = useModalHook(() => {
    return (
      <Dialog
        enforceFocus={false}
        isOpen
        onClose={hideModal}
        className={css.dialog}
        title={getEnvString('create.title')}
      >
        <Formik
          initialValues={initialValues}
          formName="cfEnvDialog"
          onSubmit={handleSubmit}
          onReset={() => {
            trackEvent(FeatureActions.CreateEnvCancel, {
              category: Category.FEATUREFLAG
            })
            hideModal()
          }}
          validationSchema={Yup.object().shape({
            name: NameSchema({ requiredErrorMsg: getString?.('fieldRequired', { field: 'Environment' }) }),
            identifier: IdentifierSchema()
          })}
          validate={handleValidation}
        >
          {formikProps => {
            return (
              <FormikForm>
                <Text color={Color.GREY_800} font={{ variation: FontVariation.SMALL }}>
                  {getEnvString('create.description')}
                </Text>
                <Layout.Vertical padding={{ top: 'medium', left: 'xsmall', right: 'xsmall' }} className={css.container}>
                  <FormInput.InputWithIdentifier
                    inputName="name"
                    idName="identifier"
                    isIdentifierEditable
                    inputLabel={getEnvString('create.nameLabel')}
                    inputGroupProps={{ inputGroup: { autoFocus: true } }}
                  />
                  <Description />
                  <Layout.Vertical spacing="small">
                    <Text font={{ variation: FontVariation.FORM_LABEL }}>{getEnvString('create.envTypeLabel')}</Text>
                    <CardSelect
                      cornerSelected
                      data={envTypes}
                      selected={getTypeOption(formikProps.values.type)}
                      className={css.cardSelect}
                      onChange={nextValue => formikProps.setFieldValue('type', nextValue.value)}
                      renderItem={cardData => (
                        <Container
                          flex={{ align: 'center-center', distribution: 'space-between', justifyContent: 'center' }}
                          className={css.cardBody}
                        >
                          <Text font={{ variation: FontVariation.SMALL }}>{cardData.text}</Text>
                        </Container>
                      )}
                    />
                  </Layout.Vertical>
                </Layout.Vertical>
                <Layout.Horizontal spacing="small" padding={{ top: 'xxlarge' }}>
                  <Button
                    variation={ButtonVariation.PRIMARY}
                    type="submit"
                    text={getString('createSecretYAML.create')}
                    intent="primary"
                    disabled={loading}
                  />
                  <Button variation={ButtonVariation.TERTIARY} text={getString('cancel')} type="reset" minimal />
                  {loading && <Spinner size={16} />}
                </Layout.Horizontal>
              </FormikForm>
            )
          }}
        </Formik>
      </Dialog>
    )
  }, [loading])

  return (
    <RbacButton
      icon="plus"
      disabled={disabled}
      onClick={() => {
        trackEvent(FeatureActions.CreateEnvClick, {
          category: Category.FEATUREFLAG
        })
        openModal()
      }}
      text={getString('newEnvironment')}
      intent="primary"
      variation={ButtonVariation.PRIMARY}
      padding={{
        top: 'small',
        bottom: 'small',
        left: 'huge',
        right: 'huge'
      }}
      permission={{
        resource: { resourceType: ResourceType.ENVIRONMENT },
        permission: PermissionIdentifier.EDIT_ENVIRONMENT
      }}
      {...buttonProps}
      {...planEnforcementProps}
    />
  )
}

export default EnvironmentDialog
