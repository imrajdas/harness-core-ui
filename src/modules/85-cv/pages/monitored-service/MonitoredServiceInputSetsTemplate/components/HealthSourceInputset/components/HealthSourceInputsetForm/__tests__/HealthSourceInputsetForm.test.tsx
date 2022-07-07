/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { Formik } from '@harness/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import HealthSourceInputsetForm from '../HealthSourceInputsetForm'

const healthSourcesMock = [
  {
    name: 'AppD default metrics runtime connector',
    identifier: 'AppD_default_metrics_runtime_connector',
    type: 'AppDynamics',
    spec: {
      applicationName: '<+input>',
      tierName: '<+input>',
      metricData: {
        Errors: true,
        Performance: true
      },
      metricDefinitions: [],
      feature: 'Application Monitoring',
      connectorRef: '<+input>',
      metricPacks: [
        {
          identifier: 'Errors'
        },
        {
          identifier: 'Performance'
        }
      ]
    }
  },
  {
    name: 'Appd with custom and runtime connector',
    identifier: 'Appd_with_custom_and_runtime_connector',
    type: 'AppDynamics',
    spec: {
      applicationName: '<+input>',
      tierName: '<+input>',
      metricData: {
        Errors: true,
        Performance: true
      },
      metricDefinitions: [
        {
          identifier: 'appdMetric_101',
          metricName: 'appdMetric 101',
          baseFolder: '',
          metricPath: '',
          completeMetricPath: '<+input>',
          groupName: 'Group 1',
          sli: {
            enabled: true
          },
          analysis: {
            riskProfile: {
              category: 'Performance',
              metricType: 'RESP_TIME',
              thresholdTypes: ['ACT_WHEN_HIGHER']
            },
            liveMonitoring: {
              enabled: false
            },
            deploymentVerification: {
              enabled: true,
              serviceInstanceMetricPath: '<+input>'
            }
          }
        }
      ],
      feature: 'Application Monitoring',
      connectorRef: '<+input>',
      metricPacks: [
        {
          identifier: 'Errors'
        },
        {
          identifier: 'Performance'
        }
      ]
    }
  }
]

describe('Validate HealthSourceInputsetForm', () => {
  test('should render HealthSourceInputsetForm', () => {
    const { container } = render(
      <TestWrapper>
        <Formik
          initialValues={{ sources: { healthSources: healthSourcesMock } }}
          onSubmit={() => undefined}
          formName="wrapperComponent"
        >
          <HealthSourceInputsetForm
            sourceType={'AppDynamics'}
            isReadOnlyInputSet={false}
            healthSources={healthSourcesMock}
          />
        </Formik>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
  test('should render HealthSourceInputsetForm with no data', () => {
    const { container, rerender } = render(
      <TestWrapper>
        <HealthSourceInputsetForm
          sourceType={'AppDynamics'}
          isReadOnlyInputSet={false}
          healthSources={[{ spec: {} }]}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
    rerender(
      <TestWrapper>
        <HealthSourceInputsetForm sourceType={'AppDynamics'} isReadOnlyInputSet={true} healthSources={[]} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
