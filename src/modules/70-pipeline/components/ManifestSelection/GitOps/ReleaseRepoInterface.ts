/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import type { IconName, MultiTypeInputType } from '@harness/uicore'

import { Connectors } from '@connectors/constants'
import type { StageElementWrapper } from '@pipeline/utils/pipelineTypes'
import type { StageElementConfig, PageConnectorResponse, ServiceDefinition, ConnectorInfoDTO } from 'services/cd-ng'

export interface ReleaseRepoListViewProps {
  updateStage: (stage: StageElementConfig) => Promise<void>
  stage: StageElementWrapper | undefined
  isPropagating?: boolean
  connectors: PageConnectorResponse | undefined
  refetchConnectors: () => void
  listOfManifests: Array<any>
  isReadonly: boolean
  deploymentType: ServiceDefinition['type']
  allowableTypes: MultiTypeInputType[]
  allowOnlyOne?: boolean
}

export const RepoStoreIcons: Record<string, IconName> = {
  Git: 'service-github',
  Github: 'github',
  GitLab: 'service-gotlab',
  Bitbucket: 'bitbucket',
  AzureRepo: 'service-azure'
}

export type ReleaseRepoManifestStores = 'Git' | 'Github' | 'GitLab' | 'Bitbucket' | 'AzureRepo'

export const ReleaseRepoManifestStoreMap: { [key: string]: ReleaseRepoManifestStores } = {
  Git: 'Git',
  Github: 'Github',
  GitLab: 'GitLab',
  Bitbucket: 'Bitbucket',
  AzureRepo: 'AzureRepo'
}

export const releaseRepoManifestStoreTypes: Array<ReleaseRepoManifestStores> = [
  ReleaseRepoManifestStoreMap.Git,
  ReleaseRepoManifestStoreMap.Github,
  ReleaseRepoManifestStoreMap.GitLab,
  ReleaseRepoManifestStoreMap.Bitbucket,
  ReleaseRepoManifestStoreMap.AzureRepo
]

export const ReleaseRepoManifestToConnectorMap: Record<ReleaseRepoManifestStores | string, ConnectorInfoDTO['type']> = {
  Git: Connectors.GIT,
  Github: Connectors.GITHUB,
  GitLab: Connectors.GITLAB,
  Bitbucket: Connectors.BITBUCKET,
  AzureRepo: Connectors.AZURE_REPO
}
