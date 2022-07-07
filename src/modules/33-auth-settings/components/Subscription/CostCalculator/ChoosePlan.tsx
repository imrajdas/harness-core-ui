/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { capitalize } from 'lodash-es'
import { Link, useParams } from 'react-router-dom'
import { Color, FontVariation } from '@harness/design-system'
import { Text, Layout, PillToggle } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import type { Module } from 'framework/types/ModuleName'
import { Editions, SubscriptionTabNames } from '@common/constants/SubscriptionTypes'
import routes from '@common/RouteDefinitions'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import css from './CostCalculator.module.scss'

interface ChoosePlanProps {
  plan: Editions
  setPlan: (value: Editions) => void
  module: Module
}

const PlanToggle: React.FC<ChoosePlanProps> = ({ plan, setPlan, module }) => {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  return (
    <Layout.Horizontal spacing={'small'} flex={{ alignItems: 'center', justifyContent: 'start' }}>
      <PillToggle
        onChange={planClicked => setPlan(planClicked)}
        options={[
          { label: capitalize(Editions.TEAM), value: Editions.TEAM },
          {
            label: capitalize(Editions.ENTERPRISE),
            value: Editions.ENTERPRISE
          }
        ]}
        selectedView={plan}
        className={css.plan}
      />
      <Link
        to={routes.toSubscriptions({ accountId, moduleCard: module, tab: SubscriptionTabNames.PLANS })}
        target="_blank"
      >
        <Text color={Color.PRIMARY_7} font={{ size: 'xsmall' }}>
          {getString('authSettings.costCalculator.comparePlans')}
        </Text>
      </Link>
    </Layout.Horizontal>
  )
}

const ChoosePlan: React.FC<ChoosePlanProps> = ({ plan, module, setPlan }) => {
  const { getString } = useStrings()
  return (
    <Layout.Horizontal spacing={'medium'} flex={{ alignItems: 'center', justifyContent: 'start' }}>
      <Text font={{ variation: FontVariation.H4 }}>{getString('authSettings.choosePlan')}</Text>
      <PlanToggle plan={plan} module={module} setPlan={setPlan} />
    </Layout.Horizontal>
  )
}

export default ChoosePlan
