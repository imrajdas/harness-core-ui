/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Button, CardBody, CardSelect, Container, Heading, IconName, Layout, Text } from '@wings-software/uicore'
import { ConnectorReferenceField } from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'
import { Connectors } from '@connectors/constants'
import { useStrings } from 'framework/strings'
import type { ConnectorInfoDTO } from 'services/cd-ng'
import { Utils } from '@ce/common/Utils'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import type { Provider, ProviderWithDependencies } from '../COCreateGateway/models'
import css from './COAPProviderSelector.module.scss'

interface COAPProviderSelectorProps {
  onSubmit: (data: { provider: string; connectorDetails?: string }) => void
  accountId: string
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

const connectorType: Record<string, string> = {
  aws: Connectors.CEAWS,
  azure: Connectors.CE_AZURE,
  gcp: Connectors.CE_GCP
}

const COAPProviderSelector: React.FC<COAPProviderSelectorProps> = props => {
  const { getString } = useStrings()
  const featureFlags = useFeatureFlags()

  const [selectedCard, setSelectedCard] = useState<Provider | null>(null)
  const [connectorDetails, setConnectorDetails] = useState<string>()

  const providerData = React.useMemo(
    () => data.filter(p => Utils.isFFEnabledForResource(p.ffDependencies, featureFlags)),
    [featureFlags]
  )
  return (
    <Layout.Vertical>
      <Container className={css.mainContainer}>
        <Heading level={2}>Select Cloud Provider</Heading>
        <Layout.Horizontal spacing="small" style={{ paddingTop: '29px' }}>
          <CardSelect
            data={providerData}
            selected={selectedCard as Provider}
            className={css.providerCardsContainer}
            onChange={item => {
              if (connectorDetails) setConnectorDetails(undefined)
              setSelectedCard(item)
            }}
            renderItem={(item: Provider) => (
              <Layout.Vertical spacing="small">
                <CardBody.Icon icon={item.icon as IconName} iconSize={28}></CardBody.Icon>
                <Text style={{ textAlign: 'center' }}>{item.name}</Text>
              </Layout.Vertical>
            )}
            cornerSelected={true}
          ></CardSelect>
        </Layout.Horizontal>
        {selectedCard && (
          <ConnectorReferenceField
            name="cloudConnector"
            placeholder={getString('ce.co.accessPoint.select.account')}
            selected={connectorDetails}
            onChange={record => {
              setConnectorDetails?.(record.identifier)
            }}
            accountIdentifier={props.accountId}
            label={getString('ce.co.accessPoint.select.connector')}
            type={selectedCard.value ? (connectorType[selectedCard.value] as ConnectorInfoDTO['type']) : undefined}
          />
        )}
      </Container>
      <Button
        intent={'primary'}
        icon="chevron-right"
        className={css.continueCta}
        onClick={() => props.onSubmit({ provider: selectedCard?.value as string, connectorDetails })}
      >
        Continue
      </Button>
    </Layout.Vertical>
  )
}

export default COAPProviderSelector
