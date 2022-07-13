/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SelectOption } from '@wings-software/uicore'
import type { Intent } from '@harness/design-system'
import type { SecretReference } from '@secrets/components/CreateOrSelectSecret/CreateOrSelectSecret'
import type {
  ConnectorConfigDTO,
  ConnectorInfoDTO,
  ConnectorRequestBody,
  VaultMetadataRequestSpecDTO
} from 'services/cd-ng'
import type { SecretReferenceInterface } from '@secrets/utils/SecretField'

export interface KubFormData {
  name?: string
  description?: string
  identifier?: string
  tags?: string[]
  delegateType?: string
  delegateName?: string
  masterUrl?: string
  authType?: string | number | symbol
  username?: string
  passwordRef?: string
}
export interface GITFormData {
  name?: string
  description?: string
  identifier?: string
  tags?: string[]
  authType?: string | number | symbol
  branchName?: string
  connectType?: string | number | symbol
  connectionType?: string
  password?: string
  username?: string
  url?: string
}
export interface FormData {
  [key: string]: any
}
export interface StepDetails {
  step: number
  intent: Intent
  status: string
}
export enum CredTypeValues {
  ManualConfig = 'ManualConfig',
  AssumeIAMRole = 'AssumeIAMRole',
  AssumeRoleSTS = 'AssumeSTSRole'
}

export enum HashiCorpVaultAccessTypes {
  APP_ROLE = 'APP_ROLE',
  TOKEN = 'TOKEN',
  VAULT_AGENT = 'VAULT_AGENT',
  AWS_IAM = 'AWS_IAM',
  K8s_AUTH = 'K8s_AUTH'
}

export interface AwsKmsConfigFormData {
  accessKey?: SecretReference
  secretKey?: SecretReference
  awsArn?: SecretReference
  region?: string | SelectOption
  credType?: string | SelectOption
  delegate?: string[]
  roleArn?: string
  externalName?: string
  assumeStsRoleDuration?: string
  default: boolean
}

export interface StepDetailsProps extends ConnectorInfoDTO {
  name: string
}

export interface ConnectorDetailsProps {
  onConnectorCreated?: (data?: ConnectorRequestBody) => void | Promise<void>
  isEditMode: boolean
  setIsEditMode: (val: boolean) => void
  setFormData?: (formData: ConnectorConfigDTO) => void
  connectorInfo: ConnectorInfoDTO | void
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
}

export interface AwsSecretManagerConfigFormData {
  accessKey?: SecretReference
  secretKey?: SecretReference
  secretNamePrefix?: string
  region?: string | SelectOption
  credType?: string | SelectOption
  delegate?: string[]
  roleArn?: string
  externalId?: string
  assumeStsRoleDuration?: string
  default: boolean
}
export interface VaultConfigFormData {
  vaultUrl: string
  basePath: string
  namespace?: string
  readOnly: boolean
  default: boolean
  accessType: VaultMetadataRequestSpecDTO['accessType']
  appRoleId?: string
  secretId?: SecretReference
  authToken?: SecretReference
  sinkPath?: string
  renewalIntervalMinutes: number
  vaultK8sAuthRole?: string
  serviceAccountTokenPath?: string
  k8sAuthEndpoint?: string
}

export interface SetupEngineFormData {
  engineType?: 'fetch' | 'manual'
  secretEngine?: string
  secretEngineName?: string
  secretEngineVersion?: number
}

export interface GcpKmsConfigFormData {
  projectId?: string
  region?: string
  keyRing?: string
  keyName?: string
  credentials?: SecretReference
  default: boolean
}

export interface AzureFormInterface {
  delegateType?: string
  azureEnvironmentType?: string
  applicationId?: string
  tenantId?: string
  secretType?: string
  secretText?: SecretReferenceInterface | void
  secretFile?: SecretReferenceInterface | void
  clientId?: string
  managedIdentity?: string
}
