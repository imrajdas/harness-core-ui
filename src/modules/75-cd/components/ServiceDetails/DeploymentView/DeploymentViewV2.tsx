/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { Color } from '@harness/design-system'
import { Container, Layout, Text, PageError } from '@wings-software/uicore'
import type { GetDataError } from 'restful-react'
import { PageSpinner, Table } from '@common/components'
import type { InstanceGroupedByArtifact } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import MostActiveServicesEmptyState from '@cd/icons/MostActiveServicesEmptyState.svg'
import {
  getFullTableData,
  getPreviewTableData,
  getSummaryTableData,
  RenderArtifactVersion,
  RenderEnvironment,
  RenderInfra,
  RenderInfraCount,
  RenderPipelineExecution,
  TableRowData,
  TableType
} from '../ActiveServiceInstances/ActiveServiceInstancesContentV2'
import css from '../ActiveServiceInstances/ActiveServiceInstances.module.scss'

const columnsProperties = {
  artifacts: {
    width: {
      preview: '35%',
      summary: '26%',
      full: '26%'
    }
  },
  envs: {
    width: {
      preview: '30%',
      summary: '22%',
      full: '22%'
    }
  },
  infras: {
    width: {
      preview: '20%',
      summary: '20%',
      full: '20%'
    }
  },
  pipelines: {
    width: {
      preview: '0%',
      summary: '31%',
      full: '31%'
    }
  }
}

export const DeploymentsV2 = (
  props: React.PropsWithChildren<{
    tableType: TableType
    loading?: boolean
    data?: InstanceGroupedByArtifact[]
    error?: GetDataError<unknown> | null
    refetch?: () => Promise<void>
  }>
): React.ReactElement => {
  const { tableType, loading = false, data, error, refetch } = props
  const { getString } = useStrings()

  const tableData: TableRowData[] = useMemo(() => {
    switch (tableType) {
      case TableType.SUMMARY:
        return getSummaryTableData(data)
      case TableType.PREVIEW:
        return getPreviewTableData(data)
      case TableType.FULL:
        return getFullTableData(data)
    }
  }, [data, tableType])

  const columns = useMemo(() => {
    const columnsArray = [
      {
        Header: getString('cd.serviceDashboard.headers.artifactVersion'),
        id: 'artifact',
        width: columnsProperties.artifacts.width[tableType],
        Cell: RenderArtifactVersion
      },
      {
        Header: getString('cd.serviceDashboard.headers.environment'),
        id: 'env',
        width: columnsProperties.envs.width[tableType],
        Cell: RenderEnvironment
      },
      {
        Header: getString('cd.serviceDashboard.headers.infras'),
        id: 'infra',
        width: columnsProperties.infras.width[tableType],
        Cell: tableType == TableType.PREVIEW ? RenderInfraCount : RenderInfra
      }
    ]

    if (tableType != TableType.PREVIEW) {
      columnsArray.push({
        Header: getString('cd.serviceDashboard.headers.pipelineExecution'),
        id: 'pipeline',
        width: columnsProperties.pipelines.width[tableType],
        Cell: RenderPipelineExecution
      })
    }

    return columnsArray
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading || error || !(data || []).length) {
    const component = (() => {
      if (loading) {
        return (
          <Container data-test="ActiveServiceInstancesLoader" height="360px">
            <PageSpinner />
          </Container>
        )
      }
      if (error) {
        return (
          <Container data-test="ActiveServiceInstancesError" height="360px">
            <PageError onClick={() => refetch?.()} />
          </Container>
        )
      }
      return (
        <Layout.Vertical
          height="360px"
          flex={{ align: 'center-center' }}
          data-test="ActiveServiceInstancesEmpty"
          className={css.activeServiceInstancesEmpty}
        >
          <Container margin={{ bottom: 'medium' }}>
            <img width="50" height="50" src={MostActiveServicesEmptyState} style={{ alignSelf: 'center' }} />
          </Container>
          <Text color={Color.GREY_400}>{getString('cd.serviceDashboard.noActiveServiceInstances')}</Text>
        </Layout.Vertical>
      )
    })()
    return component
  }

  return (
    <Layout.Horizontal padding={{ top: 'medium' }}>
      <Table<TableRowData>
        columns={columns}
        data={tableData}
        className={css.instanceTable}
        hideHeaders={tableType != TableType.PREVIEW}
      />
    </Layout.Horizontal>
  )
}
