/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Layout, Button, ButtonVariation, useToaster } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { usePayInvoice } from 'services/cd-ng/index'
import { SubscribeViews } from '@common/constants/SubscriptionTypes'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'

interface FooterProps {
  setView: (view: SubscribeViews) => void
  invoiceId?: string
}

export const Footer: React.FC<FooterProps> = ({ setView, invoiceId = '' }) => {
  const { getString } = useStrings()
  const { showError } = useToaster()
  const [loading, setLoading] = useState<boolean>(false)

  const { mutate: payInvoice } = usePayInvoice({
    queryParams: {
      invoiceId
    },
    requestOptions: {
      headers: {
        'content-type': 'application/json'
      }
    }
  })

  function handleBack(): void {
    setView(SubscribeViews.BILLINGINFO)
  }

  async function handleNext(): Promise<void> {
    setLoading(true)
    try {
      await payInvoice()
      setView(SubscribeViews.SUCCESS)
    } catch (err) {
      showError(err?.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <ContainerSpinner />
  }

  return (
    <Layout.Horizontal>
      <Layout.Horizontal spacing={'large'}>
        <Button variation={ButtonVariation.SECONDARY} onClick={handleBack} icon={'chevron-left'}>
          {getString('back')}
        </Button>
        <Button
          variation={ButtonVariation.PRIMARY}
          onClick={() => {
            handleNext()
          }}
        >
          {getString('authSettings.finalReview.subscribeNPay')}
        </Button>
      </Layout.Horizontal>
    </Layout.Horizontal>
  )
}
