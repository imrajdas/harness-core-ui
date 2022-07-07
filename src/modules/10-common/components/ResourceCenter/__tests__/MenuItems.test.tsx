/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { render, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import moment from 'moment'
import { TestWrapper } from '@common/utils/testUtils'
import { communityLicenseStoreValues } from '@common/utils/DefaultAppStoreData'
import MenuItems from '../MenuItems'

beforeEach(() => {
  window.deploymentType = 'SAAS'
})
describe('MenuItems', () => {
  test('Community Plan', () => {
    const { container } = render(
      <TestWrapper defaultLicenseStoreValues={communityLicenseStoreValues}>
        <MenuItems closeResourceCenter={jest.fn} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('Community submit a ticket tooltip', async () => {
    const { getByText } = render(
      <TestWrapper defaultLicenseStoreValues={communityLicenseStoreValues}>
        <MenuItems closeResourceCenter={jest.fn} />
      </TestWrapper>
    )

    fireEvent.focus(getByText('Common.contactsupport'))
    waitFor(() => {
      expect(getByText('common.explorePlans')).toBeInTheDocument()
    })
  })

  test('SAAS Plan', () => {
    const { container } = render(
      <TestWrapper>
        <MenuItems closeResourceCenter={jest.fn} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('has Feedback when SHOW_NG_REFINER_FEEDBACK is true', () => {
    const defaultAppStoreValues = {
      featureFlags: {
        SHOW_NG_REFINER_FEEDBACK: true
      }
    }
    const { container, getByText } = render(
      <TestWrapper defaultAppStoreValues={defaultAppStoreValues}>
        <MenuItems closeResourceCenter={jest.fn} />
      </TestWrapper>
    )

    expect(getByText('common.resourceCenter.feedback.submit')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('should call open file a ticket when click on file a ticket', () => {
    const doMock = jest.fn()
    window.Saber = {
      do: doMock
    }
    const { getByText } = render(
      <TestWrapper>
        <MenuItems closeResourceCenter={jest.fn} />
      </TestWrapper>
    )

    fireEvent.click(getByText('Common.contactsupport'))
    waitFor(() => {
      expect(doMock).toHaveBeenCalledWith('open')
    })
  })

  test('should open a new tab when click on my ticket', () => {
    const doMock = jest.fn()
    moment.now = jest.fn(() => 1482363367071)
    window.open = doMock
    const { getByText } = render(
      <TestWrapper>
        <MenuItems closeResourceCenter={jest.fn} />
      </TestWrapper>
    )

    fireEvent.click(getByText('common.resourceCenter.ticketmenu.tickets'))
    waitFor(() => {
      expect(doMock).toHaveBeenCalledWith(
        '/sso.html?action=login&brand_id=114095000394&locale_id=1&return_to=https%3A%2F%2Fsupport.harness.io%2Fhc%2Fen-us%2Frequests&src=zendesk&timestamp=1482363367071'
      )
    })
  })
})
