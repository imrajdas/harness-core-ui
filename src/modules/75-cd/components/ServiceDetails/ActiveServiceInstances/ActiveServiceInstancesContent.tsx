/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { CellProps, Renderer } from 'react-table'
import cx from 'classnames'
import { Color } from '@harness/design-system'
import { Container, Layout, Popover, Text, PageError } from '@wings-software/uicore'
import { PopoverInteractionKind } from '@blueprintjs/core'
import type { GetDataError } from 'restful-react'
import { PageSpinner, Table } from '@common/components'
import type { EnvBuildIdAndInstanceCountInfo } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import MostActiveServicesEmptyState from '@cd/icons/MostActiveServicesEmptyState.svg'
import { numberFormatter } from '@cd/components/Services/common'
import { ActiveServiceInstancePopover } from './ActiveServiceInstancePopover'
import css from './ActiveServiceInstances.module.scss'

const TOTAL_VISIBLE_BUILDS = 5
const TOTAL_VISIBLE_INSTANCES = 10

type VisibleBuildCount = { [key: string]: number }

interface TableRowData {
  envId?: string
  envName?: string
  buildId?: string
  instanceCount?: number
  remainingCount?: number
  totalBuilds?: number
  showEnvName: boolean
}

// returns a map of env id and total builds count
const initVisibleBuildCount = (
  envBuildIdAndInstanceCountInfo?: EnvBuildIdAndInstanceCountInfo[]
): VisibleBuildCount => {
  if (!envBuildIdAndInstanceCountInfo) {
    return {}
  }
  const visibleBuildCount: VisibleBuildCount = {}
  envBuildIdAndInstanceCountInfo.forEach(item => {
    if (item.envId) {
      visibleBuildCount[item.envId] = TOTAL_VISIBLE_BUILDS
    }
  })
  return visibleBuildCount
}

const getTableData = (
  envBuildIdAndInstanceCountInfo?: EnvBuildIdAndInstanceCountInfo[],
  visibleBuildCount?: VisibleBuildCount
): TableRowData[] => {
  const tableData: TableRowData[] = []
  if (!envBuildIdAndInstanceCountInfo || !visibleBuildCount) {
    return tableData
  }
  envBuildIdAndInstanceCountInfo.forEach(item => {
    const envId = item.envId
    if (envId) {
      const visibleRowsForEnv = visibleBuildCount[envId]
      const totalAvailableBuildsForEnv = item.buildIdAndInstanceCountList?.length || 0
      item.buildIdAndInstanceCountList?.slice(0, visibleRowsForEnv).forEach((row, index) => {
        tableData.push({
          showEnvName: !index,
          envId,
          envName: item.envName,
          buildId: row.buildId,
          instanceCount: row.count
        })
      })
      if (visibleRowsForEnv < totalAvailableBuildsForEnv) {
        tableData.push({ envId, remainingCount: totalAvailableBuildsForEnv - visibleRowsForEnv, showEnvName: false })
      }
    }
  })
  return tableData
}

const getSummaryRowData = (envBuildIdAndInstanceCountInfo?: EnvBuildIdAndInstanceCountInfo[]): TableRowData[] => {
  const tableData: TableRowData[] = []
  if (!envBuildIdAndInstanceCountInfo) {
    return tableData
  }
  envBuildIdAndInstanceCountInfo.forEach(item => {
    const envId = item.envId
    if (envId) {
      let totalBuilds = 0
      let totalInstances = 0
      item.buildIdAndInstanceCountList?.forEach(row => {
        totalBuilds++
        totalInstances += row.count || 0
      })
      tableData.push({
        showEnvName: true,
        envId,
        envName: item.envName,
        buildId: item.buildIdAndInstanceCountList?.[0].buildId,
        instanceCount: totalInstances,
        totalBuilds: totalBuilds
      })
    }
  })
  return tableData
}

const RenderEnvironment: Renderer<CellProps<TableRowData>> = ({
  row: {
    original: { envName, showEnvName }
  }
}) => {
  return showEnvName ? (
    <Container className={css.envContainer}>
      <Text className={css.environmentRow} font={{ size: 'small' }} color={Color.WHITE} lineClamp={1}>
        {envName}
      </Text>
    </Container>
  ) : (
    <></>
  )
}

const RenderBuildName: Renderer<CellProps<TableRowData>> = ({
  row: {
    original: { envId, buildId, remainingCount, totalBuilds }
  },
  column
}) => {
  const { getString } = useStrings()
  const component = buildId ? (
    <Container flex>
      <Text font={{ size: 'small', weight: 'semi-bold' }} lineClamp={1} color={Color.GREY_800}>
        {buildId}
      </Text>
      {totalBuilds && totalBuilds > 1 && (
        <Text font={{ size: 'xsmall' }} style={{ lineHeight: 'small', marginLeft: '10px' }} color={Color.GREY_500}>
          + {totalBuilds - 1}
        </Text>
      )}
    </Container>
  ) : (
    <Text
      font={{ size: 'xsmall', weight: 'semi-bold' }}
      color={Color.PRIMARY_6}
      background={Color.PRIMARY_1}
      className={css.seeMore}
      onClick={() => (column as any)?.expandBuilds?.(envId)}
    >
      {getString('cd.serviceDashboard.seeMore', { count: numberFormatter(remainingCount) })}
    </Text>
  )
  return <Container className={css.paddedContainer}>{component}</Container>
}

