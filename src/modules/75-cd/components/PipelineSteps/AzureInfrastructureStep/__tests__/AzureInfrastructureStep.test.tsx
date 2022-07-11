/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, getByText, render, waitFor } from '@testing-library/react'
import { MultiTypeInputType, MultiTypeInputValue, RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { K8sAzureInfrastructure } from 'services/cd-ng'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { AzureInfrastructureSpec } from '../AzureInfrastructureStep'
import {
  connectorsResponse,
  connectorResponse,
  subscriptionsResponse,
  resourceGroupsResponse,
  clustersResponse
} from './mocks'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

jest.mock('services/cd-ng', () => ({
  useGetConnector: jest.fn(() => connectorResponse),
  useGetAzureSubscriptions: jest.fn(() => subscriptionsResponse),
  useGetAzureResourceGroupsBySubscription: jest.fn(() => resourceGroupsResponse),
  useGetAzureClusters: jest.fn(() => clustersResponse),
  getConnectorListV2Promise: jest.fn(() => Promise.resolve(connectorsResponse.data)),
  getAzureSubscriptionsPromise: jest.fn(() => Promise.resolve(subscriptionsResponse.data)),
  getAzureResourceGroupsBySubscriptionPromise: jest.fn(() => Promise.resolve(resourceGroupsResponse.data)),
  getAzureClustersPromise: jest.fn(() => Promise.resolve(clustersResponse.data))
}))

const getRuntimeInputsValues = (): K8sAzureInfrastructure => ({
  connectorRef: RUNTIME_INPUT_VALUE,
  subscriptionId: RUNTIME_INPUT_VALUE,
  resourceGroup: RUNTIME_INPUT_VALUE,
  cluster: RUNTIME_INPUT_VALUE,
  namespace: RUNTIME_INPUT_VALUE,
  releaseName: RUNTIME_INPUT_VALUE
})

const getInitialValues = (): K8sAzureInfrastructure => ({
  connectorRef: 'connectorRef',
  subscriptionId: 'subscriptionId',
  resourceGroup: 'resourceGroup',
  cluster: 'cluster',
  namespace: 'namespace',
  releaseName: 'releasename'
})

const getInvalidYaml = (): string => `p ipe<>line:
sta ges:
   - st<>[]age:
              s pe<> c: <> sad-~`

const getYaml = (): string => `pipeline:
    stages:
        - stage:
              spec:
                  infrastructure:
                      infrastructureDefinition:
                          type: KubernetesAzure
                          spec:
                              connectorRef: account.connectorRef
                              subscriptionId: subscriptionId
                              resourceGroup: resourceGroup
                              cluster: cluster
                              namespace: namespace
                              releaseName: releaseName`

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const getParams = () => ({
  accountId: 'accountId',
  module: 'cd',
  orgIdentifier: 'default',
  pipelineIdentifier: '-1',
  projectIdentifier: 'projectIdentifier'
})

const connectorRefPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.connectorRef'
const subscriptionPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.subscriptionId'
const resourceGroupPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.resourceGroup'
const clusterPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.cluster'

jest.mock('@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField', () => ({
  ...(jest.requireActual('@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField') as any),
  // eslint-disable-next-line react/display-name
  FormMultiTypeConnectorField: (props: any) => {
    return (
      <div>
        <button
          name={'changeFormMultiTypeConnectorField'}
          onClick={() => {
            props.onChange('value', MultiTypeInputValue.STRING, MultiTypeInputType.RUNTIME)
          }}
        >
          Form Multi Type Connector Field button
        </button>
      </div>
    )
  }
}))

describe('Test Azure Infrastructure Spec snapshot', () => {
  beforeEach(() => {
    factory.registerStep(new AzureInfrastructureSpec())
  })

  test('Should render edit view with empty initial values', () => {
    const { container } = render(
      <TestStepWidget initialValues={{}} type={StepType.KubernetesAzure} stepViewType={StepViewType.Edit} />
    )
    expect(container).toMatchSnapshot()
  })

  test('Should render edit view with values', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        type={StepType.KubernetesAzure}
        stepViewType={StepViewType.Edit}
      />
    )

    expect(container).toMatchSnapshot()
  })

  test('Should render edit view with runtime values', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={getRuntimeInputsValues()}
        type={StepType.KubernetesAzure}
        stepViewType={StepViewType.Edit}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('Should render edit view for inputset view', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValues()}
        type={StepType.KubernetesAzure}
        stepViewType={StepViewType.InputSet}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('Should render variable view', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValues()}
        type={StepType.KubernetesAzure}
        stepViewType={StepViewType.InputVariable}
      />
    )

    expect(container).toMatchSnapshot()
  })
})

