/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useRef, useState } from 'react'
import { Button, Layout, StepProps, CardSelect, Icon, IconName, Container, Text } from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { CE_AWS_CONNECTOR_CREATION_EVENTS } from '@connectors/trackingConstants'
import { useStepLoadTelemetry } from '@connectors/common/useTrackStepLoad/useStepLoadTelemetry'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import type { CEAwsConnectorDTO } from './OverviewStep'
import css from '../CreateCeAwsConnector.module.scss'

enum Features {
  VISIBILITY,
  OPTIMIZATION,
  BILLING
}

export type FeaturesString = keyof typeof Features
interface CardData {
  icon: IconName
  text: string
  value: FeaturesString
  heading: string
  prefix: string
  features: string[]
  footer: React.ReactNode
}

interface DefaultCardType extends Omit<CardData, 'value'> {
  value: 'DEFAULT'
}

const useSelectedCards = (featuresEnabled: FeaturesString[]) => {
  const { getString } = useStrings()
  const FeatureCards = useRef<CardData[]>([
    {
      icon: 'ce-visibility',
      text: getString('connectors.ceAzure.chooseRequirements.visibilityCardDesc'),
      value: 'VISIBILITY',
      heading: getString('connectors.ceAws.crossAccountRoleStep1.visible.heading'),
      prefix: getString('connectors.ceAws.crossAccountRoleStep1.visible.prefix'),
      features: [
        getString('connectors.ceAws.crossAccountRoleStep1.visible.feat1'),
        getString('connectors.ceAws.crossAccountRoleStep1.visible.feat2')
      ],
      footer: (
        <>
          {getString('connectors.ceAzure.chooseRequirements.optimization.footer1')}{' '}
          <a
            href="https://docs.harness.io/article/80vbt5jv0q-set-up-cost-visibility-for-aws#aws_ecs_and_resource_inventory_management"
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
          >
            {getString('permissions').toLowerCase()}
          </a>{' '}
          {getString('connectors.ceAws.crossAccountRoleStep1.optimize.footer')}
        </>
      )
    },
    {
      icon: 'nav-settings',
      text: getString('connectors.ceAzure.chooseRequirements.optimizationCardDesc'),
      value: 'OPTIMIZATION',
      heading: getString('common.ce.autostopping'),
      prefix: getString('connectors.ceAws.crossAccountRoleStep1.optimize.prefix'),
      features: [
        getString('connectors.ceAws.crossAccountRoleStep1.optimize.feat1'),
        getString('connectors.ceAzure.chooseRequirements.optimization.feat2'),
        getString('connectors.ceAzure.chooseRequirements.optimization.feat3'),
        getString('connectors.ceAzure.chooseRequirements.optimization.feat4')
      ],
      footer: (
        <>
          {getString('connectors.ceAzure.chooseRequirements.optimization.footer1')}{' '}
          <a
            href="https://docs.harness.io/article/80vbt5jv0q-set-up-cost-visibility-for-aws#aws_resource_optimization_using_auto_stopping_rules"
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
          >
            {getString('permissions').toLowerCase()}
          </a>{' '}
          {getString('connectors.ceAws.crossAccountRoleStep1.optimize.footer')}
        </>
      )
    }
  ]).current

  const [selectedCards, setSelectedCards] = useState<CardData[]>(() => {
    const initialSelectedCards = []
    for (const fe of featuresEnabled) {
      const card = FeatureCards.find(c => c.value === fe)
      if (card) {
        initialSelectedCards.push(card)
      }
    }
    return initialSelectedCards
  })

  return { selectedCards, setSelectedCards, FeatureCards }
}

