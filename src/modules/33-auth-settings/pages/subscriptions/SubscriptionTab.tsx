/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactElement, useState, useEffect } from 'react'
import cx from 'classnames'

import { useParams, useHistory } from 'react-router-dom'
import { Button, Layout } from '@wings-software/uicore'
import type { Editions } from '@common/constants/SubscriptionTypes'
import { SubscriptionTabNames, ModuleLicenseType } from '@common/constants/SubscriptionTypes'
import { useStrings } from 'framework/strings'
import { useQueryParams } from '@common/hooks'
import type { ModuleName } from 'framework/types/ModuleName'
import type { ModuleLicenseDTO } from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import type { AccountPathProps, Module } from '@common/interfaces/RouteInterfaces'

import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import type { StringsMap } from 'stringTypes'
import { useGetCommunity } from '@common/utils/utils'

import SubscriptionOverview from './overview/SubscriptionOverview'
import SubscriptionBanner from './SubscriptionBanner'
import SubscriptionPlans from './plans/SubscriptionPlans'
import css from './SubscriptionsPage.module.scss'

export interface SubscriptionTabInfo {
  name: SubscriptionTabNames
  label: keyof StringsMap
}

export const SUBSCRIPTION_TABS: SubscriptionTabInfo[] = [
  {
    name: SubscriptionTabNames.OVERVIEW,
    label: 'common.subscriptions.tabs.overview'
  },
  {
    name: SubscriptionTabNames.PLANS,
    label: 'common.subscriptions.tabs.plans'
  }
  // {
  //   name: SUBSCRIPTION_TAB_NAMES.BILLING,
  //   label: 'common.subscriptions.tabs.billing'
  // }
]

interface TrialInformation {
  days: number
  expiryDate: string
  isExpired: boolean
  expiredDays: number
  edition: Editions
  isFreeOrCommunity: boolean
}

interface SubscriptionTabProps {
  accountName?: string
  trialInfo: TrialInformation
  hasLicense?: boolean
  selectedModule: ModuleName
  licenseData?: ModuleLicenseDTO
  refetchGetLicense: () => void
}

const SubscriptionTab = ({
  accountName,
  trialInfo,
  selectedModule,
  hasLicense,
  licenseData,
  refetchGetLicense
}: SubscriptionTabProps): ReactElement => {
  const { PLANS_ENABLED } = useFeatureFlags()
  const isCommunity = useGetCommunity()

  const [selectedSubscriptionTab, setSelectedSubscriptionTab] = useState<SubscriptionTabInfo>(SUBSCRIPTION_TABS[0])
  const { getString } = useStrings()
  const { tab: queryTab } = useQueryParams<{ tab?: SubscriptionTabNames }>()
  const { accountId } = useParams<AccountPathProps>()
  const history = useHistory()

  const { isFreeOrCommunity, edition, isExpired, expiredDays, days } = trialInfo

  useEffect(() => {
    if (queryTab) {
      setSelectedSubscriptionTab(SUBSCRIPTION_TABS.find(tab => tab.name === queryTab) || SUBSCRIPTION_TABS[0])
    }
  }, [queryTab])

  function getBanner(): React.ReactElement | null {
    if ((!isExpired && licenseData?.licenseType !== ModuleLicenseType.TRIAL && expiredDays > 14) || isFreeOrCommunity) {
      return null
    }

    return (
      <SubscriptionBanner
        module={selectedModule}
        edition={edition}
        days={days}
        expiredDays={expiredDays}
        isExpired={isExpired}
      />
    )
  }

  function getSubscriptionTabButtons(): React.ReactElement[] {
    const tabs = SUBSCRIPTION_TABS.map(tab => {
      function handleTabClick(): void {
        history.push(
          routes.toSubscriptions({ accountId, moduleCard: selectedModule.toLowerCase() as Module, tab: tab.name })
        )
      }

      const isSelected = tab === selectedSubscriptionTab
      const buttonClassnames = cx(css.subscriptionTabButton, isSelected && css.selected)

      return (
        <Button className={buttonClassnames} key={tab.label} round onClick={handleTabClick}>
          {getString(tab.label)}
        </Button>
      )
    })

    // show Plans tab only when feature flag is on, always show for community edition
    if (!isCommunity && !PLANS_ENABLED) {
      tabs.splice(1, 1)
    }

    return tabs
  }

  function getTabComponent(): React.ReactElement | null {
    switch (selectedSubscriptionTab.name) {
      case SubscriptionTabNames.PLANS:
        return <SubscriptionPlans module={selectedModule} />
      case SubscriptionTabNames.OVERVIEW:
      default:
        return (
          <SubscriptionOverview
            accountName={accountName}
            module={selectedModule}
            licenseData={licenseData}
            trialInformation={trialInfo}
            refetchGetLicense={refetchGetLicense}
          />
        )
    }
  }

  return (
    <React.Fragment>
      {hasLicense && getBanner()}
      <Layout.Horizontal className={css.subscriptionTabButtons} spacing="medium">
        {getSubscriptionTabButtons()}
      </Layout.Horizontal>
      {getTabComponent()}
    </React.Fragment>
  )
}

export default SubscriptionTab
