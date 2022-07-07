/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useMemo, useState } from 'react'
import cx from 'classnames'
import { Link, useHistory, useParams } from 'react-router-dom'
import type { CellProps, Renderer } from 'react-table'
import ReactTimeago from 'react-timeago'
import {
  Button,
  Layout,
  Popover,
  TagsPopover,
  Text,
  useConfirmationDialog,
  useToaster,
  Dialog,
  Icon
} from '@harness/uicore'
import { Color, FontVariation, Intent } from '@harness/design-system'
import { Classes, Menu, Position } from '@blueprintjs/core'
import { defaultTo, pick } from 'lodash-es'
import type { TableProps } from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import routes from '@common/RouteDefinitions'
import type {
  ExecutionPathProps,
  ModulePathParams,
  PipelinePathProps,
  PipelineType,
  ProjectPathProps
} from '@common/interfaces/RouteInterfaces'
import useRBACError, { RBACError } from '@rbac/utils/useRBACError/useRBACError'
import { DashboardList } from '@cd/components/DashboardList/DashboardList'
import type { DashboardListProps } from '@cd/components/DashboardList/DashboardList'
import type { ChangeValue } from '@cd/components/Services/DeploymentsWidget/DeploymentsWidget'
import { useStrings } from 'framework/strings'
import { Ticker } from '@common/components/Ticker/Ticker'
import { PieChart, PieChartProps } from '@cd/components/PieChart/PieChart'
import { getFixed, INVALID_CHANGE_RATE, numberFormatter } from '@cd/components/Services/common'
import { ServiceDetailsDTO, useDeleteServiceV2 } from 'services/cd-ng'
import { DeploymentTypeIcons } from '@cd/components/DeploymentTypeIcons/DeploymentTypeIcons'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { NewEditServiceModal } from '@cd/components/PipelineSteps/DeployServiceStep/NewEditServiceModal'
import { isExecutionNotStarted } from '@pipeline/utils/statusHelpers'
import { ServiceTabs } from '../utils/ServiceUtils'
import css from '@cd/components/Services/ServicesList/ServiceList.module.scss'

export enum DeploymentStatus {
  SUCCESS = 'success',
  FAILED = 'failed'
}

export interface ServiceListItem {
  name: string
  identifier: string
  tags?: {
    [key: string]: string
  }
  deploymentTypeList: string[]
  serviceInstances: {
    count: number
    prodCount: number
    nonProdCount: number
  }
  deployments: ChangeValue
  failureRate: ChangeValue
  frequency: ChangeValue
  lastDeployment: {
    name: string
    id: string
    timestamp: number
    status: string
    serviceId: string
    executionId: string
    planExecutionId?: string
  }
}

export interface ServicesListProps {
  loading: boolean
  error: boolean
  data: ServiceDetailsDTO[]
  refetch: () => void
}

const transformServiceDetailsData = (data: ServiceDetailsDTO[]): ServiceListItem[] => {
  return data.map(item => ({
    name: defaultTo(item.serviceName, ''),
    identifier: defaultTo(item.serviceIdentifier, ''),
    description: defaultTo(item.description, ''),
    tags: defaultTo(item.tags, {}),
    deploymentTypeList: defaultTo(item.deploymentTypeList, []),
    serviceInstances: {
      count: defaultTo(item.instanceCountDetails?.totalInstances, 0),
      prodCount: defaultTo(item.instanceCountDetails?.prodInstances, 0),
      nonProdCount: defaultTo(item.instanceCountDetails?.nonProdInstances, 0)
    },
    deployments: {
      value: numberFormatter(item.totalDeployments),
      change: defaultTo(item.totalDeploymentChangeRate, 0)
    },
    failureRate: {
      value: numberFormatter(item.failureRate),
      change: defaultTo(item.failureRateChangeRate, 0)
    },
    frequency: {
      value: numberFormatter(item.frequency),
      change: defaultTo(item.frequencyChangeRate, 0)
    },
    lastDeployment: {
      name: defaultTo(item.lastPipelineExecuted?.name, ''),
      id: defaultTo(item.lastPipelineExecuted?.pipelineExecutionId, ''),
      timestamp: defaultTo(item.lastPipelineExecuted?.lastExecutedAt, 0),
      status: defaultTo(item.lastPipelineExecuted?.status, ''),
      executionId: defaultTo(item.lastPipelineExecuted?.identifier, ''),
      serviceId: defaultTo(item.serviceIdentifier, ''),
      planExecutionId: defaultTo(item.lastPipelineExecuted?.planExecutionId, '')
    }
  }))
}

