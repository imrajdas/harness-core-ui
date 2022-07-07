/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { isEmpty as _isEmpty, omit as _omit, defaultTo as _defaultTo } from 'lodash-es'
import { Radio, RadioGroup } from '@blueprintjs/core'
import { Layout, Text } from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { useStrings } from 'framework/strings'
import { CONFIG_STEP_IDS, CONFIG_TOTAL_STEP_COUNTS, DEFAULT_ACCESS_DETAILS, RESOURCES } from '@ce/constants'
import type { GatewayDetails, InstanceDetails } from '@ce/components/COCreateGateway/models'
import type { StringsMap } from 'stringTypes'
import COK8sClusterSelector from '@ce/components/COK8sClusterSelector/COK8sClusterSelector'
import { ConnectorInfoDTO, ConnectorResponse, useGetConnectorListV2 } from 'services/cd-ng'
import { ASGMinimal, PortConfig, useAllResourcesOfAccount, useGetAllASGs, ContainerSvc, RDSDatabase } from 'services/lw'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useToaster } from '@common/exports'
import COInstanceSelector from '@ce/components/COInstanceSelector/COInstanceSelector'
import COEcsSelector from '@ce/components/COEcsSelector/COEcsSelector'
import COAsgSelector from '@ce/components/COAsgSelector'
import { Connectors } from '@connectors/constants'
import { Utils } from '@ce/common/Utils'
import CORdsSelector from '@ce/components/CORdsSelector/CORdsSelector'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { USER_JOURNEY_EVENTS } from '@ce/TrackingEventsConstants'
import { useGatewayContext } from '@ce/context/GatewayContext'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import COGatewayConfigStep from '../../COGatewayConfigStep'
import { fromResourceToInstanceDetails, isFFEnabledForResource } from '../../helper'
import ResourceSelectionModal from '../../ResourceSelectionModal'
import { DisplaySelectedConnector } from './DisplaySelectedConnector'
import { DisplaySelectedASG } from './DisplaySelectedASG'
import { DisplaySelectedInstances } from './DisplaySelectedInstances'
import { DisplaySelectedEcsService } from './DisplaySelectedEcsService'
import { DisplaySelectedRdsDatabse } from './DisplaySelectedRdsDatabase'
import css from '../../COGatewayConfig.module.scss'

interface ManageResourcesProps {
  setDrawerOpen: (shouldOpen: boolean) => void
  totalStepsCount: number
  gatewayDetails: GatewayDetails
  setGatewayDetails: (details: GatewayDetails) => void
  setTotalStepsCount: (stepCount: number) => void
  selectedResource: RESOURCES | null
  setSelectedResource: (resource: RESOURCES) => void
}

interface ManagedResourecType {
  label: keyof StringsMap
  value: RESOURCES
  providers: string[]
  ffDependencies?: string[]
}

const managedResources: ManagedResourecType[] = [
  {
    label: 'ce.co.autoStoppingRule.helpText.step2.description.resourceList.ec2Vms',
    value: RESOURCES.INSTANCES,
    providers: ['aws']
  },
  {
    label: 'ce.co.autoStoppingRule.helpText.step2.description.resourceList.vms',
    value: RESOURCES.INSTANCES,
    providers: ['azure']
  },
  {
    label: 'ce.co.autoStoppingRule.helpText.step2.description.resourceList.gcpVms',
    value: RESOURCES.INSTANCES,
    providers: ['gcp']
  },
  {
    label: 'ce.co.autoStoppingRule.helpText.step2.description.resourceList.asg',
    value: RESOURCES.ASG,
    providers: ['aws']
  },
  {
    label: 'ce.co.autoStoppingRule.helpText.step2.description.resourceList.ig',
    value: RESOURCES.IG,
    providers: ['gcp']
  },
  {
    label: 'ce.co.autoStoppingRule.helpText.step2.description.resourceList.kubernetes',
    value: RESOURCES.KUBERNETES,
    providers: ['aws', 'azure', 'gcp']
  },
  {
    label: 'ce.co.autoStoppingRule.helpText.step2.description.resourceList.ecsService',
    value: RESOURCES.ECS,
    providers: ['aws']
  },
  {
    label: 'ce.co.autoStoppingRule.helpText.step2.description.resourceList.rdsInstances',
    value: RESOURCES.RDS,
    providers: ['aws']
  }
]

