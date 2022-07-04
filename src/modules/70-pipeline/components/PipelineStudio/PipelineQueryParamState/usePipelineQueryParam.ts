/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useQueryParams, useUpdateQueryParams } from '@common/hooks'

export interface PipelineSelectionState {
  stageId?: string | null
  stepId?: string | null
  sectionId?: string | null
  storeType?: string
}

export function usePipelineQuestParamState() {
  const { stageId, stepId, sectionId } = useQueryParams<PipelineSelectionState>()
  const { updateQueryParams } = useUpdateQueryParams<PipelineSelectionState>()

  /**
   * Set selected stage/step.
   * Use null to clear state.
   * NOTE: Clearing 'stage' state will clear 'step' state too
   */
  const setPipelineQueryParamState = (state: PipelineSelectionState) => {
    /*if (isNull(state.stageId)) {
      state.stepId = null
    }*/

    // clear stepId when stageId is changed
    const newState = { ...state }
    if (state.stageId && state.stageId !== stageId) {
      newState.stepId = null
    }

    updateQueryParams({ stageId, stepId, sectionId, ...newState }, { skipNulls: true })
  }
  return { stageId, stepId, setPipelineQuestParamState: setPipelineQueryParamState, sectionId }
}
