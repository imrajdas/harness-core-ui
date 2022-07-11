/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { isEmpty as _isEmpty, defaultTo as _defaultTo } from 'lodash-es'
import type { SelectOption } from '@wings-software/uicore'
import { Utils } from '@ce/common/Utils'
import type {
  AccessPoint,
  AccessPointCore,
  AccessPointResourcesQueryParams,
  ALBAccessPointCore,
  AzureAccessPointCore,
  FirewallRule,
  ListAccessPointsQueryParams,
  NetworkSecurityGroup,
  TargetGroupMinimal,
  PortConfig,
  GCPAccessPointCore
} from 'services/lw'
import { portProtocolMap } from '@ce/constants'
import type {
  BaseFetchDetails,
  ConnectionMetadata,
  GatewayDetails,
  GetInitialAccessPointDetails,
  GetInitialAzureAccessPoint,
  RuleCreationParams
} from '../COCreateGateway/models'

export const getSelectedTabId = (accessDetails: ConnectionMetadata): string => {
  const accessDetailsToTabIdMap: Record<string, string> = {
    dnsLink: 'dns',
    ssh: 'ssh',
    ipaddress: 'ip',
    rdp: 'rdp',
    backgroundTasks: 'bg'
  }
  const key = Object.entries(accessDetails).find(([, d]) => d.selected)?.[0]
  return key ? accessDetailsToTabIdMap[key] : ''
}

export const areCustomDomainsValid = (customDomains: string[]) =>
  customDomains.every(url =>
    url.match(
      /((https?):\/\/)?(www.)?[a-z0-9-]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#-]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/
    )
  )

export const getValidStatusForDnsLink = (
  gatewayDetails: GatewayDetails,
  domainsToOverride?: string[],
  overrideAgreement?: boolean
): boolean => {
  let validStatus = true
  // check for custom domains validation
  if (gatewayDetails.customDomains?.length) {
    if (!_isEmpty(domainsToOverride) && !overrideAgreement) {
      validStatus = false
    } else {
      validStatus = areCustomDomainsValid(gatewayDetails.customDomains)
      if (
        !gatewayDetails.routing.custom_domain_providers?.others &&
        !gatewayDetails.routing.custom_domain_providers?.route53?.hosted_zone_id
      ) {
        validStatus = false
      }
    }
  }
  // checck for valid access point selected
  if (_isEmpty(gatewayDetails.accessPointID)) {
    validStatus = false
  }

  // check for routing ports
  if (validStatus && _isEmpty(gatewayDetails.routing.container_svc) && _isEmpty(gatewayDetails.routing.ports)) {
    validStatus = false
  }
  return validStatus
}

export const getHelpText = (selectedTabId: string) => {
  let helpTextBase = 'setup-access'
  if (selectedTabId !== '') {
    helpTextBase = `${helpTextBase}-${selectedTabId}`
  }
  return helpTextBase
}

export const getDummySupportedResourceFromAG = (ag: AccessPoint): AccessPointCore => {
  return {
    type: 'app_gateway',
    details: {
      fe_ip_id: ag.metadata?.fe_ip_id,
      id: ag.id,
      name: ag.name,
      region: ag.region,
      resource_group: ag.metadata?.resource_group,
      size: ag.metadata?.size,
      subnet_id: ag.metadata?.subnet_id,
      vpc: ag.vpc
    }
  }
}

export const getDummySupportedResourceFromALB = (alb: AccessPoint): AccessPointCore => {
  return {
    type: 'alb',
    details: {
      albARN: alb.metadata?.albArn,
      name: alb.name,
      security_groups: alb.security_groups,
      vpc: alb.vpc
    }
  }
}

export const getDummyGcpSupportedResourceFromLb = (lb: AccessPoint): AccessPointCore => {
  return {
    type: 'envoy',
    details: {
      id: lb.id,
      name: lb.name,
      security_groups: lb.metadata?.security_groups,
      subnet: lb.metadata?.subnet_name,
      vpc: lb.vpc,
      zone: lb.metadata?.zone
    }
  }
}