const ManageResources: React.FC<ManageResourcesProps> = props => {
  const { getString } = useStrings()
  const { accountId } = useParams<ProjectPathProps>()
  const { getRBACErrorMessage } = useRBACError()
  const { showError } = useToaster()
  const { trackEvent } = useTelemetry()

  const [allConnectors, setAllConnectors] = useState<ConnectorResponse[]>([])
  const [connectorsToShow, setConnectorsToShow] = useState<ConnectorResponse[]>([])
  const [asgToShow, setAsgToShow] = useState<ASGMinimal[]>([])
  const [allAsg, setAllAsg] = useState<ASGMinimal[]>([])
  const [selectedAsg, setSelectedAsg] = useState<ASGMinimal | undefined>(
    props.gatewayDetails.routing?.instance?.scale_group
  )
  const [allInstances, setAllInstances] = useState<InstanceDetails[]>([])
  const [selectedInstances, setSelectedInstances] = useState<InstanceDetails[]>(props.gatewayDetails.selectedInstances)
  const [selectedConnector, setSelectedConnector] = useState<ConnectorResponse | undefined>()

  const isAzureProvider = Utils.isProviderAzure(props.gatewayDetails.provider)
  const isGcpProvider = Utils.isProviderGcp(props.gatewayDetails.provider)
  const featureFlagsMap = useFeatureFlags()
  const { isEditFlow } = useGatewayContext()

  const { mutate: getInstances, loading: loadingInstances } = useAllResourcesOfAccount({
    account_id: accountId, // eslint-disable-line
    queryParams: {
      cloud_account_id: props.gatewayDetails.cloudAccount.id, // eslint-disable-line
      type: 'instance',
      accountIdentifier: accountId
    }
  })

  const { mutate: fetchAllASGs, loading: loadingFetchASGs } = useGetAllASGs({
    account_id: accountId, // eslint-disable-line
    queryParams: {
      cloud_account_id: props.gatewayDetails.cloudAccount.id, // eslint-disable-line
      accountIdentifier: accountId
    }
  })

  const { mutate: fetchConnectors, loading: loadingConnectors } = useGetConnectorListV2({
    queryParams: {
      accountIdentifier: accountId,
      searchTerm: '',
      pageIndex: 0,
      pageSize: 100
    }
  })

  useEffect(() => {
    if (!props.gatewayDetails.provider) {
      return
    }
    const resourcesFetchMap: Record<string, () => void> = {
      [RESOURCES.ASG]: fetchAndSetAsgItems,
      [RESOURCES.KUBERNETES]: fetchAndSetConnectors
    }
    if (props.selectedResource) {
      resourcesFetchMap[props.selectedResource]?.()
    }
  }, [props.gatewayDetails.provider, props.selectedResource])

  useEffect(() => {
    // run only in case of selecting instances
    if (props.selectedResource === RESOURCES.INSTANCES && !selectedInstances.length) {
      setRoutingRecords([])
    }
  }, [selectedInstances])

  useEffect(() => {
    clearResourceDetailsFromGateway(props.selectedResource as RESOURCES)
  }, [props.selectedResource])

  const resetSelectedInstancesDetails = () => {
    if (!_isEmpty(props.gatewayDetails.selectedInstances)) {
      setRoutingRecords([])
      setSelectedInstances([])
      const updatedGatewayDetails = {
        ...props.gatewayDetails,
        metadata: { ...props.gatewayDetails.metadata, access_details: DEFAULT_ACCESS_DETAILS },
        selectedInstances: []
      }
      props.setGatewayDetails(updatedGatewayDetails)
    }
  }

  const resetSelectedAsgDetails = () => {
    if (!_isEmpty(props.gatewayDetails.routing.instance.scale_group)) {
      setRoutingRecords([])
      setSelectedAsg(undefined)
      const updatedGatewayDetails = {
        ...props.gatewayDetails,
        metadata: { ...props.gatewayDetails.metadata, access_details: DEFAULT_ACCESS_DETAILS }
      }
      delete updatedGatewayDetails.routing.instance.scale_group
      props.setGatewayDetails(updatedGatewayDetails)
    }
  }

  const resetSelectedEcsDetails = () => {
    if (!_isEmpty(props.gatewayDetails.routing.container_svc)) {
      const updatedGatewayDetails: GatewayDetails = {
        ...props.gatewayDetails,
        resourceMeta: undefined,
        routing: { ...props.gatewayDetails.routing, container_svc: undefined }
      }
      props.setGatewayDetails(updatedGatewayDetails)
    }
  }

  const resetSelectedRdsDetails = () => {
    if (!_isEmpty(props.gatewayDetails.routing.database)) {
      const updatedGatewayDetails: GatewayDetails = {
        ...props.gatewayDetails,
        routing: { ...props.gatewayDetails.routing, database: undefined }
      }
      props.setGatewayDetails(updatedGatewayDetails)
    }
  }

  const handleErrorDisplay = (e: any, fallbackMsgKey?: string) => {
    if (!Utils.isUserAbortedRequest(e)) {
      showError(getRBACErrorMessage(e), undefined, fallbackMsgKey)
    }
  }

  const clearResourceDetailsFromGateway = (resourceType: RESOURCES) => {
    const resourceToFunctionalityMap: Record<string, () => void> = {
      [RESOURCES.INSTANCES]: () => {
        // set total no. of steps to default (4)
        props.setTotalStepsCount(
          Utils.getConditionalResult(isGcpProvider, CONFIG_TOTAL_STEP_COUNTS.MODIFIED, CONFIG_TOTAL_STEP_COUNTS.DEFAULT)
        )
        // remove details related to AsG
        resetSelectedAsgDetails()
        resetKubernetesConnectorDetails()
        resetSelectedEcsDetails()
        resetSelectedRdsDetails()
      },
      [RESOURCES.ASG]: () => {
        // set total no. of steps to default (4)
        props.setTotalStepsCount(CONFIG_TOTAL_STEP_COUNTS.DEFAULT)
        // remove details related to instances
        resetSelectedInstancesDetails()
        resetKubernetesConnectorDetails()
        resetSelectedEcsDetails()
        resetSelectedRdsDetails()
      },
      [RESOURCES.IG]: () => {
        // set total no. of steps to default (4)
        props.setTotalStepsCount(CONFIG_TOTAL_STEP_COUNTS.DEFAULT)
        // remove details related to instances
        resetSelectedInstancesDetails()
        resetKubernetesConnectorDetails()
      },
      [RESOURCES.KUBERNETES]: () => {
        // set total no. of steps to modified (3)
        props.setTotalStepsCount(CONFIG_TOTAL_STEP_COUNTS.MODIFIED)
        resetSelectedInstancesDetails()
        resetSelectedAsgDetails()
        resetSelectedEcsDetails()
        resetSelectedRdsDetails()
      },
      [RESOURCES.ECS]: () => {
        props.setTotalStepsCount(CONFIG_TOTAL_STEP_COUNTS.DEFAULT)
        resetSelectedInstancesDetails()
        resetSelectedAsgDetails()
        resetKubernetesConnectorDetails()
        resetSelectedRdsDetails()
      },
      [RESOURCES.RDS]: () => {
        props.setTotalStepsCount(CONFIG_TOTAL_STEP_COUNTS.MODIFIED)
        resetSelectedInstancesDetails()
        resetSelectedAsgDetails()
        resetKubernetesConnectorDetails()
        resetSelectedEcsDetails()
        resetSelectedRdsDetails()
      }
    }

    if (resourceType) {
      resourceToFunctionalityMap[resourceType]?.()
    }
  }

  const resetKubernetesConnectorDetails = () => {
    if (!_isEmpty(props.gatewayDetails.metadata.kubernetes_connector_id)) {
      setSelectedConnector(undefined)
      const updatedRouting = _omit(props.gatewayDetails.routing, 'k8s')
      const updatedMetadata = _omit(props.gatewayDetails.metadata, 'kubernetes_connector_id')
      const updatedGatewayDetails: GatewayDetails = {
        ...props.gatewayDetails,
        routing: updatedRouting,
        metadata: updatedMetadata
      }
      props.setGatewayDetails(updatedGatewayDetails)
    }
  }

  const refreshInstances = async (textTomlString = ''): Promise<void> => {
    try {
      const result = await getInstances(
        { Text: textTomlString },
        {
          queryParams: {
            cloud_account_id: props.gatewayDetails.cloudAccount.id, // eslint-disable-line
            type: 'instance',
            accountIdentifier: accountId
          }
        }
      )
      const instances = _defaultTo(
        result?.response
          ?.filter(x => x.status !== 'terminated')
          .map(item => fromResourceToInstanceDetails(item, { isAzure: isAzureProvider, isGcp: isGcpProvider })),
        []
      )
      setAllInstances(instances)
    } catch (e) {
      handleErrorDisplay(e, 'ce.refetch.instance.error')
    }
  }

  const fetchAndSetAsgItems = async (text = ''): Promise<void> => {
    try {
      const result = await fetchAllASGs({ Text: text })
      if (result?.response) {
        const filteredAsgs = result.response || []
        setAllAsg(filteredAsgs)
        setAsgToShow(filteredAsgs)
      }
    } catch (err) {
      handleErrorDisplay(err, 'ce.fetchAndSetAsgItems.error')
    }
  }

  const fetchAndSetConnectors = async () => {
    try {
      const { data: connectorResponse } = await fetchConnectors({
        filterType: 'Connector',
        types: [Connectors.CE_KUBERNETES]
      })
      const content = connectorResponse?.content
      if (!_isEmpty(content)) {
        setAllConnectors(content as ConnectorResponse[])
        setConnectorsToShow(content as ConnectorResponse[])
        const prevSelectedConnector = (content as ConnectorResponse[]).find(
          _item => _item.connector?.identifier === props.gatewayDetails.metadata.kubernetes_connector_id
        )
        prevSelectedConnector && setSelectedConnector(prevSelectedConnector)
      }
    } catch (e) {
      handleErrorDisplay(e)
    }
  }

  const [openClusterModal, closeClusterModal] = useModalHook(() => {
    return (
      <ResourceSelectionModal
        closeBtnTestId={'close-connector-modal'}
        onClose={() => {
          handleConnectorsSearch('')
          closeClusterModal()
        }}
      >
        <COK8sClusterSelector
          loading={loadingConnectors}
          clusters={connectorsToShow}
          search={handleConnectorsSearch}
          selectedCluster={selectedConnector}
          refetchConnectors={fetchAndSetConnectors}
          onClusterAddSuccess={cluster => {
            const updatedGatewayDetails: GatewayDetails = {
              ...props.gatewayDetails,
              metadata: { ...props.gatewayDetails.metadata, kubernetes_connector_id: cluster.connector?.identifier }
            }
            props.setGatewayDetails(updatedGatewayDetails)
            setSelectedConnector(cluster)
            handleConnectorsSearch('')
            closeClusterModal()
          }}
        />
      </ResourceSelectionModal>
    )
  }, [allConnectors, connectorsToShow, selectedConnector, loadingConnectors, props.gatewayDetails])

  const [openAsgModal, closeAsgModal] = useModalHook(() => {
    return (
      <ResourceSelectionModal
        closeBtnTestId={'close-asg-modal'}
        onClose={() => {
          handleAsgSearch('')
          closeAsgModal()
        }}
      >
        <COAsgSelector
          selectedScalingGroup={selectedAsg}
          setSelectedAsg={setSelectedAsg}
          scalingGroups={asgToShow}
          gatewayDetails={props.gatewayDetails}
          search={handleAsgSearch}
          onAsgAddSuccess={updatedGatewayDetails => {
            props.setGatewayDetails(updatedGatewayDetails)
            handleAsgSearch('')
            closeAsgModal()
          }}
          loading={loadingFetchASGs}
          refresh={fetchAndSetAsgItems}
        />
      </ResourceSelectionModal>
    )
  }, [allAsg, asgToShow, selectedAsg, loadingFetchASGs, props.gatewayDetails])

  const onInstanceModalClose = () => {
    if (isAzureProvider) {
      setAllInstances([])
    }
    closeInstancesModal()
  }

  const [openInstancesModal, closeInstancesModal] = useModalHook(() => {
    return (
      <ResourceSelectionModal closeBtnTestId={'close-instance-modal'} onClose={onInstanceModalClose}>
        <COInstanceSelector
          selectedInstances={selectedInstances}
          setSelectedInstances={setSelectedInstances}
          setGatewayDetails={props.setGatewayDetails}
          instances={allInstances}
          gatewayDetails={props.gatewayDetails}
          onInstancesAddSuccess={onInstanceModalClose}
          loading={loadingInstances}
          refresh={refreshInstances}
          isEditFlow={isEditFlow}
        />
      </ResourceSelectionModal>
    )
  }, [allInstances, selectedInstances, loadingInstances, props.gatewayDetails, isEditFlow])

  const [openEcsModal, closeEcsModal] = useModalHook(
    () => (
      <ResourceSelectionModal
        closeBtnTestId={'close-ecs-modal'}
        onClose={() => {
          closeEcsModal()
        }}
      >
        <COEcsSelector
          gatewayDetails={props.gatewayDetails}
          setGatewayDetails={props.setGatewayDetails}
          onServiceAddSuccess={() => {
            closeEcsModal()
          }}
        />
      </ResourceSelectionModal>
    ),
    [props.gatewayDetails]
  )

  const [openRdsModal, closeRdsModal] = useModalHook(
    () => (
      <ResourceSelectionModal
        closeBtnTestId={'close-rds-modal'}
        onClose={() => {
          closeRdsModal()
        }}
      >
        <CORdsSelector
          gatewayDetails={props.gatewayDetails}
          setGatewayDetails={props.setGatewayDetails}
          onDbAddSuccess={() => {
            closeRdsModal()
          }}
        />
      </ResourceSelectionModal>
    ),
    [props.gatewayDetails]
  )

  const handleAsgSearch = (text: string) => {
    if (!text) {
      setAsgToShow(allAsg)
      return
    }
    text = text.toLowerCase()
    const filteredScalingGroups = allAsg.filter(
      item => item.name?.toLowerCase().includes(text) || item.id?.toLowerCase().includes(text)
    )
    setAsgToShow(filteredScalingGroups)
  }

  const handleConnectorsSearch = (text: string) => {
    if (!text) {
      setConnectorsToShow(allConnectors)
      return
    }
    text = text.toLowerCase()
    const filteredConnectors = allConnectors.filter(item =>
      (item.connector as ConnectorInfoDTO).name?.toLowerCase().includes(text)
    )
    setConnectorsToShow(filteredConnectors)
  }

  const setRoutingRecords = (records: PortConfig[]) => {
    props.setGatewayDetails({ ...props.gatewayDetails, routing: { ...props.gatewayDetails.routing, ports: records } })
  }

  const openSelectedResourceModal = () => {
    const resource = props.selectedResource?.valueOf()
    const modalCbMap: Record<string, () => void> = {
      [RESOURCES.INSTANCES]: openInstancesModal,
      [RESOURCES.ASG]: openAsgModal,
      [RESOURCES.IG]: openAsgModal,
      [RESOURCES.KUBERNETES]: openClusterModal,
      [RESOURCES.ECS]: openEcsModal,
      [RESOURCES.RDS]: openRdsModal
    }
    if (resource) {
      modalCbMap[resource]?.()
    }
  }

  const handleDeletion = (rowIndex: number) => {
    const instances = [...selectedInstances]
    instances.splice(rowIndex, 1)
    if (instances.length) {
      const updatedGatewayDetails = { ...props.gatewayDetails }
      updatedGatewayDetails.selectedInstances = instances
      props.setGatewayDetails(updatedGatewayDetails)
      setSelectedInstances(instances)
    } else {
      resetSelectedInstancesDetails()
    }
  }

  const renderResourcesToManage = () => {
    return managedResources
      .filter(resource => {
        const providerIndex = resource.providers.indexOf(props.gatewayDetails.provider.value)
        return providerIndex > -1 && isFFEnabledForResource(resource.ffDependencies?.[providerIndex], featureFlagsMap)
      })
      .map(resourceItem => {
        return (
          <Radio
            key={resourceItem.value}
            label={getString(resourceItem.label as keyof StringsMap)}
            value={resourceItem.value}
          />
        )
      })
  }

  return (
    <COGatewayConfigStep
      count={2}
      title={getString('ce.co.autoStoppingRule.configuration.step2.title')}
      onInfoIconClick={() => props.setDrawerOpen(true)}
      subTitle={getString('ce.co.autoStoppingRule.configuration.step2.subTitle')}
      totalStepsCount={props.totalStepsCount}
      id={CONFIG_STEP_IDS[1]}
    >
      <Layout.Vertical className={css.step2Container}>
        <Text className={css.radioGroupTitle}>Select the resources to be managed by the rule</Text>
        <RadioGroup
          selectedValue={props.selectedResource?.valueOf()}
          onChange={e => {
            trackEvent(USER_JOURNEY_EVENTS.SELECT_MANAGED_RESOURCES, { type: e.currentTarget.value })
            props.setSelectedResource(e.currentTarget.value as RESOURCES)
          }}
          className={css.radioGroup}
        >
          {renderResourcesToManage()}
        </RadioGroup>
        <DisplayResourceInfo
          selectedResource={props.selectedResource as RESOURCES}
          onCtaClick={openSelectedResourceModal}
        />
        {!_isEmpty(selectedInstances) && (
          <DisplaySelectedInstances data={selectedInstances} onDelete={handleDeletion} />
        )}
        {!_isEmpty(selectedAsg) && <DisplaySelectedASG data={[selectedAsg as ASGMinimal]} />}
        {!_isEmpty(selectedConnector) && <DisplaySelectedConnector data={[selectedConnector as ConnectorResponse]} />}
        {!_isEmpty(props.gatewayDetails.resourceMeta?.container_svc) && (
          <DisplaySelectedEcsService data={[props.gatewayDetails.resourceMeta?.container_svc as ContainerSvc]} />
        )}
        {!_isEmpty(props.gatewayDetails.routing.database) && (
          <DisplaySelectedRdsDatabse data={[props.gatewayDetails.routing.database as RDSDatabase]} />
        )}
      </Layout.Vertical>
    </COGatewayConfigStep>
  )
}

