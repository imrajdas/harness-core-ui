/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactElement } from 'react'
import { capitalize } from 'lodash-es'
import { Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import cx from 'classnames'
import { useStrings } from 'framework/strings'
import type { ModuleName } from 'framework/types/ModuleName'
import type { TimeType } from '@common/constants/SubscriptionTypes'
import css from './Plan.module.scss'

interface CurrentPlanHeaderProps {
  isTrial?: boolean
  isPaid?: boolean
  timeType: TimeType
  module: ModuleName
  isCurrentPlan?: boolean
}

const fillMap: Record<string, string> = {
  cd: css.cdFill,
  ce: css.ccmFill,
  cf: css.ffFill,
  ci: css.ciFill
}

const bgColorMap: Record<string, string> = {
  cd: css.cdBgColor,
  ce: css.ccmBgColor,
  cf: css.ffBgColor,
  ci: css.ciBgColor
}

const CurrentPlanHeader = ({
  isTrial,
  isPaid,
  timeType,
  module,
  isCurrentPlan
}: CurrentPlanHeaderProps): ReactElement => {
  const moduleStr = module.toLowerCase()
  const fillClassName = fillMap[moduleStr]
  const bgColorClassName = bgColorMap[moduleStr]
  const { getString } = useStrings()
  function getPlanHeaderStr(): string {
    const currentPlanStr = getString('common.plans.currentPlan')
    if (isTrial) {
      return currentPlanStr.concat(' (').concat(getString('common.plans.freeTrial')).concat(')')
    }

    if (isPaid) {
      return currentPlanStr
        .concat(' (')
        .concat(capitalize(timeType))
        .concat(' ')
        .concat(getString('common.plans.subscription'))
        .concat(')')
    }

    return currentPlanStr
  }

  return isCurrentPlan ? (
    <span className={cx(css.currentPlanHeader, bgColorClassName)}>
      <Text
        icon="deployment-success-legacy"
        iconProps={{ className: fillClassName }}
        color={Color.WHITE}
        flex={{ justifyContent: 'center' }}
      >
        {getPlanHeaderStr()}
      </Text>
    </span>
  ) : (
    <></>
  )
}

export default CurrentPlanHeader
