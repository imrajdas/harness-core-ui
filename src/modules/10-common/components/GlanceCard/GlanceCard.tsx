/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory } from 'react-router-dom'
import cx from 'classnames'
import { Card, Text, Tag, Icon, IconName } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import css from './GlanceCard.module.scss'

export interface GlanceCardProps {
  title: string
  iconName: IconName
  iconSize?: number
  number?: number
  delta?: string
  href?: string
  styling?: boolean
  intent?: 'success' | 'danger'
}

const GlanceCard: React.FC<GlanceCardProps> = ({
  title,
  iconName,
  iconSize = 24,
  number,
  delta,
  href,
  styling = false,
  intent = 'success'
}) => {
  const history = useHistory()
  return (
    <Card
      interactive={!!href}
      className={cx(css.card, { [css.styledCard]: styling })}
      onClick={() => href && history.push(href)}
    >
      <Icon name={iconName} color={styling ? Color.PRIMARY_7 : Color.GREY_600} className={css.icon} size={iconSize} />
      <Text
        color={styling ? Color.PRIMARY_9 : Color.BLACK}
        font={{ variation: FontVariation.H3 }}
        className={cx(css.lineClamp, css.lineHeight, { [css.title]: styling })}
        lineClamp={number && number > 999 ? 1 : undefined}
      >
        {number?.toString() ?? 0}
      </Text>
      <Text
        color={styling ? Color.BLACK : Color.GREY_600}
        font={{ size: 'small', weight: 'semi-bold' }}
        margin={{ top: 'small' }}
        lineClamp={1}
        className={css.lineClamp}
      >
        {title}
      </Text>
      {delta ? (
        <Tag className={cx(css.tagClassName, { [css.redTag]: intent === 'danger' }, { [css.whiteTag]: styling })}>
          {delta}
        </Tag>
      ) : null}
    </Card>
  )
}

export default GlanceCard
