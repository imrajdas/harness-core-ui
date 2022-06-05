/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { Container, Text, Layout } from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import { noop } from 'lodash-es'
import { useStrings } from 'framework/strings'
import type { CEView } from 'services/ce'
import {
  QlceViewFieldInputInput,
  ViewChartType,
  useFetchPerspectiveTimeSeriesQuery,
  QlceViewTimeGroupType,
  useFetchperspectiveGridQuery,
  ViewTimeRangeType
} from 'services/ce/services'
import CloudCostInsightChart from '@ce/components/CloudCostInsightChart/CloudCostInsightChart'
import {
  normalizeViewRules,
  getGroupByFilter,
  getTimeRangeFilter,
  getTimeFilters,
  getViewFilterForId,
  perspectiveDefaultTimeRangeMapper,
  getRuleFilters
} from '@ce/utils/perspectiveUtils'
import { CCM_CHART_TYPES } from '@ce/constants'
import { DAYS_FOR_TICK_INTERVAL } from '@ce/components/CloudCostInsightChart/Chart'
import { CE_DATE_FORMAT_INTERNAL, getGMTEndDateTime, getGMTStartDateTime } from '@ce/utils/momentUtils'
import type { TimeRangeFilterType } from '@ce/types'
import { AGGREGATE_FUNCTION } from '../PerspectiveGrid/Columns'
import PerspectiveGrid from '../PerspectiveGrid/PerspectiveGrid'
import GroupByView from './GroupByView/GroupByView'
import css from './PerspectiveBuilderPreview.module.scss'

interface PerspectiveBuilderPreviewProps {
  groupBy: QlceViewFieldInputInput
  setGroupBy: (groupBy: QlceViewFieldInputInput) => void
  chartType: ViewChartType
  setChartType: (type: ViewChartType) => void
  formValues: CEView
  showBusinessMappingButton?: boolean
}

const PerspectiveBuilderPreview: React.FC<PerspectiveBuilderPreviewProps> = ({
  groupBy,
  setGroupBy,
  chartType,
  setChartType,
  formValues,
  showBusinessMappingButton
}) => {
  const { perspectiveId } = useParams<{ perspectiveId: string }>()

  const timeRangeMapper = perspectiveDefaultTimeRangeMapper

  const timeRange = formValues.viewTimeRange?.viewTimeRangeType || ViewTimeRangeType.Last_7

  const dateRange = timeRangeMapper[timeRange]

  const timeRangeObj: TimeRangeFilterType = {
    to: dateRange[1].format(CE_DATE_FORMAT_INTERNAL),
    from: dateRange[0].format(CE_DATE_FORMAT_INTERNAL)
  }

  const [chartResult] = useFetchPerspectiveTimeSeriesQuery({
    variables: {
      filters: [
        getViewFilterForId(perspectiveId, true),
        ...getTimeFilters(getGMTStartDateTime(timeRangeObj.from), getGMTEndDateTime(timeRangeObj.to)),
        ...getRuleFilters(normalizeViewRules(formValues.viewRules))
      ],
      limit: 12,
      groupBy: [
        getTimeRangeFilter(
          (formValues.viewVisualization?.granularity as QlceViewTimeGroupType) || QlceViewTimeGroupType.Day
        ),
        getGroupByFilter(groupBy)
      ],
      preferences: {
        includeOthers: false,
        includeUnallocatedCost: false
      }
    }
  })

  const [gridResults] = useFetchperspectiveGridQuery({
    variables: {
      aggregateFunction: AGGREGATE_FUNCTION.DEFAULT,
      filters: [
        getViewFilterForId(perspectiveId, true),
        ...getTimeFilters(dateRange[0].valueOf(), dateRange[1].valueOf()),
        ...getRuleFilters(normalizeViewRules(formValues.viewRules))
      ],
      limit: 100,
      offset: 0,
      isClusterOnly: false,
      groupBy: [getGroupByFilter(groupBy)]
    }
  })

  const { data: gridData, fetching: gridFetching } = gridResults
  const { data: chartData, fetching } = chartResult

  const { getString } = useStrings()
  return (
    <Container padding="xxlarge" background="white" className={css.previewMainContainer}>
      <Layout.Vertical spacing="xlarge">
        <Container>
          <Text font={{ variation: FontVariation.H4 }} margin={{ bottom: 'medium' }}>
            {getString('ce.perspectives.createPerspective.preview.title')}
          </Text>
          <GroupByView
            timeRange={timeRangeObj}
            setGroupBy={setGroupBy}
            groupBy={groupBy}
            chartType={chartType}
            setChartType={setChartType}
            showBusinessMappingButton={showBusinessMappingButton}
          />

          <CloudCostInsightChart
            chartType={chartType === ViewChartType.StackedLineChart ? CCM_CHART_TYPES.AREA : CCM_CHART_TYPES.COLUMN}
            columnSequence={[]}
            setFilterUsingChartClick={() => {
              noop
            }}
            fetching={fetching}
            showLegends={false}
            data={chartData?.perspectiveTimeSeriesStats as any}
            aggregation={
              (formValues.viewVisualization?.granularity as QlceViewTimeGroupType) || QlceViewTimeGroupType.Day
            }
            xAxisPointCount={chartData?.perspectiveTimeSeriesStats?.stats?.length || DAYS_FOR_TICK_INTERVAL + 1}
          />
        </Container>
        <Container width="100%">
          <Text color="grey900">Cost Breakdown</Text>
          {gridData?.perspectiveGrid?.data && (
            <PerspectiveGrid
              gridFetching={gridFetching}
              gridData={gridData?.perspectiveGrid?.data as any}
              groupBy={groupBy}
              showColumnSelector={false}
              tempGridColumns={true}
              showPagination={false}
            />
          )}
        </Container>
      </Layout.Vertical>
    </Container>
  )
}

export default PerspectiveBuilderPreview
