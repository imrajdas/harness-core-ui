/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { AzureSwapSlot } from '../AzureWebAppSwapSlot'

jest.mock('@common/components/MonacoEditor/MonacoEditor')
jest.mock('@common/components/YAMLBuilder/YamlBuilder')
jest.mock('react-monaco-editor', () => ({ value, onChange, name }: any) => {
  return <textarea value={value} onChange={e => onChange(e.target.value)} name={name || 'spec.source.spec.script'} />
})

const renderComponent = (data: any, stepType = StepViewType.Edit) =>
  render(<TestStepWidget {...data} type={StepType.AzureSwapSlot} stepViewType={stepType} />)

describe('Test Azure Web App Rollback step', () => {
  beforeEach(() => {
    factory.registerStep(new AzureSwapSlot())
  })

  test('should render edit view as new step', () => {
    const { container } = renderComponent({ initialValues: {} })
    expect(container).toMatchSnapshot()
  })

  test('should render swap slot step view', () => {
    const data = () => ({
      initialValues: {
        type: StepType.AzureSwapSlot,
        name: 'swap slot',
        timeout: '10m',
        identifier: 'swap slot',
        spec: {}
      },
      isNewStep: true,
      readonly: true
    })
    const { container } = renderComponent(data())
    expect(container).toMatchSnapshot()
  })

  test('should submit swap slot form', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const data = () => ({
      initialValues: {
        type: StepType.AzureSwapSlot,
        name: 'swap slot',
        timeout: '10m',
        identifier: 'swap slot',
        spec: {}
      },
      isNewStep: false,
      readonly: true,
      ref,
      onUpdate
    })
    const { container } = renderComponent(data())
    await act(() => ref.current?.submitForm()!)

    expect(onUpdate).toHaveBeenCalled()
    expect(container).toMatchSnapshot()
  })

  test('should error on submit', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const data = () => ({
      initialValues: {
        type: StepType.AzureSwapSlot,
        name: '',
        timeout: '',
        identifier: '',
        spec: {}
      },
      isNewStep: false,
      readonly: true,
      ref,
      onUpdate
    })
    const { container } = renderComponent(data())
    await act(() => ref.current?.submitForm()!)

    expect(container).toMatchSnapshot()
  })

  test('should show runtime component', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const data = () => ({
      initialValues: {
        type: StepType.AzureSwapSlot,
        name: 'swap slot',
        timeout: RUNTIME_INPUT_VALUE,
        identifier: 'swap slot',
        spec: {}
      },
      isNewStep: false,
      readonly: true,
      ref,
      onUpdate
    })
    const { container } = renderComponent(data())

    expect(container).toMatchSnapshot()
  })

  test('should update field value', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const data = () => ({
      initialValues: {
        type: StepType.AzureSwapSlot,
        name: 'azure_web_swap slot',
        timeout: '',
        identifier: 'azure_web_swap slot',
        spec: {}
      },
      isNewStep: false,
      readonly: false,
      ref,
      onUpdate
    })
    const { getByPlaceholderText } = renderComponent(data())
    const timeout = getByPlaceholderText('Enter w/d/h/m/s/ms')
    act(() => userEvent.type(timeout, '10m'))
    expect(timeout).toHaveDisplayValue('10m')
  })

  test('should render variable input step', () => {
    const data = () => ({
      initialValues: {
        type: StepType.AzureSwapSlot,
        name: 'swap slot',
        timeout: '10m',
        identifier: 'swap slot',
        spec: {}
      },
      isNewStep: false,
      readonly: true
    })
    const { container } = renderComponent(data(), StepViewType.InputSet)
    expect(container).toMatchSnapshot()
  })

  test('should render variable input step', () => {
    const data = () => ({
      initialValues: {
        type: StepType.AzureSwapSlot,
        name: 'swap slot',
        timeout: '10m',
        identifier: 'swap slot',
        spec: {}
      },
      stageIdentifier: 'qaStage',
      onUpdate: jest.fn(),
      metadataMap: {},
      variablesData: {
        type: 'swap slot',
        name: 'test',
        identifier: 'test',
        timeout: '10m',
        spec: {}
      },
      isNewStep: false,
      readonly: true,
      stepType: StepType.AzureSwapSlot
    })
    const { container } = renderComponent(data(), StepViewType.InputVariable)
    expect(container).toMatchSnapshot()
  })
})
