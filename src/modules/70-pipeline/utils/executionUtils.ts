/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type * as React from 'react'
import type { IconName } from '@wings-software/uicore'
import { defaultTo, has, isEmpty } from 'lodash-es'

import {
  ExecutionStatus,
  ExecutionStatusEnum,
  isExecutionSuccess,
  isExecutionCompletedWithBadState,
  isExecutionRunning,
  isExecutionWaiting,
  isExecutionSkipped,
  isExecutionNotStarted
} from '@pipeline/utils/statusHelpers'
import type {
  GraphLayoutNode,
  PipelineExecutionSummary,
  ExecutionGraph,
  ExecutionNode,
  ExecutionNodeAdjacencyList
} from 'services/pipeline-ng'
import {
  ExecutionPipelineNode,
  ExecutionPipelineNodeType,
  ExecutionPipelineItem,
  ExecutionPipelineGroupInfo
} from '@pipeline/components/ExecutionStageDiagram/ExecutionPipelineModel'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { stagesCollection } from '@pipeline/components/PipelineStudio/Stages/StagesCollection'
import { PipelineGraphState, PipelineGraphType } from '@pipeline/components/PipelineDiagram/types'
import { getConditionalExecutionFlag } from '@pipeline/components/ExecutionStageDiagram/ExecutionStageDiagramUtils'
import { isApprovalStep } from './stepUtils'
import { StageType } from './stageHelpers'

export const LITE_ENGINE_TASK = 'liteEngineTask'
export const STATIC_SERVICE_GROUP_NAME = 'static_service_group'
export const RollbackIdentifier = 'Rollback'
export const StepGroupRollbackIdentifier = '(Rollback)'
export const BARRIER_WITH_OPEN_LINKS = 'barrier-open-with-links'
export const RollbackContainerCss: React.CSSProperties = {
  borderColor: 'var(--red-450)'
}

// TODO: remove use DTO
export interface ServiceDependency {
  identifier: string
  name: string | null
  image: string
  status: string
  startTime: string
  endTime: string | null
  errorMessage: string | null
  errorReason: string | null
}

export enum NodeType {
  SERVICE = 'SERVICE',
  SERVICE_CONFIG = 'SERVICE_CONFIG',
  SERVICE_SECTION = 'SERVICE_SECTION',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  GENERIC_SECTION = 'GENERIC_SECTION',
  STEP_GROUP = 'STEP_GROUP',
  NG_SECTION = 'NG_SECTION',
  ROLLBACK_OPTIONAL_CHILD_CHAIN = 'ROLLBACK_OPTIONAL_CHILD_CHAIN',
  FORK = 'NG_FORK',
  INFRASTRUCTURE_SECTION = 'INFRASTRUCTURE_SECTION',
  DEPLOYMENT_STAGE_STEP = 'DEPLOYMENT_STAGE_STEP',
  APPROVAL_STAGE = 'APPROVAL_STAGE',
  NG_SECTION_WITH_ROLLBACK_INFO = 'NG_SECTION_WITH_ROLLBACK_INFO',
  NG_EXECUTION = 'NG_EXECUTION',
  StepGroupNode = 'StepGroupNode',
  'GITOPS_CLUSTERS' = 'GITOPS CLUSTERS',
  STRATEGY = 'STRATEGY'
}

export const NonSelectableNodes: NodeType[] = [
  NodeType.NG_SECTION,
  NodeType.FORK,
  NodeType.DEPLOYMENT_STAGE_STEP,
  NodeType.APPROVAL_STAGE,
  NodeType.NG_EXECUTION
]

export const TopLevelNodes: NodeType[] = [
  NodeType.NG_SECTION,
  NodeType.ROLLBACK_OPTIONAL_CHILD_CHAIN,
  NodeType.INFRASTRUCTURE_SECTION,
  NodeType.NG_SECTION_WITH_ROLLBACK_INFO,
  NodeType.NG_EXECUTION
]
export const StepTypeIconsMap: { [key in NodeType]: IconName } = {
  SERVICE: 'services',
  SERVICE_CONFIG: 'services',
  SERVICE_SECTION: 'services',
  GENERIC_SECTION: 'step-group',
  NG_SECTION_WITH_ROLLBACK_INFO: 'step-group',
  NG_SECTION: 'step-group',
  NG_EXECUTION: 'step-group',
  ROLLBACK_OPTIONAL_CHILD_CHAIN: 'step-group',
  INFRASTRUCTURE_SECTION: 'step-group',
  STEP_GROUP: 'step-group',
  INFRASTRUCTURE: 'infrastructure',
  NG_FORK: 'fork',
  DEPLOYMENT_STAGE_STEP: 'circle',
  APPROVAL_STAGE: 'approval-stage-icon',
  StepGroupNode: 'step-group',
  'GITOPS CLUSTERS': 'gitops-clusters',
  STRATEGY: 'step-group'
}

export const ExecutionStatusIconMap: Record<ExecutionStatus, IconName> = {
  Success: 'tick-circle',
  Running: 'main-more',
  AsyncWaiting: 'main-more',
  TaskWaiting: 'main-more',
  TimedWaiting: 'main-more',
  Failed: 'circle-cross',
  Errored: 'circle-cross',
  IgnoreFailed: 'tick-circle',
  Expired: 'expired',
  Aborted: 'banned',
  Discontinuing: 'banned',
  Suspended: 'banned',
  Queued: 'queued',
  NotStarted: 'pending',
  Paused: 'pause',
  ResourceWaiting: 'waiting',
  Skipped: 'skipped',
  ApprovalRejected: 'circle-cross',
  InterventionWaiting: 'waiting',
  ApprovalWaiting: 'waiting',
  Pausing: 'pause',
  InputWaiting: 'waiting'
}

