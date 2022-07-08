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
import { SubscribeViews } from '@common/constants/SubscriptionTypes'
import BillingContactCard from '../BillingContactCard'

describe('BillingContactCard', () => {
  const setViewMock = jest.fn()
  const props = {
    billingContactInfo: {
      name: 'Jane Doe',
      email: 'jane.doe@harness.io',
      billingAddress: 'billing address',
      city: 'dallas',
      state: 'tx',
      country: 'us',
      zipCode: '12345',
      companyName: 'Harness'
    },
    setView: setViewMock
  }

  test('render', async () => {
    const { container } = render(
      <TestWrapper>
        <BillingContactCard {...props} />
      </TestWrapper>
    )
    await waitFor(() => {
      expect(container).toMatchSnapshot()
    })
  })

  test('setView', async () => {
    const { getByText } = render(
      <TestWrapper>
        <BillingContactCard {...props} />
      </TestWrapper>
    )
    userEvent.click(getByText('edit'))
    await waitFor(() => {
      expect(setViewMock).toHaveBeenCalledWith(SubscribeViews.BILLINGINFO)
    })
  })
})