const RenderServiceName: Renderer<CellProps<ServiceListItem>> = ({ row }) => {
  const { name, identifier, tags } = row.original
  const { getString } = useStrings()
  const idLabel = getString('idLabel', { id: identifier })
  return (
    <Layout.Vertical>
      <Layout.Horizontal spacing="small">
        <Text font={{ weight: 'semi-bold' }} color={Color.GREY_700} margin={{ bottom: 'xsmall' }} lineClamp={1}>
          {name}
        </Text>
        {tags && Object.keys(tags).length ? <TagsPopover tags={tags} /> : null}
      </Layout.Horizontal>

      <Text font={{ size: 'small' }} color={Color.GREY_500} lineClamp={1}>
        {idLabel}
      </Text>
    </Layout.Vertical>
  )
}

const RenderType: Renderer<CellProps<ServiceListItem>> = ({ row }) => {
  const { deploymentTypeList } = row.original
  return <DeploymentTypeIcons deploymentTypes={deploymentTypeList} />
}

const TickerCard: React.FC<{ item: ChangeValue & { name: string } }> = props => {
  const { item } = props
  const value = Number(item.value)
  const isBoostMode = item.change === INVALID_CHANGE_RATE
  const color = (() => {
    if (item.name !== 'failureRate') {
      return !isBoostMode && item.change < 0 ? Color.RED_500 : Color.GREEN_500
    } else {
      return isBoostMode || item.change < 0 ? Color.GREEN_500 : Color.RED_500
    }
  })()
  return (
    <Layout.Vertical padding={'small'} key={item.name} width={'fit-content'} className={css.tickerContainer}>
      <Ticker
        value={
          isBoostMode ? (
            <></>
          ) : (
            <Text color={color} font={{ size: 'small' }}>{`${Math.abs(getFixed(item.change))}%`}</Text>
          )
        }
        decreaseMode={!isBoostMode && item.change < 0}
        boost={isBoostMode}
        color={color}
        tickerContainerStyles={css.tickerContainerStyles}
        size={isBoostMode ? 10 : 6}
      >
        <Text color={Color.BLACK} font={{ weight: 'semi-bold', size: 'medium' }} margin={{ right: 'xsmall' }}>
          {isNaN(value) ? item.value : numberFormatter(value)}
        </Text>
      </Ticker>
    </Layout.Vertical>
  )
}

const getRenderTickerCard: (tickerCardKey: keyof ServiceListItem) => Renderer<CellProps<ServiceListItem>> =
  tickerCardKey =>
  ({ row }) => {
    const value = row.original[tickerCardKey] as ChangeValue
    return <TickerCard item={{ ...value, name: tickerCardKey }} />
  }

const RenderServiceInstances: Renderer<CellProps<ServiceListItem>> = ({ row }) => {
  const { serviceInstances } = row.original
  const { getString } = useStrings()
  const pieChartProps: PieChartProps = {
    items: [
      {
        label: getString('cd.serviceDashboard.nonProd'),
        value: serviceInstances.nonProdCount,
        formattedValue: numberFormatter(serviceInstances.nonProdCount),
        color: 'var(--primary-2)'
      },
      {
        label: getString('cd.serviceDashboard.prod'),
        value: serviceInstances.prodCount,
        formattedValue: numberFormatter(serviceInstances.prodCount),
        color: 'var(--primary-7)'
      }
    ],
    size: 24,
    labelContainerStyles: css.pieChartLabelContainerStyles,
    labelStyles: css.pieChartLabelStyles,
    options: {
      tooltip: {
        enabled: false
      }
    }
  }
  return (
    <Layout.Horizontal flex={{ align: 'center-center', justifyContent: 'flex-start' }}>
      <Text
        color={Color.BLACK}
        font={{ weight: 'semi-bold', size: 'medium' }}
        margin={{ right: 'xsmall' }}
        padding={{ left: 'medium', top: 'medium', right: 'medium', bottom: 'medium' }}
        className={css.tickerContainer}
      >
        {serviceInstances.count}
      </Text>
      {serviceInstances.count ? <PieChart {...pieChartProps} /> : <></>}
    </Layout.Horizontal>
  )
}

