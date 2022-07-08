/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Button, ButtonVariation, Icon, Layout, Text } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'

import { Drawer, Position } from '@blueprintjs/core'
import cx from 'classnames'
import { useGetCommunity } from '@common/utils/utils'
import { useStrings } from 'framework/strings'
import { getButton } from './ResourceCenterUtil'
import MenuItems from './MenuItems'
import resourceImage from './images/resource-center.png'
import css from './ResourceCenter.module.scss'

const ON_PREM_RELEASE_NODE_LINK = 'https://docs.harness.io/article/556wy85kbo-harness-on-prem-release-notes'
const SAAS_RELEASE_NODE_LINKE = 'https://docs.harness.io/article/7zkchy5lhj-harness-saa-s-release-notes-2022'

const HARNESS_SEARCH_LINK = 'https://harness.io/search/'
const HARNESS_UNIVERISITY_LINK = 'https://university.harness.io/'
const HARNESS_COMMUNITY_LINK = 'https://community.harness.io/'
const HARNESS_COMMUNITY_SLACK_LINK =
  'https://join.slack.com/t/harnesscommunity/shared_invite/zt-y4hdqh7p-RVuEQyIl5Hcx4Ck8VCvzBw'
const HARNESS_DOCS_LINK = 'https://docs.harness.io/'
const HARNESS_API_DOCS_LINK = 'https://harness.io/docs/api/'
const SITE_STATUS_LINK = 'https://status.harness.io/'

export const ResourceCenter = (): React.ReactElement => {
  const { getString } = useStrings()

  const [show, setShow] = useState<boolean>(false)
  const isCommunity = useGetCommunity()

  function getReleaseNodeLink(): string {
    if (isCommunity) {
      return ON_PREM_RELEASE_NODE_LINK
    }
    switch (window.deploymentType) {
      case 'COMMUNITY':
      case 'ON_PREM': {
        return ON_PREM_RELEASE_NODE_LINK
      }
      default:
        return SAAS_RELEASE_NODE_LINKE
    }
  }
  const releaseNodeLink = getReleaseNodeLink()

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
        <MenuItems
          closeResourceCenter={() => {
            setShow(false)
          }}
        />
        <Layout.Vertical padding={'xlarge'}>
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
