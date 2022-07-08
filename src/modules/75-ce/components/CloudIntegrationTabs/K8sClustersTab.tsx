/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  ButtonSize,
  ButtonVariation,
  Container,
  ExpandingSearchInput,
  FlexExpander,
  IconName,
  Layout,
  TableV2,
  Text
} from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { Classes, Menu, Popover, Spinner } from '@blueprintjs/core'
import { useHistory, useParams } from 'react-router-dom'
import qs from 'qs'
import type { CellProps, Column, Renderer } from 'react-table'
import { debounce } from 'lodash-es'
import ReactTimeago from 'react-timeago'

import routes from '@common/RouteDefinitions'
import RbacButton from '@rbac/components/Button/Button'
import useCreateConnectorModal from '@connectors/modals/ConnectorModal/useCreateConnectorModal'
import { useStrings } from 'framework/strings'
import {
  ConnectorInfoDTO,
  ConnectorResponse,
  PageConnectorResponse,
  useGetConnectorListV2,
  useGetTestConnectionResult
} from 'services/cd-ng'
import { useFetchCcmMetaDataQuery } from 'services/ce/services'
import { generateFilters } from '@ce/utils/anomaliesUtils'
import { GROUP_BY_CLUSTER_NAME } from '@ce/utils/perspectiveUtils'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import type { CloudProvider } from '@ce/types'
import { useFeature } from '@common/hooks/useFeatures'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'

import { useCloudVisibilityModal } from '../CloudVisibilityModal/CloudVisibilityModal'
import { useAutoStoppingModal } from '../AutoStoppingModal/AutoStoppingModal'

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
  const { accountId } = useParams<{ accountId: string }>()

  const data = cell.row.original
  const status = data.status
  const isStatusSuccess = data?.status === 'SUCCESS'

  const [lastTestedAt, setLastTestedAt] = useState<number>()

  const { mutate: testConnection } = useGetTestConnectionResult({
    identifier: data.connector?.identifier || '',
    queryParams: {
      accountIdentifier: accountId
    }
  })

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
        <ReactTimeago date={lastTestedAt || status?.lastTestedAt || status?.testedAt || ''} />
      </Text>
      {!isStatusSuccess ? (
        <Button
          variation={ButtonVariation.SECONDARY}
          size={ButtonSize.SMALL}
          text={getString('test')}
          className={css.testBtn}
          onClick={async e => {
            try {
              e.stopPropagation()
              await testConnection()
            } finally {
              setLastTestedAt(new Date().getTime())
            }
          }}
        />
      ) : null}
    </div>
  )
}

const FeaturesEnabledCell: CustomCell = cell => {
  const { getString } = useStrings()
  const connector = (cell.row.original?.connector || {}) as ConnectorInfoDTO
  const permissions = (cell.row.original?.connector?.spec?.featuresEnabled || []) as string[]

  const isReportingEnabled = permissions.includes('VISIBILITY')
  const isAutoStoppingEnabled = permissions.includes('OPTIMIZATION')

  const iconProps: { icon: IconName; iconProps: { size: number; color: Color } } = {
    icon: 'tick',
    iconProps: { size: 12, color: Color.PURPLE_700 }
  }

  const featureInfo = useFeature({
    featureRequest: {
      featureName: FeatureIdentifier.CCM_K8S_CLUSTERS
    }
  })

  const [openCloudVisibilityModal] = useCloudVisibilityModal({ connector })
  const [openAutoStoppingModal] = useAutoStoppingModal({ connector })

  return (
    <Layout.Horizontal className={css.features}>
      {!isReportingEnabled && !isAutoStoppingEnabled ? (
        <Button
          icon="ccm-solid"
          variation={ButtonVariation.SECONDARY}
          text={getString('ce.cloudIntegration.enableCloudCosts')}
          onClick={e => {
            e.stopPropagation()
            openCloudVisibilityModal()
          }}
          disabled={!featureInfo.enabled}
        />
      ) : (
        <>
          {isReportingEnabled ? (
            <Text {...iconProps} className={css.permissionTag}>
              {getString('ce.cloudIntegration.reporting')}
            </Text>
          ) : null}
          {/* TODO - Reporting Popover */}
          {isAutoStoppingEnabled ? (
            <Text {...iconProps} className={css.permissionTag}>
              {getString('common.ce.autostopping')}
            </Text>
          ) : (
            <Button
              icon="plus"
              variation={ButtonVariation.SECONDARY}
              className={css.addAutoStoppingBtn}
              text={getString('common.ce.autostopping')}
              onClick={e => {
                e.stopPropagation()
                openAutoStoppingModal()
              }}
            />
          )}
          {/* TODO - AutoStopping Popover */}
        </>
      )}
    </Layout.Horizontal>
  )
}

