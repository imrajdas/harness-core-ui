/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Formik,
  FormikForm,
  getMultiTypeFromValue,
  MultiTypeInputType,
  useToaster,
  Utils
} from '@wings-software/uicore'
import { debounce, noop } from 'lodash-es'
import { useParams } from 'react-router-dom'
import type { FormikProps } from 'formik'
import isEmpty from 'lodash-es/isEmpty'
import { useStrings } from 'framework/strings'
import type {
  DatadogMetricInfo,
  DatadogMetricsHealthSourceProps
} from '@cv/pages/health-source/connectors/DatadogMetricsHealthSource/DatadogMetricsHealthSource.type'
import {
  validateFormMappings,
  getCustomCreatedMetrics,
  mapDatadogMetricHealthSourceToDatadogMetricSetupSource,
  validate,
  mapSelectedWidgetDataToDatadogMetricInfo,
  mapDatadogDashboardDetailToMetricWidget,
  getSelectedDashboards,
  mapDatadogMetricSetupSourceToDatadogHealthSource,
  getServiceIntance
} from '@cv/pages/health-source/connectors/DatadogMetricsHealthSource/DatadogMetricsHealthSource.utils'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import {
  DatadogDashboardDetail,
  TimeSeriesSampleDTO,
  useGetDatadogActiveMetrics,
  useGetDatadogDashboardDetails,
  useGetDatadogSampleData,
  useGetDatadogMetricTags
} from 'services/cv'
import { MANUAL_INPUT_QUERY } from '@cv/pages/health-source/connectors/GCOMetricsHealthSource/components/ManualInputQueryModal/ManualInputQueryModal'
import { DatasourceTypeEnum } from '@cv/pages/monitored-service/components/ServiceHealth/components/MetricsAndLogs/MetricsAndLogs.types'
import { DatadogMetricsHealthSourceFieldNames } from '@cv/pages/health-source/connectors/DatadogMetricsHealthSource/DatadogMetricsHealthSource.constants'
import type { MetricWidget } from '@cv/components/MetricDashboardWidgetNav/MetricDashboardWidgetNav.type'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import CloudMetricsHealthSource from '@cv/components/CloudMetricsHealthSource/CloudMetricsHealthSource'
import type { SelectedWidgetMetricData } from '@cv/components/CloudMetricsHealthSource/CloudMetricsHealthSource.type'
import DatadogMetricsDetailsContent from '@cv/pages/health-source/connectors/DatadogMetricsHealthSource/components/DatadogMetricsDetailsContent/DatadogMetricsDetailsContent'
import { FieldNames } from '@cv/pages/health-source/connectors/GCOMetricsHealthSource/GCOMetricsHealthSource.constants'
import { getPlaceholderForIdentifier } from '@cv/pages/health-source/connectors/GCOMetricsHealthSource/GCOMetricsHealthSource.utils'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { DatadogMetricsQueryExtractor } from './components/DatadogMetricsDetailsContent/DatadogMetricsDetailsContent.utils'

