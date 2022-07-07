import { Popover, PopoverProps } from '@harness/uicore'
import cx from 'classnames'
import React from 'react'
import css from './StatusHeatMap.module.scss'

export interface StatusHeatMapProps<T> {
  data: T[]
  getId: (item: T) => string
  getStatus: (item: T) => string
  className?: string
  getPopoverProps?: (item: T) => PopoverProps
  onClick?: (item: T, event: React.MouseEvent) => void
}

export function StatusHeatMap<T>(props: StatusHeatMapProps<T>): React.ReactElement {
  const { data, getId, getStatus, className, getPopoverProps, onClick } = props

  return (
    <div className={cx(css.statusHeatMap, className)}>
      {data.map(row => (
        <Popover disabled={!getPopoverProps} key={getId(row)} {...getPopoverProps?.(row)}>
          <div
            data-id={getId(row)}
            data-status={getStatus(row).toLowerCase()}
            className={css.statusHeatMapCell}
            onClick={e => onClick?.(row, e)}
          />
        </Popover>
      ))}
    </div>
  )
}
