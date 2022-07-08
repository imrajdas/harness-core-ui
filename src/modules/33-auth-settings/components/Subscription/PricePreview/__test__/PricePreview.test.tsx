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
import type { Module } from 'framework/types/ModuleName'
import { Editions, TimeType } from '@common/constants/SubscriptionTypes'
import PricePreview from '../PricePreview'

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

const subscriptionDetails = {
  edition: Editions.TEAM,
  premiumSupport: true,
  paymentFreq: TimeType.YEARLY,
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

describe('PricePreview', () => {
  const setSubscriptionDetailsMock = jest.fn()
  const props = {
    subscriptionDetails,
    setSubscriptionDetails: setSubscriptionDetailsMock,
    module: 'cf' as Module
  }

  test('render', async () => {
    const { container } = render(
      <TestWrapper>
        <PricePreview {...props} />
      </TestWrapper>
    )
    await waitFor(() => {
      expect(container).toMatchSnapshot()
    })
  })

  test('setSubscriptionDetails toggle monthly', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <PricePreview {...props} />
      </TestWrapper>
    )
    userEvent.click(getByTestId('toggle'))
    await waitFor(() => {
      expect(setSubscriptionDetailsMock).toHaveBeenCalledWith({
        ...subscriptionDetails,
        paymentFreq: TimeType.MONTHLY,
        premiumSupport: false
      })
    })
  })

  test('setSubscriptionDetails toggle yearly', async () => {
    const newProps = {
      subscriptionDetails: {
        ...subscriptionDetails,
        paymentFreq: TimeType.MONTHLY
      },
      setSubscriptionDetails: setSubscriptionDetailsMock,
      module: 'cf' as Module
    }
    const { getByTestId } = render(
      <TestWrapper>
        <PricePreview {...newProps} />
      </TestWrapper>
    )
    userEvent.click(getByTestId('toggle'))
    await waitFor(() => {
      expect(setSubscriptionDetailsMock).toHaveBeenCalledWith({
        ...subscriptionDetails,
        paymentFreq: TimeType.YEARLY
      })
    })
  })
})
