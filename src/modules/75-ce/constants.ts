/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@harness/icons'
import { getConfig } from 'services/config'
import type { StringsMap } from 'stringTypes'
import type { Provider } from './components/COCreateGateway/models'

export const allProviders: Provider[] = [
  {
    name: 'AWS',
    value: 'aws',
    icon: 'service-aws'
  },
  {
    name: 'Azure',
    value: 'azure',
    icon: 'service-azure'
  },
  {
    name: 'GCP',
    value: 'gcp',
    icon: 'gcp'
  }
]

export enum PAGE_NAME {
  PERSPECTIVE_EXPLORER,
  CREATE_PERSPECTIVE
}

export enum PROVIDER_TYPES {
  AWS = 'aws',
  AZURE = 'azure',
  GCP = 'gcp'
}

export const ceConnectorTypes: Record<string, PROVIDER_TYPES> = {
  GcpCloudCost: PROVIDER_TYPES.GCP,
  CEAws: PROVIDER_TYPES.AWS,
  CEAzure: PROVIDER_TYPES.AZURE
}

type GetGraphQLAPIConfigReturnType = {
  path: string
  queryParams: {
    accountIdentifier: string
  }
}

export const getGraphQLAPIConfig: (accountId: string) => GetGraphQLAPIConfigReturnType = (accountId: string) => {
  return {
    path: getConfig('ccm/api/graphql'),
    queryParams: {
      accountIdentifier: accountId
    }
  }
}
export const VALID_DOMAIN_REGEX =
  /((https?):\/\/)?(www.)?[a-z0-9-]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#-]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/

export enum ASRuleTabs {
  CONFIGURATION = 'configuration',
  SETUP_ACCESS = 'setupAccess',
  REVIEW = 'review'
}

export const ConnectorStatus = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE'
}

export enum GatewayKindType {
  INSTANCE = 'instance',
  KUBERNETES = 'k8s',
  DATABASE = 'database',
  CONTAINERS = 'containers',
  CLUSTERS = 'clusters'
}

export enum CCM_CHART_TYPES {
  COLUMN = 'column',
  AREA = 'area',
  LINE = 'line'
}

export const portProtocolMap: { [key: number]: string } = {
  80: 'http',
  443: 'https'
}

export const DEFAULT_ACCESS_DETAILS = {
  dnsLink: { selected: false },
  ssh: { selected: false },
  rdp: { selected: false },
  backgroundTasks: { selected: false },
  ipaddress: { selected: false }
}

export const providerLoadBalancerRefMap: Record<string, string> = {
  azure: 'Application Gateway',
  aws: 'Load Balancer',
  gcp: 'Load Balancer'
}

export const CONFIG_STEP_IDS = ['configStep1', 'configStep2', 'configStep3', 'configStep4']

export const CONFIG_IDLE_TIME_CONSTRAINTS = {
  MIN: 5,
  MAX: 600
}

export enum RESOURCES {
  INSTANCES = 'INSTANCES',
  ASG = 'ASG',
  KUBERNETES = 'KUBERNETES',
  ECS = 'ECS',
  RDS = 'RDS',
  IG = 'IG',
  AZURE_INSTANCES = 'AZURE_INSTANCES',
  GCP_INSTANCES = 'GCP_INSTANCES'
}

export const CONFIG_TOTAL_STEP_COUNTS = {
  DEFAULT: 4,
  MODIFIED: 3
}

export enum DaysOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6
}

export enum AS_RESOURCE_TYPE {
  rule = 'autostop_rule'
}

export const ENFORCEMENT_USAGE_THRESHOLD = 90

export enum AdvancedConfigTabs {
  deps = 'deps',
  schedules = 'schedules'
}

export enum AccessPointFormStep {
  FIRST = 1,
  SECOND = 2
}

export const allCloudProvidersList = [
  {
    label: 'AWS',
    value: 'aws'
  },
  {
    label: 'Azure',
    value: 'azure'
  },
  {
    label: 'GCP',
    value: 'gcp'
  }
]

export const notificationChannelsList = [
  {
    label: 'ce.anomalyDetection.notificationAlerts.slackChannelLabel',
    value: 'SLACK',
    icon: { name: 'service-slack' }
  },
  {
    label: 'ce.anomalyDetection.notificationAlerts.emailChannelLabel',
    value: 'EMAIL',
    icon: { name: 'email-inline' }
  },
  {
    label: 'ce.anomalyDetection.notificationAlerts.microsoftTeamChannelLabel',
    value: 'MSTEAMS',
    icon: { name: 'service-msteams' }
  }
]

export type channels = 'EMAIL' | 'SLACK' | 'PAGERDUTY' | 'MSTEAMS'

export const channelNameUrlMapping = {
  SLACK: 'slackWebHookUrl',
  EMAIL: 'emails',
  MSTEAMS: 'microsoftTeamsUrl'
}

export const channelImgMap = {
  SLACK: 'service-slack',
  EMAIL: 'email-inline',
  MSTEAMS: 'service-msteams',
  DEFAULT: '',
  PAGERDUTY: 'service-pagerduty'
}

export enum RulesMode {
  ACTIVE = 'active',
  DRY = 'dryrun'
}

export const folderViewType = {
  SAMPLE: 'SAMPLE',
  CUSTOMER: 'CUSTOMER',
  DEFAULT_AZURE: 'DEFAULT_AZURE',
  DEFAULT: 'DEFAULT'
}

export const moveFolderType = {
  NEW: 'NEW',
  EXISTING: 'EXISTING'
}

export const ruleServiceStatusLabelMap = new Map<
  string,
  { labelStringId: keyof StringsMap; intent: 'running' | 'stopped' | 'load'; icon?: IconName }
>([
  [
    'active',
    {
      labelStringId: 'ce.co.ruleState.running',
      intent: 'running',
      icon: 'play'
    }
  ],
  [
    'down',
    {
      labelStringId: 'ce.co.ruleState.stopped',
      intent: 'stopped',
      icon: 'pause'
    }
  ],
  [
    'created',
    {
      labelStringId: 'created',
      intent: 'running',
      icon: 'play'
    }
  ],
  [
    'warmingup',
    {
      labelStringId: 'ce.co.ruleState.warmingUp',
      intent: 'load',
      icon: 'loading'
    }
  ],
  [
    'coolingdown',
    {
      labelStringId: 'ce.co.ruleState.coolingDown',
      intent: 'load',
      icon: 'loading'
    }
  ]
])
