/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Heading, Layout, Text, Container, Button } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useParams, useHistory, Link } from 'react-router-dom'
import { useToaster } from '@common/components'
import { useStrings } from 'framework/strings'
import { useLicenseStore, handleUpdateLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import {
  useStartTrialLicense,
  ResponseModuleLicenseDTO,
  StartTrialDTORequestBody,
  useStartFreeLicense,
  StartFreeLicenseQueryParams
} from 'services/cd-ng'
import type { AccountPathProps, Module } from '@common/interfaces/RouteInterfaces'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { Category, PlanActions, TrialActions } from '@common/constants/TrackingConstants'
import routes from '@common/RouteDefinitions'
import useStartTrialModal from '@common/modals/StartTrial/StartTrialModal'
import { Editions, ModuleLicenseType, SubscriptionTabNames } from '@common/constants/SubscriptionTypes'
import { useFeatureFlags, useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import css from './StartTrialTemplate.module.scss'

interface StartTrialTemplateProps {
  title: string
  bgImageUrl: string
  isTrialInProgress?: boolean
  startTrialProps: Omit<StartTrialProps, 'startTrial' | 'module' | 'loading'>
  module: Module
}

interface StartTrialProps {
  description: string
  learnMore: {
    description: string
    url: string
  }
  startBtn: {
    description: string
    onClick?: () => void
  }
  shouldShowStartTrialModal?: boolean
  startTrial: () => Promise<ResponseModuleLicenseDTO>
  module: Module
  loading: boolean
}

const StartTrialComponent: React.FC<StartTrialProps> = startTrialProps => {
  const { description, learnMore, startBtn, shouldShowStartTrialModal, startTrial, module, loading } = startTrialProps
  const history = useHistory()
  const { accountId } = useParams<{
    accountId: string
  }>()
  const { showError } = useToaster()
  const { getString } = useStrings()
  const { showModal } = useStartTrialModal({ module, handleStartTrial })
  const { licenseInformation, updateLicenseStore } = useLicenseStore()
  const { FREE_PLAN_ENABLED, PLANS_ENABLED } = useFeatureFlags()
  const clickEvent = FREE_PLAN_ENABLED ? PlanActions.StartFreeClick : TrialActions.StartTrialClick
  const experience = FREE_PLAN_ENABLED ? ModuleLicenseType.FREE : ModuleLicenseType.TRIAL
  const modal = FREE_PLAN_ENABLED ? ModuleLicenseType.FREE : ModuleLicenseType.TRIAL

  async function handleStartTrial(): Promise<void> {
    trackEvent(clickEvent, {
      category: Category.SIGNUP,
      module,
      edition: FREE_PLAN_ENABLED ? Editions.FREE : Editions.ENTERPRISE
    })
    try {
      const data = await startTrial()

      handleUpdateLicenseStore({ ...licenseInformation }, updateLicenseStore, module, data?.data)

      history.push({
        pathname: routes.toModuleHome({ accountId, module }),
        search: `?modal=${modal}&&experience=${experience}`
      })
    } catch (error) {
      showError(error.data?.message)
    }
  }

  function handleStartButtonClick(): void {
    if (shouldShowStartTrialModal) {
      showModal()
    } else {
      handleStartTrial()
    }
  }

  const { trackEvent } = useTelemetry()
  return (
    <Layout.Vertical spacing="small">
      <Text padding={{ bottom: 'xxlarge' }} width={500}>
        {description}
      </Text>
      <a className={css.learnMore} href={learnMore.url} rel="noreferrer" target="_blank">
        {learnMore.description}
      </a>
      <Button
        width={300}
        height={45}
        intent="primary"
        text={startBtn.description}
        onClick={startBtn.onClick ? startBtn.onClick : handleStartButtonClick}
        disabled={loading}
      />
      {PLANS_ENABLED && (
        <Link to={routes.toSubscriptions({ accountId, moduleCard: module, tab: SubscriptionTabNames.PLANS })}>
          {getString('common.exploreAllPlans')}
        </Link>
      )}
    </Layout.Vertical>
  )
}

export const StartTrialTemplate: React.FC<StartTrialTemplateProps> = ({
  title,
  bgImageUrl,
  startTrialProps,
  module
}) => {
  const { accountId } = useParams<AccountPathProps>()

  const isFreeEnabled = useFeatureFlag(FeatureFlag.FREE_PLAN_ENABLED)

  const startTrialRequestBody: StartTrialDTORequestBody = {
    moduleType: module.toUpperCase() as any,
    edition: Editions.ENTERPRISE
  }

  const { mutate: startTrial, loading: startingTrial } = useStartTrialLicense({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const moduleType = module.toUpperCase() as StartFreeLicenseQueryParams['moduleType']

  const { mutate: startFreePlan, loading: startingFree } = useStartFreeLicense({
    queryParams: {
      accountIdentifier: accountId,
      moduleType
    },
    requestOptions: {
      headers: {
        'content-type': 'application/json'
      }
    }
  })

  function handleStartTrial(): Promise<ResponseModuleLicenseDTO> {
    return isFreeEnabled ? startFreePlan() : startTrial(startTrialRequestBody)
  }

  return (
    <Container className={css.body} style={{ background: `transparent url(${bgImageUrl}) no-repeat` }}>
      <Layout.Vertical spacing="medium">
        <Heading font={{ weight: 'bold', size: 'large' }} color={Color.BLACK_100}>
          {title}
        </Heading>

        <StartTrialComponent
          {...startTrialProps}
          startTrial={handleStartTrial}
          module={module}
          loading={startingTrial || startingFree}
        />
      </Layout.Vertical>
    </Container>
  )
}
