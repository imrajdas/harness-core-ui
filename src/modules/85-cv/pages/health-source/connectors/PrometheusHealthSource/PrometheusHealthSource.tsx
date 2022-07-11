/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useContext, useMemo } from 'react'
import {
  Container,
  Formik,
  FormikForm,
  Text,
  Layout,
  SelectOption,
  Utils,
  Accordion,
  getMultiTypeFromValue,
  MultiTypeInputType
} from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { noop } from 'lodash-es'
import { SetupSourceTabsContext } from '@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { GroupName } from '@cv/pages/health-source/common/GroupName/GroupName'
import { SetupSourceCardHeader } from '@cv/components/CVSetupSourcesView/SetupSourceCardHeader/SetupSourceCardHeader'
import DrawerFooter from '@cv/pages/health-source/common/DrawerFooter/DrawerFooter'
import { StackdriverDefinition, useGetLabelNames, useGetMetricNames, useGetMetricPacks } from 'services/cv'
import { useStrings } from 'framework/strings'
import { NameId } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'
import useGroupedSideNaveHook from '@cv/hooks/GroupedSideNaveHook/useGroupedSideNaveHook'
import { PrometheusQueryBuilder } from './components/PrometheusQueryBuilder/PrometheusQueryBuilder'
import {
  validateMappings,
  transformPrometheusSetupSourceToHealthSource,
  transformPrometheusHealthSourceToSetupSource
} from './PrometheusHealthSource.utils'
import {
  PrometheusMonitoringSourceFieldNames,
  MapPrometheusQueryToService,
  PrometheusSetupSource
} from './PrometheusHealthSource.constants'
import { initializeGroupNames } from '../../common/GroupName/GroupName.utils'
import CustomMetric from '../../common/CustomMetric/CustomMetric'
import type { UpdatedHealthSource } from '../../HealthSourceDrawer/HealthSourceDrawerContent.types'
import { updateMultiSelectOption } from './components/PrometheusQueryBuilder/components/PrometheusFilterSelector/utils'
import { PrometheusQueryViewer } from './components/PrometheusQueryViewer/PrometheusQueryViewer'
import SelectHealthSourceServices from '../../common/SelectHealthSourceServices/SelectHealthSourceServices'
import css from './PrometheusHealthSource.module.scss'

export interface PrometheusHealthSourceProps {
  data: any
  onSubmit: (formdata: PrometheusSetupSource, UpdatedHealthSource: UpdatedHealthSource) => Promise<void>
  isTemplate?: boolean
  expressions?: string[]
}

