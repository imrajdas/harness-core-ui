/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React, { useState } from 'react'
import { FormInput, Icon, ModalErrorHandler, ModalErrorHandlerBinding, SelectOption } from '@wings-software/uicore'
import type { FormikContextType } from 'formik'
import { Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import { StringKeys, useStrings } from 'framework/strings'
import SecretInput from '@secrets/components/SecretInput/SecretInput'
import { VaultConfigFormData, HashiCorpVaultAccessTypes } from '@connectors/interfaces/ConnectorInterface'
import { useListAwsRegions } from 'services/portal'
import type { OrgPathProps } from '@common/interfaces/RouteInterfaces'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'

interface VaultConnectorFormFieldsProps {
  formik: FormikContextType<VaultConfigFormData>
}
type AccessType = {
  [key in HashiCorpVaultAccessTypes]: StringKeys
}
export const accessTypeOptionsMap: AccessType = {
  [HashiCorpVaultAccessTypes.APP_ROLE]: 'connectors.hashiCorpVault.appRole',
  [HashiCorpVaultAccessTypes.TOKEN]: 'token',
  [HashiCorpVaultAccessTypes.VAULT_AGENT]: 'connectors.hashiCorpVault.vaultAgent',
  [HashiCorpVaultAccessTypes.K8s_AUTH]: 'connectors.hashiCorpVault.k8s_auth',
  [HashiCorpVaultAccessTypes.AWS_IAM]: 'connectors.hashiCorpVault.awsAuth'
}
const VaultConnectorFormFields: React.FC<VaultConnectorFormFieldsProps> = ({ formik }) => {
  const { getString } = useStrings()
  const { accountId } = useParams<OrgPathProps>()
  const { ENABLE_K8S_AUTH_IN_VAULT } = useFeatureFlags()

  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding>()
  const {
    data: regionData,
    loading,
    error
  } = useListAwsRegions({
    queryParams: {
      accountId
    }
  })

  if (error) {
    modalErrorHandler?.showDanger(error.message)
  }

  const regionValues =
    regionData?.resource?.map(region => ({
      value: region.value,
      label: region.name || ''
    })) || []

  const accessTypeOptions: SelectOption[] = [
    {
      label: getString(accessTypeOptionsMap[HashiCorpVaultAccessTypes.APP_ROLE]),
      value: HashiCorpVaultAccessTypes.APP_ROLE
    },
    {
      label: getString(accessTypeOptionsMap[HashiCorpVaultAccessTypes.TOKEN]),
      value: HashiCorpVaultAccessTypes.TOKEN
    },
    {
      label: getString(accessTypeOptionsMap[HashiCorpVaultAccessTypes.VAULT_AGENT]),
      value: HashiCorpVaultAccessTypes.VAULT_AGENT
    },
    {
      label: getString(accessTypeOptionsMap[HashiCorpVaultAccessTypes.AWS_IAM]),
      value: HashiCorpVaultAccessTypes.AWS_IAM
    }
  ]

  if (ENABLE_K8S_AUTH_IN_VAULT) {
    accessTypeOptions.push({
      label: getString(accessTypeOptionsMap[HashiCorpVaultAccessTypes.K8s_AUTH]),
      value: HashiCorpVaultAccessTypes.K8s_AUTH
    })
  }

  return (
    <>
      <ModalErrorHandler bind={setModalErrorHandler} />
      <FormInput.Text name="vaultUrl" label={getString('connectors.hashiCorpVault.vaultUrl')} />
      <FormInput.Text name="basePath" label={getString('connectors.hashiCorpVault.baseSecretPath')} />
      <FormInput.Text
        name="namespace"
        label={getString('common.namespace')}
        placeholder={getString('connectors.hashiCorpVault.root')}
      />
      <FormInput.Select name="accessType" label={getString('authentication')} items={accessTypeOptions} />
      {formik?.values['accessType'] === HashiCorpVaultAccessTypes.APP_ROLE ? (
        <>
          <FormInput.Text name="appRoleId" label={getString('connectors.hashiCorpVault.appRoleId')} />
          <SecretInput
            name="secretId"
            label={getString('connectors.hashiCorpVault.secretId')}
            connectorTypeContext={'Vault'}
          />
        </>
      ) : formik?.values['accessType'] === HashiCorpVaultAccessTypes.AWS_IAM ? (
        <>
          <SecretInput name="xvaultAwsIamServerId" label={getString('connectors.hashiCorpVault.serverIdHeader')} />
          <FormInput.Text name="vaultAwsIamRole" label={getString('common.role')} />
          {loading ? (
            <Icon margin="medium" name="spinner" size={15} color={Color.BLUE_500} />
          ) : (
            <FormInput.Select
              disabled={loading}
              name="awsRegion"
              items={regionValues}
              label={getString('regionLabel')}
            />
          )}
        </>
      ) : formik?.values['accessType'] === HashiCorpVaultAccessTypes.TOKEN ? (
        <SecretInput name="authToken" label={getString('token')} connectorTypeContext={'Vault'} />
      ) : formik?.values['accessType'] === HashiCorpVaultAccessTypes.K8s_AUTH ? (
        <>
          <FormInput.Text
            name="k8sAuthEndpoint"
            label={getString('optionalField', { name: getString('connectors.hashiCorpVault.k8sAuthEndpoint') })}
          />
          <FormInput.Text name="vaultK8sAuthRole" label={getString('connectors.hashiCorpVault.vaultK8sAuthRole')} />
          <FormInput.Text
            name="serviceAccountTokenPath"
            label={getString('connectors.hashiCorpVault.serviceAccountTokenPath')}
          />
        </>
      ) : (
        <FormInput.Text name="sinkPath" label={getString('connectors.hashiCorpVault.sinkPath')} />
      )}
      {formik?.values['accessType'] !== HashiCorpVaultAccessTypes.VAULT_AGENT &&
      formik?.values['accessType'] !== HashiCorpVaultAccessTypes.AWS_IAM &&
      formik?.values['accessType'] !== HashiCorpVaultAccessTypes.K8s_AUTH ? (
        <FormInput.Text name="renewalIntervalMinutes" label={getString('connectors.hashiCorpVault.renewal')} />
      ) : null}

      <FormInput.CheckBox
        name="readOnly"
        label={getString('connectors.hashiCorpVault.readOnlyVault')}
        padding={{ left: 'xxlarge' }}
      />
      <FormInput.CheckBox
        name="default"
        label={getString('connectors.hashiCorpVault.defaultVault')}
        padding={{ left: 'xxlarge' }}
      />
    </>
  )
}

export default VaultConnectorFormFields