const RenderInstanceCount: Renderer<CellProps<TableRowData>> = ({
  row: {
    original: { instanceCount }
  }
}) => {
  return instanceCount ? (
    <Container className={css.paddedContainer}>
      <Text
        font={{ size: 'xsmall', weight: 'bold' }}
        background={Color.PRIMARY_1}
        className={cx(css.countBadge, css.overflow)}
      >
        {numberFormatter(instanceCount)}
      </Text>
    </Container>
  ) : (
    <></>
  )
}

const RenderInstances: Renderer<CellProps<TableRowData>> = ({
  row: {
    original: { envId, buildId, instanceCount }
  }
}) => {
  return instanceCount ? (
    <Container className={cx(css.paddedContainer, css.hexContainer)} flex={{ justifyContent: 'flex-start' }}>
      {Array(Math.min(instanceCount, TOTAL_VISIBLE_INSTANCES))
        .fill(null)
        .map((_, index) => (
          <Popover
            interactionKind={PopoverInteractionKind.CLICK}
            key={index}
            modifiers={{ preventOverflow: { escapeWithReference: true } }}
          >
            <Container
              className={css.hex}
              width={18}
              height={18}
              background={Color.PRIMARY_3}
              margin={{ left: 'xsmall', right: 'xsmall', top: 'xsmall', bottom: 'xsmall' }}
            />
            <ActiveServiceInstancePopover buildId={buildId} envId={envId} instanceNum={index} />
          </Popover>
        ))}
      {instanceCount > TOTAL_VISIBLE_INSTANCES ? (
        <Text
          font={{ size: 'small', weight: 'semi-bold' }}
          color={Color.GREY_600}
          margin={{ left: 'xsmall' }}
        >{`+${numberFormatter(instanceCount - TOTAL_VISIBLE_INSTANCES)}`}</Text>
      ) : (
        <></>
      )}
    </Container>
  ) : (
    <></>
  )
}

export const ActiveServiceInstancesContent = (
  props: React.PropsWithChildren<{
    hideHeaders?: boolean
    columnsWidth?: string[]
    summaryRow?: boolean
    loading?: boolean
    data?: EnvBuildIdAndInstanceCountInfo[]
    error?: GetDataError<unknown> | null
    refetch?: () => Promise<void>
  }>
): React.ReactElement => {
  const { hideHeaders = false, columnsWidth = [], summaryRow = false, loading = false, data, error, refetch } = props
  const { getString } = useStrings()

  // this state holds how many builds are visible for each environment, it updates as we click on show more button
  const [visibleBuildCount, setVisibleBuildCount] = useState<VisibleBuildCount>({})

  useEffect(() => {
    setVisibleBuildCount(initVisibleBuildCount(data))
  }, [data, setVisibleBuildCount])

  const expandBuilds = useCallback((envId?: string): void => {
    if (!envId) {
      return
    }
    setVisibleBuildCount(prevVisibleBuildCount => ({
      ...prevVisibleBuildCount,
      [envId]: prevVisibleBuildCount[envId] + TOTAL_VISIBLE_BUILDS
    }))
  }, [])

  const tableData: TableRowData[] = useMemo(() => {
    if (summaryRow) {
      return getSummaryRowData(data)
    } else {
      return getTableData(data, visibleBuildCount)
    }
  }, [data, summaryRow, visibleBuildCount])

  const columns = useMemo(() => {
    const columnsArray = [
      {
        Header: getString('cd.serviceDashboard.headers.environment'),
        id: 'service',
        width: columnsWidth[0] || '20%',
        Cell: RenderEnvironment
      },
      {
        Header: getString('cd.serviceDashboard.headers.artifactVersion'),
        id: 'type',
        width: columnsWidth[1] || '25%',
        Cell: RenderBuildName,
        expandBuilds
      },
      {
        Header: getString('cd.serviceDashboard.headers.instances'),
        id: 'serviceInstances',
        width: columnsWidth[2] || '10%',
        Cell: RenderInstanceCount
      },
      {
        Header: '',
        id: 'deployments',
        width: columnsWidth[3] || '45%',
        Cell: RenderInstances
      }
    ]

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
      <Table<TableRowData> columns={columns} data={tableData} className={css.instanceTable} hideHeaders={hideHeaders} />
    </Layout.Horizontal>
  )
}
