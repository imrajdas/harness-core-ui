/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { Button, ButtonSize, ButtonVariation, Container, IconName, Layout, TableV2, Text } from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { Spinner } from '@blueprintjs/core'
import { useHistory, useParams } from 'react-router-dom'
import type { CellProps, Column, Renderer } from 'react-table'
import ReactTimeago from 'react-timeago'

import routes from '@common/RouteDefinitions'
import { useStrings } from 'framework/strings'
import { ConnectorResponse, PageConnectorResponse, useGetConnectorListV2 } from 'services/cd-ng'

import { useCloudVisibilityModal } from '../CloudVisibilityModal/CloudVisibilityModal'
import CostDataCollectionBanner from './CostDataCollectionBanner'

import css from './CloudIntegrationTabs.module.scss'

type CustomColumn = Column<ConnectorResponse>[]
type CustomCell = Renderer<CellProps<ConnectorResponse>>

const ConnectorNameCell: CustomCell = cell => {
  const name = cell.row.original?.connector?.name

  return (
    <Text
      icon="app-kubernetes"
      iconProps={{ size: 30, margin: { right: 'small' } }}
      font={{ variation: FontVariation.BODY2 }}
      className={css.nameCell}
      lineClamp={1}
    >
      {name}
    </Text>
  )
}

const ConnectorStatusCell: CustomCell = cell => {
  const { getString } = useStrings()

  const data = cell.row.original.status
  const isStatusSuccess = data?.status === 'SUCCESS'

  const iconProps: { icon: IconName; iconProps: { size: number; color: Color } } = useMemo(() => {
    if (isStatusSuccess) {
      return { icon: 'full-circle', iconProps: { size: 8, color: Color.GREEN_500 } }
    } else {
      return { icon: 'warning-sign', iconProps: { size: 12, color: Color.RED_500 } }
    }
  }, [isStatusSuccess])

  return (
    <div className={css.statusCell}>
      <Text
        {...iconProps}
        font={{ variation: FontVariation.BODY }}
        color={isStatusSuccess ? Color.GREY_800 : Color.RED_500}
      >
        <ReactTimeago date={data?.lastTestedAt || data?.testedAt || ''} />
      </Text>
      {!isStatusSuccess ? (
        <Button
          variation={ButtonVariation.SECONDARY}
          size={ButtonSize.SMALL}
          text={getString('test')}
          className={css.testBtn}
        />
      ) : null}
    </div>
  )
}

const FeaturesEnabledCell: CustomCell = cell => {
  const { getString } = useStrings()
  const permissions = (cell.row.original?.connector?.spec?.featuresEnabled || []) as string[]

  const isVisibilityEnabled = permissions.includes('VISIBILITY')
  const isAutoStoppingEnabled = permissions.includes('OPTIMIZATION')

  const iconProps: { icon: IconName; iconProps: { size: number; color: Color } } = {
    icon: 'tick',
    iconProps: { size: 12, color: Color.PURPLE_700 }
  }

  const [openModal] = useCloudVisibilityModal()

  return (
    <Layout.Horizontal>
      {!isVisibilityEnabled && !isAutoStoppingEnabled ? (
        <Text
          icon="ccm-solid"
          iconProps={{ size: 18 }}
          className={css.enableCloudCostsBtn}
          onClick={e => {
            e.stopPropagation()
            openModal()
          }}
        >
          {getString('ce.cloudIntegration.enableCloudCosts')}
        </Text>
      ) : (
        <>
          {isVisibilityEnabled ? (
            <Text {...iconProps} className={css.permissionTag}>
              {getString('ce.cloudIntegration.reporting')}
            </Text>
          ) : null}
          {isAutoStoppingEnabled ? (
            <Text {...iconProps} className={css.permissionTag}>
              {getString('common.ce.autostopping')}
            </Text>
          ) : (
            <Text icon="plus" iconProps={{ size: 12, color: Color.PRIMARY_7 }} className={css.addAutoStoppingBtn}>
              {getString('common.ce.autostopping')}
            </Text>
          )}
        </>
      )}
    </Layout.Horizontal>
  )
}

const LastUpdatedCell: CustomCell = cell => {
  const data = cell.row.original

  return data.lastModifiedAt ? (
    <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_800}>
      <ReactTimeago date={data.lastModifiedAt} />
    </Text>
  ) : null
}

const K8sClustersTab: React.FC = () => {
  const { getString } = useStrings()
  const history = useHistory()
  const { accountId } = useParams<{ accountId: string }>()

  const [k8sClusters, setK8sClusters] = useState<PageConnectorResponse>()
  const [page, setPage] = useState(0)

  const { loading, mutate: fetchConnectors } = useGetConnectorListV2({
    queryParams: {
      pageIndex: page,
      pageSize: 10,
      accountIdentifier: accountId
    }
  })

  const getK8sConnectors = async () => {
    const { data: connectorResponse } = await fetchConnectors({
      filterType: 'Connector',
      types: ['K8sCluster']
    })

    setK8sClusters(connectorResponse)
  }

  useEffect(() => {
    getK8sConnectors()
  }, [page])

  const columns = useMemo(
    () => [
      {
        accessor: 'connector.name',
        Header: getString('connectors.name'),
        Cell: ConnectorNameCell,
        width: '25%'
      },
      {
        accessor: 'connector.status',
        Header: getString('ce.cloudIntegration.connectorStatus'),
        Cell: ConnectorStatusCell,
        width: '30%'
      },
      {
        accessor: 'connector.spec',
        Header: getString('ce.cloudIntegration.featuresEnabled'),
        Cell: FeaturesEnabledCell,
        width: '40%'
      },
      {
        accessor: 'lastModifiedAt',
        Header: getString('lastUpdated'),
        Cell: LastUpdatedCell,
        width: '15%'
      }
    ],
    []
  )

  const showCostCollectionBanner = k8sClusters?.content?.some(item => item.connector?.spec?.featuresEnabled?.length > 0)

  if (loading) {
    return (
      <Container className={css.spinner}>
        <Spinner />
      </Container>
    )
  }

  return (
    <Container className={css.main}>
      {showCostCollectionBanner ? <CostDataCollectionBanner isEnabled={true} /> : null}
      <TableV2<ConnectorResponse>
        data={k8sClusters?.content || []}
        columns={columns as CustomColumn}
        className={css.table}
        onRowClick={({ connector }) =>
          history.push(routes.toConnectorDetails({ accountId, connectorId: connector?.identifier }))
        }
        pagination={{
          itemCount: k8sClusters?.totalItems || 0,
          pageSize: k8sClusters?.pageSize || 10,
          pageCount: k8sClusters?.totalPages || -1,
          pageIndex: k8sClusters?.pageIndex || 0,
          gotoPage: pageNo => setPage(pageNo)
        }}
      />
    </Container>
  )
}

export default K8sClustersTab
