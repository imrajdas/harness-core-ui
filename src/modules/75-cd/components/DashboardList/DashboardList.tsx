/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { ExpandingSearchInput, Layout, Text, PageError, TableV2 } from '@wings-software/uicore'
import type { TableProps } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { noop } from 'lodash-es'
import { useStrings } from 'framework/strings'
// import FilterSelector from '@common/components/Filter/FilterSelector/FilterSelector'
import { PageSpinner } from '@common/components'
import ServiceDetailsEmptyState from '@cd/icons/ServiceDetailsEmptyState.svg'
import css from '@cd/components/DashboardList/DashboardList.module.scss'

const PAGE_SIZE = 10

export interface DashboardListProps<T extends Record<string, any>> {
  HeaderCustomPrimary?: (props: { total: number }) => React.ReactElement
  HeaderCustomSecondary?: (props: { onChange: (val: string) => void }) => React.ReactElement
  columns: TableProps<T>['columns']
  loading: boolean
  error: boolean
  refetch: () => void
  data: T[]
  onRowClick: (data: T) => void
}

const HeaderFilterComponent: React.FC<{ onChange: (val: string) => void }> = props => {
  const { getString } = useStrings()
  const { onChange = noop } = props
  return (
    <Layout.Horizontal margin={{ left: 'small' }}>
      <ExpandingSearchInput flip width={232} placeholder={getString('search')} throttle={200} onChange={onChange} />
      {/* <FilterSelector<any>
        onFilterBtnClick={noop}
        onFilterSelect={noop}
        fieldToLabelMapping={new Map<string, string>()}
        filterWithValidFields={{}}
      /> */}
    </Layout.Horizontal>
  )
}

const applySearch = (items: any[], searchTerm: string): any[] => {
  if (!searchTerm) {
    return items
  }
  return items.filter(item => {
    const term = searchTerm.toLocaleLowerCase()
    return (
      (item?.id || '').toLocaleLowerCase().indexOf(term) !== -1 ||
      (item?.name || '').toLocaleLowerCase().indexOf(term) !== -1
    )
  })
}

export const DashboardList = <T extends Record<string, any>>(props: DashboardListProps<T>): React.ReactElement => {
  const {
    HeaderCustomPrimary = () => <></>,
    HeaderCustomSecondary = HeaderFilterComponent,
    columns,
    loading,
    error,
    refetch,
    data,
    onRowClick
  } = props

  const [pageIndex, setPageIndex] = useState(0)
  const [filteredData, setFilteredData] = useState<T[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const { getString } = useStrings()

  useEffect(() => {
    setPageIndex(0)
    setFilteredData(applySearch(data, searchTerm))
  }, [data, searchTerm])

  const onSearchChange = useCallback((val: string): void => {
    setSearchTerm(val)
  }, [])

  const getComponent = (): React.ReactElement => {
    if (loading) {
      return (
        <Layout.Horizontal className={css.loader}>
          <PageSpinner />
        </Layout.Horizontal>
      )
    }
    if (error) {
      return <PageError onClick={() => refetch()} />
    }
    if (!filteredData?.length) {
      return (
        <Layout.Vertical height="80%" flex={{ align: 'center-center' }} data-test="deploymentsWidgetEmpty">
          <img width="150" height="100" src={ServiceDetailsEmptyState} style={{ alignSelf: 'center' }} />
          <Text color={Color.GREY_400} margin={{ top: 'medium' }}>
            {getString('cd.serviceDashboard.noServiceDetails')}
          </Text>
        </Layout.Vertical>
      )
    }
    return (
      <TableV2<T>
        columns={columns}
        sortable
        data={filteredData.slice(PAGE_SIZE * pageIndex, PAGE_SIZE * (pageIndex + 1))}
        pagination={{
          itemCount: filteredData.length,
          pageSize: PAGE_SIZE,
          pageCount: Math.ceil(filteredData.length / PAGE_SIZE),
          pageIndex: pageIndex,
          gotoPage: pageNum => {
            setPageIndex(pageNum)
          }
        }}
        onRowClick={onRowClick}
      />
    )
  }

  return (
    <Layout.Vertical className={css.container}>
      <Layout.Horizontal
        flex={{ distribution: 'space-between' }}
        padding={{ top: 'medium', bottom: 'medium' }}
        className={css.listHeader}
      >
        <HeaderCustomPrimary total={filteredData.length} />
        <HeaderCustomSecondary onChange={onSearchChange} />
      </Layout.Horizontal>
      {getComponent()}
    </Layout.Vertical>
  )
}
