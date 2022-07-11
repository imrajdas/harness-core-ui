/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import {
  Heading,
  Container,
  Layout,
  Checkbox,
  Icon,
  Tabs,
  Tab,
  Button,
  Text,
  HarnessDocTooltip
} from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { isEmpty as _isEmpty, map as _map, defaultTo as _defaultTo, omit as _omit } from 'lodash-es'
import { Drawer } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import COHelpSidebar from '@ce/components/COHelpSidebar/COHelpSidebar'
import { Utils } from '@ce/common/Utils'
import { useToaster } from '@common/exports'
import { DEFAULT_ACCESS_DETAILS } from '@ce/constants'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { PageSpinner } from '@common/components'
import { Service, useDescribeServiceInContainerServiceCluster } from 'services/lw'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { USER_JOURNEY_EVENTS } from '@ce/TrackingEventsConstants'
import { useGatewayContext } from '@ce/context/GatewayContext'
import DNSLinkSetup from './DNSLinkSetup'
import SSHSetup from './SSHSetup'
import IPSetup from './IPAddressSetup'
import type { ConnectionMetadata, GatewayDetails } from '../COCreateGateway/models'
// import COFixedDrawer from './COFixedDrawer'
import KubernetesRuleYamlEditor from '../COGatewayConfig/KubernetesRuleYamlEditor'
import { getK8sIngressTemplate } from '../COGatewayConfig/GetK8sYamlSchema'
import { getHelpText, getSelectedTabId, getValidStatusForDnsLink } from './helper'
import KubernetesYamlEditorDescription from './KubernetesYamlEditorDescription'
import css from './COGatewayAccess.module.scss'

interface COGatewayAccessProps {
  valid: boolean
  setValidity: (tab: boolean) => void
  gatewayDetails: GatewayDetails
  setGatewayDetails: (gw: GatewayDetails) => void
  activeStepDetails?: { count?: number; tabId?: string } | null
  allServices: Service[]
  serverNames: string[]
  setServerNames: (val: string[]) => void
}

