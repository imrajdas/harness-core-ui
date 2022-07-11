/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import type { ITagInputProps } from '@blueprintjs/core'
import { FormInput, SelectOption } from '@wings-software/uicore'
import { DatadogMetricsHealthSourceFieldNames } from '@cv/pages/health-source/connectors/DatadogMetricsHealthSource/DatadogMetricsHealthSource.constants'
import GroupName from '@cv/components/GroupName/GroupName'
import type { DatadogAggregationType } from '@cv/pages/health-source/connectors/DatadogMetricsHealthSource/DatadogMetricsHealthSource.type'
import { useStrings } from 'framework/strings'
import {
  DatadogMetricsQueryBuilder,
  DatadogMetricsQueryExtractor,
  getActiveMetric,
  getDatadogAggregationOptions,
  getOptions,
  getPlaceholder,
  initializeDatadogGroupNames,
  mapMetricTagsToMetricTagsOptions,
  onMetricChange,
  renderSearchLoading,
  setSearchPredicate,
  setServiceInstanceTag
} from '@cv/pages/health-source/connectors/DatadogMetricsHealthSource/components/DatadogMetricsDetailsContent/DatadogMetricsDetailsContent.utils'
import { NameId } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'
import type { DatadogMetricsDetailsContentProps } from './DatadogMetricsDetailsContent.type'
import css from '../../DatadogMetricsHealthSource.module.scss'

