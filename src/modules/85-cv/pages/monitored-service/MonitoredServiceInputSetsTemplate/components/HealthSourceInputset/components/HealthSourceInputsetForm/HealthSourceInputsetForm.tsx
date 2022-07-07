/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { Card, Color, FormInput, MultiTypeInputType, Text } from '@harness/uicore'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { FormConnectorReferenceField } from '@connectors/components/ConnectorReferenceField/FormConnectorReferenceField'
import {
  getLabelByName,
  healthSourceTypeMapping
} from '@cv/pages/monitored-service/MonitoredServiceInputSetsTemplate/MonitoredServiceInputSetsTemplate.utils'
import { spacingMedium } from '@cv/pages/monitored-service/MonitoredServiceInputSetsTemplate/MonitoredServiceInputSetsTemplate.constants'
import NoResultsView from '@templates-library/pages/TemplatesPage/views/NoResultsView/NoResultsView'
import MetricDefinitionInptsetForm from '../MetricDefinitionInptsetForm/MetricDefinitionInptsetForm'
import css from '@cv/pages/monitored-service/MonitoredServiceInputSetsTemplate/MonitoredServiceInputSetsTemplate.module.scss'

interface HealthSourceInputsetFormInterface {
  healthSources: any
  sourceType: string
  isReadOnlyInputSet?: boolean
}

export default function HealthSourceInputsetForm({
  healthSources,
  sourceType,
  isReadOnlyInputSet
}: HealthSourceInputsetFormInterface): JSX.Element {
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const content = healthSources?.map((healthSource: any, index: number) => {
    const spec = healthSource?.spec
    const path = `sources.healthSources.${index}.spec`
    const runtimeInputs = Object.entries(spec)
      .filter(item => item[1] === '<+input>')
      .map(item => {
        return { name: item[0], path: `${path}.${item[0]}` }
      })
    const hasQueries = healthSource?.spec?.queries !== undefined
    const metricDefinitions = hasQueries ? healthSource?.spec?.queries : healthSource?.spec?.metricDefinitions
    return (
      <Card key={`${healthSource?.name}.${index}`} className={css.healthSourceInputSet}>
        <Text font={'normal'} color={Color.BLACK} style={{ paddingBottom: spacingMedium }}>
          {getString('cv.healthSource.nameLabel')}: {healthSource?.name}
        </Text>
        {runtimeInputs?.length || metricDefinitions?.length ? (
          runtimeInputs.reverse().map(input => {
            if (input.name === 'connectorRef' && !isReadOnlyInputSet) {
              return (
                <FormConnectorReferenceField
                  width={400}
                  type={healthSourceTypeMapping(healthSource?.type)}
                  name={input.path}
                  label={
                    <Text color={Color.BLACK} font={'small'} margin={{ bottom: 'small' }}>
                      {getString('connectors.selectConnector')}
                    </Text>
                  }
                  accountIdentifier={accountId}
                  projectIdentifier={projectIdentifier}
                  orgIdentifier={orgIdentifier}
                  placeholder={getString('cv.healthSource.connectors.selectConnector', { sourceType })}
                  tooltipProps={{ dataTooltipId: 'selectHealthSourceConnector' }}
                />
              )
            } else {
              return (
                <>
                  <FormInput.MultiTextInput
                    key={input.name}
                    name={input.path}
                    label={getLabelByName(input.name, getString)}
                    multiTextInputProps={{ allowableTypes: [MultiTypeInputType.FIXED] }}
                  />
                </>
              )
            }
          })
        ) : (
          <NoResultsView minimal={true} text={getString('templatesLibrary.noInputsRequired')} />
        )}
        {Boolean(metricDefinitions?.length) && (
          <MetricDefinitionInptsetForm path={path} metricDefinitions={metricDefinitions} />
        )}
      </Card>
    )
  })

  return content || <></>
}
