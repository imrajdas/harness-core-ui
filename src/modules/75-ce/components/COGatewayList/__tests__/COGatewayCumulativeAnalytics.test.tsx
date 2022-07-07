/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { RulesMode } from '@ce/constants'
import { CE_DATE_FORMAT_INTERNAL, DATE_RANGE_SHORTCUTS } from '@ce/utils/momentUtils'
import COGatewayCumulativeAnalytics from '../COGatewayCumulativeAnalytics'
import SpendVsSavingsChart from '../charts/SpendVsSavingsChart'

const testParams = { accountId: 'accountId', orgIdentifier: 'orgIdentifier', projectIdentifier: 'projectIdentifier' }

const mockedResponse = {
  days: [
    '2021-04-25T00:00:00Z',
    '2021-04-26T00:00:00Z',
    '2021-04-27T00:00:00Z',
    '2021-04-28T00:00:00Z',
    '2021-04-29T00:00:00Z',
    '2021-04-30T00:00:00Z',
    '2021-05-01T00:00:00Z',
    '2021-05-02T00:00:00Z',
    '2021-05-03T00:00:00Z',
    '2021-05-04T00:00:00Z',
    '2021-05-05T00:00:00Z',
    '2021-05-06T00:00:00Z',
    '2021-05-07T00:00:00Z',
    '2021-05-08T00:00:00Z',
    '2021-05-09T00:00:00Z',
    '2021-05-10T00:00:00Z',
    '2021-05-11T00:00:00Z',
    '2021-05-12T00:00:00Z',
    '2021-05-13T00:00:00Z',
    '2021-05-14T00:00:00Z',
    '2021-05-15T00:00:00Z',
    '2021-05-16T00:00:00Z',
    '2021-05-17T00:00:00Z',
    '2021-05-18T00:00:00Z',
    '2021-05-19T00:00:00Z',
    '2021-05-20T00:00:00Z',
    '2021-05-21T00:00:00Z',
    '2021-05-22T00:00:00Z',
    '2021-05-23T00:00:00Z',
    '2021-05-24T00:00:00Z',
    '2021-05-25T00:00:00Z',
    '2021-05-26T00:00:00Z'
  ],
  potential_cost: [
    0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952,
    0.5952, 0.5952, 0.5952, 0.5952, 0.7352672312729965, 0.8928, 0.8928, 0.8928, 0.8928, 0.8928, 0.8928, 0.8928, 0.8928,
    0.8928, 0.8928, 0.8928, 0.234, 0
  ],
  actual_cost: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.004736388347555556, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0.001234, 0
  ],
  savings: [
    0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952,
    0.5952, 0.5952, 0.5952, 0.5952, 0.730530842925441, 0.8928, 0.8928, 0.8928, 0.8928, 0.8928, 0.8928, 0.8928, 0.8928,
    0.8928, 0.8928, 0.8928, 0.7654, 0
  ],
  total_potential: 21.269667231273,
  total_cost: 0.004736388347555556,
  total_savings: 21.264930842925445,
  savings_percent: 99.97773172332197
}

jest.mock('highcharts-react-official', () => () => <div />)

jest.mock('services/lw', () => ({
  useCumulativeServiceSavingsV2: jest
    .fn()
    .mockImplementation(() => ({ mutate: () => Promise.resolve({ response: mockedResponse }), loading: false }))
}))

describe('Cumulative Analytics tests', () => {
  test('render component', async () => {
    const { container } = render(
      <TestWrapper pathParams={testParams}>
        <COGatewayCumulativeAnalytics mode={RulesMode.ACTIVE} />
      </TestWrapper>
    )
    await waitFor(() => Promise.resolve())
    expect(container).toMatchSnapshot()
  })

  test('render component in Dry run mode', async () => {
    const { container } = render(
      <TestWrapper pathParams={testParams}>
        <COGatewayCumulativeAnalytics mode={RulesMode.DRY} />
      </TestWrapper>
    )
    await waitFor(() => Promise.resolve())
    expect(container).toMatchSnapshot()
  })

  describe('spend vs savings chart tests', () => {
    const defaultRange = {
      to: DATE_RANGE_SHORTCUTS.LAST_30_DAYS[1].format(CE_DATE_FORMAT_INTERNAL),
      from: DATE_RANGE_SHORTCUTS.LAST_30_DAYS[0].format(CE_DATE_FORMAT_INTERNAL)
    }
    test('show loader while loading data', () => {
      const { container } = render(<SpendVsSavingsChart loading={true} timeRange={defaultRange} />)
      expect(container.querySelector('span[data-icon="spinner"]')).toBeDefined()
    })

    test('show loader while loading data', () => {
      const { getByText } = render(
        <TestWrapper>
          <SpendVsSavingsChart loading={false} timeRange={defaultRange} searchTerm="test" />
        </TestWrapper>
      )
      expect(getByText('ce.co.noDataForSearchAndDateRange')).toBeDefined()
    })

    test('render area chart for range greater than 30 days', async () => {
      const { container } = render(
        <TestWrapper>
          <SpendVsSavingsChart
            loading={false}
            timeRange={{
              to: mockedResponse.days[mockedResponse.days.length - 1],
              from: mockedResponse.days[0]
            }}
            data={mockedResponse}
          />
        </TestWrapper>
      )
      await waitFor(() => Promise.resolve())
      expect(container).toMatchSnapshot()
    })
  })
})
