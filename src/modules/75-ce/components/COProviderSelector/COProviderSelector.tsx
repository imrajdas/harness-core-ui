/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  CardSelect,
  Layout,
  CardBody,
  Button,
  Heading,
  Container,
  Text,
  HarnessDocTooltip
} from '@wings-software/uicore'
import { omit as _omit } from 'lodash-es'
import type { IconName } from '@wings-software/uicore'
import routes from '@common/RouteDefinitions'
import { useStrings } from 'framework/strings'
import type { GatewayDetails, Provider, ProviderWithDependencies } from '@ce/components/COCreateGateway/models'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { Breadcrumbs } from '@common/components/Breadcrumbs/Breadcrumbs'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { USER_JOURNEY_EVENTS } from '@ce/TrackingEventsConstants'
import COGatewayBasics from '../COGatewayBasics/COGatewayBasics'
import COFixedDrawer from '../COGatewayAccess/COFixedDrawer'
import COHelpSidebar from '../COHelpSidebar/COHelpSidebar'
import css from './COProviderSelector.module.scss'

interface COProviderSelectorProps {
  nextTab: () => void
  setGatewayDetails: (gatewayDetails: GatewayDetails) => void
  gatewayDetails: GatewayDetails
  provider?: string
}

const data: ProviderWithDependencies[] = [
  {
    name: 'AWS',
    value: 'aws',
    icon: 'service-aws'
  },
  {
    name: 'Azure',
    value: 'azure',
    icon: 'service-azure'
  },
  {
    name: 'GCP',
    value: 'gcp',
    icon: 'gcp'
  }
]

function getProvider(name: string | unknown): Provider | undefined {
  return data.find(p => p.name === name)
}

const COProviderSelector: React.FC<COProviderSelectorProps> = props => {
  const { getString } = useStrings()
  const { trackEvent } = useTelemetry()
  const [selectedCard, setSelectedCard] = useState<Provider | undefined>(
    getProvider(props.gatewayDetails.provider.name)
  )
  const [cloudAccountID, setCloudAccountID] = useState<string>(props.gatewayDetails.cloudAccount.id)
  const { accountId } = useParams<ProjectPathProps>()

  useEffect(() => {
    if (selectedCard) {
      trackEvent(USER_JOURNEY_EVENTS.SELECT_CLOUD_PROVIDER, { cloudProvider: selectedCard.name })
    }
  }, [selectedCard])

  const clearCloudAccountDetails = (_gatewayDetails: GatewayDetails): void => {
    if (_gatewayDetails.cloudAccount.id) {
      _gatewayDetails.cloudAccount.id = ''
      setCloudAccountID('')
    }
    if (_gatewayDetails.cloudAccount.name) {
      _gatewayDetails.cloudAccount.name = ''
    }
    if (_gatewayDetails.metadata.cloud_provider_details) {
      delete _gatewayDetails.metadata.cloud_provider_details
    }
  }

  return (
    <>
      <Breadcrumbs
        className={css.breadCrumb}
        links={[
          {
            url: routes.toCECORules({ accountId, params: '' }),
            label: getString('ce.co.breadCrumb.rules')
          },
          {
            url: '',
            label: props.gatewayDetails.name || ''
          }
        ]}
      />
      <COFixedDrawer
        topMargin={35}
        content={<COHelpSidebar pageName={'provider-selector'} activeSectionNames={[]} />}
      />
      <Container style={{ margin: '0 auto', paddingTop: 100, paddingLeft: 50 }}>
        <Layout.Vertical spacing="large" padding="large">
          <Heading className={css.title} data-tooltip-id="coGetStarted">
            {getString('common.letsGetYouStarted')}
            <HarnessDocTooltip tooltipId="coGetStarted" useStandAlone={true} />
          </Heading>
          <Heading level={2}>{getString('ce.co.autoStoppingRule.providerSelector.description')}</Heading>
          <Layout.Vertical spacing="small">
            <Layout.Horizontal spacing="small" style={{ paddingTop: '29px' }}>
              <CardSelect
                data={data}
                selected={selectedCard}
                className={css.providersViewGrid}
                onChange={item => {
                  setSelectedCard(item)
                  const updatedGatewayDetails = { ...props.gatewayDetails, provider: _omit(item, 'ffDependencies') }
                  clearCloudAccountDetails(updatedGatewayDetails)
                  props.setGatewayDetails(updatedGatewayDetails)
                }}
                renderItem={item => (
                  <Layout.Vertical spacing="small">
                    <CardBody.Icon className={css.card} icon={item.icon as IconName} iconSize={28}></CardBody.Icon>
                  </Layout.Vertical>
                )}
                cornerSelected={true}
              ></CardSelect>
            </Layout.Horizontal>
            <Layout.Horizontal spacing="medium" className={css.instanceTypeNameGrid}>
              {data.map(provider => {
                return (
                  <Text font={{ align: 'center' }} style={{ fontSize: 11 }} key={provider.value}>
                    {provider.name}
                  </Text>
                )
              })}
            </Layout.Horizontal>
          </Layout.Vertical>
          {selectedCard || props.provider ? (
            <COGatewayBasics
              gatewayDetails={props.gatewayDetails}
              setGatewayDetails={props.setGatewayDetails}
              setCloudAccount={setCloudAccountID}
              provider={props.provider}
            ></COGatewayBasics>
          ) : null}
        </Layout.Vertical>
        <Button
          className={css.footer}
          intent="primary"
          text="Next"
          icon="chevron-right"
          onClick={() => {
            props.nextTab()
          }}
          disabled={!(selectedCard && cloudAccountID)}
        />
      </Container>
    </>
  )
}

export default COProviderSelector
