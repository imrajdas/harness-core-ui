/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { findAllByRole, render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import HealthSourceInputsetTable from '../HealthSourceInputsetTable'

describe('Validate HealthSourceInputsetTable', () => {
  test('should render HealthSourceInputsetTable', async () => {
    const { container } = render(
      <TestWrapper>
        <HealthSourceInputsetTable
          healthSources={[
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
          ]}
        />
      </TestWrapper>
    )
    const tRows = await findAllByRole(container, 'row')
    // This is because we take header row too into consideration.
    expect(tRows.length).toBe(3)
    expect(container).toMatchSnapshot()
  })

  test('should render HealthSourceInputsetTable with Empty healthSources', async () => {
    const { container, rerender } = render(
      <TestWrapper>
        <HealthSourceInputsetTable healthSources={[]} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
    rerender(
      <TestWrapper>
        <HealthSourceInputsetTable healthSources={undefined} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
