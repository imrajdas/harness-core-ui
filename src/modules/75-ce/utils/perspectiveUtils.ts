/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@wings-software/uicore'
import type Highcharts from 'highcharts'
import { get } from 'lodash-es'
import type { ViewRule, ViewIdCondition, CEView } from 'services/ce'
import type { UseStringsReturn } from 'framework/strings'
import {
  QlceViewTimeFilterOperator,
  ViewFieldIdentifier,
  QlceViewFilterWrapperInput,
  QlceViewFieldInputInput,
  QlceViewGroupByInput,
  QlceViewTimeGroupType,
  QlceViewFilterInput,
  ViewTimeRangeType,
  ViewChartType,
  QlceViewRuleInput
} from 'services/ce/services'
import type { PerspectiveQueryParams } from '@ce/types'
import { CCM_CHART_TYPES } from '@ce/constants'
import { CE_DATE_FORMAT_INTERNAL, DATE_RANGE_SHORTCUTS } from './momentUtils'

const startTimeLabel = 'startTime'

export const getViewFilterForId: (viewId: string, isPreview?: boolean) => QlceViewFilterWrapperInput = (
  viewId: string,
  isPreview = false
) => {
  return { viewMetadataFilter: { viewId: viewId, isPreview: isPreview } } as QlceViewFilterWrapperInput
}

export const getTimeFilters: (from: number, to: number) => QlceViewFilterWrapperInput[] = (from, to) => {
  return [
    {
      timeFilter: {
        field: { fieldId: startTimeLabel, fieldName: startTimeLabel, identifier: ViewFieldIdentifier.Common },
        operator: QlceViewTimeFilterOperator.After,
        value: from
      }
    },
    {
      timeFilter: {
        field: { fieldId: startTimeLabel, fieldName: startTimeLabel, identifier: ViewFieldIdentifier.Common },
        operator: QlceViewTimeFilterOperator.Before,
        value: to
      }
    }
  ] as QlceViewFilterWrapperInput[]
}

export const getGroupByFilter: (groupBy: QlceViewFieldInputInput) => QlceViewGroupByInput = groupBy => {
  return {
    entityGroupBy: groupBy
  } as QlceViewGroupByInput
}

export const getTimeRangeFilter: (aggregation: QlceViewTimeGroupType) => QlceViewGroupByInput = aggregation => {
  return {
    timeTruncGroupBy: {
      resolution: aggregation
    }
  } as QlceViewGroupByInput
}

export const getFilters: (viewConditions: QlceViewFilterInput[]) => QlceViewFilterWrapperInput[] = viewConditions => {
  return viewConditions
    .filter(viewCondition => {
      return viewCondition.values?.length
    })
    .map(viewCondition => {
      return {
        idFilter: {
          values: viewCondition.values,
          operator: viewCondition.operator,
          field: {
            fieldId: viewCondition.field.fieldId,
            fieldName: viewCondition.field.fieldName,
            identifier: viewCondition.field.identifier
          }
        }
      }
    }) as QlceViewFilterWrapperInput[]
}

export const DEFAULT_GROUP_BY = {
  fieldId: 'product',
  fieldName: 'Product',
  identifier: ViewFieldIdentifier.Common,
  identifierName: ViewFieldIdentifier.Common
}

export const GROUP_BY_CLUSTER_NAME = {
  fieldId: 'clusterName',
  fieldName: 'Cluster Name',
  identifier: ViewFieldIdentifier.Cluster,
  identifierName: ViewFieldIdentifier.Cluster
}

export const GROUP_BY_POD = {
  fieldId: 'instanceId',
  fieldName: 'Pod',
  identifier: ViewFieldIdentifier.Cluster,
  identifierName: ViewFieldIdentifier.Cluster
}

