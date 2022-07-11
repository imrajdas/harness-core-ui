/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { isEmpty as _isEmpty, defaultTo as _defaultTo } from 'lodash-es'
import { ASRuleTabs, GatewayKindType } from '@ce/constants'
import type { RoutingData, Service } from 'services/lw'
import { Utils } from '@ce/common/Utils'
import type { GatewayDetails } from '../COCreateGateway/models'

const tabs = [ASRuleTabs.CONFIGURATION, ASRuleTabs.SETUP_ACCESS, ASRuleTabs.REVIEW]

/* istanbul ignore next */
export const trackPrimaryBtnClick = (
  selectedTabId: string,
  dataToTrack: Record<ASRuleTabs, any>,
  trackEvent: (eventName: string, properties: Record<string, string>) => void
) => {
  switch (selectedTabId) {
    case tabs[0]:
      trackEvent('VisitedSetupAccessPage', {})
      break
    case tabs[1]:
      trackEvent('CompletedSetupAccess', dataToTrack[selectedTabId] || {})
      break
    case tabs[2]:
      trackEvent('AutoStoppingRuleCompleted', {})
      break
  }
}

/* istanbul ignore next */
export const isPrimaryBtnDisable = (
  selectedTabId: string,
  validTabs: { config: boolean; setupAccess: boolean },
  bypassCheck = false
) => {
  if (bypassCheck) {
    return true
  }
  return (
    (selectedTabId === tabs[0] && !validTabs.config) ||
    (selectedTabId === tabs[1] && !validTabs.setupAccess) ||
    (selectedTabId === tabs[2] && (!validTabs.setupAccess || !validTabs.config))
  )
}

/* istanbul ignore next */
export const getServiceObjectFromgatewayDetails = (
  gatewayDetails: GatewayDetails,
  orgIdentifier: string,
  projectIdentifier: string,
  accountId: string,
  serverNames: string[] = []
): Service => {
  const hasInstances = !_isEmpty(gatewayDetails.selectedInstances)
  const isK8sRule = Utils.isK8sRule(gatewayDetails)
  const isGcpProvider = Utils.isProviderGcp(gatewayDetails.provider)

  /* Generating service routing obect from gatewayDetails routing */
  const routing: RoutingData = { ports: gatewayDetails.routing.ports, lb: undefined }
  if ('override_dns_record' in gatewayDetails.routing) {
    routing.override_dns_record = gatewayDetails.routing.override_dns_record
  }
  let kind = GatewayKindType.INSTANCE
  if (isK8sRule) {
    // k8s rule check
    kind = GatewayKindType.KUBERNETES
    routing.k8s = gatewayDetails.routing.k8s
  } else if (hasInstances) {
    // VMs rule check
    const instanceIDs = gatewayDetails.selectedInstances.map(instance => `'${instance.id}'`).join(',')
    let filterText = `id = [${instanceIDs}]`
    if (isGcpProvider) {
      filterText += `\n regions=['${_defaultTo(gatewayDetails.selectedInstances[0].metadata?.availabilityZone, '')}']`
    }
    routing.instance = {
      filter_text: filterText
    }
  } else if (!_isEmpty(gatewayDetails.routing.container_svc)) {
    // ECS rule check
    kind = GatewayKindType.CONTAINERS
    routing.container_svc = gatewayDetails.routing.container_svc
  } else if (!_isEmpty(gatewayDetails.routing.database)) {
    // RDS rule check
    kind = GatewayKindType.DATABASE
    routing.database = gatewayDetails.routing.database
  } else {
    let filterText = ''
    if (isGcpProvider) {
      filterText = `id = ['${gatewayDetails.routing.instance.scale_group?.id}'] \n regions = ['${gatewayDetails.routing.instance.scale_group?.region}']`
      if (!_isEmpty(gatewayDetails.routing.instance.scale_group?.availability_zones)) {
        filterText += `\n zones = ['${gatewayDetails.routing.instance.scale_group?.availability_zones?.[0]}']`
      }
      kind = GatewayKindType.CLUSTERS
    }
    // ASG rule check
    routing.instance = {
      filter_text: filterText,
      scale_group: gatewayDetails.routing.instance.scale_group
    }
  }
  routing.custom_domain_providers = gatewayDetails.routing.custom_domain_providers

  const gateway: Service = {
    name: gatewayDetails.name,
    org_id: orgIdentifier,
    project_id: projectIdentifier,
    account_identifier: accountId,
    fulfilment: Utils.getConditionalResult(isK8sRule, 'kubernetes', gatewayDetails.fullfilment || 'ondemand'),
    kind,
    cloud_account_id: gatewayDetails.cloudAccount.id,
    idle_time_mins: gatewayDetails.idleTimeMins,
    custom_domains: Utils.getAllCustomDomains(serverNames, gatewayDetails.customDomains),
    health_check: gatewayDetails.healthCheck,
    routing,
    opts: {
      ...gatewayDetails.opts,
      preserve_private_ip: false,
      always_use_private_ip: false
    },
    metadata: gatewayDetails.metadata,
    disabled: gatewayDetails.disabled,
    match_all_subdomains: gatewayDetails.matchAllSubdomains,
    access_point_id: gatewayDetails.accessPointID
  }
  if (gatewayDetails.id) {
    gateway.id = gatewayDetails.id
  }
  return gateway
}
