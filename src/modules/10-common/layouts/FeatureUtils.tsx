/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Button, ButtonVariation, Layout, ButtonSize, Text } from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { capitalize } from 'lodash-es'
import cx from 'classnames'
import routes from '@common/RouteDefinitions'

import type { AccountPathProps, Module } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { SubscriptionTabNames } from '@common/constants/SubscriptionTypes'
import css from './layouts.module.scss'

function goToPage(e: React.MouseEvent<Element, MouseEvent>, pushToPage: () => void): void {
  e.preventDefault()
  e.stopPropagation()
  pushToPage()
}

export const InfoText = ({ message }: { message: React.ReactNode }): React.ReactElement => {
  return (
    <Text
      icon="info-message"
      color={Color.PRIMARY_10}
      font={{ variation: FontVariation.FORM_MESSAGE_WARNING }}
      iconProps={{ padding: { right: 'medium' }, size: 25, className: css.infoIcon }}
      padding={{ right: 'small' }}
    >
      {message}
    </Text>
  )
}

export const OverUseInfoText = ({ message }: { message: React.ReactNode }): React.ReactElement => {
  const { getString } = useStrings()
  return (
    <Layout.Horizontal flex={{ alignItems: 'center' }} padding={{ right: 'small' }}>
      <Text
        icon="warning-sign"
        color={Color.PRIMARY_10}
        font={{ variation: FontVariation.FORM_MESSAGE_WARNING, weight: 'bold' }}
        iconProps={{ size: 25, color: Color.YELLOW_900 }}
        padding={{ right: 'medium' }}
      >
        {getString('common.overuse')}
      </Text>
      <Text color={Color.PRIMARY_10} font={{ variation: FontVariation.SMALL }}>
        {message}
      </Text>
    </Layout.Horizontal>
  )
}

export const LevelUpText = ({ message }: { message: React.ReactNode }): React.ReactElement => {
  const { getString } = useStrings()
  return (
    <Layout.Horizontal flex={{ alignItems: 'center' }} padding={{ right: 'small' }}>
      <Text
        icon="flash"
        color={Color.ORANGE_800}
        font={{ variation: FontVariation.FORM_MESSAGE_WARNING, weight: 'bold' }}
        iconProps={{ color: Color.ORANGE_800, size: 25 }}
        padding={{ right: 'medium' }}
        className={css.btn}
      >
        {getString('common.levelUp')}
      </Text>
      <Text color={Color.PRIMARY_10} font={{ variation: FontVariation.SMALL }}>
        {message}
      </Text>
    </Layout.Horizontal>
  )
}

export const ManageSubscriptionBtn = ({
  size,
  variation = ButtonVariation.SECONDARY,
  module
}: {
  size?: ButtonSize
  variation?: ButtonVariation
  module?: Module
}): React.ReactElement => {
  const { getString } = useStrings()
  const history = useHistory()
  const { accountId } = useParams<AccountPathProps>()
  return (
    <Button
      variation={variation}
      size={size || ButtonSize.SMALL}
      onClick={(e: React.MouseEvent<Element, MouseEvent>) =>
        goToPage(e, () =>
          history.push(routes.toSubscriptions({ accountId, moduleCard: module, tab: SubscriptionTabNames.OVERVIEW }))
        )
      }
      width={'fit-content'}
      className={css.btn}
    >
      {getString('common.manageSubscription')}
    </Button>
  )
}

export const ExplorePlansBtn = ({
  size,
  module,
  variation = ButtonVariation.SECONDARY
}: {
  size?: ButtonSize
  module?: Module
  variation?: ButtonVariation
}): React.ReactElement => {
  const { getString } = useStrings()
  const history = useHistory()
  const { accountId } = useParams<AccountPathProps>()
  return (
    <Button
      variation={variation}
      size={size || ButtonSize.SMALL}
      onClick={(e: React.MouseEvent<Element, MouseEvent>) =>
        goToPage(e, () =>
          history.push(routes.toSubscriptions({ accountId, moduleCard: module, tab: SubscriptionTabNames.PLANS }))
        )
      }
      width={'fit-content'}
      className={css.btn}
    >
      {getString('common.explorePlans')}
    </Button>
  )
}

export const ViewUsageLink = ({
  size,
  module,
  className
}: {
  size?: ButtonSize
  className?: string
  module: Module
}): React.ReactElement => {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  const history = useHistory()
  return (
    <Button
      data-name="view-usage-link"
      variation={ButtonVariation.LINK}
      size={size || ButtonSize.SMALL}
      onClick={(e: React.MouseEvent<Element, MouseEvent>) =>
        goToPage(e, () =>
          history.push(routes.toSubscriptions({ accountId, moduleCard: module, tab: SubscriptionTabNames.OVERVIEW }))
        )
      }
      className={cx(css.btn, className)}
    >
      {capitalize(getString('common.viewUsage'))}
    </Button>
  )
}
