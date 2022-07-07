/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { SelectorData, TemplatesReducerState } from './TemplateSelectorReducer'
import { initialState, TemplateSelectorReducer } from './TemplateSelectorReducer'
import { TemplateSelectorContextActions } from './TemplateSelectorActions'

export interface TemplatesSelectorContextInterface {
  state: TemplatesReducerState
  openTemplateSelector: (selectorData: SelectorData) => void
  closeTemplateSelector: () => void
}

export const TemplateSelectorContext = React.createContext<TemplatesSelectorContextInterface>({
  state: initialState,
  openTemplateSelector: () => undefined,
  closeTemplateSelector: () => undefined
})

export function TemplateSelectorContextProvider(props: React.PropsWithChildren<unknown>): React.ReactElement {
  const [state, dispatch] = React.useReducer(TemplateSelectorReducer, initialState)

  const openTemplateSelector = React.useCallback((selectorData: SelectorData) => {
    dispatch(TemplateSelectorContextActions.openTemplateSelector({ selectorData: selectorData }))
  }, [])
  const closeTemplateSelector = React.useCallback(() => {
    dispatch(TemplateSelectorContextActions.closeTemplateSelector())
  }, [])
  return (
    <TemplateSelectorContext.Provider value={{ state, openTemplateSelector, closeTemplateSelector }}>
      {props.children}
    </TemplateSelectorContext.Provider>
  )
}

export function useTemplateSelectorContext(): TemplatesSelectorContextInterface {
  // disabling this because this the definition of usePipelineContext
  // eslint-disable-next-line no-restricted-syntax
  return React.useContext(TemplateSelectorContext)
}
