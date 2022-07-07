/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Icon, Layout, TableV2, Text } from '@harness/uicore'
import NoResultsView from '@templates-library/pages/TemplatesPage/views/NoResultsView/NoResultsView'
import { getIconBySourceType } from '@cv/pages/health-source/HealthSourceTable/HealthSourceTable.utils'
import css from './HealthSourceInputsetTable.module.scss'

export default function HealthSourceInputsetTable({ healthSources }: any): JSX.Element {
  const tableData =
    healthSources?.map((healthSource: any) => {
      const { name, spec, type } = healthSource
      return {
        healthSource: name,
        connector: spec?.connectorRef,
        feature: spec?.feature,
        type
      }
    }) || []

  let content = <></>
  if (!tableData?.length) {
    content = <NoResultsView text={'No Health sources'} minimal={true} />
  } else if (tableData?.length) {
    content = (
      <TableV2
        data={tableData}
        columns={[
          {
            Header: 'Health Source',
            accessor: function accessor(row: any) {
              return (
                <Layout.Horizontal>
                  <Icon name={getIconBySourceType(row.type)} margin={{ right: 'medium' }} />
                  <Text>{row.healthSource}</Text>
                </Layout.Horizontal>
              )
            },
            id: 'healthSource'
          },
          {
            Header: 'Connector',
            accessor: function accessor(row: any) {
              return <Text className={css.healthSourceInputsetTable}>{row.connector}</Text>
            },
            id: 'connector'
          },
          {
            Header: 'Feature',
            accessor: function accessor(row: any) {
              return <Text>{row.feature}</Text>
            },
            id: 'feature'
          }
        ]}
      />
    )
  }

  return content
}
