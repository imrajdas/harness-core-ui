/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SelectOption } from '@harness/uicore'
import type { PipelineInfrastructure } from 'services/cd-ng'

export enum StepType {
  HTTP = 'Http',
  SHELLSCRIPT = 'ShellScript',
  Command = 'Command',
  CustomApproval = 'CustomApproval',
  Barrier = 'Barrier',
  Queue = 'Queue',
  K8sRollingRollback = 'K8sRollingRollback',
  K8sBlueGreenDeploy = 'K8sBlueGreenDeploy',
  K8sCanaryDeploy = 'K8sCanaryDeploy',
  K8sBGSwapServices = 'K8sBGSwapServices',
  K8sScale = 'K8sScale',
  K8sApply = 'K8sApply',
  K8sCanaryDelete = 'K8sCanaryDelete',
  K8sDelete = 'K8sDelete',
  StepGroup = 'StepGroup',
  DeployService = 'DeployService',
  DeployEnvironment = 'DeployEnvironment',
  DeployInfrastructure = 'DeployInfrastructure',
  KubernetesDirect = 'KubernetesDirect',
  K8sServiceSpec = 'K8sServiceSpec',
  K8sRollingDeploy = 'K8sRollingDeploy',
  CustomVariable = 'CustomVariable',
  ServerlessAwsLambda = 'ServerlessAwsLambda',
  ServerlessGCP = 'ServerlessGCP',
  ServerlessAzure = 'ServerlessAzure',
  Dependency = 'Service',
  Plugin = 'Plugin',
  Run = 'Run',
  GCR = 'BuildAndPushGCR',
  PDC = 'Pdc',
  ECR = 'BuildAndPushECR',
  SaveCacheGCS = 'SaveCacheGCS',
  RestoreCacheGCS = 'RestoreCacheGCS',
  SaveCacheS3 = 'SaveCacheS3',
  RestoreCacheS3 = 'RestoreCacheS3',
  DockerHub = 'BuildAndPushDockerRegistry',
  GCS = 'GCSUpload',
  S3 = 'S3Upload',
  JFrogArtifactory = 'ArtifactoryUpload',
  RunTests = 'RunTests',
  HelmDeploy = 'HelmDeploy',
  HelmRollback = 'HelmRollback',
  HarnessApproval = 'HarnessApproval',
  JiraApproval = 'JiraApproval',
  ServiceNowApproval = 'ServiceNowApproval',
  ServiceNowCreate = 'ServiceNowCreate',
  ServiceNowUpdate = 'ServiceNowUpdate',
  Verify = 'Verify',
  JiraCreate = 'JiraCreate',
  JiraUpdate = 'JiraUpdate',
  TerraformRollback = 'TerraformRollback',
  TerraformDestroy = 'TerraformDestroy',
  TerraformPlan = 'TerraformPlan',
  TerraformApply = 'TerraformApply',
  InfraProvisioning = 'InfraProvisioning',
  KubernetesGcp = 'KubernetesGcp',
  ResourceConstraint = 'ResourceConstraint',
  FlagConfiguration = 'FlagConfiguration',
  Template = 'Template',
  Policy = 'Policy',
  ZeroNorth = 'Security',
  KubernetesAzure = 'KubernetesAzure',
  SshWinRmAzure = 'SshWinRmAzure',
  ServerlessAwsLambdaDeploy = 'ServerlessAwsLambdaDeploy',
  ServerlessAwsLambdaRollback = 'ServerlessAwsLambdaRollback',
  ServerlessAwsInfra = 'ServerlessAwsInfra',
  CloudFormationRollbackStack = 'RollbackStack',
  CloudFormationDeleteStack = 'DeleteStack',
  CloudFormationCreateStack = 'CreateStack',
  CreatePR = 'CreatePR',
  MergePR = 'MergePR',
  AzureWebAppsRollback = 'AzureWebAppRollback',
  AzureSlotDeployment = 'AzureSlotDeployment',
  JenkinsBuild = 'JenkinsBuild',
  AzureTrafficShift = 'AzureTrafficShift',
  AzureSwapSlot = 'AzureSwapSlot'
}

export interface PipelineInfrastructureV2 extends PipelineInfrastructure {
  environmentOrEnvGroupRef?: SelectOption
  environmentGroup?: any
  environmentRef2?: SelectOption
  infrastructureRef?: SelectOption
}
