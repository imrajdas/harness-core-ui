/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { Schema } from 'yup'
import type { IconName } from '@wings-software/uicore'
import { Connectors } from '@connectors/constants'
import type { ConnectorInfoDTO, ServiceDefinition } from 'services/cd-ng'
import type { PipelineInfoConfig } from 'services/pipeline-ng'
import type { StringKeys } from 'framework/strings'
import { NameSchema } from '@common/utils/Validation'
import { ServiceDeploymentType } from '@pipeline/utils/stageHelpers'
import type {
  HelmVersionOptions,
  ManifestStores,
  ManifestStoreTypeWithoutConnector,
  ManifestStoreWithoutConnector,
  ManifestTypes,
  PrimaryManifestType
} from './ManifestInterface'

export type ReleaseRepoPipeline = PipelineInfoConfig & { gitOpsEnabled: boolean }

export const isAllowedManifestDeploymentTypes = (deploymentType: ServiceDefinition['type']): boolean => {
  return (
    deploymentType === ServiceDeploymentType.Kubernetes ||
    deploymentType === ServiceDeploymentType.NativeHelm ||
    deploymentType === ServiceDeploymentType.ServerlessAwsLambda
  )
}

export const showAddManifestBtn = (
  isReadonly: boolean,
  allowOnlyOne: boolean,
  listOfManifests: Array<any>,
  deploymentType?: ServiceDefinition['type']
): boolean => {
  if (allowOnlyOne && listOfManifests.length === 1) {
    return false
  }
  if (deploymentType) {
    return !isReadonly && isAllowedManifestDeploymentTypes(deploymentType)
  }
  return !isReadonly
}

export const isServerlessManifestType = (selectedManifest: ManifestTypes | null): boolean => {
  return selectedManifest === ManifestDataType.ServerlessAwsLambda
}

export const ManifestDataType: Record<ManifestTypes, ManifestTypes> = {
  K8sManifest: 'K8sManifest',
  Values: 'Values',
  HelmChart: 'HelmChart',
  Kustomize: 'Kustomize',
  OpenshiftTemplate: 'OpenshiftTemplate',
  OpenshiftParam: 'OpenshiftParam',
  KustomizePatches: 'KustomizePatches',
  ServerlessAwsLambda: 'ServerlessAwsLambda'
}

export const ManifestToPathMap: Record<PrimaryManifestType, string> = {
  K8sManifest: 'Values',
  HelmChart: 'Values',
  OpenshiftTemplate: 'OpenshiftParam',
  Kustomize: 'KustomizePatches'
}
export const ManifestToPathLabelMap: Record<PrimaryManifestType, StringKeys> = {
  K8sManifest: 'pipeline.manifestType.valuesYamlPath',
  HelmChart: 'pipeline.manifestType.valuesYamlPath',
  OpenshiftTemplate: 'pipeline.manifestType.paramsYamlPath',
  Kustomize: 'pipeline.manifestTypeLabels.KustomizePatches'
}
export const ManifestToPathKeyMap: Record<PrimaryManifestType, string> = {
  K8sManifest: 'valuesPaths',
  HelmChart: 'valuesPaths',
  OpenshiftTemplate: 'paramsPaths',
  Kustomize: 'patchesPaths'
}

export const ManifestStoreMap: { [key: string]: ManifestStores } = {
  Git: 'Git',
  Github: 'Github',
  GitLab: 'GitLab',
  Bitbucket: 'Bitbucket',
  Http: 'Http',
  OciHelmChart: 'OciHelmChart',
  S3: 'S3',
  Gcs: 'Gcs',
  InheritFromManifest: 'InheritFromManifest',
  Inline: 'Inline',
  Harness: 'Harness',
  CustomRemote: 'CustomRemote'
}

