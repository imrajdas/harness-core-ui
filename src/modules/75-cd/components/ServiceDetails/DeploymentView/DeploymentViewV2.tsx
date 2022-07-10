/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import type { CellProps, Renderer } from 'react-table'
import cx from 'classnames'
import { Color } from '@harness/design-system'
import { Container, Layout, Text, PageError } from '@wings-software/uicore'
import type { GetDataError } from 'restful-react'
import ReactTimeago from 'react-timeago'
import { PageSpinner, Table } from '@common/components'
import type { InstanceGroupedByArtifact } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import MostActiveServicesEmptyState from '@cd/icons/MostActiveServicesEmptyState.svg'
import { numberFormatter } from '@cd/components/Services/common'
import {
  getFullTableData,
  getPreviewTableData,
  getSummaryTableData,
  TableRowData
} from '../ActiveServiceInstances/ActiveServiceInstancesContentV2'
import css from '../ActiveServiceInstances/ActiveServiceInstancesV2.module.scss'

const RenderArtifactVersion: Renderer<CellProps<TableRowData>> = ({
  row: {
    original: { artifactVersion, showArtifact }
  }
}) => {
  return showArtifact ? (
    <Text
      style={{ maxWidth: '200px' }}
      font={{ size: 'small', weight: 'semi-bold' }}
      lineClamp={1}
      color={Color.GREY_800}
    >
      {artifactVersion}
    </Text>
  ) : (
    <></>
  )
}

const RenderEnvironment: Renderer<CellProps<TableRowData>> = ({
  row: {
    original: { showEnv, envName, totalEnvs }
  }
}) => {
  return showEnv ? (
    <Container className={css.paddedContainer}>
      <Container flex>
        <Container className={css.envContainer}>
          <Text className={css.environmentRow} font={{ size: 'small' }} color={Color.WHITE} lineClamp={1}>
            {envName}
          </Text>
        </Container>
        {totalEnvs && totalEnvs > 1 && (
          <Text
            font={{ size: 'xsmall' }}
            style={{ lineHeight: 'small' }}
            className={css.plusMore}
            color={Color.GREY_500}
          >
            + {totalEnvs - 1}
          </Text>
        )}
      </Container>
    </Container>
  ) : (
    <></>
  )
}

const RenderInfra: Renderer<CellProps<TableRowData>> = ({
  row: {
    original: { infraName, totalInfras }
  }
}) => {
  return infraName ? (
    <Container flex>
      <Layout.Horizontal>
        <Text
          style={{ maxWidth: '120px' }}
          font={{ size: 'small', weight: 'semi-bold' }}
          lineClamp={1}
          color={Color.GREY_800}
        >
          {infraName}
        </Text>
        {totalInfras && totalInfras > 1 && (
          <Text
            font={{ size: 'xsmall' }}
            style={{ lineHeight: 'small' }}
            className={css.plusMore}
            color={Color.GREY_500}
          >
            + {totalInfras - 1}
          </Text>
        )}
      </Layout.Horizontal>
    </Container>
  ) : (
    <></>
  )
}

const RenderInfraCount: Renderer<CellProps<TableRowData>> = ({
  row: {
    original: { totalInfras }
  }
}) => {
  return totalInfras ? (
    <Container className={css.paddedContainer}>
      <Text
        font={{ size: 'xsmall', weight: 'bold' }}
        background={Color.GREY_100}
        className={cx(css.countBadge, css.overflow)}
      >
        {numberFormatter(totalInfras)}
      </Text>
    </Container>
  ) : (
    <></>
  )
}

/*
 * TODO-DASHBOARD-V2 [Guy Castel, July 07 2022]: Temporary
 * Inspired by 'ServicesList > RenderLastDeployment'.
 * Currently generated without link because missing 'pipelineIdentifier'.
 */
const RenderPipelineExecution: Renderer<CellProps<TableRowData>> = ({
  row: {
    original: { /* lastPipelineExecutionId, lastPipelineExecutionName, */ lastDeployedAt }
  }
}) => {
  return (
    <Layout.Vertical margin={{ right: 'large' }} flex={{ alignItems: 'flex-start' }}>
      {lastDeployedAt && (
        <ReactTimeago
          date={new Date(parseInt(lastDeployedAt))}
          component={val => (
            <Text font={{ size: 'small' }} color={Color.GREY_500}>
              {' '}
              {val.children}{' '}
            </Text>
          )}
        />
      )}
    </Layout.Vertical>
  )
}

export enum TableType {
  PREVIEW = 'preview', // for card (headers visible, no Pipeline column, Clusters as count)
  SUMMARY = 'summary', // for details popup collapsed row, assuming single entry in 'data' (headers hidden)
  FULL = 'full' // for details popup expanded row (headers hidden)
}

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
        Header: getString('cd.artifactVersion'),
        id: 'artifact',
        width: columnsProperties.artifacts.width[tableType],
        Cell: RenderArtifactVersion
      },
      {
        Header: getString('environment'),
        id: 'env',
        width: columnsProperties.envs.width[tableType],
        Cell: RenderEnvironment
      },
      {
        Header: getString('common.clusters'),
        id: 'infra',
        width: columnsProperties.infras.width[tableType],
        Cell: tableType == TableType.PREVIEW ? RenderInfraCount : RenderInfra
      }
    ]

    if (tableType != TableType.PREVIEW) {
      columnsArray.push({
        Header: getString('cd.pipelineExecution'),
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
