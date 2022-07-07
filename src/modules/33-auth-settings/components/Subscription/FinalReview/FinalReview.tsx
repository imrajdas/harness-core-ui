/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout } from '@harness/uicore'
import type { SubscribeViews, SubscriptionProps } from '@common/constants/SubscriptionTypes'
import type { InvoiceDetailDTO } from 'services/cd-ng/index'
import BillingContactCard from './BillingContactCard'
import SubscriptionDetailsCard from './SubscriptionDetailsCard'
import PaymentMethodCard from './PaymentMethodCard'
import { Footer } from './Footer'
import { Header } from '../Header'
import css from './FinalReview.module.scss'

interface FinalReviewProps {
  setView: (view: SubscribeViews) => void
  invoiceData?: InvoiceDetailDTO
  subscriptionProps: SubscriptionProps
  className: string
}
export const FinalReview: React.FC<FinalReviewProps> = ({ setView, invoiceData, subscriptionProps, className }) => {
  const items =
    invoiceData?.items?.reduce((acc: string[], curr) => {
      acc.push(`${curr.quantity} ${curr.description}`)
      return acc
    }, []) || []
  return (
    <Layout.Vertical className={className}>
      <Header step={3} />
      <Layout.Vertical padding={{ top: 'large', bottom: 'large' }} spacing={'large'} className={css.body}>
        <SubscriptionDetailsCard items={items} newPlan={subscriptionProps.edition} setView={setView} />
        <BillingContactCard billingContactInfo={subscriptionProps.billingContactInfo} setView={setView} />
        <PaymentMethodCard paymentMethodInfo={subscriptionProps.paymentMethodInfo} setView={setView} />
      </Layout.Vertical>
      <Footer setView={setView} invoiceId={invoiceData?.invoiceId} />
    </Layout.Vertical>
  )
}
