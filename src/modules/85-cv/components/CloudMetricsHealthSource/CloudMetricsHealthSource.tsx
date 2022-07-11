/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext, useEffect, useMemo, useState } from 'react'
import { isEmpty, omit } from 'lodash-es'
import {
  Container,
  getMultiTypeFromValue,
  Heading,
  MultiTypeInputType,
  Text,
  useConfirmationDialog
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import { SetupSourceLayout } from '@cv/components/CVSetupSourcesView/SetupSourceLayout/SetupSourceLayout'
import { transformSampleDataIntoHighchartOptions } from '@cv/pages/health-source/connectors/GCOMetricsHealthSource/GCOMetricsHealthSource.utils'

import DrawerFooter from '@cv/pages/health-source/common/DrawerFooter/DrawerFooter'
import { QueryContent } from '@cv/components/QueryViewer/QueryViewer'
import { FieldNames } from '@cv/pages/health-source/connectors/GCOMetricsHealthSource/GCOMetricsHealthSource.constants'
import { SetupSourceTabsContext } from '@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs'
import MetricsValidationChart from '@cv/components/CloudMetricsHealthSource/components/validationChart/MetricsValidationChart'
import MetricDashboardWidgetNav from '@cv/components/MetricDashboardWidgetNav/MetricDashboardWidgetNav'
import type { CloudMetricsHealthSourceProps } from '@cv/components/CloudMetricsHealthSource/CloudMetricsHealthSource.type'
import SelectHealthSourceServices from '@cv/pages/health-source/common/SelectHealthSourceServices/SelectHealthSourceServices'
import MetricErrorAndLoading from '@cv/pages/health-source/common/MetricErrorAndLoading/MetricErrorAndLoading'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useGetLabelNames, useGetMetricPacks } from 'services/cv'
import css from '@cv/components/CloudMetricsHealthSource/CloudMetricHealthSource.module.scss'

