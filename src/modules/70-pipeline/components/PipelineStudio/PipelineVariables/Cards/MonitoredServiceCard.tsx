/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo } from 'lodash-es'
import { Text, NestedAccordionPanel, MultiTypeInputType } from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import cx from 'classnames'
import type {
  CustomVariablesData,
  CustomVariableEditableExtraProps
} from '@pipeline/components/PipelineSteps/Steps/CustomVariables/CustomVariableEditable'
import type { VariableResponseMapValue } from 'services/template-ng'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { useStrings } from 'framework/strings'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import type { AllNGVariables } from '@pipeline/utils/types'
import type { AbstractStepFactory } from '@pipeline/components/AbstractSteps/AbstractStepFactory'
import type { MonitoredServiceConfig } from '@pipeline/components/TemplateVariablesContext/TemplateVariablesContext'
import VariableAccordionSummary from '../VariableAccordionSummary'
import type { PipelineVariablesData } from '../types'
import css from '../PipelineVariables.module.scss'

export interface MonitoredServiceCardProps {
  monitoredService: MonitoredServiceConfig
  originalMonitoredService: MonitoredServiceConfig
  unresolvedMonitoredService: MonitoredServiceConfig
  metadataMap: PipelineVariablesData['metadataMap']
  readonly?: boolean
  path?: string
  allowableTypes: MultiTypeInputType[]
  stepsFactory: AbstractStepFactory
  updateMonitoredService: (monitoredService: MonitoredServiceConfig) => Promise<void>
}

interface MetaDataInterface {
  [key: string]: VariableResponseMapValue
}
const updateLocalNameInMetaData = (metadataMap: MetaDataInterface): MetaDataInterface => {
  const updatedMetadataMap: MetaDataInterface = {}
  Object.keys(metadataMap).forEach(key => {
    const updatedData = {
      ...metadataMap[key],
      yamlProperties: {
        ...metadataMap[key]?.yamlProperties,
        localName: metadataMap[key]?.yamlProperties?.variableName
      }
    }
    updatedMetadataMap[key] = updatedData
  })
  return updatedMetadataMap
}

export default function MonitoredServiceCard(props: MonitoredServiceCardProps): React.ReactElement {
  const {
    monitoredService,
    originalMonitoredService,
    unresolvedMonitoredService,
    metadataMap,
    readonly,
    path,
    allowableTypes,
    updateMonitoredService,
    stepsFactory
  } = props
  const { getString } = useStrings()
  const originalSpec = originalMonitoredService.spec
  const updatedMetadataMap = updateLocalNameInMetaData(metadataMap)
  const onUpdateVariables = React.useCallback(
    ({ variables }: CustomVariablesData) => {
      updateMonitoredService({ ...unresolvedMonitoredService, variables })
    },
    [updateMonitoredService, unresolvedMonitoredService]
  )

  const content = (
    <div className={css.variableCard}>
      <VariablesListTable
        data={monitoredService}
        className={css.variablePaddingL0}
        originalData={originalMonitoredService}
        metadataMap={updatedMetadataMap}
      />
      {originalSpec && (
        <React.Fragment>
          <NestedAccordionPanel
            noAutoScroll
            isDefaultOpen
            key={`${path}.${originalMonitoredService.identifier}.variables`}
            id={`${path}.${originalMonitoredService.identifier}.variables`}
            addDomId
            summary={
              <VariableAccordionSummary>
                <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.BLACK}>
                  {getString('customVariables.title')}
                </Text>
              </VariableAccordionSummary>
            }
            collapseProps={{
              keepChildrenMounted: true
            }}
            details={
              <StepWidget<CustomVariablesData, CustomVariableEditableExtraProps>
                factory={stepsFactory}
                initialValues={{
                  variables: defaultTo(originalMonitoredService.variables, []) as AllNGVariables[],
                  canAddVariable: true
                }}
                allowableTypes={allowableTypes}
                readonly={readonly}
                type={StepType.CustomVariable}
                stepViewType={StepViewType.InputVariable}
                onUpdate={onUpdateVariables}
                customStepProps={{
                  formName: 'addEditStageCustomVariableForm',
                  variableNamePrefix: `${originalMonitoredService.identifier}.variables.`,
                  domId: `Stage.${originalMonitoredService.identifier}.Variables-panel`,
                  className: cx(css.customVariables, css.customVarPadL1, css.addVariableL1),
                  path: `${path}.customVariables`,
                  yamlProperties: (defaultTo(monitoredService.variables, []) as AllNGVariables[]).map?.(
                    variable =>
                      metadataMap[variable.value || /* istanbul ignore next */ '']?.yamlProperties ||
                      /* istanbul ignore next */ {}
                  )
                }}
              />
            }
          />
        </React.Fragment>
      )}
    </div>
  )

  return (
    <NestedAccordionPanel
      noAutoScroll
      isDefaultOpen
      collapseProps={{
        keepChildrenMounted: true
      }}
      key={`${path}.${originalMonitoredService.identifier}`}
      id={`${path}.${originalMonitoredService.identifier}`}
      addDomId
      summary={
        <VariableAccordionSummary>
          <Text font={{ variation: FontVariation.H6 }} color={Color.BLACK}>
            {originalMonitoredService.name
              ? `Monitored Service: ${originalMonitoredService.name}`
              : 'Monitored Service'}
          </Text>
        </VariableAccordionSummary>
      }
      summaryClassName={css.stageSummary}
      details={content}
    />
  )
}
