/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { cloneDeep } from 'lodash-es'
import { act } from 'react-dom/test-utils'
import { render, fireEvent } from '@testing-library/react'
import { Provider } from 'urql'
import type { DocumentNode } from 'graphql'
import { fromValue } from 'wonka'
import { ModuleName } from 'framework/types/ModuleName'
import { TestWrapper } from '@common/utils/testUtils'
import { FetchPlansDocument } from 'services/common/services'
import {
  useGetLicensesAndSummary,
  useStartTrialLicense,
  useStartFreeLicense,
  useGetEditionActions,
  useExtendTrialLicense
} from 'services/cd-ng'
import { communityLicenseStoreValues } from '@common/utils/DefaultAppStoreData'
import SubscriptionPlans from '../plans/SubscriptionPlans'
import { plansData } from './plansData'

global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    json: () => Promise.resolve({ text: '' })
  })
)
const startTrialMock = jest.fn()
const startFreeMock = jest.fn()
const extendTrialMock = jest.fn()
jest.mock('services/cd-ng')
const useGetLicensesAndSummaryMock = useGetLicensesAndSummary as jest.MockedFunction<any>
const useStartTrialLicenseMock = useStartTrialLicense as jest.MockedFunction<any>
useStartTrialLicenseMock.mockImplementation(() => ({
  mutate: startTrialMock,
  loading: false
}))

const useStartFreeLicenseMock = useStartFreeLicense as jest.MockedFunction<any>
useStartFreeLicenseMock.mockImplementation(() => ({
  mutate: startFreeMock,
  loading: false
}))

const useExtendTrialMock = useExtendTrialLicense as jest.MockedFunction<any>
useExtendTrialMock.mockImplementation(() => ({
  mutate: extendTrialMock,
  loading: false
}))

const useGetEditionActionsMock = useGetEditionActions as jest.MockedFunction<any>
useGetEditionActionsMock.mockImplementation(() => ({
  data: {
    data: {
      FREE: [{ action: 'START_FREE' }],
      TEAM: [{ action: 'START_TRIAL' }],
      ENTERPRISE: [{ action: 'START_TRIAL' }]
    }
  },
  loading: false
}))

beforeEach(() => {
  window.deploymentType = 'SAAS'
})

describe('Subscription Plans', () => {
  test('should render the plans for CI', async () => {
    const data = cloneDeep(plansData)
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchPlansDocument) {
          return fromValue(data)
        }
        return fromValue({})
      }
    }
    await act(async () => {
      useGetLicensesAndSummaryMock.mockImplementation(() => {
        return {
          data: {
            data: {
              edition: 'ENTERPRISE',
              licenseType: 'TRIAL'
            },
            status: 'SUCCESS'
          },
          refetch: jest.fn(),
          loading: false
        }
      })
      const { container, getByText } = render(
        <TestWrapper>
          <Provider value={responseState as any}>
            <SubscriptionPlans module={ModuleName.CI} />
          </Provider>
        </TestWrapper>
      )
      expect(getByText('common.plans.currentPlan (common.plans.freeTrial)')).toBeInTheDocument()
      expect(container).toMatchSnapshot()
    })
  })

  test('should render the plans for CCM', async () => {
    const data = cloneDeep(plansData)
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchPlansDocument) {
          return fromValue(data)
        }
        return fromValue({})
      }
    }
    await act(async () => {
      useGetLicensesAndSummaryMock.mockImplementation(() => {
        return {
          data: {
            data: {},
            status: 'SUCCESS'
          },
          refetch: jest.fn(),
          loading: false
        }
      })
      const { container } = render(
        <TestWrapper>
          <Provider value={responseState as any}>
            <SubscriptionPlans module={ModuleName.CE} />
          </Provider>
        </TestWrapper>
      )
      expect(container).toMatchSnapshot()
    })
  })

  test('should render the plans for CD', async () => {
    const data = cloneDeep(plansData)
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchPlansDocument) {
          return fromValue(data)
        }
        return fromValue({})
      }
    }
    await act(async () => {
      useGetLicensesAndSummaryMock.mockImplementation(() => {
        return {
          data: {
            data: {},
            status: 'SUCCESS'
          },
          refetch: jest.fn(),
          loading: false
        }
      })
      const { container } = render(
        <TestWrapper>
          <Provider value={responseState as any}>
            <SubscriptionPlans module={ModuleName.CD} />
          </Provider>
        </TestWrapper>
      )
      expect(container).toMatchSnapshot()
    })
  })

  test('should render the plans for CD Community', () => {
    const data = cloneDeep(plansData)
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchPlansDocument) {
          return fromValue(data)
        }
        return fromValue({})
      }
    }
    const { container, getByText } = render(
      <TestWrapper defaultLicenseStoreValues={communityLicenseStoreValues}>
        <Provider value={responseState as any}>
          <SubscriptionPlans module={ModuleName.CD} />
        </Provider>
      </TestWrapper>
    )
    expect(getByText('authSettings.cdCommunityPlan.communityTitle')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('should render the plans for FF', async () => {
    const data = cloneDeep(plansData)
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchPlansDocument) {
          return fromValue(data)
        }
        return fromValue({})
      }
    }
    await act(async () => {
      useGetLicensesAndSummaryMock.mockImplementation(() => {
        return {
          data: {
            data: {},
            status: 'SUCCESS'
          },
          refetch: jest.fn(),
          loading: false
        }
      })
      const { container } = render(
        <TestWrapper>
          <Provider value={responseState as any}>
            <SubscriptionPlans module={ModuleName.CF} />
          </Provider>
        </TestWrapper>
      )
      expect(container).toMatchSnapshot()
    })
  })

  test('should expand feature comparison when click on arrow', async () => {
    const data = cloneDeep(plansData)
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchPlansDocument) {
          return fromValue(data)
        }
        return fromValue({})
      }
    }
    await act(async () => {
      useGetLicensesAndSummaryMock.mockImplementation(() => {
        return {
          data: {
            data: {},
            status: 'SUCCESS'
          },
          refetch: jest.fn(),
          loading: false
        }
      })
      const { container, getByText } = render(
        <TestWrapper>
          <Provider value={responseState as any}>
            <SubscriptionPlans module={ModuleName.CI} />
          </Provider>
        </TestWrapper>
      )
      fireEvent.click(getByText('common.plans.featureComparison'))
      expect(container).toMatchSnapshot()
    })
  })

  test('should be able to call start trial when no license: free edition', async () => {
    const data = cloneDeep(plansData)
    const responseState = {
      executeQuery: ({ query }: { query: DocumentNode }) => {
        if (query === FetchPlansDocument) {
          return fromValue(data)
        }
        return fromValue({})
      }
    }
    await act(async () => {
      const { getAllByText } = render(
        <TestWrapper>
          <Provider value={responseState as any}>
            <SubscriptionPlans module={ModuleName.CI} />
          </Provider>
        </TestWrapper>
      )
      const btns = getAllByText('common.startFree')
      expect(btns).toHaveLength(1)
      fireEvent.click(btns[0])
      expect(startFreeMock).toBeCalledWith()
    })
  })
})
