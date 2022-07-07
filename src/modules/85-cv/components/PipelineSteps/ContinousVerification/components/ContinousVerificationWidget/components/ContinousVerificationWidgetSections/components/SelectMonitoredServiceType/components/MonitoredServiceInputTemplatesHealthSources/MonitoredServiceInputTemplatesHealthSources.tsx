/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Card, Color, FormInput, Layout, MultiTypeInputType, Text } from '@harness/uicore'
import React from 'react'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import {
  getLabelByName,
  getNestedFields
} from '@cv/pages/monitored-service/CVMonitoredService/MonitoredServiceInputSetsTemplate.utils'
import NoResultsView from '@templates-library/pages/TemplatesPage/views/NoResultsView/NoResultsView'
import type { PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import type { TemplateInputs } from '@cv/components/PipelineSteps/ContinousVerification/types'
import { spacingMedium } from './MonitoredServiceInputTemplatesHealthSources.constants'

interface MonitoredServiceInputTemplatesHealthSourcesProps {
  templateIdentifier: string
  versionLabel: string
  allowableTypes: MultiTypeInputType[]
  healthSources: TemplateInputs['sources']['healthSources']
}

export default function MonitoredServiceInputTemplatesHealthSources(
  props: MonitoredServiceInputTemplatesHealthSourcesProps
): JSX.Element {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<PipelineType<ProjectPathProps>>()
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const { allowableTypes, healthSources } = props

  return (
    <>
      {healthSources?.map((healthSource: any, index: number) => {
        const spec = healthSource?.spec || {}
        const path = `sources.healthSources.${index}.spec`
        const fields = Object.entries(spec).map(item => {
          return { name: item[0], path: `${path}.${item[0]}` }
        })
        const metricDefinitions = healthSource?.spec?.metricDefinitions
        return (
          <Card key={`${healthSource?.name}.${index}`}>
            <Text font={'normal'} color={Color.BLACK} style={{ paddingBottom: spacingMedium }}>
              {/* TODO - healthsource name should also be persisted in templateData */}
              {getString('cv.healthSource.nameLabel')}: {healthSource?.name || healthSource?.identifier}
            </Text>
            {fields.length ? (
              fields.map(input => {
                if (input.name === 'connectorRef') {
                  return (
                    <FormMultiTypeConnectorField
                      accountIdentifier={accountId}
                      projectIdentifier={projectIdentifier}
                      orgIdentifier={orgIdentifier}
                      width={400}
                      name={`spec.monitoredService.spec.templateInputs.${input.path}`}
                      label={getString('connector')}
                      placeholder={getString('cv.healthSource.connectors.selectConnector', {
                        sourceType: healthSource?.type
                      })}
                      disabled={!healthSource?.type}
                      setRefValue
                      multiTypeProps={{ allowableTypes, expressions }}
                      type={healthSource?.type}
                      enableConfigureOptions={false}
                    />
                  )
                } else if (input.name !== 'metricDefinitions') {
                  return (
                    <FormInput.MultiTextInput
                      key={input.name}
                      name={`spec.monitoredService.spec.templateInputs.${input.path}`}
                      label={getLabelByName(input.name, getString)}
                      multiTextInputProps={{
                        expressions,
                        allowableTypes
                      }}
                    />
                  )
                }
              })
            ) : (
              <NoResultsView text={'No Runtime inputs available'} minimal={true} />
            )}
            <Layout.Vertical padding={{ top: 'medium' }}>
              {metricDefinitions?.map((item: any, idx: number) => {
                const metricDefinitionFields = getNestedFields(item, [], `${path}.metricDefinitions.${idx}`)
                return (
                  <>
                    <Text font={'normal'} color={Color.BLACK} style={{ paddingBottom: spacingMedium }}>
                      {getString('cv.monitoringSources.metricLabel')}: {item?.metricName}
                    </Text>
                    {metricDefinitionFields.map(input => {
                      if (input.name !== 'identifier') {
                        return (
                          <FormInput.MultiTextInput
                            key={input.name}
                            name={`spec.monitoredService.spec.templateInputs.${input.path}`}
                            label={getLabelByName(input.name, getString)}
                            multiTextInputProps={{
                              expressions,
                              allowableTypes
                            }}
                          />
                        )
                      }
                    })}
                  </>
                )
              })}
            </Layout.Vertical>
          </Card>
        )
      })}
    </>
  )
}
