/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactElement } from 'react'

import type { ModuleLicenseDTO } from 'services/cd-ng'
import type { Editions } from '@common/constants/SubscriptionTypes'
import { useGetCommunity } from '@common/utils/utils'
import {
  NoSubscriptionDetailsCardInfo,
  SubscriptionDetailsCardInfo,
  CommunitySubscriptionDetailsCardInfo
} from './SubscriptionUtils'

interface SubscriptionDetailsCardBodyProps {
  licenseData?: ModuleLicenseDTO
  edition: Editions
  isFreeOrCommunity: boolean
  isExpired: boolean
  days: number
  expiryDate: string
  expiredDays: number
  accountName?: string
}
const SubscriptionDetailsCardBody = ({
  licenseData,
  edition,
  isFreeOrCommunity,
  isExpired,
  days,
  expiryDate,
  expiredDays,
  accountName
}: SubscriptionDetailsCardBodyProps): ReactElement => {
  const isCommunity = useGetCommunity()
  if (!licenseData) {
    return <NoSubscriptionDetailsCardInfo accountName={accountName} />
  }
  if (isCommunity) {
    return <CommunitySubscriptionDetailsCardInfo accountName={accountName} />
  }

  return (
    <SubscriptionDetailsCardInfo
      accountName={accountName}
      isFreeOrCommunity={isFreeOrCommunity}
      isExpired={isExpired}
      expiredDays={expiredDays}
      days={days}
      expiryDate={expiryDate}
      licenseData={licenseData}
      edition={edition}
    />
  )
}

export default SubscriptionDetailsCardBody