/**
 * @deprecated use import { ExecutionPathProps } from '@common/interfaces/RouteInterfaces' instead
 */
export interface ExecutionPathParams {
  orgIdentifier: string
  projectIdentifier: string
  pipelineIdentifier: string
  executionIdentifier: string
  accountId: string
}

export interface ExecutionQueryParams {
  stage?: string
  step?: string
  view?: string
  filterAnomalous?: string
  type?: string
}

export interface LayoutNodeMapInterface {
  [key: string]: GraphLayoutNode
}
export function getPipelineStagesMap(
  layoutNodeMap: PipelineExecutionSummary['layoutNodeMap'],
  startingNodeId?: string
): Map<string, GraphLayoutNode> {
  const map = new Map<string, GraphLayoutNode>()

  function recursiveSetInMap(node: GraphLayoutNode): void {
    if (node.nodeType === NodeTypes.Parallel || isNodeTypeMatrixOrFor(node.nodeType)) {
      node.edgeLayoutList?.currentNodeChildren?.forEach(item => {
        if (item && layoutNodeMap?.[item]) {
          // register nodes in case of strategy
          if (isNodeTypeMatrixOrFor(layoutNodeMap?.[item]?.nodeType)) {
            recursiveSetInMap(layoutNodeMap[item])
            return
          }
          const nodeId = isNodeTypeMatrixOrFor(node.nodeType)
            ? defaultTo(layoutNodeMap[item]?.nodeExecutionId, layoutNodeMap[item].nodeUuid)
            : layoutNodeMap[item].nodeUuid
          map.set(nodeId || '', layoutNodeMap[item])
          return
        }
      })
    } else {
      map.set(node.nodeUuid || '', node)
    }

    node.edgeLayoutList?.nextIds?.forEach(item => {
      if (item && layoutNodeMap?.[item]) {
        recursiveSetInMap(layoutNodeMap[item])
        return
      }
    })
  }

  if (startingNodeId && layoutNodeMap?.[startingNodeId]) {
    const node = layoutNodeMap[startingNodeId]
    recursiveSetInMap(node)
  }

  return map
}

enum NodeTypes {
  Parallel = 'parallel',
  Stage = 'stage',
  Matrix = 'MATRIX',
  For = 'FOR',
  Parallelism = 'PARALLELISM'
}
export interface ProcessLayoutNodeMapResponse {
  stage?: GraphLayoutNode
  parallel?: GraphLayoutNode[]
}

export const processLayoutNodeMap = (executionSummary?: PipelineExecutionSummary): ProcessLayoutNodeMapResponse[] => {
  const response: ProcessLayoutNodeMapResponse[] = []
  if (!executionSummary) {
    return response
  }
  const startingNodeId = executionSummary.startingNodeId
  const layoutNodeMap = executionSummary.layoutNodeMap
  if (startingNodeId && layoutNodeMap?.[startingNodeId]) {
    let node: GraphLayoutNode | undefined = layoutNodeMap[startingNodeId]
    while (node) {
      const currentNodeChildren: string[] | undefined = node?.edgeLayoutList?.currentNodeChildren
      const nextIds: string[] | undefined = node?.edgeLayoutList?.nextIds
      if (node.nodeType === NodeTypes.Parallel && currentNodeChildren && currentNodeChildren.length > 1) {
        response.push({ parallel: currentNodeChildren.map(item => layoutNodeMap[item]) })
        node = layoutNodeMap[node.edgeLayoutList?.nextIds?.[0] || '']
      } else if (node.nodeType === NodeTypes.Parallel && currentNodeChildren && layoutNodeMap[currentNodeChildren[0]]) {
        response.push({ stage: layoutNodeMap[currentNodeChildren[0]] })
        node = layoutNodeMap[node.edgeLayoutList?.nextIds?.[0] || '']
      } else {
        response.push({ stage: node })
        if (nextIds && nextIds.length === 1) {
          node = layoutNodeMap[nextIds[0]]
        } else {
          node = undefined
        }
      }
    }
  }
  return response
}

function parseStages(stages: ProcessLayoutNodeMapResponse[] | GraphLayoutNode[]): string {
  const n = stages.length
  for (let i = n - 1; i >= 0; i--) {
    const stage = (stages[i] as ProcessLayoutNodeMapResponse)?.stage ?? (stages[i] as GraphLayoutNode)

    if ((stage as ProcessLayoutNodeMapResponse).parallel) {
      return parseStages((stage as ProcessLayoutNodeMapResponse)?.parallel as GraphLayoutNode[])
    } else {
      if (isExecutionSkipped(stage.status)) {
        continue
      } else {
        return defaultTo(stage.nodeUuid, '')
      }
    }
  }
  return ''
}

