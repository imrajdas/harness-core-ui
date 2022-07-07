/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, Text, TextInput, Card, FontVariation, Color } from '@harness/uicore'
import { CardElement } from '@stripe/react-stripe-js'
import { useStrings } from 'framework/strings'
import PowerByStripe from './img/power_by_stripe.png'
import css from './BillingInfo.module.scss'

interface PaymentMethodProps {
  nameOnCard: string
  setNameOnCard: (value: string) => void
}

const PaymentMethod: React.FC<PaymentMethodProps> = ({ nameOnCard, setNameOnCard }) => {
  const { getString } = useStrings()
  return (
    <Card>
      <Layout.Vertical>
        <Layout.Horizontal flex={{ alignItems: 'start', justifyContent: 'space-between' }}>
          <Layout.Vertical width={'40%'}>
            <Text padding={{ bottom: 'large' }} font={{ variation: FontVariation.H5 }}>
              {getString('authSettings.billingInfo.paymentMethod')}
            </Text>
            <Layout.Vertical>
              <Text padding={{ bottom: 'small' }}>{getString('common.nameOnCard')}</Text>
              <TextInput
                data-testid="nameOnCard"
                value={nameOnCard}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setNameOnCard(e.target.value)
                }}
              />
            </Layout.Vertical>
          </Layout.Vertical>
          <img src={PowerByStripe} alt="" aria-hidden className={css.powerByStripe} />
        </Layout.Horizontal>
        <Layout.Vertical width={'60%'}>
          <Text padding={{ bottom: 'small' }}>{getString('common.cardNumber')}</Text>
          <div className={css.creditCard}>
            <CardElement />
          </div>
        </Layout.Vertical>
        <Text icon="info" iconProps={{ color: Color.PRIMARY_7 }} padding="small" className={css.warning}>
          {getString('authSettings.billingInfo.saveCardWarning')}
        </Text>
      </Layout.Vertical>
    </Card>
  )
}

export default PaymentMethod
