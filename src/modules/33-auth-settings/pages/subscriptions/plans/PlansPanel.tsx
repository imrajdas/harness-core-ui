/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Color } from '@harness/design-system'
import { Layout, Text } from '@wings-software/uicore'
import cx from 'classnames'
import { useStrings } from 'framework/strings'
import type { FetchPlansQuery } from 'services/common/services'
import type { ModuleName } from 'framework/types/ModuleName'
import { TimeType } from '@common/constants/SubscriptionTypes'
import PlanContainer from './PlanContainer'
import css from './Plans.module.scss'

interface PlansPanelProps {
  module: ModuleName
  plans?: NonNullable<FetchPlansQuery['pricing']>['ciSaasPlans' | 'ffPlans' | 'cdPlans' | 'ccPlans']
}

const PlansPanel: React.FC<PlansPanelProps> = ({ plans, module }) => {
  const { getString } = useStrings()
  const [timeType, setTimeType] = useState<TimeType>(TimeType.YEARLY)
  const yearlySelected = timeType === TimeType.YEARLY ? css.selected : ''
  const monthlySelected = timeType === TimeType.MONTHLY ? css.selected : ''
  if (plans) {
    return (
      <Layout.Vertical>
        <Layout.Horizontal flex={{ justifyContent: 'flex-end', alignItems: 'baseline' }}>
          <Text padding={{ right: 'medium', top: 'small' }}>{getString('common.billed')}</Text>
          <Text
            color={Color.PRIMARY_6}
            padding={{ left: 'medium', right: 'medium', top: 'small', bottom: 'small' }}
            className={cx(css.yearly, yearlySelected)}
            onClick={() => setTimeType(TimeType.YEARLY)}
          >
            {getString('common.yearly')}
          </Text>
          <Text
            color={Color.PRIMARY_6}
            padding={{ left: 'medium', right: 'medium', top: 'small', bottom: 'small' }}
            className={cx(css.monthly, monthlySelected)}
            onClick={() => setTimeType(TimeType.MONTHLY)}
          >
            {getString('common.monthly')}
          </Text>
        </Layout.Horizontal>
        {timeType === TimeType.YEARLY ? (
          <PlanContainer plans={plans} timeType={TimeType.YEARLY} moduleName={module} />
        ) : (
          <PlanContainer plans={plans} timeType={TimeType.MONTHLY} moduleName={module} />
        )}
      </Layout.Vertical>
    )
  }
  return <></>
}

export default PlansPanel
