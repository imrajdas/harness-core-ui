/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { noop } from 'lodash-es'
import { Button, ButtonVariation, Icon, Layout, Text, IconName } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'

import _refiner from 'refiner-js'
import { Drawer, Position } from '@blueprintjs/core'
import cx from 'classnames'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useStrings } from 'framework/strings'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { useGetCommunity } from '@common/utils/utils'
import { getButton } from './ResourceCenterUtil'
import resourceImage from './images/resource-center.png'
import {
  getReleaseNodeLink,
  openWhatsNew,
  openEarlyAccess,
  openFileATicket,
  openZendeskSupport,
  HARNESS_SEARCH_LINK,
  HARNESS_UNIVERISITY_LINK,
  HARNESS_COMMUNITY_LINK,
  HARNESS_COMMUNITY_SLACK_LINK,
  HARNESS_DOCS_LINK,
  HARNESS_API_DOCS_LINK,
  SITE_STATUS_LINK
} from './utils'
import { CommunitySubmitTicket } from './MenuItems'
import css from './ResourceCenter.module.scss'

const refinerProjectId = window.refinerProjectToken
const refinerSurveryId = window.refinerFeedbackToken

export const ResourceCenter = (): React.ReactElement => {
  const { getString } = useStrings()
  const { currentUserInfo } = useAppStore()
  const [buttonDisabled, setButtonDisabled] = useState(false)
  const [show, setShow] = useState<boolean>(false)

  const isCommunity = useGetCommunity()
  const { EARLY_ACCESS_ENABLED, SHOW_NG_REFINER_FEEDBACK } = useFeatureFlags()
  useEffect(() => {
    _refiner('dismissForm', refinerSurveryId)
    _refiner('setProject', refinerProjectId)
    _refiner('addToResponse', {
      email: currentUserInfo.email
    })

    // callback function so that upon survey completion,
    // the feedback button will be disabled for 6s
    _refiner('onComplete', function () {
      setButtonDisabled(true)
      setTimeout(function () {
        setButtonDisabled(false)
      }, 6000)
    })
  }, [])

  const releaseNodeLink = getReleaseNodeLink()

  const getContactUsTiles = React.useMemo((): Resource[] => {
    const refinerSurvey = (): void => {
      _refiner('identifyUser', {
        email: currentUserInfo.email,
        id: currentUserInfo.email
      })
      _refiner('showForm', refinerSurveryId, true)
    }
    const finalTiles: Resource[] = [
      {
        title: getString('common.resourceCenter.ticketmenu.submitTicket'),
        icon: 'pipeline-deploy',
        iconClassname: css.iconFilled,
        className: css.bottom,
        onClick: (e: React.MouseEvent<Element, MouseEvent>) => openFileATicket(e, currentUserInfo, setShow)
      },
      {
        title: getString('common.resourceCenter.ticketmenu.viewTicket'),
        icon: 'copy-doc',
        className: css.bottom,
        onClick: (e: React.MouseEvent<Element, MouseEvent>) => openZendeskSupport(e)
      }
    ]
    if (SHOW_NG_REFINER_FEEDBACK) {
      finalTiles.push({
        title: getString('common.resourceCenter.feedback.submit'),
        icon: 'chat',
        onClick: (_e: React.MouseEvent<Element, MouseEvent>) => refinerSurvey(),
        disabled: buttonDisabled,
        iconSize: 20,
        testId: 'feedback'
      })
    }
    return finalTiles
  }, [SHOW_NG_REFINER_FEEDBACK, currentUserInfo, buttonDisabled])

  if (!show) {
    return (
      <Icon
        name={'nav-help'}
        onClick={e => {
          e.stopPropagation()
          e.preventDefault()
          setShow(true)
        }}
        size={30}
        data-testid="question"
        className={css.helpCenterIcon}
      />
    )
  }

  return (
    <Drawer
      autoFocus
      enforceFocus
      hasBackdrop
      usePortal
      canOutsideClickClose
      canEscapeKeyClose
      position={Position.LEFT}
      isOpen={show}
      onClose={() => {
        setShow(false)
      }}
      className={css.resourceCenter}
    >
      <Layout.Vertical>
        <Layout.Vertical padding={'xlarge'} flex={{ alignItems: 'baseline' }}>
          <Layout.Horizontal
            padding={{ bottom: 'medium' }}
            className={css.title}
            flex={{ justifyContent: 'space-between', alignItems: 'baseline' }}
          >
            <Text color={Color.WHITE}>{getString('common.resourceCenter.title')}</Text>
            <Button
              icon={'cross'}
              variation={ButtonVariation.ICON}
              onClick={e => {
                e.stopPropagation()
                e.preventDefault()
                setShow(false)
              }}
            />
          </Layout.Horizontal>
          <img src={resourceImage} height={106} alt={'Resource center image'} />
        </Layout.Vertical>

        {isCommunity ? (
          <CommunitySubmitTicket />
        ) : (
          <>
            {EARLY_ACCESS_ENABLED && (
              <ResourceSection
                title={getString('common.resourceCenter.productUpdates.title')}
                resources={[
                  {
                    title: getString('common.resourceCenter.productUpdates.whatsnew'),
                    icon: 'stars',
                    iconClassname: css.iconFilled,
                    onClick: (e: React.MouseEvent<Element, MouseEvent>) => openWhatsNew(e),
                    testId: 'whatsnew'
                  },
                  {
                    title: getString('common.resourceCenter.productUpdates.earlyAcess'),
                    icon: 'flag-tick',
                    iconClassname: css.iconFilled,
                    onClick: (e: React.MouseEvent<Element, MouseEvent>) => openEarlyAccess(e),
                    testId: 'early-access'
                  }
                ]}
              />
            )}
            <ResourceSection
              title={getString('common.resourceCenter.ticketmenu.title')}
              resources={getContactUsTiles}
            />
          </>
        )}
        <Layout.Vertical padding={{ top: 'small', bottom: 'xlarge', left: 'xlarge', right: 'xlarge' }}>
          <Text font={{ variation: FontVariation.BODY2 }} padding={{ bottom: 'medium' }} color={Color.WHITE}>
            {getString('common.resourceCenter.bottomlayout.desc')}
          </Text>
          <Layout.Horizontal flex={{ justifyContent: 'space-around' }}>
            {getButton(getString('search'), 'thinner-search', HARNESS_SEARCH_LINK, css.iconSize)}
            {getButton(
              getString('common.resourceCenter.bottomlayout.university'),
              'university',
              HARNESS_UNIVERISITY_LINK,
              css.university
            )}
            {getButton(getString('common.community'), 'resource-center-community-icon', HARNESS_COMMUNITY_LINK)}
            {getButton(
              getString('common.resourceCenter.communitySlack'),
              'service-slack',
              HARNESS_COMMUNITY_SLACK_LINK,
              cx(css.iconSize, css.marginTop)
            )}
          </Layout.Horizontal>
          <Layout.Horizontal flex={{ justifyContent: 'space-around' }} padding={{ top: 'small' }}>
            {getButton(
              getString('common.resourceCenter.bottomlayout.docs'),
              'resource-center-docs-icon',
              HARNESS_DOCS_LINK
            )}
            {getButton(getString('common.resourceCenter.bottomlayout.apiDocs'), 'api-docs', HARNESS_API_DOCS_LINK)}
            {getButton(getString('common.resourceCenter.bottomlayout.releaseNote'), 'change-log', releaseNodeLink)}
            {getButton(
              getString('common.resourceCenter.bottomlayout.sitestatus'),
              'right-bar-notification',
              SITE_STATUS_LINK
            )}
          </Layout.Horizontal>
        </Layout.Vertical>
      </Layout.Vertical>
    </Drawer>
  )
}
interface Resource {
  icon: IconName
  title: string
  onClick: (e: React.MouseEvent<Element, MouseEvent>) => void
  iconClassname?: string
  className?: string
  disabled?: boolean
  iconSize?: number
  testId?: string
}
function ResourceSection({
  title,
  resources
}: {
  title: string
  resources: Resource[]
  className?: string
}): JSX.Element {
  return (
    <div className={cx(css.tileContainer)}>
      <Text
        font={{ variation: FontVariation.H4 }}
        padding={{ bottom: 'medium' }}
        className={css.sectionTitle}
        color={Color.WHITE}
      >
        {title}
      </Text>
      <div className={css.tiles}>
        {resources.map((resource: Resource) => (
          <ResourceCenterTile key={resource.title} {...resource} />
        ))}
      </div>
    </div>
  )
}

function ResourceCenterTile({
  title,
  icon,
  iconClassname,
  className,
  onClick,
  disabled,
  iconSize,
  testId
}: Resource): JSX.Element {
  return (
    <div data-testid={testId} className={cx(css.tile, className)} onClick={!disabled ? onClick : noop}>
      <Icon {...(iconSize ? { size: iconSize } : {})} className={cx(css.icon, iconClassname)} name={icon} />
      {title}
    </div>
  )
}
