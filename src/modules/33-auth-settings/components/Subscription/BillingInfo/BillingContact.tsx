/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Card, Layout, Text, TextInput, DropDown, FontVariation, Color } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import type { BillingContactProps } from '@common/constants/SubscriptionTypes'
import css from './BillingInfo.module.scss'

interface BillingContactProp {
  billingInfo: BillingContactProps
  setBillingInfo: (value: BillingContactProps) => void
}

const BillingContact: React.FC<BillingContactProp> = ({ billingInfo, setBillingInfo }) => {
  const { getString } = useStrings()
  const { companyName, email, country, billingAddress, city, state, zipCode } = billingInfo
  return (
    <Card>
      <Layout.Vertical spacing={'large'}>
        <Text font={{ variation: FontVariation.H5 }}>{getString('authSettings.billingInfo.billingContact')}</Text>
        <Layout.Vertical spacing={'large'}>
          <Layout.Horizontal>
            <Layout.Vertical width={'30%'} spacing="small" padding={{ right: 'large' }}>
              <Text>{getString('common.headerCompanyName')}</Text>
              <TextInput
                data-testid="companyName"
                value={companyName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setBillingInfo({
                    ...billingInfo,
                    companyName: e.target.value
                  })
                }}
              />
            </Layout.Vertical>
            <Layout.Vertical width={'70%'}>
              <Text padding={{ bottom: 'small' }}>{getString('email')}</Text>
              <TextInput
                data-testid="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setBillingInfo({
                    ...billingInfo,
                    email: e.target.value
                  })
                }}
              />
              <Text
                icon="info"
                iconProps={{ color: Color.PRIMARY_7 }}
                padding="small"
                margin={{ bottom: 'small' }}
                className={css.warning}
              >
                {getString('authSettings.billingInfo.emailWarning')}
              </Text>
            </Layout.Vertical>
          </Layout.Horizontal>
          <Layout.Horizontal>
            <Layout.Vertical width={'30%'} spacing="small" padding={{ right: 'large' }}>
              <Text>{getString('common.countryOrRegion')}</Text>
              <DropDown
                buttonTestId="countryOrRegion"
                items={[{ label: 'US', value: 'us' }]}
                value={country}
                onChange={option => {
                  setBillingInfo({
                    ...billingInfo,
                    country: String(option.value)
                  })
                }}
              />
            </Layout.Vertical>
            <Layout.Vertical width={'70%'}>
              <Text padding={{ bottom: 'small' }}>{getString('common.billingAddress')}</Text>
              <TextInput
                data-testid="billingAddress"
                value={billingAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setBillingInfo({
                    ...billingInfo,
                    billingAddress: e.target.value
                  })
                }}
              />
            </Layout.Vertical>
          </Layout.Horizontal>
          <Layout.Horizontal>
            <Layout.Vertical width={'30%'} spacing="small" padding={{ right: 'large' }}>
              <Text>{getString('common.city')}</Text>
              <TextInput
                data-testid="city"
                value={city}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setBillingInfo({
                    ...billingInfo,
                    city: e.target.value
                  })
                }}
              />
            </Layout.Vertical>
            <Layout.Horizontal flex={{ justifyContent: 'space-between', alignItems: 'baseline' }} width={'70%'}>
              <Layout.Vertical spacing="small">
                <Text>{getString('common.state')}</Text>
                <DropDown
                  buttonTestId="state"
                  items={[{ label: 'Texas', value: 'Texas' }]}
                  value={state}
                  onChange={option => {
                    setBillingInfo({
                      ...billingInfo,
                      state: String(option.value)
                    })
                  }}
                />
              </Layout.Vertical>
              <Layout.Vertical spacing="small">
                <Text>{getString('common.zipCode')}</Text>
                <TextInput
                  data-testid="zipCode"
                  value={zipCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setBillingInfo({
                      ...billingInfo,
                      zipCode: e.target.value
                    })
                  }}
                />
              </Layout.Vertical>
            </Layout.Horizontal>
          </Layout.Horizontal>
        </Layout.Vertical>
      </Layout.Vertical>
    </Card>
  )
}

export default BillingContact
