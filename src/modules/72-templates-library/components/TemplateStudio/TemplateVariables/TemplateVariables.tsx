/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback } from 'react'
import { MultiTypeInputType, NestedAccordionProvider, PageError } from '@wings-software/uicore'
import { isEmpty, omit, set } from 'lodash-es'
import { produce } from 'immer'
import {
  MonitoredServiceConfig,
  useTemplateVariables
} from '@pipeline/components/TemplateVariablesContext/TemplateVariablesContext'
import { PageSpinner } from '@common/components'
import type { NGTemplateInfoConfig } from 'services/template-ng'
import StageCard from '@pipeline/components/PipelineStudio/PipelineVariables/Cards/StageCard'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import type { PipelineInfoConfig, StageElementConfig, StepElementConfig } from 'services/pipeline-ng'
import { StepCardPanel } from '@pipeline/components/PipelineStudio/PipelineVariables/Cards/StepCard'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { DefaultNewStageId } from '@templates-library/components/TemplateStudio/StageTemplateCanvas/StageTemplateForm/StageTemplateForm'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { sanitize } from '@common/utils/JSONUtils'
import { VariablesHeader } from '@pipeline/components/PipelineStudio/PipelineVariables/VariablesHeader/VariablesHeader'
import MonitoredServiceCard from '@pipeline/components/PipelineStudio/PipelineVariables/Cards/MonitoredServiceCard'
import { TemplateType } from '@templates-library/utils/templatesUtils'
import { PipelineCardPanel } from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables'
import css from '@pipeline/components/PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

const TemplateVariables: React.FC = (): JSX.Element => {
  const {
    state: { template, templateView },
    updateTemplate,
    updateTemplateView
  } = React.useContext(TemplateContext)
  const { originalTemplate, variablesTemplate, metadataMap, error, initLoading } = useTemplateVariables()
  const allowableTypes = [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
  const [templateAtState, setTemplateAtState] = React.useState<NGTemplateInfoConfig>(originalTemplate)

  const onUpdate = useCallback(
    async (values: PipelineInfoConfig | StageElementConfig | StepElementConfig) => {
      const processNode = omit(values, 'name', 'identifier', 'description', 'tags')
      sanitize(processNode, { removeEmptyArray: false, removeEmptyObject: false, removeEmptyString: false })
      const updatedTemplate = produce(templateAtState, draft => {
        set(draft, 'spec', processNode)
      })
      setTemplateAtState(updatedTemplate)
    },
    [templateAtState]
  )

  async function applyChanges(): Promise<void> {
    await updateTemplate(templateAtState)
    updateTemplateView({ ...templateView, isDrawerOpened: false })
  }

  async function discardChanges(): Promise<void> {
    updateTemplateView({ ...templateView, isDrawerOpened: false })
  }

  if (initLoading) {
    return <PageSpinner />
  }

  return (
    <div className={css.pipelineVariables}>
      {error ? (
        <PageError message={(error?.data as Error)?.message || error?.message} />
      ) : !isEmpty(variablesTemplate) ? (
        <div className={css.content}>
          <VariablesHeader enableSearch={false} applyChanges={applyChanges} discardChanges={discardChanges} />
          <div className={css.variableList}>
            <GitSyncStoreProvider>
              {originalTemplate.type === TemplateType.Pipeline && (
                <PipelineCardPanel
                  variablePipeline={variablesTemplate as PipelineInfoConfig}
                  pipeline={template.spec as PipelineInfoConfig}
                  originalPipeline={originalTemplate.spec as PipelineInfoConfig}
                  metadataMap={metadataMap}
                  allowableTypes={allowableTypes}
                  stepsFactory={factory}
                  updatePipeline={onUpdate}
                />
              )}
              {originalTemplate.type === TemplateType.Stage && (
                <StageCard
                  stage={variablesTemplate as StageElementConfig}
                  unresolvedStage={{ ...template.spec, identifier: DefaultNewStageId } as StageElementConfig}
                  originalStage={{ ...originalTemplate.spec, identifier: DefaultNewStageId } as StageElementConfig}
                  metadataMap={metadataMap}
                  path="template"
                  allowableTypes={allowableTypes}
                  stepsFactory={factory}
                  updateStage={onUpdate}
                />
              )}
              {originalTemplate.type === TemplateType.Step && (
                <StepCardPanel
                  step={variablesTemplate as StepElementConfig}
                  originalStep={originalTemplate.spec as StepElementConfig}
                  metadataMap={metadataMap}
                  readonly={true}
                  stepPath="template"
                  allowableTypes={allowableTypes}
                  stageIdentifier={DefaultNewStageId}
                  onUpdateStep={onUpdate}
                  stepsFactory={factory}
                />
              )}
              {originalTemplate.type === TemplateType.MonitoredService && (
                <MonitoredServiceCard
                  monitoredService={variablesTemplate as MonitoredServiceConfig}
                  unresolvedMonitoredService={
                    { ...template.spec, identifier: DefaultNewStageId } as MonitoredServiceConfig
                  }
                  originalMonitoredService={
                    {
                      ...originalTemplate.spec,
                      spec: { env: {} },
                      identifier: DefaultNewStageId
                    } as MonitoredServiceConfig
                  }
                  metadataMap={metadataMap}
                  path="template"
                  allowableTypes={allowableTypes}
                  stepsFactory={factory}
                  updateMonitoredService={onUpdate}
                />
              )}
            </GitSyncStoreProvider>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function TemplateVariablesWrapper(): React.ReactElement {
  return (
    <NestedAccordionProvider>
      <TemplateVariables />
    </NestedAccordionProvider>
  )
}
