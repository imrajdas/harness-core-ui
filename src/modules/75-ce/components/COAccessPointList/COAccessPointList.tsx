/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import type { CellProps } from 'react-table'
import {
  Text,
  Layout,
  Container,
  Button,
  Page,
  PageSpinner,
  Icon,
  TableV2,
  ButtonVariation
} from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import copy from 'copy-to-clipboard'
import { useParams } from 'react-router-dom'
import type { IconName } from '@blueprintjs/icons'
import { defaultTo } from 'lodash-es'
import { Classes, Menu, Popover, Position } from '@blueprintjs/core'
// import { Dialog, IconName, IDialogProps } from '@blueprintjs/core'
import { AccessPoint, useAccessPointActivity, useAccessPointRules, useAllAccessPoints } from 'services/lw'
import { useToaster } from '@common/exports'
import { useStrings } from 'framework/strings'
// import CreateAccessPointWizard from '../COGatewayAccess/CreateAccessPointWizard'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import DeleteAccessPoint from '../COAccessPointDelete/DeleteAccessPoint'
import { getRelativeTime } from '../COGatewayList/Utils'
// import LoadBalancerDnsConfig from '../COGatewayAccess/LoadBalancerDnsConfig'
import useCreateAccessPointDialog from './COCreateAccessPointDialog'
import TextWithToolTip, { textWithToolTipStatus } from '../TextWithTooltip/TextWithToolTip'
import useEditAccessPoint from './EditAccessPoint'
import css from './COAcessPointList.module.scss'

function NameCell(tableProps: CellProps<AccessPoint>): JSX.Element {
  const { showSuccess } = useToaster()
  const { getString } = useStrings()
  return (
    <Layout.Horizontal spacing={'small'} flex={{ alignItems: 'start' }} className={css.apNameContainer}>
      <Container>
        <Text lineClamp={1} color={Color.BLACK} style={{ fontWeight: 600 }}>
          {tableProps.value}
        </Text>
        <Text lineClamp={1} color={Color.GREY_400}>
          {tableProps.row.original.host_name}
        </Text>
      </Container>
      <Layout.Horizontal spacing={'medium'}>
        <TextWithToolTip
          errors={tableProps.row.original.status_msg ? [{ error: tableProps.row.original.status_msg }] : []}
          status={
            tableProps.row.original.status === 'errored' ? textWithToolTipStatus.ERROR : textWithToolTipStatus.SUCCESS
          }
          indicatorColor={tableProps.row.original.status === 'submitted' ? Color.YELLOW_500 : undefined}
        />
        {(tableProps.row.original.metadata as any)?.externalIP && (
          <Button
            text="IP"
            inline
            variation={ButtonVariation.SECONDARY}
            className={css.ipBtn}
            tooltip={
              <Layout.Horizontal
                flex={{ alignItems: 'center' }}
                spacing={'small'}
                padding={'small'}
                className={css.accessPointIpTooltip}
              >
                <Text color={Color.WHITE}>{(tableProps.row.original.metadata as any)?.externalIP}</Text>
                <Icon
                  name="copy-alt"
                  size={16}
                  onClick={e => {
                    e.preventDefault()
                    if (copy((tableProps.row.original.metadata as any)?.externalIP)) {
                      showSuccess(getString('clipboardCopySuccess'))
                    }
                  }}
                />
              </Layout.Horizontal>
            }
            tooltipProps={{ isDark: true, openOnTargetFocus: true, position: 'bottom' }}
          />
        )}
      </Layout.Horizontal>
    </Layout.Horizontal>
  )
}

function DNSCell(tableProps: CellProps<AccessPoint>): JSX.Element {
  return <Text lineClamp={3}>{tableProps.row.original.metadata?.dns?.route53 ? 'Route 53' : 'Others'}</Text>
}
function CloudAccountCell(tableProps: CellProps<AccessPoint>): JSX.Element {
  return (
    <Layout.Horizontal spacing="small" style={{ overflowWrap: 'anywhere' }} padding={{ right: 'large' }}>
      <Icon name={`service-${tableProps.row.original.type || 'aws'}` as IconName} size={24} />
      <Text lineClamp={1} color={Color.GREY_500}>
        {tableProps.value}
      </Text>
    </Layout.Horizontal>
  )
}

const TableCell: React.FC<CellProps<AccessPoint>> = tableProps => {
  return (
    <div style={{ overflowWrap: 'anywhere', paddingRight: 10 }}>
      <Text lineClamp={2}>{tableProps.value}</Text>
    </div>
  )
}

