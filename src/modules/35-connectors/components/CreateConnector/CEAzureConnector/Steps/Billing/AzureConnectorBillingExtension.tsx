/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useRef } from 'react'
import { Container, Heading, Text } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import css from '../../CreateCeAzureConnector_new.module.scss'

interface Step {
  text: string
  children?: Step[]
}

const useSteps = () => {
  const { getString } = useStrings()
  const steps = useRef<Step[]>([
    { text: getString('connectors.ceAzure.billing.extension.step1') },
    { text: getString('connectors.ceAzure.billing.extension.step2') },
    { text: getString('connectors.ceAzure.billing.extension.step3') },
    { text: getString('connectors.ceAzure.billing.extension.step4') },
    {
      text: getString('connectors.ceAzure.billing.extension.step5'),
      children: [
        {
          text: getString('connectors.ceAzure.billing.extension.step6'),
          children: [
            { text: getString('connectors.ceAzure.billing.extension.step7') },
            { text: getString('connectors.ceAzure.billing.extension.step8') }
          ]
        },
        {
          text: getString('connectors.ceAzure.billing.extension.step9'),
          children: [
            { text: getString('connectors.ceAzure.billing.extension.step10') },
            { text: getString('connectors.ceAzure.billing.extension.step11') },
            { text: getString('connectors.ceAzure.billing.extension.step12') },
            { text: getString('connectors.ceAzure.billing.extension.step13') }
          ]
        }
      ]
    },
    { text: getString('connectors.ceAzure.billing.extension.step14') },
    { text: getString('connectors.ceAzure.billing.extension.step15') },
    { text: getString('connectors.ceAzure.billing.extension.step16') }
  ]).current

  function renderSteps(s: Step[] = [], type?: string) {
    if (!s.length) return s
    const markup = s.map((step, idx) => {
      return (
        <li key={idx}>
          {step.text}
          {step.children && renderSteps(step.children)}
        </li>
      )
    })

    return type === 'number' ? <ol type="1">{markup}</ol> : <ul>{markup}</ul>
  }

  return renderSteps(steps, 'number')
}

const AzureConnectorBillingExtension: React.FC = () => {
  const { getString } = useStrings()
  const steps = useSteps()

  return (
    <Container>
      <Heading level={2} className={css.header}>
        {getString('connectors.ceAzure.billing.extension.createBillingExportGuide')}
      </Heading>
      <Text font="normal" color="grey1000">
        {getString('connectors.ceAzure.billing.extension.step0')}
      </Text>
      <Container>
        <ol type="1">{steps}</ol>
      </Container>
      <Text font="normal" color="grey1000">
        {getString('connectors.ceAzure.billing.extension.step17')}
      </Text>
      <Container color="grey1000" font="normal">
        <dl>
          <dt>{getString('connectors.ceAzure.billing.extension.links')}</dt>
          <dd>
            <a>- {getString('connectors.ceAzure.billing.extension.video')}</a>{' '}
            <i> {getString('connectors.ceAzure.billing.extension.soon')}</i>
          </dd>
          <dd>
            <a
              target="_blank"
              rel="noreferrer"
              href="https://docs.harness.io/article/v682mz6qfd-set-up-cost-visibility-for-azure"
            >
              - {getString('connectors.ceAzure.billing.extension.docs')}
            </a>
          </dd>
          <dd>
            <a
              target="_blank"
              rel="noreferrer"
              href="https://docs.harness.io/article/7idbmchsim-set-up-cost-visibility-for-azure#step_2_enable_billing_export_for_azure_subscription"
            >
              - {getString('connectors.ceAzure.billing.extension.createExport')}
            </a>
          </dd>
        </dl>
      </Container>
    </Container>
  )
}

export default AzureConnectorBillingExtension
