/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import produce from 'immer'
import { get, merge, omit, set } from 'lodash-es'
import React from 'react'
import { useParams } from 'react-router-dom'
import {
  DefaultNewStageId,
  DefaultNewStageName
} from '@templates-library/components/TemplateStudio/StageTemplateCanvas/StageTemplateForm/StageTemplateForm'
import { TemplatePipelineProvider } from '@templates-library/components/TemplatePipelineContext/TemplatePipelineContext'
import { StageTemplateCanvasWithRef } from '@templates-library/components/TemplateStudio/StageTemplateCanvas/StageTemplateCanvas'
import type { PipelineInfoConfig, StageElementConfig } from 'services/pipeline-ng'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import type { TemplateFormRef } from '@templates-library/components/TemplateStudio/TemplateStudio'
import { DefaultPipeline } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineActions'
import type { ProjectPathProps, GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { sanitize } from '@common/utils/JSONUtils'
import { useQueryParams } from '@common/hooks'
import { PipelineContextType } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'

const StageTemplateCanvasWrapper = (_props: unknown, formikRef: TemplateFormRef) => {
  const {
    state: { template, isLoading, isUpdated },
    updateTemplate,
    isReadonly
  } = React.useContext(TemplateContext)
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { branch, repoIdentifier } = useQueryParams<GitQueryParams>()

  const createPipelineFromTemplate = () =>
    produce({ ...DefaultPipeline }, draft => {
      set(
        draft,
        'stages[0].stage',
        merge({}, template.spec as StageElementConfig, {
          name: DefaultNewStageName,
          identifier: DefaultNewStageId
        })
      )
    })

  const [pipeline, setPipeline] = React.useState<PipelineInfoConfig>(createPipelineFromTemplate())

  React.useEffect(() => {
    if (!isLoading && !isUpdated) {
      setPipeline(createPipelineFromTemplate())
    }
  }, [isLoading, isUpdated])

  const onUpdatePipeline = async (pipelineConfig: PipelineInfoConfig) => {
    const stage = get(pipelineConfig, 'stages[0].stage')
    const processNode = omit(stage, 'name', 'identifier', 'description', 'tags')
    sanitize(processNode, { removeEmptyArray: false, removeEmptyObject: false, removeEmptyString: false })
    set(template, 'spec', processNode)
    await updateTemplate(template)
  }

  return (
    <TemplatePipelineProvider
      queryParams={{ accountIdentifier: accountId, orgIdentifier, projectIdentifier, repoIdentifier, branch }}
      initialValue={pipeline}
      onUpdatePipeline={onUpdatePipeline}
      contextType={PipelineContextType.StageTemplate}
      isReadOnly={isReadonly}
    >
      <StageTemplateCanvasWithRef ref={formikRef} />
    </TemplatePipelineProvider>
  )
}

export const StageTemplateCanvasWrapperWithRef = React.forwardRef(StageTemplateCanvasWrapper)
