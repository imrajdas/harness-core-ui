/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { getMultiTypeFromValue, MultiTypeInputType, RUNTIME_INPUT_VALUE, SelectOption } from '@wings-software/uicore'
import * as Yup from 'yup'
import isEmpty from 'lodash/isEmpty'
import { get } from 'lodash-es'
import type { UseStringsReturn } from 'framework/strings'
import { getNameAndIdentifierSchema } from '@pipeline/utils/tempates'
import {
  getFailureStrategiesValidationSchema,
  getVariablesValidationField
} from '@pipeline/components/PipelineSteps/AdvancedSteps/FailureStrategyPanel/validation'
import { isServerlessDeploymentType, ServiceDeploymentType } from '@pipeline/utils/stageHelpers'
import type { DeployStageConfig } from '@pipeline/utils/DeployStageInterface'
import type { GetExecutionStrategyYamlQueryParams } from 'services/cd-ng'

const namespaceRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/
const releaseNameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/

export enum InfraDeploymentType {
  KubernetesDirect = 'KubernetesDirect',
  KubernetesGcp = 'KubernetesGcp',
  PDC = 'Pdc',
  KubernetesAzure = 'KubernetesAzure',
  ServerlessAwsLambda = 'ServerlessAwsLambda',
  ServerlessGoogleFunctions = 'ServerlessGoogleFunctions',
  ServerlessAzureFunctions = 'ServerlessAzureFunctions',
  AmazonSAM = 'AwsSAM',
  AzureFunctions = 'AzureFunctions',
  SshWinRmAzure = 'SshWinRmAzure',
  AzureWebApps = 'AzureWebApps'
}

export const deploymentTypeToInfraTypeMap = {
  [ServiceDeploymentType.ServerlessAwsLambda]: InfraDeploymentType.ServerlessAwsLambda,
  [ServiceDeploymentType.ServerlessAzureFunctions]: InfraDeploymentType.ServerlessAzureFunctions,
  [ServiceDeploymentType.ServerlessGoogleFunctions]: InfraDeploymentType.ServerlessGoogleFunctions,
  [ServiceDeploymentType.ssh]: InfraDeploymentType.PDC
}

export function getNameSpaceSchema(
  getString: UseStringsReturn['getString'],
  isRequired = true
): Yup.StringSchema<string | undefined> {
  const namespaceSchema = Yup.string().test('namespace', getString('cd.namespaceValidation'), function (value) {
    if (getMultiTypeFromValue(value) !== MultiTypeInputType.FIXED || isEmpty(value)) {
      return true
    }
    return namespaceRegex.test(value)
  })
  if (isRequired) {
    return namespaceSchema.required(getString('fieldRequired', { field: getString('common.namespace') }))
  }
  return namespaceSchema
}
export function getReleaseNameSchema(
  getString: UseStringsReturn['getString'],
  isRequired = true
): Yup.StringSchema<string | undefined> {
  const releaseNameSchema = Yup.string().test('releaseName', getString('cd.releaseNameValidation'), function (value) {
    if (getMultiTypeFromValue(value) !== MultiTypeInputType.FIXED || isEmpty(value)) {
      return true
    }
    return releaseNameRegex.test(value)
  })
  if (isRequired) {
    return releaseNameSchema.required(getString('fieldRequired', { field: getString('common.releaseName') }))
  }
  return releaseNameSchema
}

export function getValidationSchemaWithRegion(getString: UseStringsReturn['getString']): Yup.ObjectSchema {
  return Yup.object().shape({
    connectorRef: getConnectorSchema(getString),
    region: Yup.lazy((): Yup.Schema<unknown> => {
      return Yup.string().required(getString('validation.regionRequired'))
    }),
    stage: Yup.lazy((): Yup.Schema<unknown> => {
      return Yup.string().required(getString('cd.pipelineSteps.infraTab.stageIsRequired'))
    })
  })
}

export function getValidationSchema(getString: UseStringsReturn['getString']): Yup.ObjectSchema {
  return Yup.object().shape({
    connectorRef: getConnectorSchema(getString),
    stage: Yup.lazy((): Yup.Schema<unknown> => {
      return Yup.string().required(getString('cd.pipelineSteps.infraTab.stageIsRequired'))
    })
  })
}

export function getConnectorSchema(getString: UseStringsReturn['getString']): Yup.StringSchema<string | undefined> {
  return Yup.string().required(getString('fieldRequired', { field: getString('connector') }))
}

export function getSshKeyRefSchema(getString: UseStringsReturn['getString']): Yup.StringSchema<string | undefined> {
  return Yup.string().required(getString('fieldRequired', { field: getString('connector') }))
}

export function getServiceRefSchema(getString: UseStringsReturn['getString']): Yup.StringSchema<string | undefined> {
  return Yup.string().trim().required(getString('cd.pipelineSteps.serviceTab.serviceIsRequired'))
}

export function getEnvironmentRefSchema(
  getString: UseStringsReturn['getString']
): Yup.StringSchema<string | undefined> {
  return Yup.string().trim().required(getString('cd.pipelineSteps.environmentTab.environmentIsRequired'))
}

export function getServiceDeploymentTypeSchema(
  getString: UseStringsReturn['getString']
): Yup.StringSchema<string | undefined> {
  return Yup.string()
    .oneOf(Object.values(ServiceDeploymentType))
    .required(getString('cd.pipelineSteps.serviceTab.deploymentTypeRequired'))
}

