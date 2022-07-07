/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { Text, Container } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { ChangeSourceTypes } from '@cv/pages/ChangeSource/ChangeSourceDrawer/ChangeSourceDrawer.constants'
import { getOnClickOptions } from '../ChangeDetails/ChangeDetails.utils'
import type { ChangeInfoData } from '../../ChangeEventCard.types'
import css from './ChangeInformation.module.scss'

export default function ChangeInformation({
  infoData,
  type
}: {
  infoData: ChangeInfoData
  type?: ChangeSourceTypes
}): JSX.Element {
  const { getString } = useStrings()
  return (
    <Container>
      <Text font={{ size: 'medium', weight: 'bold' }} color={Color.GREY_800}>
        {type === ChangeSourceTypes.K8sCluster
          ? 'Kubernetes Manifest Changes'
          : getString('cv.changeSource.changeSourceCard.information')}
      </Text>
      <Container className={css.infoContainer}>
        {type !== ChangeSourceTypes.K8sCluster && infoData.triggerAt ? (
          <Text className={css.timeLabel} icon={'time'} iconProps={{ size: 13 }} font={{ size: 'small' }}>
            {`${getString('cv.changeSource.changeSourceCard.triggred')} ${infoData.triggerAt}`}
          </Text>
        ) : null}
        <Text className={css.summaryTitle}>{'Summary'}</Text>
        <div className={css.summaryTable}>
          {Object.entries(infoData.summary).map(item => {
            const itemHasURL = typeof item[1] !== 'string' ? !!item[1]?.url : false
            const value = typeof item[1] === 'string' ? item[1] : item[1]?.name
            return value ? (
              <div key={item[0]} className={cx(css.summaryRow)}>
                <Container className={css.summaryCell}>
                  <Text className={cx(css.summaryKey)}>{item[0]}</Text>
                </Container>
                <Container className={css.summaryCell}>
                  <Text
                    className={cx(css.summaryValue, itemHasURL && css.isLink)}
                    {...(typeof item[1] !== 'string' ? getOnClickOptions(item[1]) : {})}
                  >
                    {value}
                  </Text>
                </Container>
              </div>
            ) : null
          })}
        </div>
      </Container>
    </Container>
  )
}