export function PrometheusHealthSource(props: PrometheusHealthSourceProps): JSX.Element {
  const { data: sourceData, onSubmit, isTemplate, expressions } = props

  const { projectIdentifier, orgIdentifier, accountId } = useParams<ProjectPathProps & { identifier: string }>()

  const {
    onPrevious,
    sourceData: { existingMetricDetails }
  } = useContext(SetupSourceTabsContext)

  const metricDefinitions = existingMetricDetails?.spec?.metricDefinitions

  const { getString } = useStrings()
  const connectorIdentifier = (sourceData?.connectorRef?.value || sourceData?.connectorRef) as string
  const isConnectorRuntimeOrExpression = getMultiTypeFromValue(connectorIdentifier) !== MultiTypeInputType.FIXED

  const [labelNameTracingId, metricNameTracingId] = useMemo(() => [Utils.randomId(), Utils.randomId()], [])
  const metricPackResponse = useGetMetricPacks({
    queryParams: { projectIdentifier, orgIdentifier, accountId, dataSourceType: 'PROMETHEUS' }
  })
  const labelNamesResponse = useGetLabelNames({
    lazy: isConnectorRuntimeOrExpression,
    queryParams: { projectIdentifier, orgIdentifier, accountId, connectorIdentifier, tracingId: labelNameTracingId }
  })
  const metricNamesResponse = useGetMetricNames({
    queryParams: {
      projectIdentifier,
      orgIdentifier,
      accountId,
      tracingId: metricNameTracingId,
      connectorIdentifier
    }
  })

  const transformedSourceData = useMemo(
    () => transformPrometheusHealthSourceToSetupSource(sourceData, getString),
    [sourceData]
  )

  const {
    createdMetrics,
    mappedMetrics,
    selectedMetric,
    groupedCreatedMetrics,
    groupedCreatedMetricsList,
    setMappedMetrics,
    setCreatedMetrics,
    setGroupedCreatedMetrics
  } = useGroupedSideNaveHook({
    defaultCustomMetricName: getString('cv.monitoringSources.prometheus.prometheusMetric'),
    initCustomMetricData: {},
    mappedServicesAndEnvs: transformedSourceData.mappedServicesAndEnvs
  })

  const [prometheusGroupNames, setPrometheusGroupName] = useState<SelectOption[]>(
    initializeGroupNames(mappedMetrics, getString)
  )

  const initialFormValues = mappedMetrics.get(selectedMetric || '') as MapPrometheusQueryToService

  return (
    <Formik<MapPrometheusQueryToService>
      formName="mapPrometheus"
      initialValues={initialFormValues}
      isInitialValid={(args: any) =>
        Object.keys(
          validateMappings(
            getString,
            groupedCreatedMetricsList,
            groupedCreatedMetricsList.indexOf(selectedMetric),
            args.initialValues,
            mappedMetrics
          )
        ).length === 0
      }
      onSubmit={noop}
      enableReinitialize={true}
      validate={values => {
        return validateMappings(
          getString,
          groupedCreatedMetricsList,
          groupedCreatedMetricsList.indexOf(selectedMetric),
          values,
          mappedMetrics
        )
      }}
    >
      {formikProps => {
        const currentSelectedMetricDetail = metricDefinitions?.find(
          (metricDefinition: StackdriverDefinition) =>
            metricDefinition.metricName === mappedMetrics.get(selectedMetric || '')?.metricName
        )

        if (!formikProps.touched?.identifier) {
          formikProps.setTouched({
            ...formikProps.touched,
            [PrometheusMonitoringSourceFieldNames.METRIC_IDENTIFIER]: true,
            [PrometheusMonitoringSourceFieldNames.METRIC_NAME]: true
          })
        }

        return (
          <FormikForm>
            <CustomMetric
              isPrimaryMetric
              isValidInput={formikProps.isValid}
              setMappedMetrics={setMappedMetrics}
              selectedMetric={selectedMetric}
              formikValues={formikProps.values as any}
              mappedMetrics={mappedMetrics}
              createdMetrics={createdMetrics}
              setCreatedMetrics={setCreatedMetrics}
              defaultMetricName={getString('cv.monitoringSources.prometheus.prometheusMetric')}
              tooptipMessage={getString('cv.monitoringSources.gcoLogs.addQueryTooltip')}
              addFieldLabel={getString('cv.monitoringSources.addMetric')}
              initCustomForm={
                {
                  query: '',
                  groupName: { label: '', value: '' },
                  isManualQuery: false
                } as any
              }
              groupedCreatedMetrics={groupedCreatedMetrics}
              setGroupedCreatedMetrics={setGroupedCreatedMetrics}
            >
              <Container className={css.main}>
                <SetupSourceCardHeader
                  mainHeading={getString('cv.monitoringSources.prometheus.querySpecificationsAndMappings')}
                  subHeading={getString('cv.monitoringSources.prometheus.customizeQuery')}
                />
                {formikProps.values?.isManualQuery && !isTemplate && (
                  <Container className={css.manualQueryWarning}>
                    <Text icon="warning-sign" iconProps={{ size: 14 }}>
                      {getString('cv.monitoringSources.prometheus.isManualQuery')}
                    </Text>
                    <Text
                      intent="primary"
                      onClick={() =>
                        formikProps.setFieldValue(PrometheusMonitoringSourceFieldNames.IS_MANUAL_QUERY, false)
                      }
                    >
                      {getString('cv.monitoringSources.prometheus.undoManualQuery')}
                    </Text>
                  </Container>
                )}
                <Layout.Horizontal className={css.content} spacing="xlarge">
                  <Accordion activeId="metricToService" className={css.accordian}>
                    <Accordion.Panel
                      id="metricToService"
                      summary={getString('cv.monitoringSources.mapMetricsToServices')}
                      details={
                        <>
                          <NameId
                            nameLabel={getString('cv.monitoringSources.metricNameLabel')}
                            identifierProps={{
                              inputName: PrometheusMonitoringSourceFieldNames.METRIC_NAME,
                              idName: PrometheusMonitoringSourceFieldNames.METRIC_IDENTIFIER,
                              isIdentifierEditable: Boolean(!currentSelectedMetricDetail?.identifier)
                            }}
                          />
                          <GroupName
                            groupNames={prometheusGroupNames}
                            onChange={formikProps.setFieldValue}
                            item={formikProps.values?.groupName}
                            setGroupNames={setPrometheusGroupName}
                          />
                        </>
                      }
                    />
                    {!formikProps.values?.isManualQuery && (
                      <Accordion.Panel
                        id="queryBuilder"
                        summary={getString('cv.monitoringSources.buildYourQuery')}
                        details={
                          <PrometheusQueryBuilder
                            connectorIdentifier={connectorIdentifier}
                            labelNamesResponse={labelNamesResponse}
                            metricNamesResponse={metricNamesResponse}
                            aggregatorValue={formikProps.values?.aggregator}
                            onUpdateFilter={(fieldName, updatedItem) => {
                              formikProps.setFieldValue(
                                fieldName,
                                updateMultiSelectOption(updatedItem, (formikProps.values as any)[fieldName])
                              )
                            }}
                            onRemoveFilter={(fieldName, index) => {
                              const arr = (formikProps.values as any)[fieldName]
                              if (arr) {
                                arr.splice(index, 1)
                                formikProps.setFieldValue(fieldName, Array.from(arr))
                              }
                            }}
                          />
                        }
                      />
                    )}
                    <Accordion.Panel
                      id="assign"
                      summary={getString('cv.monitoringSources.assign')}
                      details={
                        <SelectHealthSourceServices
                          key={formikProps?.values?.identifier}
                          values={{
                            sli: !!formikProps?.values?.sli,
                            riskCategory: formikProps?.values?.riskCategory,
                            healthScore: !!formikProps?.values?.healthScore,
                            continuousVerification: !!formikProps?.values?.continuousVerification
                          }}
                          isTemplate={isTemplate}
                          expressions={expressions}
                          metricPackResponse={metricPackResponse}
                          labelNamesResponse={labelNamesResponse}
                        />
                      }
                    />
                  </Accordion>
                  <PrometheusQueryViewer
                    isTemplate={isTemplate}
                    expressions={expressions}
                    onChange={(fieldName, value) => {
                      if (
                        fieldName === PrometheusMonitoringSourceFieldNames.IS_MANUAL_QUERY &&
                        value === true &&
                        formikProps.values
                      ) {
                        const valuesToSet = {
                          prometheusMetric: undefined,
                          serviceFilter: undefined,
                          envFilter: undefined,
                          additionalFilter: undefined,
                          aggregator: undefined
                        }
                        formikProps.setValues({ ...formikProps.values, ...valuesToSet, isManualQuery: true })
                      } else {
                        formikProps.setFieldValue(fieldName, value)
                      }
                    }}
                    values={formikProps.values}
                    connectorIdentifier={connectorIdentifier}
                  />
                </Layout.Horizontal>
              </Container>
            </CustomMetric>
            <DrawerFooter
              isSubmit
              onPrevious={onPrevious}
              onNext={async () => {
                formikProps.setTouched({
                  ...formikProps.touched,
                  [PrometheusMonitoringSourceFieldNames.PROMETHEUS_METRIC]: true,
                  [PrometheusMonitoringSourceFieldNames.GROUP_NAME]: true,
                  [PrometheusMonitoringSourceFieldNames.SERVICE_FILTER]: true,
                  [PrometheusMonitoringSourceFieldNames.ENVIRONMENT_FILTER]: true,
                  [PrometheusMonitoringSourceFieldNames.SLI]: true,
                  [PrometheusMonitoringSourceFieldNames.RISK_CATEGORY]: true,
                  [PrometheusMonitoringSourceFieldNames.LOWER_BASELINE_DEVIATION]: true,
                  [PrometheusMonitoringSourceFieldNames.METRIC_IDENTIFIER]: true,
                  [PrometheusMonitoringSourceFieldNames.METRIC_NAME]: true
                })

                if (Object.keys(formikProps.errors || {})?.length > 0) {
                  formikProps.validateForm()
                  return
                }
                const updatedMetric = formikProps.values
                if (updatedMetric) mappedMetrics.set(selectedMetric, updatedMetric)
                await onSubmit(
                  sourceData,
                  transformPrometheusSetupSourceToHealthSource({
                    ...transformedSourceData,
                    mappedServicesAndEnvs: mappedMetrics as Map<string, MapPrometheusQueryToService>
                  })
                )
              }}
            />
          </FormikForm>
        )
      }}
    </Formik>
  )
}
