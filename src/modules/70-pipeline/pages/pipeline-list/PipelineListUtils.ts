/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Color } from '@harness/design-system'
import type { StoreType } from '@common/constants/GitSyncTypes'
import type { PMSPipelineSummaryResponse } from 'services/pipeline-ng'
import type { PipelineListPagePathParams } from './types'

export const DEFAULT_PAGE_NUMBER = 0
export const DEFAULT_PAGE_SIZE = 20
export const DEFAULT_SORT = ['lastUpdatedAt', 'DESC']

export const getStatusColor = (data: PMSPipelineSummaryResponse): string => {
  switch (data.executionSummaryInfo?.lastExecutionStatus) {
    case 'Success':
      return Color.GREEN_800
    case 'Failed':
      return Color.RED_800
    case 'Running':
      return Color.BLUE_800
    default:
      return Color.GREEN_800
  }
}

export function getRouteProps(pathParams: PipelineListPagePathParams, pipeline?: PMSPipelineSummaryResponse) {
  return {
    projectIdentifier: pathParams.projectIdentifier,
    orgIdentifier: pathParams.orgIdentifier,
    accountId: pathParams.accountId,
    module: pathParams.module,
    pipelineIdentifier: pipeline?.identifier || '',
    branch: pipeline?.gitDetails?.branch,
    repoIdentifier: pipeline?.gitDetails?.repoIdentifier,
    repoName: pipeline?.gitDetails?.repoName,
    connectorRef: pipeline?.connectorRef,
    storeType: pipeline?.storeType as StoreType
  }
}
