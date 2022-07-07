/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { IconName } from '@wings-software/uicore'
import type { FormikErrors } from 'formik'
import { get, isEmpty } from 'lodash-es'
import { parse } from 'yaml'
import { CompletionItemKind } from 'vscode-languageserver-types'
import type { StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import {
  getAzureClustersPromise,
  getAzureResourceGroupsBySubscriptionPromise,
  getAzureSubscriptionsPromise,
  getConnectorListV2Promise,
  SshWinRmAzureInfrastructure,
  ConnectorResponse,
  AzureResourceGroupDTO,
  AzureClusterDTO
} from 'services/cd-ng'
import type { AzureSubscriptionDTO } from 'services/cd-ng'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import { Connectors } from '@connectors/constants'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { getConnectorName, getConnectorValue } from '@pipeline/components/PipelineSteps/Steps/StepsHelper'
import {
  AzureInfrastructureSpecEditableProps,
  SshWinRmAzureInfrastructureTemplate,
  subscriptionLabel,
  clusterLabel,
  resourceGroupLabel
} from './SshWinRmAzureInfrastructureInterface'
import { AzureInfrastructureSpecForm } from './SshWinRmAzureInfrastructureForm'

const logger = loggerFor(ModuleName.CD)

const yamlErrorMessage = 'cd.parsingYamlError'

interface AzureInfrastructureSpecStep extends SshWinRmAzureInfrastructure {
  name?: string
  identifier?: string
}

export const AzureConnectorRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.connectorRef$/
export const AzureSubscriptionRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.subscriptionId$/
export const AzureResourceGroupRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.resourceGroup$/
export const AzureClusterRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.cluster$/
export const SshWinRmAzureType = StepType.SshWinRmAzure

export class SshWinRmAzureInfrastructureSpec extends PipelineStep<AzureInfrastructureSpecStep> {
  lastFetched: number
  protected type = StepType.SshWinRmAzure
  protected defaultValues: SshWinRmAzureInfrastructure = {
    credentialsRef: '',
    connectorRef: '',
    subscriptionId: '',
    resourceGroup: '',
    cluster: '',
    tags: {},
    usePublicDns: false
  }

  protected stepIcon: IconName = 'microsoft-azure'
  protected stepName = 'Specify your Azure Connector'
  protected stepPaletteVisible = false
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()

  constructor() {
    super()
    this.lastFetched = new Date().getTime()
    this.invocationMap.set(AzureConnectorRegex, this.getConnectorsListForYaml.bind(this))
    this.invocationMap.set(AzureSubscriptionRegex, this.getSubscriptionListForYaml.bind(this))
    this.invocationMap.set(AzureResourceGroupRegex, this.getResourceGroupListForYaml.bind(this))
    this.invocationMap.set(AzureClusterRegex, this.getClusterListForYaml.bind(this))

    this._hasStepVariables = true
  }

  protected getConnectorsListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err: any) {
      /* istanbul ignore next */ logger.error(yamlErrorMessage, err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    /* istanbul ignore else */
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.connectorRef', ''))
      if (get(obj, 'type', '') === SshWinRmAzureType) {
        return getConnectorListV2Promise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            includeAllConnectorsAvailableAtScope: true
          },
          body: { types: [Connectors.AZURE], filterType: 'Connector' }
        }).then(
          response =>
            get(response, 'data.content', []).map((connector: ConnectorResponse) => ({
              label: getConnectorName(connector),
              insertText: getConnectorValue(connector),
              kind: CompletionItemKind.Field
            })) || /* istanbul ignore next */ []
        )
      }
    }

    return Promise.resolve([])
  }

  protected getSubscriptionListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err: any) {
      /* istanbul ignore next */ logger.error(yamlErrorMessage, err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    /* istanbul ignore else */
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.subscriptionId', ''))
      if (get(obj, 'type', '') === SshWinRmAzureType && get(obj, 'spec.connectorRef', '')) {
        return getAzureSubscriptionsPromise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            connectorRef: get(obj, 'spec.connectorRef', '')
          }
        }).then(response => {
          const values: CompletionItemInterface[] = []
          get(response, 'data.subscriptions', []).map((sub: AzureSubscriptionDTO) =>
            values.push({ label: sub.subscriptionId, insertText: sub.subscriptionId, kind: CompletionItemKind.Field })
          )
          return values
        })
      }
    }

    return Promise.resolve([])
  }

  protected getResourceGroupListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err: any) {
      /* istanbul ignore next */ logger.error(yamlErrorMessage, err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    // /* istanbul ignore else */
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.resourceGroup', ''))
      if (
        get(obj, 'type', '') === SshWinRmAzureType &&
        get(obj, 'spec.connectorRef', '') &&
        get(obj, 'spec.subscriptionId', '')
      ) {
        return getAzureResourceGroupsBySubscriptionPromise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            connectorRef: get(obj, 'spec.connectorRef', '')
          },
          subscriptionId: get(obj, 'spec.subscriptionId', '')
        }).then(
          response =>
            get(response, 'data.resourceGroups', []).map((rg: AzureResourceGroupDTO) => ({
              label: rg.resourceGroup,
              insertText: rg.resourceGroup,
              kind: CompletionItemKind.Field
            })) || /* istanbul ignore next */ []
        )
      }
    }

    return Promise.resolve([])
  }

  protected getClusterListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err: any) {
      /* istanbul ignore next */ logger.error(yamlErrorMessage, err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    // /* istanbul ignore else */
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.cluster', ''))
      if (
        get(obj, 'type', '') === SshWinRmAzureType &&
        get(obj, 'spec.connectorRef', '') &&
        get(obj, 'spec.subscriptionId', '') &&
        get(obj, 'spec.resourceGroup', '')
      ) {
        return getAzureClustersPromise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            connectorRef: get(obj, 'spec.connectorRef', '')
          },
          subscriptionId: get(obj, 'spec.subscriptionId', ''),
          resourceGroup: get(obj, 'spec.resourceGroup', '')
        }).then(response =>
          get(response, 'data.clusters', []).map((cl: AzureClusterDTO) => ({
            label: cl.cluster,
            insertText: cl.cluster,
            kind: CompletionItemKind.Field
          }))
        )
      }
    }

    return Promise.resolve([])
  }

  validateInputSet({
    data,
    getString
  }: ValidateInputSetProps<SshWinRmAzureInfrastructure>): FormikErrors<SshWinRmAzureInfrastructure> {
    const errors: Partial<SshWinRmAzureInfrastructureTemplate> = {}
    if (isEmpty(data.sshKey)) {
      errors.credentialsRef = getString?.('common.validation.fieldIsRequired', { name: getString('connector') })
    }
    if (isEmpty(data.connectorRef)) {
      errors.connectorRef = getString?.('common.validation.fieldIsRequired', { name: getString('connector') })
    }
    if (isEmpty(data.subscriptionId)) {
      errors.subscriptionId = getString?.('common.validation.fieldIsRequired', { name: getString(subscriptionLabel) })
    }
    if (isEmpty(data.resourceGroup)) {
      errors.resourceGroup = getString?.('common.validation.fieldIsRequired', { name: getString(resourceGroupLabel) })
    }
    if (isEmpty(data.cluster)) {
      errors.cluster = getString?.('common.validation.fieldIsRequired', { name: getString(clusterLabel) })
    }
    return errors
  }

  renderStep(props: StepProps<SshWinRmAzureInfrastructure>): JSX.Element {
    const { initialValues, onUpdate, stepViewType, customStepProps, readonly, allowableTypes } = props
    return (
      <AzureInfrastructureSpecForm
        onUpdate={onUpdate}
        readonly={readonly}
        stepViewType={stepViewType}
        {...(customStepProps as AzureInfrastructureSpecEditableProps)}
        initialValues={initialValues}
        allowableTypes={allowableTypes}
      />
    )
  }
}
