/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { LICENSE_STATE_VALUES } from 'framework/LicenseStore/licenseStoreUtil'
import { useGetCommunity, isOnPrem } from '@common/utils/utils'

export enum View {
  Dashboard,
  Welcome
}

const useLandingPageDefaultView = (): View => {
  const { CD_LICENSE_STATE } = useLicenseStore()
  const isCommunity = useGetCommunity()
  if (CD_LICENSE_STATE !== LICENSE_STATE_VALUES.ACTIVE || isCommunity || isOnPrem()) {
    return View.Welcome
  }
  return View.Dashboard
}

export default useLandingPageDefaultView
