/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { RefObject } from 'react'
import type { GroupedVirtuosoHandle, VirtuosoHandle } from 'react-virtuoso'
import type { IconName } from '@wings-software/uicore'

import type { ExecutionNode, GraphLayoutNode } from 'services/pipeline-ng'
import type { StageType } from '@pipeline/utils/stageHelpers'
import type { CardVariant } from '@pipeline/utils/constants'
import type { State } from '@pipeline/components/LogsContent/LogsState/types'
import type { UseActionCreatorReturn } from '@pipeline/components/LogsContent/LogsState/actions'

export interface StepDetailProps {
  step: ExecutionNode
  stageType?: StageType
}

export interface StepDetailsRegister {
  component: React.ComponentType<StepDetailProps>
}

export interface StageDetailProps {
  stage: GraphLayoutNode
  stageType?: StageType
}

export interface StageDetailsRegister {
  component: React.ComponentType<StageDetailProps>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ExecutionCardInfoProps<T = Record<string, any>> {
  data: T
  nodeMap: Record<string, GraphLayoutNode>
  startingNodeId: string
  variant: CardVariant
}

export interface ExecutionCardInfoRegister {
  component: React.ComponentType<ExecutionCardInfoProps>
  icon: IconName
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ExecutionSummaryProps<T = any> {
  data: T
  nodeMap: Map<string, GraphLayoutNode>
}

export interface ExecutionSummaryRegister {
  component: React.ComponentType<ExecutionSummaryProps>
}

export interface RenderLogsInterface {
  hasLogs: boolean
  isSingleSectionLogs: boolean
  virtuosoRef: RefObject<null | GroupedVirtuosoHandle | VirtuosoHandle>
  state: State
  actions: UseActionCreatorReturn
}

export interface ConsoleViewStepDetailProps {
  step: ExecutionNode
  errorMessage?: string
  isSkipped?: boolean
  loading?: boolean
  renderLogs?: (props: RenderLogsInterface) => React.ReactNode
}

export interface ConsoleViewStepDetailsRegister {
  component: React.ComponentType<ConsoleViewStepDetailProps>
}

export interface LogsContentProps {
  mode: 'step-details' | 'console-view'
  toConsoleView?: string
  errorMessage?: string
  isWarning?: boolean
  renderLogs?: (props: RenderLogsInterface) => React.ReactNode
}
