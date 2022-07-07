/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, render } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE } from '@harness/uicore'
import userEvent from '@testing-library/user-event'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { AzureTrafficShift } from '../AzureTrafficShift'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

describe('Azure Traffic Shift step', () => {
  beforeEach(() => {
    factory.registerStep(new AzureTrafficShift())
  })

  test('Should render edit view as new step', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const onChange = jest.fn()
    const { container, getByPlaceholderText, getByText } = render(
      <TestStepWidget
        initialValues={{}}
        type={StepType.AzureTrafficShift}
        onUpdate={onUpdate}
        onChange={onChange}
        ref={ref}
        stepViewType={StepViewType.Edit}
      />
    )

    const name = container.querySelector('input[name="name"]')
    act(() => userEvent.type(name!, 'New azure traffic shift'))
    expect(name).toHaveDisplayValue('New azure traffic shift')

    const id = getByText('New_azure_traffic_shift')
    expect(id!).toBeDefined()

    const timeout = getByPlaceholderText('Enter w/d/h/m/s/ms')
    act(() => userEvent.clear(timeout!))
    act(() => userEvent.type(timeout!, '10s'))
    expect(timeout).toHaveDisplayValue('10s')

    const traffic = container.querySelector('input[name="spec.traffic"]')
    act(() => userEvent.type(traffic!, '20%'))
    expect(traffic).toHaveDisplayValue('20%')

    await act(() => ref.current?.submitForm()!)

    expect(onUpdate).toHaveBeenCalled()
  })

  test('Should render edit view as edit step', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: 'AzureTrafficShift',
          name: 'AzureTrafficShift test',
          identifier: 'AzureTrafficShift_test',
          timeout: '10m',
          spec: {
            traffic: '20%'
          }
        }}
        type={StepType.AzureTrafficShift}
        stepViewType={StepViewType.Edit}
        isNewStep={false}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('Should render edit view as edit step for runtime inputs', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: 'AzureTrafficShift',
          name: 'AzureTrafficShift test',
          identifier: 'AzureTrafficShift_test',
          timeout: '<+input>',
          spec: {
            traffic: '<+input>'
          }
        }}
        type={StepType.AzureTrafficShift}
        stepViewType={StepViewType.Edit}
        isNewStep={false}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('Should render input set view', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container } = render(
      <TestStepWidget
        initialValues={{ identifier: 'AzureTrafficShift_test', type: 'AzureTrafficShift' }}
        template={{
          identifier: 'AzureTrafficShift_test',
          type: 'AzureTrafficShift',
          timeout: RUNTIME_INPUT_VALUE,
          spec: {
            traffic: RUNTIME_INPUT_VALUE
          }
        }}
        allValues={{
          type: 'AzureTrafficShift',
          name: 'AzureTrafficShift test',
          identifier: 'AzureTrafficShift_test',
          timeout: '<+input>',
          spec: {
            traffic: '<+input>'
          }
        }}
        type={StepType.AzureTrafficShift}
        stepViewType={StepViewType.InputSet}
        formikRef={ref}
        path={'/abc'}
      />
    )
    expect(container).toMatchSnapshot()
  })

  test('Should render variable view', () => {
    const { container } = render(
      <TestStepWidget
        initialValues={{
          type: 'AzureTrafficShift',
          name: 'AzureTrafficShift test',
          identifier: 'AzureTrafficShift_test',
          timeout: '10s',
          spec: {
            traffic: '20%'
          }
        }}
        customStepProps={{
          stageIdentifier: 'qaStage',
          metadataMap: {
            'step-timeout': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.AzureTrafficShift_test.timeout',
                localName: 'step.AzureTrafficShift_test.timeout'
              }
            },
            'step-name': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.AzureTrafficShift_test.name',
                localName: 'step.AzureTrafficShift_test.name'
              }
            },
            'step-traffic': {
              yamlProperties: {
                fqn: 'pipeline.stages.qaStage.execution.steps.AzureTrafficShift_test.spec.traffic',
                localName: 'step.AzureTrafficShift_test.spec.traffic'
              }
            }
          },
          variablesData: {
            name: 'step-name',
            identifier: 'AzureTrafficShift_test',
            type: 'AzureTrafficShift',
            timeout: 'step-timeout',
            spec: {
              traffic: 'step-traffic'
            }
          }
        }}
        type={StepType.AzureTrafficShift}
        stepViewType={StepViewType.InputVariable}
      />
    )
    expect(container).toMatchSnapshot()
  })
})
