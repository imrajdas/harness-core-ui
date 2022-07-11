/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { ConnectivityModeType } from '@common/components/ConnectivityMode/ConnectivityMode'
import type { IGitContextFormProps } from '@common/components/GitContextForm/GitContextForm'
import type { SaveToGitFormInterface } from '@common/components/SaveToGitForm/SaveToGitForm'
import type {
  ConnectorInfoDTO,
  ConnectorConnectivityDetails,
  Activity,
  EntityDetail,
  ConnectorRequestBody,
  ResponseBoolean,
  Connector
} from 'services/cd-ng'

interface ConnectorType {
  [key: string]: ConnectorInfoDTO['type']
}
interface ConnectorStatusType {
  [key: string]: ConnectorConnectivityDetails['status']
}

interface ReferenceEntityType {
  [key: string]: EntityDetail['type']
}

interface ActivityStatusType {
  [key: string]: Activity['activityStatus']
}

interface ActivityType {
  [key: string]: Activity['type']
}

export interface ConnectorCreateEditProps {
  gitData?: SaveToGitFormInterface
  payload?: Connector
}

export interface HelpPanelOptions {
  contentWidth: number
  referenceId: string
}
export interface CreateConnectorModalProps {
  onClose: () => void
  onSuccess: (data?: ConnectorRequestBody) => void | Promise<void>
  isEditMode: boolean
  setIsEditMode: (val: boolean) => void
  connectorInfo: ConnectorInfoDTO | void
  gitDetails?: IGitContextFormProps
  status?: ConnectorConnectivityDetails
  connectivityMode?: ConnectivityModeType
  setConnectivityMode?: (val: ConnectivityModeType) => void
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
  mock?: ResponseBoolean
}

export const Connectors: ConnectorType = {
  KUBERNETES_CLUSTER: 'K8sCluster',
  CUSTOM: 'CustomHealth',
  GIT: 'Git',
  GITHUB: 'Github',
  GITLAB: 'Gitlab',
  BITBUCKET: 'Bitbucket',
  AZURE_REPO: 'AzureRepo',
  VAULT: 'Vault',
  APP_DYNAMICS: 'AppDynamics',
  SPLUNK: 'Splunk',
  DOCKER: 'DockerRegistry',
  GCP: 'Gcp',
  GCP_KMS: 'GcpKms',
  LOCAL: 'Local',
  AWS: 'Aws',
  PDC: 'Pdc',
  AWS_CODECOMMIT: 'Codecommit',
  NEXUS: 'Nexus',
  ARTIFACTORY: 'Artifactory',
  CEAWS: 'CEAws',
  HttpHelmRepo: 'HttpHelmRepo',
  OciHelmRepo: 'OciHelmRepo',
  Jira: 'Jira',
  NEW_RELIC: 'NewRelic',
  AWS_KMS: 'AwsKms',
  PROMETHEUS: 'Prometheus',
  CE_AZURE: 'CEAzure',
  CE_KUBERNETES: 'CEK8sCluster',
  DATADOG: 'Datadog',
  AZURE_KEY_VAULT: 'AzureKeyVault',
  DYNATRACE: 'Dynatrace',
  SUMOLOGIC: 'SumoLogic',
  CE_GCP: 'GcpCloudCost',
  AWS_SECRET_MANAGER: 'AwsSecretManager',
  PAGER_DUTY: 'PagerDuty',
  SERVICE_NOW: 'ServiceNow',
  CUSTOM_HEALTH: 'CustomHealth',
  ERROR_TRACKING: 'ErrorTracking',
  AZURE: 'Azure',
  AWSSECRETMANAGER: 'AwsSecretManager',
  JENKINS: 'Jenkins'
}

export const ConnectorInfoText = {
  KUBERNETES_CLUSTER: 'Kubernetes',
  GIT: 'GIT',
  VAULT: 'Secret Manager',
  APP_DYNAMICS: 'AppDynamics',
  SPLUNK: 'Splunk',
  DOCKER: 'Docker',
  YAML: 'Create via YAML Builder',
  GCP: 'GCP',
  GCR: 'GCR',
  GCP_KMS: 'Secret Manager',
  LOCAL: 'Secret Manager',
  AWS: 'AWS',
  NEXUS: 'Nexus',
  ARTIFACTORY: 'Artifactory',
  DYNATRACE: 'Dynatrace',
  AZURE: 'Azure'
}

export const ConnectorStatus: ConnectorStatusType = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE'
}

export const EntityTypes: ReferenceEntityType = {
  PIPELINE: 'Pipelines',
  PROJECT: 'Projects',
  CONNECTOR: 'Connectors',
  SECRET: 'Secrets',
  SERVICE: 'Service',
  ENVIRONMENT: 'Environment',
  CV_CONFIG: 'CvConfig',
  INPUT_SETS: 'InputSets',
  CV_VERIFICATION_JOB: 'CvVerificationJob',
  CV_K8_ACTIVITY_SOURCE: 'CvKubernetesActivitySource'
}

export const ActivityStatus: ActivityStatusType = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED'
}

export const ActivityType: ActivityType = {
  CONNECTIVITY_CHECK: 'CONNECTIVITY_CHECK',
  ENTITY_USAGE: 'ENTITY_USAGE',
  ENTITY_CREATION: 'ENTITY_CREATION',
  ENTITY_UPDATE: 'ENTITY_UPDATE'
}

export const connectorUrlType = {
  ACCOUNT: 'Account',
  REPO: 'Repo',
  REGION: 'Region'
}

export const CONNECTOR_CREDENTIALS_STEP_IDENTIFIER = 'CONNECTOR_CREDENTIALS_STEP_IDENTIFIER'

export const TESTCONNECTION_STEP_INDEX = 3
export const GIT_TESTCONNECTION_STEP_INDEX = 4
export const SECRET_MANAGER_TESTCONNECTION_STEP_INDEX = 2

export const connectorHelperUrls = {
  ceAwsLaunchConsole: 'https://console.aws.amazon.com/billing/home?#/reports',
  ceAwscostUsageReportSteps:
    'https://docs.harness.io/article/80vbt5jv0q-set-up-cost-visibility-for-aws#step_2_cost_and_usage_report',
  ceAwsNoAccount:
    'https://newdocs.helpdocs.io/article/80vbt5jv0q-set-up-cost-visibility-for-aws#review_aws_access_permissions',
  ceAwsRoleARNsteps:
    'https://docs.harness.io/article/80vbt5jv0q-set-up-cost-visibility-for-aws#step_4_create_cross_account_role',
  ceAzureLaunchConsole: 'https://portal.azure.com/#blade/Microsoft_Azure_CostManagement/Menu/exports',
  ceAzureBillingExport:
    'https://docs.harness.io/article/v682mz6qfd-set-up-cost-visibility-for-azure#step_2_azure_billing_exports'
}

export const CONNECTOR_MODAL_MIN_WIDTH = 1175
