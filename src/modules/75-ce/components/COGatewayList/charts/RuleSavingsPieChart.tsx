/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import CEChart from '@ce/components/CEChart/CEChart'
import { convertNumberToFixedDecimalPlaces } from '@ce/utils/convertNumberToFixedDecimalPlaces'

interface RuleSavingsPieChartProps {
  savings: number
  disable?: boolean
}

const getChartOptions = (savings: number, disable?: boolean) => {
  let primaryColor = '#1B841D'
  let secondaryColor = '#E4F7E1'
  if (disable) {
    primaryColor = '#6B6D85'
    secondaryColor = '#D9DAE5'
  } else if (savings <= 20) {
    primaryColor = '#B41710'
    secondaryColor = '#FCEDEC'
  } else if (savings > 20 && savings <= 50) {
    primaryColor = '#ff5310'
    secondaryColor = '#fff0e6'
  }
  return {
    chart: {
      type: 'pie',
      margin: [0, 0, 0, 0],
      spacingTop: 0,
      spacingBottom: 0,
      spacingLeft: 0,
      spacingRight: 0,
      width: 50,
      height: 50,
      backgroundColor: disable ? '#F3F3FA' : ''
    },
    tooltip: { enabled: false },
    title: {
      text: `${savings}%`,
      align: 'center',
      verticalAlign: 'middle',
      style: { fontSize: '15px', fontWeight: 700, color: primaryColor }
    },
    plotOptions: {
      pie: {
        allowPointSelect: false,
        cursor: 'pointer',
        dataLabels: {
          enabled: false
        },
        showInLegend: false,
        size: '200%',
        borderColor: disable ? '#F3F3FA' : ''
      },
      series: {
        enableMouseTracking: false
      }
    },
    series: [
      {
        data: [
          { y: savings, color: secondaryColor },
          { y: 100 - savings, color: 'transparent' }
        ]
      }
    ]
  }
}

const RuleSavingsPieChart: React.FC<RuleSavingsPieChartProps> = ({ savings, disable }) => {
  return (
    <CEChart
      options={getChartOptions(convertNumberToFixedDecimalPlaces(savings, 0), disable) as unknown as Highcharts.Options}
    />
  )
}

export default RuleSavingsPieChart
