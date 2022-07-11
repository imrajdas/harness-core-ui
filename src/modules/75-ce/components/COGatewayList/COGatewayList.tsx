/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CellProps, Column } from 'react-table'
import cx from 'classnames'
import copy from 'copy-to-clipboard'
import {
  Text,
  Layout,
  Container,
  Button,
  Icon,
  Link,
  Popover,
  HarnessDocTooltip,
  Heading,
  PageSpinner,
  Page,
  TableV2,
  ExpandingSearchInput,
  PageHeader,
  PillToggle
} from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { isEmpty as _isEmpty, defaultTo as _defaultTo, get, capitalize } from 'lodash-es'
import { useHistory, useParams } from 'react-router-dom'
import { Classes, Drawer, IconName, Menu, Position } from '@blueprintjs/core'
import routes from '@common/RouteDefinitions'
import { StringUtils, useToaster } from '@common/exports'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import {
  Service,
  ServiceSavings,
  useAllServiceResources,
  useHealthOfService,
  useRequestsOfService,
  useSavingsOfService,
  useGetServiceDiagnostics,
  ServiceError,
  useDescribeServiceInContainerServiceCluster,
  useRouteDetails,
  useFetchRules,
  FetchRulesResponseRecords,
  FetchRulesBody,
  FilterDTO
} from 'services/lw'
import { String, useStrings } from 'framework/strings'
import type { StringsMap } from 'stringTypes'
import useDeleteServiceHook from '@ce/common/useDeleteService'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { useAllQueryParamsState } from '@ce/common/hooks/useAllQueryParamsState'
import { USER_JOURNEY_EVENTS } from '@ce/TrackingEventsConstants'
import { useFeature } from '@common/hooks/useFeatures'
import RbacButton from '@rbac/components/Button/Button'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import type { FeatureDetail } from 'framework/featureStore/featureStoreUtil'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { allProviders, ceConnectorTypes, ruleServiceStatusLabelMap, RulesMode } from '@ce/constants'
import { Utils } from '@ce/common/Utils'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { useDeepCompareEffect, useQueryParams } from '@common/hooks'
import type { orderType, serverSortProps, sortType } from '@common/components/Table/react-table-config'
import { UNSAVED_FILTER } from '@common/components/Filter/utils/FilterUtils'
import { useGetConnector } from 'services/cd-ng'
import COGatewayAnalytics from './COGatewayAnalytics'
import COGatewayCumulativeAnalytics from './COGatewayCumulativeAnalytics'
// import ComputeType from './components/ComputeType'
import {
  getRelativeTime,
  getFilterBodyFromFilterData,
  getRuleType,
  getManagedResourcesStringId,
  isK8sWorkloadRule
} from './Utils'
import useToggleRuleState from './useToggleRuleState'
import TextWithToolTip, { textWithToolTipStatus } from '../TextWithTooltip/TextWithToolTip'
import GatewayListFilters from './GatewayListFilters'
import RuleSavingsPieChart from './charts/RuleSavingsPieChart'
import landingPageSVG from './images/AutostoppingRuleIllustration.svg'
import refreshIcon from './images/refresh.svg'
import NoDataImage from './images/NoData.svg'
import css from './COGatewayList.module.scss'

const textColor: { [key: string]: string } = {
  disable: '#6B6D85'
}

interface TableRowMenuProps {
  onStateToggle: (type: 'SUCCESS' | 'FAILURE', data: Service, index?: number) => void
  onDelete: (type: 'SUCCESS' | 'FAILURE', data: Service) => void
  onEdit: (data: Service) => void
}

interface SearchParams {
  isActive: boolean
  text: string
}

interface EmptyListPageProps {
  featureDetail?: FeatureDetail
}

interface RulesListQueryParams {
  mode?: RulesMode
  search?: string
  page?: number
  sort?: SortByObjInterface
}

interface GetRulesReturnDetails {
  response?: FetchRulesResponseRecords
  error?: any
}

interface PaginationResponseProps {
  totalPages: number
  totalRecords: number
}

interface PaginationProps extends PaginationResponseProps {
  pageIndex: number
}

interface SortByObjInterface {
  field?: sortType
  type?: orderType
}

