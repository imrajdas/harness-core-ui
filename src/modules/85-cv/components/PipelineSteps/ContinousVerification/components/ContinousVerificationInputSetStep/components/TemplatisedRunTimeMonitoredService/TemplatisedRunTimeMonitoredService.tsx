/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Card, Color, FormInput, Layout, MultiTypeInputType, Text } from '@harness/uicore'
import React from 'react'
import { useParams } from 'react-router-dom'
import type { VerifyStepMonitoredService } from '@cv/components/PipelineSteps/ContinousVerification/types'
import { useStrings } from 'framework/strings'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import {
  getFieldLabelForVerifyTemplate,
  getNestedRuntimeInputs
} from '@cv/pages/monitored-service/CVMonitoredService/MonitoredServiceInputSetsTemplate.utils'
import type { PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import NoResultsView from '@templates-library/pages/TemplatesPage/views/NoResultsView/NoResultsView'
import {
  useGetHarnessEnvironments,
  useGetHarnessServices
} from '@cv/components/HarnessServiceAndEnvironment/HarnessServiceAndEnvironment'
import { checkIfRunTimeInput } from '@cv/components/PipelineSteps/ContinousVerification/utils'
import { getMultiTypeInputProps } from '../../../ContinousVerificationWidget/components/ContinousVerificationWidgetSections/components/VerificationJobFields/VerificationJobFields.utils'
import { getRunTimeInputsFromHealthSource } from './TemplatisedRunTimeMonitoredService.utils'
import css from './TemplatisedRunTimeMonitoredService.module.scss'

interface TemplatisedRunTimeMonitoredServiceServiceProps {
  prefix: string
  monitoredService?: VerifyStepMonitoredService
  expressions: string[]
  allowableTypes: MultiTypeInputType[]
}

export default function TemplatisedRunTimeMonitoredService(
  props: TemplatisedRunTimeMonitoredServiceServiceProps
): JSX.Element {
  const { prefix, monitoredService, expressions, allowableTypes } = props
  const { accountId, projectIdentifier, orgIdentifier } = useParams<PipelineType<ProjectPathProps>>()
  const { getString } = useStrings()
  const { serviceOptions } = useGetHarnessServices()
  const { environmentOptions } = useGetHarnessEnvironments()
  const healthSources = monitoredService?.spec?.templateInputs?.sources?.healthSources || []
  const healthSourcesVariables = monitoredService?.spec?.templateInputs?.variables || []
  const { serviceRef, environmentRef } = monitoredService?.spec?.templateInputs || {}
  const areRunTimeVariablesPresent = healthSourcesVariables?.some(variable => checkIfRunTimeInput(variable?.value))

  return (
    <Layout.Vertical>
      <Card className={css.card}>
        {checkIfRunTimeInput(serviceRef) ? (
          <FormInput.MultiTypeInput
            name={`${prefix}spec.monitoredService.spec.templateInputs.serviceRef`}
            label={getString('service')}
            selectItems={serviceOptions}
            multiTypeInputProps={getMultiTypeInputProps(expressions, allowableTypes)}
            useValue
          />
        ) : null}
        {checkIfRunTimeInput(environmentRef) ? (
          <FormInput.MultiTypeInput
            name={`${prefix}spec.monitoredService.spec.templateInputs.environmentRef`}
            label={getString('environment')}
            selectItems={environmentOptions}
            multiTypeInputProps={getMultiTypeInputProps(expressions, allowableTypes)}
            useValue
          />
        ) : null}
      </Card>
      {healthSources?.map((healthSource: any, index: number) => {
        const spec = healthSource?.spec
        const path = `sources.healthSources.${index}.spec`
        const runtimeInputs = getRunTimeInputsFromHealthSource(spec, path)
        const metricDefinitions = healthSource?.spec?.metricDefinitions
        return (
          <Card key={`${healthSource?.name}.${index}`} className={css.card}>
            <Text font={'normal'} color={Color.BLACK} style={{ paddingBottom: 'medium' }}>
              {/* TODO - healthsource name should also be persisted in templateData */}
              {getString('cv.healthSource.nameLabel')}: {healthSource?.name || healthSource?.identifier}
            </Text>
            {runtimeInputs.length ? (
              runtimeInputs.map(input => {
                if (input.name === 'connectorRef') {
                  return (
                    <FormMultiTypeConnectorField
                      accountIdentifier={accountId}
                      projectIdentifier={projectIdentifier}
                      orgIdentifier={orgIdentifier}
                      width={391}
                      name={`${prefix}spec.monitoredService.spec.templateInputs.${input.path}`}
                      label={getString('connector')}
                      placeholder={getString('cv.healthSource.connectors.selectConnector', {
                        sourceType: healthSource?.type
                      })}
                      disabled={!healthSource?.type}
                      setRefValue
                      multiTypeProps={{ allowableTypes, expressions }}
                      type={healthSource?.type}
                    />
                  )
                } else {
                  return (
                    <>
                      <FormInput.MultiTextInput
                        key={input.name}
                        name={`${prefix}spec.monitoredService.spec.templateInputs.${input.path}`}
                        label={getFieldLabelForVerifyTemplate(input.name, getString)}
                        multiTextInputProps={{
                          expressions,
                          allowableTypes
                        }}
                      />
                    </>
                  )
                }
              })
            ) : (
              <NoResultsView text={'No Runtime inputs available'} minimal={true} />
            )}
            <Layout.Vertical padding={{ top: 'medium' }}>
              {metricDefinitions?.map((item: any, idx: number) => {
                const runtimeItems = getNestedRuntimeInputs(item, [], `${path}.metricDefinitions.${idx}`)
                return (
                  <>
                    <Text font={'normal'} color={Color.BLACK} style={{ paddingBottom: 'medium' }}>
                      {getString('cv.monitoringSources.metricLabel')}: {item?.metricName}
                    </Text>
                    {runtimeItems.map(input => {
                      return (
                        <FormInput.MultiTextInput
                          key={input.name}
                          name={`${prefix}spec.monitoredService.spec.templateInputs.${input.path}`}
                          label={getFieldLabelForVerifyTemplate(input.name, getString)}
                          multiTextInputProps={{
                            expressions,
                            allowableTypes
                          }}
                        />
                      )
                    })}
                  </>
                )
              })}
            </Layout.Vertical>
          </Card>
        )
      })}

      {Boolean(healthSourcesVariables?.length) && (
        <Card className={css.card}>
          {areRunTimeVariablesPresent ? (
            <Text font={'normal'} style={{ paddingBottom: 'medium' }}>
              {getString('common.variables')}
            </Text>
          ) : null}
          {healthSourcesVariables?.map((variable: any, index: number) => {
            if (checkIfRunTimeInput(variable?.value)) {
              return (
                <FormInput.MultiTextInput
                  key={variable?.name}
                  name={`${prefix}spec.monitoredService.spec.templateInputs.variables.${index}.value`}
                  label={variable?.name}
                  multiTextInputProps={{
                    expressions,
                    allowableTypes
                  }}
                />
              )
            }
          })}
        </Card>
      )}
    </Layout.Vertical>
  )
}
