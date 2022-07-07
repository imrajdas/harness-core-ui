/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { isEmpty as _isEmpty, defaultTo as _defaultTo } from 'lodash-es'
import { Switch, Tab } from '@blueprintjs/core'
import copy from 'copy-to-clipboard'
import { Layout, Container, Text, Icon, Link, Tabs, Heading, IconName } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { useParams, Link as RouterLink } from 'react-router-dom'
import moment from 'moment'
import {
  AllResourcesOfAccountResponse,
  Service,
  ServiceSavings,
  useAllServiceResources,
  useDescribeServiceInContainerServiceCluster,
  useHealthOfService,
  useSavingsOfService
} from 'services/lw'
import routes from '@common/RouteDefinitions'
import { useStrings } from 'framework/strings'
import { useToaster } from '@common/exports'
import useDeleteServiceHook from '@ce/common/useDeleteService'
import { Utils } from '@ce/common/Utils'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useGetConnector } from 'services/cd-ng'
import { allProviders, ceConnectorTypes } from '@ce/constants'
import COGatewayLogs from './COGatewayLogs'
import COGatewayUsageTime from './COGatewayUsageTime'
import {
  getInstancesLink,
  getRelativeTime,
  getStateTag,
  getRiskGaugeChartOptions,
  getDay,
  roundToPrecision
} from './Utils'
import useToggleRuleState from './useToggleRuleState'
// import SpotvsODChart from './SpotvsODChart'
import DownloadCLI from '../DownloadCLI/DownloadCLI'
import FixedScheduleAccordion from './components/FixedScheduleAccordion/FixedScheduleAccordion'
import ComputeType from './components/ComputeType'
import css from './COGatewayList.module.scss'

interface COGatewayAnalyticsProps {
  service: { data: Service; index: number } | null | undefined
  handleServiceToggle: (type: 'SUCCESS' | 'FAILURE', data: Service | any, index?: number) => void
  handleServiceDeletion: (type: 'SUCCESS' | 'FAILURE', data: Service | any) => void
  handleServiceEdit: (_service: Service) => void
}

function getBarChartOptions(
  title: string,
  categories: string[],
  yAxisText: string,
  savingsData: number[],
  spendData: number[],
  idleHoursData: number[],
  actualHoursData: number[]
): Highcharts.Options {
  return {
    chart: {
      type: 'column'
    },
    colors: ['rgba(71, 213, 223)', 'rgba(124, 77, 211)'],
    title: {
      text: title
    },
    xAxis: {
      categories: categories
    },
    yAxis: {
      min: 0,
      title: {
        text: yAxisText
      },
      stackLabels: {
        enabled: true,
        style: {
          fontWeight: 'bold',
          color: 'gray'
        }
      }
    },
    credits: {
      enabled: false
    },
    legend: {
      align: 'right',
      x: -30,
      verticalAlign: 'top',
      y: 25,
      floating: true,
      backgroundColor: 'white',
      borderColor: '#CCC',
      borderWidth: 1,
      shadow: false
    },
    tooltip: {
      formatter() {
        const total = savingsData[this.point.x] + spendData[this.point.x]
        const idle = idleHoursData[this.point.x]
        const actual = actualHoursData[this.point.x]
        return `<b>${this.x}</b><br/>${this.series.name}: ${this.y}<br/>Total: ${total}<br>Idle Hours: ${idle}<br>Actual Hours: ${actual}`
      }
    },
    plotOptions: {
      column: {
        stacking: 'normal',
        dataLabels: {
          enabled: false
        }
      }
    },
    series: [
      {
        name: 'Savings',
        type: 'column',
        data: savingsData
      },
      {
        name: 'Spend',
        type: 'column',
        data: spendData
      }
    ]
  }
}
const DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ssZ'
const today = () => moment()
const startOfDay = (time: moment.Moment) => time.startOf('day').toDate()
const endOfDay = (time: moment.Moment) => time.endOf('day').toDate()

const CopyURL = (props: { textToCopy: string }) => {
  const { showError, showSuccess } = useToaster()
  const { getString } = useStrings()

  const copyToClipboard = () => {
    copy(props.textToCopy) ? showSuccess(getString('clipboardCopySuccess')) : showError(getString('clipboardCopyFail'))
  }

  return <Icon name="copy" size={20} color="blue500" onClick={copyToClipboard} style={{ cursor: 'pointer' }} />
}