// function IconCell(tableProps: CellProps<Service>): JSX.Element {
//   return <ComputeType data={tableProps.row.original} />
// }
function TimeCell(tableProps: CellProps<Service>): JSX.Element {
  const { getString } = useStrings()
  const isEcsRule = !_isEmpty(tableProps.row.original.routing?.container_svc)
  const isRdsRule = !_isEmpty(tableProps.row.original.routing?.database)
  const fulfilmentString: Record<string, string> = {
    ondemand: getString('ce.nodeRecommendation.onDemand'),
    spot: getString('ce.nodeRecommendation.spot')
  }

  const getDisplayValue = () => {
    return isRdsRule
      ? getString('ce.common.database')
      : isEcsRule
      ? getString('ce.common.containerService')
      : _defaultTo(
          fulfilmentString[tableProps.row.original.fulfilment as string],
          capitalize(tableProps.row.original.fulfilment)
        )
  }

  return (
    <Layout.Vertical spacing={'small'}>
      <Text lineClamp={3} color={Color.GREY_1000}>
        {getString('ce.co.ruleDetailsHeader.idleTime')}
        {' : '}
        {`${tableProps.value} ${getString('timeMinutes')}`}
      </Text>
      <Text>{getDisplayValue()}</Text>
    </Layout.Vertical>
  )
}
function NameCell(tableProps: CellProps<Service>): JSX.Element {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  const isK8sRule = tableProps.row.original.kind === 'k8s'

  const { data: connectorData } = useGetConnector({
    identifier: tableProps.row.original.cloud_account_id,
    queryParams: { accountIdentifier: accountId },
    lazy: isK8sRule
  })

  const cloudProviderType =
    connectorData?.data?.connector?.type && ceConnectorTypes[connectorData?.data?.connector?.type]
  const provider = useMemo(() => allProviders.find(item => item.value === cloudProviderType), [cloudProviderType])
  const iconName = isK8sRule ? 'app-kubernetes' : _defaultTo(provider?.icon, 'spinner')
  const ruleTypeStringKey = getRuleType(tableProps.row.original, provider) as keyof StringsMap

  return (
    <Layout.Horizontal spacing={'small'} flex={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}>
      <div>
        <Icon name={iconName as IconName} size={24} />
      </div>
      <Layout.Vertical spacing={'small'}>
        <Layout.Horizontal spacing={'small'}>
          <Text
            lineClamp={1}
            font={{ variation: FontVariation.FORM_SUB_SECTION }}
            color={Color.GREY_1000}
            style={{ maxWidth: 160 }}
          >
            {tableProps.value}
          </Text>
          <RuleStatus rule={tableProps.row.original} />
        </Layout.Horizontal>
        <Text lineClamp={1}>{ruleTypeStringKey ? getString(ruleTypeStringKey) : ''}</Text>
      </Layout.Vertical>
    </Layout.Horizontal>
  )
}

function SavingsCell(tableProps: CellProps<Service>): JSX.Element {
  const { accountId } = useParams<AccountPathProps>()
  const { data, loading: savingsLoading } = useSavingsOfService({
    account_id: accountId,
    rule_id: tableProps.row.original.id as number,
    queryParams: {
      accountIdentifier: accountId
    }
  })
  return (
    <Layout.Horizontal spacing="large">
      <RuleSavingsPieChart
        savings={get(data, 'response.savings_percentage', 0)}
        disable={tableProps.row.original.disabled}
      />
      <Text className={css.savingsAmount}>
        {savingsLoading ? (
          <Icon name="spinner" size={12} color="blue500" />
        ) : !_isEmpty(data?.response) ? (
          `$${Math.round(((data?.response as ServiceSavings).actual_savings as number) * 100) / 100}`
        ) : (
          0
        )}
      </Text>
    </Layout.Horizontal>
  )
}

function ActivityCell(tableProps: CellProps<Service>): JSX.Element {
  const { accountId } = useParams<AccountPathProps>()
  const { data, loading: activityLoading } = useRequestsOfService({
    account_id: accountId,
    rule_id: tableProps.row.original.id as number,
    queryParams: {
      accountIdentifier: accountId
    }
  })
  return (
    <>
      {activityLoading ? (
        <Icon name="spinner" size={12} color="blue500" />
      ) : !_isEmpty(data?.response) ? (
        <Layout.Horizontal spacing="medium">
          <Icon name="history" />
          <Text lineClamp={3} color={tableProps.row.original.disabled ? textColor.disable : Color.GREY_500}>
            {getRelativeTime(data?.response?.[0].created_at as string, 'YYYY-MM-DDTHH:mm:ssZ')}
          </Text>
        </Layout.Horizontal>
      ) : (
        '-'
      )}
    </>
  )
}

