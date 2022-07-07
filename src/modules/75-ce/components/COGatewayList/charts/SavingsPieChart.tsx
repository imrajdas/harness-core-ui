/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { RulesMode } from '@ce/constants'
import CEChart from '@ce/components/CEChart/CEChart'

interface SavingsPieChartProps {
  savingsPercentage: number
  mode?: RulesMode
}

const chartOptions = (data: number, mode = RulesMode.ACTIVE) => {
  const isDryRunMode = mode === RulesMode.DRY
  return {
    chart: {
      type: 'pie',
      width: 200,
      height: 70
    },
    title: {
      text: `${data}%`,
      align: 'center',
      verticalAlign: 'middle',
      y: 25,
      x: -45
    },
    plotOptions: {
      pie: {
        slicedOffset: 0,
        size: '200%',
        center: ['25%', '80%'],
        borderWidth: 0,
        startAngle: -90,
        dataLabels: {
          enabled: false
        },
        endAngle: 90
      },
      series: {
        states: {
          hover: {
            enabled: false,
            brightness: 0
          }
        },
        enableMouseTracking: false
      }
    },
    tooltip: {
      enabled: false
    },
    series: [
      {
        innerSize: '75%',
        data: [
          {
            name: 'Savings',
            y: data,
            borderWidth: isDryRunMode && data > 0 ? 1 : 0,
            borderColor: '#00ADE4',
            color: isDryRunMode ? '#CDF4FE' : '#06B7C3',
            dashStyle: 'Dash'
          },
          {
            name: 'Total',
            y: 100 - data,
            color: '#F3F3F3'
          }
        ]
      }
    ]
  }
}

const SavingsPieChart: React.FC<SavingsPieChartProps> = ({ savingsPercentage, mode }) => {
  return <CEChart options={chartOptions(savingsPercentage, mode) as unknown as Highcharts.Options} />
}

export default SavingsPieChart
