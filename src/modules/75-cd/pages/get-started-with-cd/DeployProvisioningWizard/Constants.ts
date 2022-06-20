/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@harness/uicore'
import { Connectors } from '@connectors/constants'
import type { ConnectorInfoDTO, UserRepoResponse } from 'services/cd-ng'

import type { StringsMap } from 'stringTypes'

export interface DeployProvisioningWizardProps {
  lastConfiguredWizardStepId?: DeployProvisiongWizardStepId
}

export const enum Hosting {
  SaaS = 'SAAS',
  OnPrem = 'ON_PREM'
}
export interface WizardStep {
  stepRender: React.ReactElement
  onClickNext?: () => void
  onClickBack?: () => void
  stepFooterLabel?: keyof StringsMap
}

export enum ProvisioningStatus {
  TO_DO,
  IN_PROGRESS,
  FAILURE,
  SUCCESS
}

export enum DeployProvisiongWizardStepId {
  SelectGitProvider = 'SELECT_GIT_PROVIDER',
  SelectArtifact = 'SELECT_ARTIFACT',
  SelectWorkload = 'SELECT_WORKLOAD',
  SelectInfrastructure = 'SELECT_INFRASTRUCTURE'
}

// TODO Need to use exported StepStatus from uicore -> MultiStepProgressIndicator component
export enum StepStatus {
  ToDo = 'TODO',
  InProgress = 'INPROGRESS',
  Failed = 'FAILED',
  Success = 'SUCCESS'
}

export interface WorkloadType {
  icon: IconName
  label: keyof StringsMap
  disabled?: boolean
}

export const WorkloadProviders: WorkloadType[] = [
  { icon: 'services', label: 'services', disabled: false },
  { icon: 'service-serverless', label: 'cd.getStartedWithCD.serverless', disabled: true },
  { icon: 'services', label: 'cd.gitOps', disabled: true }
]

export interface ServiceDeploymentTypes {
  icon: IconName
  label: keyof StringsMap
  disabled?: boolean
}

export const deploymentTypes: ServiceDeploymentTypes[] = [
  {
    label: 'pipeline.serviceDeploymentTypes.kubernetes',
    icon: 'service-kubernetes',
    disabled: false
  },
  {
    label: 'pipeline.serviceDeploymentTypes.amazonEcs',
    icon: 'service-ecs',
    disabled: true
  },
  {
    label: 'pipeline.serviceDeploymentTypes.azureFunctions',
    icon: 'cloudformation',
    disabled: true
  },
  {
    label: 'pipeline.serviceDeploymentTypes.azureFunctions',
    icon: 'service-aws',
    disabled: true
  },
  {
    label: 'pipeline.serviceDeploymentTypes.awsCodeDeploy',
    icon: 'service-azure',
    disabled: true
  },
  {
    label: 'pipeline.serviceDeploymentTypes.azureFunctions',
    icon: 'service-azure',
    disabled: true
  },
  {
    label: 'pipeline.serviceDeploymentTypes.awsSAM',
    icon: 'service-aws',
    disabled: true
  }
]

export interface InfrastructureType {
  icon: IconName
  label: keyof StringsMap
  disabled?: boolean
}

export const InfrastructureTypes: InfrastructureType[] = [
  { icon: 'service-kubernetes', label: 'cd.getStartedWithCD.directK8s', disabled: false },
  { icon: 'google-kubernetes-engine', label: 'cd.getStartedWithCD.googleK8s', disabled: true },
  { icon: 'service-azure', label: 'cd.getStartedWithCD.azureK8s', disabled: true },
  { icon: 'service-aws', label: 'cd.getStartedWithCD.awsElasticK8s', disabled: true }
]

export interface ArtifactType {
  icon: IconName
  label: keyof StringsMap
  disabled?: boolean
  details: keyof StringsMap
}

export const ArtifactProviders: ArtifactType[] = [
  {
    icon: 'service-kubernetes',
    label: 'cd.getStartedWithCD.inManifest',
    details: 'cd.getStartedWithCD.inManifestContent',
    disabled: false
  },
  {
    icon: 'git-configure',
    label: 'cd.getStartedWithCD.artifactManifest',
    details: 'cd.getStartedWithCD.artifactManifestContent',
    disabled: true
  }
]

export interface GitProvider {
  icon: IconName
  label: keyof StringsMap
  type: ConnectorInfoDTO['type']
  disabled?: boolean
}

export const AllSaaSGitProviders: GitProvider[] = [
  { icon: 'github', label: 'common.repo_provider.githubLabel', type: Connectors.GITHUB },
  { icon: 'gitlab', label: 'common.repo_provider.gitlabLabel', type: Connectors.GITLAB },
  { icon: 'bitbucket-blue', label: 'pipeline.manifestType.bitBucketLabel', type: Connectors.BITBUCKET }
]

export const AllOnPremGitProviders: GitProvider[] = [
  ...AllSaaSGitProviders,
  { icon: 'service-github', label: 'ci.getStartedWithCI.genericGit', type: Connectors.GIT }
]

export enum GitAuthenticationMethod {
  OAuth = 'OAUTH',
  AccessToken = 'ACCESS_TOKEN',
  AccessKey = 'ACCESS_KEY',
  UserNameAndApplicationPassword = 'USERNAME_AND_PASSWORD'
}

export interface GitProviderPermission {
  type: ConnectorInfoDTO['type']
  permissions: string[]
}

export const GitProviderPermissions: GitProviderPermission[] = [
  { type: Connectors.GITHUB, permissions: ['repo', 'admin:repo_hook', 'user'] },
  { type: Connectors.BITBUCKET, permissions: ['Issues:read', 'Webhooks:read and write', 'Pull requests:write'] },
  { type: Connectors.GITLAB, permissions: ['api', 'read_repository', 'write_repository'] }
]

export const GitProviderTypeToAuthenticationMethodMapping: Map<ConnectorInfoDTO['type'], GitAuthenticationMethod> =
  new Map([
    [Connectors.GITHUB, GitAuthenticationMethod.AccessToken],
    [Connectors.GITLAB, GitAuthenticationMethod.AccessKey],
    [Connectors.BITBUCKET, GitAuthenticationMethod.UserNameAndApplicationPassword]
  ])

export const DEFAULT_HARNESS_KMS = 'harnessSecretManager'

export const ACCOUNT_SCOPE_PREFIX = 'account.'

export const OAUTH_REDIRECT_URL_PREFIX = `${location.protocol}//${location.host}/gateway/`

export const getFullRepoName = (repository: UserRepoResponse): string => {
  const { name: repositoryName, namespace } = repository
  return namespace && repositoryName ? `${namespace}/${repositoryName}` : repositoryName ?? ''
}

export enum GitFetchTypes {
  Branch = 'Branch',
  Commit = 'Commit'
}

export const gitFetchTypeList = [
  { label: 'Latest from Branch', value: 'Branch' },
  { label: 'Specific Commit Id / Git Tag', value: 'Commit' }
]
