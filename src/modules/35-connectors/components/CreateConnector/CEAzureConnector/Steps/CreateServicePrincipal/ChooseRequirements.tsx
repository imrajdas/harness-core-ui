/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useRef } from 'react'
import {
  Button,
  Formik,
  FormikForm,
  Layout,
  ModalErrorHandler,
  StepProps,
  CardSelect,
  Icon,
  IconName,
  Text,
  Container
} from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import type { CEAzureConnector } from 'services/cd-ng'
import { CE_AZURE_CONNECTOR_CREATION_EVENTS } from '@connectors/trackingConstants'
import { useStepLoadTelemetry } from '@connectors/common/useTrackStepLoad/useStepLoadTelemetry'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { Connectors } from '@connectors/constants'
import type { CEAzureDTO } from '../Overview/AzureConnectorOverview'
import css from '../../CreateCeAzureConnector_new.module.scss'

interface CloudFeatures {
  VISIBILITY: boolean
  OPTIMIZATION: boolean
}

interface ICard {
  icon: IconName
  value: 'VISIBILITY' | 'BILLING' | 'OPTIMIZATION'
  prefix: string
  title: string
  features: string[]
  footer: React.ReactNode
}

const useSelectedCards = (featuresEnabled: ICard['value'][]) => {
  const { getString } = useStrings()
  const FeatureCards = useRef<ICard[]>([
    {
      prefix: getString('common.azure'),
      title: getString('connectors.costVisibility'),
      value: 'VISIBILITY',
      icon: 'ce-visibility',
      features: [
        getString('connectors.ceAzure.chooseRequirements.visibility.feat1'),
        getString('connectors.ceAzure.chooseRequirements.visibility.feat2'),
        getString('connectors.ceAzure.chooseRequirements.visibility.feat3'),
        getString('connectors.ceAzure.chooseRequirements.visibility.feat4'),
        getString('connectors.ceAzure.chooseRequirements.visibility.feat5')
      ],
      footer: getString('connectors.ceAzure.chooseRequirements.visibility.footer')
    },
    {
      prefix: getString('connectors.ceAzure.chooseRequirements.optimization.prefix'),
      title: getString('common.ce.autostopping'),
      value: 'OPTIMIZATION',
      icon: 'nav-settings',
      features: [
        getString('connectors.ceAzure.chooseRequirements.optimization.feat1'),
        getString('connectors.ceAzure.chooseRequirements.optimization.feat2'),
        getString('connectors.ceAzure.chooseRequirements.optimization.feat3'),
        getString('connectors.ceAzure.chooseRequirements.optimization.feat4')
      ],
      footer: (
        <>
          {getString('connectors.ceAzure.chooseRequirements.optimization.footer1')}{' '}
          <a
            href="https://docs.harness.io/article/v682mz6qfd-set-up-cost-visibility-for-azure#step_4_create_service_principal_and_assign_permissions"
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
          >
            {getString('permissions').toLowerCase()}
          </a>{' '}
          {getString('connectors.ceAzure.chooseRequirements.optimization.footer2')}
        </>
      )
    }
  ]).current

  const [selectedCards, setSelectedCards] = useState<ICard[]>(() => {
    const initialSelectedCards = [FeatureCards[0]]
    for (const fe of featuresEnabled) {
      const card = FeatureCards.find(c => c.value === fe)
      // VISIBILITY is selected by default and added above already
      if (card && card.value !== 'VISIBILITY') {
        initialSelectedCards.push(card)
      }
    }
    return initialSelectedCards
  })

  return { selectedCards, setSelectedCards, FeatureCards }
}

const ChooseRequirements: React.FC<StepProps<CEAzureDTO>> = props => {
  const { getString } = useStrings()
  const { previousStep, prevStepData, nextStep } = props
  const featuresEnabled = prevStepData?.spec?.featuresEnabled || []
  const { selectedCards, setSelectedCards, FeatureCards } = useSelectedCards(featuresEnabled)
  const includesBilling = !!prevStepData?.spec?.featuresEnabled?.includes('BILLING')

  useStepLoadTelemetry(CE_AZURE_CONNECTOR_CREATION_EVENTS.LOAD_CHOOSE_REQUIREMENT)

  const handleSubmit = () => {
    trackEvent(ConnectorActions.ChooseRequirementsSubmit, {
      category: Category.CONNECTOR,
      connector_type: Connectors.CEAzure
    })

    const features = selectedCards.map(c => c.value)
    if (includesBilling) {
      features.push('BILLING')
    }

    const nextStepData: CEAzureDTO = {
      ...((prevStepData || {}) as CEAzureDTO),
      spec: {
        ...((prevStepData?.spec || {}) as CEAzureConnector),
        featuresEnabled: features
      }
    }

    nextStep?.(nextStepData)
  }

  const handleCardSelection = (item: ICard) => {
    // VISIBILITY is provided by default, and user cannot un-select it
    if (item.value === 'VISIBILITY') return

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
  useTrackEvent(ConnectorActions.ChooseRequirementsLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.CEAzure
  })

  return (
    <Layout.Vertical className={css.stepContainer}>
      <Text
        font={{ variation: FontVariation.H3 }}
        tooltipProps={{ dataTooltipId: 'azureChooseRequirements' }}
        margin={{ bottom: 'large' }}
      >
        {getString('connectors.ceAzure.chooseRequirements.heading')}
      </Text>
      <Text color="grey800">{getString('connectors.ceAzure.chooseRequirements.featureDesc')}</Text>
      <Container>
        <Layout.Horizontal className={css.infoCard}>
          <Icon name="info-messaging" size={20} className={css.infoIcon} />
          <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_800}>
            {getString('connectors.ceAzure.chooseRequirements.info')}
          </Text>
        </Layout.Horizontal>
        <Formik<CloudFeatures>
          initialValues={{
            VISIBILITY: false,
            OPTIMIZATION: false
          }}
          formName="CloudFeaturesSelectionForm"
          onSubmit={handleSubmit}
        >
          {() => (
            <FormikForm>
              <ModalErrorHandler
                bind={() => {
                  return
                }}
              />
              <CardSelect
                data={FeatureCards}
                selected={selectedCards}
                multi={true}
                className={css.grid}
                onChange={handleCardSelection}
                cornerSelected={true}
                renderItem={item => <Card {...item} />}
              />
              <Layout.Horizontal spacing="medium" className={css.continueAndPreviousBtns}>
                <Button text={getString('previous')} icon="chevron-left" onClick={() => previousStep?.(prevStepData)} />
                <Button type="submit" intent="primary" rightIcon="chevron-right" disabled={false}>
                  {getString('continue')}
                </Button>
              </Layout.Horizontal>
            </FormikForm>
          )}
        </Formik>
      </Container>
    </Layout.Vertical>
  )
}

const Card = (props: ICard) => {
  const { prefix, icon, title, features, footer } = props
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
              {title}
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

export default ChooseRequirements
