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
  Github: 'github',

  AzureRepo: 'service-azure'
}

export type ReleaseRepoManifestStores = 'Git' | 'Github' | 'GitLab' | 'Bitbucket' | 'AzureRepo'

export const ReleaseRepoManifestStoreMap: { [key: string]: ReleaseRepoManifestStores } = {
  Github: 'Github',
  AzureRepo: 'AzureRepo'
}

export const releaseRepoManifestStoreTypes: Array<ReleaseRepoManifestStores> = [
  ReleaseRepoManifestStoreMap.Github,
  ReleaseRepoManifestStoreMap.AzureRepo
]

export const ReleaseRepoManifestToConnectorMap: Record<ReleaseRepoManifestStores | string, ConnectorInfoDTO['type']> = {
  Github: Connectors.GITHUB,
  AzureRepo: Connectors.AZURE_REPO
}