const COGatewayAnalytics: React.FC<COGatewayAnalyticsProps> = props => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const { showError } = useToaster()

  const isK8sRule = Utils.isK8sRule(props.service?.data as Service)
  const isEcsRule = !_isEmpty(props.service?.data.routing?.container_svc)
  const isRdsRule = !_isEmpty(props.service?.data.routing?.database)

  const { data: healthData, loading: healthDataLoading } = useHealthOfService({
    account_id: accountId,
    rule_id: props.service?.data.id as number,
    queryParams: {
      accountIdentifier: accountId
    },
    debounce: 300
  })
  const {
    data: resources,
    loading: resourcesLoading,
    error: resourceError
  } = useAllServiceResources({
    account_id: accountId,
    rule_id: props.service?.data.id as number, // eslint-disable-line
    debounce: 300,
    lazy: isK8sRule || isEcsRule
  })

  const { data: serviceDescribeData } = useDescribeServiceInContainerServiceCluster({
    account_id: accountId,
    cluster_name: _defaultTo(props.service?.data.routing?.container_svc?.cluster, ''),
    service_name: _defaultTo(props.service?.data.routing?.container_svc?.service, ''),
    lazy: !isEcsRule,
    queryParams: {
      accountIdentifier: accountId,
      cloud_account_id: _defaultTo(props.service?.data.cloud_account_id, ''),
      region: _defaultTo(props.service?.data.routing?.container_svc?.region, '')
    }
  })

  const { triggerToggle } = useToggleRuleState({
    accountId,
    serviceData: props.service?.data as Service,
    onSuccess: (updatedServiceData: Service) =>
      props.handleServiceToggle('SUCCESS', updatedServiceData, props.service?.index),
    onFailure: error => props.handleServiceToggle('FAILURE', error)
  })
  const { triggerDelete } = useDeleteServiceHook({
    accountId,
    serviceData: props.service?.data as Service,
    onSuccess: (_data: Service) => props.handleServiceDeletion('SUCCESS', _data),
    onFailure: err => props.handleServiceDeletion('FAILURE', err)
  })

  if (resourceError) {
    showError(`could not load resources for rule`, undefined, 'ce.load.resource.error')
  }

  const renderCustomDomainLink = (link: string, index = 0) => {
    const hrefLink = `${domainProtocol}://${link}`
    return (
      <Layout.Horizontal spacing="small" key={`custom_domain${index}`}>
        <Link key={`custom_domain${index}`} href={hrefLink} target="_blank">
          {link}
        </Link>
        <CopyURL textToCopy={hrefLink} />
      </Layout.Horizontal>
    )
  }

  const domainProtocol = useMemo(() => {
    const hasHttpsConfig = !_isEmpty(
      props.service?.data.routing?.ports?.find(portConfig => portConfig.protocol?.toLowerCase() === 'https')
    )
    return Utils.getConditionalResult(hasHttpsConfig, 'https', 'http')
  }, [props.service?.data.routing?.ports])

  return (
    <Container>
      <Layout.Vertical spacing="large" padding="xlarge">
        <Container className={css.analyticsHeader}>
          <Layout.Horizontal flex={{ justifyContent: 'space-between' }}>
            <Layout.Horizontal flex={{ alignItems: 'center' }}>
              <Heading level={1} font={{ weight: 'semi-bold' }}>
                {props.service?.data.name}
              </Heading>
              <Switch
                className={css.ruleToggle}
                checked={!props.service?.data.disabled}
                onChange={() => triggerToggle()}
              ></Switch>
            </Layout.Horizontal>
            <Layout.Horizontal spacing="large" className={css.headerLayout}>
              <Layout.Horizontal flex spacing="large">
                <Icon
                  name="Edit"
                  size={20}
                  style={{ cursor: 'pointer' }}
                  onClick={() => props.handleServiceEdit(props.service?.data as Service)}
                  data-testid="editRuleIcon"
                ></Icon>
                <Icon
                  name="main-trash"
                  size={20}
                  style={{ cursor: 'pointer' }}
                  onClick={() => triggerDelete()}
                  data-testid="deleteRuleIcon"
                ></Icon>
              </Layout.Horizontal>
            </Layout.Horizontal>
          </Layout.Horizontal>
          <Text font={{ size: 'small' }}>
            {`Created ${getRelativeTime(props.service?.data.created_at as string, 'YYYY-MM-DDTHH:mm:ssZ')}`}
            {/* <Avatar email="john.doe@harnes.io" size={'small'} />
            {'John Doe '} */}
          </Text>
        </Container>
        <Container className={css.analyticsHeader}>
          <Heading level={2} font={{ weight: 'bold' }}>
            Rule Details
          </Heading>
          <Layout.Vertical spacing="medium" padding={{ top: 'medium', bottom: 'medium' }}>
            <Container className={css.serviceDetailsItemContainer}>
              <Text className={css.detailItemHeader}>{getString('ce.co.ruleDetailsHeader.idleTime')}</Text>
              <Text className={css.detailItemValue}>{`${props.service?.data.idle_time_mins} min`}</Text>
            </Container>
            {!isK8sRule && (
              <Container className={css.serviceDetailsItemContainer}>
                <Text className={css.detailItemHeader}>{isEcsRule ? 'Tasks running' : 'Resources managed'}</Text>
                <Layout.Horizontal spacing="medium" className={css.detailItemValue}>
                  {isEcsRule ? (
                    <>
                      <Link
                        href={getInstancesLink(props.service?.data as Service)}
                        target="_blank"
                        style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {`${_defaultTo(serviceDescribeData?.response?.task_count, 0)} tasks`}
                      </Link>
                      {getStateTag(serviceDescribeData?.response?.task_count ? 'active' : 'down')}
                    </>
                  ) : (
                    <>
                      {!resourcesLoading && resources && props.service?.data ? (
                        <Link
                          href={getInstancesLink(
                            props.service?.data as Service,
                            resources as AllResourcesOfAccountResponse
                          )}
                          target="_blank"
                        >
                          <Text>{`${resources?.response?.length} ${
                            isRdsRule
                              ? Utils.getConditionalResult(
                                  (resources?.response?.length as number) > 1,
                                  getString('ce.co.ruleDrawer.dbInstancesPlural'),
                                  getString('ce.co.ruleDrawer.dbInstances')
                                )
                              : getString('common.instanceLabel')
                          }`}</Text>
                        </Link>
                      ) : (
                        <Icon name="spinner" size={12} color="blue500" />
                      )}
                      {healthDataLoading ? (
                        <Icon name="spinner" size={12} color="blue500" />
                      ) : healthData?.response?.['state'] != null ? (
                        getStateTag(healthData?.response?.['state'])
                      ) : null}
                    </>
                  )}
                </Layout.Horizontal>
              </Container>
            )}
            <Container className={css.serviceDetailsItemContainer}>
              <Text className={css.detailItemHeader}>{getString('ce.co.ruleDetailsHeader.hostName')}</Text>
              <Layout.Horizontal spacing="small" className={css.detailItemValue}>
                {isK8sRule ? (
                  <Text style={{ maxWidth: 350, textAlign: 'left' }}>{props.service?.data.host_name}</Text>
                ) : (
                  <Link
                    href={`${domainProtocol}://${props.service?.data.host_name}`}
                    target="_blank"
                    style={{ maxWidth: 350, textAlign: 'left' }}
                  >
                    {props.service?.data.host_name}
                  </Link>
                )}
                <CopyURL textToCopy={`${domainProtocol}://${props.service?.data.host_name}`} />
              </Layout.Horizontal>
            </Container>
            <ConnectorDetails service={props.service?.data} />
            {(!_isEmpty(props.service?.data.custom_domains) || props.service?.data?.routing?.k8s?.CustomDomain) && (
              <Container className={css.serviceDetailsItemContainer}>
                <Text className={css.detailItemHeader}>{getString('ce.co.ruleDetailsHeader.customDomain')}</Text>
                <div className={css.detailItemValue}>
                  {props.service?.data?.routing?.k8s?.CustomDomain
                    ? renderCustomDomainLink(props.service?.data?.routing?.k8s?.CustomDomain)
                    : props.service?.data.custom_domains?.map((d, i) => renderCustomDomainLink(d, i))}
                </div>
              </Container>
            )}
            <Container className={css.serviceDetailsItemContainer}>
              <Text className={css.detailItemHeader}>{getString('ce.co.ruleDetailsHeader.computeType')}</Text>
              <ComputeType data={props.service?.data as Service} className={css.detailItemValue} />
            </Container>
            {/* <Layout.Vertical spacing="large" padding="medium">
            <Text>Connector</Text>
            <Layout.Horizontal spacing="xsmall">
              <Icon name="service-aws" />
              <Text>{props.service?.data.metadata?.cloud_provider_details?.name}</Text>
            </Layout.Horizontal>
            <Layout.Horizontal spacing="xsmall">
              <Icon name="deployment-timeout-legacy" />
            </Layout.Horizontal>
          </Layout.Vertical>
          <Layout.Vertical spacing="large" padding="medium">
            <Text>Instances managed by the Rule</Text>
            {props.service?.data.custom_domains?.length ? (
              <>
              </>
            ) : null}
          </Layout.Vertical> */}
          </Layout.Vertical>
        </Container>
        <Container className={css.analyticsHeader}>
          <Layout.Vertical spacing="medium">
            <Heading level={2} font={{ weight: 'bold' }}>
              {getString('ce.co.autoStoppingRule.configuration.step4.advancedConfiguration')}
            </Heading>
            <FixedScheduleAccordion service={props.service?.data} />
          </Layout.Vertical>
        </Container>
        {props.service?.data.fulfilment !== 'kubernetes' && !isEcsRule && (
          <Container className={css.analyticsHeader}>
            <Layout.Vertical spacing="medium">
              <Heading level={2} font={{ weight: 'bold' }} className={css.analyticsSubHeader}>
                {getString('ce.co.autoStoppingRule.setupAccess.helpText.ssh.setup.download')}
              </Heading>
              <DownloadCLI />
            </Layout.Vertical>
          </Container>
        )}
        <CumulativeSavingsSection service={props.service?.data} />
        <Layout.Horizontal spacing="small" style={{ alignSelf: 'center' }}>
          <Text>Showing data for Last 7 days</Text>
        </Layout.Horizontal>
        <SpendVsSavingsGraph service={props.service?.data} />
        <LogsAndUsage service={props.service?.data} />
      </Layout.Vertical>
    </Container>
  )
}