const RenderLastDeployment: Renderer<CellProps<ServiceListItem>> = ({ row }) => {
  const {
    lastDeployment: { id, name, timestamp, executionId, planExecutionId, status }
  } = row.original
  const { getString } = useStrings()
  const { showError } = useToaster()

  const { orgIdentifier, projectIdentifier, accountId, module, pipelineIdentifier } =
    useParams<PipelineType<PipelinePathProps>>()
  const source: ExecutionPathProps['source'] = pipelineIdentifier ? 'executions' : 'deployments'

  const disabled = isExecutionNotStarted(status)

  function handleClick(): void {
    if (!disabled && id && planExecutionId) {
      const route = routes.toExecutionPipelineView({
        orgIdentifier,
        pipelineIdentifier: executionId,
        executionIdentifier: planExecutionId,
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
  const [statusBackgroundColor, statusText] =
    status?.toLocaleLowerCase() === DeploymentStatus.SUCCESS
      ? [Color.GREEN_600, getString('success')]
      : status?.toLocaleLowerCase() === DeploymentStatus.FAILED
      ? [Color.RED_600, getString('failed')]
      : [Color.YELLOW_600, status]

  if (!id) {
    return <></>
  }
  return (
    <Layout.Horizontal className={css.lastDeployment}>
      <Layout.Vertical margin={{ right: 'large' }} flex={{ alignItems: 'flex-start' }}>
        <Layout.Horizontal
          margin={{ bottom: 'xsmall' }}
          flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
          width="100%"
        >
          <Text
            data-testid={id}
            font={{ variation: FontVariation.BODY2 }}
            color={Color.PRIMARY_7}
            margin={{ right: 'xsmall' }}
            className={css.lastDeploymentText}
            lineClamp={1}
            onClick={e => {
              e.stopPropagation()
              handleClick()
            }}
          >
            {name}
          </Text>
        </Layout.Horizontal>
        {timestamp && (
          <ReactTimeago
            date={timestamp}
            component={val => (
              <Text font={{ size: 'small' }} color={Color.GREY_500}>
                {' '}
                {val.children}{' '}
              </Text>
            )}
          />
        )}
      </Layout.Vertical>
      <Layout.Horizontal flex={{ justifyContent: 'flex-start' }}>
        <Text
          background={statusBackgroundColor}
          color={Color.WHITE}
          font={{ weight: 'semi-bold', size: 'xsmall' }}
          className={css.statusText}
        >
          {statusText?.toLocaleUpperCase()}
        </Text>
      </Layout.Horizontal>
    </Layout.Horizontal>
  )
}

const RenderColumnMenu: Renderer<CellProps<any>> = ({ row, column }) => {
  const data = row.original
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const { accountId, orgIdentifier, projectIdentifier, module } = useParams<ProjectPathProps & ModulePathParams>()
  const { showSuccess, showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const { getString } = useStrings()
  const history = useHistory()
  const isSvcEnvEntityEnabled = useFeatureFlag(FeatureFlag.NG_SVC_ENV_REDESIGN)

  const { mutate: deleteService } = useDeleteServiceV2({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier: orgIdentifier,
      projectIdentifier: projectIdentifier
    }
  })

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={hideModal}
        title={getString('editService')}
        isCloseButtonShown
        className={cx('padded-dialog')}
      >
        <NewEditServiceModal
          data={{ ...pick(data, ['name', 'identifier', 'description', 'tags']) } || { name: '', identifier: '' }}
          isEdit={true}
          isService={false}
          onCreateOrUpdate={() => {
            ;(column as any).reload?.()
            hideModal()
          }}
          closeModal={hideModal}
        />
      </Dialog>
    ),
    [data, orgIdentifier, projectIdentifier]
  )

  const { openDialog: openDeleteErrorDialog } = useConfirmationDialog({
    titleText: getString('common.deleteServiceFailure'),
    contentText: deleteError,
    cancelButtonText: getString('close'),
    confirmButtonText: getString('common.viewReferences'),
    intent: Intent.DANGER,
    onCloseDialog: async isConfirmed => {
      setDeleteError('')
      if (isConfirmed) {
        history.push({
          pathname: routes.toServiceStudio({
            accountId,
            orgIdentifier,
            projectIdentifier,
            serviceId: data.identifier,
            module
          }),
          search: `tab=${ServiceTabs.REFERENCED_BY}`
        })
      }
    }
  })

  const { openDialog } = useConfirmationDialog({
    titleText: getString('common.deleteService'),
    contentText: getString('common.deleteServiceConfirmation', { name: data.name }),
    cancelButtonText: getString('cancel'),
    confirmButtonText: getString('confirm'),
    intent: Intent.DANGER,
    onCloseDialog: async isConfirmed => {
      if (isConfirmed) {
        try {
          const response = await deleteService(data.identifier, {
            headers: { 'content-type': 'application/json' }
          })
          if (response.status === 'SUCCESS') {
            showSuccess(getString('common.deleteServiceMessage'))
            ;(column as any).reload?.()
          }
        } catch (err) {
          if (err?.data?.code === 'ENTITY_REFERENCE_EXCEPTION') {
            // showing reference by error in modal
            setDeleteError(err?.data?.message || err?.message)
            openDeleteErrorDialog()
          } else {
            showError(getRBACErrorMessage(err as RBACError))
          }
        }
      }
    }
  })

  const handleEdit = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    e.stopPropagation()
    setMenuOpen(false)
    if (isSvcEnvEntityEnabled) {
      history.push({
        pathname: routes.toServiceStudio({
          accountId,
          orgIdentifier,
          projectIdentifier,
          serviceId: data.identifier,
          module
        }),
        search: `tab=${ServiceTabs.Configuration}`
      })
    } else {
      showModal()
    }
  }

  const handleDelete = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    e.stopPropagation()
    setMenuOpen(false)
    openDialog()
  }

  const openInNewTab = routes.toServiceStudio({
    accountId,
    orgIdentifier,
    projectIdentifier,
    serviceId: data.identifier,
    module
  })

  return (
    <Layout.Horizontal>
      <Popover
        isOpen={menuOpen}
        onInteraction={nextOpenState => {
          setMenuOpen(nextOpenState)
        }}
        className={Classes.DARK}
        position={Position.RIGHT_TOP}
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
          <Link
            className={cx('bp3-menu-item', css.openNewTabStyle)}
            target="_blank"
            to={openInNewTab}
            onClick={e => e.stopPropagation()}
          >
            <Icon name="launch" style={{ marginRight: '5px' }} />
            {getString('pipeline.openInNewTab')}
          </Link>
          <RbacMenuItem
            icon="edit"
            text={getString('edit')}
            onClick={handleEdit}
            permission={{
              resource: {
                resourceType: ResourceType.SERVICE,
                resourceIdentifier: defaultTo(data.identifier, '')
              },
              permission: PermissionIdentifier.EDIT_SERVICE
            }}
          />
          <RbacMenuItem
            icon="trash"
            text={getString('delete')}
            onClick={handleDelete}
            permission={{
              resource: {
                resourceType: ResourceType.SERVICE,
                resourceIdentifier: defaultTo(data.identifier, '')
              },
              permission: PermissionIdentifier.DELETE_SERVICE
            }}
          />
        </Menu>
      </Popover>
    </Layout.Horizontal>
  )
}