const ResourcesManagedCell = (tableProps: CellProps<Service>) => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const { showError, showSuccess } = useToaster()
  const isK8sRule = tableProps.row.original.kind === 'k8s'
  const isEcsRule = !_isEmpty(tableProps.row.original.routing?.container_svc)
  const isSubmittedRule = tableProps.row.original.status === 'submitted'
  const hasCustomDomains = (tableProps.row.original.custom_domains?.length as number) > 0
  const k8sJson = useMemo(() => {
    return isK8sRule ? JSON.parse(get(tableProps.row.original, 'routing.k8s.RuleJson', '{}')) : null
  }, [isK8sRule, tableProps.row.original])
  const intervalId = useRef<number | undefined>()

  const { data: connectorData, loading: loadingConnectorData } = useGetConnector({
    identifier: tableProps.row.original.cloud_account_id,
    queryParams: { accountIdentifier: accountId },
    lazy: isK8sRule
  })

  const { data: resources, loading: resourcesLoading } = useAllServiceResources({
    account_id: accountId,
    rule_id: tableProps.row.original.id as number, // eslint-disable-line
    lazy: isK8sRule
  })

  const {
    data: healthState,
    loading: healthLoading,
    refetch: refetchHealthState
  } = useHealthOfService({
    account_id: accountId,
    rule_id: tableProps.row.original.id as number,
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { data: serviceDescribeData, loading: describeServiceLoading } = useDescribeServiceInContainerServiceCluster({
    account_id: accountId,
    cluster_name: _defaultTo(get(tableProps.row.original, 'routing.container_svc.cluster', ''), ''),
    service_name: _defaultTo(get(tableProps.row.original, 'routing.container_svc.service', ''), ''),
    lazy: !isEcsRule,
    queryParams: {
      accountIdentifier: accountId,
      cloud_account_id: tableProps.row.original.cloud_account_id,
      region: _defaultTo(get(tableProps.row.original, 'routing.container_svc.region', ''), '')
    }
  })

  const getClickableLink = useCallback(
    (withoutProtocol = false) => {
      const hasHttpsConfig = !_isEmpty(
        tableProps.row.original.routing?.ports?.find(portConfig => portConfig.protocol?.toLowerCase() === 'https')
      )
      const protocol = Utils.getConditionalResult(hasHttpsConfig, 'https', 'http')
      const link = isK8sRule
        ? tableProps.row.original.routing?.k8s?.CustomDomain
        : hasCustomDomains
        ? tableProps.row.original.custom_domains?.[0]
        : tableProps.row.original.host_name
      return withoutProtocol ? link : `${protocol}://${link}`
    },
    [tableProps.row.original]
  )

  const handleDomainClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation()
    if (isSubmittedRule) return
    const link = getClickableLink()
    window.open(link, '_blank')
  }

  const copyToClipboard = (event: React.MouseEvent<Element>) => {
    event.stopPropagation()
    event.preventDefault()
    if (!tableProps.row.original.disabled) {
      const linkText = getClickableLink()
      linkText && copy(linkText)
        ? showSuccess(getString('clipboardCopySuccess'))
        : showError(getString('clipboardCopyFail'))
    }
  }

  const renderLink = (linkStr = '', accessPointId?: string) => {
    if (!linkStr) {
      return null
    }
    return (
      <Layout.Horizontal spacing="small">
        <Text>
          {getString('UrlLabel')}
          {':'}
        </Text>
        <Text
          lineClamp={1}
          className={cx(css.link, {
            [css.disabled]: tableProps.row.original.disabled,
            [css.notAllowed]: isSubmittedRule
          })}
          onClick={accessPointId && !tableProps.row.original.disabled ? handleDomainClick : undefined}
        >
          {linkStr}
        </Text>
        <div>
          <Button
            minimal
            className={css.copyIcon}
            icon="copy-alt"
            iconProps={{ size: 14 }}
            intent={'primary'}
            small
            onClick={copyToClipboard}
            tooltip={
              tableProps.row.original.disabled ? undefined : (
                <String className={css.copyTooltip} stringID={'clickToCopy'} />
              )
            }
          />
        </div>
      </Layout.Horizontal>
    )
  }

  const cloudProviderType =
    connectorData?.data?.connector?.type && ceConnectorTypes[connectorData?.data?.connector?.type]
  const provider = useMemo(() => allProviders.find(item => item.value === cloudProviderType), [cloudProviderType])
  const descriptionStringId = useMemo(
    () => getManagedResourcesStringId(tableProps.row.original, provider),
    [tableProps.row.original, provider]
  )
  const loading = loadingConnectorData || resourcesLoading || healthLoading || describeServiceLoading
  const serviceState = ruleServiceStatusLabelMap.get(get(healthState, 'response.state', ''))

  useEffect(() => {
    if (serviceState?.intent === 'load') {
      if (!intervalId.current) {
        intervalId.current = window.setInterval(() => refetchHealthState(), 5000)
      }
    } else if (intervalId.current) {
      window.clearInterval(intervalId.current)
    }
    return () => window.clearInterval(intervalId.current)
  }, [serviceState?.intent])

  if (!isK8sRule && loading) {
    return (
      <Layout.Horizontal>
        <Icon name="spinner" color={Color.BLUE_500} />
      </Layout.Horizontal>
    )
  }

  const getK8sWorkloadOrServiceName = () => {
    return isK8sWorkloadRule(k8sJson) ? get(k8sJson, 'spec.workloadName', '') : get(k8sJson, 'spec.service.name', '')
  }

  return (
    <Layout.Vertical spacing={'small'} className={css.resourceCell}>
      <Layout.Horizontal spacing={'small'}>
        {descriptionStringId ? (
          <>
            <Text inline>{getString(descriptionStringId as keyof StringsMap)}</Text>
            <Text inline>{': '}</Text>
            <Text inline lineClamp={2}>
              {isEcsRule
                ? get(serviceDescribeData, 'response.task_count', 0)
                : isK8sRule
                ? getK8sWorkloadOrServiceName()
                : _defaultTo(get(resources, 'response'), []).length}
            </Text>
          </>
        ) : null}
        {serviceState && !tableProps.row.original.disabled && (
          <Text
            font={{ variation: FontVariation.UPPERCASED }}
            icon={serviceState.icon}
            iconProps={{ size: 14 }}
            className={cx(css.stateLabel, {
              [css.runningLabel]: serviceState.intent === 'running',
              [css.stoppedLabel]: serviceState.intent === 'stopped',
              [css.loadingLabel]: serviceState.intent === 'load'
            })}
          >
            {getString(serviceState.labelStringId)}
          </Text>
        )}
        {tableProps.row.original.disabled && (
          <Text
            className={cx(css.stateLabel, css.disabledLabel)}
            font={{ variation: FontVariation.UPPERCASED }}
            icon="deployment-aborted-legacy"
          >
            {getString('ce.common.disabled')}
          </Text>
        )}
      </Layout.Horizontal>
      {renderLink(getClickableLink(true), tableProps.row.original.access_point_id)}
    </Layout.Vertical>
  )
}