interface DisplayResourceInfoProps {
  selectedResource: RESOURCES
  onCtaClick: () => void
}

const DisplayResourceInfo: React.FC<DisplayResourceInfoProps> = props => {
  const { getString } = useStrings()

  const getSelectedResourceText = (resource: string) => {
    const textMap: Record<string, string> = {
      [RESOURCES.INSTANCES]: getString('ce.co.autoStoppingRule.configuration.step2.additionalResourceInfo.instance'),
      [RESOURCES.ASG]: getString('ce.co.autoStoppingRule.configuration.step2.additionalResourceInfo.asg'),
      [RESOURCES.IG]: getString('ce.co.autoStoppingRule.configuration.step2.additionalResourceInfo.ig'),
      [RESOURCES.KUBERNETES]: getString('ce.co.autoStoppingRule.configuration.step2.additionalResourceInfo.kubernetes'),
      [RESOURCES.ECS]: getString('ce.co.autoStoppingRule.configuration.step2.additionalResourceInfo.ecs'),
      [RESOURCES.RDS]: getString('ce.co.autoStoppingRule.configuration.step2.additionalResourceInfo.rds')
    }
    return textMap[resource]
  }

  const getSelectedResourceModalCta = (resource: string) => {
    const textMap: Record<string, string> = {
      [RESOURCES.INSTANCES]: `+ ${getString('ce.co.autoStoppingRule.configuration.step2.addResourceCta.instance')}`,
      [RESOURCES.ASG]: `+ ${getString('ce.co.autoStoppingRule.configuration.step2.addResourceCta.asg')}`,
      [RESOURCES.IG]: `+ ${getString('ce.co.autoStoppingRule.configuration.step2.addResourceCta.ig')}`,
      [RESOURCES.KUBERNETES]: `+ ${getString('ce.co.autoStoppingRule.configuration.step2.addResourceCta.kubernetes')}`,
      [RESOURCES.ECS]: `+ ${getString('ce.co.autoStoppingRule.configuration.step2.addResourceCta.ecs')}`,
      [RESOURCES.RDS]: `+ ${getString('ce.co.autoStoppingRule.configuration.step2.addResourceCta.rds')}`
    }
    return textMap[resource]
  }

  if (_isEmpty(props.selectedResource)) {
    return null
  }
  return (
    <Layout.Vertical style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 14, color: '#9293AB', marginBottom: 10 }}>
        {getSelectedResourceText(props.selectedResource?.valueOf() as string)}
      </Text>
      <Text style={{ cursor: 'pointer', color: '#0278D5' }} onClick={props.onCtaClick}>
        {getSelectedResourceModalCta(props.selectedResource?.valueOf() as string)}
      </Text>
    </Layout.Vertical>
  )
}

export default ManageResources
