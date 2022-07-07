/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, getByText, render, waitFor } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { GcpInfrastructureSpec } from '../GcpInfrastructureSpec'
import { ConnectorsResponse } from './mock/ConnectorsResponse.mock'
import { ConnectorResponse } from './mock/ConnectorResponse.mock'
import { ClusterNamesResponse } from './mock/ClusterNamesResponse.mock'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

jest.mock('services/cd-ng', () => ({
  useGetConnector: jest.fn(() => ConnectorResponse),
  useGetClusterNamesForGcp: jest.fn(() => ClusterNamesResponse),
  useGetClusterNamesForGcpInfra: jest.fn(() => ClusterNamesResponse),
  getConnectorListV2Promise: jest.fn(() => Promise.resolve(ConnectorsResponse.data)),
  getClusterNamesForGcpPromise: jest.fn(() => Promise.resolve(ClusterNamesResponse.data))
}))

const getRuntimeInputsValues = () => ({
  connectorRef: RUNTIME_INPUT_VALUE,
  cluster: RUNTIME_INPUT_VALUE,
  namespace: RUNTIME_INPUT_VALUE,
  releaseName: RUNTIME_INPUT_VALUE
})

const getInitialValues = () => ({
  connectorRef: 'connectorRef',
  cluster: 'cluster',
  namespace: 'namespace',
  releaseName: 'releasename'
})

const getEmptyInitialValues = () => ({
  connectorRef: '',
  cluster: '',
  namespace: '',
  releaseName: ''
})

const getInvalidYaml = () => `p ipe<>line:
sta ges:
   - st<>[]age:
              s pe<> c: <> sad-~`

const getYaml = () => `pipeline:
    stages:
        - stage:
              spec:
                  infrastructure:
                      infrastructureDefinition:
                          type: KubernetesGcp
                          spec:
                              connectorRef: account.connectorRef
                              cluster: cluster
                              namespace: namespace
                              releaseName: releaseName`

const getParams = () => ({
  accountId: 'accountId',
  module: 'cd',
  orgIdentifier: 'default',
  pipelineIdentifier: '-1',
  projectIdentifier: 'projectIdentifier'
})

const connectorRefPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.connectorRef'
const clusterPath = 'pipeline.stages.0.stage.spec.infrastructure.infrastructureDefinition.spec.cluster'

describe('Test GcpInfrastructureSpec snapshot', () => {
  beforeEach(() => {
    factory.registerStep(new GcpInfrastructureSpec())
  })

  test('should render edit view with empty initial values', () => {
    const { container } = render(
      <TestStepWidget initialValues={{}} type={StepType.KubernetesGcp} stepViewType={StepViewType.Edit} />
    )
    expect(container).toMatchSnapshot()
  })

  test('should render edit view with values ', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        type={StepType.KubernetesGcp}
        stepViewType={StepViewType.Edit}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('should render edit view with runtime values ', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={getRuntimeInputsValues()}
        type={StepType.KubernetesGcp}
        stepViewType={StepViewType.Edit}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('should render edit view for inputset view', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValues()}
        type={StepType.KubernetesGcp}
        stepViewType={StepViewType.InputSet}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('should render variable view', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValues()}
        type={StepType.KubernetesGcp}
        stepViewType={StepViewType.InputVariable}
      />
    )

    expect(container).toMatchSnapshot()
  })
})

describe('Test GcpInfrastructureSpec behavior', () => {
  beforeEach(() => {
    factory.registerStep(new GcpInfrastructureSpec())
  })

  test('should call onUpdate if valid values entered - inputset', async () => {
    const onUpdateHandler = jest.fn()
    const { container } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValues()}
        type={StepType.KubernetesGcp}
        stepViewType={StepViewType.InputSet}
        onUpdate={onUpdateHandler}
      />
    )

    await act(async () => {
      fireEvent.click(getByText(container, 'Submit'))
    })
    expect(onUpdateHandler).toHaveBeenCalledWith(getInitialValues())
  })

  test('should call onUpdate if valid values entered when connector ref is not present- inputset', async () => {
    const onUpdateHandler = jest.fn()
    const { container } = render(
      <TestStepWidget
        initialValues={{
          cluster: 'cluster',
          environmentRef: 'environmentRef',
          infrastructureRef: 'infrastructureRef'
        }}
        template={{
          cluster: RUNTIME_INPUT_VALUE
        }}
        allValues={{
          cluster: 'cluster',
          environmentRef: 'environmentRef',
          infrastructureRef: 'infrastructureRef'
        }}
        type={StepType.KubernetesGcp}
        stepViewType={StepViewType.InputSet}
        onUpdate={onUpdateHandler}
      />
    )

    await act(async () => {
      fireEvent.click(getByText(container, 'Submit'))
    })
    expect(onUpdateHandler).toHaveBeenCalledWith({
      cluster: 'cluster',
      environmentRef: 'environmentRef',
      infrastructureRef: 'infrastructureRef'
    })
  })

  test('should not call onUpdate if invalid values entered - inputset', async () => {
    const onUpdateHandler = jest.fn()
    const { container } = render(
      <TestStepWidget
        initialValues={getEmptyInitialValues()}
        template={getRuntimeInputsValues()}
        allValues={getEmptyInitialValues()}
        type={StepType.KubernetesGcp}
        stepViewType={StepViewType.InputSet}
        onUpdate={onUpdateHandler}
      />
    )

    await act(async () => {
      fireEvent.click(getByText(container, 'Submit'))
    })

    expect(onUpdateHandler).not.toHaveBeenCalled()
  })

  test('should call onUpdate if valid values entered - edit view', async () => {
    const onUpdateHandler = jest.fn()
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container } = render(
      <TestStepWidget
        initialValues={getInitialValues()}
        template={getRuntimeInputsValues()}
        allValues={getInitialValues()}
        type={StepType.KubernetesGcp}
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

      // TODO: add other fields

      await ref.current?.submitForm()
    })

    await waitFor(() =>
      expect(onUpdateHandler).toHaveBeenCalledWith({ ...getInitialValues(), ...{ namespace: 'namespace changed' } })
    )
  })
})

describe('Test GcpInfrastructureSpec autocomplete', () => {
  test('Test connector autocomplete', async () => {
    const step = new GcpInfrastructureSpec() as any
    let list: CompletionItemInterface[]

    list = await step.getConnectorsListForYaml(connectorRefPath, getYaml(), getParams())
    expect(list).toHaveLength(2)
    expect(list[0].insertText).toBe('AWS')

    list = await step.getConnectorsListForYaml('invalid path', getYaml(), getParams())
    expect(list).toHaveLength(0)

    // TODO: create yaml that cause yaml.parse to throw an error
    // its expected that yaml.parse throw an error but is not happening
    list = await step.getConnectorsListForYaml(connectorRefPath, getInvalidYaml(), getParams())
    expect(list).toHaveLength(0)
  })

  test('Test cluster names autocomplete', async () => {
    const step = new GcpInfrastructureSpec() as any
    let list: CompletionItemInterface[]

    list = await step.getClusterListForYaml(clusterPath, getYaml(), getParams())
    expect(list).toHaveLength(2)
    expect(list[0].insertText).toBe('us-west2/abc')

    list = await step.getClusterListForYaml('invalid path', getYaml(), getParams())
    expect(list).toHaveLength(0)

    // TODO: create yaml that cause yaml.parse to throw an error
    // its expected that yaml.parse throw an error but is not happening
    list = await step.getClusterListForYaml(clusterPath, getInvalidYaml(), getParams())
    expect(list).toHaveLength(0)
  })
})
