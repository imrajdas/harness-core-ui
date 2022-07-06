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
import type { CellProps, Column, Renderer } from 'react-table'
import { debounce } from 'lodash-es'
import ReactTimeago from 'react-timeago'

import routes from '@common/RouteDefinitions'
import { useStrings } from 'framework/strings'
import { ConnectorResponse, PageConnectorResponse, useGetConnectorListV2 } from 'services/cd-ng'
import { CcmMetaData, useFetchCcmMetaDataQuery } from 'services/ce/services'
import { getIconByType } from '@connectors/pages/connectors/utils/ConnectorUtils'

import css from './CloudIntegrationTabs.module.scss'

type CustomColumn = Column<ConnectorResponse>[]
type CustomCell = Renderer<CellProps<ConnectorResponse>>

const ConnectorNameCell: CustomCell = cell => {
  const name = cell.row.original?.connector?.name
  const connectorType = cell.row.original.connector?.type

  return (
    <Text
      icon={getIconByType(connectorType)}
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

const defaultPerspectiveIdMap: Record<string, keyof CcmMetaData> = {
  CEAzure: 'defaultAzurePerspectiveId',
  CEAws: 'defaultAwsPerspectiveId',
  GcpCloudCost: 'defaultGcpPerspectiveId'
}

const CloudAccountsTab: React.FC = () => {
  const { getString } = useStrings()
  const history = useHistory()
  const { accountId } = useParams<{ accountId: string }>()

  const [cloudAccounts, setCloudAccounts] = useState<PageConnectorResponse>()
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

  const getCloudAccounts = async () => {
    const { data: connectorResponse } = await fetchConnectors({
      filterType: 'Connector',
      types: ['CEAws', 'GcpCloudCost', 'CEAzure']
    })

    setCloudAccounts(connectorResponse)
  }

  useEffect(() => {
    getCloudAccounts()
  }, [page, searchTerm])

  const ccmMetaData = ccmMetaDataRes?.ccmMetaData

  const ViewCostsCell: CustomCell = cell => {
    const connector = cell.row.original.connector
    const connectorType = connector?.type || ''
    const isReportingEnabled = connector?.spec?.featuresEnabled?.includes('VISIBILITY')
    const defaultPerspectiveIdString = defaultPerspectiveIdMap[connectorType]
    const defaultPerspectiveId = ccmMetaData?.[defaultPerspectiveIdString] as string

    const perspectiveLink = useMemo(
      () => ({
        pathname: routes.toPerspectiveDetails({
          accountId: accountId,
          perspectiveId: defaultPerspectiveId,
          perspectiveName: defaultPerspectiveId
        })
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
        accessor: 'connector.name',
        Header: getString('connectors.name'),
        Cell: ConnectorNameCell,
        width: '25%'
      },
      {
        accessor: 'connector.status',
        Header: getString('ce.cloudIntegration.connectorStatus'),
        Cell: ConnectorStatusCell,
        width: '55%'
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
    [ccmMetaData]
  )

  const debouncedSearch = useCallback(
    debounce((text: string) => setSearchTerm(text), 500),
    []
  )

  const isLoading = loading || fetchingCCMMetaData

  return (
    <Container className={css.main}>
      <Layout.Horizontal margin={{ bottom: 'small' }}>
        <FlexExpander />
        <ExpandingSearchInput
          placeholder={getString('search')}
          onChange={text => debouncedSearch(text)}
          className={css.search}
        />
        {/* TODO - Quick Filters / Filter Panel */}
      </Layout.Horizontal>
      {!isLoading ? (
        <TableV2<ConnectorResponse>
          data={cloudAccounts?.content || []}
          columns={columns as CustomColumn}
          className={css.table}
          onRowClick={({ connector }) =>
            history.push(routes.toConnectorDetails({ accountId, connectorId: connector?.identifier }))
          }
          pagination={{
            itemCount: cloudAccounts?.totalItems || 0,
            pageSize: cloudAccounts?.pageSize || 10,
            pageCount: cloudAccounts?.totalPages || -1,
            pageIndex: cloudAccounts?.pageIndex || 0,
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

export default CloudAccountsTab
