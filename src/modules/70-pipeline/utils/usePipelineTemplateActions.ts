/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { defaultTo } from 'lodash-es'
import { parse } from 'yaml'
import produce from 'immer'
import { useCallback } from 'react'
import type { PipelineInfoConfig } from 'services/pipeline-ng'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { createTemplate } from '@pipeline/utils/templateUtils'
import type { TemplateSummaryResponse } from 'services/template-ng'
import { useTemplateSelector } from 'framework/Templates/TemplateSelectorContext/useTemplateSelector'

interface TemplateActionsReturnType {
  addOrUpdateTemplate: (selectedTemplate?: TemplateSummaryResponse) => Promise<void>
  removeTemplate: () => Promise<void>
}

export function usePipelineTemplateActions(): TemplateActionsReturnType {
  const {
    state: { pipeline },
    updatePipeline
  } = usePipelineContext()
  const { getTemplate } = useTemplateSelector()

  const copyPipelineMetaData = useCallback(
    (processNode: PipelineInfoConfig) => {
      processNode.description = pipeline.description
      processNode.tags = pipeline.tags
      processNode.projectIdentifier = pipeline.projectIdentifier
      processNode.orgIdentifier = pipeline.orgIdentifier
    },
    [pipeline]
  )

  const addOrUpdateTemplate = useCallback(
    async (selectedTemplate?: TemplateSummaryResponse) => {
      const { template, isCopied } = await getTemplate({
        templateType: 'Pipeline',
        selectedTemplate
      })
      const processNode = isCopied
        ? produce(defaultTo(parse(template?.yaml || '')?.template.spec, {}) as PipelineInfoConfig, draft => {
            draft.name = defaultTo(pipeline?.name, '')
            draft.identifier = defaultTo(pipeline?.identifier, '')
          })
        : createTemplate(pipeline, template)
      copyPipelineMetaData(processNode)
      await updatePipeline(processNode)
    },
    [pipeline.template, getTemplate, updatePipeline]
  )

  const removeTemplate = useCallback(async () => {
    const node = pipeline
    const processNode = produce({} as PipelineInfoConfig, draft => {
      draft.name = defaultTo(node?.name, '')
      draft.identifier = defaultTo(node?.identifier, '')
    })
    copyPipelineMetaData(processNode)
    await updatePipeline(processNode)
  }, [pipeline, updatePipeline])

  return { addOrUpdateTemplate, removeTemplate }
}