export default function CloudMetricsHealthSource<T>(props: CloudMetricsHealthSourceProps<T>): JSX.Element {
  const {
    metricDetailsContent,
    selectedMetricInfo,
    onFetchTimeseriesData,
    timeseriesDataLoading,
    timeseriesDataError,
    dashboards,
    connectorRef,
    onWidgetMetricSelected,
    onNextClicked,
    manualQueries,
    addManualQueryTitle,
    dataSourceType,
    dashboardDetailRequest,
    dashboardDetailMapper,
    formikProps,
    onChangeManualEditQuery,
    serviceInstanceList,
    isTemplate,
    expressions
  } = props
  const { getString } = useStrings()
  const { onPrevious } = useContext(SetupSourceTabsContext)
  const [shouldShowChart, setShouldShowChart] = useState<boolean>(false)
  const { projectIdentifier, orgIdentifier, accountId } = useParams<ProjectPathProps>()
  const isConnectorRuntimeOrExpression = getMultiTypeFromValue(connectorRef) !== MultiTypeInputType.FIXED
  const sampleData = useMemo(() => {
    return transformSampleDataIntoHighchartOptions(selectedMetricInfo?.timeseriesData || [])
  }, [selectedMetricInfo?.timeseriesData])

  useEffect(() => {
    if (!selectedMetricInfo?.timeseriesData) {
      setShouldShowChart(false)
    }
  }, [selectedMetricInfo?.timeseriesData])
  const metricPackResponse = useGetMetricPacks({
    queryParams: { projectIdentifier, orgIdentifier, accountId, dataSourceType: dataSourceType }
  })

  const { openDialog } = useConfirmationDialog({
    titleText: getString('cv.monitoringSources.prometheus.querySettingsNotEditable'),
    contentText: getString('cv.monitoringSources.prometheus.querySettingsSubtext'),
    confirmButtonText: getString('cv.proceedToEdit'),
    cancelButtonText: getString('cancel'),
    onCloseDialog: (proceed: boolean) => {
      if (proceed) {
        onChangeManualEditQuery?.(true)
      }
    }
  })

  const {
    sli = false,
    healthScore = false,
    continuousVerification = false,
    isManualQuery,
    isCustomCreatedMetric,
    serviceInstance,
    riskCategory
  } = formikProps.values

  const { loading: metricLoading } = dashboardDetailRequest

  return (
    <Container>
      <SetupSourceLayout
        leftPanelContent={
          <MetricDashboardWidgetNav<T>
            dashboardWidgetMapper={dashboardDetailMapper}
            dashboardDetailsRequest={dashboardDetailRequest}
            addManualQueryTitle={addManualQueryTitle}
            connectorIdentifier={connectorRef}
            manuallyInputQueries={manualQueries}
            dashboards={dashboards}
            showSpinnerOnLoad={!selectedMetricInfo}
            onSelectMetric={(id, metricName, query, widget, dashboardId, dashboardTitle) => {
              onWidgetMetricSelected({
                id,
                metricName,
                query,
                widgetName: widget,
                dashboardTitle,
                dashboardId
              })
            }}
          />
        }
        content={
          <Container className={css.setupContainer}>
            <Heading level={3} color={Color.BLACK} className={css.sectionHeading}>
              {getString('cv.monitoringSources.gco.mapMetricsToServicesPage.querySpecifications')}
            </Heading>
            {formikProps.values?.isManualQuery && !isTemplate && (
              <Container className={css.manualQueryWarning}>
                <Text icon="warning-sign" iconProps={{ size: 14 }}>
                  {getString('cv.monitoringSources.prometheus.isManualQuery')}
                </Text>
                <Text intent="primary" onClick={() => onChangeManualEditQuery?.(false)}>
                  {getString('cv.monitoringSources.prometheus.undoManualQuery')}
                </Text>
              </Container>
            )}
            <MetricErrorAndLoading isEmpty={isEmpty(omit(formikProps.values, 'identifier'))} loading={metricLoading}>
              <Container className={css.metricsMappingContent}>
                <Container className={css.metricsQueryBuilderContainer}>
                  {metricDetailsContent}
                  <Container className={css.healthServicesContainer}>
                    <SelectHealthSourceServices
                      values={{
                        sli,
                        healthScore,
                        riskCategory,
                        serviceInstance,
                        continuousVerification
                      }}
                      metricPackResponse={metricPackResponse}
                      labelNamesResponse={
                        { data: { data: serviceInstanceList } } as ReturnType<typeof useGetLabelNames>
                      }
                      isTemplate={isTemplate}
                      expressions={expressions}
                    />
                  </Container>
                </Container>
                <Container className={css.validationContainer}>
                  <QueryContent
                    key={formikProps.values.identifier}
                    textAreaProps={{ readOnly: !selectedMetricInfo?.queryEditable }}
                    handleFetchRecords={async () => {
                      if (!shouldShowChart) {
                        setShouldShowChart(true)
                      }
                      if (!formikProps?.values?.query?.length) {
                        return
                      }
                      onFetchTimeseriesData(formikProps.values.query)
                    }}
                    isDialogOpen={false}
                    onEditQuery={isCustomCreatedMetric && !isManualQuery ? openDialog : undefined}
                    query={selectedMetricInfo.query}
                    loading={!selectedMetricInfo}
                    textAreaName={FieldNames.QUERY}
                    isTemplate={isTemplate}
                    expressions={expressions}
                    isConnectorRuntimeOrExpression={isConnectorRuntimeOrExpression}
                  />
                  <MetricsValidationChart
                    submitQueryText={'cv.monitoringSources.datadogLogs.submitQueryToSeeRecords'}
                    loading={timeseriesDataLoading}
                    error={timeseriesDataError}
                    sampleData={sampleData}
                    queryValue={selectedMetricInfo?.query}
                    isQueryExecuted={shouldShowChart}
                    onRetry={async () => {
                      if (!formikProps?.values?.query?.length) {
                        return
                      }
                      onFetchTimeseriesData(formikProps.values.query)
                    }}
                  />
                </Container>
              </Container>
            </MetricErrorAndLoading>
            <DrawerFooter onPrevious={onPrevious} isSubmit onNext={onNextClicked} />
          </Container>
        }
      />
    </Container>
  )
}
