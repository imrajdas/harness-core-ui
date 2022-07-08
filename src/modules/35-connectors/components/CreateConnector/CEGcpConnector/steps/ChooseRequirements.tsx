/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useLayoutEffect, useRef } from 'react'
import { defaultTo, times } from 'lodash-es'
import { Button, CardSelect, Heading, Layout, StepProps, Text } from '@harness/uicore'
import { StringKeys, useStrings } from 'framework/strings'
import {
  useSelectCards,
  RequirementCard,
  CardData,
  FeaturesString
} from '@connectors/common/RequirementCard/RequirementCard'
import type { GcpCloudCostConnector } from 'services/cd-ng'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions, ConnectorTypes } from '@common/constants/TrackingConstants'
import type { CEGcpConnectorDTO } from './OverviewStep'
import css from '../CreateCeGcpConnector.module.scss'

const ChooseRequirements: React.FC<StepProps<CEGcpConnectorDTO>> = ({ prevStepData, nextStep, previousStep }) => {
  const { getString } = useStrings()
  const featuresEnabled = prevStepData?.spec?.featuresEnabled || []

  const featureCards = useRef<CardData[]>([
    {
      icon: 'ce-visibility',
      text: getString('connectors.ceAzure.chooseRequirements.visibilityCardDesc'),
      value: 'BILLING',
      heading: getString('connectors.costVisibility'),
      prefix: getString('connectors.ceGcp.gcp').toUpperCase(),
      isDefaultSelected: true,
      features: times(5, i =>
        getString(`connectors.ceGcp.chooseRequirements.cardDetails.billing.feat${i + 1}` as StringKeys)
      ),
      footer: getString('connectors.ceGcp.chooseRequirements.cardDetails.billing.footer')
    },
    {
      icon: 'ce-visibility',
      text: getString('connectors.ceAzure.chooseRequirements.visibilityCardDesc'),
      value: 'VISIBILITY',
      heading: getString('connectors.ceAws.crossAccountRoleStep1.visible.heading'),
      prefix: getString('connectors.ceGcp.gcp'),
      isDefaultSelected: false,
      features: times(2, i =>
        getString(`connectors.ceGcp.chooseRequirements.cardDetails.visibility.feat${i + 1}` as StringKeys)
      ),
      footer: (
        <>
          {getString('connectors.ceAzure.chooseRequirements.optimization.footer1')}{' '}
          <a
            href="https://docs.harness.io/article/kxnsritjls-set-up-cost-visibility-for-gcp"
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
          >
            {getString('permissions').toLowerCase()}
          </a>{' '}
          {getString('connectors.ceGcp.chooseRequirements.cardDetails.optimization.footer')}
        </>
      )
    },
    {
      icon: 'nav-settings',
      text: getString('connectors.ceAzure.chooseRequirements.optimizationCardDesc'),
      value: 'OPTIMIZATION',
      heading: getString('common.ce.autostopping'),
      prefix: getString('connectors.ceGcp.chooseRequirements.cardDetails.optimization.prefix'),
      isDefaultSelected: false,
      features: times(4, i =>
        getString(`connectors.ceGcp.chooseRequirements.cardDetails.optimization.feat${i + 1}` as StringKeys)
      ),
      footer: (
        <>
          {getString('connectors.ceAzure.chooseRequirements.optimization.footer1')}{' '}
          <a
            href="https://docs.harness.io/article/kxnsritjls-set-up-cost-visibility-for-gcp"
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
          >
            {getString('permissions').toLowerCase()}
          </a>{' '}
          {getString('connectors.ceGcp.chooseRequirements.cardDetails.optimization.footer')}
        </>
      )
    }
  ]).current

  const { selectedCards, setSelectedCards } = useSelectCards({ featuresEnabled, featureCards })

  useLayoutEffect(() => {
    const defaultSelectedCard = document.querySelector('.bp3-card.Card--selected')
    if (defaultSelectedCard) {
      defaultSelectedCard.classList.add(css.defaultCard)
    }
  }, [])

  const handleSubmit = () => {
    trackEvent(ConnectorActions.ChooseRequirementsSubmit, {
      category: Category.CONNECTOR,
      connector_type: ConnectorTypes.CEGcp
    })
    let features: FeaturesString[] = selectedCards.map(card => card.value)
    if (!prevStepData?.includeBilling) {
      features = features.filter(item => item !== 'BILLING')
    }
    const newspec: GcpCloudCostConnector = {
      projectId: '',
      ...prevStepData?.spec,
      featuresEnabled: features,
      serviceAccountEmail: defaultTo(prevStepData?.serviceAccount, '')
    }
    const payload = prevStepData
    if (payload) {
      payload.spec = newspec
    }
    nextStep?.(payload)
  }

  const handleprev = () => {
    previousStep?.({ ...(prevStepData as CEGcpConnectorDTO) })
  }

  const handleCardSelection = (item: CardData) => {
    if (!item.isDefaultSelected) {
      const sc = [...selectedCards]
      const index = sc.indexOf(item)
      if (index > -1) {
        sc.splice(index, 1)
      } else {
        sc.push(item)
      }

      setSelectedCards(sc)
    }
  }

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.ChooseRequirementsLoad, {
    category: Category.CONNECTOR,
    connector_type: ConnectorTypes.CEGcp
  })

  return (
    <Layout.Vertical className={css.stepContainer}>
      <Heading level={2} className={css.header}>
        {getString('connectors.ceGcp.chooseRequirements.heading')}
        <span>{getString('connectors.ceGcp.chooseRequirements.choosePermissions')}</span>
      </Heading>
      <Text color="grey800">{getString('connectors.ceGcp.chooseRequirements.description')}</Text>
      <Layout.Vertical spacing={'medium'}>
        <Text font={{ italic: true }}>{getString('connectors.ceGcp.chooseRequirements.info')}</Text>
        <div>
          <CardSelect
            data={featureCards}
            selected={selectedCards}
            multi={true}
            className={css.cardsGrid}
            onChange={item => {
              handleCardSelection(item)
            }}
            cornerSelected={true}
            renderItem={item => <RequirementCard {...item} />}
          />
          <Layout.Horizontal className={css.buttonPanel} spacing="small">
            <Button text={getString('previous')} icon="chevron-left" onClick={handleprev}></Button>
            <Button
              type="submit"
              intent="primary"
              text={getString('continue')}
              rightIcon="chevron-right"
              onClick={handleSubmit}
              disabled={!prevStepData?.includeBilling && selectedCards.length === 0}
            />
          </Layout.Horizontal>
        </div>
      </Layout.Vertical>
    </Layout.Vertical>
  )
}

export default ChooseRequirements
