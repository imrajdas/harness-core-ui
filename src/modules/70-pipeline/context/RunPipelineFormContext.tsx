/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { noop } from 'lodash-es'
import type { PipelineInfoConfig } from 'services/pipeline-ng'

export interface RunPipelineFormContextValues {
  template<T>(path: string): T | PipelineInfoConfig
  updateTemplate<T = unknown>(data: T, path: string): void
}

export const RunPipelineFormContext = React.createContext<RunPipelineFormContextValues>({
  template: () => ({} as PipelineInfoConfig),
  updateTemplate: noop
})

export interface RunPipelineFormContextProviderProps extends RunPipelineFormContextValues {
  children: React.ReactNode
}

export function RunPipelineFormContextProvider(props: RunPipelineFormContextProviderProps): React.ReactElement {
  const { children, ...rest } = props

  return <RunPipelineFormContext.Provider value={rest}>{children}</RunPipelineFormContext.Provider>
}

export function useRunPipelineFormContext(): RunPipelineFormContextValues {
  return React.useContext(RunPipelineFormContext)
}
