/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@wings-software/uicore'
// temporary mock data
import { parse } from 'yaml'
import type { ConnectorInfoDTO } from 'services/cd-ng'
import type { AddDrawerMapInterface } from '@common/components/AddDrawer/AddDrawer'
import type { StringKeys } from 'framework/strings'
import {
  manifestTypeIcons,
  ManifestDataType,
  manifestTypeLabels
} from '@pipeline/components/ManifestSelection/Manifesthelper'
import {
  ArtifactIconByType,
  ArtifactTitleIdByType,
  ENABLED_ARTIFACT_TYPES
} from '@pipeline/components/ArtifactsSelection/ArtifactHelper'
import { TriggerTypes, AWS_CODECOMMIT, AwsCodeCommit } from './TriggersWizardPageUtils'

export const GitSourceProviders: Record<
  string,
  { value: ConnectorInfoDTO['type'] | 'AwsCodeCommit' | 'Custom'; iconName: IconName }
> = {
  GITHUB: { value: 'Github', iconName: 'github' },
  GITLAB: { value: 'Gitlab', iconName: 'service-gotlab' },
  BITBUCKET: { value: 'Bitbucket', iconName: 'bitbucket-selected' },
  AZURE_REPO: { value: 'AzureRepo', iconName: 'service-azure' },
  AWS_CODECOMMIT: { value: 'AwsCodeCommit', iconName: 'service-aws-code-deploy' },
  CUSTOM: { value: 'Custom', iconName: 'build' }
}

const TriggerTypeIcons = {
  SCHEDULE: 'trigger-schedule',
  NEW_ARTIFACT: 'new-artifact'
}
export const getTriggerIcon = ({
  type,
  webhookSourceRepo,
  buildType
}: {
  type: string
  webhookSourceRepo?: string // string temporary until backend
  buildType?: string
}): IconName => {
  const updatedWebhookSourceRepo =
    webhookSourceRepo === AwsCodeCommit ? AWS_CODECOMMIT : webhookSourceRepo?.toUpperCase()
  const webhookSourceRepoIconName =
    webhookSourceRepo && updatedWebhookSourceRepo && GitSourceProviders[updatedWebhookSourceRepo]?.iconName
  if (type === TriggerTypes.WEBHOOK && webhookSourceRepoIconName) {
    return webhookSourceRepoIconName as IconName
  } else if (type === TriggerTypes.SCHEDULE) {
    return TriggerTypeIcons.SCHEDULE as IconName
  } else if (type === TriggerTypes.MANIFEST && buildType) {
    if (buildType === ManifestDataType.HelmChart) {
      return manifestTypeIcons.HelmChart
    }
  } else if (type === TriggerTypes.ARTIFACT && buildType) {
    switch (buildType) {
      case ENABLED_ARTIFACT_TYPES.Gcr:
        return ArtifactIconByType.Gcr
      case ENABLED_ARTIFACT_TYPES.Ecr:
        return ArtifactIconByType.Ecr
      case ENABLED_ARTIFACT_TYPES.DockerRegistry:
        return ArtifactIconByType.DockerRegistry
      case ENABLED_ARTIFACT_TYPES.Acr:
        return ArtifactIconByType.Acr
    }
  }
  return 'yaml-builder-trigger'
}

