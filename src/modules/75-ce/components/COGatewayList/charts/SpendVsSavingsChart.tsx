/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo } from 'lodash-es'
import { Text } from '@harness/uicore'
import { Icon } from '@harness/icons'
import { FontVariation } from '@harness/design-system'
import type { StringsMap } from 'stringTypes'
import { RulesMode } from '@ce/constants'
import type { TimeRangeFilterType } from '@ce/types'
import { getDiffInDays, getStaticSchedulePeriodTime } from '@ce/utils/momentUtils'
import { convertNumberToFixedDecimalPlaces } from '@ce/utils/convertNumberToFixedDecimalPlaces'
import type { CumulativeSavings } from 'services/lw'
import { useStrings } from 'framework/strings'
import CEChart from '@ce/components/CEChart/CEChart'
import { getDay } from '../Utils'
import css from '../COGatewayCumulativeAnalytics.module.scss'

interface SpendVsSavingsChartProps {
  data?: CumulativeSavings
  loading: boolean
  mode?: RulesMode
  timeRange: TimeRangeFilterType
  searchTerm?: string
}

const savingsColor = { primary: '#06B7C3', secondary: '#D3FCFE' }
const spendColor = { primary: '#6938C0', secondary: '#EADEFF' }

function getStackedAreaChartOptions(
  title: string,
  categories: string[],
  yAxisText: string,
  savingsData: number[],
  spendData: number[],
  mode = RulesMode.ACTIVE
): Highcharts.Options {
  let step = 1
  if (categories && categories.length) {
    categories = categories.map(x => getDay(x, 'YYYY-MM-DDTHH:mm:ssZ'))
    step = Math.ceil(categories.length * 0.25)
  }
  savingsData = defaultTo(
    savingsData.map(n => convertNumberToFixedDecimalPlaces(n, 2)),
    []
  )
  spendData = defaultTo(
    spendData.map(n => convertNumberToFixedDecimalPlaces(n, 2)),
    []
  )
  return {
    chart: {
      type: 'spline',
      height: 180,
      spacing: [5, 20, 5, 5]
    },
    colors: ['rgba(71, 213, 223)', 'rgba(124, 77, 211,0.05)'],
    title: {
      text: title
    },
    xAxis: {
      categories: categories,
      labels: {
        step: step
      },
      units: [['day', [1]]],
      startOnTick: true,
      tickmarkPlacement: 'on'
    },
    yAxis: {
      // min: 0,
      title: {
        text: yAxisText
      },
      labels: {
        format: '${value}'
      }
    },
    credits: {
      enabled: false
    },
    tooltip: {
      pointFormat: '{series.name}: ${point.y}<br/>'
    },
    plotOptions: {
      area: {
        stacking: 'normal',
        pointPlacement: 'on'
      }
    },
    series: [
      {
        name: 'Savings',
        type: 'area',
        data: savingsData,
        showInLegend: false,
        color: {
          linearGradient: {
            x1: 0,
            x2: 1,
            y1: 0,
            y2: 1
          },
          stops: [
            [0, 'rgba(71, 213, 223, 0.7)'],
            [1, 'rgba(71, 213, 223, 0)']
          ]
        },
        pointPlacement: 'on',
        dashStyle: mode === RulesMode.DRY ? /* istanbul ignore next */ 'Dash' : 'Solid'
      },
      {
        name: 'Spend',
        type: 'area',
        data: spendData,
        showInLegend: false,
        color: {
          linearGradient: {
            x1: 0,
            x2: 1,
            y1: 0,
            y2: 1
          },
          stops: [
            [0, 'rgba(124, 77, 211, 0.7)'],
            [1, 'rgba(124, 77, 211, 0) 55.59%)']
          ]
        },
        pointPlacement: 'on',
        dashStyle: mode === RulesMode.DRY ? /* istanbul ignore next */ 'Dash' : 'Solid'
      }
    ]
  }
}

const getBarChartOptions = (data: CumulativeSavings, mode = RulesMode.ACTIVE) => {
  const isDryRunMode = mode === RulesMode.DRY
  let savingsData = [],
    spendData = []
  const categories = data.days?.map(x => getStaticSchedulePeriodTime(x))
  savingsData = defaultTo(
    data?.savings?.map((n, i) => [categories?.[i], convertNumberToFixedDecimalPlaces(n, 2)]),
    []
  )
  spendData = defaultTo(
    data?.actual_cost?.map((n, i) => [categories?.[i], convertNumberToFixedDecimalPlaces(n, 2)]),
    []
  )
  return {
    chart: {
      type: 'column',
      height: 200
    },
    xAxis: {
      labels: {
        formatter: /* istanbul ignore next */ function () {
          const date = new Date(this.value)
          return `${date.getMonth() + 1}/${date.getDate()}`
        }
      },
      type: 'datetime',
      lineWidth: 0,
      plotLines: [
        {
          dashStyle: 'Dash'
        }
      ],
      tickLength: 0
    } as Highcharts.XAxisOptions,
    yAxis: {
      min: 0,
      title: {
        text: ''
      },
      stackLabels: {
        enabled: false
      },
      labels: {
        formatter: /* istanbul ignore next */ function () {
          return this.value === 0 ? this.value : `$${this.value}`
        }
      }
    } as Highcharts.YAxisOptions,
    tooltip: {
      headerFormat: '<b>{point.key}</b><br/>',
      pointFormat: '{series.name}: ${point.y}'
    },
    plotOptions: {
      column: {
        stacking: 'normal',
        dataLabels: {
          enabled: false
        },
        borderWidth: isDryRunMode ? 1 : 0
      }
    },
    series: [
      {
        name: 'Savings',
        data: savingsData,
        color: isDryRunMode ? savingsColor.secondary : savingsColor.primary,
        borderColor: savingsColor.primary,
        showInLegend: false,
        className: css.colChartBorderRadius,
        dashStyle: 'Dash'
      },
      {
        name: 'Spend',
        data: spendData,
        dashStyle: 'Dash',
        borderColor: spendColor.primary,
        showInLegend: false,
        color: isDryRunMode ? spendColor.secondary : spendColor.primary
      }
    ]
  }
}

const getChartOptions = (range: TimeRangeFilterType, data: CumulativeSavings, mode?: RulesMode) => {
  const daysDiff = getDiffInDays(range.from, range.to)
  return daysDiff > 30
    ? getStackedAreaChartOptions(
        '',
        data?.days as string[],
        '',
        data?.savings as number[],
        data?.actual_cost as number[],
        mode
      )
    : getBarChartOptions(data, mode)
}

const SpendVsSavingsChart: React.FC<SpendVsSavingsChartProps> = ({ data, mode, loading, timeRange, searchTerm }) => {
  const { getString } = useStrings()

  const renderEmptyDataString = () => {
    let stringId = 'ce.co.noDataForDateRange'
    if (searchTerm) {
      stringId = 'ce.co.noDataForSearchAndDateRange'
    }
    return (
      <Text style={{ marginTop: 'var(--spacing-xxlarge)' }} font={{ variation: FontVariation.BODY1 }}>
        {getString(stringId as keyof StringsMap)}
      </Text>
    )
  }

  if (loading) {
    return <Icon name="spinner" size={24} color="blue500" style={{ alignSelf: 'center' }} />
  } else if (!data || !data?.days?.length) {
    return renderEmptyDataString()
  } else {
    return <CEChart options={getChartOptions(timeRange, data as CumulativeSavings, mode) as Highcharts.Options} />
  }
}

export default SpendVsSavingsChart