export const getDummyResource = (data: AccessPoint, { isAwsProvider, isAzureProvider }: RuleCreationParams) => {
  return isAwsProvider
    ? getDummySupportedResourceFromALB(data)
    : isAzureProvider
    ? getDummySupportedResourceFromAG(data)
    : getDummyGcpSupportedResourceFromLb(data)
}

export const getInitialAccessPointDetails = ({
  gatewayDetails,
  accountId,
  projectId,
  orgId
}: GetInitialAccessPointDetails): AccessPoint => ({
  cloud_account_id: gatewayDetails.cloudAccount.id,
  account_id: accountId,
  project_id: projectId,
  org_id: orgId,
  metadata: {
    security_groups: [],
    dns: {}
  },
  type: gatewayDetails.provider.value,
  region: gatewayDetails.selectedInstances?.length
    ? gatewayDetails.selectedInstances[0].region
    : !_isEmpty(gatewayDetails.routing?.instance?.scale_group?.region)
    ? gatewayDetails.routing?.instance?.scale_group?.region
    : !_isEmpty(gatewayDetails.routing.container_svc)
    ? gatewayDetails.routing.container_svc?.region
    : '',
  vpc: gatewayDetails.selectedInstances?.length
    ? gatewayDetails.selectedInstances[0].vpc
    : !_isEmpty(gatewayDetails.routing?.instance?.scale_group?.target_groups)
    ? (gatewayDetails.routing?.instance?.scale_group?.target_groups as TargetGroupMinimal[])[0].vpc
    : ''
})

export const createApDetailsFromLoadBalancer = ({
  lbDetails,
  gatewayDetails,
  accountId,
  projectId,
  orgId
}: GetInitialAccessPointDetails): AccessPoint => {
  const initialAccessPointDetails = getInitialAccessPointDetails({ gatewayDetails, accountId, projectId, orgId })
  return {
    ...initialAccessPointDetails,
    name: lbDetails?.details?.name,
    ...((lbDetails?.details as ALBAccessPointCore)?.vpc && {
      vpc: (lbDetails?.details as ALBAccessPointCore).vpc
    }),
    metadata: {
      ...initialAccessPointDetails.metadata,
      ...((lbDetails?.details as ALBAccessPointCore)?.security_groups && {
        security_groups: (lbDetails?.details as ALBAccessPointCore).security_groups
      }),
      ...((lbDetails?.details as ALBAccessPointCore)?.albARN && {
        albArn: (lbDetails?.details as ALBAccessPointCore).albARN
      })
    }
  }
}

export const getGcpApFromLoadBalancer = (gatewayDetails: GatewayDetails, accountId: string, lb?: AccessPointCore) => {
  const region = _defaultTo(
    gatewayDetails.routing?.instance?.scale_group?.region,
    gatewayDetails.selectedInstances?.[0]?.region
  )
  const zone = _defaultTo(
    gatewayDetails.routing?.instance?.scale_group?.availability_zones?.[0],
    gatewayDetails.selectedInstances?.[0]?.metadata?.availabilityZone
  )
  return {
    cloud_account_id: gatewayDetails.cloudAccount.id,
    account_id: accountId,
    region: _defaultTo(region, ''),
    vpc: (lb?.details as GCPAccessPointCore)?.vpc,
    type: gatewayDetails.provider.value,
    metadata: {
      zone: _defaultTo(zone, ''),
      security_groups: (lb?.details as GCPAccessPointCore)?.security_groups,
      subnet: (lb?.details as GCPAccessPointCore)?.subnet
    }
  }
}

export const createAzureAppGatewayFromLoadBalancer = (
  { gatewayDetails, accountId, projectId, orgId, lbDetails }: GetInitialAzureAccessPoint,
  isCreateMode: boolean
): AccessPoint => {
  const details = Utils.getConditionalResult(isCreateMode, {}, lbDetails as AzureAccessPointCore)
  return {
    cloud_account_id: gatewayDetails.cloudAccount.id,
    account_id: accountId,
    project_id: projectId,
    org_id: orgId,
    region: details?.region,
    vpc: details?.vpc,
    name: details?.name,
    type: gatewayDetails.provider.value,
    metadata: {
      app_gateway_id: details?.id,
      fe_ip_id: details?.fe_ip_id,
      resource_group: details?.resource_group,
      size: details?.size,
      subnet_id: details?.subnet_id
    }
  }
}