const COGatewayAccess: React.FC<COGatewayAccessProps> = props => {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  const { trackEvent } = useTelemetry()
  const { isEditFlow } = useGatewayContext()
  const isAwsProvider = Utils.isProviderAws(props.gatewayDetails.provider)
  const hasOverrideRoute53Agreement = Boolean(props.gatewayDetails.routing.override_dns_record)

  const [accessDetails, setAccessDetails] = useState<ConnectionMetadata>(
    Utils.getConditionalResult(
      !_isEmpty(props.gatewayDetails.opts.access_details),
      props.gatewayDetails.opts.access_details as ConnectionMetadata,
      DEFAULT_ACCESS_DETAILS
    )
  )
  const [selectedTabId, setSelectedTabId] = useState<string>('')
  const [selectedHelpText, setSelectedHelpText] = useState<string>('')
  const [selectedHelpTextSections, setSelectedHelpTextSections] = useState<string[]>([])
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
  const [domainsToOverlap, setDomainsToOverlap] = useState<string[]>(
    hasOverrideRoute53Agreement ? (props.gatewayDetails.customDomains as string[]) : []
  )
  const [overrideRoute53, setOverrideRoute53] = useState(hasOverrideRoute53Agreement)

  const { data: serviceDescribeData, loading: serviceDataLoading } = useDescribeServiceInContainerServiceCluster({
    account_id: accountId,
    cluster_name: _defaultTo(props.gatewayDetails.routing.container_svc?.cluster, ''),
    service_name: _defaultTo(props.gatewayDetails.routing.container_svc?.service, ''),
    queryParams: {
      accountIdentifier: accountId,
      cloud_account_id: props.gatewayDetails.cloudAccount.id,
      region: _defaultTo(props.gatewayDetails.routing.container_svc?.region, '')
    }
  })

  const isK8sRule = Utils.isK8sRule(props.gatewayDetails)
  const isGcpProvider = Utils.isProviderGcp(props.gatewayDetails.provider)

  useEffect(() => {
    trackEvent(USER_JOURNEY_EVENTS.RULE_CREATION_STEP_2, {})
  }, [])

  useEffect(() => {
    let validStatus = false
    if (
      serviceDescribeData?.response?.loadbalanced === false ||
      !_isEmpty(props.gatewayDetails.routing.database) ||
      !_isEmpty(props.gatewayDetails.routing.container_svc)
    ) {
      validStatus = true
    } else if (accessDetails.dnsLink.selected) {
      validStatus = getValidStatusForDnsLink(props.gatewayDetails, domainsToOverlap, overrideRoute53)
    } else {
      validStatus =
        (isK8sRule && !_isEmpty(props.gatewayDetails.routing.k8s?.RuleJson)) ||
        accessDetails.ipaddress.selected ||
        accessDetails.ssh.selected ||
        accessDetails.backgroundTasks.selected ||
        accessDetails.rdp.selected
    }
    props.setValidity(validStatus)

    props.setGatewayDetails({
      ...props.gatewayDetails,
      ...(!accessDetails.dnsLink.selected && !_isEmpty(props.gatewayDetails.customDomains) && { customDomains: [] }),
      ...(!accessDetails.dnsLink.selected &&
        !_isEmpty(props.gatewayDetails.accessPointData) && { accessPointData: undefined, accessPointID: '' }), // remove Access point details on deselection of dnslink option
      opts: { ...props.gatewayDetails.opts, access_details: accessDetails },
      routing: {
        ...(!accessDetails.dnsLink.selected
          ? _omit(props.gatewayDetails.routing, 'custom_domain_providers')
          : props.gatewayDetails.routing),
        ...(!accessDetails.dnsLink.selected && !_isEmpty(props.gatewayDetails.routing.ports) && { ports: [] }) // empty the ports on deselection of dnslink option & if there were already saved values
      }
    })
  }, [
    accessDetails,
    props.gatewayDetails.customDomains,
    props.gatewayDetails.accessPointID,
    props.gatewayDetails.routing.ports,
    props.gatewayDetails.routing.k8s?.RuleJson,
    props.gatewayDetails.routing.container_svc,
    serviceDescribeData?.response,
    props.gatewayDetails.routing.database,
    domainsToOverlap,
    overrideRoute53
  ])

  useEffect(() => {
    setSelectedTabId(getSelectedTabId(accessDetails))
  }, [accessDetails])

  useEffect(() => {
    setSelectedHelpText(getHelpText(selectedTabId))
  }, [selectedTabId])

  const isAccessSetupNotRequired = () => {
    return (
      (!serviceDataLoading &&
        !_isEmpty(serviceDescribeData?.response) &&
        serviceDescribeData?.response?.loadbalanced === false) ||
      !_isEmpty(props.gatewayDetails.routing.database)
    )
  }

  const getEmptyAccessSetupText = () => {
    return Utils.getConditionalResult(
      !_isEmpty(props.gatewayDetails.routing.database),
      getString('ce.co.autoStoppingRule.setupAccess.noSetupRequiredForRds.title'),
      getString('ce.co.autoStoppingRule.setupAccess.noSetupRequired', { name: 'ECS' })
    )
  }

  const tooltipId = Utils.getConditionalResult(isAwsProvider, 'awsSetupAccess', 'azureSetupAccess')

  const shouldShowSshOption = isGcpProvider
    ? _isEmpty(props.gatewayDetails.routing.instance.scale_group)
    : _isEmpty(props.gatewayDetails.routing.container_svc)

  if (serviceDataLoading) {
    return (
      <Layout.Horizontal>
        <PageSpinner />
      </Layout.Horizontal>
    )
  }

  if (isAccessSetupNotRequired()) {
    return (
      <Container className={css.page}>
        {!_isEmpty(props.gatewayDetails.routing.database) ? (
          <RDSSetupAccessInfo />
        ) : (
          <Text>{getEmptyAccessSetupText()}</Text>
        )}
      </Container>
    )
  }

  return (
    <Container className={css.page}>
      {/* <COFixedDrawer
        topMargin={86}
        content={
          <COHelpSidebar
            key={selectedHelpTextSections.join()}
            pageName={selectedHelpText}
            activeSectionNames={selectedHelpTextSections}
            customDomain={props.gatewayDetails.customDomains?.join(',')}
            hostName={props.gatewayDetails.hostName}
          />
        }
      /> */}
      <Drawer
        autoFocus={true}
        enforceFocus={true}
        hasBackdrop={true}
        usePortal={true}
        canOutsideClickClose={true}
        canEscapeKeyClose={true}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
        }}
        size="392px"
        style={{
          // top: '85px',
          boxShadow: 'rgb(40 41 61 / 4%) 0px 2px 8px, rgb(96 97 112 / 16%) 0px 16px 24px',
          height: '100vh',
          overflowY: 'scroll'
        }}
      >
        <Container style={{ textAlign: 'right' }}>
          <Button icon="cross" minimal onClick={_ => setDrawerOpen(false)} />
        </Container>
        <COHelpSidebar
          key={selectedHelpTextSections.join()}
          pageName={selectedHelpText}
          activeSectionNames={selectedHelpTextSections}
          customDomain={props.gatewayDetails.customDomains?.join(',')}
          hostName={props.gatewayDetails.hostName}
          showSshOption={shouldShowSshOption}
        />
      </Drawer>
      <Layout.Vertical spacing="large" padding="medium" style={{ marginLeft: '10px' }}>
        <Layout.Vertical spacing="small" padding="medium">
          <Layout.Horizontal spacing="small">
            <Heading
              level={2}
              font={{ weight: 'semi-bold' }}
              className={css.setupAccessHeading}
              data-tooltip-id={tooltipId}
            >
              {getString('ce.co.autoStoppingRule.setupAccess.pageName')}
              <HarnessDocTooltip tooltipId={tooltipId} useStandAlone={true} />
            </Heading>
          </Layout.Horizontal>
          {/* <Heading level={3} font={{ weight: 'light' }} className={css.setupAccessSubHeading}>
            {getString('ce.co.gatewayAccess.subtitle')}
          </Heading> */}
        </Layout.Vertical>
        <K8sRuleAccessDetails
          gatewayDetails={props.gatewayDetails}
          setGatewayDetails={props.setGatewayDetails}
          allServices={props.allServices}
        />
        {!isK8sRule && (
          <Layout.Vertical spacing="small" padding="medium">
            <Layout.Horizontal spacing="small">
              <Heading level={3} font={{ weight: 'light' }} className={css.setupAccessSubHeading}>
                {getString('ce.co.gatewayAccess.accessDescription', {
                  optionalText: Utils.getConditionalResult(
                    !_isEmpty(props.gatewayDetails.routing.container_svc),
                    '(optional)',
                    ''
                  )
                })}
              </Heading>
              <Icon name="info" style={{ cursor: 'pointer' }} onClick={() => setDrawerOpen(true)}></Icon>
            </Layout.Horizontal>
            <Layout.Horizontal spacing="xxxlarge">
              <Layout.Vertical spacing="medium" style={{ paddingLeft: 'var(--spacing-small)' }}>
                <Checkbox
                  id="DNSLink"
                  label="DNS Link"
                  onChange={val => {
                    setAccessDetails({ ...accessDetails, dnsLink: { selected: val.currentTarget.checked } })
                  }}
                  className={css.checkbox}
                  defaultChecked={accessDetails.dnsLink.selected}
                  disabled={isEditFlow}
                />
                {shouldShowSshOption && (
                  <Checkbox
                    label="SSH / RDP"
                    id="ssh"
                    onChange={val => {
                      setAccessDetails({ ...accessDetails, ssh: { selected: val.currentTarget.checked } })
                    }}
                    className={css.checkbox}
                    defaultChecked={accessDetails.ssh.selected}
                  />
                )}
              </Layout.Vertical>
            </Layout.Horizontal>
          </Layout.Vertical>
        )}
        {!isK8sRule && (
          <SetupAccessTabs
            gatewayDetails={props.gatewayDetails}
            selectedTabId={selectedTabId}
            accessDetails={accessDetails}
            setSelectedTabId={setSelectedTabId}
            tabComponentsMap={{
              dnsLink: (
                <Tab
                  id="dns"
                  title={getString('ce.co.gatewayAccess.dnsLink')}
                  panel={
                    <DNSLinkSetup
                      gatewayDetails={props.gatewayDetails}
                      setHelpTextSections={setSelectedHelpTextSections}
                      setGatewayDetails={props.setGatewayDetails}
                      onInfoIconClick={() => setDrawerOpen(true)}
                      activeStepDetails={props.activeStepDetails}
                      serverNames={props.serverNames}
                      setServerNames={props.setServerNames}
                      overrideRoute53={overrideRoute53}
                      setOverrideRoute53={setOverrideRoute53}
                      domainsToOverlap={domainsToOverlap}
                      setDomainsToOverlap={setDomainsToOverlap}
                    />
                  }
                ></Tab>
              ),
              ssh: <Tab id="ssh" title={getString('ce.co.gatewayAccess.sshRdp')} panel={<SSHSetup />}></Tab>,
              ipaddress: <Tab id="ip" title={getString('ce.co.gatewayAccess.ip')} panel={<IPSetup />}></Tab>,
              backgroundTasks: (
                <Tab id="bg" title={getString('ce.co.gatewayAccess.backgroundTasks')} panel={<IPSetup />}></Tab>
              ),
              rdp: <Tab id="rdp" title={getString('ce.co.gatewayAccess.rdp')} panel={<IPSetup />}></Tab>
            }}
          />
        )}
      </Layout.Vertical>
    </Container>
  )
}

