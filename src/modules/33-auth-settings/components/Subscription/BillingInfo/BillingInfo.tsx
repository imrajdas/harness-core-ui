/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout } from '@harness/uicore'
import type {
  SubscribeViews,
  SubscriptionProps,
  BillingContactProps,
  PaymentMethodProps
} from '@common/constants/SubscriptionTypes'
import type { InvoiceDetailDTO } from 'services/cd-ng/index'
import { Footer } from './Footer'
import BillingContact from './BillingContact'
import PaymentMethod from './PaymentMethod'
import { Header } from '../Header'
import css from './BillingInfo.module.scss'

interface BillingInfoProp {
  subscriptionProps: SubscriptionProps
  setView: (view: SubscribeViews) => void
  setInvoiceData: (value: InvoiceDetailDTO) => void
  setSubscriptionProps: (props: SubscriptionProps) => void
  className: string
}

export const BillingInfo: React.FC<BillingInfoProp> = ({
  subscriptionProps,
  setView,
  setInvoiceData,
  setSubscriptionProps,
  className
}) => {
  return (
    <Layout.Vertical className={className}>
      <Header step={2} />
      <Layout.Vertical padding={{ top: 'large', bottom: 'large' }} spacing={'large'} className={css.body}>
        <BillingContact
          billingInfo={subscriptionProps.billingContactInfo}
          setBillingInfo={(value: BillingContactProps) => {
            setSubscriptionProps({
              ...subscriptionProps,
              billingContactInfo: value
            })
          }}
        />
        <PaymentMethod
          nameOnCard={subscriptionProps.paymentMethodInfo?.nameOnCard}
          setNameOnCard={(value: string) => {
            setSubscriptionProps({
              ...subscriptionProps,
              paymentMethodInfo: {
                ...subscriptionProps.paymentMethodInfo,
                nameOnCard: value
              }
            })
          }}
        />
      </Layout.Vertical>
      <Footer
        setView={setView}
        setInvoiceData={setInvoiceData}
        nameOnCard={subscriptionProps.paymentMethodInfo?.nameOnCard}
        billingInfo={subscriptionProps.billingContactInfo}
        subscriptionId={subscriptionProps.subscriptionId}
        setBillingContactInfo={(value: BillingContactProps) => {
          setSubscriptionProps({
            ...subscriptionProps,
            billingContactInfo: value
          })
        }}
        setPaymentMethodInfo={(value: PaymentMethodProps) => {
          setSubscriptionProps({
            ...subscriptionProps,
            paymentMethodInfo: value
          })
        }}
      />
    </Layout.Vertical>
  )
}
