/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import { Editions, SubscribeViews, TimeType } from '@common/constants/SubscriptionTypes'
import * as useGetUsageAndLimit from '@common/hooks/useGetUsageAndLimit'
import { useRetrieveProductPrices, useCreateFfSubscription } from 'services/cd-ng/index'
import { CostCalculator } from '../CostCalculator'

jest.mock('services/cd-ng')
const useRetrieveProductPricesMock = useRetrieveProductPrices as jest.MockedFunction<any>

const subscriptionData = {
  clientSecret: 'pi_3L9E7qIqk5P9Eha30B1Vpt0Z_secret_qXFya58HXLP0e3rIQEVzK3iyd'
}
const createNewSubscriptionMock = jest.fn(() => Promise.resolve({ data: subscriptionData }))

const useCreateFfSubscriptionMock = useCreateFfSubscription as jest.MockedFunction<any>
useCreateFfSubscriptionMock.mockImplementation(() => {
  return {
    mutate: createNewSubscriptionMock,
    loading: false
  }
})

const useGetUsageAndLimitReturnMock = {
  limitData: {
    limit: {
      ff: {
        totalFeatureFlagUnits: 250,
        totalClientMAUs: 100000
      }
    }
  },
  usageData: {
    usage: {
      ff: {
        activeFeatureFlagUsers: {
          count: 20
        },
        activeClientMAUs: {
          count: 10000
        }
      }
    }
  }
}

jest.spyOn(useGetUsageAndLimit, 'useGetUsageAndLimit').mockReturnValue(useGetUsageAndLimitReturnMock)

const defaultLicenseStoreValues = {
  licenseInformation: {
    CF: {
      edition: Editions.FREE
    }
  }
}

const priceData = {
  data: {
    prices: [
      {
        priceId: 'price_1Kr5q6Iqk5P9Eha3D1tSUsgh',
        currency: 'usd',
        unitAmount: 9000,
        lookupKey: 'FF_ENTERPRISE_DEVELOPERS_MONTHLY',
        productId: 'prod_LYCEWCG8ktzYDz',
        metaData: {},
        active: true
      },
      {
        priceId: 'price_1Kr5q6Iqk5P9Eha3OAjIxtMT',
        currency: 'usd',
        unitAmount: 90000,
        lookupKey: 'FF_ENTERPRISE_DEVELOPERS_YEARLY',
        productId: 'prod_LYCEWCG8ktzYDz',
        metaData: {},
        active: true
      },
      {
        priceId: 'price_1Kr5rwIqk5P9Eha30PlTPbCz',
        currency: 'usd',
        unitAmount: 12000,
        lookupKey: 'FF_ENTERPRISE_MAU_MONTHLY',
        productId: 'prod_LYCGtHkNPO18pl',
        metaData: {},
        active: true
      },
      {
        priceId: 'price_1Kr5rwIqk5P9Eha3hhy0qeVW',
        currency: 'usd',
        unitAmount: 120000,
        lookupKey: 'FF_ENTERPRISE_MAU_YEARLY',
        productId: 'prod_LYCGtHkNPO18pl',
        metaData: {},
        active: true
      },
      {
        priceId: 'price_1Kr5mdIqk5P9Eha3fn1qSEmg',
        currency: 'usd',
        unitAmount: 5000,
        lookupKey: 'FF_TEAM_DEVELOPERS_MONTHLY',
        productId: 'prod_LYCAVe32XXzVlt',
        metaData: {
          type: 'DEVELOPERS'
        },
        active: true
      },
      {
        priceId: 'price_1Kr5mdIqk5P9Eha30wsoBxtZ',
        currency: 'usd',
        unitAmount: 50000,
        lookupKey: 'FF_TEAM_DEVELOPERS_YEARLY',
        productId: 'prod_LYCAVe32XXzVlt',
        metaData: {
          type: 'DEVELOPERS'
        },
        active: true
      },
      {
        priceId: 'price_1Kr5rQIqk5P9Eha3IB74lUSX',
        currency: 'usd',
        unitAmount: 9000,
        lookupKey: 'FF_TEAM_MAU_MONTHLY',
        productId: 'prod_LYCFgTjtkejp0K',
        metaData: {
          type: 'MAUS'
        },
        active: true
      },
      {
        priceId: 'price_1Kr5rQIqk5P9Eha3uzYZEPws',
        currency: 'usd',
        unitAmount: 90000,
        lookupKey: 'FF_TEAM_MAU_YEARLY',
        productId: 'prod_LYCFgTjtkejp0K',
        metaData: {
          type: 'MAUS'
        },
        active: true
      }
    ]
  }
}
useRetrieveProductPricesMock.mockImplementation(() => {
  return {
    refetch: jest.fn(),
    data: priceData,
    loading: false
  }
})