interface K8sRuleAccessDetailsProps {
  gatewayDetails: GatewayDetails
  setGatewayDetails: (details: GatewayDetails) => void
  allServices: Service[]
}

const K8sRuleAccessDetails: React.FC<K8sRuleAccessDetailsProps> = ({
  gatewayDetails,
  setGatewayDetails,
  allServices
}) => {
  const { getString } = useStrings()
  const { showSuccess, showError } = useToaster()
  const { isEditFlow } = useGatewayContext()
  const [yamlData, setYamlData] = useState<Record<any, any>>(
    gatewayDetails.routing.k8s?.RuleJson ? JSON.parse(gatewayDetails.routing.k8s.RuleJson) : undefined
  )

  const isK8sRule = Utils.isK8sRule(gatewayDetails)

  useEffect(() => {
    yamlData && syncYamlAndGatewayDetails(yamlData, 'gateway', true)
  }, [gatewayDetails.name, gatewayDetails.idleTimeMins, gatewayDetails.opts.hide_progress_page, gatewayDetails.deps])

  /**
   * function to update yaml & gatewayDetails with correct information
   * @param _data yaml Data Object
   * @param resourceToUpdateWith name to pick for updation
   * @param disableSuccessMsg enable/disable success message (optional)
   */
  const syncYamlAndGatewayDetails = (
    _data: Record<any, any>,
    resourceToUpdateWith: 'yaml' | 'gateway' = 'yaml',
    disableSuccessMsg = false
  ) => {
    try {
      const yamlRuleName = _data?.metadata?.name
      const updatedName = Utils.getHyphenSpacedString(gatewayDetails.name)
      if (isEditFlow && yamlRuleName !== updatedName) {
        throw new Error('Name cannot be edited')
      }
      const nameToReplace = Utils.getConditionalResult(resourceToUpdateWith === 'yaml', yamlRuleName, updatedName)
      const namespace = _data.metadata?.namespace || 'default'
      const hideProgressPage =
        resourceToUpdateWith === 'gateway' ? gatewayDetails.opts.hide_progress_page : _data.spec.hideProgressPage
      const idleTime = resourceToUpdateWith === 'gateway' ? gatewayDetails.idleTimeMins : _data.spec.idleTimeMins
      const yamlToSave = {
        ..._data,
        metadata: {
          ..._data.metadata,
          name: nameToReplace,
          namespace
        },
        spec: {
          ..._data?.spec,
          idleTimeMins: idleTime,
          hideProgressPage,
          ...(resourceToUpdateWith === 'gateway' && {
            dependencies: Utils.fromServiceToYamlDependencies(allServices, gatewayDetails.deps)
          })
        }
      }
      setYamlData(yamlToSave)
      const updatedGatewayDetails: GatewayDetails = {
        ...gatewayDetails,
        ...(yamlRuleName !== updatedName && { name: nameToReplace }),
        idleTimeMins: idleTime,
        routing: {
          ...gatewayDetails.routing,
          k8s: {
            RuleJson: JSON.stringify(yamlToSave),
            ConnectorID: gatewayDetails.metadata.kubernetes_connector_id as string,
            Namespace: namespace
          }
        },
        ...(resourceToUpdateWith === 'yaml' && {
          deps: Utils.fromYamlToServiceDependencies(allServices, _data?.spec?.dependencies)
        }),
        opts: {
          ...gatewayDetails.opts,
          hide_progress_page: hideProgressPage
        }
      }
      setGatewayDetails(updatedGatewayDetails)
      !disableSuccessMsg && showSuccess(getString('ce.savedYamlSuccess'))
    } catch (e) {
      showError(e.message)
    }
  }

  const getYamlExistingData = () => {
    return (
      yamlData ||
      getK8sIngressTemplate({
        name: gatewayDetails.name,
        idleTime: gatewayDetails.idleTimeMins,
        cloudConnectorId: gatewayDetails.cloudAccount.id,
        hideProgressPage: gatewayDetails.opts.hide_progress_page,
        deps: Utils.fromServiceToYamlDependencies(allServices, gatewayDetails.deps)
      })
    )
  }

  if (!isK8sRule) {
    return null
  }

  return (
    <Container>
      <Text className={css.titleHelpTextDescription}>{getString('ce.co.gatewayConfig.k8sroutingDescription')}</Text>
      <KubernetesYamlEditorDescription />
      <KubernetesRuleYamlEditor
        existingData={getYamlExistingData()}
        fileName={gatewayDetails.name && `${gatewayDetails.name.split(' ').join('-')}-autostopping.yaml`}
        handleSave={syncYamlAndGatewayDetails}
      />
    </Container>
  )
}