describe('Test Azure Infrastructure Spec behavior', () => {
  beforeEach(() => {
    factory.registerStep(new AzureInfrastructureSpec())
  })

  test('Should call onUpdate if valid values entered - inputset', async () => {
    const onUpdateHandler = jest.fn()
    const { container, findByText } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValues()}
        type={StepType.KubernetesAzure}
        stepViewType={StepViewType.InputSet}
        onUpdate={onUpdateHandler}
      />
    )

    const button = await waitFor(() => findByText('Form Multi Type Connector Field button'))
    act(() => {
      fireEvent.click(button)
    })

    await act(async () => {
      fireEvent.click(getByText(container, 'Submit'))
    })
    expect(onUpdateHandler).toHaveBeenCalledWith(getInitialValues())
  })

  test('Should show errors if invalid values entered - inputset', async () => {
    const onUpdateHandler = jest.fn()
    const { container } = render(
      <TestStepWidget
        initialValues={{}}
        template={getRuntimeInputsValues()}
        allValues={{}}
        type={StepType.KubernetesAzure}
        stepViewType={StepViewType.InputSet}
        onUpdate={onUpdateHandler}
      />
    )

    await act(async () => {
      fireEvent.click(getByText(container, 'Submit'))
    })

    expect(container).toMatchSnapshot('errors')
  })

  test('Should call onUpdate if valid values entered - edit view', async () => {
    const onUpdateHandler = jest.fn()
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        template={getInitialValues()}
        allValues={getInitialValues()}
        type={StepType.KubernetesAzure}
        stepViewType={StepViewType.Edit}
        onUpdate={onUpdateHandler}
        ref={ref}
      />
    )

    await act(async () => {
      const namespaceInput = container.querySelector(
        '[placeholder="pipeline.infraSpecifications.namespacePlaceholder"]'
      )
      fireEvent.change(namespaceInput!, { target: { value: 'namespace changed' } })
    })

    await act(async () => {
      const subscriptionInput = container.querySelector(
        '[placeholder="cd.steps.azureInfraStep.subscriptionPlaceholder"]'
      )
      fireEvent.change(subscriptionInput!, { target: { value: 'subscription1' } })

      await ref.current?.submitForm()
    })

    await waitFor(() => expect(onUpdateHandler).toHaveBeenCalled())
  })
})

describe('Test Azure Infrastructure Spec autocomplete', () => {
  test('Test connector autocomplete', async () => {
    const step = new AzureInfrastructureSpec() as any
    let list: CompletionItemInterface[]

    list = await step.getConnectorsListForYaml(connectorRefPath, getYaml(), getParams())
    expect(list).toHaveLength(2)
    expect(list[0].insertText).toBe('AWS')

    list = await step.getConnectorsListForYaml('invalid path', getYaml(), getParams())
    expect(list).toHaveLength(0)

    list = await step.getConnectorsListForYaml(connectorRefPath, getInvalidYaml(), getParams())
    expect(list).toHaveLength(0)
  })

  test('Test subscription names autocomplete', async () => {
    const step = new AzureInfrastructureSpec() as any
    let list: CompletionItemInterface[]

    list = await step.getSubscriptionListForYaml(subscriptionPath, getYaml(), getParams())
    expect(list).toHaveLength(2)
    expect(list[0].insertText).toBe('sub1')

    list = await step.getSubscriptionListForYaml('invalid path', getYaml(), getParams())
    expect(list).toHaveLength(0)

    list = await step.getSubscriptionListForYaml(subscriptionPath, getInvalidYaml(), getParams())
    expect(list).toHaveLength(0)
  })

  test('Test resource groups names autocomplete', async () => {
    const step = new AzureInfrastructureSpec() as any
    let list: CompletionItemInterface[]

    list = await step.getResourceGroupListForYaml(resourceGroupPath, getYaml(), getParams())
    expect(list).toHaveLength(2)
    expect(list[0].insertText).toBe('rg1')

    list = await step.getResourceGroupListForYaml('invalid path', getYaml(), getParams())
    expect(list).toHaveLength(0)

    list = await step.getResourceGroupListForYaml(resourceGroupPath, getInvalidYaml(), getParams())
    expect(list).toHaveLength(0)
  })

  test('Test cluster names autocomplete', async () => {
    const step = new AzureInfrastructureSpec() as any
    let list: CompletionItemInterface[]

    list = await step.getClusterListForYaml(clusterPath, getYaml(), getParams())
    expect(list).toHaveLength(2)
    expect(list[0].insertText).toBe('us-west2/abc')

    list = await step.getClusterListForYaml('invalid path', getYaml(), getParams())
    expect(list).toHaveLength(0)

    list = await step.getClusterListForYaml(clusterPath, getInvalidYaml(), getParams())
    expect(list).toHaveLength(0)
  })
})