export function getActiveStageForPipeline(
  executionSummary?: PipelineExecutionSummary,
  pipelineExecutionStatus?: ExecutionStatus
): string | null {
  if (!executionSummary) {
    return null
  }
  const stages = processLayoutNodeMap(executionSummary)
  const n = stages.length
  // for completed pipeline, select the last completed stage
  if (isExecutionSuccess(pipelineExecutionStatus)) {
    return parseStages(stages)
  }

  // for errored pipeline, select the errored stage
  // for waiting status, select the waiting state
  if (isExecutionCompletedWithBadState(pipelineExecutionStatus) || isExecutionWaiting(pipelineExecutionStatus)) {
    for (let i = stages.length - 1; i >= 0; i--) {
      const stage = stages[i]

      if (stage.stage) {
        if (isExecutionCompletedWithBadState(stage.stage.status) || isExecutionWaiting(stage.stage.status)) {
          return stage.stage.nodeUuid || ''
        }
      } else if (stage.parallel && Array.isArray(stage.parallel)) {
        const erroredStage = stage.parallel.find(
          item => isExecutionCompletedWithBadState(item.status) || isExecutionWaiting(item.status)
        )

        /* istanbul ignore else */
        if (erroredStage) {
          return erroredStage.nodeUuid || ''
        }
      }
    }
  }

  // find the current running stage
  for (let i = 0; i < n; i++) {
    const stage = stages[i]

    // for normal stage
    if (stage.stage) {
      if (isExecutionRunning(stage.stage.status)) {
        return stage.stage.nodeUuid || ''
      }
      // for parallel stage
    } else if (stage.parallel && Array.isArray(stage.parallel)) {
      const activeStage = stage.parallel.filter(item => isExecutionRunning(item.status))[0]

      /* istanbul ignore else */
      if (activeStage) {
        return activeStage.nodeUuid || ''
      }
    }
  }

  return null
}

export interface StepStatus {
  node: string
  interrupted: boolean
  success: boolean
}

export function getActiveStep(
  graph: ExecutionGraph = {},
  pipelineExecutionSummary: PipelineExecutionSummary = {},
  nodeId?: string
): StepStatus | null {
  const { rootNodeId, nodeMap, nodeAdjacencyListMap } = graph
  const { status: pipelineStatus, layoutNodeMap } = pipelineExecutionSummary

  if (!nodeMap || !nodeAdjacencyListMap) {
    return null
  }

  const currentNodeId = nodeId || rootNodeId

  if (!currentNodeId) return null

  const node = nodeMap[currentNodeId]
  const nodeAdjacencyList = nodeAdjacencyListMap[currentNodeId]

  if (!node || !nodeAdjacencyList) {
    return null
  }

  let selectedStep: StepStatus | null = null

  if (Array.isArray(nodeAdjacencyList.children) && nodeAdjacencyList.children.length > 0) {
    const n = nodeAdjacencyList.children.length

    for (let i = 0; i < n; i++) {
      const childNodeId = nodeAdjacencyList.children[i]
      selectedStep = getActiveStep(graph, pipelineExecutionSummary, childNodeId)

      if (selectedStep && selectedStep.interrupted) {
        return selectedStep
      }
    }
  }

  if (nodeAdjacencyList.nextIds && nodeAdjacencyList.nextIds[0]) {
    selectedStep = getActiveStep(graph, pipelineExecutionSummary, nodeAdjacencyList.nextIds[0])

    if (selectedStep && selectedStep.interrupted) return selectedStep
  }

  // pipeline is success and we are in root node
  if (isExecutionSuccess(pipelineStatus) && selectedStep?.success) {
    return selectedStep
  }

  if (
    !NonSelectableNodes.includes(node.stepType as NodeType) &&
    currentNodeId !== rootNodeId &&
    !has(layoutNodeMap, node.setupId || '')
  ) {
    return {
      node: currentNodeId,
      interrupted:
        isExecutionRunning(node.status) ||
        isExecutionWaiting(node.status) ||
        isExecutionCompletedWithBadState(node.status),
      success: isExecutionSuccess(node.status)
    }
  }

  return selectedStep
}

export function getIconFromStageModule(stageModule: 'cd' | 'ci' | string | undefined, stageType?: string): IconName {
  if (stageType) {
    const icon = stagesCollection.getStageAttributes(stageType, (key: string) => key)?.icon
    if (icon) {
      return icon
    }
  }
  switch (stageModule) {
    case 'cd':
      return 'pipeline-deploy'
    case 'ci':
      return 'pipeline-build'
    default:
      return 'pipeline-deploy'
  }
}

export function getIconStylesFromCollection(stageType?: string): React.CSSProperties {
  if (stageType) {
    const iconColor = stagesCollection.getStageAttributes(stageType, key => key)?.iconColor

    if (iconColor) {
      return { color: iconColor }
    }
  }

  return {}
}

const addDependencyToArray = (service: ServiceDependency, arr: ExecutionPipelineNode<ExecutionNode>[]): void => {
  const stepItem: ExecutionPipelineItem<ExecutionNode> = {
    identifier: service.identifier as string,
    name: service.name as string,
    type: ExecutionPipelineNodeType.NORMAL,
    status: service.status as ExecutionStatus,
    icon: 'dependency-step',
    data: service as ExecutionNode,
    itemType: 'service-dependency'
  }

  // add step node
  const stepNode: ExecutionPipelineNode<ExecutionNode> = { item: stepItem }
  arr.push(stepNode)
}

const addDependencies = (
  dependencies: ServiceDependency[],
  stepsPipelineNodes: ExecutionPipelineNode<ExecutionNode>[]
): void => {
  if (dependencies && dependencies.length > 0) {
    const items: ExecutionPipelineNode<ExecutionNode>[] = []

    dependencies.forEach(_service => addDependencyToArray(_service, items))

    const dependenciesGroup: ExecutionPipelineGroupInfo<ExecutionNode> = {
      identifier: STATIC_SERVICE_GROUP_NAME,
      name: 'Dependencies', // TODO: use getString('execution.dependencyGroupName'),
      status: dependencies[0].status as ExecutionStatus, // use status of first service
      data: {},
      icon: 'step-group',
      verticalStepGroup: true,
      isOpen: true,
      items: [{ parallel: items }]
    }

    // dependency goes at the beginning
    stepsPipelineNodes.unshift({ group: dependenciesGroup })
  }
}

