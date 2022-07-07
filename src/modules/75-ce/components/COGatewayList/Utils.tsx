/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo as _defaultTo, isEmpty, get } from 'lodash-es'
import moment from 'moment'
import { getColorValue } from '@common/components/HeatMap/ColorUtils'
import {
  CreatedStatusIndicator,
  RunningStatusIndicator,
  StoppedStatusIndicator
} from '@ce/common/InstanceStatusIndicator/InstanceStatusIndicator'
import type { AllResourcesOfAccountResponse, Service } from 'services/lw'
import { GatewayKindType, PROVIDER_TYPES, RulesMode } from '@ce/constants'
import type { Provider } from '../COCreateGateway/models'
import odIcon from './images/ondemandIcon.svg'
import spotIcon from './images/spotIcon.svg'
import css from './COGatewayCumulativeAnalytics.module.scss'

export function getRelativeTime(t: string, format: string): string {
  return moment(t, format).fromNow()
}

const getAwsConsoleInstancesLink = (region: string, instances: string) => {
  return `https://console.aws.amazon.com/ec2/v2/home?region=${region}#Instances:search=${instances};sort=instanceId`
}

const getAwsConsoleDatabaseLink = (region: string, db: string) => {
  return `https://console.aws.amazon.com/rds/home?region=${region}#database:id=${db};is-cluster=false`
}

const getAzureInstancesLink = () =>
  'https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.Compute%2FVirtualMachines'

const getGcpInstancesLink = () => {
  return `https://console.cloud.google.com/compute/instances`
}

const getGcpInstanceDetailsLink = (zone: string, name: string) => {
  return `https://console.cloud.google.com/compute/instancesDetail/zones/${zone}/instances/${name}`
}

const getEcsServicesLink = (region: string, cluster: string, serviceName: string) => {
  return `https://console.aws.amazon.com/ecs/home?region=${region}#/clusters/${cluster}/services/${serviceName}/details`
}

export function getInstancesLink(service: Service, resources?: AllResourcesOfAccountResponse): string {
  const resource = resources?.response?.[0]
  if (resource?.provider_type === PROVIDER_TYPES.AZURE) {
    return getAzureInstancesLink()
  } else if (resource?.provider_type === PROVIDER_TYPES.GCP) {
    const zone = _defaultTo(resource?.availability_zone, '')
    const name = _defaultTo(resource?.name, '')
    return resources?.response?.length && resources?.response?.length > 1
      ? getGcpInstancesLink()
      : getGcpInstanceDetailsLink(zone, name)
  } else {
    const region = resource?.region || ''
    if (service.kind === GatewayKindType.DATABASE) {
      return getAwsConsoleDatabaseLink(_defaultTo(region, ''), _defaultTo(resource?.name, ''))
    } else if (service.kind === GatewayKindType.CONTAINERS) {
      return getEcsServicesLink(
        _defaultTo(service.routing?.container_svc?.region, ''),
        _defaultTo(service.routing?.container_svc?.cluster, ''),
        _defaultTo(service.routing?.container_svc?.service, '')
      )
    } else {
      const instanceIDs = _defaultTo(
        resources?.response?.map(x => x.id),
        []
      )
      return getAwsConsoleInstancesLink(_defaultTo(region, ''), instanceIDs?.join(','))
    }
  }
}

const gatewayStateMap: { [key: string]: JSX.Element } = {
  down: <StoppedStatusIndicator />,
  active: <RunningStatusIndicator />,
  created: <CreatedStatusIndicator />
}

export function getStateTag(state: string): JSX.Element {
  return gatewayStateMap[state]
}
const PLOT_LINE_LOCATIONS = [11, 22, 33, 44, 55, 66, 77, 88].map(degree => ({
  color: 'white',
  value: degree,
  zIndex: 10
}))
export function getRiskGaugeChartOptions(riskScore: number, disable?: boolean) {
  const gaugeColor = riskScore === -1 || disable ? 'var(--grey-200)' : getColorValue(100 - riskScore, 0, 100)
  riskScore = Math.round(riskScore * 10) / 10
  return {
    chart: {
      height: 50,
      width: 50,
      backgroundColor: 'transparent',
      spacing: [0, 0, 0, 0],
      type: 'solidgauge'
    },
    credits: {
      enabled: false
    },
    title: undefined,
    pane: {
      size: '100%',
      startAngle: -90,
      endAngle: 90,
      background: [
        {
          borderWidth: 0,
          innerRadius: '80%',
          outerRadius: '100%',
          shape: 'arc'
        }
      ]
    },
    tooltip: {
      enabled: false
    },
    xAxis: {
      tickAmount: 0
    },
    plotOptions: {
      gauge: {
        dataLabels: {
          y: 5,
          borderWidth: 0,
          useHTML: true,
          format: '{point.y} %'
        },
        dial: {
          radius: '45%',
          backgroundColor: gaugeColor,
          baseLength: '40%'
        },
        pivot: {
          backgroundColor: 'white',
          borderColor: gaugeColor,
          borderWidth: 1,
          radius: 3
        }
      }
    },
    yAxis: {
      lineWidth: 0,
      minorTickInterval: null,
      min: 0,
      max: 100,
      tickAmount: 0,
      tickColor: 'transparent',
      plotBands: [
        {
          thickness: 5,
          from: 0,
          to: riskScore,
          color: gaugeColor
        },
        {
          thickness: 5,
          from: riskScore,
          to: 100,
          color: '#EEE'
        }
      ],
      plotLines: PLOT_LINE_LOCATIONS,
      labels: {
        enabled: false
      }
    },
    series: [
      {
        name: 'Risk Score',
        type: 'gauge',
        data: [riskScore],
        dashStyle: 'dash'
      }
    ]
  }
}