export const generateId: (length: number) => string = length => {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

export const CREATE_CALL_OBJECT = {
  viewVersion: 'v1',
  viewTimeRange: {
    viewTimeRangeType: ViewTimeRangeType.Last_7
  },
  viewType: 'CUSTOMER',
  viewVisualization: {
    granularity: QlceViewTimeGroupType.Day,
    groupBy: { ...DEFAULT_GROUP_BY },
    chartType: ViewChartType.StackedLineChart
  }
}

export const normalizeViewRules: (viewRules: ViewRule[] | undefined) => QlceViewRuleInput[] = viewRules => {
  return viewRules
    ? (viewRules
        .map(rule => {
          if (rule) {
            return {
              conditions:
                rule.viewConditions &&
                rule.viewConditions
                  .map(c => {
                    const condition = c as unknown as ViewIdCondition
                    return condition.values && condition.values.length
                      ? {
                          field: {
                            fieldId: condition.viewField?.fieldId,
                            fieldName: condition.viewField?.fieldName,
                            identifier: condition.viewField?.identifier,
                            identifierName: condition.viewField?.identifierName
                          },
                          operator: condition.viewOperator,
                          values: condition.values
                        }
                      : null
                  })
                  .filter(condition => !!condition)
            }
          }
        })
        .filter(rule => rule?.conditions && rule.conditions.length) as QlceViewRuleInput[])
    : []
}

export const getRuleFilters: (rules: QlceViewRuleInput[]) => QlceViewFilterWrapperInput[] = rules => {
  return rules.map(rule => ({
    ruleFilter: rule
  })) as QlceViewFilterWrapperInput[]
}

export const SOURCE_ICON_MAPPING: Record<string, IconName> = {
  AWS: 'service-aws',
  GCP: 'gcp',
  CLUSTER: 'blue-black-cluster',
  CUSTOM: 'pipeline-custom',
  AZURE: 'service-azure'
}

export const perspectiveDefaultTimeRangeMapper: Record<string, moment.Moment[]> = {
  [ViewTimeRangeType.Last_7]: DATE_RANGE_SHORTCUTS.LAST_7_DAYS,
  [ViewTimeRangeType.Last_30]: DATE_RANGE_SHORTCUTS.LAST_30_DAYS,
  [ViewTimeRangeType.LastMonth]: DATE_RANGE_SHORTCUTS.LAST_MONTH,
  [ViewTimeRangeType.CurrentMonth]: DATE_RANGE_SHORTCUTS.CURRENT_MONTH
}

export enum ChartState {
  IN_ACTIVE = 'inactive',
  NONE = ''
}

export const highlightNode = (chartRef: React.RefObject<Highcharts.Chart | undefined>, id: string) => {
  if (chartRef && chartRef.current) {
    const chart = chartRef.current
    chart.series?.length > 1 &&
      chart.series.forEach(chartItem => {
        const nodeId = (chartItem.options as any).nodeId
        if (nodeId !== id) {
          chartItem.setState(ChartState.IN_ACTIVE)
        }
      })
  }
}

export const resetNodeState = (chartRef: React.RefObject<Highcharts.Chart | undefined>) => {
  if (chartRef && chartRef.current) {
    const chart = chartRef.current
    chart.series &&
      chart.series.forEach(chartItem => {
        chartItem.setState(ChartState.NONE)
      })
  }
}

export const clusterInfoUtil: (dataSources?: string[]) => { isClusterOnly: boolean; hasClusterAsSource: boolean } =
  dataSources => {
    let isClusterOnly = false
    let hasClusterAsSource = false
    if (!dataSources?.length) {
      return { isClusterOnly, hasClusterAsSource }
    }
    if (dataSources.length === 1 && dataSources[0] === ViewFieldIdentifier.Cluster) {
      isClusterOnly = true
    }
    if (dataSources.includes(ViewFieldIdentifier.Cluster)) {
      hasClusterAsSource = true
    }
    return { isClusterOnly, hasClusterAsSource }
  }

export const perspectiveDateLabelToDisplayText: (getString: UseStringsReturn['getString']) => Record<string, string> =
  getString => ({
    [ViewTimeRangeType.Last_7]: getString('ce.perspectives.timeRangeConstants.last7Days'),
    [ViewTimeRangeType.Last_30]: getString('projectsOrgs.landingDashboard.last30Days'),
    [ViewTimeRangeType.LastMonth]: getString('ce.perspectives.timeRangeConstants.lastMonth'),
    [ViewTimeRangeType.CurrentMonth]: getString('ce.perspectives.timeRangeConstants.thisMonth')
  })

export const getQueryFiltersFromPerspectiveResponse: (
  perspectiveData: CEView,
  initialValue: Partial<PerspectiveQueryParams>
) => Partial<PerspectiveQueryParams> = (perspectiveData, initialValue) => {
  const resAggregation = get(perspectiveData, 'perspectiveData.granularity', QlceViewTimeGroupType.Day)
  const resGroupBy = get(perspectiveData, 'viewVisualization.groupBy', DEFAULT_GROUP_BY)
  const dateRange =
    (perspectiveData.viewTimeRange?.viewTimeRangeType &&
      perspectiveDefaultTimeRangeMapper[perspectiveData.viewTimeRange?.viewTimeRangeType]) ||
    DATE_RANGE_SHORTCUTS.LAST_7_DAYS

  const cType =
    perspectiveData.viewVisualization?.chartType === ViewChartType.StackedTimeSeries
      ? CCM_CHART_TYPES.COLUMN
      : CCM_CHART_TYPES.AREA

  const updatedQueryParam: Partial<PerspectiveQueryParams> = {}

  if (!initialValue.timeRange) {
    updatedQueryParam['timeRange'] = JSON.stringify({
      to: dateRange[1].format(CE_DATE_FORMAT_INTERNAL),
      from: dateRange[0].format(CE_DATE_FORMAT_INTERNAL)
    })
  }

  if (!initialValue.groupBy) {
    updatedQueryParam['groupBy'] = JSON.stringify(resGroupBy)
  }

  if (!initialValue.aggregation) {
    updatedQueryParam['aggregation'] = JSON.stringify(resAggregation)
  }

  if (!initialValue.chartType) {
    updatedQueryParam['chartType'] = JSON.stringify(cType)
  }

  return updatedQueryParam
}

export const EMPTY_PERSPECTIVE_RULE = {
  type: 'VIEW_ID_CONDITION',
  viewField: {
    fieldId: '',
    fieldName: '',
    identifier: '',
    identifierName: ''
  },
  viewOperator: 'IN',
  values: []
}

export const searchList = (searchVal: string, perspectiveList: any) => {
  if (searchVal) {
    return perspectiveList.filter((item: any) => item?.name?.toLowerCase().includes(searchVal.toLowerCase()))
  }

  return perspectiveList
}

export enum UnallocatedCostClusterFields {
  NAMESPACE_FIELD_ID = 'namespace',
  WORKLOAD_NAME_FIELD_ID = 'workloadName',
  CLOUD_SERVICE_NAME_FIELD_ID = 'cloudServiceName',
  TASK_FIELD_ID = 'taskId',
  LAUNCH_TYPE_FIELD_ID = 'launchType'
}