export const ServicesList: React.FC<ServicesListProps> = props => {
  const { loading, data, error, refetch } = props
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier, module } = useParams<ProjectPathProps & ModulePathParams>()
  const history = useHistory()

  const ServiceListHeaderCustomPrimary = useMemo(
    () => (headerProps: { total?: number }) =>
      (
        <Text font={{ size: 'medium', weight: 'semi-bold' }} color={Color.GREY_700}>
          {getString('cd.serviceDashboard.totalServices', {
            total: headerProps.total || 0
          })}
        </Text>
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  )
  const columns: TableProps<ServiceListItem>['columns'] = useMemo(
    () => {
      return [
        {
          Header: getString('service').toLocaleUpperCase(),
          id: 'service',
          width: '20%',
          Cell: RenderServiceName
        },
        {
          Header: getString('typeLabel').toLocaleUpperCase(),
          id: 'type',
          width: '10%',
          Cell: RenderType
        },
        {
          Header: getString('cd.serviceDashboard.activeInstanceCount').toLocaleUpperCase(),
          id: 'serviceInstances',
          width: '15%',
          Cell: RenderServiceInstances
        },
        {
          Header: getString('deploymentsText').toLocaleUpperCase(),
          id: 'deployments',
          width: '10%',
          Cell: getRenderTickerCard('deployments')
        },
        {
          Header: getString('common.failureRate').toLocaleUpperCase(),
          id: 'failureRate',
          width: '10%',
          Cell: getRenderTickerCard('failureRate')
        },
        {
          Header: getString('cd.serviceDashboard.frequency').toLocaleUpperCase(),
          id: 'frequency',
          width: '13%',
          Cell: getRenderTickerCard('frequency')
        },
        {
          Header: getString('cd.serviceDashboard.lastPipelineExecution').toLocaleUpperCase(),
          id: 'lastDeployment',
          width: '18%',
          Cell: RenderLastDeployment
        },
        {
          Header: '',
          width: '4%',
          id: 'action',
          Cell: RenderColumnMenu,
          reload: refetch,
          disableSortBy: true
        }
      ]
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const goToServiceDetails = useCallback(
    ({ identifier: serviceId }: ServiceListItem): void => {
      history.push(routes.toServiceStudio({ accountId, orgIdentifier, projectIdentifier, serviceId, module }))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountId, orgIdentifier, projectIdentifier, module]
  )

  const dashboardListProps: DashboardListProps<ServiceListItem> = {
    columns,
    loading,
    error,
    data: transformServiceDetailsData(data),
    refetch,
    HeaderCustomPrimary: ServiceListHeaderCustomPrimary,
    onRowClick: goToServiceDetails
  }
  return <DashboardList<ServiceListItem> {...dashboardListProps} />
}
