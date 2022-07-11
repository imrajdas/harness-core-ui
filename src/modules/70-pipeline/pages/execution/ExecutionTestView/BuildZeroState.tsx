/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Icon, Layout, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import testReportEmptyState from './images/test_report_empty_state.svg'
import css from './BuildTests.module.scss'

interface BuildZeroStateProps {
  isLoading?: boolean
}

const viewTests = 'https://docs.harness.io/article/sof7n3qjap-viewing-tests'
const harnessDocs = 'https://docs.harness.io'

export function BuildZeroState(props: BuildZeroStateProps): React.ReactElement {
  const { getString } = useStrings()
  const { isLoading = false } = props
  return (
    <Layout.Vertical className={css.loadingContainer}>
      {isLoading && (
        <Icon
          name="report-gear-grey"
          size={100}
          style={{ margin: '0 auto', paddingBottom: 'var(--spacing-xxlarge)' }}
        />
      )}
      {!isLoading && <img src={testReportEmptyState} alt="" />}
      <Text color={Color.GREY_600} style={{ fontSize: '20px', fontWeight: 600 }} padding={{ top: 'medium' }}>
        {isLoading
          ? getString('pipeline.testsReports.willBeDisplayedIfAvailable')
          : getString('pipeline.testsReports.noTestResults')}
      </Text>
      <Text style={{ fontSize: '16px' }} padding={{ top: 'xsmall', bottom: 'large' }}>
        {!isLoading && getString('pipeline.testsReports.testsWillAppear')}
      </Text>
      <a target="_blank" rel="noreferrer" href={isLoading ? harnessDocs : viewTests}>
        <Text
          style={{ fontSize: '16px' }}
          color={Color.PRIMARY_6}
          rightIcon="main-share"
          rightIconProps={{ color: Color.PRIMARY_6 }}
          flex={{ align: 'center-center' }}
        >
          {getString('learnMore')}
        </Text>
      </a>
    </Layout.Vertical>
  )
}
