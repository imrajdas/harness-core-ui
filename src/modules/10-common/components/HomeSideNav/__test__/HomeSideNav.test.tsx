/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { communityLicenseStoreValues } from '@common/utils/DefaultAppStoreData'
import HomeSideNav from '../HomeSideNav'

beforeEach(() => {
  window.deploymentType = 'SAAS'
})
describe('HomeSidenav', () => {
  test('render', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/home/get-started" pathParams={{ accountId: 'dummy' }}>
        <HomeSideNav />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('Disable launch button for community edition', () => {
    const { container } = render(
      <TestWrapper defaultLicenseStoreValues={communityLicenseStoreValues}>
        <HomeSideNav />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
