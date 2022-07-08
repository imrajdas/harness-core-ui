/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { PriceDTO } from 'services/cd-ng/index'

export enum TimeType {
  YEARLY = 'yearly',
  MONTHLY = 'monthly'
}

export enum Editions {
  ENTERPRISE = 'ENTERPRISE',
  TEAM = 'TEAM',
  FREE = 'FREE',
  COMMUNITY = 'COMMUNITY'
}

export enum ModuleLicenseType {
  TRIAL = 'TRIAL',
  PAID = 'PAID',
  FREE = 'FREE',
  COMMUNITY = 'COMMUNITY'
}

export enum RestrictionType {
  AVAILABILITY = 'AVAILABILITY',
  STATIC_LIMIT = 'STATIC_LIMIT',
  RATE_LIMIT = 'RATE_LIMIT',
  CUSTOM = 'CUSTOM'
}

export enum SubscriptionTabNames {
  OVERVIEW = 'OVERVIEW',
  PLANS = 'PLANS',
  BILLING = 'BILLING'
}

export enum CDLicenseType {
  SERVICES = 'SERVICES',
  SERVICE_INSTANCES = 'SERVICE_INSTANCES'
}

export enum SubscribeViews {
  CALCULATE,
  BILLINGINFO,
  FINALREVIEW,
  SUCCESS
}

export interface ProductPricesProp {
  monthly: PriceDTO[]
  yearly: PriceDTO[]
}

export interface BillingContactProps {
  name: string
  email: string
  billingAddress: string
  city: string
  state: string
  country: string
  zipCode: string
  companyName: string
}

export interface PaymentMethodProps {
  paymentMethodId: string
  cardType: string
  expireDate: string
  last4digits: string
  nameOnCard: string
}

export interface SubscriptionProps {
  edition: Editions
  premiumSupport: boolean
  paymentFreq: TimeType
  subscriptionId: string
  billingContactInfo: BillingContactProps
  paymentMethodInfo: PaymentMethodProps
  productPrices: ProductPricesProp
  quantities?: {
    featureFlag?: {
      numberOfDevelopers: number
      numberOfMau: number
    }
  }
}

export interface Product {
  description: string
  unitPrice: number
  unitDescription: string
  underComment?: string
  paymentFrequency: TimeType
  quantity: number
}

export enum CurrencyType {
  USD = 'USD',
  EUR = 'EUR'
}

export enum LookUpKeyType {
  DEVELOPERS = 'DEVELOPERS',
  MAU = 'MAU',
  PREMIUM_SUPPORT = 'PREMIUM_SUPPORT'
}

export enum LookUpKeyFrequencyType {
  YEARLY = 'YEARLY',
  MONTHLY = 'MONTHLY'
}
