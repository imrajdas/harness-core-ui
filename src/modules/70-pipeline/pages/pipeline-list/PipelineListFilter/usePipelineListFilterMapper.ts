/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { pick } from 'lodash-es'
import { removeNullAndEmpty, flattenObject } from '@common/components/Filter/utils/FilterUtils'
import { useStrings } from 'framework/strings'
import type { FilterProperties } from 'services/pipeline-ng'

export function usePipeLineListFilterMapper(filterProperties: FilterProperties = {}) {
  const { getString } = useStrings()

  const fieldToLabelMapping = new Map<string, string>()
  fieldToLabelMapping.set('name', getString('name'))
  fieldToLabelMapping.set('description', getString('description'))
  fieldToLabelMapping.set('pipelineTags', getString('tagsLabel'))
  fieldToLabelMapping.set('sourceBranch', getString('common.sourceBranch'))
  fieldToLabelMapping.set('targetBranch', getString('common.targetBranch'))
  fieldToLabelMapping.set('branch', getString('pipelineSteps.deploy.inputSet.branch'))
  fieldToLabelMapping.set('tag', getString('tagLabel'))
  fieldToLabelMapping.set('repoNames', getString('common.repositoryName'))
  fieldToLabelMapping.set('buildType', getString('filters.executions.buildType'))
  fieldToLabelMapping.set('deploymentTypes', getString('deploymentTypeText'))
  fieldToLabelMapping.set('infrastructureTypes', getString('infrastructureTypeText'))
  fieldToLabelMapping.set('serviceNames', getString('services'))
  fieldToLabelMapping.set('environmentNames', getString('environments'))
  const filterWithValidFields = removeNullAndEmpty(
    pick(flattenObject(filterProperties || {}), ...fieldToLabelMapping.keys())
  )
  const filterWithValidFieldsWithMetaInfo =
    filterWithValidFields.sourceBranch && filterWithValidFields.targetBranch
      ? Object.assign(filterWithValidFields, { buildType: getString('filters.executions.pullOrMergeRequest') })
      : filterWithValidFields.branch
      ? Object.assign(filterWithValidFields, { buildType: getString('pipelineSteps.deploy.inputSet.branch') })
      : filterWithValidFields.tag
      ? Object.assign(filterWithValidFields, { buildType: getString('tagLabel') })
      : filterWithValidFields

  return { fieldToLabelMapping, filterWithValidFieldsWithMetaInfo }
}