const triggerDrawerMap = (getString: (key: StringKeys) => string): AddDrawerMapInterface => ({
  drawerLabel: getString('common.triggersLabel'),
  showAllLabel: getString('triggers.showAllTriggers'),
  categories: [
    {
      categoryLabel: getString('execution.triggerType.WEBHOOK'),
      categoryValue: 'Webhook',
      items: [
        {
          itemLabel: getString('common.repo_provider.githubLabel'),
          value: GitSourceProviders.GITHUB.value,
          iconName: GitSourceProviders.GITHUB.iconName
        },
        {
          itemLabel: getString('common.repo_provider.gitlabLabel'),
          value: GitSourceProviders.GITLAB.value,
          iconName: GitSourceProviders.GITLAB.iconName
        },
        {
          itemLabel: getString('common.repo_provider.bitbucketLabel'),
          value: GitSourceProviders.BITBUCKET.value,
          iconName: GitSourceProviders.BITBUCKET.iconName
        },
        {
          itemLabel: getString('common.repo_provider.azureRepos'),
          value: GitSourceProviders.AZURE_REPO.value,
          iconName: GitSourceProviders.AZURE_REPO.iconName
        },
        {
          itemLabel: getString('common.repo_provider.awscodecommit'),
          value: GitSourceProviders.AWS_CODECOMMIT.value,
          iconName: GitSourceProviders.AWS_CODECOMMIT.iconName
        },
        {
          itemLabel: getString('common.repo_provider.customLabel'),
          value: GitSourceProviders.CUSTOM.value,
          iconName: GitSourceProviders.CUSTOM.iconName
        }
      ]
    },
    {
      categoryLabel: getString('pipeline.artifactTriggerConfigPanel.artifact'),
      categoryValue: 'Artifact',
      items: [
        {
          itemLabel: getString(ArtifactTitleIdByType[ENABLED_ARTIFACT_TYPES.Gcr]),
          value: ENABLED_ARTIFACT_TYPES.Gcr,
          iconName: ArtifactIconByType.Gcr
        },
        {
          itemLabel: getString(ArtifactTitleIdByType[ENABLED_ARTIFACT_TYPES.Ecr]),
          value: ENABLED_ARTIFACT_TYPES.Ecr,
          iconName: ArtifactIconByType.Ecr
        },
        {
          itemLabel: getString(ArtifactTitleIdByType[ENABLED_ARTIFACT_TYPES.DockerRegistry]),
          value: ENABLED_ARTIFACT_TYPES.DockerRegistry,
          iconName: ArtifactIconByType.DockerRegistry
        },
        {
          itemLabel: getString(ArtifactTitleIdByType[ENABLED_ARTIFACT_TYPES.ArtifactoryRegistry]),
          value: ENABLED_ARTIFACT_TYPES.ArtifactoryRegistry,
          iconName: ArtifactIconByType.ArtifactoryRegistry
        },
        {
          itemLabel: getString(ArtifactTitleIdByType[ENABLED_ARTIFACT_TYPES.Acr]),
          value: ENABLED_ARTIFACT_TYPES.Acr,
          iconName: ArtifactIconByType.Acr
        }
      ]
    },
    {
      categoryLabel: getString('common.comingSoon'),
      categoryValue: 'ArtifactComingSoon',
      items: [
        {
          itemLabel: getString(ArtifactTitleIdByType[ENABLED_ARTIFACT_TYPES.Nexus3Registry]),
          value: ENABLED_ARTIFACT_TYPES.Nexus3Registry,
          iconName: ArtifactIconByType.Nexus3Registry,
          disabled: true
        }
      ]
    },
    {
      categoryLabel: getString('manifestsText'),
      categoryValue: 'Manifest',
      items: [
        {
          itemLabel: getString(manifestTypeLabels.HelmChart),
          value: ManifestDataType.HelmChart,
          iconName: manifestTypeIcons.HelmChart
        }
      ]
    },
    {
      categoryLabel: getString('triggers.scheduledLabel'),
      categoryValue: 'Scheduled',
      items: [
        {
          itemLabel: getString('triggers.cronLabel'),
          value: 'Cron',
          iconName: TriggerTypeIcons.SCHEDULE as IconName
        }
      ]
    }
  ]
})

export const getSourceRepoOptions = (getString: (str: StringKeys) => string): { label: string; value: string }[] => [
  { label: getString('common.repo_provider.githubLabel'), value: GitSourceProviders.GITHUB.value },
  { label: getString('common.repo_provider.gitlabLabel'), value: GitSourceProviders.GITLAB.value },
  { label: getString('common.repo_provider.bitbucketLabel'), value: GitSourceProviders.BITBUCKET.value },
  { label: getString('common.repo_provider.azureRepos'), value: GitSourceProviders.AZURE_REPO.value },
  { label: getString('common.repo_provider.codecommit'), value: GitSourceProviders.AWS_CODECOMMIT.value },
  { label: getString('common.repo_provider.customLabel'), value: GitSourceProviders.CUSTOM.value }
]

export const getCategoryItems = (getString: (key: StringKeys) => string): AddDrawerMapInterface =>
  triggerDrawerMap(getString)

export interface ItemInterface {
  itemLabel: string
  iconName: IconName
  value: string
  visible?: boolean
  disabled?: boolean
  categoryValue?: string
}

export interface TriggerDataInterface {
  triggerType: string
  sourceRepo?: string
  manifestType?: string
  artifactType?: string
}

export const getEnabledStatusTriggerValues = ({
  data,
  enabled,
  getString
}: {
  data: any
  enabled: boolean
  getString: (key: StringKeys) => string
}): { values?: any; error?: string } => {
  try {
    const triggerResponseJson = parse(data?.yaml || '')
    triggerResponseJson.trigger.enabled = enabled
    return { values: triggerResponseJson.trigger }
  } catch (e) {
    return { error: getString('triggers.cannotParseTriggersData') }
  }
}
const TriggerStatus = {
  FAILED: 'FAILED',
  UNKNOWN: 'UNKNOWN',
  ERROR: 'ERROR',
  TIMEOUT: 'TIMEOUT',
  UNAVAILABLE: 'UNAVAILABLE',
  SUCCESS: 'SUCCESS'
}

export const errorStatusList = [
  TriggerStatus.FAILED,
  TriggerStatus.UNKNOWN,
  TriggerStatus.ERROR,
  TriggerStatus.TIMEOUT,
  TriggerStatus.UNAVAILABLE
]
