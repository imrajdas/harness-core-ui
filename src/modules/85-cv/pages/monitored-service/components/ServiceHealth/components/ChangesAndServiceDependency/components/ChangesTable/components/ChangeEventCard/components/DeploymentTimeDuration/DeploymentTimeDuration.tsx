/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import moment from 'moment'
import { Container, Layout, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { ChangeSourceTypes } from '@cv/pages/ChangeSource/ChangeSourceDrawer/ChangeSourceDrawer.constants'
import { durationAsString } from './DeploymentTimeDuration.utils'
import { TIME_FORMAT } from './DeploymentTimeDuration.constant'

export default function DeploymentTimeDuration({
  startTime,
  endTime,
  type
}: {
  startTime: number
  endTime: number
  type?: keyof typeof ChangeSourceTypes
}) {
  const { getString } = useStrings()
  const durationString = durationAsString(startTime, endTime)
  const timePassed = durationAsString(endTime, moment().valueOf())
  const marginals = type === ChangeSourceTypes.HarnessCDNextGen ? { right: 'medium' } : undefined

  return (
    <Container>
      <Layout.Horizontal flex={{ justifyContent: 'space-between' }}>
        {type === ChangeSourceTypes.HarnessCDNextGen && (
          <Text icon={'time'} iconProps={{ size: 12 }} font={{ size: 'small' }} margin={marginals}>
            Start:&nbsp;
            <Text tag="span" font={{ size: 'small', weight: 'semi-bold' }} color={Color.BLACK_100}>
              {moment(startTime).format(TIME_FORMAT)}
            </Text>
          </Text>
        )}
        <Text icon={'time'} iconProps={{ size: 12 }} font={{ size: 'small' }} margin={marginals}>
          {getString('cv.changeSource.changeSourceCard.finished')}:&nbsp;
          <Text tag="span" font={{ size: 'small', weight: 'semi-bold' }} color={Color.BLACK_100}>
            {moment(endTime).format(TIME_FORMAT)}
          </Text>
        </Text>
        <Text icon={'time'} iconProps={{ size: 12 }} font={{ size: 'small' }} margin={marginals}>
          {getString('common.durationPrefix')}:&nbsp;
          <Text tag="span" font={{ size: 'small', weight: 'semi-bold' }} color={Color.BLACK_100}>
            {durationString}
          </Text>
        </Text>
        {type !== ChangeSourceTypes.HarnessCDNextGen && (
          <Text icon={'calendar'} iconProps={{ size: 12 }} font={{ size: 'small' }} margin={marginals}>
            {timePassed || 0} &nbsp;
            {getString('cv.changeSource.changeSourceCard.ago')}
          </Text>
        )}
      </Layout.Horizontal>
    </Container>
  )
}