export default function DatadogMetricsHealthSource(props: DatadogMetricsHealthSourceProps): JSX.Element {
  const { data, isTemplate, expressions } = props
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()
  const { showError } = useToaster()
  const transformedData = useMemo(() => mapDatadogMetricHealthSourceToDatadogMetricSetupSource(data), [data])
  const [metricHealthDetailsData, setMetricHealthDetailsData] = useState(transformedData.metricDefinition)
  const [activeMetricsTracingId, metricTagsTracingId] = useMemo(() => [Utils.randomId(), Utils.randomId()], [])
  const { projectIdentifier, orgIdentifier, accountId } = useParams<ProjectPathProps>()
  const [selectedMetricId, setSelectedMetricId] = useState<string>()
  const selectedMetricData = metricHealthDetailsData.get(selectedMetricId || '')
  const initialCustomCreatedMetrics = useMemo(() => {
    return getCustomCreatedMetrics(data?.selectedMetrics || transformedData.metricDefinition)
  }, [data?.selectedMetrics, transformedData.metricDefinition])

  const connectorIdentifier = data?.connectorRef?.value || (data?.connectorRef as string)
  const isConnectorRuntimeOrExpression = getMultiTypeFromValue(connectorIdentifier) !== MultiTypeInputType.FIXED
  const {
    data: activeMetrics,
    refetch: refetchActiveMetrics,
    loading: activeMetricsLoading,
    error: activeMetricError
  } = useGetDatadogActiveMetrics({
    lazy: isConnectorRuntimeOrExpression,
    queryParams: {
      projectIdentifier,
      orgIdentifier,
      accountId,
      connectorIdentifier,
      tracingId: activeMetricsTracingId
    }
  })
  const {
    data: timeseriesData,
    refetch: timeseriesRefech,
    loading: timeseriesLoading,
    error: timeseriesDataError
  } = useGetDatadogSampleData({ lazy: true })
  const timeseriesDataErrorMessage = useMemo(() => {
    return getErrorMessage(timeseriesDataError)
  }, [timeseriesDataError])
  const [currentTimeseriesData, setCurrentTimeseriesData] = useState<TimeSeriesSampleDTO[] | null>(
    timeseriesData?.data || null
  )
  useEffect(() => {
    setCurrentTimeseriesData(timeseriesData?.data || null)
  }, [timeseriesData?.data])

  const {
    data: metricTags,
    refetch: refetchMetricTags,
    loading: loadingMetricTags
  } = useGetDatadogMetricTags({
    lazy: true
  })

  useEffect(() => {
    activeMetricError && showError(getErrorMessage(activeMetricError))
  }, [activeMetricError])

  const debounceRefetchActiveMetrics = useCallback(
    debounce((query?: string): void => {
      try {
        const queryObject = query ? { filter: query } : {}
        refetchActiveMetrics({
          queryParams: {
            projectIdentifier,
            orgIdentifier,
            accountId,
            connectorIdentifier,
            tracingId: activeMetricsTracingId,
            ...queryObject
          }
        })
      } catch (e) {
        showError(getRBACErrorMessage(e))
      }
    }, 1000),
    [data.connectorRef, activeMetricsTracingId]
  )

  const debounceRefetchMetricTags = useCallback(
    debounce((query?: string): void => {
      try {
        const queryObject = query ? { filter: query } : {}
        if (selectedMetricData?.metric) {
          refetchMetricTags({
            queryParams: {
              projectIdentifier,
              orgIdentifier,
              accountId,
              connectorIdentifier,
              tracingId: metricTagsTracingId,
              metric: selectedMetricData?.metric,
              ...queryObject
            }
          })
        }
      } catch (e) {
        showError(getRBACErrorMessage(e))
      }
    }, 2000),
    [selectedMetricData]
  )

  useEffect(() => {
    if (selectedMetricData?.metric && !isConnectorRuntimeOrExpression) {
      refetchMetricTags({
        queryParams: {
          projectIdentifier,
          orgIdentifier,
          accountId,
          connectorIdentifier,
          tracingId: metricTagsTracingId,
          metric: selectedMetricData.metric
        }
      })
    }
  }, [
    selectedMetricData?.metric,
    projectIdentifier,
    orgIdentifier,
    accountId,
    data.connectorRef,
    activeMetricsTracingId,
    refetchMetricTags,
    metricTagsTracingId
  ])

  const selectedDashboards = useMemo(() => {
    return getSelectedDashboards(data)
  }, [data])

  const handleOnTimeseriesFetch = (query: string): void => {
    if (query) {
      timeseriesRefech({
        queryParams: {
          orgIdentifier,
          projectIdentifier,
          accountId,
          tracingId: Utils.randomId(),
          connectorIdentifier,
          query: query
        }
      })
    }
  }
  useEffect(() => {
    if (!activeMetrics?.data) {
      return
    }
    if (
      selectedMetricData &&
      selectedMetricData.metricPath &&
      !selectedMetricData.metric &&
      !selectedMetricData.isCustomCreatedMetric
    ) {
      const queryExtractor = DatadogMetricsQueryExtractor(selectedMetricData.query || '', activeMetrics?.data || [])
      metricHealthDetailsData.set(selectedMetricData.metricPath, {
        ...selectedMetricData,
        metric: queryExtractor.activeMetric,
        metricTags: queryExtractor.metricTags,
        groupingTags: queryExtractor.groupingTags,
        aggregator: queryExtractor.aggregation
      })
    }
  }, [activeMetrics?.data, selectedMetricData, metricHealthDetailsData, activeMetricsLoading])

  const handleOnChangeManualEditQuery = (formikProps: FormikProps<DatadogMetricInfo>, enabled: boolean): void => {
    formikProps.setFieldValue(DatadogMetricsHealthSourceFieldNames.IS_MANUAL_QUERY, enabled)
  }
  const handleOnMetricSelected = (
    selectedWidgetMetricData: SelectedWidgetMetricData,
    formikProps: FormikProps<DatadogMetricInfo>
  ): void => {
    let metricInfo: DatadogMetricInfo | undefined = metricHealthDetailsData.get(selectedWidgetMetricData.id)
    const query = selectedWidgetMetricData.query === MANUAL_INPUT_QUERY ? '' : selectedWidgetMetricData.query
    if (!metricInfo) {
      metricInfo = mapSelectedWidgetDataToDatadogMetricInfo(
        selectedWidgetMetricData,
        query,
        activeMetrics?.data || [],
        isTemplate
      )
    }
    metricHealthDetailsData.set(selectedWidgetMetricData.id, metricInfo)
    if (selectedMetricId) {
      // save changes for previous metric
      metricHealthDetailsData.set(selectedMetricId, { ...selectedMetricData, ...formikProps.values })
    }
    setMetricHealthDetailsData(new Map(metricHealthDetailsData))
    setSelectedMetricId(selectedWidgetMetricData.id)
    setCurrentTimeseriesData(null)
  }

  const handleOnNext = async (formikProps: FormikProps<DatadogMetricInfo>): Promise<void> => {
    formikProps.setTouched({
      ...formikProps.touched,
      [DatadogMetricsHealthSourceFieldNames.QUERY]: true,
      [DatadogMetricsHealthSourceFieldNames.GROUP_NAME]: true,
      [DatadogMetricsHealthSourceFieldNames.METRIC]: true,
      [DatadogMetricsHealthSourceFieldNames.SLI]: true,
      [DatadogMetricsHealthSourceFieldNames.RISK_CATEGORY]: true,
      [DatadogMetricsHealthSourceFieldNames.HIGHER_BASELINE_DEVIATION]: true,
      [DatadogMetricsHealthSourceFieldNames.LOWER_BASELINE_DEVIATION]: true,
      [DatadogMetricsHealthSourceFieldNames.SERVICE_INSTANCE]: true
    })
    const errors = validate(formikProps.values, metricHealthDetailsData, getString)
    if (!isEmpty(errors)) {
      formikProps.setErrors({ ...errors })
      return
    }
    if (selectedMetricId) {
      metricHealthDetailsData.set(selectedMetricId, { ...selectedMetricData, ...formikProps.values })
    }
    const filteredData = new Map()
    for (const metric of metricHealthDetailsData) {
      const [metricName, metricInfo] = metric
      if (isEmpty(validateFormMappings(metricInfo, metricHealthDetailsData, getString))) {
        filteredData.set(metricName, metricInfo)
      }
    }
    await props.onSubmit(
      data,
      mapDatadogMetricSetupSourceToDatadogHealthSource({
        ...transformedData,
        metricDefinition: filteredData
      })
    )
  }
  const dashboardRequest = useGetDatadogDashboardDetails({ lazy: true })
  const dashboardDetailToMetricWidgetItemMapper = useCallback(
    (dashboardId: string, datadogDashboardDetail: DatadogDashboardDetail): MetricWidget => {
      return mapDatadogDashboardDetailToMetricWidget(dashboardId, datadogDashboardDetail)
    },
    []
  )
  const serviceInstanceList = useMemo(() => getServiceIntance(metricTags?.data?.tagKeys), [metricTags?.data?.tagKeys])

  return (
    <Formik<DatadogMetricInfo>
      enableReinitialize={true}
      formName="mapDatadogMetrics"
      initialValues={selectedMetricData || {}}
      onSubmit={noop}
      validate={values => {
        const newMap = new Map(metricHealthDetailsData)
        if (selectedMetricId) {
          newMap.set(selectedMetricId, { ...values })
        }
        return validate(values, newMap, getString)
      }}
    >
      {formikProps => {
        const shouldShowIdentifierPlaceholder = !selectedMetricData?.identifier && !formikProps.values?.identifier
        if (shouldShowIdentifierPlaceholder) {
          formikProps.setFieldValue(
            FieldNames.IDENTIFIER,
            getPlaceholderForIdentifier(formikProps.values?.metricName, getString)
          )
        }
        return (
          <FormikForm>
            <CloudMetricsHealthSource
              onChangeManualEditQuery={enabled => handleOnChangeManualEditQuery(formikProps, enabled)}
              formikProps={formikProps}
              dashboardDetailRequest={dashboardRequest}
              dashboardDetailMapper={dashboardDetailToMetricWidgetItemMapper}
              dataSourceType={DatasourceTypeEnum.DATADOG_METRICS}
              addManualQueryTitle={'cv.monitoringSources.datadog.manualInputQueryModal.modalTitle'}
              manualQueries={initialCustomCreatedMetrics}
              onNextClicked={() => handleOnNext(formikProps)}
              selectedMetricInfo={{
                query: formikProps.values.query,
                queryEditable: formikProps.values.isManualQuery,
                timeseriesData: currentTimeseriesData
              }}
              onFetchTimeseriesData={handleOnTimeseriesFetch}
              timeseriesDataLoading={timeseriesLoading}
              timeseriesDataError={timeseriesDataErrorMessage}
              dashboards={selectedDashboards}
              connectorRef={connectorIdentifier as string}
              onWidgetMetricSelected={selectedWidgetMetricData =>
                handleOnMetricSelected(selectedWidgetMetricData, formikProps)
              }
              serviceInstanceList={serviceInstanceList}
              isTemplate={isTemplate}
              expressions={expressions}
              metricDetailsContent={
                <DatadogMetricsDetailsContent
                  selectedMetric={selectedMetricId}
                  selectedMetricData={selectedMetricData}
                  metricHealthDetailsData={metricHealthDetailsData}
                  formikProps={formikProps}
                  setMetricHealthDetailsData={setMetricHealthDetailsData}
                  metricTags={metricTags?.data?.metricTags || []}
                  activeMetrics={activeMetrics?.data}
                  activeMetricsLoading={activeMetricsLoading}
                  metricTagsLoading={loadingMetricTags}
                  fetchActiveMetrics={isConnectorRuntimeOrExpression ? undefined : debounceRefetchActiveMetrics}
                  fetchMetricTags={isConnectorRuntimeOrExpression ? undefined : debounceRefetchMetricTags}
                  isTemplate={isTemplate}
                  expressions={expressions}
                  isConnectorRuntimeOrExpression={isConnectorRuntimeOrExpression}
                />
              }
            />
          </FormikForm>
        )
      }}
    </Formik>
  )
}