function RenderColumnMenu(
  tableProps: CellProps<Service>,
  { onEdit, onDelete, onStateToggle }: TableRowMenuProps
): JSX.Element {
  const { accountId } = useParams<AccountPathProps>()
  const row = tableProps.row
  const data = row.original.id
  const [menuOpen, setMenuOpen] = useState(false)
  const { triggerToggle } = useToggleRuleState({
    accountId,
    serviceData: row.original,
    onSuccess: (updatedServiceData: Service) => onStateToggle('SUCCESS', updatedServiceData, row.index),
    onFailure: err => onStateToggle('FAILURE', err)
  })
  const { triggerDelete } = useDeleteServiceHook({
    serviceData: row.original,
    accountId,
    onSuccess: (_data: Service) => onDelete('SUCCESS', _data),
    onFailure: err => onDelete('FAILURE', err)
  })

  const handleToggleRuleClick = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation()
    triggerToggle()
  }

  const handleDeleteRuleClick = async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation()
    triggerDelete()
  }

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
          iconProps={{ color: Color.PRIMARY_5 }}
          onClick={e => {
            e.stopPropagation()
            setMenuOpen(true)
          }}
          data-testid={`menu-${data}`}
        />
        <Menu style={{ minWidth: 'unset' }}>
          {row.original.disabled ? (
            <Menu.Item icon="play" text="Enable" onClick={handleToggleRuleClick} />
          ) : (
            <Menu.Item icon="disable" text="Disable" onClick={handleToggleRuleClick} />
          )}
          {row.original.status !== 'submitted' && (
            <Menu.Item icon="edit" text="Edit" onClick={() => onEdit(row.original)} />
          )}
          <Menu.Item icon="trash" text="Delete" onClick={handleDeleteRuleClick} />
        </Menu>
      </Popover>
    </Layout.Horizontal>
  )
}

const RuleStatus = ({ rule }: { rule: Service }) => {
  const { accountId } = useParams<AccountPathProps>()
  const { data, loading } = useGetServiceDiagnostics({
    account_id: accountId, // eslint-disable-line
    rule_id: rule.id as number, // eslint-disable-line
    queryParams: {
      accountIdentifier: accountId
    }
  })
  const diagnosticsErrors = (data?.response || [])
    .filter(item => !item.success)
    .map(item => ({ action: item.name, error: item.message }))
  const hasError: boolean = !_isEmpty(rule.metadata?.service_errors) || !_isEmpty(diagnosticsErrors)
  const combinedErrors: ServiceError[] = (rule.metadata?.service_errors || []).concat(diagnosticsErrors)
  const showError = rule.status === 'errored' || hasError
  return !loading ? (
    <TextWithToolTip
      icon={rule.status === 'submitted' ? 'time' : showError ? 'warning-sign' : 'tick-circle'}
      iconSize={14}
      errors={hasError ? combinedErrors : []}
      status={showError ? textWithToolTipStatus.ERROR : textWithToolTipStatus.SUCCESS}
      indicatorColor={rule.status === 'submitted' ? Color.ORANGE_900 : showError ? Color.RED_700 : Color.GREEN_700}
    />
  ) : null
}

const EmptyListPage: React.FC<EmptyListPageProps> = () => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const history = useHistory()
  const { trackEvent } = useTelemetry()
  return (
    <Container background={Color.WHITE} height="100vh">
      <NGBreadcrumbs
        links={[
          {
            url: routes.toCECORules({ accountId, params: '' }),
            label: getString('ce.co.breadCrumb.rules')
          }
        ]}
      />
      <Layout.Vertical
        spacing="large"
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '220px'
        }}
      >
        <img src={landingPageSVG} alt="autostopping-rules" width="500px"></img>
        <Text font="normal" style={{ lineHeight: '24px', textAlign: 'center', width: '760px', marginTop: '20px' }}>
          <String stringID="ce.co.landingPageText" useRichText={true} /> <Link href="/">Learn more</Link>
        </Text>
        <RbacButton
          intent="primary"
          text={getString('ce.co.newAutoStoppingRule')}
          icon="plus"
          featuresProps={{
            featuresRequest: {
              featureNames: [FeatureIdentifier.RESTRICTED_AUTOSTOPPING_RULE_CREATION]
            }
          }}
          onClick={() => {
            history.push(
              routes.toCECOCreateGateway({
                accountId
              })
            )
            trackEvent(USER_JOURNEY_EVENTS.CREATE_NEW_AS_CLICK, {})
          }}
        />
      </Layout.Vertical>
    </Container>
  )
}

const TOTAL_ITEMS_PER_PAGE = 5

interface RulesTableContainerProps {
  rules: Service[]
  setRules: (services: Service[]) => void
  loading: boolean
  rowMenuProps: TableRowMenuProps
  pageProps: PaginationProps
  setPageProps: (pagination: PaginationProps) => void
  onRowClick: (data: Service, index: number) => void
  refetchRules: () => Promise<void>
  onSearchCallback?: (value: string) => void
  searchParams: SearchParams
  mode: RulesMode
  sortObj: SortByObjInterface
  handleSort: (sort: SortByObjInterface) => void
  isSorting: boolean
}

const POLL_TIMER = 1000 * 60 * 1

