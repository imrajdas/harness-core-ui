/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@harness/uicore'
import type { Item } from '@harness/uicore/dist/components/ThumbnailSelect/ThumbnailSelect'
import { ServiceDeploymentType } from '@pipeline/utils/stageHelpers'

import type { StringsMap } from 'stringTypes'

export interface InfraProvisioningWizardProps {
  lastConfiguredWizardStepId?: InfraProvisiongWizardStepId
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

export enum InfraProvisiongWizardStepId {
  SelectGitProvider = 'SELECT_GIT_PROVIDER',
  SelectInfraStructure = 'SELECT_INFRASTRUCTURE',
  SelectRepository = 'SELECT_REPOSITORY',
  SelectWorkload = 'SELECT_WORKLOAD'
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

export const AllSaaSWorkloadProviders: WorkloadType[] = [
  { icon: 'services', label: 'services' },
  { icon: 'service-serverless', label: 'cd.getStartedWithCD.serverless' },
  { icon: 'services', label: 'cd.gitOps' }
]

export const deploymentTypes: Item[] = [
  {
    label: ServiceDeploymentType.Kubernetes,
    value: 'service',
    icon: 'service-kubernetes',
    disabled: false
  },
  {
    label: ServiceDeploymentType.amazonEcs,
    value: 'multiple-service',
    icon: 'service-ecs',
    disabled: true
  },
  {
    label: ServiceDeploymentType.AzureFunctions,
    value: 'functions',
    icon: 'functions',
    disabled: true
  },
  {
    label: ServiceDeploymentType.amazonAmi,
    value: 'other-workloads',
    icon: 'other-workload',
    disabled: true
  }
]