const RulesCell = (tableProps: CellProps<AccessPoint>) => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const { data: details, loading: detailsLoading } = useAccessPointRules({
    lb_id: tableProps.row.original.id as string,
    account_id: accountId,
    queryParams: {
      accountIdentifier: accountId
    }
  })
  return (
    <>
      {detailsLoading ? (
        <Icon name="spinner" size={12} color="blue500" />
      ) : (
        <Layout.Horizontal spacing="medium">
          <Text lineClamp={3} color={Color.GREY_500}>
            {`${defaultTo(details?.response?.length, 0)} ${getString('ce.co.rules')}`}
          </Text>
        </Layout.Horizontal>
      )}
    </>
  )
}

const ActivityCell = (tableProps: CellProps<AccessPoint>) => {
  const { accountId } = useParams<AccountPathProps>()
  const { data: details, loading } = useAccessPointActivity({
    lb_id: tableProps.row.original.id as string, // eslint-disable-line
    account_id: accountId, // eslint-disable-line
    queryParams: {
      accountIdentifier: accountId
    }
  })
  return (
    <>
      {(details?.response?.created_at as string) && (
        <Layout.Horizontal spacing="small">
          <Icon name="history" />
          <Text lineClamp={3} color={Color.GREY_500}>
            {getRelativeTime(details?.response?.created_at as string, 'YYYY-MM-DDTHH:mm:ssZ')}
          </Text>
        </Layout.Horizontal>
      )}
      {!(details?.response?.created_at as string) && !loading && '-'}
      {loading && <Icon name="spinner" size={12} color="blue500" />}
    </>
  )
}

const RenderColumnMenu = (
  tableProps: CellProps<AccessPoint>,
  openEditAccessPointModal: (ap: AccessPoint) => void
): JSX.Element => {
  const row = tableProps.row
  const columnId = row.original.id
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Layout.Horizontal className={css.layout}>
      <Popover
        isOpen={menuOpen}
        onInteraction={nextOpenState => {
          setMenuOpen(nextOpenState)
        }}
        className={Classes.DARK}
        position={Position.BOTTOM_RIGHT}
      >
        <Button
          minimal
          icon="Options"
          onClick={e => {
            e.stopPropagation()
            setMenuOpen(true)
          }}
          data-testid={`menu-${columnId}`}
        />
        <Menu style={{ minWidth: 'unset' }}>
          <Menu.Item icon="edit" text="Edit" onClick={() => openEditAccessPointModal(row.original)} />
        </Menu>
      </Popover>
    </Layout.Horizontal>
  )
}

const COLoadBalancerList: React.FC = () => {
  const { showError } = useToaster()
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()

  const [allAccessPoints, setAllAccessPoints] = useState<AccessPoint[]>([])
  const [selectedAccessPoints, setSelectedAccessPoints] = useState<AccessPoint[]>([])

  const { data, error, loading, refetch } = useAllAccessPoints({
    account_id: accountId, // eslint-disable-line
    queryParams: {
      accountIdentifier: accountId
    },
    debounce: 300
  })

  const setAccessPoint = (newAccessPoint: AccessPoint) => {
    const newAccessPoints = [...allAccessPoints, newAccessPoint]
    setAllAccessPoints(newAccessPoints)
  }

  const { openCreateAccessPointModal } = useCreateAccessPointDialog(
    {
      onAccessPointSave: savedLb => {
        // if (isCreateMode) {
        //   setAccessPointsList([{ label: savedLb.name as string, value: savedLb.id as string }, ...accessPointsList])
        // }
        setAccessPoint(savedLb)
      }
    },
    [allAccessPoints]
  )

  if (error) {
    showError(error.data || error.message, undefined, 'ce.all.ap.rules.error')
  }
  useEffect(() => {
    if (loading) {
      return
    }
    setAllAccessPoints(data?.response as AccessPoint[])
  }, [data?.response, loading])

  const refreshList = () => {
    refetch()
    setSelectedAccessPoints([])
  }
  return (
    <Container background={Color.WHITE} height="100vh">
      <Page.Header
        breadcrumbs={<NGBreadcrumbs />}
        title={getString('ce.co.accessPoint.landingPageTitle')}
        className={css.header}
      />
      <Layout.Horizontal padding="large">
        <Layout.Horizontal width="55%" spacing="medium">
          <Button
            intent="primary"
            text={getString('ce.co.accessPoint.new')}
            icon="plus"
            disabled={loading}
            onClick={() => openCreateAccessPointModal()}
          />
          <DeleteAccessPoint accessPoints={selectedAccessPoints} accountId={accountId} refresh={refreshList} />
        </Layout.Horizontal>
      </Layout.Horizontal>
      <Page.Body className={css.pageContainer}>
        {!loading ? (
          allAccessPoints?.length > 0 && (
            <AccessPointTable
              allAccessPoints={allAccessPoints}
              selectedAccessPoints={selectedAccessPoints}
              setSelectedAccessPoints={setSelectedAccessPoints}
            />
          )
        ) : (
          <div style={{ position: 'relative', height: 'calc(100vh - 128px)' }}>
            <PageSpinner />
          </div>
        )}
      </Page.Body>
    </Container>
  )
}

