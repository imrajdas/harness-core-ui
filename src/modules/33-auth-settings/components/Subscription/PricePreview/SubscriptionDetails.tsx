/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, Text } from '@harness/uicore'
import { capitalize } from 'lodash-es'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { SubscriptionProps, Product, CurrencyType } from '@common/constants/SubscriptionTypes'
import { getAmountInCurrency } from '@auth-settings/utils'
import { PricePreviewLine } from './PricePreviewLine'
import css from './PricePreview.module.scss'

interface SubscriptionDetailsProps {
  subscriptionDetails: SubscriptionProps
  taxAmount?: number
  premiumSupportAmount: number
  products: Product[]
}

const TaxLine: React.FC<{ taxAmount?: number }> = ({ taxAmount }) => {
  const { getString } = useStrings()
  const taxAmountDescr = taxAmount ? taxAmount / 100 : getString('authSettings.pricePreview.calculatedNextStep')
  return (
    <Layout.Horizontal
      flex={{ justifyContent: 'space-between' }}
      className={css.line}
      padding={{ top: 'small', bottom: 'small' }}
    >
      <Text>{getString('authSettings.costCalculator.tax')}</Text>
      <Text>{taxAmountDescr}</Text>
    </Layout.Horizontal>
  )
}

const PremiumSupportLine: React.FC<{ premiumSupportAmount: number }> = ({ premiumSupportAmount }) => {
  const { getString } = useStrings()
  const premiumSupportAmountDescr = premiumSupportAmount
    ? getAmountInCurrency(CurrencyType.USD, premiumSupportAmount)
    : getString('authSettings.pricePreview.calculatedNextStep')
  return (
    <Layout.Horizontal
      flex={{ justifyContent: 'space-between' }}
      className={css.line}
      padding={{ top: 'small', bottom: 'small' }}
    >
      <Text>{getString('authSettings.costCalculator.premiumSupport')}</Text>
      <Text>{premiumSupportAmountDescr}</Text>
    </Layout.Horizontal>
  )
}
const SubscriptionDetails: React.FC<SubscriptionDetailsProps> = ({
  taxAmount,
  subscriptionDetails,
  products,
  premiumSupportAmount
}) => {
  const { getString } = useStrings()
  const { premiumSupport } = subscriptionDetails
  return (
    <Layout.Vertical padding={{ bottom: 'large' }} spacing="large">
      <Text>{getString('common.subscriptions.overview.details')}</Text>
      <Text color={Color.BLACK} font={{ weight: 'bold' }}>{`${capitalize(subscriptionDetails.edition)} ${getString(
        'common.subscriptions.overview.plan'
      )}`}</Text>
      {products.map(product => {
        return <PricePreviewLine {...product} key={product.description} />
      })}
      {premiumSupport && <PremiumSupportLine premiumSupportAmount={premiumSupportAmount} />}
      <TaxLine taxAmount={taxAmount} />
    </Layout.Vertical>
  )
}

export default SubscriptionDetails
