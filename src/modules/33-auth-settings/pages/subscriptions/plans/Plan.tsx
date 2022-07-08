/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { isEmpty } from 'lodash-es'
import { Position, PopoverInteractionKind, Classes } from '@blueprintjs/core'
import { Color } from '@harness/design-system'
import { Card, Layout, Text, PageSpinner, Popover } from '@wings-software/uicore'
import cx from 'classnames'
import { useContactSalesMktoModal } from '@common/modals/ContactSales/useContactSalesMktoModal'
import { useStrings } from 'framework/strings'
import type { ModuleName } from 'framework/types/ModuleName'
import SvgInline from '@common/components/SvgInline/SvgInline'
import type { TimeType } from '@common/constants/SubscriptionTypes'
import { getBtns, getPriceTips, getPrice } from './planUtils'
import type { PlanData } from './planUtils'
import CurrentPlanHeader from './CurrentPlanHeader'
import css from './Plan.module.scss'
interface PlanProps {
  plan: PlanData
  timeType: TimeType
  module: ModuleName
}

const CENTER_CENTER = 'center-center'
const CUSTOM_PRICING = 'custom pricing'

const textColorMap: Record<string, string> = {
  cd: css.cdColor,
  ce: css.ccmColor,
  cf: css.ffColor,
  ci: css.ciColor
}

const borderMap: Record<string, string> = {
  cd: css.cdBorder,
  ce: css.ccmBorder,
  cf: css.ffBorder,
  ci: css.ciBorder
}

const Plan: React.FC<PlanProps> = ({ plan, timeType, module }) => {
  const { planProps, btnProps } = plan
  const url = `https://cms.harness.io${planProps?.img?.url}`
  const hasUnit = !isEmpty(planProps?.unit) && planProps?.price?.toLowerCase() !== CUSTOM_PRICING

  const { openMarketoContactSales, loading: loadingContactSales } = useContactSalesMktoModal({})
  const { getString } = useStrings()

  const { isCurrentPlan, isTrial, isPaid } = plan?.currentPlanProps || {}
  const { planDisabledStr } = btnProps?.find(btnProp => btnProp.planDisabledStr) || {}
  const isPlanDisabled = planDisabledStr !== undefined

  const moduleStr = module.toLowerCase()
  const currentPlanClassName = isCurrentPlan ? css.currentPlan : undefined
  const currentPlanBodyClassName = isCurrentPlan ? css.currentPlanBody : undefined
  const iConClassName = cx(css.icon, textColorMap[moduleStr])
  const textColorClassName = textColorMap[moduleStr]
  const borderClassName = isCurrentPlan ? borderMap[moduleStr] : undefined

  if (loadingContactSales) {
    return <PageSpinner />
  }

  const toolTip = planDisabledStr && (
    <Layout.Vertical padding="medium" className={css.tooltip}>
      <Text color={Color.WHITE} padding={{ bottom: 'small' }}>
        {planDisabledStr}
      </Text>
    </Layout.Vertical>
  )

  return (
    <Card className={cx(css.plan, currentPlanClassName, borderClassName)} disabled={isPlanDisabled}>
      <Layout.Vertical flex={{ align: CENTER_CENTER }}>
        <CurrentPlanHeader
          isTrial={isTrial}
          isPaid={isPaid}
          timeType={timeType}
          module={module}
          isCurrentPlan={isCurrentPlan}
        />
        <Layout.Vertical
          flex={{ align: CENTER_CENTER }}
          spacing="large"
          padding={{ top: 'xxlarge' }}
          className={currentPlanBodyClassName}
        >
          <SvgInline url={url} className={iConClassName} />
          <Popover
            interactionKind={PopoverInteractionKind.HOVER}
            content={toolTip}
            popoverClassName={Classes.DARK}
            position={Position.BOTTOM}
          >
            <Text font={{ weight: 'semi-bold', size: 'medium' }} className={textColorClassName}>
              {planProps?.title}
            </Text>
          </Popover>
          <Layout.Vertical padding={{ top: 'large' }} flex={{ align: CENTER_CENTER }} spacing="medium">
            <Layout.Horizontal spacing="small">
              {getPrice({ timeType, plan, openMarketoContactSales, getString })}
              {hasUnit && (
                <Layout.Vertical padding={{ left: 'small' }} flex={{ justifyContent: 'center', alignItems: 'start' }}>
                  <Popover
                    popoverClassName={Classes.DARK}
                    position={Position.BOTTOM}
                    interactionKind={PopoverInteractionKind.HOVER}
                    content={
                      <Text width={200} padding="medium" color={Color.WHITE}>
                        {planProps?.unitTips || ''}
                      </Text>
                    }
                  >
                    <Text font={{ size: 'small' }} className={textColorClassName}>
                      {planProps?.unit}
                    </Text>
                  </Popover>
                  <Text font={{ size: 'small' }} color={Color.BLACK}>
                    {getString('common.perMonth')}
                  </Text>
                </Layout.Vertical>
              )}
            </Layout.Horizontal>
            {getPriceTips({ timeType, plan, textColorClassName })}
          </Layout.Vertical>
          {getBtns({ isPlanDisabled, btnProps, getString })}
          <Text color={Color.BLACK} padding="large" className={css.desc}>
            {planProps?.desc}
          </Text>
          <ul className={css.ul}>
            {planProps?.featureListZone?.map(feature => (
              <li key={feature?.title} className={css.li}>
                <Text>{feature?.title}</Text>
              </li>
            ))}
          </ul>
          <Text className={css.support}>{planProps?.support}</Text>
        </Layout.Vertical>
      </Layout.Vertical>
    </Card>
  )
}

export default Plan
