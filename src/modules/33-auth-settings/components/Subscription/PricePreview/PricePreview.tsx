/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import cx from 'classnames'
import { Text, Layout, Toggle } from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { TimeType, SubscriptionProps, CurrencyType, LookUpKeyType } from '@common/constants/SubscriptionTypes'
import type { Module } from 'framework/types/ModuleName'
import { getAmountInCurrency, getDollarAmount } from '@auth-settings/utils'
import SubcriptionDetails from './SubscriptionDetails'
import { getRenewDate, getSubscriptionBreakdownsByModuleAndFrequency } from '../subscriptionUtils'
import css from './PricePreview.module.scss'

interface PricePreviewProps {
  subscriptionDetails: SubscriptionProps
  setSubscriptionDetails: (value: SubscriptionProps) => void
  module: Module
}

const PaymentFrequencyToggle: React.FC<{
  paymentFrequency: TimeType
  setPaymentFrequency: (value: TimeType) => void
}> = ({ paymentFrequency, setPaymentFrequency }) => {
  const { getString } = useStrings()
  const monthlyClassName = paymentFrequency === TimeType.MONTHLY ? css.selected : ''
  const yearlyClassName = paymentFrequency === TimeType.YEARLY ? css.selected : ''
  return (
    <Layout.Vertical padding={{ bottom: 'large' }} spacing="small">
      <Text>{getString('common.billed')}</Text>
      <Layout.Horizontal spacing="small" flex={{ alignItems: 'baseline', justifyContent: 'start' }}>
        <Text className={monthlyClassName}>{getString('common.monthly')}</Text>
        <Toggle
          data-testid="toggle"
          checked={paymentFrequency === TimeType.YEARLY}
          onToggle={isToggled => {
            setPaymentFrequency(isToggled ? TimeType.YEARLY : TimeType.MONTHLY)
          }}
          className={css.paymentFrequency}
        />
        <Layout.Horizontal>
          <Text className={yearlyClassName}>{getString('common.yearly')}</Text>
          <Text className={yearlyClassName}>{getString('authSettings.pricePreview.discount')}</Text>
        </Layout.Horizontal>
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

const Footer: React.FC<{ totalAmount: number; payingFrequency: TimeType }> = ({ totalAmount, payingFrequency }) => {
  const { getString } = useStrings()
  const frequency = payingFrequency === TimeType.MONTHLY ? getString('common.perMonth') : getString('common.perYear')
  const renewDate = getRenewDate(payingFrequency)
  return (
    <Layout.Vertical>
      <Layout.Horizontal flex={{ justifyContent: 'space-between' }}>
        <Text font={{ variation: FontVariation.H2 }}>{getString('total')}</Text>
        <Text font={{ variation: FontVariation.H2 }}>
          {getAmountInCurrency(CurrencyType.USD, totalAmount)}
          {frequency}
        </Text>
      </Layout.Horizontal>
      <Text font={{ size: 'xsmall' }}>{getString('authSettings.autoRenewal', { date: renewDate })}</Text>
    </Layout.Vertical>
  )
}

function getColorByModule(module: Module): string | undefined {
  switch (module) {
    case 'cf':
      return css.cf
  }
  return undefined
}

const PricePreview: React.FC<PricePreviewProps> = ({ module, subscriptionDetails, setSubscriptionDetails }) => {
  const { getString } = useStrings()
  const { paymentFreq, productPrices, premiumSupport } = subscriptionDetails
  const products = useMemo(() => {
    return getSubscriptionBreakdownsByModuleAndFrequency({ module, subscriptionDetails })
  }, [module, subscriptionDetails])
  const premiumSupportUnitPrice = getDollarAmount(
    productPrices.yearly.find(price => price.lookupKey === LookUpKeyType.PREMIUM_SUPPORT)?.unitAmount
  )
  const colorBorder = getColorByModule(module)
  const monthlyTotalAmount = products.reduce((total, curr) => {
    total += curr.quantity * curr.unitPrice
    return total
  }, 0)
  let totalAmount = monthlyTotalAmount
  if (paymentFreq === TimeType.YEARLY) {
    totalAmount = premiumSupport ? monthlyTotalAmount * 12 + premiumSupportUnitPrice : monthlyTotalAmount * 12
  }

  return (
    <Layout.Vertical className={cx(css.pricePreview, colorBorder)}>
      <Text font={{ variation: FontVariation.H4 }} padding={{ bottom: 'large' }}>
        {getString('authSettings.pricePreview.title')}
      </Text>
      <PaymentFrequencyToggle
        paymentFrequency={paymentFreq}
        setPaymentFrequency={(value: TimeType) => {
          if (value === TimeType.MONTHLY) {
            setSubscriptionDetails({
              ...subscriptionDetails,
              paymentFreq: value,
              premiumSupport: false
            })
          } else {
            setSubscriptionDetails({
              ...subscriptionDetails,
              paymentFreq: value
            })
          }
        }}
      />
      <SubcriptionDetails
        subscriptionDetails={subscriptionDetails}
        products={products}
        premiumSupportAmount={premiumSupportUnitPrice}
      />
      <Footer payingFrequency={paymentFreq} totalAmount={totalAmount} />
    </Layout.Vertical>
  )
}

export default PricePreview