const billingContactInfo = {
  name: 'Jane Doe',
  email: 'jane.doe@test.com',
  billingAddress: 'billing address',
  city: 'dallas',
  state: 'TX',
  country: 'US',
  zipCode: '79809',
  companyName: 'Harness'
}

const paymentMethodInfo = {
  paymentMethodId: '1',
  cardType: 'visa',
  expireDate: 'Jan 30 2023',
  last4digits: '1234',
  nameOnCard: 'Jane Doe'
}

const productPrices = {
  monthly: [
    {
      priceId: 'price_1Kr5rQIqk5P9Eha3IB74lUSX',
      currency: 'usd',
      unitAmount: 9000,
      lookupKey: 'FF_TEAM_MAU_MONTHLY',
      productId: 'prod_LYCFgTjtkejp0K',
      metaData: {
        type: 'MAUS'
      },
      active: true
    }
  ],
  yearly: [
    {
      priceId: 'price_1Kr5rQIqk5P9Eha3uzYZEPws',
      currency: 'usd',
      unitAmount: 90000,
      lookupKey: 'FF_TEAM_MAU_YEARLY',
      productId: 'prod_LYCFgTjtkejp0K',
      metaData: {
        type: 'MAUS'
      },
      active: true
    }
  ]
}

const subscriptionProps = {
  edition: Editions.TEAM,
  premiumSupport: false,
  paymentFreq: TimeType.MONTHLY,
  subscriptionId: '1',
  billingContactInfo,
  paymentMethodInfo,
  productPrices,
  quantities: {
    featureFlag: {
      numberOfDevelopers: 25,
      numberOfMau: 12
    }
  }
}

describe('CostCalculator', () => {
  test('render', () => {
    const { container } = render(
      <TestWrapper defaultLicenseStoreValues={defaultLicenseStoreValues}>
        <CostCalculator
          module="cf"
          setView={jest.fn()}
          setSubscriptionProps={jest.fn()}
          subscriptionProps={subscriptionProps}
          setInvoiceData={jest.fn()}
          className=""
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('not cf module', () => {
    const { container } = render(
      <TestWrapper defaultLicenseStoreValues={defaultLicenseStoreValues}>
        <CostCalculator
          module="cd"
          setView={jest.fn()}
          setSubscriptionProps={jest.fn()}
          subscriptionProps={subscriptionProps}
          setInvoiceData={jest.fn()}
          className=""
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('yearly and enterprise', () => {
    const props = {
      ...subscriptionProps,
      edition: Editions.ENTERPRISE,
      paymentFreq: TimeType.YEARLY
    }
    const { container } = render(
      <TestWrapper defaultLicenseStoreValues={defaultLicenseStoreValues}>
        <CostCalculator
          module="cf"
          setView={jest.fn()}
          setSubscriptionProps={jest.fn()}
          subscriptionProps={props}
          setInvoiceData={jest.fn()}
          className=""
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('footer', async () => {
    const setViewMock = jest.fn()
    const { getByText } = render(
      <TestWrapper defaultLicenseStoreValues={defaultLicenseStoreValues}>
        <CostCalculator
          module="cf"
          setView={setViewMock}
          setSubscriptionProps={jest.fn()}
          subscriptionProps={subscriptionProps}
          setInvoiceData={jest.fn()}
          className=""
        />
      </TestWrapper>
    )
    userEvent.click(getByText('authSettings.costCalculator.next'))
    await waitFor(() => {
      expect(setViewMock).toBeCalledWith(SubscribeViews.BILLINGINFO)
    })
  })
})
