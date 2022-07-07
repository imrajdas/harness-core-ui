/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { isServerlessManifestType, ManifestDataType } from '@pipeline/components/ManifestSelection/Manifesthelper'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { DeploymentStageElementConfig } from '../pipelineTypes'
import {
  changeEmptyValuesToRunTimeInput,
  getHelpeTextForTags,
  isCIStage,
  isCDStage,
  isInfraDefinitionPresent,
  isServerlessDeploymentType,
  ServiceDeploymentType,
  getCustomStepProps,
  getStepTypeByDeploymentType,
  deleteStageData
} from '../stageHelpers'
import inputSetPipeline from './inputset-pipeline.json'
test('if empty values are being replaced with <+input> except for tags', () => {
  const outputCriteria = changeEmptyValuesToRunTimeInput(inputSetPipeline, '')

  expect(
    (outputCriteria as any).pipeline.stages[0].stage.spec.serviceConfig.serviceDefinition.spec.artifacts.primary.spec
      .tag
  ).toBe('<+input>')
  expect(
    (outputCriteria as any).pipeline.stages[1].stage.spec.serviceConfig.serviceDefinition.spec.manifests[0].manifest
      .spec.store.spec.branch
  ).toBe('<+input>')
  expect((outputCriteria as any).tags.Test1).toBe('')
})

test('isCIStage', () => {
  expect(isCIStage({})).toBe(false)
  expect(isCIStage({ module: 'ci' })).toBe(true)
  expect(isCIStage({ moduleInfo: { ci: { test: {} } } })).toBe(true)
})

test('isCDStage', () => {
  expect(isCDStage({})).toBe(false)
  expect(isCDStage({ module: 'cd' })).toBe(true)
  expect(isCDStage({ moduleInfo: { cd: { test: {} } } })).toBe(true)
})

test('isInfraDefinitionPresent', () => {
  expect(isInfraDefinitionPresent({ identifier: 'test', name: 'testName' })).toBe(false)
  expect(
    isInfraDefinitionPresent({
      identifier: 'test',
      name: 'testName',
      spec: {
        serviceConfig: {},
        execution: { steps: [] },
        infrastructure: { infrastructureDefinition: { spec: {}, type: 'KubernetesAzure' } }
      }
    })
  ).toBe(true)
})

test('deleteStageData', () => {
  const deploymentConfig = {
    identifier: '1',
    name: 'test',
    spec: {
      execution: {
        steps: [],
        rollbackSteps: [
          {
            name: 'step1'
          }
        ]
      },
      infrastructure: {
        allowSimultaneousDeployments: false,
        infrastructureDefinition: {
          type: 'Pdc',
          spec: {}
        }
      },
      serviceConfig: {
        serviceDefinition: {
          spec: {
            artifacts: ['test'],
            manifests: ['test']
          }
        }
      }
    }
  }

  deleteStageData(deploymentConfig as unknown as DeploymentStageElementConfig)

  expect(deploymentConfig.spec?.execution?.rollbackSteps).toBeUndefined()
  expect(deploymentConfig.spec?.serviceConfig?.serviceDefinition?.spec.artifacts).toBeUndefined()
  expect(deploymentConfig.spec?.serviceConfig?.serviceDefinition?.spec.manifests).toBeUndefined()
  expect(deploymentConfig.spec?.infrastructure?.allowSimultaneousDeployments).toBeUndefined()
  expect(deploymentConfig.spec?.infrastructure?.infrastructureDefinition).toBeUndefined()
  expect(deploymentConfig.spec?.execution?.steps.length).toBe(0)

  expect(deleteStageData(undefined)).toBe(undefined)
})

test('getStepTypeByDeploymentType', () => {
  expect(getStepTypeByDeploymentType(ServiceDeploymentType.ServerlessAwsLambda)).toBe(StepType.ServerlessAwsLambda)
  expect(getStepTypeByDeploymentType(ServiceDeploymentType.Kubernetes)).toBe(StepType.K8sServiceSpec)
})

test('isServerlessDeploymentType', () => {
  expect(isServerlessDeploymentType(ServiceDeploymentType.ServerlessAwsLambda)).toBe(true)
  expect(isServerlessDeploymentType(ServiceDeploymentType.ServerlessAzureFunctions)).toBe(true)
  expect(isServerlessDeploymentType(ServiceDeploymentType.ServerlessGoogleFunctions)).toBe(true)
  expect(isServerlessDeploymentType(ServiceDeploymentType.AmazonSAM)).toBe(true)
  expect(isServerlessDeploymentType(ServiceDeploymentType.AzureFunctions)).toBe(true)
  expect(isServerlessDeploymentType(ServiceDeploymentType.Kubernetes)).toBe(false)
})

test('isServerlessManifestType', () => {
  expect(isServerlessManifestType(ManifestDataType.ServerlessAwsLambda)).toBe(true)
  expect(isServerlessManifestType(ManifestDataType.HelmChart)).toBe(false)
})

test('getHelpeTextForTags', () => {
  expect(
    getHelpeTextForTags({ imagePath: '/image', artifactPath: '', connectorRef: 'RUNTIME' }, (str: string) => str, false)
  ).toBe('pipeline.artifactPathLabel  is  pipeline.tagDependencyRequired')

  expect(
    getHelpeTextForTags(
      { imagePath: '', artifactPath: '/artifact', connectorRef: 'RUNTIME' },
      (str: string) => str,
      false
    )
  ).toBe('pipeline.imagePathLabel  is  pipeline.tagDependencyRequired')

  expect(
    getHelpeTextForTags({ imagePath: '/image', artifactPath: '', connectorRef: 'RUNTIME' }, (str: string) => str, true)
  ).toBe('pipeline.artifactsSelection.artifactDirectory  is  pipeline.artifactPathDependencyRequired')
})

test('getCustomStepProps', () => {
  expect(getCustomStepProps(ServiceDeploymentType.ServerlessAwsLambda, (str: string) => str)).toStrictEqual({
    formInfo: {
      formName: 'serverlessAWSInfra',
      header: 'pipelineSteps.awsConnectorLabel',
      tooltipIds: {
        connector: 'awsInfraConnector',
        region: 'awsRegion',
        stage: 'awsStage'
      },
      type: 'Aws'
    },
    hasRegion: true
  })
  expect(getCustomStepProps(ServiceDeploymentType.ServerlessAzureFunctions, (str: string) => str)).toStrictEqual({
    formInfo: {
      formName: 'serverlessAzureInfra',
      header: 'pipelineSteps.awsConnectorLabel',
      tooltipIds: {
        connector: 'azureInfraConnector',
        region: 'azureRegion',
        stage: 'azureStage'
      },
      type: 'Gcp'
    }
  })
  expect(getCustomStepProps(ServiceDeploymentType.ServerlessGoogleFunctions, (str: string) => str)).toStrictEqual({
    formInfo: {
      formName: 'serverlessGCPInfra',
      header: 'pipelineSteps.gcpConnectorLabel',
      tooltipIds: {
        connector: 'gcpInfraConnector',
        region: 'gcpRegion',
        stage: 'gcpStage'
      },
      type: 'Gcp'
    }
  })
  expect(getCustomStepProps(ServiceDeploymentType.AmazonSAM, (str: string) => str)).toStrictEqual({
    formInfo: {}
  })
})
