/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SelectOption } from '@wings-software/uicore'
import type { FormikProps } from 'formik'
import type { HealthSourceSpec } from 'services/cv'
import type { UpdatedHealthSource } from '@cv/pages/health-source/HealthSourceDrawer/HealthSourceDrawerContent.types'

export interface DatadogLogsHealthSourceProps {
  data: any
  onSubmit: (formdata: DatadogLogsSetupSource, updatedHealthSource: UpdatedHealthSource) => Promise<void>
  isTemplate?: boolean
  expressions?: string[]
}

export type DatadogLogsInfo = {
  metricName: string
  serviceInstanceIdentifierTag?: string
  indexes?: SelectOption[] | string
  query: string
}

export interface DatadogLogsSetupSource {
  isEdit: boolean
  logsDefinitions: Map<string, DatadogLogsInfo>
  healthSourceIdentifier: string
  healthSourceName: string
  product: SelectOption
  connectorRef?: string | { value: string }
}

export type SelectedAndMappedMetrics = {
  selectedMetric: string
  mappedMetrics: Map<string, DatadogLogsInfo>
}

export type UpdateSelectedMetricsMap = {
  updatedMetric: string
  oldMetric: string
  mappedMetrics: Map<string, DatadogLogsInfo>
  formikProps: FormikProps<DatadogLogsInfo | undefined>
  isConnectorRuntimeOrExpression?: boolean
}

export interface DatadogLogsQueryDefinition {
  name: string
  query: string
  serviceInstanceIdentifier?: string
  indexes: string[] | string
}

export type DatadogLogsHealthSpec = HealthSourceSpec & {
  feature: string
  queries: DatadogLogsQueryDefinition[]
}
