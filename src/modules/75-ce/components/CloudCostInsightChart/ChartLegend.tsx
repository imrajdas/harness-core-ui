/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { Container, Layout, Text } from '@wings-software/uicore'
import type Highcharts from 'highcharts'
import cx from 'classnames'

import css from './ChartLegend.module.scss'

interface ChartLegendProps {
  chartRefObj: Highcharts.Chart
}

const ChartLegend: React.FC<ChartLegendProps> = ({ chartRefObj }) => {
  const [legendMap, setLegendMap] = useState<Record<string, boolean>>({})

  chartRefObj.series.forEach(chart => {
    legendMap[chart.userOptions.name as string] = chart.visible
  })

  useEffect(() => {
    const newMap: Record<string, boolean> = {}
    chartRefObj.series.forEach(chart => {
      newMap[chart.userOptions.name as string] = chart.visible
    })
    setLegendMap(newMap)
  }, [chartRefObj])

  const legendItemClick: (chart: any) => void = chart => {
    // const visibleItems = Object.keys(legendMap).filter(x => legendMap[x]).length
    let updatedLegend: Record<string, boolean> = {}

    // if (visibleItems === Object.keys(legendMap).length) {
    //   // Hide all and show one
    //   Object.keys(legendMap).forEach(x => {
    //     updatedLegend[x] = false
    //   })
    //   updatedLegend[chart.userOptions.name] = true
    // } else
    // if (visibleItems === 1 && legendMap[chart.userOptions.name]) {
    //   Object.keys(legendMap).forEach(x => {
    //     updatedLegend[x] = true
    //   })
    // } else {
    updatedLegend = { ...legendMap }
    updatedLegend[chart.userOptions.name] = !updatedLegend[chart.userOptions.name]
    chart.update({
      visible: updatedLegend[chart.userOptions.name]
    })
    setLegendMap(updatedLegend)
    return
    // }

    // chartRefObj.series.map(s => {
    //   const series = s as any
    //   const sName = series.userOptions.name
    //   series.update({ visible: updatedLegend[sName] }, false)
    // })
    // chartRefObj.redraw()
    // setLegendMap(updatedLegend)
  }

  return (
    <Container
      className={cx(css.legendContainer, { [css.preferences]: chartRefObj.series.length > 12 })}
      padding={{
        left: 'medium',
        top: 'small',
        bottom: 'small'
      }}
    >
      {chartRefObj.series.map(chart => {
        const chartColor: string = (chart as any).color
        return (
          <Layout.Horizontal
            key={chart.userOptions.name}
            spacing="small"
            style={{
              alignItems: 'center'
            }}
            onClick={() => {
              legendItemClick(chart)
            }}
          >
            <div className={css.colorBoxContainer}>
              <div
                className={css.colorBox}
                style={
                  legendMap[chart.userOptions.name as string]
                    ? {
                        backgroundColor: chartColor
                      }
                    : {}
                }
              />
            </div>

            <Text
              className={css.legendText}
              font="xsmall"
              lineClamp={1}
              tooltip={
                <Container padding="small">
                  <Text font="small">{chart.userOptions.name}</Text>
                </Container>
              }
            >
              {chart.userOptions.name}
            </Text>
          </Layout.Horizontal>
        )
      })}
    </Container>
  )
}

export default ChartLegend
