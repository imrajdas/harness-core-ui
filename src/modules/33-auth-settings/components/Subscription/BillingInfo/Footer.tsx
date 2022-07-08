/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Layout, Button, ButtonVariation, useToaster } from '@harness/uicore'
import { useParams } from 'react-router-dom'
import { useStripe, useElements } from '@stripe/react-stripe-js'
import { getErrorMessage } from '@auth-settings/utils'
import { useStrings } from 'framework/strings'
import { useUpdateBilling, useUpdateSubscription, InvoiceDetailDTO } from 'services/cd-ng/index'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { SubscribeViews, BillingContactProps, PaymentMethodProps } from '@common/constants/SubscriptionTypes'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'

interface FooterProps {
  setView: (view: SubscribeViews) => void
  billingInfo: BillingContactProps
  nameOnCard?: string
  subscriptionId: string
  setInvoiceData: (value: InvoiceDetailDTO) => void
  setBillingContactInfo: (value: BillingContactProps) => void
  setPaymentMethodInfo: (value: PaymentMethodProps) => void
}

export const Footer: React.FC<FooterProps> = ({
  setView,
  billingInfo,
  nameOnCard = '',
  subscriptionId,
  setInvoiceData,
  setBillingContactInfo,
  setPaymentMethodInfo
}) => {
  const { getString } = useStrings()
  const stripe = useStripe()
  const elements = useElements()
  const { showError } = useToaster()
  const { accountId } = useParams<AccountPathProps>()

  const [loading, setLoading] = useState<boolean>(false)
  const { mutate: updateBilling } = useUpdateBilling({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { mutate: updateSubscription } = useUpdateSubscription({
    queryParams: {
      accountIdentifier: accountId
    },
    subscriptionId
  })

  async function handleNext(): Promise<void> {
    const paymentElement = elements?.getElement('card')
    const { email, country, zipCode, billingAddress, city, state, companyName } = billingInfo

    if (!stripe || !paymentElement) {
      return
    }

    setLoading(true)

    try {
      // 1, create credit card;
      const res = await stripe?.createPaymentMethod({
        type: 'card',
        card: paymentElement,
        billing_details: {
          name: nameOnCard,
          email,
          address: {
            city,
            country,
            line1: billingAddress,
            postal_code: zipCode,
            state
          }
        }
      })

      if (res.paymentMethod?.id) {
        const { name, address } = res.paymentMethod.billing_details
        // save billing contact info and payment method info into state
        setBillingContactInfo({
          name: name || '',
          email: res.paymentMethod.billing_details.email || '',
          billingAddress: address?.line1 || '',
          city: address?.city || '',
          state: address?.state || '',
          country: address?.country || '',
          zipCode: address?.postal_code || '',
          companyName
        })
        setPaymentMethodInfo({
          paymentMethodId: res.paymentMethod.id,
          cardType: res.paymentMethod.card?.brand || '',
          expireDate: `${res.paymentMethod.card?.exp_month}/${res.paymentMethod.card?.exp_year}`,
          last4digits: res.paymentMethod.card?.last4 || '',
          nameOnCard
        })
        // 2, call api to link credit card to customer;
        await updateBilling({
          city,
          country,
          creditCardId: res.paymentMethod?.id,
          line1: billingAddress,
          state,
          zipCode
        })

        // 3, update subscription with paymentMethodId
        const newInvoiceData = await updateSubscription({
          paymentMethodId: res.paymentMethod?.id
        })
        setInvoiceData(newInvoiceData.data?.latestInvoiceDetail || {})
      }
      setView(SubscribeViews.FINALREVIEW)
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  function handleBack(): void {
    setView(SubscribeViews.CALCULATE)
  }

  if (loading) {
    return <ContainerSpinner />
  }

  return (
    <Layout.Horizontal spacing="small">
      <Button variation={ButtonVariation.SECONDARY} onClick={handleBack} icon="chevron-left" disabled={loading}>
        {getString('back')}
      </Button>
      <Button variation={ButtonVariation.PRIMARY} onClick={handleNext} rightIcon="chevron-right" disabled={loading}>
        {getString('authSettings.billing.next')}
      </Button>
    </Layout.Horizontal>
  )
}