const useSubmittedRulesStatusUpdate = ({
  rules,
  onRuleUpdate
}: {
  rules: Service[]
  onRuleUpdate?: (params: { updatedService: Service; index: number }) => void
}) => {
  const { accountId } = useParams<AccountPathProps>()
  const { data, refetch, loading } = useRouteDetails({ account_id: accountId, rule_id: 0, lazy: true })
  const rulesToFetch = useRef<{ index: number; rule: Service }[]>([])
  const timer = useRef<NodeJS.Timer | null>(null)

  const clearTimer = () => {
    clearTimeout(timer.current as NodeJS.Timer)
    timer.current = null
  }

  useEffect(() => {
    rulesToFetch.current = []
    clearTimer()
    rules.forEach((r, i) => {
      if (r.status === 'submitted') {
        rulesToFetch.current.push({ index: i, rule: r })
      }
    })
  }, [rules])

  const triggerRuleFetching = () => {
    timer.current = setTimeout(() => {
      refetch({ pathParams: { account_id: accountId, rule_id: rulesToFetch.current[0].rule.id } })
      clearTimer()
    }, POLL_TIMER)
  }

  useEffect(() => {
    if (!_isEmpty(rulesToFetch.current) && !loading && timer.current === null) {
      triggerRuleFetching()
    }
  }, [rulesToFetch.current, timer.current])

  useEffect(() => {
    if (!_isEmpty(data?.response) && data?.response?.service?.status !== 'submitted') {
      onRuleUpdate?.({ updatedService: data?.response?.service as Service, index: rulesToFetch.current[0].index })
      rulesToFetch.current.shift()
      clearTimer()
    }
    if (timer.current) {
      return () => clearTimeout(timer.current as NodeJS.Timer)
    }
  }, [data?.response])
}

const getServerSortProps = ({
  enableServerSort,
  accessor,
  sortByObj,
  setSortByObj
}: {
  enableServerSort: boolean
  accessor: string
  sortByObj: SortByObjInterface
  setSortByObj: (sort: SortByObjInterface) => void
  refetch?: () => void
}): serverSortProps => {
  if (!enableServerSort) {
    return { enableServerSort: false }
  } else {
    let newOrder: orderType | undefined
    const sortName = accessor

    return {
      enableServerSort: true,
      isServerSorted: sortByObj.field === accessor,
      isServerSortedDesc: sortByObj.type === 'DESC',
      getSortedColumn: _sortData => {
        if (sortName === sortByObj.field && sortByObj.type) {
          newOrder = sortByObj.type === 'DESC' ? 'ASC' : 'DESC'
        } else {
          // no saved state for sortBy of the same sort type
          newOrder = 'ASC'
        }
        setSortByObj({ field: sortName, type: newOrder })
      }
    }
  }
}

