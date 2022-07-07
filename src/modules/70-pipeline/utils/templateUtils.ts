/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { defaultTo, get, isEmpty, isEqual, set, unset } from 'lodash-es'
import produce from 'immer'
import { parse } from 'yaml'
import type {
  PipelineInfoConfig,
  StageElementConfig,
  StepElementConfig,
  TemplateLinkConfig,
  TemplateStepNode
} from 'services/pipeline-ng'
import type { TemplateSummaryResponse } from 'services/template-ng'
import {
  getIdentifierFromValue,
  getScopeFromDTO,
  getScopeFromValue
} from '@common/components/EntityReference/EntityReference'
import { Scope } from '@common/interfaces/SecretsInterface'
import type { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { StageType } from '@pipeline/utils/stageHelpers'
import type { StepOrStepGroupOrTemplateStepData } from '@pipeline/components/PipelineStudio/StepCommands/StepCommandTypes'
import { generateRandomString } from '@pipeline/components/PipelineStudio/ExecutionGraph/ExecutionGraphUtil'
import {
  getTemplateListPromise,
  GetTemplateListQueryParams,
  ResponsePageTemplateSummaryResponse
} from 'services/template-ng'

export const TEMPLATE_INPUT_PATH = 'template.templateInputs'

export const getTemplateNameWithLabel = (template?: TemplateSummaryResponse): string => {
  return `${template?.name} (${defaultTo(template?.versionLabel, 'Stable')})`
}

export const getScopeBasedTemplateRef = (template: TemplateSummaryResponse): string => {
  const templateIdentifier = defaultTo(template.identifier, '')
  const scope = getScopeFromDTO(template)
  return scope === Scope.PROJECT ? templateIdentifier : `${scope}.${templateIdentifier}`
}

export const getStageType = (stage?: StageElementConfig, templateTypes?: { [key: string]: string }): StageType => {
  return stage?.template
    ? templateTypes
      ? (get(templateTypes, stage.template.templateRef) as StageType)
      : ((stage.template.templateInputs as StageElementConfig)?.type as StageType)
    : (stage?.type as StageType)
}

export const getStepType = (step?: StepElementConfig | TemplateStepNode): StepType => {
  return (step as TemplateStepNode)?.template
    ? (((step as TemplateStepNode).template.templateInputs as StepElementConfig)?.type as StepType)
    : ((step as StepElementConfig)?.type as StepType)
}

export const setTemplateInputs = (
  data: TemplateStepNode | StageElementConfig | PipelineInfoConfig,
  templateInputs: TemplateLinkConfig['templateInputs']
) => {
  if (isEmpty(templateInputs)) {
    unset(data, TEMPLATE_INPUT_PATH)
  } else {
    set(data, TEMPLATE_INPUT_PATH, templateInputs)
  }
}

export const createTemplate = <T extends PipelineInfoConfig | StageElementConfig | StepOrStepGroupOrTemplateStepData>(
  data?: T,
  template?: TemplateSummaryResponse
) => {
  return produce({} as T, draft => {
    draft.name = defaultTo(data?.name, '')
    draft.identifier = defaultTo(data?.identifier, '')
    if (template) {
      set(draft, 'template.templateRef', getScopeBasedTemplateRef(template))
      if (template.versionLabel) {
        set(draft, 'template.versionLabel', template.versionLabel)
      }
    }
  })
}

export const createStepNodeFromTemplate = (template: TemplateSummaryResponse, isCopied = false) => {
  return (isCopied
    ? produce(defaultTo(parse(defaultTo(template?.yaml, ''))?.template.spec, {}) as StepElementConfig, draft => {
        draft.name = defaultTo(template?.name, '')
        draft.identifier = generateRandomString(defaultTo(template?.name, ''))
      })
    : produce({} as TemplateStepNode, draft => {
        draft.name = defaultTo(template?.name, '')
        draft.identifier = generateRandomString(defaultTo(template?.name, ''))
        set(draft, 'template.templateRef', getScopeBasedTemplateRef(template))
        if (template.versionLabel) {
          set(draft, 'template.versionLabel', template.versionLabel)
        }
      })) as unknown as StepElementConfig
}

export const getTemplateTypesByRef = (
  params: GetTemplateListQueryParams,
  templateRefs: string[]
): Promise<{ [key: string]: string }> => {
  const scopedTemplates = templateRefs.reduce((a: { [key: string]: string[] }, b) => {
    const identifier = getIdentifierFromValue(b)
    const scope = getScopeFromValue(b)
    if (a[scope]) {
      a[scope].push(identifier)
    } else {
      a[scope] = [identifier]
    }
    return a
  }, {})
  const promises: Promise<ResponsePageTemplateSummaryResponse>[] = []
  Object.keys(scopedTemplates).forEach(scope => {
    promises.push(
      getTemplateListPromise({
        body: {
          filterType: 'Template',
          templateIdentifiers: scopedTemplates[scope]
        },
        queryParams: {
          ...params,
          projectIdentifier: scope === Scope.PROJECT ? params.projectIdentifier : undefined,
          orgIdentifier: scope === Scope.PROJECT || scope === Scope.ORG ? params.orgIdentifier : undefined,
          repoIdentifier: params.repoIdentifier,
          branch: params.branch,
          getDefaultFromOtherRepo: true
        }
      })
    )
  })
  return Promise.all(promises)
    .then(responses => {
      const templateTypes = {}
      responses.forEach(response => {
        response.data?.content?.forEach(item => {
          set(templateTypes, getScopeBasedTemplateRef(item), parse(item.yaml || '').template.spec.type)
        })
      })
      return templateTypes
    })
    .catch(_ => {
      return {}
    })
}

export const areTemplatesSame = (template1?: TemplateSummaryResponse, template2?: TemplateSummaryResponse): boolean => {
  return (
    isEqual(template1?.name, template2?.name) &&
    isEqual(template1?.identifier, template2?.identifier) &&
    isEqual(template1?.projectIdentifier, template2?.projectIdentifier) &&
    isEqual(template1?.orgIdentifier, template2?.orgIdentifier)
  )
}

export const areTemplatesEqual = (
  template1?: TemplateSummaryResponse,
  template2?: TemplateSummaryResponse
): boolean => {
  return areTemplatesSame(template1, template2) && isEqual(template1?.versionLabel, template2?.versionLabel)
}
