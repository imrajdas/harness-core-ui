/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, Text } from '@harness/uicore'
import type { StringsMap } from 'stringTypes'
import { useStrings } from 'framework/strings'
import { TimeType, CurrencyType } from '@common/constants/SubscriptionTypes'
import { getAmountInCurrency } from '@auth-settings/utils'
import css from './PricePreview.module.scss'

export interface LineProps {
  description: string
  unitPrice: number
  unitDescription?: string
  quantity?: number
  paymentFrequency: TimeType
  underComment?: string
}

export const PricePreviewLine: React.FC<LineProps> = ({
  description,
  unitPrice,
  unitDescription,
  underComment,
  quantity = 0,
  paymentFrequency
}) => {
  const { getString } = useStrings()

  const breakdownDescr = `${quantity} x ${getAmountInCurrency(CurrencyType.USD, unitPrice)} ${getString(
    unitDescription as keyof StringsMap
  )}`
  const monthlyAmount = quantity * unitPrice
  const yearlyAmount = paymentFrequency === TimeType.YEARLY ? monthlyAmount * 12 : undefined

  let unitDescr
  if (unitDescription && underComment) {
    unitDescr = (
      <Layout.Vertical>
        <Text>{breakdownDescr}</Text>
        <Text font={{ size: 'xsmall' }}>{getString(underComment as keyof StringsMap)}</Text>
      </Layout.Vertical>
    )
  } else if (unitDescription) {
    unitDescr = <Text>{breakdownDescr}</Text>
  }

  return (
    <Layout.Vertical className={css.line} padding={{ top: 'small', bottom: 'small' }}>
      <Layout.Horizontal flex={{ justifyContent: 'space-between' }} padding={{ bottom: 'small' }}>
        <Text font={{ weight: 'semi-bold' }}>{getString(description as keyof StringsMap)}</Text>
        <Text font={{ weight: 'semi-bold' }}>
          {getAmountInCurrency(CurrencyType.USD, monthlyAmount)}
          {getString('common.perMonth')}
        </Text>
      </Layout.Horizontal>
      <Layout.Horizontal flex={{ justifyContent: 'space-between', alignItems: 'start' }}>
        {unitDescr}
        {yearlyAmount && (
          <Text>
            {getAmountInCurrency(CurrencyType.USD, yearlyAmount)}
            {getString('common.perYear')}
          </Text>
        )}
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}
