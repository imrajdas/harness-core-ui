/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { defaultTo, get, isNil } from 'lodash-es'
import type { IconName } from '@wings-software/uicore'
import { InfraDeploymentType } from '@cd/components/PipelineSteps/PipelineStepsUtil'
import type { DeploymentStageElementConfig, StageElementWrapper } from '@pipeline/utils/pipelineTypes'
import type { Infrastructure, ServiceDefinition } from 'services/cd-ng'
import type { StringsMap } from 'stringTypes'
import { isServerlessDeploymentType, isSSHWinRMDeploymentType } from '@pipeline/utils/stageHelpers'

const DEFAULT_RELEASE_NAME = 'release-<+INFRA_KEY>'

export const cleanUpEmptyProvisioner = (
  stageData: StageElementWrapper<DeploymentStageElementConfig> | undefined
): boolean => {
  const provisioner = stageData?.stage?.spec?.infrastructure?.infrastructureDefinition?.provisioner
  let isChanged = false

  if (!isNil(provisioner?.steps) && provisioner?.steps.length === 0) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete provisioner.steps
    isChanged = true
  }
  if (!isNil(provisioner?.rollbackSteps) && provisioner?.rollbackSteps.length === 0) {
    delete provisioner.rollbackSteps
    isChanged = true
  }

  if (
    !provisioner?.steps &&
    !provisioner?.rollbackSteps &&
    stageData?.stage?.spec?.infrastructure?.infrastructureDefinition?.provisioner
  ) {
    delete stageData.stage.spec.infrastructure.infrastructureDefinition.provisioner
    isChanged = true
  }

  return isChanged
}

export const getInfrastructureDefaultValue = (
  stageData: StageElementWrapper | undefined,
  infrastructureType: string | undefined
): Infrastructure => {
  const infrastructure = get(stageData, 'stage.spec.infrastructure.infrastructureDefinition', null)
  const type = defaultTo(infrastructure?.type, infrastructureType)
  const allowSimultaneousDeployments = get(stageData, 'stage.spec.infrastructure.allowSimultaneousDeployments', false)
  switch (type) {
    case InfraDeploymentType.KubernetesDirect: {
      const connectorRef = infrastructure?.spec?.connectorRef
      const namespace = infrastructure?.spec?.namespace
      const releaseName = infrastructure?.spec?.releaseName ?? DEFAULT_RELEASE_NAME
      return {
        connectorRef,
        namespace,
        releaseName,
        allowSimultaneousDeployments
      }
    }
    case InfraDeploymentType.KubernetesGcp: {
      const connectorRef = infrastructure?.spec?.connectorRef
      const namespace = infrastructure?.spec?.namespace
      const releaseName = infrastructure?.spec?.releaseName ?? DEFAULT_RELEASE_NAME
      const cluster = infrastructure?.spec?.cluster

      return {
        connectorRef,
        namespace,
        releaseName,
        cluster,
        allowSimultaneousDeployments
      }
    }
    case InfraDeploymentType.ServerlessAwsLambda: {
      const connectorRef = infrastructure?.spec?.connectorRef
      const region = infrastructure?.spec?.region
      const infraStage = infrastructure?.spec?.stage

      return {
        connectorRef,
        region,
        stage: infraStage,
        allowSimultaneousDeployments
      }
    }
    case InfraDeploymentType.ServerlessAzureFunctions:
    case InfraDeploymentType.ServerlessGoogleFunctions: {
      const connectorRef = infrastructure?.spec?.connectorRef
      const infraStage = infrastructure?.spec?.stage

      return {
        connectorRef,
        stage: infraStage,
        allowSimultaneousDeployments
      }
    }
    case InfraDeploymentType.KubernetesAzure: {
      const connectorRef = infrastructure?.spec?.connectorRef
      const subscriptionId = infrastructure?.spec?.subscriptionId
      const resourceGroup = infrastructure?.spec?.resourceGroup
      const cluster = infrastructure?.spec?.cluster
      const namespace = infrastructure?.spec?.namespace
      const releaseName = infrastructure?.spec?.releaseName ?? DEFAULT_RELEASE_NAME

      return {
        connectorRef,
        namespace,
        subscriptionId,
        resourceGroup,
        cluster,
        releaseName,
        allowSimultaneousDeployments
      }
    }
    case InfraDeploymentType.PDC: {
      const { connectorRef, credentialsRef, delegateSelectors, hostFilters, hosts, attributeFilters } =
        infrastructure?.spec || {}

      return {
        connectorRef,
        credentialsRef,
        allowSimultaneousDeployments,
        hosts,
        delegateSelectors,
        hostFilters,
        attributeFilters
      }
    }
    case InfraDeploymentType.SshWinRmAzure: {
      const { credentialsRef, connectorRef, subscriptionId, resourceGroup, cluster, tags, usePublicDns } =
        infrastructure?.spec || {}
      return {
        credentialsRef,
        connectorRef,
        subscriptionId,
        resourceGroup,
        cluster,
        tags,
        usePublicDns
      }
    }
    default: {
      return {}
    }
  }
}
interface InfrastructureItem {
  label: string
  icon: IconName
  value: string
  disabled?: boolean
}
export interface InfrastructureGroup {
  groupLabel: string
  items: InfrastructureItem[]
  disabled?: boolean
}

