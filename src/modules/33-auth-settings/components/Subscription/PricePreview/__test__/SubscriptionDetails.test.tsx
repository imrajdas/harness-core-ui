/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { Editions, TimeType } from '@common/constants/SubscriptionTypes'
import SubscriptionDetails from '../SubscriptionDetails'

describe('SubscriptionDetails', () => {
  const props = {
    taxAmount: 100,
    subscriptionDetails: {
      edition: Editions.TEAM,
      premiumSupport: true,
      paymentFreq: TimeType.MONTHLY,
      subscriptionId: '1',
      billingContactInfo: {
        name: 'Jane Doe',
        email: 'jane.doe@harness.io',
        billingAddress: 'billing address',
        city: 'dallas',
        state: 'TX',
        country: 'us',
        zipCode: '12345',
        companyName: 'Harness'
      },
      paymentMethodInfo: {
        paymentMethodId: '1',
        cardType: 'visa',
        expireDate: 'Jan 01, 2023',
        last4digits: '1234',
        nameOnCard: 'Jane Doe'
      },
      productPrices: {
        monthly: [],
        yearly: []
      }
    },
    products: [],
    premiumSupportAmount: 20
  }

  test('render', async () => {
    const { container } = render(
      <TestWrapper>
        <SubscriptionDetails {...props} />
      </TestWrapper>
    )
    await waitFor(() => {
      expect(container).toMatchSnapshot()
    })
  })
})
