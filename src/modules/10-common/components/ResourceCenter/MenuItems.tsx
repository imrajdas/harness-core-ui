/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import moment from 'moment'
import cx from 'classnames'
import { capitalize } from 'lodash-es'
import { Button, ButtonVariation, Layout, Text, Popover, Icon } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { PopoverInteractionKind, Classes, Position } from '@blueprintjs/core'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { useGetCommunity } from '@common/utils/utils'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useStrings } from 'framework/strings'
import Feedback from './Feedback'
import { getMenuItems } from './ResourceCenterUtil'
import css from './ResourceCenter.module.scss'

const CommunitySubmitTicket: React.FC = () => {
  const { getString } = useStrings()

  const tooltip = (
    <Layout.Vertical className={css.communityTooltip} spacing={'medium'} padding={'medium'}>
      <Text
        icon="flash"
        color={Color.ORANGE_800}
        font={{ variation: FontVariation.FORM_MESSAGE_WARNING, weight: 'bold' }}
        iconProps={{ color: Color.ORANGE_800, size: 25 }}
        padding={{ bottom: 'xsmall' }}
      >
        {getString('common.levelUp')}
      </Text>
      <Text color={Color.WHITE}>{getString('common.resourceCenter.communityLevelUp')}</Text>
      <Button
        variation={ButtonVariation.PRIMARY}
        width={'fit-content'}
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          window.open('https://harness.io/pricing/?module=cd', '_blank')
        }}
      >
        {getString('common.explorePlans')}
      </Button>
    </Layout.Vertical>
  )

  return (
    <Popover
      openOnTargetFocus={false}
      fill
      usePortal
      hoverCloseDelay={50}
      interactionKind={PopoverInteractionKind.HOVER}
      content={tooltip}
      position={Position.RIGHT}
      className={Classes.DARK}
    >
      <Layout.Horizontal
        padding={'xlarge'}
        className={cx(css.middleregion, css.onHover)}
        flex={{ justifyContent: 'space-between' }}
      >
        <Layout.Vertical>
          <Text
            font={{ variation: FontVariation.H4 }}
            padding={{ bottom: 'xsmall' }}
            color={Color.GREY_300}
            icon="flash"
            iconProps={{ padding: { right: 'medium' }, size: 25 }}
          >
            {capitalize(getString('common.contactSupport'))}
          </Text>
          <Text font={{ variation: FontVariation.BODY2 }} padding={{ bottom: 'xsmall' }} color={Color.GREY_300}>
            {getString('common.resourceCenter.ticketmenu.submitDesc')}
          </Text>
        </Layout.Vertical>
        <Icon name="chevron-right" color={Color.GREY_300} />
      </Layout.Horizontal>
    </Popover>
  )
}

interface MenuItemsProps {
  closeResourceCenter: () => void
}

const timestamp = moment.now()
const HARNESS_SUPPORT_LINK =
  '/sso.html?action=login&brand_id=114095000394&locale_id=1&return_to=https%3A%2F%2Fsupport.harness.io%2Fhc%2Fen-us%2Frequests&src=zendesk&timestamp=' +
  timestamp

const MenuItems: React.FC<MenuItemsProps> = ({ closeResourceCenter }: MenuItemsProps) => {
  const { getString } = useStrings()
  const isCommunity = useGetCommunity()
  const { SHOW_NG_REFINER_FEEDBACK } = useFeatureFlags()
  const { currentUserInfo } = useAppStore()
  const openZendeskSupport = (e: React.MouseEvent<Element, MouseEvent>): void => {
    e.stopPropagation()
    e.preventDefault()
    window.open(HARNESS_SUPPORT_LINK)
  }
  const openFileATicket = (e: React.MouseEvent<Element, MouseEvent>): void => {
    e.stopPropagation()
    e.preventDefault()
    window.Saber.do('set_options', {
      feedback_values: {
        Email: currentUserInfo.email // set default value for email field
      }
    })
    closeResourceCenter()
    window.Saber.do('open')
  }

  return isCommunity ? (
    <CommunitySubmitTicket />
  ) : (
    <Layout.Vertical padding={'xlarge'} className={css.middleregion}>
      {SHOW_NG_REFINER_FEEDBACK && <Feedback label={getString('common.resourceCenter.feedback.submit')} />}
      <Layout.Horizontal
        padding={SHOW_NG_REFINER_FEEDBACK ? { top: 'medium' } : {}}
        flex={{ justifyContent: 'space-between' }}
      >
        {getMenuItems({
          title: capitalize(getString('common.contactSupport')),
          description: getString('common.resourceCenter.ticketmenu.submitDesc'),
          onClick: e => {
            openFileATicket(e)
          }
        })}
      </Layout.Horizontal>
      <Layout.Horizontal padding={{ top: 'medium' }} flex={{ justifyContent: 'space-between' }}>
        {getMenuItems({
          title: getString('common.resourceCenter.ticketmenu.tickets'),
          description: getString('common.resourceCenter.ticketmenu.ticketsDesc'),
          onClick: e => {
            openZendeskSupport(e)
          }
        })}
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

export default MenuItems
