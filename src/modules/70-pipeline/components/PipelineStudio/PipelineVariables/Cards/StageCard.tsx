/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import produce from 'immer'
import { defaultTo, isEmpty, lowerCase, set } from 'lodash-es'
import { Text, NestedAccordionPanel, MultiTypeInputType } from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import cx from 'classnames'
import type { DeploymentStageConfig, ServiceSpec, StageElementConfig } from 'services/cd-ng'
import type {
  CustomVariablesData,
  CustomVariableEditableExtraProps
} from '@pipeline/components/PipelineSteps/Steps/CustomVariables/CustomVariableEditable'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { useStrings } from 'framework/strings'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import type { AllNGVariables } from '@pipeline/utils/types'

import VariableListTagRow from '@pipeline/components/VariablesListTable/VariableListTagRow'
import type { AbstractStepFactory } from '@pipeline/components/AbstractSteps/AbstractStepFactory'
import { ServiceCardPanel } from './ServiceCard'
import { ExecutionCardPanel } from './ExecutionCard'
import { EnvironmentCardPanel } from './EnvironmentCard'
import VariableAccordionSummary from '../VariableAccordionSummary'
import type { PipelineVariablesData } from '../types'
import css from '../PipelineVariables.module.scss'

export interface StageCardProps {
  stage: StageElementConfig
  originalStage: StageElementConfig
  unresolvedStage: StageElementConfig
  metadataMap: PipelineVariablesData['metadataMap']
  readonly?: boolean
  path?: string
  allowableTypes: MultiTypeInputType[]
  stepsFactory: AbstractStepFactory
  updateStage: (stage: StageElementConfig) => Promise<void>
}

