/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { CurrencyType } from '@common/constants/SubscriptionTypes'
import { getAmountInCurrency, getDollarAmount, getErrorMessage } from '../utils'

describe('utils', () => {
  test('getAmountInCurrency', () => {
    const res = getAmountInCurrency(CurrencyType.USD, 20)
    expect(res).toStrictEqual('$20.00')
  })

  test('getDollarAmount yearly', () => {
    const res = getDollarAmount(1200, true)
    expect(res).toStrictEqual(1)
  })

  test('getDollarAmount monthly', () => {
    const res = getDollarAmount(1200)
    expect(res).toStrictEqual(12)
  })

  test('getErrorMessage', () => {
    const res1 = getErrorMessage({
      data: {
        error: 'error1'
      }
    })
    expect(res1).toStrictEqual('error1')
    const res2 = getErrorMessage({
      data: {
        message: 'error2'
      }
    })
    expect(res2).toStrictEqual('error2')
  })
})
