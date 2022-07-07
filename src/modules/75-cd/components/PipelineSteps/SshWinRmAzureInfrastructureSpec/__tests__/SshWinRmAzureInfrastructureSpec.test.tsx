/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, waitFor, queryByAttribute } from '@testing-library/react'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { SshWinRmAzureInfrastructure } from 'services/cd-ng'
import * as CDNG from 'services/cd-ng'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import {
  SshWinRmAzureInfrastructureSpec,
  AzureConnectorRegex,
  AzureSubscriptionRegex,
  AzureResourceGroupRegex,
  AzureClusterRegex
} from '../SshWinRmAzureInfrastructureSpec'
import {
  connectorsResponse,
  connectorResponse,
  subscriptionsResponse,
  resourceGroupsResponse,
  clustersResponse,
  tagsResponse,
  mockSecret,
  mockListSecrets
} from './mocks'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

jest.mock('services/cd-ng', () => ({
  useGetConnector: jest.fn(() => connectorResponse),
  getConnectorListV2Promise: jest.fn(() => Promise.resolve(connectorsResponse.data)),
  getAzureSubscriptionsPromise: jest.fn(() => Promise.resolve(subscriptionsResponse.data)),
  getAzureResourceGroupsBySubscriptionPromise: jest.fn(() => Promise.resolve(resourceGroupsResponse.data)),
  getAzureClustersPromise: jest.fn(() => Promise.resolve(clustersResponse.data)),
  getSubscriptionTagsPromise: jest.fn(() => Promise.resolve(tagsResponse.data)),

  getSecretV2Promise: jest.fn().mockImplementation(() => Promise.resolve(mockSecret)),
  listSecretsV2Promise: jest.fn().mockImplementation(() => Promise.resolve(mockListSecrets))
}))

const infraDefPath = 'pipeline.stages[0].stage.spec.infrastructure.infrastructureDefinition'
const accountIdParams = { accountId: 'accountId1' }

const getInitialCredAndConn = (): Partial<SshWinRmAzureInfrastructure> => ({
  credentialsRef: 'credentialsRef1',
  sshKey: { identifier: 'credentialsRef1' },
  connectorRef: 'connectorRef1'
})

const getInitialValues = (): SshWinRmAzureInfrastructure => ({
  credentialsRef: 'credentialsRef1',
  sshKey: { identifier: 'credentialsRef1' },
  connectorRef: 'connectorRef1',
  subscriptionId: 'subscriptionId',
  resourceGroup: 'resourceGroup',
  cluster: 'cluster',
  tags: {}
})

const submitForm = async (getByText: any) =>
  await act(async () => {
    fireEvent.click(getByText('Submit'))
  })

/*const getInvalidYaml = (): string => `p ipe<>line:
sta ges:
   - st<>[]age:
              s pe<> c: <> sad-~`*/

const getYaml = (): string => `pipeline:
    stages:
        - stage:
              spec:
                  infrastructure:
                      infrastructureDefinition:
                          type: SshWinRmAzure
                          spec:
                              connectorRef: account.connectorRef
                              subscriptionId: subscriptionId
                              resourceGroup: resourceGroup
                              cluster: cluster
                              namespace: namespace
                              releaseName: releaseName`

/*const connectorRefPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.connectorRef'
const subscriptionPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.subscriptionId'
const resourceGroupPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.resourceGroup'
const clusterPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.cluster'*/

