/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Icon, Text, Layout } from '@wings-software/uicore'
import { FontVariation, Color, Spacing } from '@harness/design-system'
import type { MarginProps } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import type { StringsMap } from 'stringTypes'
import { getServicesStates, getServicesTypes } from './ServiceDependenciesLegend.utils'
import css from './ServiceDependenciesLegend.module.scss'
interface ServiceDependenciesLegendProps {
  hideServiceTypeLegend?: boolean
  margin?: Spacing | MarginProps
}

const ServiceDependenciesLegend: React.FC<ServiceDependenciesLegendProps> = ({ hideServiceTypeLegend, margin }) => {
  const { getString } = useStrings()
  const servicesStates = getServicesStates()
  const serviceTypes = getServicesTypes()

  return (
    <Container background={Color.PRIMARY_1} width="fit-content" className={css.container} margin={margin}>
      <Layout.Horizontal flex spacing="medium" height={30} padding={{ left: 'medium', right: 'medium' }}>
        <Text font={{ size: 'small', weight: 'semi-bold' }} color={Color.BLACK_100}>
          {`${getString('cv.monitoredServices.monitoredServiceTabs.serviceHealth' as keyof StringsMap)}:`}
        </Text>
        {servicesStates.map(state => (
          <Container flex key={state.labelId}>
            <Container
              width={8}
              height={8}
              margin={{ right: 'xsmall' }}
              className={css.serviceState}
              style={{ backgroundColor: state.color }}
            />
            <Text font={{ variation: FontVariation.TINY }} color={Color.GREY_700}>
              {getString(state.labelId)}
            </Text>
          </Container>
        ))}
      </Layout.Horizontal>

      {!hideServiceTypeLegend && (
        <Layout.Horizontal
          height={30}
          spacing="medium"
          padding={{ left: 'medium', right: 'medium' }}
          flex={{ justifyContent: 'flex-start' }}
          className={css.serviceTypesContainer}
        >
          {serviceTypes.map(type => (
            <Container flex key={type.labelId}>
              <Icon name={type.icon} size={type.size} color={Color.GREY_600} margin={{ right: 'xsmall' }} />
              <Text font={{ variation: FontVariation.TINY }} color={Color.GREY_700}>
                {getString(type.labelId)}
              </Text>
            </Container>
          ))}
        </Layout.Horizontal>
      )}
    </Container>
  )
}

export default ServiceDependenciesLegend