const MenuCell: CustomCell = () => {
  const { getString } = useStrings()

  // const data = cell.row.original.status

  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Popover
      isOpen={menuOpen}
      className={Classes.DARK}
      interactionKind={'click'}
      onInteraction={nextOpenState => {
        setMenuOpen(nextOpenState)
      }}
    >
      <Button
        minimal
        icon="Options"
        onClick={e => {
          e.stopPropagation()
          setMenuOpen(true)
        }}
      />
      <Menu style={{ minWidth: 'unset' }}>
        <Menu.Item icon="edit" text={getString('edit')} />
        <Menu.Item icon="trash" text={getString('delete')} />
      </Menu>
    </Popover>
  )
}

const K8sClustersTab: React.FC = () => {
  const { getString } = useStrings()
  const history = useHistory()
  const { accountId } = useParams<{ accountId: string }>()

  const [k8sClusters, setK8sClusters] = useState<PageConnectorResponse>()
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const [ccmMetaResult] = useFetchCcmMetaDataQuery()
  const { data: ccmMetaDataRes, fetching: fetchingCCMMetaData } = ccmMetaResult

  const { loading, mutate: fetchConnectors } = useGetConnectorListV2({
    queryParams: {
      searchTerm,
      pageIndex: page,
      pageSize: 10,
      accountIdentifier: accountId
    }
  })

  const getK8sConnectors = async () => {
    const { data: connectorResponse } = await fetchConnectors({
      filterType: 'Connector',
      types: ['K8sCluster', 'CEK8sCluster']
    })

    setK8sClusters(connectorResponse)
  }

  useEffect(() => {
    getK8sConnectors()
  }, [page, searchTerm])

  const cloudProvider = 'CLUSTER' as CloudProvider
  const defaultClusterPerspectiveId = ccmMetaDataRes?.ccmMetaData?.defaultClusterPerspectiveId as string

  const ViewCostsCell: CustomCell = cell => {
    const connector = cell.row.original.connector
    const connectorName = connector?.name || ''
    const isReportingEnabled = connector?.spec?.featuresEnabled?.includes('VISIBILITY')

    const perspectiveLink = useMemo(
      () => ({
        pathname: routes.toPerspectiveDetails({
          accountId: accountId,
          perspectiveId: defaultClusterPerspectiveId,
          perspectiveName: defaultClusterPerspectiveId
        }),
        search: `?${qs.stringify({
          filters: JSON.stringify(generateFilters({ clusterName: connectorName }, cloudProvider)),
          groupBy: JSON.stringify(GROUP_BY_CLUSTER_NAME)
        })}`
      }),
      []
    )

    return isReportingEnabled ? (
      <Button
        variation={ButtonVariation.LINK}
        rightIcon="launch"
        iconProps={{ size: 12, color: Color.PRIMARY_7 }}
        text={getString('ce.cloudIntegration.viewCosts')}
        onClick={e => {
          e.stopPropagation()
          history.push(perspectiveLink)
        }}
      />
    ) : null
  }

  const columns = useMemo(
    () => [
      {
        accessor: 'name',
        Header: getString('connectors.name'),
        Cell: ConnectorNameCell,
        width: '25%'
      },
      {
        accessor: 'status',
        Header: getString('ce.cloudIntegration.connectorStatus'),
        Cell: ConnectorStatusCell,
        width: '30%'
      },
      {
        accessor: 'featuresEnabled',
        Header: getString('ce.cloudIntegration.featuresEnabled'),
        Cell: FeaturesEnabledCell,
        width: '40%'
      },
      {
        accessor: 'viewCosts',
        Header: '',
        Cell: ViewCostsCell,
        width: '15%'
      },
      {
        accessor: 'menu',
        Header: '',
        Cell: MenuCell,
        width: '5%'
      }
    ],
    [defaultClusterPerspectiveId]
  )

  const debouncedSearch = useCallback(
    debounce((text: string) => setSearchTerm(text), 500),
    []
  )

  const { openConnectorModal } = useCreateConnectorModal({
    onSuccess: getK8sConnectors
  })

  const isLoading = loading || fetchingCCMMetaData

  return (
    <Container className={css.main}>
      <Layout.Horizontal margin={{ bottom: 'small' }}>
        <RbacButton
          variation={ButtonVariation.PRIMARY}
          text={getString('newConnector')}
          icon="plus"
          permission={{
            permission: PermissionIdentifier.UPDATE_CONNECTOR,
            resource: {
              resourceType: ResourceType.CONNECTOR
            }
          }}
          onClick={() => openConnectorModal(false, 'K8sCluster', undefined)}
          id="newConnectorBtn"
          data-test="newConnectorButton"
        />
        <FlexExpander />
        <ExpandingSearchInput
          placeholder={getString('search')}
          onChange={text => debouncedSearch(text)}
          className={css.search}
        />
      </Layout.Horizontal>
      {!isLoading ? (
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
      ) : (
        <Container className={css.spinner}>
          <Spinner />
        </Container>
      )}
    </Container>
  )
}

export default K8sClustersTab

// const ReportingEnabledButton: React.FC = () => <Text></Text>

// const AutoStoppingEnabledButton: React.FC = () => <Text></Text>