describe('Test Azure Infrastructure Spec behavior', () => {
  beforeEach(() => {
    factory.registerStep(new SshWinRmAzureInfrastructureSpec())
  })

  test('Should call onUpdate if valid values entered - inputset', async () => {
    const onUpdateHandler = jest.fn()
    const { getByText } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        template={getInitialValues()}
        allValues={getInitialValues()}
        type={StepType.SshWinRmAzure}
        stepViewType={StepViewType.InputSet}
        onUpdate={onUpdateHandler}
      />
    )

    await submitForm(getByText)
    await waitFor(() => {
      expect(onUpdateHandler).toHaveBeenCalledWith(getInitialValues())
    })
  })

  test('Should not call onUpdate if invalid values entered - inputset', async () => {
    const onUpdateHandler = jest.fn()
    const { getByText } = render(
      <TestStepWidget
        initialValues={{}}
        template={getInitialValues()}
        allValues={{}}
        type={StepType.SshWinRmAzure}
        stepViewType={StepViewType.InputSet}
        onUpdate={onUpdateHandler}
      />
    )

    await submitForm(getByText)
    expect(onUpdateHandler).not.toHaveBeenCalled()
  })

  test('Test user flow', async () => {
    const onUpdateHandler = jest.fn()
    const { getByText, container } = render(
      <TestStepWidget
        initialValues={getInitialCredAndConn()}
        template={getInitialCredAndConn()}
        allValues={getInitialCredAndConn()}
        type={StepType.SshWinRmAzure}
        stepViewType={StepViewType.InputSet}
        onUpdate={onUpdateHandler}
      />
    )

    await waitFor(() => {
      expect(CDNG.getAzureSubscriptionsPromise).toBeCalled()
    })
    await waitFor(() => {
      expect(queryByAttribute('name', container, 'subscriptionId')).not.toBeDisabled()
    })

    fireEvent.click(
      container.querySelector(`[class*="subscriptionId-select"] .bp3-input-action [data-icon="chevron-down"]`)!
    )
    await waitFor(() => expect(container.querySelector('[class*="menuItemLabel"]')).not.toBeNull())
    fireEvent.click(getByText('subscription1'))
    await waitFor(() => {
      expect(CDNG.getAzureResourceGroupsBySubscriptionPromise).toBeCalled()
    })

    await waitFor(() => {
      expect(queryByAttribute('name', container, 'resourceGroup')).not.toBeDisabled()
    })
    fireEvent.click(
      container.querySelector(`[class*="resourceGroup-select"] .bp3-input-action [data-icon="chevron-down"]`)!
    )
    await waitFor(() => expect(container.querySelector('[class*="menuItemLabel"]')).not.toBeNull())
    fireEvent.click(getByText('rg1'))
    await waitFor(() => {
      expect(CDNG.getAzureClustersPromise).toBeCalled()
    })

    await waitFor(() => {
      expect(queryByAttribute('name', container, 'cluster')).not.toBeDisabled()
    })
    fireEvent.click(container.querySelector(`[class*="cluster-select"] .bp3-input-action [data-icon="chevron-down"]`)!)
    await waitFor(() => expect(container.querySelector('[class*="menuItemLabel"]')).not.toBeNull())
    act(() => {
      fireEvent.click(getByText('us-west2/abc'))
    })

    await submitForm(getByText)
    await waitFor(() => {
      expect(onUpdateHandler).toHaveBeenCalled()
    })
  })
})

describe('invocation map test', () => {
  test('invocation map, empty yaml', () => {
    const yaml = ''
    const invocationMap = factory.getStep(StepType.SshWinRmAzure)?.getInvocationMap?.()
    invocationMap?.get(AzureConnectorRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.getConnectorListV2Promise).not.toBeCalled()
    invocationMap?.get(AzureSubscriptionRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.getAzureSubscriptionsPromise).toBeCalled()
    invocationMap?.get(AzureResourceGroupRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.getAzureResourceGroupsBySubscriptionPromise).toBeCalled()
    invocationMap?.get(AzureClusterRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.getAzureClustersPromise).toBeCalled()
  })

  test('invocation map, wrong yaml', () => {
    const yaml = {} as string
    const invocationMap = factory.getStep(StepType.SshWinRmAzure)?.getInvocationMap?.()
    invocationMap?.get(AzureConnectorRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.getConnectorListV2Promise).not.toBeCalled()
    invocationMap?.get(AzureSubscriptionRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.getAzureSubscriptionsPromise).toBeCalled()
    invocationMap?.get(AzureResourceGroupRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.getAzureResourceGroupsBySubscriptionPromise).toBeCalled()
    invocationMap?.get(AzureClusterRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.getAzureClustersPromise).toBeCalled()
  })

  test('invocation map should call template list', () => {
    jest.spyOn(CDNG, 'listSecretsV2Promise').mockImplementationOnce(() => Promise.resolve(mockListSecrets as any))
    jest
      .spyOn(CDNG, 'getConnectorListV2Promise')
      .mockImplementationOnce(() => Promise.resolve(connectorsResponse.data as any))

    const yaml = getYaml()

    const invocationMap = factory.getStep(StepType.SshWinRmAzure)?.getInvocationMap?.()
    invocationMap?.get(AzureConnectorRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.getConnectorListV2Promise).toBeCalled()
    invocationMap?.get(AzureSubscriptionRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.getAzureSubscriptionsPromise).toBeCalled()
    invocationMap?.get(AzureResourceGroupRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.getAzureResourceGroupsBySubscriptionPromise).toBeCalled()
    invocationMap?.get(AzureClusterRegex)?.(infraDefPath, yaml, accountIdParams)
    expect(CDNG.getAzureClustersPromise).toBeCalled()
  })
})