interface AccessPointTableProps {
  allAccessPoints: AccessPoint[]
  selectedAccessPoints: AccessPoint[]
  setSelectedAccessPoints: (data: AccessPoint[]) => void
}

const AccessPointTable: React.FC<AccessPointTableProps> = ({
  allAccessPoints,
  selectedAccessPoints,
  setSelectedAccessPoints
}) => {
  const { getString } = useStrings()

  const { openEditAccessPointModal } = useEditAccessPoint({})

  const isSelectedAccessPoint = (item: AccessPoint) => {
    return selectedAccessPoints.findIndex(s => s.id === item.id) >= 0
  }

  const handleCheckboxChange = (e: { currentTarget: HTMLInputElement }, cellData: AccessPoint) => {
    const newAccessPoints = [...selectedAccessPoints]
    if (e.currentTarget.checked) {
      newAccessPoints.push(cellData)
    } else if (!e.currentTarget.checked && isSelectedAccessPoint(cellData)) {
      newAccessPoints.splice(selectedAccessPoints.indexOf(cellData), 1)
    }
    setSelectedAccessPoints(newAccessPoints)
  }

  const handleParentCheckboxChange = (e: { currentTarget: HTMLInputElement }) => {
    setSelectedAccessPoints(e.currentTarget.checked ? [...allAccessPoints] : [])
  }

  const getCheckboxHeader = () => {
    return (
      <input
        type="checkbox"
        checked={allAccessPoints.length === selectedAccessPoints.length}
        onChange={handleParentCheckboxChange}
      />
    )
  }

  const CheckBoxCell = (tableProps: CellProps<AccessPoint>) => {
    return (
      <input
        type="checkbox"
        checked={isSelectedAccessPoint(tableProps.row.original)}
        onChange={e => handleCheckboxChange(e, tableProps.row.original)}
      />
    )
  }

  return (
    <TableV2<AccessPoint>
      data={allAccessPoints || []}
      className={css.table}
      columns={[
        {
          //eslint-disable-next-line
          Header: getCheckboxHeader(),
          id: 'check',
          width: '5%',
          Cell: CheckBoxCell
        },
        {
          accessor: 'name',
          Header: <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('name')}</Text>,
          width: '22%',
          Cell: NameCell
        },
        {
          accessor: 'cloud_account_id',
          Header: (
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('ce.co.accessPoint.cloudAccount')}</Text>
          ),
          width: '15%',
          Cell: CloudAccountCell
        },
        {
          accessor: 'id',
          Header: (
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('ce.co.accessPoint.dnsProvider')}</Text>
          ),
          width: '10%',
          Cell: DNSCell,
          disableSortBy: true
        },
        {
          accessor: 'host_name',
          Header: (
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>
              {getString('ce.co.accessPoint.asssociatedRules')}
            </Text>
          ),
          width: '10%',
          Cell: RulesCell
        },
        {
          accessor: 'region',
          Header: <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('regionLabel')}</Text>,
          width: '10%',
          Cell: TableCell
        },
        {
          accessor: 'vpc',
          Header: (
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('ce.co.accessPoint.vpcLabel')}</Text>
          ),
          width: '10%',
          Cell: TableCell
        },
        {
          accessor: 'status',
          Header: (
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('ce.co.accessPoint.lastActivity')}</Text>
          ),
          width: '10%',
          Cell: ActivityCell
        },
        {
          id: 'menu',
          accessor: row => row.id,
          width: '5%',
          Cell: (tableProps: CellProps<AccessPoint>) => RenderColumnMenu(tableProps, openEditAccessPointModal),
          disableSortBy: true
        }
      ]}
    />
  )
}

export default COLoadBalancerList
