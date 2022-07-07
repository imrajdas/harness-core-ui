/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import * as FeatureFlag from '@common/hooks/useFeatureFlag'
import { communityLicenseStoreValues } from '@common/utils/DefaultAppStoreData'
import AccountSideNav from '../AccountSideNav/AccountSideNav'

beforeEach(() => {
  window.deploymentType = 'SAAS'
})
describe('AccountSideNav', () => {
  test('AccountSideNav simple snapshot test', () => {
    const { container } = render(
      <TestWrapper>
        <AccountSideNav />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('Disable launch button for community edition', () => {
    const { container } = render(
      <TestWrapper defaultLicenseStoreValues={communityLicenseStoreValues}>
        <AccountSideNav />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('AccountSideNav test pipeline governance', () => {
    jest.spyOn(FeatureFlag, 'useFeatureFlags').mockReturnValue({
      OPA_PIPELINE_GOVERNANCE: true,
      OPA_FF_GOVERNANCE: false
    })

    const renderObj = render(
      <TestWrapper
        defaultLicenseStoreValues={{
          licenseInformation: {
            CI: { edition: 'ENTERPRISE', status: 'ACTIVE' },
            CD: { edition: 'FREE', status: 'EXPIRED' }
          }
        }}
      >
        <AccountSideNav />
      </TestWrapper>
    )
    expect(renderObj.getByText('common.governance')).toBeInTheDocument()
  })

  test('AccountSideNav test ff governance', () => {
    jest.spyOn(FeatureFlag, 'useFeatureFlags').mockReturnValue({
      OPA_PIPELINE_GOVERNANCE: false,
      OPA_FF_GOVERNANCE: true
    })

    const renderObj = render(
      <TestWrapper
        defaultLicenseStoreValues={{
          licenseInformation: {
            CI: { edition: 'ENTERPRISE', status: 'ACTIVE' },
            CD: { edition: 'FREE', status: 'EXPIRED' }
          }
        }}
      >
        <AccountSideNav />
      </TestWrapper>
    )
    expect(renderObj.getByText('common.governance')).toBeInTheDocument()
  })

  test('AccountSideNav test no licenses enabled', () => {
    jest.spyOn(FeatureFlag, 'useFeatureFlags').mockReturnValue({
      NG_LICENSES_ENABLED: true
    })
    const renderObj = render(
      <TestWrapper>
        <AccountSideNav />
      </TestWrapper>
    )
    expect(renderObj.getByText('common.subscriptions.title')).toBeTruthy()
  })

  test('AccountSideNav test audit trail', () => {
    jest.spyOn(FeatureFlag, 'useFeatureFlags').mockReturnValue({
      AUDIT_TRAIL_WEB_INTERFACE: true
    })
    const renderObj = render(
      <TestWrapper>
        <AccountSideNav />
      </TestWrapper>
    )
    expect(renderObj.getByText('common.auditTrail')).toBeTruthy()
  })
})