export const getLoadBalancerToEdit = (
  { gatewayDetails, accountId, projectId, orgId, lbDetails }: GetInitialAccessPointDetails,
  { isAwsProvider, isAzureProvider, isCreateMode, isGcpProvider }: RuleCreationParams
) => {
  let lb: AccessPoint = {}
  if (isAwsProvider) {
    lb = isCreateMode
      ? getInitialAccessPointDetails({
          gatewayDetails: gatewayDetails,
          accountId,
          projectId,
          orgId
        })
      : createApDetailsFromLoadBalancer({
          lbDetails,
          gatewayDetails: gatewayDetails,
          accountId,
          projectId,
          orgId
        })
  } else if (isAzureProvider) {
    lb = createAzureAppGatewayFromLoadBalancer(
      {
        gatewayDetails: gatewayDetails,
        accountId,
        lbDetails: lbDetails?.details as AzureAccessPointCore
      },
      _defaultTo(isCreateMode, false)
    )
  } else if (isGcpProvider) {
    lb = getGcpApFromLoadBalancer(gatewayDetails, accountId, lbDetails)
  }
  return lb
}

export const getAccessPointFetchQueryParams = (
  { gatewayDetails, accountId }: BaseFetchDetails,
  isAwsProvider: boolean
): ListAccessPointsQueryParams => {
  const params: ListAccessPointsQueryParams = {
    cloud_account_id: gatewayDetails.cloudAccount.id,
    accountIdentifier: accountId
  }
  if (isAwsProvider) {
    params.region = gatewayDetails.selectedInstances?.length
      ? gatewayDetails.selectedInstances[0].region
      : gatewayDetails.routing.instance.scale_group?.region || ''
    params.vpc = gatewayDetails.selectedInstances?.length
      ? gatewayDetails.selectedInstances[0].vpc
      : gatewayDetails.routing.instance.scale_group?.target_groups?.[0]?.vpc || ''
  }
  return params
}

export const getSupportedResourcesQueryParams = ({
  gatewayDetails,
  accountId
}: BaseFetchDetails): AccessPointResourcesQueryParams => {
  const params: AccessPointResourcesQueryParams = {
    cloud_account_id: gatewayDetails.cloudAccount.id,
    accountIdentifier: accountId,
    region: ''
  }
  if (!_isEmpty(gatewayDetails.routing.container_svc)) {
    params.region = _defaultTo(gatewayDetails.routing.container_svc?.region, '')
    params.cluster = _defaultTo(gatewayDetails.routing.container_svc?.cluster, '')
    params.service = _defaultTo(gatewayDetails.routing.container_svc?.service, '')
  } else {
    params.region = gatewayDetails.selectedInstances?.length
      ? gatewayDetails.selectedInstances[0].region
      : _defaultTo(gatewayDetails.routing.instance.scale_group?.region, '')
    params.resource_group_name = gatewayDetails.selectedInstances[0]?.metadata?.resourceGroup
  }
  return params
}

export const getSecurityGroupsBodyText = (
  gatewayDetails: GatewayDetails,
  { isAzureProvider, isGcpProvider }: RuleCreationParams
): string => {
  const hasInstances = !_isEmpty(gatewayDetails.selectedInstances)
  let text = `id = ['${Utils.getConditionalResult(
    hasInstances,
    gatewayDetails.selectedInstances?.[0]?.id,
    ''
  )}']\nregions = ['${Utils.getConditionalResult(hasInstances, gatewayDetails.selectedInstances?.[0]?.region, '')}']`

  if (isAzureProvider) {
    text += `\nresource_groups=['${Utils.getConditionalResult(
      hasInstances,
      gatewayDetails.selectedInstances?.[0]?.metadata?.resourceGroup,
      ''
    )}']`
  }

  if (isGcpProvider) {
    text += `\nzones=['${_defaultTo(
      gatewayDetails.selectedInstances?.[0]?.metadata?.availabilityZone,
      ''
    )}']\nname='${_defaultTo(gatewayDetails.selectedInstances?.[0]?.name, '')}'`
  }
  return text
}

