/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Button,
  ButtonVariation,
  Layout,
  PageHeader,
  PageBody,
  PageSpinner,
  Text,
  PageError,
  ButtonSize
} from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { Color } from '@harness/design-system'
import { Callout } from '@blueprintjs/core'
import LandingDashboardFactory from '@common/factories/LandingDashboardFactory'
import {
  LandingDashboardContextProvider,
  TimeRangeToDays,
  useLandingDashboardContext
} from '@common/factories/LandingDashboardContext'
import { ModuleName } from 'framework/types/ModuleName'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useStrings } from 'framework/strings'
import LandingDashboardWidgetWrapper from '@projects-orgs/components/LandingDashboardWidgetWrapper/LandingDashboardWidgetWrapper'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useGetCounts } from 'services/dashboard-service'
import LandingDashboardSummaryWidget from '@projects-orgs/components/LandingDashboardSummaryWidget/LandingDashboardSummaryWidget'
import TimeRangeSelect from '@projects-orgs/components/TimeRangeSelect/TimeRangeSelect'
import useLandingPageDefaultView, { View } from '@projects-orgs/hooks/useLandingPageDefaultView'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import LandingDashboardWelcomeView from './LandingDashboardWelcomeView'
import css from './LandingDashboardPage.module.scss'

const modules: Array<ModuleName> = [ModuleName.CD]

const LandingDashboardPage: React.FC = () => {
  const { accountId } = useParams<AccountPathProps>()
  const { currentUserInfo } = useAppStore()
  const { getString } = useStrings()
  useDocumentTitle(getString('dashboardLabel'))
  const defaultView = useLandingPageDefaultView()
  const [view, setView] = useState<View>(defaultView)
  const name = currentUserInfo.name || currentUserInfo.email

  const { selectedTimeRange } = useLandingDashboardContext()
  const [range] = useState([Date.now() - TimeRangeToDays[selectedTimeRange] * 24 * 60 * 60000, Date.now()])
  const { data, loading, error, refetch } = useGetCounts({
    queryParams: {
      accountIdentifier: accountId,
      startTime: range[0],
      endTime: range[1]
    }
  })

  const retry = () =>
    refetch({
      queryParams: {
        accountIdentifier: accountId,
        startTime: Date.now() - TimeRangeToDays[selectedTimeRange] * 24 * 60 * 60000,
        endTime: Date.now()
      }
    })

  if (View.Welcome === view) {
    return <LandingDashboardWelcomeView setView={setView} />
  } else if (loading) {
    return (
      <PageBody>
        <PageSpinner />
      </PageBody>
    )
  } else {
    const projetCount = data?.data?.response?.projectsCountDetail?.count
    return data && projetCount ? (
      <LandingDashboardContextProvider>
        <PageHeader
          title={getString('projectsOrgs.landingDashboard.dashboardTitle', {
            name
          })}
          toolbar={
            <Button
              onClick={() => {
                setView(View.Welcome)
              }}
              text={getString('common.welcome')}
              variation={ButtonVariation.LINK}
            />
          }
        />
        <PageBody>
          <Layout.Vertical spacing="large" padding="xlarge">
            <Layout.Horizontal flex={{ justifyContent: 'space-between' }}>
              <Text font={{ size: 'medium', weight: 'bold' }} color={Color.BLACK}>
                {getString('projectsOrgs.landingDashboard.atAGlance')}
              </Text>
              <TimeRangeSelect className={css.timeRangeSelect} />
            </Layout.Horizontal>
            <LandingDashboardSummaryWidget glanceCardData={data} />

            <Layout.Vertical spacing="large">
              {modules.map(moduleName => {
                const moduleHandler = LandingDashboardFactory.getModuleDashboardHandler(moduleName)
                return moduleHandler ? (
                  <LandingDashboardWidgetWrapper
                    icon={moduleHandler?.icon}
                    title={moduleHandler?.label}
                    iconProps={moduleHandler?.iconProps}
                    key={moduleName}
                  >
                    {moduleHandler.moduleDashboardRenderer?.()}
                  </LandingDashboardWidgetWrapper>
                ) : null
              })}
            </Layout.Vertical>
          </Layout.Vertical>
        </PageBody>
      </LandingDashboardContextProvider>
    ) : (error || data?.data?.executionStatus) !== 'SUCCESS' ? (
      <PageBody>
        <PageError message={data?.data?.executionMessage} onClick={retry} />
      </PageBody>
    ) : (
      <LandingDashboardWelcomeView setView={setView} />
    )
  }
}

const LandingDashboardPageWithCallout = () => {
  const isFeatureFlagEnabled = useFeatureFlag(FeatureFlag.JDK11_UPGRADE_BANNER)
  const [showBanner, setShowBanner] = useState(isFeatureFlagEnabled)
  return (
    <>
      {showBanner && (
        <Callout className={css.callout} intent="success" icon={null}>
          <Text color={Color.BLACK}>
            To improve Harness security and reliability, all Delegates will start using OpenJDK 11 starting May 31,
            2022. There is no operational impact. Harness users that installed self-signed certificates into the
            Delegate default Java KeyStore should follow
            <a
              href="https://community.harness.io/t/information-regarding-certificates-and-delegate-upgrade-to-openjdk-11/12074"
              target="_blank"
              rel="noreferrer"
            >
              <b>&nbsp;these instructions&nbsp;</b>
            </a>
            to make sure Delegates continue to use these certificates.
          </Text>
          <Button
            variation={ButtonVariation.ICON}
            size={ButtonSize.LARGE}
            icon="cross"
            onClick={() => setShowBanner(false)}
          />
        </Callout>
      )}

      <LandingDashboardPage />
    </>
  )
}

export default LandingDashboardPageWithCallout
