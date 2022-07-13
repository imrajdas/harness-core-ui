/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import type { CellProps, Renderer } from 'react-table'
import cx from 'classnames'
import { Color, FontVariation } from '@harness/design-system'
import { Container, Layout, Popover, Text, PageError, useToaster } from '@wings-software/uicore'
import { PopoverInteractionKind } from '@blueprintjs/core'
import type { GetDataError } from 'restful-react'
import ReactTimeago from 'react-timeago'
import { useParams } from 'react-router-dom'
import { PageSpinner, Table } from '@common/components'
import type { InstanceGroupedByArtifact } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import MostActiveServicesEmptyState from '@cd/icons/MostActiveServicesEmptyState.svg'
import { numberFormatter } from '@cd/components/Services/common'
import routes from '@common/RouteDefinitions'
import type { PipelineType, PipelinePathProps, ExecutionPathProps } from '@common/interfaces/RouteInterfaces'
import { ActiveServiceInstancePopover } from './ActiveServiceInstancePopover'
import css from './ActiveServiceInstancesV2.module.scss'

const TOTAL_VISIBLE_INSTANCES = 7

interface TableRowData {
  artifactVersion?: string
  envId?: string
  envName?: string
  infraIdentifier?: string
  infraName?: string
  instanceCount?: number
  lastPipelineExecutionId?: string
  lastPipelineExecutionName?: string
  lastDeployedAt?: string
  showArtifact?: boolean
  showEnv?: boolean
  totalEnvs?: number
  totalInfras?: number
}

const getFullTableData = (instanceGroupedByArtifact?: InstanceGroupedByArtifact[]): TableRowData[] => {
  const tableData: TableRowData[] = []
  instanceGroupedByArtifact?.forEach(artifact => {
    if (artifact.artifactVersion && artifact.instanceGroupedByEnvironmentList) {
      const artifactVersion = artifact.artifactVersion
      artifact.instanceGroupedByEnvironmentList.forEach((env, envIndex) => {
        env.instanceGroupedByInfraList?.forEach((infra, infraIndex) => {
          tableData.push({
            artifactVersion: artifactVersion,
            showArtifact: !envIndex && !infraIndex,
            envId: env.envId,
            envName: env.envName,
            showEnv: !infraIndex,
            infraIdentifier: infra.infraIdentifier,
            infraName: infra.infraName,
            instanceCount: infra.count,
            lastPipelineExecutionId: infra.lastPipelineExecutionId,
            lastPipelineExecutionName: infra.lastPipelineExecutionName,
            lastDeployedAt: infra.lastDeployedAt
          })
        })
      })
    }
  })
  return tableData
}

const getPreviewTableData = (instanceGroupedByArtifact?: InstanceGroupedByArtifact[]): TableRowData[] => {
  const tableData: TableRowData[] = []
  instanceGroupedByArtifact?.forEach(artifact => {
    artifact.instanceGroupedByEnvironmentList?.forEach((env, envIndex) => {
      let totalInstancesPerEnv = 0
      env.instanceGroupedByInfraList?.forEach(infra => {
        totalInstancesPerEnv += infra.count || 0
      })
      tableData.push({
        artifactVersion: artifact.artifactVersion,
        showArtifact: !envIndex,
        envId: env.envId,
        envName: env.envName,
        showEnv: true,
        totalInfras: env.instanceGroupedByInfraList?.length,
        instanceCount: totalInstancesPerEnv
      })
    })
  })
  return tableData
}