export const getInfraGroups = (
  deploymentType: ServiceDefinition['type'],
  getString: (key: keyof StringsMap, vars?: Record<string, any> | undefined) => string,
  featureFlags: Record<string, boolean>
): InfrastructureGroup[] => {
  const { NG_AZURE } = featureFlags
  return isServerlessDeploymentType(deploymentType)
    ? [
        {
          groupLabel: '',
          items: [
            {
              label: getString('common.aws'),
              icon: 'service-aws',
              value: InfraDeploymentType.ServerlessAwsLambda
            },
            {
              label: getString('common.gcp'),
              icon: 'gcp',
              value: InfraDeploymentType.ServerlessGoogleFunctions,
              disabled: true
            },
            {
              label: getString('common.azure'),
              icon: 'service-azure',
              value: InfraDeploymentType.ServerlessAzureFunctions,
              disabled: true
            }
          ]
        }
      ]
    : isSSHWinRMDeploymentType(deploymentType)
    ? [
        {
          groupLabel: '',
          items: [
            {
              label: getString('connectors.title.pdcConnector'),
              icon: 'pdc',
              value: InfraDeploymentType.PDC
            },
            {
              label: getString('common.azure'),
              icon: 'service-azure',
              value: InfraDeploymentType.SshWinRmAzure
            }
          ]
        }
      ]
    : [
        {
          groupLabel: getString('pipelineSteps.deploy.infrastructure.directConnection'),
          items: [
            {
              label: getString('pipelineSteps.deploymentTypes.kubernetes'),
              icon: 'service-kubernetes',
              value: InfraDeploymentType.KubernetesDirect
            }
          ]
        },
        {
          groupLabel: getString('pipelineSteps.deploy.infrastructure.viaCloudProvider'),
          items: NG_AZURE
            ? [
                {
                  label: getString('pipelineSteps.deploymentTypes.gk8engine'),
                  icon: 'google-kubernetes-engine',
                  value: InfraDeploymentType.KubernetesGcp
                },
                {
                  label: getString('cd.steps.azureInfraStep.azure'),
                  icon: 'microsoft-azure',
                  value: InfraDeploymentType.KubernetesAzure
                }
              ]
            : [
                {
                  label: getString('pipelineSteps.deploymentTypes.gk8engine'),
                  icon: 'google-kubernetes-engine',
                  value: InfraDeploymentType.KubernetesGcp
                }
              ]
        }
      ]
}
