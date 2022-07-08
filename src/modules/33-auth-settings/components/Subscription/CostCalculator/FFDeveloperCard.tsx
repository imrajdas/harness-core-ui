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
import { Editions, CurrencyType } from '@common/constants/SubscriptionTypes'
import { getAmountInCurrency } from '@auth-settings/utils'
import SliderBar from './SliderBar'
import css from './CostCalculator.module.scss'

const Header: React.FC<{ unitPrice: number }> = ({ unitPrice }) => {
  const { getString } = useStrings()
  const unitPriceDescr = `${getString('authSettings.unitPrice')}: ${getAmountInCurrency(
    CurrencyType.USD,
    unitPrice
  )} ${getString('common.perDeveloper')} ${getString('common.perMonth')}`
  return (
    <Layout.Vertical padding={{ bottom: 'medium' }}>
      <Text font={{ variation: FontVariation.H5 }}>{getString('authSettings.costCalculator.developer.title')}</Text>
      <Layout.Horizontal spacing={'small'}>
        <Text color={Color.PRIMARY_7} font={{ size: 'xsmall' }}>
          {getString('authSettings.costCalculator.developer.developer')}
        </Text>
        <Text font={{ size: 'xsmall' }}>{unitPriceDescr}</Text>
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

interface DeveloperSubscriptionInfoProps {
  currentSubscribed: number
  usage: number
  currentPlan: Editions
}

export const Item: React.FC<{ title: string; value: React.ReactElement }> = ({ title, value }) => {
  return (
    <Layout.Vertical spacing={'medium'}>
      <Text>{title}</Text>
      {value}
    </Layout.Vertical>
  )
}

const DeveloperSubscriptionInfo: React.FC<DeveloperSubscriptionInfoProps> = ({
  currentSubscribed,
  usage,
  currentPlan
}) => {
  const { getString } = useStrings()
  const currentPlanDescr = (
    <Layout.Horizontal spacing={'small'} flex={{ alignItems: 'baseline', justifyContent: 'start' }}>
      <Text font={{ weight: 'bold' }}>{currentSubscribed}</Text>
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
        value={<Text font={{ weight: 'bold' }}>{usage}</Text>}
      />
      <Item
        title={getString('authSettings.recomendation')}
        value={
          <Text color={Color.PRIMARY_7} font={{ weight: 'bold' }}>
            {recommended}
          </Text>
        }
      />
    </Layout.Horizontal>
  )
}

interface FFDeveloperCardProps {
  unitPrice: number
  currentSubscribed: number
  usage: number
  currentPlan: Editions
  newPlan: Editions
  toggledNumberOfDevelopers?: number
  setNumberOfDevelopers: (value: number) => void
}

const FFDeveloperCard: React.FC<FFDeveloperCardProps> = ({
  unitPrice,
  currentSubscribed,
  usage,
  currentPlan,
  newPlan,
  toggledNumberOfDevelopers,
  setNumberOfDevelopers
}) => {
  const numberOfDevelopers = toggledNumberOfDevelopers || usage
  const [licenseRange, setLicensesRange] = useState<{
    min: number
    max: number
    stepSize: number
    labelStepSize: number
  }>({ min: 0, max: 0, stepSize: 1, labelStepSize: 1 })

  useEffect(() => {
    // TODO: get tier from prices api call
    if (newPlan === Editions.TEAM) {
      setLicensesRange({
        min: 0,
        max: 50,
        stepSize: 1,
        labelStepSize: 10
      })
    } else {
      setLicensesRange({
        min: 25,
        max: 100,
        stepSize: 1,
        labelStepSize: 25
      })
    }
  }, [newPlan])

  return (
    <Card>
      <Layout.Vertical>
        <Header unitPrice={unitPrice} />
        <DeveloperSubscriptionInfo currentSubscribed={currentSubscribed} usage={usage} currentPlan={currentPlan} />
        <SliderBar
          min={licenseRange.min}
          max={licenseRange.max}
          stepSize={licenseRange.stepSize}
          labelStepSize={licenseRange.labelStepSize}
          value={numberOfDevelopers}
          setValue={setNumberOfDevelopers}
        />
      </Layout.Vertical>
    </Card>
  )
}

export default FFDeveloperCard
