/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { Editions, CDLicenseType } from '@common/constants/SubscriptionTypes'
import type { ModuleLicenseDTO } from 'services/cd-ng'
import {
  CommunitySubscriptionDetailsCardInfo,
  NoSubscriptionDetailsCardInfo,
  SubscriptionDetailsCardInfo
} from '../overview/SubscriptionUtils'

describe('SubscriptionUtils', () => {
  describe('CommunitySubscriptionDetailsCardInfo', () => {
    test('CommunitySubscriptionDetailsCardInfo', () => {
      const { container, getByText } = render(
        <TestWrapper>
          <CommunitySubscriptionDetailsCardInfo accountName="account name" />
        </TestWrapper>
      )
      expect(getByText('authSettings.onprem')).toBeInTheDocument()
      expect(container).toMatchSnapshot()
    })
  })

  describe('NoSubscriptionDetailsCardInfo', () => {
    test('NoSubscriptionDetailsCardInfo', () => {
      const { container, getByText } = render(
        <TestWrapper>
          <NoSubscriptionDetailsCardInfo accountName="account name" />
        </TestWrapper>
      )
      expect(getByText('common.subscriptions.noActiveSubscription')).toBeInTheDocument()
      expect(container).toMatchSnapshot()
    })
  })

  describe('SubscriptionDetailsCardInfo', () => {
    test('CD free plan', () => {
      const props = {
        accountName: 'account name',
        isFreeOrCommunity: true,
        isExpired: false,
        edition: Editions.FREE,
        licenseData: {
          moduleType: 'CD' as ModuleLicenseDTO['moduleType']
        },
        expiryDate: '23 Dec 2025'
      }
      const { container, getByText } = render(
        <TestWrapper>
          <SubscriptionDetailsCardInfo {...props} />
        </TestWrapper>
      )
      expect(getByText('common.subscriptions.paid')).toBeInTheDocument()
      expect(container).toMatchSnapshot()
    })

    test('CD SERVICES licenseType', () => {
      const props = {
        accountName: 'account name',
        isFreeOrCommunity: true,
        isExpired: false,
        edition: Editions.FREE,
        licenseData: {
          moduleType: 'CD' as ModuleLicenseDTO['moduleType'],
          cdLicenseType: CDLicenseType.SERVICES
        },
        expiryDate: '23 Dec 2025'
      }
      const { container, getByText } = render(
        <TestWrapper>
          <SubscriptionDetailsCardInfo {...props} />
        </TestWrapper>
      )
      expect(getByText('common.subscriptions.cd.services')).toBeInTheDocument()
      expect(container).toMatchSnapshot()
    })

    test('CI team trial plan', () => {
      const props = {
        accountName: 'account name',
        isFreeOrCommunity: false,
        isExpired: false,
        edition: Editions.TEAM,
        licenseData: {
          licenseType: 'TRIAL' as ModuleLicenseDTO['licenseType'],
          moduleType: 'CI' as ModuleLicenseDTO['moduleType'],
          numberOfCommitters: 200
        },
        expiryDate: '23 Dec 2025'
      }
      const { container, getByText } = render(
        <TestWrapper>
          <SubscriptionDetailsCardInfo {...props} />
        </TestWrapper>
      )
      expect(getByText('common.subscriptions.overview.trialExpiry')).toBeInTheDocument()
      expect(container).toMatchSnapshot()
    })

    test('CI unlimited committers', () => {
      const props = {
        accountName: 'account name',
        isFreeOrCommunity: false,
        isExpired: false,
        edition: Editions.TEAM,
        licenseData: {
          licenseType: 'TRIAL' as ModuleLicenseDTO['licenseType'],
          moduleType: 'CI' as ModuleLicenseDTO['moduleType'],
          numberOfCommitters: -1
        },
        expiryDate: '23 Dec 2025'
      }
      const { container } = render(
        <TestWrapper>
          <SubscriptionDetailsCardInfo {...props} />
        </TestWrapper>
      )
      expect(container).toMatchSnapshot()
    })

    test('CF enterprise expired plan', () => {
      const props = {
        accountName: 'account name',
        isFreeOrCommunity: false,
        isExpired: true,
        edition: Editions.ENTERPRISE,
        licenseData: {
          licenseType: 'PAID' as ModuleLicenseDTO['licenseType'],
          moduleType: 'CF' as ModuleLicenseDTO['moduleType']
        },
        expiryDate: '23 Dec 2020'
      }
      const { container, getByText } = render(
        <TestWrapper>
          <SubscriptionDetailsCardInfo {...props} />
        </TestWrapper>
      )
      expect(getByText('common.subscriptions.expired')).toBeInTheDocument()
      expect(container).toMatchSnapshot()
    })

    test('CCM free plan', () => {
      const props = {
        accountName: 'account name',
        isFreeOrCommunity: true,
        isExpired: false,
        edition: Editions.FREE,
        licenseData: {
          moduleType: 'CE' as ModuleLicenseDTO['moduleType'],
          spendLimit: 300
        },
        expiryDate: '23 Dec 2025'
      }
      const { container, getByText } = render(
        <TestWrapper>
          <SubscriptionDetailsCardInfo {...props} />
        </TestWrapper>
      )
      expect(getByText('common.subscriptions.ccm.cloudSpend')).toBeInTheDocument()
      expect(container).toMatchSnapshot()
    })

    test('CCM unlimited spendlimit', () => {
      const props = {
        accountName: 'account name',
        isFreeOrCommunity: true,
        isExpired: false,
        edition: Editions.FREE,
        licenseData: {
          moduleType: 'CE' as ModuleLicenseDTO['moduleType'],
          spendLimit: -1
        },
        expiryDate: '23 Dec 2025'
      }
      const { container } = render(
        <TestWrapper>
          <SubscriptionDetailsCardInfo {...props} />
        </TestWrapper>
      )
      expect(container).toMatchSnapshot()
    })

    test('ExpiryCountdownMessage', () => {
      const props = {
        accountName: 'account name',
        isFreeOrCommunity: false,
        isExpired: false,
        edition: Editions.ENTERPRISE,
        licenseType: 'TRIAL' as ModuleLicenseDTO['licenseType'],
        licenseData: {
          moduleType: 'CE' as ModuleLicenseDTO['moduleType'],
          spendLimit: -1
        },
        days: 13,
        expiryDate: '23 Dec 2025'
      }
      const { container, getByText } = render(
        <TestWrapper>
          <SubscriptionDetailsCardInfo {...props} />
        </TestWrapper>
      )
      expect(getByText('common.subscriptions.expiryCountdown')).toBeInTheDocument()
      expect(container).toMatchSnapshot()
    })
  })
})
