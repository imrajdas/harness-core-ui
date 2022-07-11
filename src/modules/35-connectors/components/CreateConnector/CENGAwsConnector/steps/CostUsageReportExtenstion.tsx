/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Heading } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import css from '../CreateCeAwsConnector.module.scss'

const CostUsageReportExtention: React.FC = () => {
  const { getString } = useStrings()
  return (
    <Container className={css.extention}>
      <Heading level={2} className={css.header}>
        {getString('connectors.ceAws.curExtention.heading')}
      </Heading>
      <p>{getString('connectors.ceAws.curExtention.subtext')}</p>
      <ol type="A">
        <li>
          <p style={{ fontWeight: 700 }}>{getString('connectors.ceAws.curExtention.stepA.heading')}</p>
          <ol>
            <li>
              {getString('connectors.click')}{' '}
              <span className={css.gray}>{getString('connectors.ceAws.curExtention.stepA.step1.p1')}</span>{' '}
              {getString('connectors.ceAws.curExtention.stepA.step1.p2')}
            </li>
            <li>{getString('connectors.ceAws.curExtention.stepA.step2')}</li>
            <li>{getString('connectors.ceAws.curExtention.stepA.step3')}</li>
          </ol>
        </li>
        <li>
          {' '}
          <p style={{ fontWeight: 700 }}>{getString('connectors.ceAws.curExtention.stepB.heading')}</p>
          <ol>
            <li>
              {getString('connectors.click')}{' '}
              <span className={css.gray}>{getString('connectors.ceAws.curExtention.stepB.step1.p1')}</span>{' '}
              {getString('connectors.ceAws.curExtention.stepB.step1.p2')}
            </li>
            <li>{getString('connectors.ceAws.curExtention.stepB.step2')}</li>
            <li>
              {' '}
              {getString('connectors.click')} <span className={css.gray}>{getString('next')}</span>
              {getString('connectors.ceAws.curExtention.stepB.step3.p1')}
              <span className={css.gray}>{getString('save')}</span>.
            </li>
            <li> {getString('connectors.ceAws.curExtention.stepB.step4')}</li>
            <li>
              {getString('connectors.ceAws.curExtention.stepB.step5.heading')}
              <ul>
                <li>
                  {getString('connectors.ceAws.curExtention.stepB.step5.subStep1.p1')}{' '}
                  <span className={css.gray}>{getString('connectors.ceAws.curExtention.stepB.step5.subStep1.p2')}</span>
                </li>
                <li>
                  {getString('connectors.ceAws.curExtention.stepB.step5.subStep2.p1')}
                  <span className={css.gray}>{getString('connectors.ceAws.curExtention.stepB.step5.subStep2.p2')}</span>
                </li>
                <li>{getString('connectors.ceAws.curExtention.stepB.step5.subStep3')}</li>
                <li>
                  {getString('connectors.ceAws.curExtention.stepB.step5.subStep4.p1')}
                  <span className={css.gray}>{getString('connectors.ceAws.curExtention.stepB.step5.subStep4.p2')}</span>
                </li>
              </ul>
            </li>
            <li>
              {getString('connectors.click')} <span className={css.gray}>{getString('next')}</span>
              {getString('connectors.ceAws.curExtention.stepB.step6.p1')}
              <span className={css.gray}>{getString('connectors.ceAws.curExtention.stepB.step6.p2')}</span> .
            </li>
            <li>{getString('connectors.ceAws.curExtention.stepB.step7')}</li>
          </ol>
        </li>
      </ol>

      <p>{getString('connectors.ceAws.curExtention.moreHelp.heading')}</p>
      <ul>
        <li>
          <a>{getString('connectors.ceAws.curExtention.moreHelp.step1')}</a>
        </li>
        <li>
          <a
            href="https://docs.harness.io/article/80vbt5jv0q-set-up-cost-visibility-for-aws"
            target="_blank"
            rel="noreferrer"
          >
            {getString('connectors.ceAws.curExtention.moreHelp.step2')}
          </a>
        </li>
        <li>
          <a href="https://docs.aws.amazon.com/cur/latest/userguide/cur-create.html" target="_blank" rel="noreferrer">
            {getString('connectors.ceAws.curExtention.moreHelp.step3')}
          </a>
        </li>
        <li>
          <a
            href="https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/billing-example-policies.html#example-billing-view-reports"
            rel="noreferrer"
            target="_blank"
          >
            {getString('connectors.ceAws.curExtention.moreHelp.step4')}
          </a>
        </li>
      </ul>
    </Container>
  )
}

export default CostUsageReportExtention
