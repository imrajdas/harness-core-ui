/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Layout, PageError, Container } from '@harness/uicore'
import { useParams } from 'react-router-dom'
import { isEmpty } from 'lodash-es'
import { getErrorMessage } from '@auth-settings/utils'
import type { Module, ModuleName } from 'framework/types/ModuleName'
import {
  InvoiceDetailDTO,
  useCreateFfSubscription,
  RetrieveProductPricesQueryParams,
  useRetrieveProductPrices
} from 'services/cd-ng/index'
import {
  Editions,
  SubscribeViews,
  SubscriptionProps,
  ProductPricesProp,
  TimeType,
  LookUpKeyType,
  LookUpKeyFrequencyType
} from '@common/constants/SubscriptionTypes'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useGetUsageAndLimit } from '@common/hooks/useGetUsageAndLimit'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { getCostCalculatorBodyByModule } from '@auth-settings/components/Subscription/subscriptionUtils'
import ChoosePlan from './ChoosePlan'
import { Footer } from './Footer'
import { PremiumSupport } from './PremiumSupport'
import { Header } from '../Header'
import css from './CostCalculator.module.scss'

interface CostCalculatorProps {
  module: Module
  setView: (view: SubscribeViews) => void
  setSubscriptionProps: (props: SubscriptionProps) => void
  subscriptionProps: SubscriptionProps
  setInvoiceData: (value: InvoiceDetailDTO) => void
  className: string
}

export const CostCalculator: React.FC<CostCalculatorProps> = ({
  module,
  setView,
  setSubscriptionProps,
  subscriptionProps,
  setInvoiceData,
  className
}) => {
  const { licenseInformation } = useLicenseStore()
  const currentPlan = (licenseInformation[module.toUpperCase()]?.edition || Editions.FREE) as Editions
  const usageAndLimitInfo = useGetUsageAndLimit(module.toUpperCase() as ModuleName)
  const { accountId } = useParams<AccountPathProps>()
  const [err, setErr] = useState<string>()

  const { mutate: createFFNewSubscription, loading: creatingNewSubscription } = useCreateFfSubscription({
    queryParams: { accountIdentifier: accountId }
  })

  const {
    data,
    loading: retrievingProductPrices,
    error: productPriceErr,
    refetch: retrieveProductPrices
  } = useRetrieveProductPrices({
    queryParams: {
      accountIdentifier: accountId,
      moduleType: module.toUpperCase() as RetrieveProductPricesQueryParams['moduleType']
    }
  })

  const prices = data?.data?.prices
  React.useMemo(() => {
    const newProductPrices: ProductPricesProp = { monthly: [], yearly: [] }
    if (prices) {
      prices.forEach(price => {
        if (price.lookupKey?.includes(LookUpKeyFrequencyType.MONTHLY)) {
          newProductPrices.monthly.push(price)
        }
        if (price.lookupKey?.includes(LookUpKeyFrequencyType.YEARLY)) {
          newProductPrices.yearly.push(price)
        }
        if (price.lookupKey === LookUpKeyType.PREMIUM_SUPPORT) {
          newProductPrices.yearly.push(price)
        }
      })
      setSubscriptionProps({
        ...subscriptionProps,
        productPrices: newProductPrices
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prices])

  async function createNewSubscription(): Promise<void> {
    try {
      // TODO: add a function to return create subscription function based of module
      const res = await createFFNewSubscription({
        accountId,
        edition: subscriptionProps.edition,
        paymentFreq: subscriptionProps.paymentFreq,
        premiumSupport: subscriptionProps.premiumSupport,
        ...subscriptionProps.quantities?.featureFlag
      })

      if (res.data) {
        setInvoiceData(res.data)
        setSubscriptionProps({
          ...subscriptionProps,
          subscriptionId: res.data.subscriptionId || ''
        })
      }
    } catch (error) {
      setErr(getErrorMessage(error))
    }
  }

  if (creatingNewSubscription || retrievingProductPrices) {
    return <ContainerSpinner />
  }

  if (productPriceErr) {
    return (
      <Container width={300}>
        <PageError message={productPriceErr.message} onClick={() => retrieveProductPrices()} />
      </Container>
    )
  }

  if (err) {
    return (
      <Container width={300}>
        <PageError message={err} onClick={createNewSubscription} />
      </Container>
    )
  }

  return (
    <Layout.Vertical className={className}>
      <Header step={1} />
      <Layout.Vertical padding={{ top: 'large', bottom: 'large' }} spacing={'large'} className={css.body}>
        <ChoosePlan
          plan={subscriptionProps.edition}
          module={module}
          setPlan={(value: Editions) => {
            setSubscriptionProps({
              ...subscriptionProps,
              edition: value
            })
          }}
        />
        {getCostCalculatorBodyByModule({
          module,
          currentPlan,
          usageAndLimitInfo,
          productPrices: subscriptionProps.productPrices,
          paymentFrequency: subscriptionProps.paymentFreq,
          subscriptionDetails: subscriptionProps,
          setSubscriptionDetails: setSubscriptionProps
        })}
        <PremiumSupport
          premiumSupport={subscriptionProps.premiumSupport}
          onChange={(value: boolean) => {
            setSubscriptionProps({
              ...subscriptionProps,
              premiumSupport: value
            })
          }}
          disabled={subscriptionProps.paymentFreq === TimeType.MONTHLY}
        />
      </Layout.Vertical>
      <Footer
        setView={setView}
        disabled={isEmpty(subscriptionProps.quantities)}
        createSubscription={createNewSubscription}
      />
    </Layout.Vertical>
  )
}
