/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Color } from '@harness/design-system'
import { Layout, Text } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import css from './InstanceStatusIndicator.module.scss'

export const RunningStatusIndicator = () => {
  const { getString } = useStrings()
  return (
    <Layout.Horizontal className={css.instanceStatusIndicator}>
      <Text icon="play" color={Color.GREEN_600} style={{ textTransform: 'capitalize' }}>
        {getString('ce.co.ruleState.running')}
      </Text>
    </Layout.Horizontal>
  )
}

export const StoppedStatusIndicator = () => {
  const { getString } = useStrings()
  return (
    <Layout.Horizontal className={css.instanceStatusIndicator}>
      <Text icon="stop" color={Color.RED_600}>
        {getString('ce.co.ruleState.stopped')}
      </Text>
    </Layout.Horizontal>
  )
}

export const CreatedStatusIndicator = () => {
  const { getString } = useStrings()
  return (
    <Layout.Horizontal className={css.instanceStatusIndicator}>
      <Text icon="full-circle" iconProps={{ size: 10 }} color={Color.GREEN_500}>
        {getString('created')}
      </Text>
    </Layout.Horizontal>
  )
}