const RulesTableContainer: React.FC<RulesTableContainerProps> = ({
  rules,
  setRules,
  loading,
  rowMenuProps: { onDelete, onEdit, onStateToggle },
  pageProps,
  onRowClick,
  refetchRules,
  searchParams,
  mode,
  setPageProps,
  sortObj,
  handleSort,
  isSorting
}) => {
  const { getString } = useStrings()

  useSubmittedRulesStatusUpdate({
    rules,
    onRuleUpdate: ({ updatedService, index }) => {
      const updatedRules = [...rules]
      const updatedIndex = (pageProps.pageIndex - 1) * TOTAL_ITEMS_PER_PAGE + index
      updatedRules.splice(updatedIndex, 1, updatedService)
      setRules(updatedRules)
    }
  })

  const handleRefreshClick = () => {
    refetchRules()
  }

  const onPageClick = (newPageIndex: number) => {
    setPageProps({ ...pageProps, pageIndex: newPageIndex + 1 })
  }

  const emptySearchResults = _isEmpty(rules)

  const columns: Column<Service>[] = React.useMemo(
    () => [
      {
        accessor: 'name',
        Header: getString('ce.co.rulesTableHeaders.name'),
        width: '25%',
        Cell: NameCell,
        serverSortProps: getServerSortProps({
          enableServerSort: true,
          accessor: 'name',
          sortByObj: sortObj,
          setSortByObj: handleSort
        })
      },
      {
        accessor: 'idle_time_mins',
        Header: getString('details'),
        width: '15%',
        Cell: TimeCell,
        disableSortBy: true
      },
      // {
      //   accessor: 'fulfilment',
      //   Header: getString('ce.co.rulesTableHeaders.fulfilment'),
      //   width: '12%',
      //   Cell: IconCell,
      //   disableSortBy: true
      // },
      {
        Header: getString('ce.co.rulesTableHeaders.mangedResources'),
        width: '30%',
        Cell: ResourcesManagedCell
      },
      {
        accessor: 'access_point_id', // random accessor to display sort icon
        Header: (
          <Text font={{ variation: FontVariation.TABLE_HEADERS }}>
            {mode === RulesMode.DRY
              ? getString('ce.co.summarySection.dryRunSavings')
              : getString('ce.co.rulesTableHeaders.savings')}
          </Text>
        ),
        width: '20%',
        Cell: SavingsCell,
        serverSortProps: getServerSortProps({
          enableServerSort: true,
          accessor: 'savings',
          sortByObj: sortObj,
          setSortByObj: handleSort
        })
      },
      {
        accessor: 'account_identifier', // random accessor to display sort icon
        Header: getString('ce.co.rulesTableHeaders.lastActivity'),
        width: '15%',
        Cell: ActivityCell,
        serverSortProps: getServerSortProps({
          enableServerSort: true,
          accessor: 'last_activity',
          sortByObj: sortObj,
          setSortByObj: handleSort
        })
      },
      // {
      //   Header: getString('ce.co.rulesTableHeaders.status'),
      //   width: '10%',
      //   Cell: StatusCell,
      //   disableSortBy: true
      // },
      {
        Header: '',
        id: 'menu',
        accessor: row => row.id,
        width: '5%',
        Cell: (cellData: CellProps<Service>) =>
          RenderColumnMenu(cellData, {
            onDelete,
            onEdit,
            onStateToggle
          }),
        disableSortBy: true
      }
    ],
    [rules, isSorting, mode]
  )

  return (
    <Container padding={'xlarge'}>
      <Container margin={{ top: 'medium' }} style={{ position: 'relative' }}>
        {!isSorting && loading ? (
          <Layout.Horizontal style={{ padding: 'var(--spacing-large)', paddingTop: 'var(--spacing-xxxlarge)' }}>
            <PageSpinner />
          </Layout.Horizontal>
        ) : emptySearchResults ? (
          <>
            <Layout.Vertical spacing="large" style={{ alignItems: 'center' }}>
              <img src={NoDataImage} height={150} />
              <Text color="grey800" font="normal" style={{ lineHeight: '25px' }}>
                {searchParams.text.length
                  ? getString('ce.co.emptyResultText', {
                      string: searchParams.text
                    })
                  : mode === RulesMode.DRY
                  ? getString('ce.co.noDataForDryRunMsg')
                  : getString('ce.co.noDataForActiveRulesMsg')}
              </Text>
            </Layout.Vertical>
          </>
        ) : (
          <>
            <Layout.Horizontal
              className={css.refreshIconContainer}
              onClick={handleRefreshClick}
              data-testid={'refreshIconContainer'}
            >
              <img src={refreshIcon} width={'12px'} height={'12px'} />
              <Text>{getString('common.refresh')}</Text>
            </Layout.Horizontal>
            <div className={cx(css.tableWrapper, { [css.disable]: isSorting })}>
              <TableV2
                data={rules}
                pagination={{
                  pageSize: TOTAL_ITEMS_PER_PAGE,
                  pageIndex: pageProps.pageIndex - 1,
                  pageCount: pageProps.totalPages ?? 1,
                  itemCount: pageProps.totalRecords,
                  gotoPage: onPageClick
                }}
                getRowClassName={({ original }) =>
                  cx(css.ruleListRow, {
                    [css.disableRule]: original.disabled
                  })
                }
                onRowClick={onRowClick}
                columns={columns}
                sortable={true}
              />
            </div>
          </>
        )}
      </Container>
    </Container>
  )
}

const ModePillToggle = ({ mode, onChange }: { mode: RulesMode; onChange: (val: RulesMode) => void }) => {
  const { getString } = useStrings()
  const dryRunModeEnabled = useFeatureFlag(FeatureFlag.CCM_AS_DRY_RUN)

  if (!dryRunModeEnabled) {
    return null
  }

  return (
    <Layout.Horizontal flex={{ justifyContent: 'center', alignItems: 'center' }} padding="medium">
      <PillToggle
        selectedView={mode}
        options={[
          {
            label: getString('ce.co.activeModeLabel'),
            value: RulesMode.ACTIVE
          },
          {
            label: getString('ce.co.dryRunModeLabel'),
            value: RulesMode.DRY
          }
        ]}
        className={css.modeToggle}
        onChange={onChange}
      />
    </Layout.Horizontal>
  )
}

