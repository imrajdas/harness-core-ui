/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext, useMemo, useState } from 'react'
import { Formik, FormikForm, getMultiTypeFromValue, MultiTypeInputType, Utils } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import { SetupSourceTabsContext } from '@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs'
import { SetupSourceLayout } from '@cv/components/CVSetupSourcesView/SetupSourceLayout/SetupSourceLayout'
import { MultiItemsSideNav } from '@cv/components/MultiItemsSideNav/MultiItemsSideNav'
import DrawerFooter from '@cv/pages/health-source/common/DrawerFooter/DrawerFooter'
import {
  initializeSelectedMetricsMap,
  transformDatadogHealthSourceToDatadogLogsSetupSource,
  transformDatadogLogsSetupSourceToHealthSource,
  updateSelectedMetricsMap,
  validateMappings
} from '@cv/pages/health-source/connectors/DatadogLogsHealthSource/DatadogLogsHealthSource.utils'
import DatadogLogsMapToService from '@cv/pages/health-source/connectors/DatadogLogsHealthSource/components/DatadogLogsMapToService'
import type {
  DatadogLogsHealthSourceProps,
  DatadogLogsInfo,
  SelectedAndMappedMetrics
} from './DatadogLogsHealthSource.type'
import css from '@cv/pages/health-source/connectors/DatadogLogsHealthSource/DatadogLogsHealthSource.module.scss'

export function DatadogLogsHealthSource(props: DatadogLogsHealthSourceProps): JSX.Element {
  const { data: sourceData, isTemplate, expressions } = props
  const { onPrevious } = useContext(SetupSourceTabsContext)
  const { getString } = useStrings()
  const [rerenderKey, setRerenderKey] = useState('')
  const transformedSourceData = useMemo(
    () => transformDatadogHealthSourceToDatadogLogsSetupSource(sourceData),
    [sourceData]
  )
  const isConnectorRuntimeOrExpression =
    getMultiTypeFromValue(transformedSourceData?.connectorRef as string) !== MultiTypeInputType.FIXED

  const [{ selectedMetric, mappedMetrics }, setMappedMetrics] = useState<SelectedAndMappedMetrics>(
    initializeSelectedMetricsMap(
      getString('cv.monitoringSources.datadogLogs.datadogLogsQuery'),
      transformedSourceData.logsDefinitions.size > 0 ? transformedSourceData.logsDefinitions : undefined,
      isConnectorRuntimeOrExpression
    )
  )

  const [{ createdMetrics, selectedMetricIndex }, setCreatedMetrics] = useState({
    createdMetrics: Array.from(mappedMetrics.keys()) || [
      getString('cv.monitoringSources.datadogLogs.datadogLogsQuery')
    ],
    selectedMetricIndex: Array.from(mappedMetrics.keys()).findIndex(metric => metric === selectedMetric)
  })

  return (
    <Formik<DatadogLogsInfo | undefined>
      formName="mapDatadogLogs"
      initialValues={mappedMetrics.get(selectedMetric || '')}
      isInitialValid={(args: any) =>
        Object.keys(validateMappings(getString, createdMetrics, selectedMetricIndex, args.initialValues)).length === 0
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      onSubmit={async logsInfo => {
        if (logsInfo) {
          mappedMetrics.set(selectedMetric, {
            ...logsInfo
          })
        }
        await props.onSubmit(
          sourceData,
          transformDatadogLogsSetupSourceToHealthSource({
            ...transformedSourceData,
            logsDefinitions: mappedMetrics
          })
        )
      }}
      enableReinitialize={true}
      key={rerenderKey}
      validate={values => {
        return validateMappings(getString, createdMetrics, selectedMetricIndex, values)
      }}
    >
      {formikProps => (
        <FormikForm className={css.formContainer}>
          <SetupSourceLayout
            leftPanelContent={
              <MultiItemsSideNav
                defaultMetricName={getString('cv.monitoringSources.datadogLogs.datadogLogsQuery')}
                tooptipMessage={getString('cv.monitoringSources.gcoLogs.addQueryTooltip')}
                addFieldLabel={getString('cv.monitoringSources.addQuery')}
                createdMetrics={createdMetrics}
                defaultSelectedMetric={selectedMetric}
                renamedMetric={formikProps.values?.metricName}
                onRemoveMetric={(removedMetric, updatedMetric, updatedList, smIndex) => {
                  setMappedMetrics(oldState => {
                    const { selectedMetric: oldMetric, mappedMetrics: oldMappedMetric } = oldState
                    const updatedMap = new Map(oldMappedMetric)

                    if (updatedMap.has(removedMetric)) {
                      updatedMap.delete(removedMetric)
                    } else {
                      // handle case where user updates the metric name for current selected metric
                      updatedMap.delete(oldMetric)
                    }

                    // update map with current values
                    if (formikProps.values?.metricName !== removedMetric) {
                      updatedMap.set(
                        updatedMetric,
                        { ...(formikProps.values as DatadogLogsInfo) } || { name: updatedMetric }
                      )
                    } else {
                      setRerenderKey(Utils.randomId())
                    }

                    setCreatedMetrics({ selectedMetricIndex: smIndex, createdMetrics: updatedList })
                    return { selectedMetric: updatedMetric, mappedMetrics: updatedMap }
                  })
                }}
                onSelectMetric={(newMetric, updatedList, smIndex) => {
                  setCreatedMetrics({ selectedMetricIndex: smIndex, createdMetrics: updatedList })
                  setMappedMetrics((oldState: any) => {
                    return updateSelectedMetricsMap({
                      updatedMetric: newMetric,
                      oldMetric: oldState.selectedMetric,
                      mappedMetrics: new Map<string, DatadogLogsInfo>(oldState.mappedMetrics),
                      formikProps,
                      isConnectorRuntimeOrExpression
                    })
                  })
                  setRerenderKey(Utils.randomId())
                }}
                isValidInput={formikProps.isValid}
              />
            }
            content={
              <DatadogLogsMapToService
                sourceData={sourceData}
                formikProps={formikProps}
                isTemplate={isTemplate}
                expressions={expressions}
              />
            }
          />
          <DrawerFooter isSubmit onPrevious={onPrevious} onNext={formikProps.submitForm} />
        </FormikForm>
      )}
    </Formik>
  )
}
