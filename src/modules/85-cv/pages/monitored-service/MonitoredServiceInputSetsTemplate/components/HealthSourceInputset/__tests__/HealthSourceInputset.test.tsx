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
import * as templateService from 'services/template-ng'
import { templateRefData, useGetTemplateData } from './HealthSourceInputset.test.mock'
import HealthSourceInputset from '../HealthSourceInputset'

const mockInitValue = {
  identifier: '<+monitoredService.serviceRef>_<+monitoredService.environmentRef>',
  type: 'Application',
  serviceRef: '',
  environmentRef: '',
  sources: {
    healthSources: [
      {
        identifier: 'AppD_default_metrics_runtime_connector',
        type: 'AppDynamics',
        spec: { applicationName: '', tierName: '', connectorRef: '' }
      },
      {
        identifier: 'Appd_with_custom_and_runtime_connector',
        type: 'AppDynamics',
        spec: {
          applicationName: '',
          tierName: '',
          metricDefinitions: [
            {
              identifier: 'appdMetric_101',
              completeMetricPath: '',
              analysis: { deploymentVerification: { serviceInstanceMetricPath: '' } }
            }
          ],
          connectorRef: ''
        }
      }
    ]
  }
}

describe('Validate HealthSourceInputset', () => {
  test('should render HealthSourceInputset', () => {
    const msTemplateRefetch = jest.fn().mockResolvedValue({})
    jest.spyOn(templateService, 'useGetTemplate').mockImplementation(
      () =>
        ({
          data: useGetTemplateData,
          refetch: msTemplateRefetch,
          error: null,
          loading: false,
          cancel: jest.fn()
        } as any)
    )
    const { container, rerender } = render(
      <TestWrapper>
        <Formik formName="" initialValues={mockInitValue} onSubmit={() => undefined}>
          <HealthSourceInputset
            sourceType={'AppDynamics'}
            templateRefData={templateRefData}
            isReadOnlyInputSet={true}
          />
        </Formik>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
    rerender(
      <TestWrapper>
        <Formik formName="" initialValues={mockInitValue} onSubmit={() => undefined}>
          <HealthSourceInputset
            sourceType={'AppDynamics'}
            templateRefData={templateRefData}
            isReadOnlyInputSet={false}
          />
        </Formik>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render HealthSourceInputset in loading state', () => {
    jest.spyOn(templateService, 'useGetTemplate').mockImplementation(
      () =>
        ({
          data: {},
          refetch: jest.fn(),
          error: null,
          loading: true,
          cancel: jest.fn()
        } as any)
    )
    const { container } = render(
      <TestWrapper>
        <HealthSourceInputset sourceType={''} templateRefData={templateRefData} isReadOnlyInputSet={true} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render HealthSourceInputset in error state', () => {
    jest.spyOn(templateService, 'useGetTemplate').mockImplementation(
      () =>
        ({
          data: {},
          refetch: jest.fn(),
          error: {
            data: {
              message: 'api call failed'
            }
          },
          loading: false,
          cancel: jest.fn()
        } as any)
    )
    const { container, getByText } = render(
      <TestWrapper>
        <HealthSourceInputset sourceType={'AppDynamics'} templateRefData={templateRefData} isReadOnlyInputSet={true} />
      </TestWrapper>
    )
    expect(getByText('api call failed')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('should render HealthSourceInputset in no data state', () => {
    jest.spyOn(templateService, 'useGetTemplate').mockImplementation(
      () =>
        ({
          data: {},
          refetch: jest.fn().mockResolvedValue({}),
          error: null,
          loading: false,
          cancel: jest.fn()
        } as any)
    )
    const { container } = render(
      <TestWrapper>
        <HealthSourceInputset sourceType={'AppDynamics'} templateRefData={templateRefData} isReadOnlyInputSet={true} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