const CumulativeSavingsSection = (props: { service?: Service }) => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()

  const { data, loading } = useSavingsOfService({
    account_id: accountId,
    rule_id: props.service?.id as number,
    queryParams: {
      accountIdentifier: accountId
    }
  })

  return (
    <Container padding="medium" style={{ backgroundColor: 'var(--blue-50)' }}>
      <Layout.Horizontal spacing="large">
        {loading ? (
          <Icon name="spinner" size={12} color={Color.BLUE_500} />
        ) : (
          <>
            {/* <Layout.Horizontal spacing="medium">
                  {props.service.fulfilment == 'spot' ? <SpotvsODChart spotPercent={76}></SpotvsODChart> : null} */}
            <Layout.Horizontal spacing="medium">
              <div style={{ alignSelf: 'center' }}>
                <HighchartsReact
                  highchart={Highcharts}
                  options={
                    data?.response != null
                      ? getRiskGaugeChartOptions((data?.response as ServiceSavings).savings_percentage as number)
                      : getRiskGaugeChartOptions(0)
                  }
                />
              </div>
              <Layout.Vertical spacing="xsmall" padding="large">
                <Heading level={2}>
                  $
                  {data?.response != null
                    ? Math.round(((data?.response as ServiceSavings).actual_savings as number) * 100) / 100
                    : 0}
                </Heading>
                <Text>{getString('ce.co.rulesTableHeaders.savings')}</Text>
              </Layout.Vertical>
            </Layout.Horizontal>
            {/* </Layout.Horizontal> */}
          </>
        )}
      </Layout.Horizontal>
    </Container>
  )
}

