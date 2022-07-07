/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useMemo, useState } from 'react'
import {
  Accordion,
  Container,
  FormInput,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  Utils
} from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import { SetupSourceCardHeader } from '@cv/components/CVSetupSourcesView/SetupSourceCardHeader/SetupSourceCardHeader'
import Card from '@cv/components/Card/Card'
import { QueryViewer } from '@cv/components/QueryViewer/QueryViewer'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useGetDatadogLogIndexes, useGetDatadogLogSampleData } from 'services/cv'

import { MapDatadogLogsFieldNames } from '@cv/pages/health-source/connectors/DatadogLogsHealthSource/components/DatadogLogsMapToService.constants'
import type { DatadogLogsMapToServiceProps } from '@cv/pages/health-source/connectors/DatadogLogsHealthSource/components/DatadogLogsMapToService.type'
import css from '@cv/pages/health-source/connectors/DatadogLogsHealthSource/components/DatadogLogsMapToService.module.scss'

export default function DatadogLogsMapToService(props: DatadogLogsMapToServiceProps): JSX.Element {
  const { sourceData, formikProps, isTemplate, expressions } = props
  const { projectIdentifier, orgIdentifier, accountId } = useParams<ProjectPathProps & { identifier: string }>()
  const { getString } = useStrings()
  const [records, setRecords] = useState<Record<string, any>[]>([])
  const [isQueryExecuted, setIsQueryExecuted] = useState(false)
  const [logIndexesTracingId] = useMemo(() => [Utils.randomId()], [])
  const values = formikProps?.values
  const query = useMemo(() => (values?.query?.length ? values.query : ''), [values])

  const connectorIdentifier = sourceData?.connectorRef?.value || (sourceData.connectorRef as string)
  const isConnectorRuntimeOrExpression = getMultiTypeFromValue(connectorIdentifier) !== MultiTypeInputType.FIXED

  React.useEffect(() => {
    if (isConnectorRuntimeOrExpression) {
      formikProps.setFieldValue('query', '<+input>')
    }
  }, [isConnectorRuntimeOrExpression])

  const { data: indexes } = useGetDatadogLogIndexes({
    queryParams: {
      projectIdentifier,
      orgIdentifier,
      accountId,
      connectorIdentifier,
      tracingId: logIndexesTracingId
    }
  })
  const logsSampleDataQueryParams = useMemo(
    () => ({
      accountId,
      projectIdentifier,
      orgIdentifier,
      tracingId: Utils.randomId(),
      connectorIdentifier
    }),
    [accountId, projectIdentifier, orgIdentifier, sourceData.connectorRef]
  )
  const {
    mutate: queryDatadog,
    loading,
    error
  } = useGetDatadogLogSampleData({
    queryParams: logsSampleDataQueryParams
  })

  const fetchDatadogRecords = useCallback(async () => {
    const recordsData = await queryDatadog({ query: query }, { queryParams: { ...logsSampleDataQueryParams } })
    setRecords(recordsData?.data as Record<string, any>[])
    setIsQueryExecuted(true)
  }, [query, queryDatadog, logsSampleDataQueryParams])

  const hostIdentifierKeysOptions = useMemo(() => {
    const record = records?.length > 0 ? records[0] : null
    if (!record) {
      return []
    }
    return (
      Array.from(new Set((record.attributes.tags as string[]).concat('host')))
        ?.map(tag => {
          return tag.split(':')?.[0]
        })
        .filter(tagKey => !!tagKey)
        .map(tagKey => {
          return {
            label: tagKey,
            value: tagKey
          }
        }) || []
    )
  }, [records])
  const logIndexesOptions = useMemo(() => {
    if (!indexes?.data) {
      return []
    }
    return indexes?.data?.map(index => {
      return {
        value: index,
        label: index
      }
    })
  }, [indexes?.data])

  return (
    <Container className={css.main}>
      <SetupSourceCardHeader
        mainHeading={getString('cv.monitoringSources.prometheus.querySpecificationsAndMappings')}
        subHeading={getString('cv.monitoringSources.prometheus.customizeQuery')}
      />
      <Card>
        <Layout.Horizontal spacing="xlarge">
          <Accordion activeId="metricToService" className={css.accordian}>
            <Accordion.Panel
              id="metricToService"
              summary={getString('cv.monitoringSources.mapQueriesToServices')}
              details={
                <Container className={css.content}>
                  <FormInput.Text
                    label={getString('cv.monitoringSources.queryNameLabel')}
                    name={MapDatadogLogsFieldNames.METRIC_NAME}
                  />
                  {isTemplate ? (
                    <FormInput.MultiSelectTypeInput
                      label={getString('cv.monitoringSources.datadogLogs.logIndexesLabel')}
                      name={MapDatadogLogsFieldNames.INDEXES}
                      selectItems={logIndexesOptions}
                      multiSelectTypeInputProps={{
                        expressions
                      }}
                    />
                  ) : (
                    <FormInput.MultiSelect
                      label={getString('cv.monitoringSources.datadogLogs.logIndexesLabel')}
                      name={MapDatadogLogsFieldNames.INDEXES}
                      items={logIndexesOptions}
                      onChange={selectedOptions => {
                        formikProps.setFieldValue(MapDatadogLogsFieldNames.INDEXES, selectedOptions)
                      }}
                    />
                  )}
                  {isTemplate ? (
                    <FormInput.MultiTypeInput
                      label={getString('cv.monitoringSources.serviceInstanceIdentifier')}
                      name={MapDatadogLogsFieldNames.SERVICE_INSTANCE_IDENTIFIER_TAG}
                      selectItems={hostIdentifierKeysOptions}
                      multiTypeInputProps={{
                        expressions
                      }}
                    />
                  ) : (
                    <FormInput.Select
                      label={getString('cv.monitoringSources.serviceInstanceIdentifier')}
                      name={MapDatadogLogsFieldNames.SERVICE_INSTANCE_IDENTIFIER_TAG}
                      items={hostIdentifierKeysOptions}
                      onChange={event => {
                        formikProps.setFieldValue(MapDatadogLogsFieldNames.SERVICE_INSTANCE_IDENTIFIER_TAG, event.value)
                      }}
                    />
                  )}
                </Container>
              }
            />
          </Accordion>
          <QueryViewer
            queryNotExecutedMessage={getString('cv.monitoringSources.datadogLogs.submitQueryToSeeRecords')}
            isQueryExecuted={isQueryExecuted}
            className={css.validationContainer}
            records={records}
            fetchRecords={fetchDatadogRecords}
            loading={loading}
            error={error}
            query={formikProps?.values?.query || ''}
            dataTooltipId={'datadogQuery'}
            isTemplate={isTemplate}
            expressions={expressions}
            isConnectorRuntimeOrExpression={isConnectorRuntimeOrExpression}
          />
        </Layout.Horizontal>
      </Card>
    </Container>
  )
}
