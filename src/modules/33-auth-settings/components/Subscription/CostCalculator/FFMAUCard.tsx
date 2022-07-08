/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { capitalize } from 'lodash-es'
import { Card, Layout, Text } from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { Editions, TimeType, CurrencyType } from '@common/constants/SubscriptionTypes'
import { getAmountInCurrency } from '@auth-settings/utils'
import { Item } from './FFDeveloperCard'
import SliderBar from './SliderBar'
import css from './CostCalculator.module.scss'

const Header: React.FC<{ unitPrice: number; paymentFreq: TimeType }> = ({ unitPrice, paymentFreq }) => {
  const { getString } = useStrings()
  const mauUnitDecr =
    paymentFreq === TimeType.MONTHLY
      ? `${getString('authSettings.costCalculator.mau.perkMau')} ${getString(
          'authSettings.costCalculator.mau.kMauFree'
        )}`
      : `${getString('authSettings.costCalculator.mau.permMau')} ${getString(
          'authSettings.costCalculator.mau.mMauFree'
        )}`
  const unitPriceDescr = `${getString('authSettings.unitPrice')}: ${getAmountInCurrency(
    CurrencyType.USD,
    unitPrice
  )} ${mauUnitDecr}`
  return (
    <Layout.Vertical padding={{ bottom: 'medium' }}>
      <Text font={{ variation: FontVariation.H5 }}>{getString('authSettings.costCalculator.mau.title')}</Text>
      <Layout.Horizontal spacing={'small'}>
        <Text color={Color.PRIMARY_7} font={{ size: 'xsmall' }}>
          {getString('authSettings.costCalculator.mau.mau')}
        </Text>
        <Text font={{ size: 'xsmall' }}>{unitPriceDescr}</Text>
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

interface MAUSubscriptionInfoProps {
  currentSubscribed: number
  usage: number
  currentPlan: Editions
}

const MAUSubscriptionInfo: React.FC<MAUSubscriptionInfoProps> = ({ currentSubscribed, usage, currentPlan }) => {
  const { getString } = useStrings()
  const currentPlanDescr = (
    <Layout.Horizontal spacing={'small'} flex={{ alignItems: 'baseline', justifyContent: 'start' }}>
      <Text font={{ weight: 'bold' }}>{currentSubscribed}k</Text>
      <Text color={Color.PRIMARY_7} font={{ size: 'xsmall', weight: 'bold' }}>
        {`${capitalize(currentPlan)} ${getString('common.subscriptions.overview.plan')}`}
      </Text>
    </Layout.Horizontal>
  )
  const recommended = Math.max(Math.ceil(usage * 1.2), currentSubscribed)
  return (
    <Layout.Horizontal flex={{ justifyContent: 'space-between' }} className={css.subscriptionInfo}>
      <Item title={getString('authSettings.costCalculator.currentSubscribed')} value={currentPlanDescr} />
      <Item
        title={getString('authSettings.costCalculator.using')}
        value={<Text font={{ weight: 'bold' }}>{usage}k</Text>}
      />
      <Item
        title={getString('authSettings.recomendation')}
        value={
          <Text color={Color.PRIMARY_7} font={{ weight: 'bold' }}>
            {recommended}k
          </Text>
        }
      />
    </Layout.Horizontal>
  )
}

interface FFMAUCardProps {
  unitPrice: number
  currentSubscribed: number
  usage: number
  currentPlan: Editions
  newPlan: Editions
  selectedNumberOfMAUs?: number
  paymentFreq: TimeType
  setNumberOfMAUs: (value: number) => void
}

const FFMAUCard: React.FC<FFMAUCardProps> = ({
  unitPrice,
  currentSubscribed,
  usage,
  currentPlan,
  newPlan,
  selectedNumberOfMAUs,
  setNumberOfMAUs,
  paymentFreq
}) => {
  const numberOfMAUs = selectedNumberOfMAUs || usage
  const [mausRange, setMausRange] = useState<{
    min: number
    max: number
    stepSize: number
    labelStepSize: number
    list: number[]
    unit: string
  }>({
    min: 0,
    max: 0,
    stepSize: 1,
    labelStepSize: 1,
    list: [],
    unit: ''
  })

  useEffect(() => {
    // TODO: get tier from prices api call
    if (newPlan === Editions.TEAM) {
      setMausRange({
        min: 0,
        max: 500,
        stepSize: 100,
        labelStepSize: 100,
        list: [100, 200, 300, 400, 500],
        unit: 'K'
      })
    } else {
      setMausRange({
        min: 0,
        max: 25,
        stepSize: 5,
        labelStepSize: 5,
        list: [0, 5, 10, 15, 20, 25],
        unit: 'M'
      })
    }
  }, [newPlan])

  return (
    <Card>
      <Layout.Vertical>
        <Header unitPrice={unitPrice} paymentFreq={paymentFreq} />
        <MAUSubscriptionInfo currentSubscribed={currentSubscribed} usage={usage} currentPlan={currentPlan} />
        <SliderBar
          min={mausRange.min}
          max={mausRange.max}
          stepSize={mausRange.stepSize}
          labelStepSize={mausRange.labelStepSize}
          list={mausRange.list}
          value={numberOfMAUs}
          setValue={setNumberOfMAUs}
          unit={mausRange.unit}
        />
      </Layout.Vertical>
    </Card>
  )
}

export default FFMAUCard