const COGatewayList: React.FC = () => {
  const { getString } = useStrings()
  const history = useHistory()
  const { trackEvent } = useTelemetry()
  const { accountId } = useParams<AccountPathProps>()
  const { showSuccess, showError } = useToaster()
  const { featureDetail } = useFeature({
    featureRequest: {
      featureName: FeatureIdentifier.RESTRICTED_AUTOSTOPPING_RULE_CREATION
    }
  })
  const queryParams = useQueryParams<RulesListQueryParams>()

  const [allParams, setAllParams] = useAllQueryParamsState({
    mode: { value: RulesMode.ACTIVE },
    search: { value: '' },
    sort: { value: {}, parseAsObject: true },
    page: { value: 1, parseAsNumeric: true },
    filter: { value: { identifier: StringUtils.getIdentifierFromName(UNSAVED_FILTER), data: {} }, parseAsObject: true }
  })
  const { search, mode, sort, page, filter } = allParams

  const [selectedService, setSelectedService] = useState<{ data: Service; index: number } | null>()
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [tableData, setTableData] = useState<Service[]>([])
  const [paginationProps, setPaginationProps] = useState<PaginationResponseProps>({
    totalPages: 1,
    totalRecords: 0
  })
  const [sortingInProgress, setSortingInProgress] = useState(false)
  const [searchParams, setSearchParams] = useState<SearchParams>({
    isActive: !_isEmpty(search.value),
    text: _defaultTo(search.value, '')
  })
  const [isLoadingPage, setIsLoadingPage] = useState(true) // track initial loading of page

  const hasQueryParams = !_isEmpty(queryParams)
  const initLoadComplete = useRef<boolean>(hasQueryParams)

  const { mutate: fetchRules, loading } = useFetchRules({
    account_id: accountId,
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const getRules = async (body?: FetchRulesBody): Promise<GetRulesReturnDetails> => {
    let response, error
    const sortType = sort.value?.type?.toLowerCase()
    try {
      const rulesResponse = await fetchRules({
        page: page.value,
        limit: TOTAL_ITEMS_PER_PAGE,
        query: Utils.getConditionalResult(searchParams.text.length > 0, searchParams.text, undefined),
        dry_run: mode.value === RulesMode.DRY,
        sort: Utils.getConditionalResult(sort.value?.field && sortType, { ...sort.value, type: sortType }, undefined),
        filters: !_isEmpty(filter.value?.data) ? getFilterBodyFromFilterData(filter.value?.data) : undefined,
        ...body
      })
      response = rulesResponse.response
    } catch (err) {
      error = err
    }
    return { response, error }
  }

  useDeepCompareEffect(() => {
    if (initLoadComplete.current) {
      fetchAndSaveRules()
    } else {
      handleInitialPageLoad()
    }
  }, [mode.value, searchParams.text, page.value, sort.value?.field, sort.value?.type, filter.value?.data])

  const handleInitialPageLoad = async () => {
    const { response: activeRulesResponse } = await getRules()
    const { response: dryRunRulesResponse } = await getRules({ dry_run: true })
    const dataToSave = Utils.getConditionalResult(
      !_isEmpty(activeRulesResponse?.records),
      activeRulesResponse,
      dryRunRulesResponse
    )
    trackLandingPage(dataToSave?.records)
    if (_isEmpty(activeRulesResponse?.records) && !_isEmpty(dryRunRulesResponse?.records)) {
      // setMode(RulesMode.DRY)
      setAllParams({
        mode: { value: RulesMode.DRY }
      })
    }
    setTableData(_defaultTo(dataToSave?.records, []))
    setPaginationProps(prevProps => ({
      ...prevProps,
      totalPages: _defaultTo(dataToSave?.pages, 1),
      totalRecords: _defaultTo(dataToSave?.total, 0)
    }))
    setIsLoadingPage(false)
    initLoadComplete.current = true
  }

  const fetchAndSaveRules = async (body?: FetchRulesBody) => {
    const { response, error } = await getRules(body)
    if (error) {
      const errMessage = _defaultTo((error?.data as any)?.errors?.join(', '), error?.message)
      showError(errMessage)
    } else {
      setTableData(_defaultTo(response?.records, []))
      setPaginationProps(prevProps => ({
        ...prevProps,
        totalPages: _defaultTo(response?.pages, 1),
        totalRecords: _defaultTo(response?.total, 0)
      }))
      setIsLoadingPage(false)
      setTimeout(() => {
        setSortingInProgress(false)
      }, 500)
    }
  }

  const trackLandingPage = (data?: Service[]) => {
    const hasData = !_isEmpty(data)
    const eventName = Utils.getConditionalResult(
      hasData,
      USER_JOURNEY_EVENTS.LOAD_AS_SUMMARY_PAGE,
      USER_JOURNEY_EVENTS.LOAD_AS_LANDING_PAGE
    )
    trackEvent(eventName, {})
  }

  /* istanbul ignore next */
  const onServiceStateToggle = (type: 'SUCCESS' | 'FAILURE', data: Service | any, index?: number) => {
    if (type === 'SUCCESS') {
      onServiceStateToggleSuccess(data, index)
    } else {
      showError(_defaultTo(data.data?.errors?.join(', '), ''))
    }
  }

  const onServiceStateToggleSuccess = (data: Service, index?: number) => {
    const currTableData: Service[] = [...tableData]
    currTableData.splice(index as number, 1, data)
    setTableData(currTableData)
    if (!_isEmpty(selectedService)) {
      setSelectedService({ data, index: index as number })
    }
    showSuccess(`Rule ${data.name} ${Utils.getConditionalResult(!data.disabled, 'enabled', 'disabled')}`)
  }

  /* istanbul ignore next */
  const onServiceDeletion = (type: 'SUCCESS' | 'FAILURE', data: Service | any) => {
    if (type === 'SUCCESS') {
      onServiceDeletionSuccess(data)
    } else {
      showError(_defaultTo(data.data?.errors?.join(', '), ''))
    }
  }

  const onServiceDeletionSuccess = (data: Service) => {
    showSuccess(getString('ce.co.deleteRuleSuccessMessage', { name: data.name }))
    if (isDrawerOpen) {
      setIsDrawerOpen(false)
      setSelectedService(null)
    }
    fetchAndSaveRules()
  }

  const handleServiceEdit = (_service: Service) =>
    history.push(
      routes.toCECOEditGateway({
        accountId: _service.account_identifier as string,
        gatewayIdentifier: _service.id?.toString() as string
      })
    )

  const handleModeChange = (val: RulesMode) => {
    setAllParams({
      mode: { value: val },
      page: { value: 1 }
    })
  }

  const handlePageChange = (updatedPageProps: PaginationProps) => {
    setAllParams({
      page: { value: updatedPageProps.pageIndex }
    })
    setPaginationProps({ totalPages: updatedPageProps.totalPages, totalRecords: updatedPageProps.totalRecords })
  }

  const handleTableSort = (sortObj: SortByObjInterface) => {
    setSortingInProgress(true)
    setAllParams({
      sort: { value: sortObj },
      page: { value: 1 }
    })
  }

  const onSearchChange = async (val: string) => {
    val = val.trim()
    setSearchParams({ isActive: !_isEmpty(val), text: val })
    setAllParams({
      page: { value: 1 },
      search: { value: Utils.getConditionalResult(_isEmpty(val), undefined, val) }
    })
  }

  const handleFilterApply = (filterData?: FilterDTO) => {
    const { identifier, data } = _defaultTo(filterData, {}) as FilterDTO
    setAllParams({
      page: { value: 1 },
      filter: { value: Utils.getConditionalResult(_isEmpty(data), undefined, { identifier, data }) }
    })
  }

  // Render page loader for initial loading of the page
  if (isLoadingPage) {
    return (
      <div style={{ position: 'relative', height: 'calc(100vh - 128px)' }}>
        <PageSpinner />
      </div>
    )
  }

  // Render empty page component when:
  // no data is available
  // search is not active
  // and no query param is present
  if (!isLoadingPage && !hasQueryParams && _isEmpty(tableData) && !searchParams.isActive) {
    return <EmptyListPage featureDetail={featureDetail} />
  }

  // Render summary and table when:
  // without search - data is available
  // with search - data is available or unavailable
  return (
    <Container background={Color.WHITE} height="100vh">
      <PageHeader
        title={
          <Layout.Horizontal flex={{ alignItems: 'center' }}>
            <Heading data-tooltip-id="autostoppingRule" level={2} color={Color.GREY_800} font={{ weight: 'bold' }}>
              {getString('ce.co.breadCrumb.rules')}
            </Heading>
            <HarnessDocTooltip tooltipId="autostoppingRule" useStandAlone={true} />
          </Layout.Horizontal>
        }
        breadcrumbs={<NGBreadcrumbs />}
      />

      <Drawer
        autoFocus={true}
        enforceFocus={true}
        hasBackdrop={true}
        usePortal={true}
        canOutsideClickClose={true}
        canEscapeKeyClose={true}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          setSelectedService(null)
        }}
        size="656px"
        style={{
          boxShadow: '0px 2px 8px rgba(40, 41, 61, 0.04), 0px 16px 24px rgba(96, 97, 112, 0.16)',
          borderRadius: '8px',
          overflowY: 'scroll'
        }}
      >
        <COGatewayAnalytics
          service={selectedService}
          handleServiceToggle={onServiceStateToggle}
          handleServiceDeletion={onServiceDeletion}
          handleServiceEdit={handleServiceEdit}
        />
      </Drawer>
      <>
        <Layout.Horizontal padding="large" flex={{ justifyContent: 'space-between' }} className={css.pageSubHeader}>
          <Layout.Horizontal width="55%">
            <RbacButton
              intent="primary"
              text={getString('ce.co.newAutoStoppingRule')}
              icon="plus"
              featuresProps={{
                featuresRequest: {
                  featureNames: [FeatureIdentifier.RESTRICTED_AUTOSTOPPING_RULE_CREATION]
                }
              }}
              onClick={() => {
                history.push(
                  routes.toCECOCreateGateway({
                    accountId
                  })
                )
                trackEvent('StartedMakingAutoStoppingRule', {})
              }}
            />
          </Layout.Horizontal>
          <Layout.Horizontal spacing={'large'} flex>
            <ExpandingSearchInput
              placeholder={getString('search')}
              onChange={onSearchChange}
              throttle={300}
              alwaysExpanded={true}
              defaultValue={searchParams.text}
            />
            <GatewayListFilters applyFilter={handleFilterApply} appliedFilter={filter.value} />
          </Layout.Horizontal>
        </Layout.Horizontal>
      </>
      <Page.Body className={css.pageContainer}>
        <ModePillToggle mode={mode.value} onChange={handleModeChange} />
        <Layout.Horizontal padding={{ left: 'xlarge', right: 'xlarge' }}>
          {!_isEmpty(tableData) && searchParams.text && !loading ? (
            <Text font={{ variation: FontVariation.H6 }}>
              {getString('ce.co.searchResultsText', {
                count: paginationProps.totalRecords,
                text: searchParams.text
              })}
            </Text>
          ) : null}
        </Layout.Horizontal>
        <COGatewayCumulativeAnalytics mode={mode.value} searchQuery={searchParams.text} appliedFilter={filter.value} />
        <RulesTableContainer
          rules={tableData}
          setRules={setTableData}
          loading={loading}
          onRowClick={(e, index) => {
            setSelectedService({ data: e, index })
            setIsDrawerOpen(true)
          }}
          pageProps={{ ...paginationProps, pageIndex: page.value }}
          setPageProps={handlePageChange}
          refetchRules={fetchAndSaveRules}
          rowMenuProps={{
            onDelete: onServiceDeletion,
            onEdit: handleServiceEdit,
            onStateToggle: onServiceStateToggle
          }}
          searchParams={searchParams}
          mode={mode.value}
          sortObj={sort.value}
          handleSort={handleTableSort}
          isSorting={sortingInProgress}
        />
      </Page.Body>
    </Container>
  )
}

export default COGatewayList
