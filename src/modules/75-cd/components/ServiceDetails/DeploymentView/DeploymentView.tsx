/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Container, Layout, PageError, PageSpinner, TableV2, Text } from '@wings-software/uicore'
import type { CellProps, Renderer } from 'react-table'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps, ServicePathProps } from '@common/interfaces/RouteInterfaces'
import MostActiveServicesEmptyState from '@cd/icons/MostActiveServicesEmptyState.svg'
import {
  EnvironmentInfoByServiceId,
  GetEnvArtifactDetailsByServiceIdQueryParams,
  useGetEnvArtifactDetailsByServiceId
} from 'services/cd-ng'
import css from '@cd/components/ServiceDetails/DeploymentView/DeploymentView.module.scss'

interface TableRowsData {
  envId?: string
  envName?: string
  artifactVisible?: string
}

const getTableData = (envData?: EnvironmentInfoByServiceId[]): TableRowsData[] => {
  const tableData: TableRowsData[] = []
  if (!envData) {
    return tableData
  }
  envData.forEach(item => {
    const envId = item.environmentId
    if (envId) {
      tableData.push({
        envId,
        envName: item.environmentName,
        artifactVisible: item.tag
      })
    }
  })
  return tableData
}

const RenderArtifactVersion: Renderer<CellProps<TableRowsData>> = ({
  row: {
    original: { artifactVisible }
  }
}) => {
  const component = artifactVisible ? (
    <Text color={Color.GREY_800} lineClamp={1}>
      {artifactVisible}
    </Text>
  ) : (
    <></>
  )
  return (
    <Container className={css.paddedContainer}>
      <Container padding={{ right: 'xsmall' }}>{component}</Container>
    </Container>
  )
}

const RenderEnvironment: Renderer<CellProps<TableRowsData>> = ({
  row: {
    original: { envName }
  }
}) => {
  return (
    <Container className={css.envName}>
      <Text className={css.envNameText} color={Color.WHITE} lineClamp={1}>
        {envName}
      </Text>
    </Container>
  )
}

export const Deployments: React.FC = () => {
  const { getString } = useStrings()

  const { accountId, orgIdentifier, projectIdentifier, serviceId } = useParams<ProjectPathProps & ServicePathProps>()

  const queryParams: GetEnvArtifactDetailsByServiceIdQueryParams = {
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier,
    serviceId
  }

  const { loading, data, error, refetch } = useGetEnvArtifactDetailsByServiceId({ queryParams })

  const columns = useMemo(() => {
    return [
      {
        Header: getString('cd.serviceDashboard.headers.environment'),
        id: 'envName',
        width: '35%',
        Cell: RenderEnvironment
      },
      {
        Header: getString('cd.serviceDashboard.headers.artifactVersion'),
        id: 'artifactList',
        width: '65%',
        Cell: RenderArtifactVersion
      }
    ]
  }, [])

  const tableData: TableRowsData[] = useMemo(() => getTableData(data?.data?.environmentInfoByServiceId), [data])

  // error, loading, empty handling
  if (loading || error || !(data?.data?.environmentInfoByServiceId || []).length) {
    const component = (() => {
      if (loading) {
        return (
          <Container data-test="deploymentsLoader" height="360px">
            <PageSpinner />
          </Container>
        )
      }
      if (error) {
        return (
          <Container data-test="deploymentsError" height="360px">
            <PageError onClick={() => refetch()} />
          </Container>
        )
      }
      return (
        <Layout.Vertical
          height="360px"
          flex={{ align: 'center-center' }}
          data-test="deploymentsEmpty"
          className={css.deploymentsEmpty}
        >
          <Container margin={{ bottom: 'medium' }}>
            <img width="50" height="50" src={MostActiveServicesEmptyState} style={{ alignSelf: 'center' }} />
          </Container>
          <Text color={Color.GREY_400}>{getString('pipeline.dashboards.noActiveDeployments')}</Text>
        </Layout.Vertical>
      )
    })()
    return component
  }

  return (
    <Container>
      <TableV2<TableRowsData> className={css.deploymentTab} columns={columns} data={tableData} />
    </Container>
  )
}
