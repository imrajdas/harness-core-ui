/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@wings-software/uicore'
import type { UseGetReturn } from 'restful-react'
import type { StringKeys } from 'framework/strings'

export interface MetricsDashboardListProps<T> {
  manualQueryInputTitle: StringKeys
  defaultItemIcon: IconName
  tableItemMapper: (item: T) => TableDashboardItem
  selectedDashboardList: T[]
  tableTitle: StringKeys
  dashboardsRequest: UseGetReturn<any, any, any>
  noDataMessage?: string
  isTemplate?: boolean
  expressions?: string[]
}

export type TableDashboardItem = {
  name?: string
  id?: string
}
export type TableData = {
  selected: boolean
  dashboard: {
    name?: string
    path?: string
  }
}