export default function DatadogMetricsDetailsContent(props: DatadogMetricsDetailsContentProps): JSX.Element {
  const {
    selectedMetric,
    selectedMetricData,
    formikProps,
    metricHealthDetailsData,
    setMetricHealthDetailsData,
    metricTags,
    activeMetrics,
    metricTagsLoading,
    activeMetricsLoading,
    fetchActiveMetrics,
    fetchMetricTags
  } = props
  const { getString } = useStrings()
  const [metricGroupNames, setMetricGroupNames] = useState<SelectOption[]>(
    initializeDatadogGroupNames(metricHealthDetailsData, getString)
  )

  const aggregationItems = useMemo(() => getDatadogAggregationOptions(getString), [])

  const currentAggregation = useMemo(() => {
    return aggregationItems.find(aggregationItem => {
      return selectedMetricData?.aggregator === aggregationItem.value
    })
  }, [selectedMetricData?.aggregator, aggregationItems])

  const activeMetricsOptions = useMemo(() => {
    return (
      (activeMetrics &&
        Array.isArray(activeMetrics) &&
        activeMetrics?.map(activeMetric => {
          return {
            value: activeMetric,
            label: activeMetric
          }
        })) ||
      []
    )
  }, [activeMetrics, activeMetricsLoading])

  const [isDefaultMetricSet, setIsDefaultMetricSet] = useState(false)
  const [defaultMetric, setDefaultMetric] = useState<SelectOption[]>()
  const [itemList, setItemList] = useState<SelectOption[]>(
    getOptions(activeMetricsOptions, getString, activeMetricsLoading)
  )

  useEffect(() => {
    if (!isDefaultMetricSet && activeMetricsOptions.length) {
      setIsDefaultMetricSet(true)
      setDefaultMetric(activeMetricsOptions)
    }
    setItemList(getOptions(activeMetricsOptions, getString, activeMetricsLoading))
  }, [activeMetricsOptions])

  const metricTagsOptions = useMemo(() => {
    return mapMetricTagsToMetricTagsOptions(metricTags || [])
  }, [metricTags])

  const currentActiveMetric: SelectOption = useMemo(
    () => getActiveMetric(activeMetricsOptions, selectedMetricData),
    [selectedMetricData?.metric, activeMetricsOptions]
  )

  useEffect(() => {
    setServiceInstanceTag(formikProps, onRebuildMetricData)
  }, [formikProps.values?.serviceInstance])

  useEffect(() => {
    if (
      selectedMetricData?.metricPath &&
      formikProps.values.metricPath === selectedMetricData?.metricPath &&
      formikProps.values.isManualQuery
    ) {
      const queryExtractor = DatadogMetricsQueryExtractor(formikProps.values.query || '', [])
      metricHealthDetailsData.set(selectedMetricData.metricPath, {
        ...selectedMetricData,
        query: formikProps.values.query,
        metric: queryExtractor.activeMetric,
        metricTags: queryExtractor.metricTags,
        groupingTags: queryExtractor.groupingTags,
        aggregator: queryExtractor.aggregation
      })
    }
  }, [
    selectedMetricData,
    metricHealthDetailsData,
    formikProps.values.query,
    formikProps.values.metricPath,
    formikProps.values.isManualQuery,
    selectedMetricData?.metricPath
  ])
  const onRebuildMetricData = (
    activeMetric?: string,
    aggregator?: DatadogAggregationType,
    selectedMetricTagOptions: SelectOption[] = [],
    serviceInstanceIdentifier?: string,
    groupName?: SelectOption
  ): void => {
    const selectedMetricTags = selectedMetricTagOptions?.map(tagOption => tagOption.value as string)
    const queryBuilder = DatadogMetricsQueryBuilder(
      activeMetric || '',
      aggregator,
      selectedMetricTags,
      formikProps.values.groupingTags || [],
      serviceInstanceIdentifier
    )
    const query = formikProps.values.isManualQuery ? formikProps.values.query : queryBuilder.query
    if (selectedMetric && selectedMetricData) {
      metricHealthDetailsData.set(selectedMetric, {
        ...formikProps.values,
        isCustomCreatedMetric: selectedMetricData.isCustomCreatedMetric,
        groupName: groupName,
        query: query,
        groupingQuery: queryBuilder.groupingQuery,
        aggregator: aggregator,
        metric: activeMetric,
        serviceInstanceIdentifierTag: serviceInstanceIdentifier,
        metricTags: selectedMetricTagOptions
      })
      setMetricHealthDetailsData(new Map(metricHealthDetailsData))
    }
  }

  useEffect(() => {
    if (!selectedMetricData || formikProps.values.metricPath !== selectedMetricData.metricPath) {
      return
    }
    if (Boolean(selectedMetricData?.isManualQuery) !== Boolean(formikProps.values.isManualQuery)) {
      onRebuildMetricData(undefined, undefined, undefined, undefined, selectedMetricData?.groupName)
    }
  }, [formikProps.values.isManualQuery, formikProps.values.identifier, selectedMetricData])

  return (
    <>
      <NameId
        nameLabel={getString('cv.monitoringSources.metricNameLabel')}
        identifierProps={{
          inputName: DatadogMetricsHealthSourceFieldNames.METRIC_NAME,
          idName: DatadogMetricsHealthSourceFieldNames.METRIC_IDENTIFIER,
          isIdentifierEditable: Boolean(!selectedMetricData?.identifier || selectedMetricData?.isNew)
        }}
      />
      <GroupName
        disabled={!selectedMetricData?.isCustomCreatedMetric}
        item={formikProps?.values?.groupName || { label: '', value: '' }}
        fieldName={DatadogMetricsHealthSourceFieldNames.GROUP_NAME}
        title={getString('cv.monitoringSources.datadog.newDatadogGroupName')}
        groupNames={metricGroupNames}
        onChange={(fieldName: string, chosenOption: SelectOption) => {
          formikProps.setFieldValue(fieldName, chosenOption)
          const filteredMetricTags = formikProps.values.metricTags?.filter(tag => tag.value)
          onRebuildMetricData(
            formikProps.values.metric,
            formikProps.values.aggregator,
            filteredMetricTags,
            formikProps.values.serviceInstanceIdentifierTag,
            chosenOption
          )
        }}
        setGroupNames={setMetricGroupNames}
      />
      <FormInput.Select
        disabled={!selectedMetricData?.isCustomCreatedMetric || formikProps?.values?.isManualQuery}
        label={getString('cv.monitoringSources.metricLabel')}
        name={DatadogMetricsHealthSourceFieldNames.METRIC}
        items={itemList}
        value={currentActiveMetric}
        onQueryChange={search => {
          if (search) {
            fetchActiveMetrics?.(search)
          }
        }}
        placeholder={getPlaceholder(getString, activeMetricsLoading)}
        selectProps={{
          addClearBtn: !activeMetricsLoading,
          whenPopoverClosed: () => defaultMetric && setItemList(defaultMetric),
          itemListPredicate: search => setSearchPredicate(getString, search, itemList)
        }}
        inputGroup={{ rightElement: renderSearchLoading(activeMetricsLoading) }}
        onChange={event => {
          onMetricChange(event.value as string, formikProps, onRebuildMetricData, fetchActiveMetrics)
        }}
      />
      <FormInput.Select
        disabled={!selectedMetricData?.isCustomCreatedMetric || formikProps?.values?.isManualQuery}
        label={getString('cv.monitoringSources.prometheus.aggregator')}
        name={DatadogMetricsHealthSourceFieldNames.AGGREGATOR}
        items={aggregationItems}
        isOptional={true}
        value={currentAggregation || { label: '', value: '' }}
        onChange={event => {
          formikProps.setFieldValue(DatadogMetricsHealthSourceFieldNames.AGGREGATOR, event.value)
          onRebuildMetricData(
            formikProps.values.metric,
            event.value as DatadogAggregationType,
            formikProps.values.metricTags,
            formikProps.values.serviceInstanceIdentifierTag,
            formikProps.values.groupName
          )
        }}
        selectProps={{
          addClearBtn: true
        }}
      />
      <FormInput.MultiSelect
        className={css.metricTag}
        disabled={!selectedMetricData?.isCustomCreatedMetric || formikProps?.values?.isManualQuery}
        label={getString('cv.monitoringSources.gco.mapMetricsToServicesPage.metricTagsLabel')}
        name={DatadogMetricsHealthSourceFieldNames.METRIC_TAGS}
        items={getOptions(metricTagsOptions, getString, metricTagsLoading)}
        isOptional={true}
        tagInputProps={{ rightElement: renderSearchLoading(metricTagsLoading) } as unknown as ITagInputProps}
        multiSelectProps={{
          onQueryChange: search => fetchMetricTags?.(search)
        }}
        onChange={selectedOptions => {
          onRebuildMetricData(
            formikProps.values.metric,
            formikProps.values.aggregator,
            selectedOptions.filter(value => (value.value as string).length),
            formikProps.values.serviceInstanceIdentifierTag,
            formikProps.values.groupName
          )
        }}
      />
    </>
  )
}
