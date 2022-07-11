/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useContext, useMemo } from 'react'
import { DatadogDashboardDTO, useGetDatadogDashboards } from 'services/cv'

import { SetupSourceTabsContext } from '@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs'
import MetricsDashboardList from '@cv/components/MetricsDashboardList/MetricsDashboardList'
import type { TableDashboardItem } from '@cv/components/MetricsDashboardList/MetricsDashboardList.type'
import { mapDatadogMetricHealthSourceToDatadogMetricSetupSource } from '@cv/pages/health-source/connectors/DatadogMetricsHealthSource/DatadogMetricsHealthSource.utils'
import { useStrings } from 'framework/strings'

export interface SelectDatadogMetricsDashboardsInterface {
  isTemplate?: boolean
  expressions?: string[]
}

export function SelectDatadogMetricsDashboards({
  isTemplate,
  expressions
}: SelectDatadogMetricsDashboardsInterface): JSX.Element {
  const { getString } = useStrings()
  const { sourceData } = useContext(SetupSourceTabsContext)
  const dashboardItemMapper: (dashboard: DatadogDashboardDTO) => TableDashboardItem = useCallback(dashboard => {
    return {
      name: dashboard.name,
      id: dashboard.id
    }
  }, [])

  const selectedDashboards = useMemo(() => {
    return (
      sourceData.selectedDashboards ||
      mapDatadogMetricHealthSourceToDatadogMetricSetupSource(sourceData).selectedDashboards
    )
  }, [sourceData])
  return (
    <MetricsDashboardList<DatadogDashboardDTO>
      manualQueryInputTitle={'cv.monitoringSources.datadog.manualInputQueryModal.modalTitle'}
      noDataMessage={getString('cv.monitoringSources.datadog.selectDashboardsPage.noDataText')}
      dashboardsRequest={useGetDatadogDashboards({ lazy: true })}
      defaultItemIcon={'service-datadog'}
      tableTitle={'cv.monitoringSources.datadog.selectDashboardsPage.dashboardColumnName'}
      selectedDashboardList={selectedDashboards || []}
      tableItemMapper={dashboardItemMapper}
      isTemplate={isTemplate}
      expressions={expressions}
    />
  )
}
