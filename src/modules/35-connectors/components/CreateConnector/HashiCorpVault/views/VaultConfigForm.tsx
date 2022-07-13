/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React, { useState } from 'react'
import * as Yup from 'yup'
import { Button, Formik, FormikForm, Layout, StepProps, Container, Text, ButtonVariation } from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import type { VaultConnectorDTO } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { URLValidationSchema } from '@common/utils/Validation'
import { PageSpinner } from '@common/components'
import { setupVaultFormData } from '@connectors/pages/connectors/utils/ConnectorUtils'
import {
  StepDetailsProps,
  ConnectorDetailsProps,
  VaultConfigFormData,
  HashiCorpVaultAccessTypes
} from '@connectors/interfaces/ConnectorInterface'
import { Connectors } from '@connectors/constants'
import { useConnectorWizard } from '@connectors/components/CreateConnectorWizard/ConnectorWizardContext'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import VaultConnectorFormFields from './VaultConnectorFormFields'

const VaultConfigForm: React.FC<StepProps<StepDetailsProps> & ConnectorDetailsProps> = ({
  prevStepData,
  previousStep,
  nextStep,
  isEditMode,
  connectorInfo,
  accountId
}) => {
  const { getString } = useStrings()

  const defaultInitialFormData: VaultConfigFormData = {
    vaultUrl: '',
    basePath: '',
    namespace: undefined,
    readOnly: false,
    default: false,
    accessType: HashiCorpVaultAccessTypes.APP_ROLE,
    appRoleId: '',
    secretId: undefined,
    authToken: undefined,
    sinkPath: undefined,
    renewalIntervalMinutes: 10,
    k8sAuthEndpoint: '',
    vaultK8sAuthRole: '',
    serviceAccountTokenPath: ''
  }

  const [initialValues, setInitialValues] = useState(defaultInitialFormData)
  const [loadingFormData, setLoadingFormData] = useState(isEditMode)
  useConnectorWizard({ helpPanel: { referenceId: 'HashiCorpVaultDetails', contentWidth: 900 } })

  React.useEffect(() => {
    if (isEditMode && connectorInfo) {
      setupVaultFormData(connectorInfo, accountId).then(data => {
        setInitialValues(data as VaultConfigFormData)
        setLoadingFormData(false)
      })
    }
  }, [isEditMode, connectorInfo])

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.ConfigLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.Vault
  })

  return loadingFormData ? (
    <PageSpinner />
  ) : (
    <Container padding={{ top: 'medium' }}>
      <Text font={{ variation: FontVariation.H3 }} padding={{ bottom: 'xlarge' }}>
        {getString('connectors.hashiCorpVault.stepTwoName')}
      </Text>
      <Formik<VaultConfigFormData>
        enableReinitialize
        initialValues={{ ...initialValues, ...prevStepData }}
        formName="vaultConfigForm"
        validationSchema={Yup.object().shape({
          vaultUrl: URLValidationSchema(),
          renewalIntervalMinutes: Yup.mixed().when('accessType', {
            is: val => val !== HashiCorpVaultAccessTypes.VAULT_AGENT && val !== HashiCorpVaultAccessTypes.AWS_IAM,
            then: Yup.number()
              .positive(getString('validation.renewalNumber'))
              .required(getString('validation.renewalInterval'))
          }),
          authToken: Yup.object()
            .nullable()
            .when('accessType', {
              is: HashiCorpVaultAccessTypes.TOKEN,
              then: Yup.object().test('authToken', getString('validation.authToken'), function (value) {
                if ((prevStepData?.spec as VaultConnectorDTO)?.accessType === HashiCorpVaultAccessTypes.TOKEN)
                  return true
                else if (value?.name?.length > 0) return true
                return false
              })
            }),
          appRoleId: Yup.string().when('accessType', {
            is: HashiCorpVaultAccessTypes.APP_ROLE,
            then: Yup.string().trim().required(getString('validation.appRole'))
          }),
          secretId: Yup.object().when('accessType', {
            is: HashiCorpVaultAccessTypes.APP_ROLE,
            then: Yup.object().test('secretId', getString('validation.secretId'), function (value) {
              if ((prevStepData?.spec as VaultConnectorDTO)?.accessType === HashiCorpVaultAccessTypes.APP_ROLE)
                return true
              else if (value?.name?.length > 0) return true
              return false
            })
          }),
          sinkPath: Yup.string().when('accessType', {
            is: HashiCorpVaultAccessTypes.VAULT_AGENT,
            then: Yup.string().trim().required(getString('connectors.hashiCorpVault.sinkPathIsRequired'))
          }),
          xvaultAwsIamServerId: Yup.object().when('accessType', {
            is: HashiCorpVaultAccessTypes.AWS_IAM,
            then: Yup.object().test(
              'secretId',
              getString('connectors.hashiCorpVault.serverIdHeaderRequired'),
              function (value) {
                if (
                  (prevStepData?.spec as VaultConnectorDTO)?.accessType === HashiCorpVaultAccessTypes.AWS_IAM ||
                  value?.name?.length > 0
                ) {
                  return true
                }
                return false
              }
            )
          }),
          vaultAwsIamRole: Yup.string().when('accessType', {
            is: HashiCorpVaultAccessTypes.AWS_IAM,
            then: Yup.string().trim().required(getString('common.banners.trial.contactSalesForm.roleValidation'))
          }),
          awsRegion: Yup.string().when('accessType', {
            is: HashiCorpVaultAccessTypes.AWS_IAM,
            then: Yup.string().trim().required(getString('validation.regionRequired'))
          }),
          vaultK8sAuthRole: Yup.string().when('accessType', {
            is: HashiCorpVaultAccessTypes.K8s_AUTH,
            then: Yup.string().trim().required(getString('connectors.hashiCorpVault.vaultK8sAuthRoleRequired'))
          }),
          serviceAccountTokenPath: Yup.string().when('accessType', {
            is: HashiCorpVaultAccessTypes.K8s_AUTH,
            then: Yup.string().trim().required(getString('connectors.hashiCorpVault.serviceAccountRequired'))
          }),
          default: Yup.boolean().when('readOnly', {
            is: true,
            then: Yup.boolean().equals([false], getString('connectors.hashiCorpVault.preventDefaultWhenReadOnly'))
          })
        })}
        onSubmit={formData => {
          trackEvent(ConnectorActions.ConfigSubmit, {
            category: Category.CONNECTOR,
            connector_type: Connectors.Vault
          })
          nextStep?.({ ...connectorInfo, ...prevStepData, ...formData } as StepDetailsProps)
        }}
      >
        {formik => {
          return (
            <FormikForm>
              <VaultConnectorFormFields formik={formik} />
              <Layout.Horizontal spacing="medium">
                <Button
                  variation={ButtonVariation.SECONDARY}
                  icon="chevron-left"
                  text={getString('back')}
                  onClick={() => previousStep?.(prevStepData)}
                />
                <Button type="submit" intent="primary" rightIcon="chevron-right" text={getString('continue')} />
              </Layout.Horizontal>
            </FormikForm>
          )
        }}
      </Formik>
    </Container>
  )
}

export default VaultConfigForm