export function geGaugeChartOptionsWithoutLabel(riskScore: number, mode?: RulesMode) {
  const gaugeColor = riskScore === -1 ? 'var(--grey-200)' : getColorValue(100 - riskScore, 0, 100)
  riskScore = Math.round(riskScore * 10) / 10
  return {
    chart: {
      height: 80,
      width: 50,
      backgroundColor: 'transparent',
      spacing: [0, 0, 0, 0],
      type: 'solidgauge',
      className: mode === RulesMode.DRY ? css.gaugeChartWrapper : ''
    },
    credits: {
      enabled: false
    },
    title: undefined,
    pane: {
      size: '100%',
      startAngle: -90,
      endAngle: 90,
      background: [
        {
          borderWidth: 0,
          innerRadius: '80%',
          outerRadius: '100%',
          shape: 'arc'
        }
      ]
    },
    tooltip: {
      enabled: false
    },
    xAxis: {
      tickAmount: 0
    },
    plotOptions: {
      gauge: {
        dataLabels: {
          enabled: false
        },
        dial: {
          radius: '45%',
          backgroundColor: gaugeColor,
          baseLength: '40%'
        },
        pivot: {
          backgroundColor: 'white',
          borderColor: gaugeColor,
          borderWidth: 1,
          radius: 3
        }
      }
    },
    yAxis: {
      lineWidth: 0,
      minorTickInterval: null,
      min: 0,
      max: 100,
      tickAmount: 0,
      tickColor: 'transparent',
      plotBands: [
        {
          thickness: 5,
          from: 0,
          to: riskScore,
          color: gaugeColor
        },
        {
          thickness: 5,
          from: riskScore,
          to: 100,
          color: '#EEE'
        }
      ],
      plotLines: mode === RulesMode.DRY ? [] : PLOT_LINE_LOCATIONS,
      labels: {
        enabled: false
      }
    },
    series: [
      {
        name: 'Risk Score',
        type: 'gauge',
        data: [riskScore]
      }
    ]
  }
}

export function getDay(t: string, format: string): string {
  return moment(t, format).format('DD-MMM-YYYY')
}

export function getTimestamp(t: string, format: string): string {
  return moment(t, format).format('DD-MMM-YYYY HH:mm:ss')
}

export function getFulfilmentIcon(fulfilment: string): string {
  return fulfilment == 'spot' ? spotIcon : odIcon
}

export function cleanupForHostName(name: string): string {
  const toReplace = [' ', '.', ',']
  toReplace.forEach(l => {
    name = name.split(l).join('-')
  })
  return name
}

export function roundToPrecision(n: number): number {
  return Math.round(n * 100) / 100
}

export const getFilterBodyFromFilterData = (data: { [key: string]: any }) => {
  return Object.entries(data).map(([key, values]) => {
    return {
      field: key,
      operator: 'equals',
      values
    }
  })
}

export const getRuleType = (rule: Service, provider?: Provider) => {
  let type = ''
  if (rule.kind === 'k8s') {
    type = 'ce.co.ruleTypes.k8s'
  } else if (provider?.value === PROVIDER_TYPES.AWS) {
    if (!isEmpty(rule.routing?.container_svc)) {
      type = 'ce.co.ruleTypes.ecs'
    } else if (!isEmpty(rule.routing?.database)) {
      type = 'ce.co.ruleTypes.rds'
    } else if (!isEmpty(rule.routing?.instance?.scale_group)) {
      type = 'ce.co.ruleTypes.asg'
    } else {
      type = 'ce.co.ruleTypes.ec2'
    }
  } else if (provider?.value === PROVIDER_TYPES.AZURE) {
    type = 'ce.co.autoStoppingRule.helpText.step2.description.resourceList.azureVms'
  } else if (provider?.value === PROVIDER_TYPES.GCP) {
    if (!isEmpty(rule.routing?.instance?.scale_group)) {
      type = 'ce.co.ruleTypes.ig'
    } else {
      type = 'ce.co.ruleTypes.gcpVm'
    }
  }
  return type
}

export const isK8sWorkloadRule = (k8sJson: Record<string, any>) => {
  return !isEmpty(k8sJson.spec.ingress) && !isEmpty(k8sJson.spec.istio) && !isEmpty(k8sJson.spec.traefik)
}

export const getManagedResourcesStringId = (rule: Service, provider?: Provider) => {
  let id = ''
  if (rule.kind === 'k8s') {
    const k8sJson = JSON.parse(get(rule, 'routing.k8s.RuleJson', '{}'))
    if (isK8sWorkloadRule(k8sJson)) {
      id = 'workload'
    } else {
      id = 'service'
    }
  } else if (provider?.value === PROVIDER_TYPES.AWS) {
    if (!isEmpty(rule.routing?.container_svc)) {
      id = 'ce.co.resourcesManagedDescription.ecs'
    } else if (!isEmpty(rule.routing?.database)) {
      id = 'ce.co.resourcesManagedDescription.rds'
    } else if (!isEmpty(rule.routing?.instance?.scale_group)) {
      id = 'ce.co.resourcesManagedDescription.asg'
    } else {
      id = 'ce.co.resourcesManagedDescription.ec2'
    }
  } else if (provider?.value === PROVIDER_TYPES.AZURE) {
    id = 'ce.co.resourcesManagedDescription.azureVm'
  } else if (provider?.value === PROVIDER_TYPES.GCP) {
    if (!isEmpty(rule.routing?.instance?.scale_group)) {
      id = 'ce.co.resourcesManagedDescription.gcpVm'
    } else {
      id = 'ce.co.resourcesManagedDescription.gcpVm'
    }
  }
  return id
}