export function getEnvironmentTabSchema(getString: UseStringsReturn['getString']): Yup.MixedSchema {
  return Yup.mixed()
    .required()
    .test({
      test(valueObj: DeployStageConfig): boolean | Yup.ValidationError {
        if (!valueObj.gitOpsEnabled) {
          if (valueObj.environment?.environmentRef === undefined) {
            return this.createError({
              path: 'environment.environmentRef',
              message: getString('cd.pipelineSteps.environmentTab.environmentIsRequired')
            })
          }

          if (
            valueObj.environment?.environmentRef !== RUNTIME_INPUT_VALUE &&
            valueObj.infrastructureRef === undefined
          ) {
            return this.createError({
              path: 'infrastructureRef',
              message: getString('cd.pipelineSteps.environmentTab.infrastructureIsRequired')
            })
          }
        } else {
          if (
            valueObj.environmentOrEnvGroupRef !== RUNTIME_INPUT_VALUE &&
            (valueObj.environmentOrEnvGroupRef as SelectOption)?.value === undefined
          ) {
            return this.createError({
              path: 'environmentOrEnvGroupRef',
              message: getString('cd.pipelineSteps.environmentTab.environmentOrEnvGroupIsRequired')
            })
          }

          if (valueObj.isEnvGroup && valueObj.environmentInEnvGroupRef?.length === 0) {
            return this.createError({
              path: 'environmentInEnvGroupRef',
              message: getString('cd.pipelineSteps.environmentTab.environmentInEnvGroupIsRequired')
            })
          }

          if (valueObj.clusterRef?.length === 0 && valueObj.environmentOrEnvGroupRef !== RUNTIME_INPUT_VALUE) {
            return this.createError({
              path: 'clusterRef',
              message: getString('cd.pipelineSteps.environmentTab.clusterIsRequired')
            })
          }
        }
        return true
      }
    })
}

export function getInfraDeploymentTypeSchema(
  getString: UseStringsReturn['getString']
): Yup.StringSchema<string | undefined> {
  return Yup.string()
    .oneOf(Object.values(InfraDeploymentType))
    .required(getString('cd.pipelineSteps.infraTab.deploymentType'))
}

export const getInfrastructureDefinitionValidationSchema = (
  deploymentType: GetExecutionStrategyYamlQueryParams['serviceDefinitionType'],
  getString: UseStringsReturn['getString']
) => {
  if (isServerlessDeploymentType(deploymentType)) {
    if (deploymentType === ServiceDeploymentType.ServerlessAwsLambda) {
      return getValidationSchemaWithRegion(getString)
    }
    if (deploymentType === ServiceDeploymentType.ssh) {
      return Yup.object().shape({
        credentialsRef: getSshKeyRefSchema(getString)
      })
    }
    if (deploymentType === ServiceDeploymentType.winrm) {
      return Yup.object().shape({})
    }
    return getValidationSchema(getString)
  } else {
    return Yup.object().shape({
      connectorRef: getConnectorSchema(getString),
      namespace: getNameSpaceSchema(getString),
      releaseName: getReleaseNameSchema(getString),
      cluster: Yup.mixed().test({
        test(val): boolean | Yup.ValidationError {
          const infraDeploymentType = get(this.options.context, 'spec.infrastructure.infrastructureDefinition.type')
          if (infraDeploymentType === InfraDeploymentType.KubernetesGcp) {
            if (isEmpty(val) || (typeof val === 'object' && isEmpty(val.value))) {
              return this.createError({
                message: getString('fieldRequired', { field: getString('common.cluster') })
              })
            }
          }
          return true
        }
      })
    })
  }
}

function getServiceSchema(
  getString: UseStringsReturn['getString'],
  isNewServiceEnvEntity: boolean
): Record<string, Yup.Schema<unknown>> {
  return isNewServiceEnvEntity
    ? {
        service: Yup.object().shape({
          serviceRef: getServiceRefSchema(getString)
        })
      }
    : {
        serviceConfig: Yup.object().shape({
          serviceRef: getServiceRefSchema(getString),
          serviceDefinition: Yup.object().shape({
            type: getServiceDeploymentTypeSchema(getString),
            spec: Yup.object().shape(getVariablesValidationField(getString))
          })
        })
      }
}

export function getCDStageValidationSchema(
  getString: UseStringsReturn['getString'],
  deploymentType: GetExecutionStrategyYamlQueryParams['serviceDefinitionType'],
  isNewServiceEnvEntity: boolean,
  contextType?: string
): Yup.Schema<unknown> {
  return Yup.object().shape({
    ...getNameAndIdentifierSchema(getString, contextType),
    spec: Yup.object().shape({
      ...getServiceSchema(getString, isNewServiceEnvEntity),
      infrastructure: Yup.object().shape({
        environmentRef: getEnvironmentRefSchema(getString),
        infrastructureDefinition: Yup.object().shape({
          type: getInfraDeploymentTypeSchema(getString),
          spec: getInfrastructureDefinitionValidationSchema(deploymentType, getString)
        })
      }),
      execution: Yup.object().shape({
        steps: Yup.array().required().min(1, getString('cd.pipelineSteps.executionTab.stepsCount'))
      })
    }),
    failureStrategies: getFailureStrategiesValidationSchema(getString),
    ...getVariablesValidationField(getString)
  })
}
