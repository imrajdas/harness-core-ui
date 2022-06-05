/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Layout, Container, Icon } from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { Drawer, Position } from '@blueprintjs/core'
import { CCM_CHART_TYPES } from '@ce/constants'
import {
  useFetchViewFieldsQuery,
  QlceViewFilterWrapperInput,
  useFetchPerspectiveFiltersValueQuery,
  QlceViewFieldInputInput
} from 'services/ce/services'
import type { setChartTypeFn, setGroupByFn } from '@ce/types'
import GroupByView from './GroupByView'
import BusinessMappingBuilder from '../BusinessMappingBuilder/BusinessMappingBuilder'
import css from './PersepectiveExplorerGroupBy.module.scss'

interface ChartTypeSwitcherProps {
  chartType: CCM_CHART_TYPES
  setChartType: setChartTypeFn
}

const ChartTypeSwitcher: React.FC<ChartTypeSwitcherProps> = ({ chartType, setChartType }) => {
  return (
    <Layout.Horizontal
      spacing="small"
      style={{
        alignItems: 'center',
        justifyContent: 'flex-end'
      }}
    >
      <Icon
        name="timeline-area-chart"
        onClick={() => {
          setChartType(CCM_CHART_TYPES.AREA)
        }}
        size={20}
        color={chartType === CCM_CHART_TYPES.AREA ? 'primary7' : 'grey400'}
      />
      <Icon
        name="timeline-bar-chart"
        onClick={() => {
          setChartType(CCM_CHART_TYPES.COLUMN)
        }}
        size={18}
        color={chartType === CCM_CHART_TYPES.COLUMN ? 'primary7' : 'grey400'}
      />
    </Layout.Horizontal>
  )
}

interface PerspectiveExplorerGroupByProps {
  setChartType: setChartTypeFn
  chartType: CCM_CHART_TYPES
  groupBy: QlceViewFieldInputInput
  setGroupBy: setGroupByFn
  timeFilter: QlceViewFilterWrapperInput[]
  preferencesDropDown?: React.ReactNode
}

const PerspectiveExplorerGroupBy: React.FC<PerspectiveExplorerGroupByProps> = ({
  chartType,
  setChartType,
  groupBy,
  setGroupBy,
  timeFilter,
  preferencesDropDown
}) => {
  const { perspectiveId } = useParams<{ perspectiveId: string }>()
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)

  const [result, refetch] = useFetchViewFieldsQuery({
    variables: {
      filters: [{ viewMetadataFilter: { viewId: perspectiveId, isPreview: false } } as QlceViewFilterWrapperInput]
    },
    requestPolicy: 'cache-and-network'
  })
  const { data } = result

  const [labelResult] = useFetchPerspectiveFiltersValueQuery({
    variables: {
      filters: [
        {
          idFilter: {
            field: {
              fieldId: 'labels.key',
              fieldName: '',
              identifier: 'LABEL'
            },
            operator: 'IN',
            values: []
          }
        } as unknown as QlceViewFilterWrapperInput,
        ...timeFilter
      ],
      offset: 0,
      limit: 1000
    }
  })

  const { data: labelResData } = labelResult

  const labelData = labelResData?.perspectiveFilters?.values

  const fieldIdentifierData = data?.perspectiveFields?.fieldIdentifierData || []

  return (
    <Container background="white" padding="small" className={css.groupByContainer}>
      <GroupByView
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        labelData={labelData || []}
        fieldIdentifierData={fieldIdentifierData}
        openBusinessMappingDrawer={() => {
          setDrawerOpen(true)
        }}
      />
      {preferencesDropDown}
      <ChartTypeSwitcher chartType={chartType} setChartType={setChartType} />
      <Drawer
        autoFocus
        enforceFocus
        hasBackdrop
        usePortal
        canOutsideClickClose
        canEscapeKeyClose
        position={Position.RIGHT}
        isOpen={drawerOpen}
        onClose={
          /* istanbul ignore next */ () => {
            setDrawerOpen(false)
          }
        }
      >
        <BusinessMappingBuilder
          selectedBM={{}}
          onSave={() => {
            refetch({ requestPolicy: 'cache-and-network' })
            setDrawerOpen(false)
          }}
        />
      </Drawer>
    </Container>
  )
}

export default PerspectiveExplorerGroupBy