export const processLiteEngineTask = (
  nodeData: ExecutionNode | undefined,
  rootNodes: ExecutionPipelineNode<ExecutionNode>[],
  parentNode?: ExecutionNode
): void => {
  // NOTE: liteEngineTask contains information about dependencies
  const serviceDependencyList: ServiceDependency[] =
    // Array check is required for legacy support
    (Array.isArray(nodeData?.outcomes)
      ? nodeData?.outcomes?.find((_item: any) => !!_item.serviceDependencyList)?.serviceDependencyList
      : nodeData?.outcomes?.dependencies?.serviceDependencyList) || []

  // 1. Add dependency services
  addDependencies(serviceDependencyList, rootNodes)

  // 2. Exclude Initialize duration from the parent
  if (nodeData && parentNode) {
    const taskDuration = nodeData.endTs! - nodeData.startTs!
    parentNode.startTs = Math.min(parentNode.startTs! + taskDuration, parentNode.endTs!)
  }

  // 3. Add Initialize step ( at the first place in array )
  const stepItem: ExecutionPipelineItem<ExecutionNode> = {
    identifier: nodeData?.uuid as string,
    name: 'Initialize',
    type: getExecutionPipelineNodeType(nodeData?.stepType),
    status: nodeData?.status as ExecutionStatus,
    icon: 'initialize-step',
    data: nodeData as ExecutionNode,
    itemType: 'service-dependency'
  }
  const stepNode: ExecutionPipelineNode<ExecutionNode> = { item: stepItem }
  rootNodes.unshift(stepNode)
}

const processNodeData = (
  children: string[],
  nodeMap: ExecutionGraph['nodeMap'],
  nodeAdjacencyListMap: ExecutionGraph['nodeAdjacencyListMap'],
  rootNodes: Array<ExecutionPipelineNode<ExecutionNode>>
): Array<ExecutionPipelineNode<ExecutionNode>> => {
  const items: Array<ExecutionPipelineNode<ExecutionNode>> = []
  children?.forEach(item => {
    const nodeData = nodeMap?.[item] as ExecutionNode
    const isRollback = nodeData?.name?.endsWith(StepGroupRollbackIdentifier) ?? false
    const nodeStrategyType =
      nodeData?.stepType === NodeType.STRATEGY
        ? ((nodeData?.stepParameters?.strategyType || 'MATRIX') as string)
        : (nodeData?.stepType as string)
    if (nodeStrategyType === NodeType.FORK) {
      items.push({
        parallel: processNodeData(
          nodeAdjacencyListMap?.[item].children || /* istanbul ignore next */ [],
          nodeMap,
          nodeAdjacencyListMap,
          rootNodes
        )
      })
    } else if (
      nodeStrategyType === NodeType.STEP_GROUP ||
      nodeStrategyType === NodeType.NG_SECTION ||
      isNodeTypeMatrixOrFor(nodeStrategyType) ||
      (nodeData && isRollback)
    ) {
      items.push({
        group: {
          name: nodeData.name || /* istanbul ignore next */ '',
          identifier: item,
          data: nodeData,
          containerCss: {
            ...(isRollback ? RollbackContainerCss : {})
          },
          status: nodeData.status as ExecutionStatus,
          isOpen: true,
          skipCondition: nodeData.skipInfo?.evaluatedCondition ? nodeData.skipInfo.skipCondition : undefined,
          when: nodeData.nodeRunInfo,
          ...getIconDataBasedOnType(nodeData),
          items: processNodeData(
            nodeAdjacencyListMap?.[item].children || /* istanbul ignore next */ [],
            nodeMap,
            nodeAdjacencyListMap,
            rootNodes
          )
        }
      })
    } else {
      if (nodeStrategyType === LITE_ENGINE_TASK) {
        const parentNodeId =
          Object.entries(nodeAdjacencyListMap || {}).find(([_, val]) => {
            return (val?.children?.indexOf(nodeData.uuid!) ?? -1) >= 0
          })?.[0] || ''
        processLiteEngineTask(nodeData, rootNodes, nodeMap?.[parentNodeId])
      } else {
        items.push({
          item: {
            name: nodeData?.name || /* istanbul ignore next */ '',
            ...getIconDataBasedOnType(nodeData),
            identifier: item,
            skipCondition: nodeData?.skipInfo?.evaluatedCondition ? nodeData?.skipInfo.skipCondition : undefined,
            when: nodeData?.nodeRunInfo,
            status: nodeData?.status as ExecutionStatus,
            type: getExecutionPipelineNodeType(nodeStrategyType),
            data: nodeData
          }
        })
      }
    }
    const nextIds = nodeAdjacencyListMap?.[item].nextIds || /* istanbul ignore next */ []
    nextIds.forEach(id => {
      const nodeDataNext = nodeMap?.[id] as ExecutionNode
      const isRollbackNext = nodeDataNext?.name?.endsWith(StepGroupRollbackIdentifier) ?? false
      const nodeNextStrategyType =
        nodeDataNext?.stepType === NodeType.STRATEGY
          ? ((nodeDataNext?.stepParameters?.strategyType || 'MATRIX') as string)
          : (nodeDataNext?.stepType as string)
      if (nodeNextStrategyType === NodeType.FORK) {
        items.push({
          parallel: processNodeData(
            nodeAdjacencyListMap?.[id].children || /* istanbul ignore next */ [],
            nodeMap,
            nodeAdjacencyListMap,
            rootNodes
          )
        })
      } else if (
        nodeNextStrategyType === NodeType.STEP_GROUP ||
        isNodeTypeMatrixOrFor(nodeNextStrategyType) ||
        (isRollbackNext && nodeDataNext)
      ) {
        items.push({
          group: {
            name: nodeDataNext.name || /* istanbul ignore next */ '',
            identifier: id,
            data: nodeDataNext,
            containerCss: {
              ...(isRollbackNext ? RollbackContainerCss : {})
            },
            skipCondition: nodeDataNext.skipInfo?.evaluatedCondition ? nodeDataNext.skipInfo.skipCondition : undefined,
            when: nodeDataNext.nodeRunInfo,
            status: nodeDataNext.status as ExecutionStatus,
            isOpen: true,
            ...getIconDataBasedOnType(nodeDataNext),
            items: processNodeData(
              nodeAdjacencyListMap?.[id].children || /* istanbul ignore next */ [],
              nodeMap,
              nodeAdjacencyListMap,
              rootNodes
            )
          }
        })
      } else {
        items.push({
          item: {
            name: nodeDataNext?.name || /* istanbul ignore next */ '',
            ...getIconDataBasedOnType(nodeDataNext),
            identifier: id,
            skipCondition: nodeDataNext?.skipInfo?.evaluatedCondition ? nodeDataNext.skipInfo.skipCondition : undefined,
            when: nodeDataNext?.nodeRunInfo,
            status: nodeDataNext?.status as ExecutionStatus,
            type: getExecutionPipelineNodeType(nodeNextStrategyType),
            data: nodeDataNext
          }
        })
      }
      const nextLevels = nodeAdjacencyListMap?.[id].nextIds
      if (nextLevels) {
        items.push(...processNodeData(nextLevels, nodeMap, nodeAdjacencyListMap, rootNodes))
      }
    })
  })
  return items
}