const CrossAccountRoleStep1: React.FC<StepProps<CEAwsConnectorDTO>> = props => {
  const { getString } = useStrings()
  const { prevStepData, nextStep, previousStep } = props
  const featuresEnabled = prevStepData?.spec?.featuresEnabled || []
  const { selectedCards, setSelectedCards, FeatureCards } = useSelectedCards(featuresEnabled)

  useStepLoadTelemetry(CE_AWS_CONNECTOR_CREATION_EVENTS.LOAD_CHOOSE_REQUIREMENTS)

  const handleSubmit = () => {
    const features: FeaturesString[] = selectedCards.map(card => card.value)
    if (prevStepData?.includeBilling) features.push('BILLING')
    const newspec = {
      crossAccountAccess: { crossAccountRoleArn: '' },
      ...prevStepData?.spec,
      featuresEnabled: features
    }
    const payload = prevStepData
    if (payload) payload.spec = newspec

    trackEvent(ConnectorActions.CENGAwsConnectorCrossAccountRoleStep1Submit, {
      category: Category.CONNECTOR
    })

    nextStep?.(payload)
  }

  const handleprev = () => {
    previousStep?.({ ...(prevStepData as CEAwsConnectorDTO) })
  }

  const handleCardSelection = (item: CardData) => {
    const sc = [...selectedCards]
    const index = sc.indexOf(item)
    if (index > -1) {
      sc.splice(index, 1)
    } else {
      sc.push(item)
    }

    setSelectedCards(sc)
  }

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.CENGAwsConnectorCrossAccountRoleStep1Load, {
    category: Category.CONNECTOR
  })

  return (
    <Layout.Vertical className={css.stepContainer}>
      <Text
        font={{ variation: FontVariation.H3 }}
        tooltipProps={{ dataTooltipId: 'awsConnectorRequirements' }}
        margin={{ bottom: 'large' }}
      >
        {getString('connectors.ceAws.crossAccountRoleStep1.heading')}
      </Text>
      <Text color="grey800">{getString('connectors.ceAws.crossAccountRoleStep1.description')}</Text>
      <Container>
        <Layout.Horizontal className={css.infoCard}>
          <Icon name="info-messaging" size={20} className={css.infoIcon} />
          <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_800}>
            {getString('connectors.ceAws.crossAccountRoleStep1.info')}
          </Text>
        </Layout.Horizontal>
        <div style={{ flex: 1 }}>
          <div className={css.cards}>
            <DefaultCard />
            <CardSelect
              data={FeatureCards}
              selected={selectedCards}
              multi={true}
              className={css.grid}
              onChange={item => {
                handleCardSelection(item)
              }}
              cornerSelected={true}
              renderItem={item => <Card {...item} />}
            />
          </div>
          <Layout.Horizontal className={css.buttonPanel} spacing="small">
            <Button text={getString('previous')} icon="chevron-left" onClick={handleprev}></Button>
            <Button
              type="submit"
              intent="primary"
              text={getString('continue')}
              rightIcon="chevron-right"
              onClick={handleSubmit}
              disabled={!prevStepData?.includeBilling && selectedCards.length == 0}
            />
          </Layout.Horizontal>
        </div>
      </Container>
    </Layout.Vertical>
  )
}

const Card = (props: CardData | DefaultCardType) => {
  const { prefix, icon, heading, features, footer } = props
  return (
    <Container className={css.featureCard}>
      <Layout.Vertical spacing="medium" padding={{ left: 'large', right: 'large' }}>
        <Layout.Horizontal spacing="small">
          <Icon name={icon} size={32} />
          <Container>
            <Text color="grey900" style={{ fontSize: 9, fontWeight: 500 }}>
              {prefix.toUpperCase()}
            </Text>
            <Text color="grey900" style={{ fontSize: 16, fontWeight: 500 }}>
              {heading}
            </Text>
          </Container>
        </Layout.Horizontal>
        <ul className={css.features}>
          {features.map((feat, idx) => {
            return (
              <li key={idx}>
                <Text
                  icon="main-tick"
                  iconProps={{ color: 'green600', size: 12, padding: { right: 'small' } }}
                  font="small"
                  style={{ lineHeight: '20px' }}
                >
                  {feat}
                </Text>
              </li>
            )
          })}
        </ul>
      </Layout.Vertical>
      <Container className={css.footer}>
        <Text font={{ size: 'small', italic: true }} color="grey400">
          {footer}
        </Text>
      </Container>
    </Container>
  )
}

const DefaultCard = () => {
  const { getString } = useStrings()
  const card: DefaultCardType = {
    icon: 'ce-visibility',
    text: getString('connectors.ceAzure.chooseRequirements.visibilityCardDesc'),
    value: 'DEFAULT',
    heading: getString('connectors.costVisibility'),
    prefix: getString('common.aws'),
    features: [
      getString('connectors.ceAws.crossAccountRoleStep1.default.feat1'),
      getString('connectors.ceAzure.chooseRequirements.visibility.feat2'),
      getString('connectors.ceAzure.chooseRequirements.visibility.feat3'),
      getString('connectors.ceAzure.chooseRequirements.visibility.feat4'),
      getString('connectors.ceAzure.chooseRequirements.visibility.feat5')
    ],
    footer: getString('connectors.ceAws.crossAccountRoleStep1.default.footer')
  }

  return (
    <CardSelect
      data={[card]}
      selected={card}
      onChange={() => void 0}
      cornerSelected={true}
      renderItem={item => <Card {...item} />}
      cardClassName={css.defaultCard}
    />
  )
}

export default CrossAccountRoleStep1
