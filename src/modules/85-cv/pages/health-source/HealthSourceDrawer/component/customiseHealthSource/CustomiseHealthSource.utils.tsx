/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { isEmpty } from 'lodash-es'
import GCOLogsMonitoringSource from '@cv/pages/health-source/connectors/GCOLogsMonitoringSource/GCOLogsMonitoringSource'
import SplunkHealthSource from '@cv/pages/health-source/connectors/SplunkHealthSource/SplunkHealthSource'
import AppDHealthSourceContainer from '@cv/pages/health-source/connectors/AppDynamics/AppDHealthSourceContainer'
import { PrometheusHealthSource } from '@cv/pages/health-source/connectors/PrometheusHealthSource/PrometheusHealthSource'
import NewrelicMonitoredSourceContainer from '@cv/pages/health-source/connectors/NewRelic/NewRelicHealthSourceContainer'
import { Connectors } from '@connectors/constants'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { GCOMetricsHealthSource } from '@cv/pages/health-source/connectors/GCOMetricsHealthSource/GCOMetricsHealthSource'
import { GCOProduct } from '@cv/pages/health-source/connectors/GCOMetricsHealthSource/GCOMetricsHealthSource.utils'
import { HealthSourceTypes } from '@cv/pages/health-source/types'
import DatadogMetricsHealthSource from '@cv/pages/health-source/connectors/DatadogMetricsHealthSource/DatadogMetricsHealthSource'
import { DatadogProduct } from '@cv/pages/health-source/connectors/DatadogMetricsHealthSource/DatadogMetricsHealthSource.utils'
import { CustomHealthSource } from '@cv/pages/health-source/connectors/CustomHealthSource/CustomHealthSource'
import { DatadogLogsHealthSource } from '@cv/pages/health-source/connectors/DatadogLogsHealthSource/DatadogLogsHealthSource'
import ErrorTrackingHealthSource from '@cv/pages/health-source/connectors/ErrorTrackingHealthSource/ErrorTrackingHealthSource'
import DynatraceHealthSourceContainer from '@cv/pages/health-source/connectors/Dynatrace/DynatraceHealthSourceContainer'
import CustomHealthLogSource from '@cv/pages/health-source/connectors/CustomHealthLogSource/CustomHealthLogSource'
import { CustomHealthProduct } from '@cv/pages/health-source/connectors/CustomHealthSource/CustomHealthSource.constants'
import { SplunkMetricsHealthSource } from '@cv/pages/health-source/connectors/SplunkMetricsHealthSourceV2/SplunkMetricsHealthSource'
import type { UpdatedHealthSource } from '../../HealthSourceDrawerContent.types'
import { SplunkProduct } from '../defineHealthSource/DefineHealthSource.constant'

export const LoadSourceByType = ({
  type,
  data,
  onSubmit,
  isTemplate,
  expressions
}: {
  type: string
  data: any
  onSubmit: (formdata: any, healthSourceList: UpdatedHealthSource) => Promise<void>
  isTemplate?: boolean
  expressions?: string[]
}): JSX.Element | null => {
  const isSplunkMetricEnabled = useFeatureFlag(FeatureFlag.CVNG_SPLUNK_METRICS)

  switch (type) {
    case HealthSourceTypes.AppDynamics:
      return (
        <AppDHealthSourceContainer data={data} isTemplate={isTemplate} expressions={expressions} onSubmit={onSubmit} />
      )
    case Connectors.GCP:
      if (data?.product?.value === GCOProduct.CLOUD_LOGS) {
        return <GCOLogsMonitoringSource data={data} onSubmit={onSubmit} />
      } else {
        return <GCOMetricsHealthSource data={data} onSubmit={onSubmit} />
      }
    case HealthSourceTypes.StackdriverLog:
      return <GCOLogsMonitoringSource data={data} onSubmit={onSubmit} />
    case HealthSourceTypes.StackdriverMetrics:
      return <GCOMetricsHealthSource data={data} onSubmit={onSubmit} />
    case Connectors.DATADOG:
      if (data?.product?.value === DatadogProduct.CLOUD_METRICS) {
        return (
          <DatadogMetricsHealthSource
            data={data}
            isTemplate={isTemplate}
            expressions={expressions}
            onSubmit={onSubmit}
          />
        )
      } else {
        return (
          <DatadogLogsHealthSource data={data} isTemplate={isTemplate} expressions={expressions} onSubmit={onSubmit} />
        )
      }
    case HealthSourceTypes.DatadogMetrics:
      return (
        <DatadogMetricsHealthSource data={data} isTemplate={isTemplate} expressions={expressions} onSubmit={onSubmit} />
      )
    case HealthSourceTypes.DatadogLog:
      return (
        <DatadogLogsHealthSource data={data} isTemplate={isTemplate} expressions={expressions} onSubmit={onSubmit} />
      )
    case HealthSourceTypes.Prometheus:
      return (
        <PrometheusHealthSource data={data} isTemplate={isTemplate} expressions={expressions} onSubmit={onSubmit} />
      )
    case Connectors.NEW_RELIC:
      return <NewrelicMonitoredSourceContainer data={data} onSubmit={onSubmit} />
    case Connectors.DYNATRACE:
      return <DynatraceHealthSourceContainer data={data} onSubmit={onSubmit} />
    case Connectors.SPLUNK:
      if (data?.product?.value === SplunkProduct.SPLUNK_METRICS) {
        if (!isSplunkMetricEnabled) {
          return null
        }
        return <SplunkMetricsHealthSource data={data} onSubmit={onSubmit} />
      } else {
        return <SplunkHealthSource data={data} onSubmit={onSubmit} />
      }
    case HealthSourceTypes.SplunkMetric:
      if (!isSplunkMetricEnabled) {
        return null
      }
      return <SplunkMetricsHealthSource data={data} onSubmit={onSubmit} />
    case HealthSourceTypes.CustomHealth:
      if (data.product?.value === CustomHealthProduct.METRICS) {
        return <CustomHealthSource data={data} onSubmit={onSubmit} />
      } else {
        return <CustomHealthLogSource data={data} onSubmit={onSubmit} />
      }
    case Connectors.ERROR_TRACKING:
      return <ErrorTrackingHealthSource data={data} onSubmit={onSubmit} />
    default:
      return <></>
  }
}

export const createHealthsourceList = (formData: any, healthSourcesPayload: UpdatedHealthSource): any => {
  const healthSources = formData?.healthSourceList
  let updatedHealthSources = []
  if (
    healthSources &&
    !isEmpty(healthSources) &&
    healthSources.some(
      (el: any) => el?.identifier === healthSourcesPayload?.identifier && el?.type === healthSourcesPayload?.type
    )
  ) {
    updatedHealthSources = healthSources?.map((el: any) =>
      el?.identifier === healthSourcesPayload?.identifier ? healthSourcesPayload : el
    )
  } else if (healthSources && !isEmpty(healthSources)) {
    updatedHealthSources = [...healthSources, healthSourcesPayload]
  } else {
    updatedHealthSources = [healthSourcesPayload]
  }
  return updatedHealthSources
}