export const getAllInboundRules = (groups: Array<NetworkSecurityGroup[]>) => {
  const rules: FirewallRule[] = []
  groups.forEach(g => {
    g.forEach(s => {
      s.inbound_rules?.forEach(r => {
        rules.push(r)
      })
    })
  })
  return rules
}

export const getDefinedInboundRules = (rules: FirewallRule[]) => {
  return rules.filter(r => !(r.protocol === '-1' || r.from === '*'))
}

export const getPortConfig = (
  { from, to, protocol }: { from: number; to: number; protocol: string } = { from: 80, to: 80, protocol: 'http' }
): PortConfig => {
  return {
    protocol: protocol,
    port: from,
    action: 'forward',
    target_protocol: protocol,
    target_port: to,
    server_name: '',
    redirect_url: '',
    routing_rules: []
  }
}

export const getDefaultPortConfigs = (): PortConfig[] => {
  return Object.entries(portProtocolMap).map(([port, protocol]) =>
    getPortConfig({ from: Number(port), to: Number(port), protocol })
  )
}

export const getApSelectionList = (
  apCoreResponseList: AccessPointCore[],
  { isAwsProvider, isAzureProvider, isGcpProvider }: RuleCreationParams
): SelectOption[] => {
  return _defaultTo(apCoreResponseList, []).map(_ap => ({
    label: _ap.details?.name as string,
    value: isAwsProvider
      ? ((_ap.details as ALBAccessPointCore)?.albARN as string)
      : isAzureProvider
      ? ((_ap.details as AzureAccessPointCore).id as string)
      : isGcpProvider
      ? ((_ap.details as GCPAccessPointCore).id as string)
      : ''
  }))
}

export const getMatchingLoadBalancer = (
  selectedItem: SelectOption,
  apCoreResponseList: AccessPointCore[],
  { isAwsProvider }: RuleCreationParams
): AccessPointCore | undefined => {
  return apCoreResponseList?.find(_lb =>
    isAwsProvider
      ? selectedItem.value === (_lb.details as ALBAccessPointCore)?.albARN
      : selectedItem.value === (_lb.details as AzureAccessPointCore)?.id
  )
}

export const getLinkedAccessPoint = (
  accessPoints: AccessPoint[],
  isAwsProvider: boolean,
  matchedLb?: AccessPointCore
): AccessPoint | undefined => {
  return accessPoints?.find(_ap =>
    isAwsProvider
      ? _ap.metadata?.albArn === (matchedLb?.details as ALBAccessPointCore)?.albARN
      : (_ap.metadata?.app_gateway_id || _ap.id) === (matchedLb?.details as AzureAccessPointCore)?.id
  )
}

export const isValidLoadBalancer = (
  lb: AccessPointCore,
  accessPoints: AccessPoint[],
  savedAccessPoint: AccessPoint | undefined,
  { isAwsProvider, isAzureProvider, isGcpProvider }: RuleCreationParams
) => {
  let isValid = false
  if (isAwsProvider) {
    isValid = Boolean(
      lb &&
        accessPoints
          ?.map(_ap => _ap.metadata?.albArn)
          ?.filter(_i => _i)
          ?.includes((lb.details as ALBAccessPointCore)?.albARN)
    )
    if (!isValid) {
      isValid = Boolean(lb && savedAccessPoint?.metadata?.albArn === (lb.details as ALBAccessPointCore)?.albARN)
    }
  } else if (isAzureProvider) {
    isValid = Boolean(
      lb &&
        accessPoints
          ?.map(_ap => Utils.getConditionalResult(_ap.status === 'submitted', _ap.id, _ap.metadata?.app_gateway_id))
          .filter(_i => _i)
          .includes((lb.details as AzureAccessPointCore).id)
    )
    if (!isValid) {
      isValid = Boolean(lb && savedAccessPoint?.metadata?.app_gateway_id === (lb.details as AzureAccessPointCore)?.id)
    }
  } else if (isGcpProvider) {
    isValid = Boolean(
      lb &&
        accessPoints
          ?.map(_ap => _ap.id)
          .filter(_i => _i)
          .includes((lb.details as GCPAccessPointCore).id)
    )
    if (!isValid) {
      isValid = Boolean(lb && savedAccessPoint?.id === (lb.details as GCPAccessPointCore)?.id)
    }
  }
  return isValid
}