const SpendVsSavingsGraph = (props: { service?: Service }) => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()

  const [categories, setCategories] = useState<string[]>([])
  const [savingsSeries, setSavingsSeries] = useState<number[]>([])
  const [spendSeries, setSpendSeries] = useState<number[]>([])
  const [idleHourSeries, setIdleHourSeries] = useState<number[]>([])
  const [actualHoursSeries, setActualHoursSeries] = useState<number[]>([])

  const { data: graphData, loading: graphLoading } = useSavingsOfService({
    account_id: accountId,
    rule_id: props.service?.id as number,
    queryParams: {
      accountIdentifier: accountId,
      from: moment(startOfDay(today().subtract(7, 'days'))).format(DATE_FORMAT),
      to: moment(endOfDay(today())).format(DATE_FORMAT),
      group_by: 'date'
    }
  })

  useEffect(() => {
    if (graphLoading) {
      return
    }
    const newCategroies: string[] = []
    const newSavings: number[] = []
    const newSpends: number[] = []
    const newIdleHours: number[] = []
    const newActualHours: number[] = []
    const savingsEntries: ServiceSavings[] = _defaultTo(graphData?.response as ServiceSavings[], [])
    savingsEntries.forEach(element => {
      newCategroies.push(getDay(element.usage_date as string, DATE_FORMAT))
      newSavings.push(roundToPrecision(element.actual_savings as number))
      newSpends.push(
        roundToPrecision(element.potential_cost as number) - roundToPrecision(element.actual_savings as number)
      )
      newActualHours.push(roundToPrecision(element.actual_hours as number))
      newIdleHours.push(roundToPrecision(element.idle_hours as number))
    })
    setCategories(newCategroies)
    setSavingsSeries(newSavings)
    setSpendSeries(newSpends)
    setIdleHourSeries(newIdleHours)
    setActualHoursSeries(newActualHours)
  }, [graphData])

  return (
    <>
      <Heading level={3}>{getString('ce.co.ruleDrawer.spendVsSavings').toUpperCase()}</Heading>
      {graphLoading ? (
        <Icon name="spinner" size={24} color="blue500" style={{ alignSelf: 'center' }} />
      ) : categories.length ? (
        <HighchartsReact
          highchart={Highcharts}
          options={getBarChartOptions(
            '',
            categories,
            '',
            savingsSeries,
            spendSeries,
            idleHourSeries,
            actualHoursSeries
          )}
        />
      ) : (
        <Text style={{ alignSelf: 'center', fontSize: 'var(--font-size-medium)' }}>{getString('ce.co.noData')}</Text>
      )}
    </>
  )
}

