/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Color, Icon, IconName, Popover, PopoverProps } from '@harness/uicore'
import cx from 'classnames'
import React from 'react'
import {
  ExecutionStatus,
  isExecutionCompletedWithBadState,
  isExecutionPaused,
  isExecutionPausing,
  isExecutionRunning,
  isExecutionSuccess,
  isExecutionWaiting
} from '@pipeline/utils/statusHelpers'
import css from './StatusHeatMap.module.scss'

export const getStatusMapping = (status: ExecutionStatus) => {
  // ['Skipped,Queued,Discontinuing,NotStarted'] or any other unknown status will default to this
  const colorMap = {
    primaryState: 'default',
    icon: '' as IconName | '',
    iconColor: ''
  }
  if (isExecutionSuccess(status)) {
    colorMap.primaryState = 'success'
  } else if (isExecutionCompletedWithBadState(status)) {
    colorMap.primaryState = 'failed'
    colorMap.icon = 'cross'
    colorMap.iconColor = Color.RED_500
  } else if (isExecutionPaused(status) || isExecutionPausing(status) || isExecutionWaiting(status)) {
    colorMap.primaryState = 'paused'
    colorMap.icon = 'pause'
    colorMap.iconColor = Color.ORANGE_500
  } else if (isExecutionRunning(status)) {
    colorMap.primaryState = 'running'
    colorMap.icon = 'circle'
    colorMap.iconColor = Color.PRIMARY_7
  }
  return colorMap
}

export interface StatusHeatMapProps<T> {
  data: T[]
  getId: (item: T) => string
  getStatus: (item: T) => ExecutionStatus
  className?: string
  getPopoverProps?: (item: T) => PopoverProps
  onClick?: (item: T, event: React.MouseEvent) => void
}

export function StatusHeatMap<T>(props: StatusHeatMapProps<T>): React.ReactElement {
  const { data, getId, getStatus, className, getPopoverProps, onClick } = props

  return (
    <div className={cx(css.statusHeatMap, className)}>
      {data.map(row => {
        const { iconColor, icon, primaryState } = getStatusMapping(getStatus(row))
        return (
          <Popover disabled={!getPopoverProps} key={getId(row)} {...getPopoverProps?.(row)}>
            <div
              data-id={getId(row)}
              data-primary-state={primaryState}
              className={css.statusHeatMapCell}
              onClick={e => onClick?.(row, e)}
            >
              {icon && <Icon name={icon} size={12} color={iconColor} />}
            </div>
          </Popover>
        )
      })}
    </div>
  )
}
