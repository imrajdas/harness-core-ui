/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import * as lwServices from 'services/lw'
import type { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import type { CheckFeatureReturn } from 'framework/featureStore/featureStoreUtil'
import { TestWrapper } from '@common/utils/testUtils'
import COGatewayList from '../COGatewayList'
import {
  activeUserMock,
  mockedConnector,
  mockedEcsClusterServiceData,
  mockedEcsServiceData,
  mockedInstanceServiceData,
  mockedK8sServiceData,
  mockedRdsServiceData
} from './data'

const testpath = '/account/:accountId/ce/orgs/:orgIdentifier/projects/:projectIdentifier/autostopping-rules/create'
const testparams = { accountId: 'accountId', orgIdentifier: 'orgIdentifier', projectIdentifier: 'projectIdentifier' }
const checkFeatureReturnMock = {
  enabled: true
}
const checkFeatureDisabledReturnMock = { featureEnabled: true, disabledFeatureName: null }

jest.mock('highcharts-react-official', () => () => <></>)

// jest.mock()

jest.mock('@common/hooks/useFeatures', () => {
  return {
    useFeature: () => {
      return checkFeatureReturnMock
    },
    useGetFirstDisabledFeature: () => {
      return checkFeatureDisabledReturnMock
    },
    useFeatures: () => {
      return { features: new Map<FeatureIdentifier, CheckFeatureReturn>() }
    }
  }
})

const listData = [
  mockedK8sServiceData,
  mockedInstanceServiceData,
  { ...mockedInstanceServiceData, fulfilment: 'spot', disabled: true },
  mockedEcsServiceData,
  mockedRdsServiceData
]

const mockedCumulativeSavingsData = {
  actual_cost: [],
  days: [],
  potential_cost: [],
  savings: [],
  savings_percent: 0,
  total_active_services: 1,
  total_cost: 0,
  total_potential: 0,
  total_savings: 0
}

const mockedSavingsData = {
  actual_savings: 10,
  savings_percentage: 50,
  usage_date: Date.now(),
  potential_cost: 120,
  actual_hours: 48,
  idle_hours: 30
}

const mockedSavingsOfServiceData = { response: mockedSavingsData }
const mockedSavingsOfServiceData2 = {
  response: {
    actual_savings: 10,
    savings_percentage: 32,
    usage_date: Date.now(),
    potential_cost: 120,
    actual_hours: 48,
    idle_hours: 30
  }
}

const mockedConnectorData = {
  data: {
    connector: {
      name: 'harness-qa',
      identifier: 'harnessqa',
      description: null,
      orgIdentifier: null,
      projectIdentifier: null,
      tags: {},
      type: 'CEAws'
    }
  }
}

const mockedFetchRuleResponse = {
  response: {
    records: listData,
    total: listData.length,
    pages: 1
  },
  loading: false
}

const mockedSelectedFilter = {
  name: 'CE AWS',
  identifier: 'CE_AWS',
  data: {
    cloud_account_id: ['mock-kubernetes-id'],
    created_by: ['123'],
    kind: ['k8s'],
    namespace: ['test_namespace']
  }
}

const mockedFiltersResponse = {
  response: [mockedSelectedFilter]
}

jest.mock('@common/hooks/useFeatureFlag', () => ({
  useFeatureFlag: jest.fn(() => true),
  useFeatureFlags: jest.fn(() => ({}))
}))

jest.mock('services/lw', () => ({
  useAllServiceResources: jest.fn().mockImplementation(() => ({
    data: null,
    loading: false,
    error: null
  })),
  useFetchRules: jest.fn().mockImplementation(() => ({
    mutate: () => Promise.resolve(mockedFetchRuleResponse)
  })),
  useHealthOfService: jest.fn().mockImplementation(() => ({
    data: null,
    loading: false
  })),
  useRequestsOfService: jest.fn().mockImplementation(() => ({
    data: null,
    loading: false
  })),
  useSavingsOfService: jest
    .fn()
    .mockImplementationOnce(() => ({
      data: mockedSavingsOfServiceData2,
      loading: false
    }))
    .mockImplementation(() => ({
      data: mockedSavingsOfServiceData,
      loading: false
    })),
  useGetServiceDiagnostics: jest.fn().mockImplementation(() => ({
    data: null
  })),
  useCumulativeServiceSavingsV2: jest.fn().mockImplementation(() => ({
    mutate: () => Promise.resolve({ response: mockedCumulativeSavingsData }),
    loading: false
  })),
  useToggleAutostoppingRule: jest.fn().mockImplementation(() => ({
    mutate: jest.fn()
  })),
  useDeleteService: jest.fn().mockImplementation(() => ({
    mutate: jest.fn()
  })),
  useGatewaySessionReport: jest.fn().mockImplementation(() => ({ mutate: Promise.resolve(() => jest.fn()) })),
  useListStaticSchedules: jest.fn().mockImplementation(() => ({
    data: {},
    loading: false,
    refetch: jest.fn(() => Promise.resolve({ response: {} }))
  })),
  useCreateStaticSchedules: jest.fn().mockImplementation(() => ({
    mutate: jest.fn()
  })),
  useDeleteStaticSchedule: jest.fn().mockImplementation(() => ({
    mutate: jest.fn()
  })),
  useDescribeServiceInContainerServiceCluster: jest.fn().mockImplementation(() => ({
    data: { response: mockedEcsClusterServiceData },
    loading: false
  })),
  useRouteDetails: jest.fn().mockImplementation(() => ({
    data: null,
    loading: false,
    refetch: jest.fn()
  })),
  useGetAllRuleFilters: jest.fn().mockImplementation(() => ({
    data: mockedFiltersResponse,
    refetch: jest.fn()
  }))
}))

jest.mock('services/cd-ng', () => ({
  useGetConnector: jest.fn().mockImplementation(() => ({
    data: mockedConnectorData,
    loading: false
  })),
  useGetConnectorListV2: jest.fn().mockImplementation(() => ({
    mutate: jest.fn(() => Promise.resolve({ data: { content: [mockedConnector] } })),
    loading: false
  })),
  useGetAggregatedUsers: jest.fn(() => ({
    cancel: jest.fn(),
    loading: false,
    mutate: jest.fn().mockImplementation(() => activeUserMock)
  }))
}))

afterEach(() => {
  jest.clearAllMocks()
})

describe('Test COGatewayList', () => {
  test('renders without crashing', async () => {
    const { getByText } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <COGatewayList></COGatewayList>
      </TestWrapper>
    )
    await waitFor(() => Promise.resolve())
    const createAsBtn = getByText('ce.co.newAutoStoppingRule')
    expect('createAsBtn').toBeDefined()
    act(() => {
      fireEvent.click(createAsBtn)
    })
  })

  test('clicking on a row should open info drawer', async () => {
    const data = { response: [] }
    jest.spyOn(lwServices, 'useSavingsOfService').mockImplementation(
      () =>
        ({
          loading: false,
          data
        } as any)
    )
    const { container } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <COGatewayList></COGatewayList>
      </TestWrapper>
    )
    await waitFor(() => Promise.resolve())
    const row = container.querySelector('.TableV2--row.TableV2--clickable')
    // const delete =
    expect(row).toBeDefined()
    act(() => {
      fireEvent.click(row!)
    })
    expect(container).toMatchSnapshot()
  })

  test('clicking on refresh button refetch all rules', async () => {
    const { container, getByTestId } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <COGatewayList></COGatewayList>
      </TestWrapper>
    )
    await waitFor(() => Promise.resolve())
    const refreshIcon = getByTestId('refreshIconContainer')
    expect(refreshIcon).toBeDefined()
    act(() => {
      fireEvent.click(refreshIcon!)
    })
    expect(container).toMatchSnapshot()
  })

  // eslint-disable-next-line jest/no-disabled-tests
  test.skip('should be able to disable a rule', async () => {
    const { container } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <COGatewayList></COGatewayList>
      </TestWrapper>
    )
    await waitFor(() => Promise.resolve())
    expect(container).toMatchSnapshot()

    const menuBtn = container.querySelector('span[data-icon="Options"]')
    expect(menuBtn).toBeDefined()
    await waitFor(() => {
      fireEvent.click(menuBtn!)
    })
    const disableBtn = document.querySelector('.bp3-portal ul.bp3-menu li')
    expect(disableBtn).toBeDefined()
    act(() => {
      fireEvent.click(disableBtn!)
    })
    expect(document.querySelector('.bp3-dialog-container')).toBeInTheDocument()

    const confirmDisableBtn = document.querySelector('.bp3-dialog button[type="button"]')
    expect(confirmDisableBtn).toBeDefined()
    act(() => {
      fireEvent.click(confirmDisableBtn!)
    })
  })

  test('able to search through the list', async () => {
    const { container } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <COGatewayList></COGatewayList>
      </TestWrapper>
    )
    await waitFor(() => Promise.resolve())
    const searchInput = container.querySelector('input[type="search"]') as HTMLInputElement
    expect(searchInput).toBeDefined()
    await act(async () => {
      await waitFor(() => {
        fireEvent.change(searchInput, { target: { value: 'test' } })
      })
    })

    expect(searchInput.value).toBe('test')
    expect(container).toMatchSnapshot()
  })

  test('error from services API should show error', async () => {
    const servicesSpy = jest.spyOn(lwServices, 'useFetchRules')
    servicesSpy.mockImplementation(
      () =>
        ({
          mutate: () => Promise.reject({ data: { errors: ['Fetch Service error'] } }),
          loading: false
        } as any)
    )
    const { container } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <COGatewayList></COGatewayList>
      </TestWrapper>
    )
    await waitFor(() => Promise.resolve())
    act(() => {
      expect(container).toMatchSnapshot()
    })
    servicesSpy.mockClear()
  })

  describe('render based on the content', () => {
    test('render page loader on initial loading', async () => {
      const servicesSpy = jest.spyOn(lwServices, 'useFetchRules')
      servicesSpy.mockImplementation(
        () =>
          ({
            mutate: () => Promise.resolve({ response: { records: null } }),
            loading: false
          } as any)
      )
      const { container } = render(
        <TestWrapper>
          <COGatewayList />
        </TestWrapper>
      )
      await waitFor(() => Promise.resolve())
      expect(container).toMatchSnapshot()
      servicesSpy.mockClear()
    })

    // eslint-disable-next-line jest/no-disabled-tests
    test.skip('render empty page component for no rules created', async () => {
      const servicesSpy = jest.spyOn(lwServices, 'useFetchRules')
      servicesSpy.mockImplementation(
        () =>
          ({
            mutate: () =>
              Promise.resolve({
                response: {
                  records: null
                }
              }),
            loading: false
          } as any)
      )
      const { container, getByText } = render(
        <TestWrapper>
          <COGatewayList />
        </TestWrapper>
      )
      await waitFor(() => Promise.resolve())
      expect(container).toMatchSnapshot()

      const createAsBtn = getByText('ce.co.newAutoStoppingRule')
      expect('createAsBtn').toBeDefined()
      act(() => {
        fireEvent.click(createAsBtn)
      })
    })

    test('render table loader component when data is loading', async () => {
      jest.spyOn(lwServices, 'useFetchRules').mockImplementation(
        () =>
          ({
            mutate: () => Promise.resolve(),
            loading: true
          } as any)
      )
      const { container } = render(
        <TestWrapper>
          <COGatewayList />
        </TestWrapper>
      )
      await waitFor(() => Promise.resolve())
      expect(container).toMatchSnapshot()
    })

    test('should show error message on receiving error from services API', async () => {
      jest.spyOn(lwServices, 'useFetchRules').mockImplementation(
        () =>
          ({
            mutate: () => Promise.reject({ message: 'Some random error' }),
            loading: false
          } as any)
      )
      const { container } = render(
        <TestWrapper>
          <COGatewayList />
        </TestWrapper>
      )
      await waitFor(() => Promise.resolve())
      expect(container).toMatchSnapshot()
    })
  })
})