interface SetupAccessTabsProps {
  gatewayDetails: GatewayDetails
  accessDetails: ConnectionMetadata
  selectedTabId: string
  setSelectedTabId: (id: string) => void
  tabComponentsMap: Record<keyof ConnectionMetadata, JSX.Element>
}

const SetupAccessTabs: React.FC<SetupAccessTabsProps> = props => {
  const { selectedTabId, setSelectedTabId, tabComponentsMap, accessDetails } = props

  return (
    <Container className={css.setupTab}>
      <Tabs id="setupTabs" selectedTabId={selectedTabId} onChange={setSelectedTabId}>
        {_map(tabComponentsMap, (component, id: keyof ConnectionMetadata) => {
          const detail = accessDetails?.[id]
          if (detail?.selected) {
            return component
          }
          return null
        })}
      </Tabs>
    </Container>
  )
}

const RDSSetupAccessInfo = () => {
  const { getString } = useStrings()
  return (
    <Layout.Vertical spacing="large">
      <Heading level={2}>{getString('ce.co.autoStoppingRule.setupAccess.noSetupRequiredForRds.title')}</Heading>
      <Text>{getString('ce.co.autoStoppingRule.setupAccess.noSetupRequiredForRds.example1.title')}</Text>
      <ul>
        <li>
          <Text>{getString('ce.co.autoStoppingRule.setupAccess.noSetupRequiredForRds.example1.listPointer1')}</Text>
        </li>
        <li>
          <Text>{getString('ce.co.autoStoppingRule.setupAccess.noSetupRequiredForRds.example1.listPointer2')}</Text>
          <ul>
            <li>{getString('ce.co.autoStoppingRule.setupAccess.noSetupRequiredForRds.example1.subListPointer1')}</li>
            <li>{getString('ce.co.autoStoppingRule.setupAccess.noSetupRequiredForRds.example1.subListPointer2')}</li>
            <li>{getString('ce.co.autoStoppingRule.setupAccess.noSetupRequiredForRds.example1.subListPointer3')}</li>
            <li>{getString('ce.co.autoStoppingRule.setupAccess.noSetupRequiredForRds.example1.subListPointer4')}</li>
            <li>{getString('ce.co.autoStoppingRule.setupAccess.noSetupRequiredForRds.example1.subListPointer5')}</li>
          </ul>
        </li>
      </ul>
      <Text>{getString('ce.co.autoStoppingRule.setupAccess.noSetupRequiredForRds.example2.title')}</Text>
      <ul>
        <li>
          <Text>{getString('ce.co.autoStoppingRule.setupAccess.noSetupRequiredForRds.example2.listPointer1')}</Text>
        </li>
      </ul>
      <Text>{getString('ce.co.autoStoppingRule.setupAccess.noSetupRequiredForRds.example3.title')}</Text>
      <ul>
        <li>
          <Text>{getString('ce.co.autoStoppingRule.setupAccess.noSetupRequiredForRds.example3.listPointer1')}</Text>
        </li>
        <li>
          <Text>{getString('ce.co.autoStoppingRule.setupAccess.noSetupRequiredForRds.example3.listPointer2')}</Text>
        </li>
      </ul>
    </Layout.Vertical>
  )
}

export default COGatewayAccess
