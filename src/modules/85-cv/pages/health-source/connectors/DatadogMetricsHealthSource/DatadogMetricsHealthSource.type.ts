/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SelectOption } from '@wings-software/uicore'
import type { DatadogDashboardDTO } from 'services/cv'
import type { StringKeys } from 'framework/strings'
import type { UpdatedHealthSource } from '@cv/pages/health-source/HealthSourceDrawer/HealthSourceDrawerContent.types'

export type DatadogAggregation = {
  value: DatadogAggregationType
  label: StringKeys
}
export type DatadogAggregationType = 'avg' | 'max' | 'min' | 'sum'

export interface DatadogMetricInfo {
  identifier?: string
  groupName?: SelectOption
  dashboardId?: string
  metricPath?: string
  metricName?: string
  metric?: string
  aggregator?: DatadogAggregationType
  query?: string
  groupingQuery?: string
  metricTags?: SelectOption[]
  groupingTags?: string[]
  serviceInstanceIdentifierTag?: string
  riskCategory?: string
  higherBaselineDeviation?: boolean
  lowerBaselineDeviation?: boolean
  isCustomCreatedMetric?: boolean
  isManualQuery?: boolean
  tooManyMetrics?: boolean
  sli?: boolean
  continuousVerification?: boolean
  healthScore?: boolean
  isNew?: boolean
  serviceInstance?: string
  isConnectorRuntimeOrExpression?: boolean
}

export interface DatadogMetricSetupSource {
  isEdit: boolean
  metricDefinition: Map<string, DatadogMetricInfo>
  selectedDashboards: DatadogDashboardDTO[]
  healthSourceIdentifier: string
  healthSourceName: string
  product: SelectOption
  connectorRef?: string | { value: string }
}

export interface DatadogMetricsHealthSourceProps {
  data: any
  onSubmit: (formdata: DatadogMetricSetupSource, UpdatedHealthSource: UpdatedHealthSource) => Promise<void>
  isTemplate?: boolean
  expressions?: string[]
}
