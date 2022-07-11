/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { StartTrialTemplate } from '@rbac/components/TrialHomePageTemplate/StartTrialTemplate'
import { useStrings } from 'framework/strings'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import bgImageURL from './ff.svg'

const CFTrialHomePage: React.FC = () => {
  const { getString } = useStrings()

  const isFreeEnabled = useFeatureFlag(FeatureFlag.FREE_PLAN_ENABLED)

  const startBtnDescription = isFreeEnabled
    ? getString('common.startFreePlan', { module: 'FF' })
    : getString('cf.cfTrialHomePage.startTrial.startBtn.description')

  const startTrialProps = {
    description: getString('cf.cfTrialHomePage.startTrial.description'),
    learnMore: {
      description: getString('cf.learnMore'),
      url: 'https://docs.harness.io/article/0a2u2ppp8s-getting-started-with-continuous-features'
    },
    startBtn: {
      description: startBtnDescription
    }
  }

  return (
    <StartTrialTemplate
      title={getString('cf.continuous')}
      bgImageUrl={bgImageURL}
      startTrialProps={startTrialProps}
      module="cf"
    />
  )
}

export default CFTrialHomePage
