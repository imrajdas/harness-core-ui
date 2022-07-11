/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { PageSpinner } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { StartTrialTemplate } from '@rbac/components/TrialHomePageTemplate/StartTrialTemplate'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { PageNames } from '@ci/constants/TrackingConstants'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import routes from '@common/RouteDefinitions'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { Editions } from '@common/constants/SubscriptionTypes'
import { setUpCI, StartFreeLicenseAndSetupProjectCallback } from '@common/utils/GetStartedWithCIUtil'
import bgImageURL from './images/ci.svg'

import css from './CITrialHomePage.module.scss'

const CITrialHomePage: React.FC = () => {
  const { getString } = useStrings()
  const { FREE_PLAN_ENABLED } = useFeatureFlags()
  const history = useHistory()
  const { accountId } = useParams<AccountPathProps>()
  const { licenseInformation, updateLicenseStore } = useLicenseStore()
  const [loading, setLoading] = useState<boolean>(false)
  const { status: currentCIStatus } = licenseInformation['CI'] || {}

  useEffect(() => {
    setLoading(true)
    try {
      setUpCI({
        accountId,
        // A new CI user will not have an active CI license. Also, for an existing user with an active license, we will not override the existing license.
        edition: currentCIStatus !== 'ACTIVE' ? Editions.FREE : undefined,
        onSetUpSuccessCallback: ({ orgId, projectId }: StartFreeLicenseAndSetupProjectCallback) => {
          setLoading(false)
          history.push(
            routes.toGetStartedWithCI({
              accountId,
              module: 'ci',
              orgIdentifier: orgId,
              projectIdentifier: projectId
            })
          )
        },
        licenseInformation,
        updateLicenseStore,
        onSetupFailureCallback: () => {
          setLoading(false)
        }
      })
    } catch (e) {
      setLoading(false)
    }
  }, [])

  useTelemetry({ pageName: PageNames.CIStartTrial })

  const startBtnDescription = FREE_PLAN_ENABLED
    ? getString('common.startFreePlan', { module: 'CI' })
    : getString('ci.ciTrialHomePage.startTrial.startBtn.description')

  const startTrialProps = {
    description: getString('ci.ciTrialHomePage.startTrial.description'),
    learnMore: {
      description: getString('ci.learnMore'),
      url: 'https://docs.harness.io/category/zgffarnh1m-ci-category'
    },
    startBtn: {
      description: startBtnDescription
    }
  }

  return loading ? (
    <div className={css.loading}>
      <PageSpinner />
    </div>
  ) : (
    <StartTrialTemplate
      title={getString('ci.continuous')}
      bgImageUrl={bgImageURL}
      startTrialProps={startTrialProps}
      module="ci"
    />
  )
}

export default CITrialHomePage