export const hasOnlyLiteEngineTask = (children?: string[], graph?: ExecutionGraph): boolean => {
  return (
    !!children &&
    children.length === 1 &&
    graph?.nodeMap?.[children[0]]?.stepType === LITE_ENGINE_TASK &&
    graph?.nodeAdjacencyListMap?.[children[0]]?.nextIds?.length === 0
  )
}

export const processExecutionData = (graph?: ExecutionGraph): Array<ExecutionPipelineNode<ExecutionNode>> => {
  const items: Array<ExecutionPipelineNode<ExecutionNode>> = []

  /* istanbul ignore else */
  if (graph?.nodeAdjacencyListMap && graph?.rootNodeId) {
    const nodeAdjacencyListMap = graph.nodeAdjacencyListMap
    const rootNode = graph.rootNodeId
    // Ignore the graph when its fqn is pipeline, as this doesn't render pipeline graph
    if (graph?.nodeMap?.[rootNode].baseFqn === 'pipeline') {
      return items
    }
    let nodeId = nodeAdjacencyListMap[rootNode].children?.[0]
    while (nodeId && nodeAdjacencyListMap[nodeId]) {
      const nodeData = graph?.nodeMap?.[nodeId]
      /* istanbul ignore else */
      if (nodeData) {
        const isRollback = nodeData.name?.endsWith(StepGroupRollbackIdentifier) ?? false
        if (nodeData.stepType && (TopLevelNodes.indexOf(nodeData.stepType as NodeType) > -1 || isRollback)) {
          // NOTE: exception if we have only lite task engine in Execution group
          if (hasOnlyLiteEngineTask(nodeAdjacencyListMap[nodeId].children, graph)) {
            const liteTaskEngineId = nodeAdjacencyListMap?.[nodeId]?.children?.[0] || ''
            processLiteEngineTask(graph?.nodeMap?.[liteTaskEngineId], items, nodeData)
          } else if (!isEmpty(nodeAdjacencyListMap[nodeId].children)) {
            if (nodeData.identifier === 'execution') {
              items.push(
                ...processNodeData(
                  nodeAdjacencyListMap[nodeId].children || /* istanbul ignore next */ [],
                  graph?.nodeMap,
                  graph?.nodeAdjacencyListMap,
                  items
                )
              )
            } else {
              items.push({
                group: {
                  name: nodeData.name || /* istanbul ignore next */ '',
                  identifier: nodeId,
                  data: nodeData,
                  skipCondition: nodeData.skipInfo?.evaluatedCondition ? nodeData.skipInfo.skipCondition : undefined,
                  when: nodeData.nodeRunInfo,
                  containerCss: {
                    ...(RollbackIdentifier === nodeData.identifier || isRollback ? RollbackContainerCss : {})
                  },
                  status: nodeData.status as ExecutionStatus,
                  isOpen: true,
                  ...getIconDataBasedOnType(nodeData),
                  items: processNodeData(
                    nodeAdjacencyListMap[nodeId].children || /* istanbul ignore next */ [],
                    graph?.nodeMap,
                    graph?.nodeAdjacencyListMap,
                    items
                  )
                }
              })
            }
          }
        } else if (nodeData.stepType === NodeType.FORK) {
          items.push({
            parallel: processNodeData(
              nodeAdjacencyListMap[nodeId].children || /* istanbul ignore next */ [],
              graph?.nodeMap,
              graph?.nodeAdjacencyListMap,
              items
            )
          })
        } else {
          items.push({
            item: {
              name: nodeData.name || /* istanbul ignore next */ '',
              skipCondition: nodeData.skipInfo?.evaluatedCondition ? nodeData.skipInfo.skipCondition : undefined,
              when: nodeData.nodeRunInfo,
              ...getIconDataBasedOnType(nodeData),
              showInLabel: nodeData.stepType === NodeType.SERVICE || nodeData.stepType === NodeType.INFRASTRUCTURE,
              identifier: nodeId,
              status: nodeData.status as ExecutionStatus,
              type: getExecutionPipelineNodeType(nodeData?.stepType),
              data: nodeData
            }
          })
        }
      }
      nodeId = nodeAdjacencyListMap[nodeId].nextIds?.[0]
    }
  }
  return items
}

