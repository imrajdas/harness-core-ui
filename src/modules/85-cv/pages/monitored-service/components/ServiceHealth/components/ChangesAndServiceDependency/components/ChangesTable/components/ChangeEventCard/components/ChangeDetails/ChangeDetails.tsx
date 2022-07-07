/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import _entries from 'lodash/entries'
import _map from 'lodash/map'
import { Text, Container } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { ChangeSourceTypes } from '@cv/pages/ChangeSource/ChangeSourceDrawer/ChangeSourceDrawer.constants'
import { EXECUTED_BY } from '@cv/constants'
import type { ChangeEventDTO } from 'services/cv'
import { getDetailsLabel } from '@cv/utils/CommonUtils'
import { getOnClickOptions, statusToColorMapping } from './ChangeDetails.utils'
import type { ChangeDetailsDataInterface } from '../../ChangeEventCard.types'
import StatusChip from './components/StatusChip/StatusChip'
import css from './ChangeDetails.module.scss'

export default function ChangeDetails({
  ChangeDetailsData
}: {
  ChangeDetailsData: ChangeDetailsDataInterface
}): JSX.Element {
  const { getString } = useStrings()
  const { type, status, executedBy } = ChangeDetailsData
  let { details } = ChangeDetailsData
  const { color, backgroundColor } = statusToColorMapping(status, type) || {}
  if ([ChangeSourceTypes.HarnessCDNextGen, ChangeSourceTypes.K8sCluster].includes(type as ChangeSourceTypes)) {
    details = { source: type as string, ...details, executedBy: (executedBy as any) || null }
  }
  return (
    <Container>
      <Text font={{ size: 'normal', weight: 'bold' }} color={Color.GREY_800}>
        {getString('details')}
      </Text>
      <div className={css.gridContainer}>{getChanges(details)}</div>
      {status && type !== ChangeSourceTypes.HarnessCDNextGen ? (
        <StatusChip status={status} color={color} backgroundColor={backgroundColor} />
      ) : null}
    </Container>
  )
}

export const getChanges = (details: {
  [key: string]: string | { name: string | ChangeEventDTO['type']; url?: string }
}) => {
  return _map(_entries(details), item => {
    const isExecutedBy = item[0] === EXECUTED_BY
    const { getString } = useStrings()
    let value
    let shouldVisible = true
    if (isExecutedBy) {
      shouldVisible = (item[1] as any).shouldVisible ?? true
      value = (item[1] as any).component
    } else {
      value = typeof item[1] === 'string' ? item[1] : item[1]?.name
    }
    return value ? (
      <>
        <Text className={css.gridItem} font={{ size: 'small' }}>
          {shouldVisible ? getDetailsLabel(item[0], getString) : ''}
        </Text>
        {isExecutedBy ? (
          <Text font={{ size: 'small', weight: 'semi-bold' }} color={Color.BLACK_100}>
            {value}
          </Text>
        ) : (
          <Text
            className={cx(typeof item[1] !== 'string' && item[1]?.url && css.isLink)}
            font={{ size: 'small', weight: 'semi-bold' }}
            color={Color.BLACK_100}
            {...getOnClickOptions(item[1])}
          >
            {value}
          </Text>
        )}
      </>
    ) : null
  })
}
