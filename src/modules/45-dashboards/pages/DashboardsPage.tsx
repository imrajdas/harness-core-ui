/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container } from '@harness/uicore'
import { Editions } from '@common/constants/SubscriptionTypes'
import LevelUpBanner from '@common/components/FeatureWarning/LevelUpBanner'
import type { ModuleLicenseDTO } from 'services/cd-ng'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { useStrings } from 'framework/strings'

import { DashboardsContextProvider } from './DashboardsContext'
import DashboardsHeader from './DashboardsCommonHeaderPage'
import css from './home/HomePage.module.scss'

const isEnterpriseLicense = (
  licenseInformation: Record<string, ModuleLicenseDTO> | Record<string, undefined>
): boolean => {
  return Object.values(licenseInformation).some(
    license => license?.status === 'ACTIVE' && license?.edition === Editions.ENTERPRISE
  )
}

const DashboardsPage: React.FC = ({ children }) => {
  const { getString } = useStrings()
  const { licenseInformation } = useLicenseStore()

  const banner = <LevelUpBanner message={getString('dashboards.upgrade')} />

  return (
    <DashboardsContextProvider>
      <Container className={css.customDashboards}>
        <DashboardsHeader />
        {isEnterpriseLicense(licenseInformation) ? children : banner}
      </Container>
    </DashboardsContextProvider>
  )
}

export default DashboardsPage