export function getStageType(node?: GraphLayoutNode): 'ci' | 'cd' | 'unknown' {
  if (node?.module?.toLowerCase?.() === 'ci' || !isEmpty(node?.moduleInfo?.ci)) {
    return 'ci'
  } else if (node?.module?.toLowerCase?.() === 'cd' || !isEmpty(node?.moduleInfo?.cd)) {
    return 'cd'
  }
  return 'unknown'
}

export function getExecutionPipelineNodeType(stepType?: string): ExecutionPipelineNodeType {
  if (stepType === StepType.Barrier || stepType === StepType.ResourceConstraint) {
    return ExecutionPipelineNodeType.ICON
  }
  if (isApprovalStep(stepType)) {
    return ExecutionPipelineNodeType.DIAMOND
  }

  return ExecutionPipelineNodeType.NORMAL
}

export const cloudFormationSteps: StepType[] = [
  StepType.CloudFormationCreateStack,
  StepType.CloudFormationDeleteStack,
  StepType.CloudFormationRollbackStack
]
export function getIconDataBasedOnType(nodeData?: ExecutionNode): {
  icon: IconName
  iconSize: number
  iconStyle?: { marginBottom: string }
} {
  if (nodeData) {
    if (nodeData.stepType === StepType.Barrier) {
      return nodeData.status === 'Success'
        ? { icon: 'barrier-close', iconSize: 57 }
        : { icon: 'barrier-open', iconSize: 70, iconStyle: { marginBottom: '38px' } }
    }
    if (nodeData.stepType === StepType.ResourceConstraint) {
      return { icon: 'traffic-lights', iconSize: 40 }
    }
    const icon = StepTypeIconsMap[nodeData?.stepType as NodeType] || factory.getStepIcon(nodeData?.stepType || '')
    return {
      icon,
      iconSize: cloudFormationSteps.includes(nodeData.stepType as StepType) ? 32 : 20
    }
  }

  return {
    icon: 'cross',
    iconSize: 20
  }
}

/** Add dependency services to nodeMap */
export const addServiceDependenciesFromLiteTaskEngine = (
  nodeMap: { [key: string]: ExecutionNode },
  adjacencyMap?: { [key: string]: ExecutionNodeAdjacencyList }
): void => {
  const liteEngineTask = Object.values(nodeMap).find(item => item.stepType === LITE_ENGINE_TASK)
  if (liteEngineTask) {
    const parentNodeId =
      Object.entries(adjacencyMap || {}).find(([_, val]) => {
        return (val?.children?.indexOf(liteEngineTask.uuid!) ?? -1) >= 0
      })?.[0] || ''
    const parentNode: ExecutionNode | undefined = nodeMap[parentNodeId]

    // NOTE: liteEngineTask contains information about dependency services
    const serviceDependencyList: ExecutionNode[] =
      // Array check is required for legacy support
      (Array.isArray(liteEngineTask.outcomes)
        ? liteEngineTask.outcomes.find((_item: any) => !!_item.serviceDependencyList)?.serviceDependencyList
        : liteEngineTask.outcomes?.dependencies?.serviceDependencyList) || []

    // 1. add service dependencies to nodeMap
    serviceDependencyList.forEach(service => {
      if (service?.identifier) {
        service.stepType = 'dependency-service'
        service.executableResponses = [
          {
            task: {
              logKeys: (service as any).logKeys
            } as any
          }
        ]
        if (parentNode && isExecutionRunning(parentNode.status)) {
          // If execution is still running, we should be getting logs as stream, not blob
          service.status = ExecutionStatusEnum.Running
        }
        nodeMap[service.identifier] = service
      }
    })

    // 2. add Initialize (Initialize step is liteEngineTask step)
    // override step name
    if (liteEngineTask.uuid) {
      liteEngineTask.name = 'Initialize'
      nodeMap[liteEngineTask.uuid] = liteEngineTask
    }
  }
}

export const getChildNodeDataForMatrix = (
  parentNode: GraphLayoutNode,
  layoutNodeMap: LayoutNodeMapInterface
): PipelineGraphState[] => {
  const childData: PipelineGraphState[] = []
  if (isNodeTypeMatrixOrFor(parentNode?.nodeType)) {
    parentNode?.edgeLayoutList?.currentNodeChildren?.forEach(item => {
      const nodeDataItem = layoutNodeMap[item]
      const matrixNodeName =
        nodeDataItem?.strategyMetadata?.matrixmetadata?.matrixvalues &&
        `(${Object.values(nodeDataItem?.strategyMetadata?.matrixmetadata?.matrixvalues)?.join(', ')}): `
      childData.push({
        id: nodeDataItem.nodeExecutionId as string, // matrix node nodeExecId(unique) + stageNodeId (nodeUUID) commo
        stageNodeId: nodeDataItem?.nodeUuid as string,
        identifier: nodeDataItem.nodeIdentifier as string,
        type: nodeDataItem.nodeType as string,
        name: nodeDataItem.name as string,
        icon: 'cross',
        data: {
          ...(nodeDataItem as any),
          graphType: PipelineGraphType.STAGE_GRAPH,
          matrixNodeName
        },
        children: []
      })
    })
  }

  return childData
}