export const allowedManifestTypes: Record<string, Array<ManifestTypes>> = {
  Kubernetes: [
    ManifestDataType.K8sManifest,
    ManifestDataType.Values,
    ManifestDataType.HelmChart,
    ManifestDataType.OpenshiftTemplate,
    ManifestDataType.OpenshiftParam,
    ManifestDataType.Kustomize,
    ManifestDataType.KustomizePatches
  ],
  NativeHelm: [ManifestDataType.Values, ManifestDataType.HelmChart],
  ServerlessAwsLambda: [ManifestDataType.ServerlessAwsLambda],
  Ssh: [],
  WinRm: [],
  AzureWebApp: []
}

export const manifestStoreTypes: Array<ManifestStores> = [
  ManifestStoreMap.Git,
  ManifestStoreMap.Github,
  ManifestStoreMap.GitLab,
  ManifestStoreMap.Bitbucket
  // ManifestStoreMap.Harness
]
export const ManifestTypetoStoreMap: Record<ManifestTypes, ManifestStores[]> = {
  K8sManifest: [...manifestStoreTypes],
  Values: [...manifestStoreTypes, ManifestStoreMap.InheritFromManifest],
  HelmChart: [
    ...manifestStoreTypes,
    ManifestStoreMap.Http,
    ManifestStoreMap.OciHelmChart,
    ManifestStoreMap.S3,
    ManifestStoreMap.Gcs
  ],
  Kustomize: manifestStoreTypes,
  OpenshiftTemplate: [...manifestStoreTypes],
  OpenshiftParam: [...manifestStoreTypes, ManifestStoreMap.InheritFromManifest],
  KustomizePatches: [...manifestStoreTypes, ManifestStoreMap.InheritFromManifest],
  ServerlessAwsLambda: manifestStoreTypes
}

export const manifestTypeIcons: Record<ManifestTypes, IconName> = {
  K8sManifest: 'service-kubernetes',
  Values: 'functions',
  HelmChart: 'service-helm',
  Kustomize: 'kustamize',
  OpenshiftTemplate: 'openshift',
  OpenshiftParam: 'openshift-params',
  KustomizePatches: 'kustomizeparam',
  ServerlessAwsLambda: 'service-serverless-aws'
}

export const manifestTypeLabels: Record<ManifestTypes, StringKeys> = {
  K8sManifest: 'pipeline.manifestTypeLabels.K8sManifest',
  Values: 'pipeline.manifestTypeLabels.ValuesYaml',
  HelmChart: 'pipeline.manifestTypeLabels.HelmChartLabel',
  Kustomize: 'pipeline.manifestTypeLabels.KustomizeLabel',
  OpenshiftTemplate: 'pipeline.manifestTypeLabels.OpenshiftTemplate',
  OpenshiftParam: 'pipeline.manifestTypeLabels.OpenshiftParam',
  KustomizePatches: 'pipeline.manifestTypeLabels.KustomizePatches',
  ServerlessAwsLambda: 'pipeline.manifestTypeLabels.ServerlessAwsLambda'
}

export const helmVersions: Array<{ label: string; value: HelmVersionOptions }> = [
  { label: 'Version 2', value: 'V2' },
  { label: 'Version 3', value: 'V3' }
]

export const ManifestIconByType: Record<ManifestStores, IconName> = {
  Git: 'service-github',
  Github: 'github',
  GitLab: 'service-gotlab',
  Bitbucket: 'bitbucket',
  Http: 'service-helm',
  OciHelmChart: 'helm-oci',
  S3: 'service-service-s3',
  Gcs: 'gcs-step',
  InheritFromManifest: 'custom-artifact',
  Inline: 'custom-artifact',
  Harness: 'harness',
  CustomRemote: 'custom-remote-manifest'
}

