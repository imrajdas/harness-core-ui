/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import BillingContact from '../BillingContact'

describe('BillingContact', () => {
  const billingInfo = {
    name: 'Jane Doe',
    email: 'harness@harness.io',
    country: 'us',
    zipCode: '12345',
    billingAddress: 'billing address 1',
    city: 'dallas',
    state: 'texas',
    companyName: 'Harness'
  }

  const setBillingInfoMock = jest.fn()

  test('render', async () => {
    const { container } = render(
      <TestWrapper>
        <BillingContact setBillingInfo={jest.fn()} billingInfo={billingInfo} />
      </TestWrapper>
    )
    await waitFor(() => {
      expect(container).toMatchSnapshot()
    })
  })

  test('set companyName', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <BillingContact setBillingInfo={setBillingInfoMock} billingInfo={billingInfo} />
      </TestWrapper>
    )
    userEvent.clear(getByTestId('companyName'))
    userEvent.type(getByTestId('companyName'), 'another company')
    await waitFor(() => {
      expect(setBillingInfoMock).toHaveBeenCalledWith({
        ...billingInfo,
        companyName: 'another company'
      })
    })
  })

  test('set email', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <BillingContact setBillingInfo={setBillingInfoMock} billingInfo={billingInfo} />
      </TestWrapper>
    )
    userEvent.clear(getByTestId('email'))
    userEvent.type(getByTestId('email'), 'new@email.com')
    await waitFor(() => {
      expect(setBillingInfoMock).toHaveBeenCalledWith({
        ...billingInfo,
        email: 'new@email.com'
      })
    })
  })

  test('set zipCode', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <BillingContact setBillingInfo={setBillingInfoMock} billingInfo={billingInfo} />
      </TestWrapper>
    )
    userEvent.clear(getByTestId('zipCode'))
    userEvent.type(getByTestId('zipCode'), '54321')
    await waitFor(() => {
      expect(setBillingInfoMock).toHaveBeenCalledWith({
        ...billingInfo,
        zipCode: '54321'
      })
    })
  })

  test('set billingAddress', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <BillingContact setBillingInfo={setBillingInfoMock} billingInfo={billingInfo} />
      </TestWrapper>
    )
    userEvent.clear(getByTestId('billingAddress'))
    userEvent.type(getByTestId('billingAddress'), 'new billing address')
    await waitFor(() => {
      expect(setBillingInfoMock).toHaveBeenCalledWith({
        ...billingInfo,
        billingAddress: 'new billing address'
      })
    })
  })

  test('set city', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <BillingContact setBillingInfo={setBillingInfoMock} billingInfo={billingInfo} />
      </TestWrapper>
    )
    userEvent.clear(getByTestId('city'))
    userEvent.type(getByTestId('city'), 'austin')
    await waitFor(() => {
      expect(setBillingInfoMock).toHaveBeenCalledWith({
        ...billingInfo,
        city: 'austin'
      })
    })
  })

  test('set state', async () => {
    const { getByTestId, container } = render(
      <TestWrapper>
        <BillingContact setBillingInfo={setBillingInfoMock} billingInfo={billingInfo} />
      </TestWrapper>
    )

    const dropdown = getByTestId('state')
    fireEvent.click(dropdown)

    const listItem = container.getElementsByClassName('DropDown--menuItem')[0]
    fireEvent.click(listItem)
    await waitFor(() => {
      expect(setBillingInfoMock).toHaveBeenCalledWith({
        ...billingInfo,
        state: 'Texas'
      })
    })
  })

  test('set countryOrRegion', async () => {
    const { getByTestId, container } = render(
      <TestWrapper>
        <BillingContact setBillingInfo={setBillingInfoMock} billingInfo={billingInfo} />
      </TestWrapper>
    )

    const dropdown = getByTestId('countryOrRegion')
    fireEvent.click(dropdown)

    const listItem = container.getElementsByClassName('DropDown--menuItem')[0]
    fireEvent.click(listItem)
    await waitFor(() => {
      expect(setBillingInfoMock).toHaveBeenCalledWith({
        ...billingInfo,
        country: 'us'
      })
    })
  })
})