export const isNodeTypeMatrixOrFor = (nodeType?: string): boolean => {
  return [NodeTypes.Matrix, NodeTypes.For, NodeTypes.Parallelism].includes(nodeType as NodeTypes)
}
export const processLayoutNodeMapV1 = (executionSummary?: PipelineExecutionSummary): PipelineGraphState[] => {
  const response: PipelineGraphState[] = []
  if (!executionSummary) {
    return response
  }
  const startingNodeId = executionSummary.startingNodeId
  const layoutNodeMap = executionSummary.layoutNodeMap
  if (startingNodeId && layoutNodeMap?.[startingNodeId]) {
    let nodeDetails: GraphLayoutNode | undefined = layoutNodeMap[startingNodeId]

    while (nodeDetails) {
      const currentNodeChildren: string[] | undefined = nodeDetails?.edgeLayoutList?.currentNodeChildren
      const nextIds: string[] | undefined = nodeDetails?.edgeLayoutList?.nextIds
      if (nodeDetails?.nodeType === NodeTypes.Parallel && currentNodeChildren && currentNodeChildren.length > 1) {
        const firstParallelNode = layoutNodeMap[currentNodeChildren[0]]
        const restChildNodes = currentNodeChildren.slice(1)
        const parentNode = {
          id: firstParallelNode?.nodeUuid as string,
          identifier: firstParallelNode?.nodeIdentifier as string,
          type: firstParallelNode?.nodeType as string,
          name: firstParallelNode?.name as string,
          icon: 'cross',
          data: {
            ...(firstParallelNode as any),
            ...(isNodeTypeMatrixOrFor(firstParallelNode?.nodeType) && {
              children: getChildNodeDataForMatrix(firstParallelNode, layoutNodeMap),
              graphType: PipelineGraphType.STAGE_GRAPH,
              id: firstParallelNode?.nodeUuid,
              maxParallelism: firstParallelNode?.moduleInfo?.maxConcurrency?.value
            })
          },

          children: restChildNodes.map(item => {
            const nodeDataItem = layoutNodeMap[item]
            // eslint-disable-next-line @typescript-eslint/no-shadow
            return {
              id: nodeDataItem.nodeUuid as string,
              identifier: nodeDataItem.nodeIdentifier as string,
              type: nodeDataItem.nodeType as string,
              name: nodeDataItem.name as string,
              icon: 'cross',
              data: {
                ...(nodeDataItem as any),
                ...(isNodeTypeMatrixOrFor(nodeDataItem?.nodeType) && {
                  children: getChildNodeDataForMatrix(nodeDataItem, layoutNodeMap),
                  graphType: PipelineGraphType.STAGE_GRAPH,
                  id: nodeDataItem?.nodeUuid,
                  maxParallelism: nodeDataItem?.moduleInfo?.maxConcurrency?.value
                })
              },
              children: []
            }
          })
        } as PipelineGraphState

        response.push(parentNode)
        nodeDetails = layoutNodeMap[nodeDetails.edgeLayoutList?.nextIds?.[0] || '']
      } else if (
        isNodeTypeMatrixOrFor(nodeDetails?.nodeType) &&
        currentNodeChildren &&
        currentNodeChildren.length >= 1
      ) {
        const childData: PipelineGraphState[] = []
        currentNodeChildren.forEach(item => {
          const nodeDataItem = layoutNodeMap[item]
          const matrixNodeName =
            nodeDataItem?.strategyMetadata?.matrixmetadata?.matrixvalues &&
            `(${Object.values(nodeDataItem?.strategyMetadata?.matrixmetadata?.matrixvalues)?.join(' ')}): `
          childData.push({
            id: nodeDataItem.nodeExecutionId as string,
            stageNodeId: nodeDataItem?.nodeUuid as string,
            identifier: nodeDataItem.nodeIdentifier as string,
            type: nodeDataItem.nodeType as string,
            name: nodeDataItem.name as string,
            icon: 'cross',
            data: {
              ...(nodeDataItem as any),
              graphType: PipelineGraphType.STAGE_GRAPH,
              matrixNodeName
            },
            children: []
          })
        })
        response.push({
          id: nodeDetails?.nodeUuid as string,
          identifier: nodeDetails?.nodeIdentifier as string,
          type: nodeDetails?.nodeType as string,
          name: nodeDetails?.name as string,
          icon: 'cross',
          data: {
            ...(nodeDetails as any),
            children: childData,
            graphType: PipelineGraphType.STAGE_GRAPH,
            id: nodeDetails?.nodeUuid,
            maxParallelism: nodeDetails?.moduleInfo?.maxConcurrency?.value
          }
        })

        if (nextIds && nextIds.length === 1) {
          nodeDetails = layoutNodeMap[nextIds[0]]
        } else {
          nodeDetails = undefined
        }
      } else if (
        nodeDetails?.nodeType === NodeTypes.Parallel &&
        currentNodeChildren &&
        layoutNodeMap[currentNodeChildren[0]]
      ) {
        const nodedata = layoutNodeMap[currentNodeChildren[0]]
        response.push({
          id: nodedata.nodeUuid as string,
          identifier: nodedata.nodeIdentifier as string,
          type: nodedata.nodeType as string,
          name: nodedata.name as string,
          icon: 'cross',
          data: nodedata as any,
          children: []
        })
        nodeDetails = layoutNodeMap[nodeDetails.edgeLayoutList?.nextIds?.[0] || '']
      } else {
        response.push({
          id: nodeDetails?.nodeUuid as string,
          identifier: nodeDetails?.nodeIdentifier as string,
          type: nodeDetails?.nodeType as string,
          name: nodeDetails?.name as string,
          icon: 'cross',
          data: nodeDetails as any,
          children: []
        })
        if (nextIds && nextIds.length === 1) {
          nodeDetails = layoutNodeMap[nextIds[0]]
        } else {
          nodeDetails = undefined
        }
      }
    }
  }
  return response
}

