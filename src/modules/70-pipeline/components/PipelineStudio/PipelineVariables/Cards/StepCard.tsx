/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { MultiTypeInputType, NestedAccordionPanel, Text } from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { defaultTo } from 'lodash-es'
import type { StepElementConfig } from 'services/cd-ng'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import type { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import type { TemplateStepNode } from 'services/pipeline-ng'
import type { AbstractStepFactory } from '@pipeline/components/AbstractSteps/AbstractStepFactory'
import { useStrings } from 'framework/strings'
import type { PipelineVariablesData } from '../types'
import VariableAccordionSummary from '../VariableAccordionSummary'
import css from '../PipelineVariables.module.scss'

export interface StepCardProps {
  step: StepElementConfig | TemplateStepNode
  originalStep: StepElementConfig | TemplateStepNode
  stageIdentifier: string
  metadataMap: PipelineVariablesData['metadataMap']
  onUpdateStep(data: StepElementConfig, path: string): void
  stepPath: string
  readonly?: boolean
  path?: string
  allowableTypes: MultiTypeInputType[]
  stepsFactory: AbstractStepFactory // REQUIRED (pass to addUpdateGraph)
}

export function StepCard(props: StepCardProps): React.ReactElement {
  const {
    step,
    originalStep,
    metadataMap,
    stageIdentifier,
    onUpdateStep,
    stepPath,
    readonly,
    path,
    allowableTypes,
    stepsFactory
  } = props

  if ((originalStep as TemplateStepNode)?.template) {
    return <></>
  }

  return (
    <React.Fragment>
      <VariablesListTable
        className={css.variablePaddingL3}
        data={step}
        originalData={originalStep}
        metadataMap={metadataMap}
      />
      <StepWidget<StepElementConfig | TemplateStepNode>
        factory={stepsFactory}
        initialValues={originalStep}
        allowableTypes={allowableTypes}
        type={(originalStep as StepElementConfig).type as StepType}
        stepViewType={StepViewType.InputVariable}
        onUpdate={(data: StepElementConfig) => onUpdateStep(data, stepPath)}
        readonly={readonly}
        customStepProps={{
          stageIdentifier,
          metadataMap,
          variablesData: step,
          path
        }}
      />
    </React.Fragment>
  )
}

export function StepCardPanel(props: StepCardProps): React.ReactElement {
  const { getString } = useStrings()
  return (
    <NestedAccordionPanel
      noAutoScroll
      collapseProps={{
        keepChildrenMounted: true
      }}
      isDefaultOpen
      addDomId
      id={`${props.stepPath}.${props.originalStep.identifier}`}
      summary={
        <VariableAccordionSummary>
          <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.BLACK}>
            {defaultTo(props.originalStep.name, getString('step'))}
          </Text>
        </VariableAccordionSummary>
      }
      summaryClassName={css.accordianSummaryL3}
      details={<StepCard {...props} />}
    />
  )
}

export interface StepGroupCardProps {
  steps: Array<{
    step: StepElementConfig | TemplateStepNode
    originalStep: StepElementConfig | TemplateStepNode
    path: string
  }>
  stageIdentifier: string
  metadataMap: PipelineVariablesData['metadataMap']
  onUpdateStep(data: StepElementConfig | TemplateStepNode, path: string): void
  stepGroupIdentifier: string
  stepGroupName: string
  stepGroupOriginalName: string
  readonly?: boolean
  path?: string
  allowableTypes: MultiTypeInputType[]
  stepsFactory: AbstractStepFactory
}

export function StepGroupCard(props: StepGroupCardProps): React.ReactElement {
  const {
    steps,
    metadataMap,
    onUpdateStep,
    stageIdentifier,
    stepGroupName,
    stepGroupOriginalName,
    readonly,
    allowableTypes,
    stepsFactory
  } = props

  return (
    <React.Fragment>
      <VariablesListTable
        data={{ name: stepGroupName }}
        originalData={{ name: stepGroupOriginalName }}
        metadataMap={metadataMap}
        className={css.variablePaddingL3}
      />
      {steps.map(row => {
        const { step, originalStep, path } = row
        return (
          <StepCardPanel
            key={path}
            step={step}
            originalStep={originalStep}
            metadataMap={metadataMap}
            stepPath={path}
            readonly={readonly}
            allowableTypes={allowableTypes}
            stageIdentifier={stageIdentifier}
            onUpdateStep={onUpdateStep}
            stepsFactory={stepsFactory}
          />
        )
      })}
    </React.Fragment>
  )
}

export function StepGroupCardPanel(props: StepGroupCardProps): React.ReactElement {
  return (
    <NestedAccordionPanel
      noAutoScroll
      isDefaultOpen
      addDomId
      collapseProps={{
        keepChildrenMounted: true
      }}
      id={`${props.path}.StepGroup.${props.stepGroupIdentifier}`}
      summary={
        <VariableAccordionSummary>
          <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.BLACK}>
            {props.stepGroupOriginalName}
          </Text>
        </VariableAccordionSummary>
      }
      summaryClassName={css.accordianSummaryL2}
      details={<StepGroupCard {...props} />}
    />
  )
}
