/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Checkbox, Layout, Popover, Text } from '@wings-software/uicore'
import { Tabs, Tab } from '@blueprintjs/core'
import { Color } from '@harness/design-system'
import { useTelemetry } from '@common/hooks/useTelemetry'
import routes from '@common/RouteDefinitions'
import type { PipelinePathProps } from '@common/interfaces/RouteInterfaces'
import { SidebarLink } from '@common/navigation/SideNav/SideNav'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useStrings } from 'framework/strings'
import { returnLaunchUrl } from '@common/utils/routeUtils'
import NavExpandable from '@common/navigation/NavExpandable/NavExpandable'
import { LaunchButton } from '@common/components/LaunchButton/LaunchButton'
import { USER_JOURNEY_EVENTS } from '@ce/TrackingEventsConstants'
import css from './CESideNav.module.scss'

const feedbackOptions = [
  'I am a CD/CI user',
  'To organise perspectives better',
  'For access management',
  'Does not matter, account level works for me'
]

export default function CESideNav(): React.ReactElement {
  const { currentUserInfo } = useAppStore()
  const { identifyUser } = useTelemetry()

  useEffect(() => {
    identifyUser(currentUserInfo.email)
  }, [])
  useTelemetry({ pageName: 'CloudCostPage' })
  return (
    <Layout.Vertical spacing="small">
      <Tabs id="ccmNavTab" selectedTabId={'account'} className={css.sideNavTabs}>
        <Tab id="account" title={'Account'} panel={<SideNavItems />} />
        <Tabs.Expander />
        <Popover interactionKind={'hover'} content={<ProjectLevelFeedback />}>
          <Text>{'Project'}</Text>
        </Popover>
      </Tabs>
    </Layout.Vertical>
  )
}

interface ProjectLevelFeedbackProps {
  shouldShowFeedbackCta?: boolean // TODO: temp prop, will remove once data saving API is ready
}

export const ProjectLevelFeedback = (props: ProjectLevelFeedbackProps) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState<boolean>(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [moreInfo, setMoreInfo] = useState<string>('')

  const handleOptionChange = (checked: boolean, val: string) => {
    const updatedOptions = [...selectedOptions]
    if (checked) {
      updatedOptions.push(val)
    } else {
      const index = updatedOptions.indexOf(val)
      updatedOptions.splice(index, 1)
    }
    setSelectedOptions(updatedOptions)
  }

  return (
    <div className={css.projectLevelFeedback}>
      <Text font={{ size: 'small' }} data-testid={'supportText'}>
        We currently only support Cloud Cost Management (CCM) at an Account Level.
      </Text>
      {!showFeedbackForm && props.shouldShowFeedbackCta && (
        <>
          <Text font={{ size: 'small', weight: 'bold' }} className={css.spaceAbove}>
            Would you like us to support CCM at a Project level?
          </Text>
          <Text
            font={{ size: 'small' }}
            color={Color.BLUE_700}
            style={{ cursor: 'pointer' }}
            rightIcon={'chevron-right'}
            onClick={() => setShowFeedbackForm(true)}
            data-testid={'fillFeedbackCta'}
          >
            Fill our feature request form
          </Text>
        </>
      )}
      {showFeedbackForm && (
        <>
          <Text font={{ size: 'small', weight: 'bold' }} className={css.spaceAbove}>
            Tell us why you would like CCM at a Project level?
          </Text>
          <div className={css.spaceAbove}>
            {feedbackOptions.map((option: string) => {
              return (
                <Checkbox
                  key={option.substr(0, 5)}
                  label={option}
                  checked={selectedOptions.indexOf(option) > -1}
                  onChange={(e: React.FormEvent<HTMLInputElement>) =>
                    handleOptionChange(e.currentTarget.checked, option)
                  }
                />
              )
            })}
          </div>
          <textarea
            value={moreInfo}
            placeholder={'Tell us more'}
            className={css.spaceAbove}
            onChange={e => setMoreInfo(e.target.value)}
          ></textarea>
          <Layout.Horizontal className={css.spaceAbove} spacing={'medium'}>
            <Button text="Submit" intent="primary" font={{ size: 'small' }} />
            <Button text="Cancel" font={{ size: 'small' }} onClick={() => setShowFeedbackForm(false)} />
          </Layout.Horizontal>
        </>
      )}
    </div>
  )
}

const SideNavItems = () => {
  const { accountId } = useParams<PipelinePathProps>()
  const { getString } = useStrings()
  const { trackEvent } = useTelemetry()

  return (
    <Layout.Vertical spacing="small">
      <React.Fragment>
        <SidebarLink label={getString('overview')} to={routes.toCEOverview({ accountId })} />
        <SidebarLink
          onClick={() => {
            trackEvent(USER_JOURNEY_EVENTS.PERSPECTIVE_NAV_CLICK, {})
          }}
          label={getString('ce.perspectives.sideNavText')}
          to={routes.toCEPerspectives({ accountId })}
        />
        <SidebarLink label={getString('ce.budgets.sideNavText')} to={routes.toCEBudgets({ accountId })} />

        <SidebarLink
          label={getString('ce.anomalyDetection.sideNavText')}
          to={routes.toCEAnomalyDetection({ accountId })}
        />
        <SidebarLink
          onClick={() => {
            trackEvent(USER_JOURNEY_EVENTS.RECOMMENDATIONS_NAV_CLICK, {})
          }}
          label={getString('ce.recommendation.sideNavText')}
          to={routes.toCERecommendations({ accountId })}
        />
        <SidebarLink
          onClick={() => {
            trackEvent(USER_JOURNEY_EVENTS.AS_NAV_CLICK, {})
          }}
          label={getString('ce.co.breadCrumb.rules')}
          to={routes.toCECORules({ accountId, params: '' })}
        />
        <NavExpandable title={getString('common.setup')} route={routes.toCECOAccessPoints({ accountId })}>
          <Layout.Vertical spacing="small">
            <SidebarLink
              label={getString('ce.co.accessPoint.loadbalancers')}
              to={routes.toCECOAccessPoints({ accountId })}
            />
            <SidebarLink
              label={getString('ce.businessMapping.sideNavText')}
              to={routes.toBusinessMapping({ accountId })}
            />
          </Layout.Vertical>
        </NavExpandable>
      </React.Fragment>
      <LaunchButton
        launchButtonText={getString('common.ce.visibilityLaunchButton')}
        redirectUrl={returnLaunchUrl(`#/account/${accountId}/continuous-efficiency/overview`)}
      />
    </Layout.Vertical>
  )
}