export const processExecutionDataForGraph = (stages?: PipelineGraphState[]): PipelineGraphState[] => {
  const items: PipelineGraphState[] = []
  stages?.forEach(currentStage => {
    if (currentStage?.children?.length) {
      const childNodes: PipelineGraphState[] = []
      const currentStageData = currentStage.data
      currentStage = {
        ...currentStage,
        icon: getIconFromStageModule(currentStageData?.module, currentStageData?.nodeType),
        status: currentStageData?.status as any,
        type: [StageType.FOR, StageType.PARALLELISM].includes(currentStage?.type as StageType)
          ? ExecutionPipelineNodeType.MATRIX
          : currentStage?.type,
        data: {
          ...currentStage.data,
          conditionalExecutionEnabled: getConditionalExecutionFlag(currentStage?.data?.nodeRunInfo),
          identifier: currentStageData?.nodeUuid || /* istanbul ignore next */ '',
          name: currentStageData?.name || currentStageData?.nodeIdentifier || /* istanbul ignore next */ '',
          status: currentStageData?.status as any,
          barrierFound: currentStageData?.barrierFound,
          tertiaryIcon: currentStageData?.barrierFound ? BARRIER_WITH_OPEN_LINKS : undefined,
          type:
            currentStageData?.nodeType === StageType.APPROVAL
              ? ExecutionPipelineNodeType.DIAMOND
              : isNodeTypeMatrixOrFor(currentStageData?.nodeType)
              ? ExecutionPipelineNodeType.MATRIX
              : ExecutionPipelineNodeType.NORMAL,
          skipCondition: currentStageData?.skipInfo?.evaluatedCondition
            ? currentStageData.skipInfo.skipCondition
            : undefined,
          disableClick: isExecutionNotStarted(currentStageData?.status) || isExecutionSkipped(currentStageData?.status),
          when: currentStageData?.nodeRunInfo,
          graphType: PipelineGraphType.STAGE_GRAPH,
          isExecutionView: true
        }
      }
      currentStage?.children?.forEach?.(currentNode => {
        const node = currentNode.data
        node &&
          childNodes.push({
            ...currentNode,
            icon: getIconFromStageModule(node?.module, node.nodeType),
            status: node?.status as never,
            data: {
              ...node,
              conditionalExecutionEnabled: getConditionalExecutionFlag(node?.nodeRunInfo),
              identifier: node?.nodeUuid || /* istanbul ignore next */ '',
              name: node?.name || node?.nodeIdentifier || /* istanbul ignore next */ '',
              status: node?.status as never,
              barrierFound: node?.barrierFound,
              tertiaryIcon: currentStageData?.barrierFound ? BARRIER_WITH_OPEN_LINKS : undefined,
              type:
                node?.nodeType === StageType.APPROVAL
                  ? ExecutionPipelineNodeType.DIAMOND
                  : ExecutionPipelineNodeType.NORMAL,
              skipCondition: node?.skipInfo?.evaluatedCondition ? node.skipInfo.skipCondition : undefined,
              disableClick: isExecutionNotStarted(node?.status) || isExecutionSkipped(node?.status),
              when: node?.nodeRunInfo,
              graphType: PipelineGraphType.STAGE_GRAPH
            }
          })
      })
      currentStage.children = childNodes as PipelineGraphState[]
      items.push(currentStage)
    } else {
      const stage = currentStage.data
      items.push({
        ...currentStage,
        icon: getIconFromStageModule(stage?.module, stage?.nodeType),
        status: stage?.status as any,
        type: [StageType.FOR, StageType.PARALLELISM].includes(currentStage?.type as StageType)
          ? ExecutionPipelineNodeType.MATRIX
          : currentStage?.type,
        data: {
          ...stage,
          conditionalExecutionEnabled: getConditionalExecutionFlag(stage?.nodeRunInfo),
          identifier: stage?.nodeUuid || /* istanbul ignore next */ '',
          name: stage?.name || stage?.nodeIdentifier || /* istanbul ignore next */ '',
          status: stage?.status as any,
          barrierFound: stage?.barrierFound,
          tertiaryIcon: stage?.barrierFound ? BARRIER_WITH_OPEN_LINKS : undefined,
          type:
            stage?.nodeType === StageType.APPROVAL
              ? ExecutionPipelineNodeType.DIAMOND
              : isNodeTypeMatrixOrFor(stage?.nodeType)
              ? ExecutionPipelineNodeType.MATRIX
              : ExecutionPipelineNodeType.NORMAL,
          skipCondition: stage?.skipInfo?.evaluatedCondition ? stage.skipInfo.skipCondition : undefined,
          disableClick: isExecutionNotStarted(stage?.status) || isExecutionSkipped(stage?.status),
          when: stage?.nodeRunInfo,
          data: stage,
          graphType: PipelineGraphType.STAGE_GRAPH
        }
      })
    }
  })
  return items
}