export const ManifestStoreTitle: Record<ManifestStores, StringKeys> = {
  Git: 'pipeline.manifestType.gitConnectorLabel',
  Github: 'common.repo_provider.githubLabel',
  GitLab: 'common.repo_provider.gitlabLabel',
  Bitbucket: 'pipeline.manifestType.bitBucketLabel',
  Http: 'pipeline.manifestType.httpHelmRepoConnectorLabel',
  OciHelmChart: 'pipeline.manifestType.ociHelmConnectorLabel',
  S3: 'connectors.S3',
  Gcs: 'connectors.GCS.fullName',
  InheritFromManifest: 'pipeline.manifestType.InheritFromManifest',
  Inline: 'inline',
  Harness: 'harness',
  CustomRemote: 'pipeline.manifestType.customRemote'
}

export const ManifestToConnectorMap: Record<ManifestStores | string, ConnectorInfoDTO['type']> = {
  Git: Connectors.GIT,
  Github: Connectors.GITHUB,
  GitLab: Connectors.GITLAB,
  Bitbucket: Connectors.BITBUCKET,
  Http: Connectors.HttpHelmRepo,
  OciHelmChart: Connectors.OciHelmRepo,
  S3: Connectors.AWS,
  Gcs: Connectors.GCP
}

export const ManifestToConnectorLabelMap: Record<
  Exclude<ManifestStores, ManifestStoreTypeWithoutConnector>,
  StringKeys
> = {
  Git: 'pipeline.manifestType.gitConnectorLabel',
  Github: 'common.repo_provider.githubLabel',
  GitLab: 'common.repo_provider.gitlabLabel',
  Bitbucket: 'pipeline.manifestType.bitBucketLabel',
  Http: 'connectors.title.helmConnector',
  OciHelmChart: 'connectors.title.ociHelmConnector',
  S3: 'pipeline.manifestToConnectorLabelMap.AWSLabel',
  Gcs: 'common.gcp'
}

export enum GitRepoName {
  Account = 'Account',
  Repo = 'Repo'
}

export enum GitFetchTypes {
  Branch = 'Branch',
  Commit = 'Commit'
}

export const gitFetchTypeList = [
  { label: 'Latest from Branch', value: 'Branch' },
  { label: 'Specific Commit Id / Git Tag', value: 'Commit' }
]

export const ManifestIdentifierValidation = (
  manifestNames: Array<string>,
  id: string | undefined,
  validationMsg: string
): { identifier: Schema<unknown> } => {
  if (!id) {
    return {
      identifier: NameSchema().notOneOf(manifestNames, validationMsg)
    }
  }
  return {
    identifier: NameSchema()
  }
}

export const doesStorehasConnector = (selectedStore: ManifestStoreWithoutConnector): boolean => {
  return [
    ManifestStoreMap.InheritFromManifest,
    ManifestStoreMap.Harness,
    ManifestStoreMap.Inline,
    ManifestStoreMap.CustomRemote
  ].includes(selectedStore)
}

export function isConnectorStoreType(): boolean {
  return !(ManifestStoreMap.InheritFromManifest || ManifestStoreMap.Harness || ManifestStoreMap.Inline,
  ManifestStoreMap.CustomRemote)
}
export function getManifestLocation(manifestType: ManifestTypes, manifestStore: ManifestStores): string {
  switch (true) {
    case manifestStore === ManifestStoreMap.Harness:
      return 'store.spec.files'
    case manifestStore === ManifestStoreMap.CustomRemote:
      return 'store.spec.filePath'
    case [
      ManifestDataType.K8sManifest,
      ManifestDataType.Values,
      ManifestDataType.KustomizePatches,
      ManifestDataType.OpenshiftParam,
      ManifestDataType.OpenshiftTemplate,
      ManifestDataType.ServerlessAwsLambda
    ].includes(manifestType):
      return 'store.spec.paths'
    case manifestType === ManifestDataType.Kustomize:
    case manifestType === ManifestDataType.HelmChart &&
      [ManifestStoreMap.S3, ManifestStoreMap.Gcs].includes(manifestStore):
      return 'store.spec.folderPath'
    case manifestType === ManifestDataType.HelmChart && manifestStore === ManifestStoreMap.Http:
      return 'chartName'
    default:
      return 'paths'
  }
}