const getSummaryTableData = (instanceGroupedByArtifact?: InstanceGroupedByArtifact[]): TableRowData[] => {
  const tableData: TableRowData[] = []
  let artifactVersion: string | undefined
  let envName: string | undefined
  let infraName: string | undefined
  let totalEnvs = 0
  let totalInfras = 0
  let totalInstances = 0
  let lastDeployedAt = '0'
  instanceGroupedByArtifact?.forEach(artifact => {
    artifactVersion ??= artifact.artifactVersion
    artifact.instanceGroupedByEnvironmentList?.forEach(env => {
      totalEnvs++
      envName ??= env.envName
      env.instanceGroupedByInfraList?.forEach(infra => {
        infraName ??= infra.infraName
        totalInfras++
        totalInstances += infra.count || 0
        if (infra.lastDeployedAt) {
          lastDeployedAt =
            parseInt(lastDeployedAt) >= parseInt(infra.lastDeployedAt) ? lastDeployedAt : infra.lastDeployedAt
        }
      })
    })
  })
  tableData.push({
    artifactVersion: artifactVersion,
    showArtifact: true,
    envName: envName,
    showEnv: true,
    totalEnvs: totalEnvs,
    infraName: infraName,
    totalInfras: totalInfras,
    instanceCount: totalInstances,
    lastDeployedAt: lastDeployedAt
  })
  return tableData
}

const RenderArtifactVersion: Renderer<CellProps<TableRowData>> = ({
  row: {
    original: { artifactVersion, showArtifact }
  }
}) => {
  return showArtifact ? (
    <Text font={{ size: 'small', weight: 'semi-bold' }} lineClamp={1} color={Color.GREY_800}>
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
        <Text font={{ size: 'small', weight: 'semi-bold' }} lineClamp={1} color={Color.GREY_800}>
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
    original: { envId, artifactVersion: buildId, instanceCount }
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

// Inspired by 'ServicesList > RenderLastDeployment', consider reusing
const RenderPipelineExecution: Renderer<CellProps<TableRowData>> = ({
  row: {
    original: { lastPipelineExecutionId, lastPipelineExecutionName, lastDeployedAt }
  }
}) => {
  const { getString } = useStrings()
  const { showError } = useToaster()

  const { orgIdentifier, projectIdentifier, accountId, module, pipelineIdentifier } =
    useParams<PipelineType<PipelinePathProps>>()
  const source: ExecutionPathProps['source'] = pipelineIdentifier ? 'executions' : 'deployments'

  function handleClick(): void {
    if (lastPipelineExecutionName && lastPipelineExecutionId) {
      const route = routes.toExecutionPipelineView({
        orgIdentifier,
        pipelineIdentifier: lastPipelineExecutionName,
        executionIdentifier: lastPipelineExecutionId,
        projectIdentifier,
        accountId,
        module,
        source
      })

      const baseUrl = window.location.href.split('#')[0]
      window.open(`${baseUrl}#${route}`)
    } else {
      showError(getString('cd.serviceDashboard.noLastDeployment'))
    }
  }

  return (
    <Layout.Vertical margin={{ right: 'large' }} padding={{ left: 'small' }} flex={{ alignItems: 'flex-start' }}>
      <Text
        font={{ variation: FontVariation.BODY2 }}
        color={Color.PRIMARY_7}
        margin={{ right: 'xsmall' }}
        className={css.lastDeploymentText}
        lineClamp={1}
        onClick={e => {
          e.stopPropagation()
          handleClick()
        }}
        data-testid="pipeline-link"
      >
        {lastPipelineExecutionName}
      </Text>
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
      preview: '26%',
      summary: '18%',
      full: '18%'
    }
  },
  envs: {
    width: {
      preview: '22%',
      summary: '17%',
      full: '17%'
    }
  },
  infras: {
    width: {
      preview: '15%',
      summary: '17%',
      full: '17%'
    }
  },
  instancesCount: {
    width: {
      preview: '10%',
      summary: '5%',
      full: '5%'
    }
  },
  instances: {
    width: {
      preview: '27%',
      summary: '28%',
      full: '28%'
    }
  },
  pipelines: {
    width: {
      preview: '0%',
      summary: '23%',
      full: '23%'
    }
  }
}

export const ActiveServiceInstancesContentV2 = (
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
      },
      {
        Header: getString('cd.serviceDashboard.headers.instances'),
        id: 'instances',
        width: columnsProperties.instancesCount.width[tableType],
        Cell: RenderInstanceCount
      },
      {
        Header: '',
        id: 'deployments',
        width: columnsProperties.instances.width[tableType],
        Cell: RenderInstances
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
