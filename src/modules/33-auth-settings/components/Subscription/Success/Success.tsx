/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { capitalize } from 'lodash-es'
import { Color, FontVariation } from '@harness/design-system'
import { Layout, Text, Button, ButtonVariation } from '@harness/uicore'
import type { Module } from 'framework/types/ModuleName'
import { useStrings } from 'framework/strings'
import type { StringsMap } from 'stringTypes'
import type { InvoiceDetailDTO } from 'services/cd-ng'
import type { SubscriptionProps } from '@common/constants/SubscriptionTypes'
import Hero from './img/hero.svg'

interface SuccessProps {
  module: Module
  subscriptionProps: SubscriptionProps
  invoiceData?: InvoiceDetailDTO
  className: string
  onClose: () => void
}

export const Success: React.FC<SuccessProps> = ({ module, subscriptionProps, invoiceData, className, onClose }) => {
  const { getString } = useStrings()
  const moduleDescr = `common.purpose.${module}.continuous`
  const { paymentFreq, edition } = subscriptionProps

  const list = invoiceData?.items ? (
    <Layout.Vertical flex={{ justifyContent: 'start', alignItems: 'start' }}>
      <Text color={Color.BLACK_100} icon="main-tick" iconProps={{ color: Color.GREEN_700 }}>{`${capitalize(
        edition
      )} ${getString('common.plans.subscription')}`}</Text>
      {invoiceData.items.map(item => {
        return (
          <Text color={Color.BLACK_100} icon="main-tick" iconProps={{ color: Color.GREEN_700 }} key={item.description}>
            {item.description}
          </Text>
        )
      })}
    </Layout.Vertical>
  ) : (
    <Text color={Color.BLACK_100} icon="main-tick" iconProps={{ color: Color.GREEN_700 }}>{`${capitalize(
      edition
    )} ${getString('common.plans.subscription')}`}</Text>
  )

  return (
    <Layout.Vertical
      padding={{ bottom: 'large' }}
      spacing={'large'}
      flex={{ align: 'center-center' }}
      className={className}
    >
      <img src={Hero} />
      <Layout.Horizontal spacing={'small'}>
        <Text font={{ variation: FontVariation.H3, weight: 'bold' }} color={Color.ORANGE_500}>
          {getString('authSettings.success.woohoo')}
        </Text>
        <Text font={{ variation: FontVariation.H3, weight: 'bold' }}>{getString('authSettings.success.title')}</Text>
      </Layout.Horizontal>
      <Text font={{ variation: FontVariation.H5 }}>
        {getString('authSettings.success.msg', {
          module: getString(moduleDescr as keyof StringsMap),
          time: capitalize(paymentFreq)
        })}
      </Text>
      {list}
      <Button variation={ButtonVariation.PRIMARY} onClick={onClose}>
        {getString('finish')}
      </Button>
    </Layout.Vertical>
  )
}