export default function StageCard(props: StageCardProps): React.ReactElement {
  const {
    stage,
    originalStage,
    unresolvedStage,
    metadataMap,
    readonly,
    path,
    allowableTypes,
    updateStage,
    stepsFactory
  } = props
  const { getString } = useStrings()
  const stageSpec = stage.spec as DeploymentStageConfig
  const originalSpec = originalStage.spec as DeploymentStageConfig

  const onUpdateVariables = React.useCallback(
    ({ variables }: CustomVariablesData) => {
      updateStage({ ...unresolvedStage, variables })
    },
    [updateStage, unresolvedStage]
  )

  const onUpdateServiceConfig = React.useCallback(
    (serviceSpec: ServiceSpec) => {
      updateStage(
        produce(unresolvedStage, draft => {
          if (serviceSpec.artifacts) {
            set(draft, 'spec.serviceConfig.serviceDefinition.spec.artifacts', serviceSpec.artifacts)
          }
          if (serviceSpec.manifests) {
            set(draft, 'spec.serviceConfig.serviceDefinition.spec.manifest', serviceSpec.manifests)
          }
          if (serviceSpec.variables) {
            set(draft, 'spec.serviceConfig.serviceDefinition.spec.variables', serviceSpec.variables)
          }
        })
      )
    },
    [updateStage, unresolvedStage]
  )

  const onUpdateInfrastructure = React.useCallback(
    infrastructure => {
      updateStage(
        produce(unresolvedStage, draft => {
          set(draft, 'spec.infrastructure', infrastructure)
        })
      )
    },
    [updateStage, unresolvedStage]
  )

  const onUpdateInfrastructureProvisioner = React.useCallback(
    provisioner => {
      updateStage(
        produce(unresolvedStage, draft => {
          set(draft, 'spec.infrastructure.infrastructureDefinition.provisioner', provisioner)
        })
      )
    },
    [updateStage, unresolvedStage]
  )

  const onUpdateExecution = React.useCallback(
    execution => {
      updateStage(
        produce(unresolvedStage, draft => {
          set(draft, 'spec.execution', execution)
        })
      )
    },
    [updateStage, unresolvedStage]
  )

  const content = (
    <div className={css.variableCard}>
      <VariablesListTable
        data={stage}
        className={css.variablePaddingL0}
        originalData={originalStage}
        metadataMap={metadataMap}
      />
      {!isEmpty(originalStage?.tags) && (
        <VariableListTagRow
          metadataMap={metadataMap}
          name={lowerCase(getString('tagsLabel'))}
          tags={originalStage?.tags}
          fqn=""
          className={css.variablePaddingTagL2}
        />
      )}
      {originalSpec && (
        <React.Fragment>
          <NestedAccordionPanel
            noAutoScroll
            isDefaultOpen
            key={`${path}.${originalStage.identifier}.variables`}
            id={`${path}.${originalStage.identifier}.variables`}
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
                  variables: defaultTo(originalStage.variables, []) as AllNGVariables[],
                  canAddVariable: true
                }}
                allowableTypes={allowableTypes}
                readonly={readonly}
                type={StepType.CustomVariable}
                stepViewType={StepViewType.InputVariable}
                onUpdate={onUpdateVariables}
                customStepProps={{
                  formName: 'addEditStageCustomVariableForm',
                  variableNamePrefix: `${originalStage.identifier}.variables.`,
                  domId: `Stage.${originalStage.identifier}.Variables-panel`,
                  className: cx(css.customVariables, css.customVarPadL1, css.addVariableL1),
                  // heading: <b>{getString('customVariables.title')}</b>,
                  path: `${path}.customVariables`,
                  yamlProperties: (defaultTo(stage.variables, []) as AllNGVariables[]).map?.(
                    variable =>
                      metadataMap[variable.value || /* istanbul ignore next */ '']?.yamlProperties ||
                      /* istanbul ignore next */ {}
                  )
                }}
              />
            }
          />
          {/* TODO: Temporary disable for  CI (TBD)*/}
          {stage.type === 'Deployment' || stage.type === 'Approval' || stage.type === 'Custom' ? (
            <>
              {stageSpec.serviceConfig && originalSpec.serviceConfig ? (
                <ServiceCardPanel
                  serviceConfig={stageSpec.serviceConfig}
                  originalServiceConfig={originalSpec.serviceConfig}
                  metadataMap={metadataMap}
                  readonly={readonly}
                  stageIdentifier={originalStage.identifier}
                  path={`${path}.${originalStage.identifier}`}
                  allowableTypes={allowableTypes}
                  onUpdateServiceConfig={onUpdateServiceConfig}
                  stepsFactory={stepsFactory}
                  originalStage={originalStage}
                />
              ) : /* istanbul ignore next */ null}
              <EnvironmentCardPanel
                stage={stage}
                originalStage={originalStage}
                metadataMap={metadataMap}
                readonly={readonly}
                allowableTypes={allowableTypes}
                path={path}
                stepsFactory={stepsFactory}
                onUpdateInfrastructure={onUpdateInfrastructure}
                onUpdateInfrastructureProvisioner={onUpdateInfrastructureProvisioner}
              />
              {stageSpec.execution && originalSpec.execution ? (
                <ExecutionCardPanel
                  id={`${path}.${originalStage.identifier}.Execution`}
                  title={getString('executionText')}
                  execution={stageSpec.execution}
                  originalExecution={originalSpec.execution}
                  metadataMap={metadataMap}
                  stageIdentifier={originalStage.identifier}
                  allowableTypes={allowableTypes}
                  readonly={readonly}
                  path={`${path}.${originalStage.identifier}.Execution`}
                  onUpdateExecution={onUpdateExecution}
                  stepsFactory={stepsFactory}
                />
              ) : /* istanbul ignore next */ null}
            </>
          ) : /* istanbul ignore next */ null}
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
      key={`${path}.${originalStage.identifier}`}
      id={`${path}.${originalStage.identifier}`}
      addDomId
      summary={
        <VariableAccordionSummary>
          <Text font={{ variation: FontVariation.H6 }} color={Color.BLACK}>
            {originalStage.name ? `Stage: ${originalStage.name}` : 'Stage'}
          </Text>
        </VariableAccordionSummary>
      }
      summaryClassName={css.stageSummary}
      details={content}
    />
  )
}
