/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { Editions, TimeType } from '@common/constants/SubscriptionTypes'
import {
  getRenewDate,
  getTiltleByModule,
  getSubscriptionBreakdownsByModuleAndFrequency,
  getProductPrices,
  getCostCalculatorBodyByModule
} from '../subscriptionUtils'

const billingContactInfo = {
  name: 'Jane Doe',
  email: 'jane.doe@test.com',
  billingAddress: 'billing address',
  city: 'dallas',
  state: 'TX',
  country: 'US',
  zipCode: '79809',
  companyName: 'Harness'
}

const paymentMethodInfo = {
  paymentMethodId: '1',
  cardType: 'visa',
  expireDate: 'Jan 30 2023',
  last4digits: '1234',
  nameOnCard: 'Jane Doe'
}

const productPrices = {
  monthly: [
    {
      priceId: 'price_1Kr5rQIqk5P9Eha3IB74lUSX',
      currency: 'usd',
      unitAmount: 100,
      lookupKey: 'FF_TEAM_MAU_MONTHLY',
      productId: 'prod_LYCFgTjtkejp0K',
      metaData: {
        type: 'MAUS'
      },
      active: true
    },
    {
      priceId: 'price_1Kr5rQIqk5P9Eha3IB74lUSz',
      currency: 'usd',
      unitAmount: 200,
      lookupKey: 'FF_TEAM_DEVELOPERS_MONTHLY',
      productId: 'prod_LYCFgTjtkejp0K',
      metaData: {
        type: 'DEVELOPERS'
      },
      active: true
    }
  ],
  yearly: [
    {
      priceId: 'price_1Kr5rQIqk5P9Eha3uzYZEPws',
      currency: 'usd',
      unitAmount: 300 * 12,
      lookupKey: 'FF_TEAM_MAU_YEARLY',
      productId: 'prod_LYCFgTjtkejp0K',
      metaData: {
        type: 'MAUS'
      },
      active: true
    },
    {
      priceId: 'price_1Kr5rQIqk5P9Eha3IB74lUSw',
      currency: 'usd',
      unitAmount: 400 * 12,
      lookupKey: 'FF_TEAM_DEVELOPERS_YEARLY',
      productId: 'prod_LYCFgTjtkejp0K',
      metaData: {
        type: 'DEVELOPERS'
      },
      active: true
    }
  ]
}

const subscriptionDetails = {
  edition: Editions.TEAM,
  premiumSupport: false,
  paymentFreq: TimeType.MONTHLY,
  subscriptionId: '1',
  billingContactInfo,
  paymentMethodInfo,
  productPrices,
  quantities: {
    featureFlag: {
      numberOfDevelopers: 25,
      numberOfMau: 12
    }
  }
}

