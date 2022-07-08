/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import { get } from 'lodash-es'
import { CurrencyType } from '@common/constants/SubscriptionTypes'

export function getAmountInCurrency(currency: CurrencyType, amount: number): string {
  switch (currency) {
    case CurrencyType.USD: {
      return amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      })
    }
  }

  return ''
}

export function getDollarAmount(amount?: number, isYearly?: boolean): number {
  if (isYearly) {
    return (amount || 0) / 1200
  }
  return (amount || 0) / 100
}

export const getErrorMessage = (error: any): string =>
  get(error, 'data.error', get(error, 'data.message', error?.message))