const LogsAndUsage = (props: { service?: Service }) => {
  const { getString } = useStrings()
  return (
    <>
      <Heading level={3}>
        {`${getString('ce.co.ruleDrawer.logs')} ${getString('and')} ${getString(
          'ce.co.ruleDrawer.usageTime'
        )}`.toUpperCase()}
      </Heading>
      <Tabs id="logsAndUsage">
        <Tab
          id="name"
          title={getString('ce.co.ruleDrawer.usageTime')}
          panel={<COGatewayUsageTime service={props.service} />}
        ></Tab>
        <Tab
          id="logs"
          title={getString('ce.co.ruleDrawer.logs')}
          panel={<COGatewayLogs service={props.service} />}
        ></Tab>
      </Tabs>
    </>
  )
}

const ConnectorDetails = (props: { service?: Service }) => {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()

  const { data: connectorData } = useGetConnector({
    identifier: props.service?.cloud_account_id || '',
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const providerType = connectorData?.data?.connector?.type && ceConnectorTypes[connectorData?.data?.connector?.type]
  const providerIcon = providerType ? allProviders.find(provider => provider.value === providerType)?.icon : null

  return (
    <Container className={css.serviceDetailsItemContainer}>
      <Text className={css.detailItemHeader}>{getString('connectorsLabel')}</Text>
      <Layout.Horizontal className={css.detailItemValue}>
        {props.service?.routing?.k8s?.ConnectorID ? (
          <Layout.Horizontal spacing={'small'}>
            <Icon name="app-kubernetes" size={18} />
            <RouterLink
              target="_blank"
              to={routes.toConnectorDetails({ accountId, connectorId: props.service?.routing?.k8s?.ConnectorID })}
            >
              {props.service?.routing?.k8s?.ConnectorID}
            </RouterLink>
            <Text>{`(${getString('common.cluster')}) / `}</Text>
          </Layout.Horizontal>
        ) : null}
        <Layout.Horizontal spacing={'small'}>
          {providerIcon && <Icon name={providerIcon as IconName} size={18} />}
          <RouterLink
            target="_blank"
            to={routes.toConnectorDetails({ accountId, connectorId: props.service?.cloud_account_id })}
          >
            {props.service?.metadata?.cloud_provider_details?.name}
          </RouterLink>
          <Text>{`(${getString('ce.co.accessPoint.cloudAccount')})`}</Text>
        </Layout.Horizontal>
      </Layout.Horizontal>
    </Container>
  )
}

export default COGatewayAnalytics
