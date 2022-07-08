/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { capitalize } from 'lodash-es'
import { Layout, Card, Text, Button, ButtonVariation, FontVariation, Color } from '@harness/uicore'
import { Editions, SubscribeViews } from '@common/constants/SubscriptionTypes'
import { useStrings } from 'framework/strings'
import css from './FinalReview.module.scss'

interface SubscriptionDetailsCardProps {
  newPlan: Editions
  items: string[]
  setView: (view: SubscribeViews) => void
}
const SubscriptionDetailsCard: React.FC<SubscriptionDetailsCardProps> = ({ newPlan, items, setView }) => {
  const { getString } = useStrings()
  return (
    <Card>
      <Layout.Vertical>
        <Text font={{ variation: FontVariation.H5 }} padding={{ bottom: 'large' }}>
          {getString('common.subscriptions.overview.details')}
        </Text>
        <Layout.Horizontal flex={{ justifyContent: 'start', alignItems: 'baseline' }} padding={{ bottom: 'small' }}>
          <Text padding={{ right: 'small' }}>{getString('authSettings.finalReview.upgradeToPlan')}</Text>
          <Text color={Color.GREY_900} font={{ weight: 'semi-bold' }}>{` ${capitalize(newPlan)} ${getString(
            'common.subscriptions.overview.plan'
          )}`}</Text>
          <Button
            variation={ButtonVariation.LINK}
            onClick={() => {
              setView(SubscribeViews.CALCULATE)
            }}
          >
            {getString('edit')}
          </Button>
        </Layout.Horizontal>
        <ul className={css.ul}>
          {items.map(item => {
            return (
              <li key={item} className={css.li}>
                <Text>{item}</Text>
              </li>
            )
          })}
        </ul>
      </Layout.Vertical>
    </Card>
  )
}

export default SubscriptionDetailsCard
