/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { TemplateSummaryResponse } from 'services/template-ng'
import type { ActionReturnType } from './TemplateSelectorActions'
import { TemplateSelectorActions } from './TemplateSelectorActions'
import type { GetTemplateProps } from './useTemplateSelector'

export interface SelectorData extends GetTemplateProps {
  onSubmit: (template: TemplateSummaryResponse, isCopied: boolean) => void
  onCancel: () => void
}

export interface TemplatesReducerState {
  isDrawerOpened: boolean
  selectorData?: SelectorData
}

export const initialState: TemplatesReducerState = {
  isDrawerOpened: false
}

export const TemplateSelectorReducer = (
  state: TemplatesReducerState,
  data: ActionReturnType
): TemplatesReducerState => {
  const { type, response } = data
  switch (type) {
    case TemplateSelectorActions.CloseTemplateSelector:
      return {
        isDrawerOpened: false
      }
    case TemplateSelectorActions.OpenTemplateSelector:
      return {
        isDrawerOpened: true,
        selectorData: response?.selectorData
      }
    default:
      return state
  }
}