describe('subscriptionUtils', () => {
  test('getRenewDate', () => {
    let today = new Date()
    const monthlyRenewDate = getRenewDate(TimeType.MONTHLY)
    const oneMonthLater = new Date(today.setMonth(today.getMonth() + 1)).toLocaleDateString('en-us', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    expect(monthlyRenewDate).toStrictEqual(oneMonthLater)

    today = new Date()
    const yearlyRenewDate = getRenewDate(TimeType.YEARLY)
    const oneYearLater = new Date(today.setFullYear(today.getFullYear() + 1)).toLocaleDateString('en-us', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    expect(yearlyRenewDate).toStrictEqual(oneYearLater)
  })

  describe('getProductPrices', () => {
    const newProductPrices = {
      monthly: [
        {
          unitAmount: 100,
          lookupKey: 'DEVELOPERS_ENTERPRISE'
        }
      ],
      yearly: [
        {
          unitAmount: 200,
          lookupKey: 'DEVELOPERS_ENTERPRISE'
        }
      ]
    }

    const newProductPrices2 = {
      monthly: [
        {
          unitAmount: 100,
          lookupKey: 'DEVELOPERS_TEAM'
        }
      ],
      yearly: [
        {
          unitAmount: 200,
          lookupKey: 'DEVELOPERS_TEAM'
        }
      ]
    }
    test('yearly', () => {
      const monthly = getProductPrices(Editions.ENTERPRISE, TimeType.YEARLY, newProductPrices)
      expect(monthly).toStrictEqual([
        {
          unitAmount: 200,
          lookupKey: 'DEVELOPERS_ENTERPRISE'
        }
      ])
    })

    test('yearly empty', () => {
      const monthly = getProductPrices(Editions.ENTERPRISE, TimeType.YEARLY, newProductPrices2)
      expect(monthly).toStrictEqual([])
    })

    test('monthly', () => {
      const monthly = getProductPrices(Editions.ENTERPRISE, TimeType.MONTHLY, newProductPrices)
      expect(monthly).toStrictEqual([
        {
          unitAmount: 100,
          lookupKey: 'DEVELOPERS_ENTERPRISE'
        }
      ])
    })
    test('monthly empty', () => {
      const monthly = getProductPrices(Editions.ENTERPRISE, TimeType.MONTHLY, newProductPrices2)
      expect(monthly).toStrictEqual([])
    })
  })

  describe('getTiltleByModule', () => {
    test('getTiltleByModule', () => {
      const cf = getTiltleByModule('cf')
      expect(cf).toStrictEqual({
        icon: 'ff-solid',
        description: 'common.purpose.cf.continuous'
      })

      const cd = getTiltleByModule('cd')
      expect(cd).toStrictEqual({
        icon: 'cd-solid',
        description: 'common.purpose.cd.continuous'
      })

      const ci = getTiltleByModule('ci')
      expect(ci).toStrictEqual({
        icon: 'ci-solid',
        description: 'common.purpose.ci.continuous'
      })

      const ce = getTiltleByModule('ce')
      expect(ce).toStrictEqual({
        icon: 'ccm-solid',
        description: 'common.purpose.ce.continuous'
      })

      const cv = getTiltleByModule('cv')
      expect(cv).toStrictEqual({
        icon: 'cv-solid',
        description: 'common.purpose.cv.continuous'
      })

      const sto = getTiltleByModule('sto')
      expect(sto).toStrictEqual({
        icon: 'sto-color-filled',
        description: 'common.purpose.sto.continuous'
      })
    })
  })

  describe('getCostCalculatorBodyByModule', () => {
    test('cf', async () => {
      const body = getCostCalculatorBodyByModule({
        module: 'cf',
        currentPlan: Editions.FREE,
        paymentFrequency: TimeType.YEARLY,
        productPrices,
        subscriptionDetails,
        setSubscriptionDetails: jest.fn(),
        usageAndLimitInfo: {
          limitData: {
            limit: {
              ff: {
                totalClientMAUs: 100,
                totalFeatureFlagUnits: 20
              }
            }
          },
          usageData: {
            usage: {
              ff: {
                activeClientMAUs: {
                  count: 1
                },
                activeFeatureFlagUsers: {
                  count: 1
                }
              }
            }
          }
        }
      })
      const { container } = render(<TestWrapper>{body}</TestWrapper>)
      await waitFor(() => {
        expect(container).toMatchSnapshot()
      })
    })

    test('cf monthly', async () => {
      const body = getCostCalculatorBodyByModule({
        module: 'cf',
        currentPlan: Editions.FREE,
        paymentFrequency: TimeType.MONTHLY,
        productPrices,
        subscriptionDetails: {
          ...subscriptionDetails,
          quantities: {}
        },
        setSubscriptionDetails: jest.fn(),
        usageAndLimitInfo: {
          limitData: {
            limit: {}
          },
          usageData: {
            usage: {
              ff: {}
            }
          }
        }
      })
      const { container } = render(<TestWrapper>{body}</TestWrapper>)
      await waitFor(() => {
        expect(container).toMatchSnapshot()
      })
    })

    test('default', async () => {
      const body = getCostCalculatorBodyByModule({
        module: 'cd',
        currentPlan: Editions.FREE,
        paymentFrequency: TimeType.YEARLY,
        productPrices,
        subscriptionDetails,
        setSubscriptionDetails: jest.fn(),
        usageAndLimitInfo: {
          limitData: {
            limit: {
              cd: {
                totalServiceInstances: 100,
                totalWorkload: 20
              }
            }
          },
          usageData: {
            usage: {
              cd: {
                activeServices: {
                  count: 1
                },
                activeServiceInstances: {
                  count: 1
                }
              }
            }
          }
        }
      })
      const { container } = render(<TestWrapper>{body}</TestWrapper>)
      await waitFor(() => {
        expect(container).toMatchSnapshot()
      })
    })
  })

  describe('getSubscriptionBreakdownsByModuleAndFrequency', () => {
    test('cf monthly', () => {
      const res = getSubscriptionBreakdownsByModuleAndFrequency({
        module: 'cf',
        subscriptionDetails
      })

      expect(res).toStrictEqual([
        {
          paymentFrequency: 'monthly',
          description: 'common.subscriptions.usage.developers',
          unitDescription: 'common.perDeveloper',
          quantity: 25,
          unitPrice: 2
        },
        {
          paymentFrequency: 'monthly',
          description: 'authSettings.costCalculator.maus',
          unitDescription: 'authSettings.costCalculator.mau.perkMau',
          underComment: 'authSettings.costCalculator.mau.kMauFree',
          quantity: 12,
          unitPrice: 1
        }
      ])
    })

    test('cf monthly no quantities', () => {
      const res = getSubscriptionBreakdownsByModuleAndFrequency({
        module: 'cf',
        subscriptionDetails: {
          ...subscriptionDetails,
          quantities: {}
        }
      })

      expect(res).toStrictEqual([
        {
          paymentFrequency: 'monthly',
          description: 'common.subscriptions.usage.developers',
          unitDescription: 'common.perDeveloper',
          quantity: 0,
          unitPrice: 2
        },
        {
          paymentFrequency: 'monthly',
          description: 'authSettings.costCalculator.maus',
          unitDescription: 'authSettings.costCalculator.mau.perkMau',
          underComment: 'authSettings.costCalculator.mau.kMauFree',
          quantity: 0,
          unitPrice: 1
        }
      ])
    })

    test('cf yearly', () => {
      const res = getSubscriptionBreakdownsByModuleAndFrequency({
        module: 'cf',
        subscriptionDetails: {
          ...subscriptionDetails,
          paymentFreq: TimeType.YEARLY
        }
      })

      expect(res).toStrictEqual([
        {
          paymentFrequency: 'yearly',
          description: 'common.subscriptions.usage.developers',
          unitDescription: 'common.perDeveloper',
          quantity: 25,
          unitPrice: 4
        },
        {
          paymentFrequency: 'yearly',
          description: 'authSettings.costCalculator.maus',
          unitDescription: 'authSettings.costCalculator.mau.permMau',
          underComment: 'authSettings.costCalculator.mau.mMauFree',
          quantity: 12,
          unitPrice: 3
        }
      ])
    })

    test('cf yearly no quantities', () => {
      const res = getSubscriptionBreakdownsByModuleAndFrequency({
        module: 'cf',
        subscriptionDetails: {
          ...subscriptionDetails,
          quantities: {},
          paymentFreq: TimeType.YEARLY
        }
      })

      expect(res).toStrictEqual([
        {
          paymentFrequency: 'yearly',
          description: 'common.subscriptions.usage.developers',
          unitDescription: 'common.perDeveloper',
          quantity: 0,
          unitPrice: 4
        },
        {
          paymentFrequency: 'yearly',
          description: 'authSettings.costCalculator.maus',
          unitDescription: 'authSettings.costCalculator.mau.permMau',
          underComment: 'authSettings.costCalculator.mau.mMauFree',
          quantity: 0,
          unitPrice: 3
        }
      ])
    })

    test('default', () => {
      const res = getSubscriptionBreakdownsByModuleAndFrequency({
        module: 'cd',
        subscriptionDetails
      })

      expect(res).toStrictEqual([])
    })
  })
})
