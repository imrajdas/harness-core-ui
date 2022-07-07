/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, ButtonVariation } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { SubscribeViews } from '@common/constants/SubscriptionTypes'

interface FooterProps {
  disabled?: boolean
  setView: (view: SubscribeViews) => void
  createSubscription: () => Promise<void>
}

export const Footer: React.FC<FooterProps> = ({ disabled, setView, createSubscription }) => {
  const { getString } = useStrings()

  async function handleNext(): Promise<void> {
    await createSubscription()
    setView(SubscribeViews.BILLINGINFO)
  }

  return (
    <Button disabled={disabled} onClick={handleNext} variation={ButtonVariation.PRIMARY} rightIcon="chevron-right">
      {getString('authSettings.costCalculator.next')}
    </Button>
  )
}
