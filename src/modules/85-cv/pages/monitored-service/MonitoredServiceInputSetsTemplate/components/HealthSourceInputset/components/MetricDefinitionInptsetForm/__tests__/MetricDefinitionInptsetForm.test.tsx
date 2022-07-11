/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { Formik, RUNTIME_INPUT_VALUE } from '@harness/uicore'
import * as formik from 'formik'
import { TestWrapper } from '@common/utils/testUtils'
import MetricDefinitionInptsetForm from '../MetricDefinitionInptsetForm'

const metricDefinitions = [
  {
    identifier: 'appdMetric_101',
    metricName: 'appdMetric 101',
    baseFolder: '',
    metricPath: '',
    completeMetricPath: '<+input>',
    groupName: 'Group 1',
    sli: { enabled: true },
    analysis: {
      riskProfile: {
        category: 'Performance',
        metricType: 'RESP_TIME',
        thresholdTypes: ['ACT_WHEN_HIGHER']
      },
      liveMonitoring: { enabled: false },
      deploymentVerification: { enabled: true, serviceInstanceMetricPath: RUNTIME_INPUT_VALUE }
    }
  },
  {
    identifier: 'appdMetric_102',
    metricName: 'appdMetric 102',
    baseFolder: '',
    metricPath: '',
    completeMetricPath: '<+input>',
    groupName: 'Group 2',
    sli: { enabled: true },
    analysis: {
      riskProfile: {
        category: 'Performance',
        metricType: 'RESP_TIME',
        thresholdTypes: ['ACT_WHEN_HIGHER']
      },
      liveMonitoring: { enabled: false },
      deploymentVerification: { enabled: true, serviceInstanceMetricPath: RUNTIME_INPUT_VALUE }
    }
  }
]

describe('Validate MetricDefinitionInptsetForm', () => {
  const useFormikContextMock = jest.spyOn(formik, 'useFormikContext')

  beforeEach(() => {
    useFormikContextMock.mockReturnValue({
      setFieldValue: jest.fn()
    } as unknown as any)
  })
  test('should render MetricDefinitionInptsetForm with no metricDefinitions', () => {
    const { container } = render(
      <TestWrapper>
        <MetricDefinitionInptsetForm metricDefinitions={[]} path={'spec'} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render MetricDefinitionInptsetForm with metricDefinitions but no runtimeInputs', () => {
    const { container } = render(
      <TestWrapper>
        <MetricDefinitionInptsetForm metricDefinitions={[{}]} path={'spec'} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render MetricDefinitionInptsetForm with metricDefinitions', () => {
    const { container } = render(
      <TestWrapper>
        <Formik
          initialValues={{
            sources: {
              healthSources: [
                {
                  spec: { metricDefinitions }
                }
              ]
            }
          }}
          onSubmit={() => undefined}
          formName="wrapperComponent"
        >
          <MetricDefinitionInptsetForm metricDefinitions={metricDefinitions} path={'sources.healthSources.0.spec'} />
        </Formik>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
