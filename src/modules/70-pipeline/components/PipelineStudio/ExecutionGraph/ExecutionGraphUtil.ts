/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { NodeModelListener, LinkModelListener } from '@projectstorm/react-diagrams-core'
import type { BaseModelListener } from '@projectstorm/react-canvas-core'
import { v4 as nameSpace, v5 as uuid, version } from 'uuid'
import { defaultTo, isNil } from 'lodash-es'
import type { IconName } from '@wings-software/uicore'
import { IconNodeModel } from '@pipeline/components/Diagram/node/IconNode/IconNodeModel'
import type {
  ExecutionElementConfig,
  ExecutionWrapperConfig,
  ParallelStepElementConfig,
  StepElementConfig,
  StepGroupElementConfig
} from 'services/cd-ng'
import type { DependencyElement } from 'services/ci'
import { StepType as PipelineStepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StageType } from '@pipeline/utils/stageHelpers'
import { EmptyNodeSeparator } from '../StageBuilder/StageBuilderUtil'
import {
  CreateNewModel,
  DefaultLinkModel,
  DefaultNodeModel,
  StepGroupNodeLayerModel,
  StepGroupNodeLayerOptions,
  StepsType,
  DiamondNodeModel,
  DiagramType
} from '../../Diagram'

// TODO: have to be auto generated from swagger/API
export interface DependenciesWrapper {
  [key: string]: any
}

export type ExecutionWrapper = {
  [key: string]: any
}
export interface ExecutionGraphState {
  isRollback: boolean
  states: StepStateMap
  stepsData: ExecutionElementConfig
  dependenciesData: DependencyElement[]
}

export interface Listeners {
  nodeListeners: NodeModelListener
  linkListeners: LinkModelListener
  layerListeners: BaseModelListener
}

export const generateRandomString = (name: string): string => uuid(name, nameSpace())

export const isCustomGeneratedString = (name: string): boolean => {
  try {
    return version(name) === 5
  } catch (_e) {
    return false
  }
}

export enum StepType {
  STEP = 'STEP',
  STEP_GROUP = 'STEP_GROUP',
  SERVICE = 'SERVICE',
  SERVICE_GROUP = 'SERVICE_GROUP'
}
export interface StepState {
  stepType: StepType
  isRollback?: boolean
  isStepGroupRollback?: boolean
  isStepGroupCollapsed?: boolean
  isStepGroup?: boolean
  isSaved: boolean
  inheritedSG?: number
}

export const getDefaultStepGroupState = (): StepState => ({
  isSaved: false,
  isStepGroupCollapsed: false,
  isStepGroupRollback: false,
  isStepGroup: true,
  isRollback: false,
  stepType: StepType.STEP_GROUP
})

export const getDefaultStepState = (): StepState => ({ isSaved: false, isStepGroup: false, stepType: StepType.STEP })

export const getDefaultDependencyServiceState = (): StepState => ({
  isSaved: false,
  isStepGroup: false,
  stepType: StepType.SERVICE
})

export type StepStateMap = Map<string, StepState>

export const calculateDepthPS = (
  node: ExecutionWrapperConfig,
  stepStates: StepStateMap,
  spaceAfterGroup: number,
  SPACE_AFTER_GROUP: number
): number => {
  const depth = 1
  let groupMaxDepth = 0
  if (node.stepGroup) {
    const stepState = stepStates.get(node.stepGroup.identifier)
    // collapsed group
    if (stepState && stepState.isStepGroupCollapsed) {
      return 1
    }
    // expanded group
    if (node.stepGroup.steps?.length > 0) {
      groupMaxDepth = 0
      node.stepGroup.steps.forEach(nodeG => {
        let depthInner = 0
        if (nodeG?.parallel) {
          // parallel
          nodeG?.parallel.forEach(nodeP => {
            depthInner += calculateDepthPS(nodeP, stepStates, SPACE_AFTER_GROUP, SPACE_AFTER_GROUP)
          })
        } else {
          // step
          depthInner = 1
        }
        groupMaxDepth = Math.max(groupMaxDepth, depthInner)
      })
    } else {
      groupMaxDepth = 1
    }
    groupMaxDepth += spaceAfterGroup
  }

  return Math.max(groupMaxDepth, depth)
}

export const getDependencyFromNode = (
  servicesData: DependencyElement[] | undefined,
  node: DefaultNodeModel
): { node: DependencyElement | undefined; parent: DependencyElement[] | undefined } => {
  const _service = servicesData?.find((service: DependenciesWrapper) => node.getIdentifier() === service.identifier)
  return { node: _service, parent: servicesData }
}

export const getDependencyFromNodeV1 = (
  servicesData: DependencyElement[] | undefined,
  nodeId: string
): { node: DependencyElement | undefined; parent: DependencyElement[] | undefined } => {
  const _service = servicesData?.find((service: DependenciesWrapper) => nodeId === service.identifier)
  return { node: _service, parent: servicesData }
}

export const getStepFromNode = (
  stepData: ExecutionWrapper | undefined,
  node?: DefaultNodeModel,
  isComplete = false,
  isFindParallelNode = false,
  nodeId?: string,
  parentId?: string
): { node: ExecutionWrapper | undefined; parent: ExecutionWrapper[] } => {
  let data = stepData
  if (parentId) {
    const group = getStepFromId(data, defaultTo(parentId, ''), false).node
    if (group) {
      data = group
    }
  }
  return getStepFromId(data, nodeId || node?.getIdentifier() || '', isComplete, isFindParallelNode)
}

export const getStepFromId = (
  stageData: ExecutionWrapper | undefined,
  id: string,
  isComplete = false,
  isFindParallelNode = false
): {
  node: ExecutionWrapper | undefined
  parent: ExecutionWrapper[]
  parallelParent?: ExecutionWrapper
  parallelParentIdx?: number
  parallelParentParent?: ExecutionWrapper[]
} => {
  let returnObj = getStepFromIdInternal(
    (stageData as ExecutionElementConfig)?.steps,
    id,
    isComplete,
    isFindParallelNode
  )
  if (!returnObj.node) {
    returnObj = getStepFromIdInternal(
      (stageData as ExecutionElementConfig)?.rollbackSteps,
      id,
      isComplete,
      isFindParallelNode
    )
  }
  return returnObj
}

const getStepFromIdInternal = (
  stepData: ExecutionWrapperConfig[] | undefined,
  id: string,
  isComplete = false,
  isFindParallelNode = false,
  _parallelParent: ExecutionWrapperConfig | undefined = undefined,
  _parallelParentIdx: number | undefined = undefined,
  _parallelParentParent: ExecutionWrapperConfig[] | undefined = undefined
): {
  node: ExecutionWrapper | undefined
  parent: ExecutionWrapper[]
  parallelParent?: ExecutionWrapper
  parallelParentIdx?: number
  parallelParentParent?: ExecutionWrapper[]
} => {
  let stepResp: ExecutionWrapper | StepElementConfig | ParallelStepElementConfig | StepGroupElementConfig | undefined =
    undefined
  let parent: ExecutionWrapper[] = []
  let parallelParent: ExecutionWrapper | undefined = undefined
  let parallelParentIdx: number | undefined
  let parallelParentParent: ExecutionWrapper[] | undefined = undefined
  stepData?.every((node, idx) => {
    if (node.step && node.step.identifier === id) {
      if (isComplete) {
        stepResp = node
      } else {
        stepResp = node.step
      }
      parallelParent = _parallelParent
      parallelParentParent = _parallelParentParent
      parallelParentIdx = _parallelParentIdx
      parent = stepData
      return false
    } else if (node.parallel) {
      if (isFindParallelNode) {
        node.parallel?.every(nodeP => {
          if (nodeP.step && nodeP.step.identifier === id) {
            if (isComplete) {
              stepResp = node
            } else {
              stepResp = node.parallel
            }
            parent = stepData
            return false
          } else if (nodeP.stepGroup) {
            if (nodeP.stepGroup?.identifier === id) {
              if (isComplete) {
                stepResp = node
              } else {
                stepResp = node.parallel
              }
              parent = stepData
              parallelParent = _parallelParent
              parallelParentParent = _parallelParentParent
              parallelParentIdx = _parallelParentIdx
              return false
            } else {
              const response = getStepFromId(nodeP.stepGroup, id, isComplete, isFindParallelNode)
              if (response.node) {
                parent = response.parent
                stepResp = response.node
                parallelParent = response.parallelParent
                parallelParentIdx = response.parallelParentIdx
                parallelParentParent = response.parallelParentParent
                return false
              }
            }
          }
          return true
        })
        if (stepResp) {
          return false
        }
      } else {
        const response = getStepFromIdInternal(node.parallel, id, isComplete, false, node, idx, stepData)
        if (response.node) {
          stepResp = response.node
          parent = response.parent
          parallelParent = response.parallelParent
          parallelParentIdx = response.parallelParentIdx
          parallelParentParent = response.parallelParentParent
          return false
        }
      }
    } else if (node.stepGroup) {
      if (node.stepGroup?.identifier === id) {
        if (isComplete) {
          stepResp = node
        } else {
          stepResp = node.stepGroup
        }
        parent = stepData
        parallelParent = _parallelParent
        parallelParentParent = _parallelParentParent
        parallelParentIdx = _parallelParentIdx
        return false
      } else {
        const response = getStepFromId(node.stepGroup, id, isComplete, isFindParallelNode)
        if (response.node) {
          parent = response.parent
          stepResp = response.node
          parallelParent = response.parallelParent
          parallelParentIdx = response.parallelParentIdx
          parallelParentParent = response.parallelParentParent
          return false
        }
      }
    }
    return true
  })
  return { parent, node: stepResp, parallelParent, parallelParentIdx, parallelParentParent }
}

// identifier for Dependencies/Services group that is always present
export const STATIC_SERVICE_GROUP_NAME = 'static_service_group'

export const getDependenciesState = (services: DependenciesWrapper[], mapState: StepStateMap): void => {
  // we have one service group
  mapState.set(STATIC_SERVICE_GROUP_NAME, {
    isSaved: false,
    isStepGroupCollapsed: false,
    isStepGroupRollback: false,
    isStepGroup: true,
    isRollback: false,
    stepType: StepType.SERVICE_GROUP
  })

  services.forEach((service: DependenciesWrapper) => {
    mapState.set(service.identifier, getDefaultDependencyServiceState())
  })
}

export const applyExistingStates = (newMap: Map<string, StepState>, existingMap: Map<string, StepState>): void => {
  newMap.forEach((_value, identifier) => {
    const existingState = existingMap.get(identifier)
    if (existingState) {
      //NOTE: reset isSaved
      newMap.set(identifier, { ...existingState, isSaved: false })
    }
  })
}

export const updateDependenciesState = (services: DependenciesWrapper[], mapState: StepStateMap): void => {
  // we have one service group
  const serviceGroupData = mapState.get(STATIC_SERVICE_GROUP_NAME)
  if (serviceGroupData) {
    mapState.set(STATIC_SERVICE_GROUP_NAME, {
      ...serviceGroupData,
      isSaved: true
    })
  }
  services.forEach((service: DependenciesWrapper) => {
    const serviceData = mapState.get(service.identifier)
    if (serviceData) {
      mapState.set(service.identifier, { ...serviceData, isSaved: true })
    }
  })
}

export function isExecutionWrapperConfig(node?: ExecutionWrapper): node is ExecutionWrapperConfig {
  return !!(
    (node as ExecutionWrapperConfig)?.step ||
    (node as ExecutionWrapperConfig)?.parallel ||
    (node as ExecutionWrapperConfig)?.stepGroup
  )
}

export function isExecutionElementConfig(node?: ExecutionWrapper): node is ExecutionElementConfig {
  return !!((node as ExecutionElementConfig)?.steps || (node as ExecutionElementConfig)?.rollbackSteps)
}

export const getStepsState = (node: ExecutionWrapper, mapState: StepStateMap): void => {
  if (isExecutionWrapperConfig(node) && node.step) {
    mapState.set(node.step.identifier, getDefaultStepState())
  } else if (isExecutionElementConfig(node) && node.steps) {
    node.steps.forEach(step => {
      getStepsState(step, mapState)
    })
    if (node.rollbackSteps) {
      node.rollbackSteps.forEach(step => {
        getStepsState(step, mapState)
      })
    }
  } else if (isExecutionElementConfig(node) && node.rollbackSteps) {
    node.rollbackSteps.forEach(step => {
      getStepsState(step, mapState)
    })
  } else if (isExecutionWrapperConfig(node) && node.parallel) {
    node.parallel.forEach(step => {
      getStepsState(step, mapState)
    })
  } else if (isExecutionWrapperConfig(node) && node.stepGroup) {
    node.stepGroup.steps?.forEach?.(step => {
      getStepsState(step, mapState)
    })

    mapState.set(node.stepGroup.identifier, mapState.get(node.stepGroup.identifier) || getDefaultStepGroupState())
  }
}

export const updateStepsState = (
  node: ExecutionWrapperConfig | ExecutionElementConfig,
  mapState: StepStateMap
): void => {
  if (isExecutionWrapperConfig(node) && node.step && mapState.get(node.step.identifier)) {
    const data = mapState.get(node.step.identifier)
    if (data) {
      mapState.set(node.step.identifier, { ...data, isSaved: true })
    }
  } else if (isExecutionElementConfig(node) && node.steps) {
    node.steps.forEach(step => {
      updateStepsState(step, mapState)
    })
    if (node.rollbackSteps) {
      node.rollbackSteps.forEach(step => {
        updateStepsState(step, mapState)
      })
    }
  } else if (isExecutionElementConfig(node) && node.rollbackSteps) {
    node.rollbackSteps.forEach(step => {
      updateStepsState(step, mapState)
    })
  } else if (isExecutionWrapperConfig(node) && node.parallel) {
    node.parallel.forEach(step => {
      updateStepsState(step, mapState)
    })
  } else if (isExecutionWrapperConfig(node) && node.stepGroup) {
    node.stepGroup.steps?.forEach?.(step => {
      updateStepsState(step, mapState)
    })
    const groupData = mapState.get(node.stepGroup.identifier)
    if (groupData) {
      mapState.set(node.stepGroup.identifier, { ...groupData, isSaved: true })
    }
  }
}

export const removeStepOrGroup = (
  state: ExecutionGraphState,
  entity: any,
  skipFlatten = false,
  newPipelineStudioEnabled?: boolean
): boolean => {
  if (newPipelineStudioEnabled) {
    return removeStepOrGroupV2(state, entity, skipFlatten)
  }
  // 1. services
  const servicesData = state.dependenciesData
  if (servicesData) {
    let idx
    servicesData.forEach((service, _idx) => {
      if (service.identifier === entity.getOptions().identifier) {
        idx = _idx
      }
    })
    if (idx !== undefined) {
      servicesData.splice(idx, 1)
      return true
    }
  }

  // 2. steps
  let isRemoved = false
  let data: ExecutionWrapper = state.stepsData
  const layer = entity.getParent()
  if (layer instanceof StepGroupNodeLayerModel) {
    const node = getStepFromId(data, layer.getIdentifier() || '', false).node
    if (node) {
      data = node
    }
  }
  const response = getStepFromId(data, entity.getIdentifier(), true)
  if (response.node) {
    const index = response.parent.indexOf(response.node)
    if (index > -1) {
      response.parent.splice(index, 1)
      // NOTE: if there is one item in parallel array, we are removing parallel array
      if (
        !skipFlatten &&
        response.parallelParent &&
        (response.parallelParent as ExecutionWrapperConfig).parallel?.length === 1
      ) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const stepToReAttach = (response.parallelParent as ExecutionWrapperConfig).parallel![0]
        // reattach step
        if (response.parallelParentParent && response.parallelParentIdx !== undefined) {
          response.parallelParentParent[response.parallelParentIdx] = stepToReAttach
        }
      }
      isRemoved = true
    }
  }
  return isRemoved
}

export const removeStepOrGroupV2 = (state: ExecutionGraphState, entity: any, skipFlatten = false): boolean => {
  // 1. services
  const servicesData = state.dependenciesData
  if (servicesData) {
    let idx
    servicesData.forEach((service, _idx) => {
      if (service.identifier === entity?.node?.identifier) {
        idx = _idx
      }
    })
    if (idx !== undefined) {
      servicesData.splice(idx, 1)
      return true
    }
  }

  // 2. steps
  let isRemoved = false
  let data: ExecutionWrapper = state.stepsData
  // const layer = entity.getParent()
  if (entity?.node?.parentIdentifier) {
    const node = getStepFromId(data, entity?.node?.parentIdentifier || '', false).node
    if (node) {
      data = node
    }
  }
  const response = getStepFromId(data, entity?.node?.identifier, true)
  if (response.node) {
    const index = response.parent.indexOf(response.node)
    if (index > -1) {
      response.parent.splice(index, 1)
      // NOTE: if there is one item in parallel array, we are removing parallel array
      if (
        !skipFlatten &&
        response.parallelParent &&
        (response.parallelParent as ExecutionWrapperConfig).parallel?.length === 1
      ) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const stepToReAttach = (response.parallelParent as ExecutionWrapperConfig).parallel![0]
        // reattach step
        if (response.parallelParentParent && response.parallelParentIdx !== undefined) {
          response.parallelParentParent[response.parallelParentIdx] = stepToReAttach
        }
      }
      isRemoved = true
    }
  }
  return isRemoved
}

export const isLinkUnderStepGroup = (link: DefaultLinkModel): boolean => {
  const sourceNode = link.getSourcePort().getNode() as DefaultNodeModel
  const targetNode = link.getTargetPort().getNode() as DefaultNodeModel
  if (
    sourceNode.getParent() instanceof StepGroupNodeLayerModel &&
    targetNode.getParent() instanceof StepGroupNodeLayerModel &&
    sourceNode.getParent() === targetNode.getParent()
  ) {
    return true
  }
  return false
}

export const addService = (data: DependencyElement[], service: DependencyElement): void => {
  data.push(service)
}

export const addStepOrGroup = (
  entity: any,
  data: ExecutionWrapper,
  step: ExecutionWrapperConfig,
  isParallel: boolean,
  isRollback: boolean,
  newPipelineStudioEnabled?: boolean
): void => {
  if (newPipelineStudioEnabled) {
    addStepOrGroupV2(entity, data, step, isParallel, isRollback)
    return
  }

  if (entity instanceof DefaultLinkModel) {
    const sourceNode = entity.getSourcePort().getNode() as DefaultNodeModel
    const targetNode = entity.getTargetPort().getNode() as DefaultNodeModel
    if (isLinkUnderStepGroup(entity)) {
      const layer = sourceNode.getParent()
      if (layer instanceof StepGroupNodeLayerModel) {
        const node = getStepFromId(data, layer.getIdentifier() || '', false).node
        if (node) {
          data = node
        }
      }
    }
    let response = getStepFromId(data, sourceNode.getIdentifier(), true)
    let next = 1
    if (!response.node) {
      response = getStepFromId(data, targetNode.getIdentifier(), true)
      next = 0
    }
    if (response.node) {
      const index = response.parent.indexOf(response.node)
      if (index > -1) {
        response.parent.splice(index + next, 0, step)
      }
    } else {
      // parallel next parallel case
      let nodeId = sourceNode.getIdentifier().split(EmptyNodeSeparator)[1]
      response = getStepFromId(data, nodeId, true, true)
      next = 1
      if (!response.node) {
        nodeId = targetNode.getIdentifier().split(EmptyNodeSeparator)[2]
        response = getStepFromId(data, nodeId, true, true)
        next = 0
      }
      if (response.node) {
        const index = response.parent.indexOf(response.node)
        if (index > -1) {
          response.parent.splice(index + next, 0, step)
        }
      }
    }
  } else if (entity instanceof CreateNewModel) {
    // Steps if you are under step group
    const groupId = entity.getIdentifier().split(EmptyNodeSeparator)[1]
    const node = getStepFromId(data, groupId).node
    const layer = entity.getParent()
    if (layer instanceof StepGroupNodeLayerModel) {
      const options = layer.getOptions() as StepGroupNodeLayerOptions
      const isRollbackGroup = options.rollBackProps?.active === StepsType.Rollback
      if (!isRollbackGroup && isExecutionElementConfig(node) && node?.steps) {
        node.steps.push(step)
      } else if (isRollbackGroup && isExecutionElementConfig(node) && node) {
        if (isNil(node.rollbackSteps)) {
          node.rollbackSteps = []
        }
        node.rollbackSteps.push(step)
      }
    } else {
      if (isRollback) {
        if (isExecutionElementConfig(data)) data.rollbackSteps?.push?.(step)
      } else {
        if (isExecutionElementConfig(data)) data.steps.push(step)
      }
    }
  } else if (entity instanceof DefaultNodeModel) {
    if (isParallel) {
      const response = getStepFromId(data, entity.getIdentifier(), true, true) as {
        node: ExecutionWrapperConfig
        parent: ExecutionWrapperConfig[]
      }
      if (response.node) {
        if (response.node.parallel && response.node.parallel.length > 0) {
          response.node.parallel.push(step)
        } else {
          const index = response.parent.indexOf(response.node)
          if (index > -1) {
            response.parent.splice(index, 1, { parallel: [response.node, step] })
          }
        }
      }
    } else {
      if (isRollback) {
        ;(data as ExecutionElementConfig).rollbackSteps?.push?.(step)
      } else {
        ;(data as ExecutionElementConfig).steps.push(step)
      }
    }
  } else if (entity instanceof StepGroupNodeLayerModel) {
    if (isParallel) {
      const response = getStepFromId(data, entity.getIdentifier() || '', true, true) as {
        node: ExecutionWrapperConfig
        parent: ExecutionWrapperConfig[]
      }
      if (response.node) {
        if (response.node.parallel && response.node.parallel.length > 0) {
          response.node.parallel.push(step)
        } else {
          const index = response.parent.indexOf(response.node)
          if (index > -1) {
            response.parent.splice(index, 1, { parallel: [response.node, step] })
          }
        }
      }
    }
  }
}

export const addStepOrGroupV2 = (
  entity: any,
  data: ExecutionWrapper,
  step: ExecutionWrapperConfig,
  isParallel: boolean,
  isRollback: boolean
): void => {
  if (entity?.entityType === DiagramType.Link) {
    const sourceNode = entity?.isRightAddIcon ? entity?.node : entity?.node?.prevNode
    const targetNode = entity?.isRightAddIcon ? entity?.node?.nextNode : entity?.node
    if (entity?.node?.parentIdentifier) {
      const node = getStepFromId(data, entity?.node?.parentIdentifier || '', false).node
      if (node) {
        data = node
      }
    }
    let response = getStepFromId(data, sourceNode?.identifier || '', true, sourceNode?.children?.length)
    let next = 1
    if (!response.node) {
      response = getStepFromId(data, targetNode?.identifier || '', true, targetNode?.children?.length)
      next = 0
    }
    if (response.node) {
      const index = response.parent.indexOf(response.node)
      if (index > -1) {
        response.parent.splice(index + next, 0, step)
      }
    }
  } else if (entity?.entityType === DiagramType.CreateNew) {
    // Steps if you are under step group
    const groupId = entity?.identifier
    const node = getStepFromId(data, groupId).node
    if (entity?.node?.parentIdentifier) {
      if (isExecutionElementConfig(node) && node?.steps) {
        node.steps.push(step)
      } else if (isExecutionElementConfig(node) && node) {
        if (isNil(node.rollbackSteps)) {
          node.rollbackSteps = []
        }
        node.rollbackSteps.push(step)
      }
    } else {
      if (isRollback) {
        if (isExecutionElementConfig(data)) {
          data.rollbackSteps?.push?.(step)
        }
      } else {
        if (isExecutionElementConfig(data)) {
          data.steps.push(step)
        }
      }
    }
  } else if (entity?.entityType === DiagramType.Default) {
    if (isParallel) {
      const response = getStepFromId(data, entity.identifier, true, true) as {
        node: ExecutionWrapperConfig
        parent: ExecutionWrapperConfig[]
      }
      if (response.node) {
        if (response.node.parallel && response.node.parallel.length > 0) {
          response.node.parallel.push(step)
        } else {
          const index = response.parent.indexOf(response.node)
          if (index > -1) {
            response.parent.splice(index, 1, { parallel: [response.node, step] })
          }
        }
      }
    } else {
      if (isRollback) {
        ;(data as ExecutionElementConfig).rollbackSteps?.push?.(step)
      } else {
        ;(data as ExecutionElementConfig).steps.push(step)
      }
    }
  } else if (entity?.entityType === DiagramType.StepGroupNode) {
    if (isParallel) {
      const response = getStepFromId(data, entity.identifier || '', true, true) as {
        node: ExecutionWrapperConfig
        parent: ExecutionWrapperConfig[]
      }
      if (response.node) {
        if (response.node.parallel && response.node.parallel.length > 0) {
          response.node.parallel.push(step)
        } else {
          const index = response.parent.indexOf(response.node)
          if (index > -1) {
            response.parent.splice(index, 1, { parallel: [response.node, step] })
          }
        }
      }
    }
  }
}

export const StepToNodeModelDataMap: { [key: string]: { model: any; defaultProps: Record<string, any> } } = {
  APPROVAL: {
    model: DiamondNodeModel,
    defaultProps: {
      icon: 'command-approval'
    }
  },
  Barrier: {
    model: IconNodeModel,
    defaultProps: {
      icon: 'barrier-open'
    }
  },
  ResourceConstraint: {
    model: IconNodeModel,
    defaultProps: {
      icon: 'traffic-lights'
    }
  },
  Default: {
    model: DefaultNodeModel,
    defaultProps: {}
  }
}

export const getModelByStepType = (type: string, props: any) => {
  let StepModel = StepToNodeModelDataMap[type]?.model
  let defaultProps = StepToNodeModelDataMap[type]?.defaultProps
  if (!StepModel) {
    StepModel = StepToNodeModelDataMap['Default'].model
    defaultProps = StepToNodeModelDataMap['Default'].defaultProps
    return new StepModel({ ...props, ...defaultProps, allowAdd: true })
  }
  return new StepModel({ ...props, ...defaultProps })
}

export const StepTypeToPipelineIconMap: Record<any, IconName> = {
  [PipelineStepType.SHELLSCRIPT]: 'command-shell-script',
  [PipelineStepType.K8sRollingRollback]: 'undo',
  [PipelineStepType.K8sRollingDeploy]: 'rolling',
  [PipelineStepType.JiraApproval]: 'jira-approve',
  [PipelineStepType.HarnessApproval]: 'harness-with-color',
  [PipelineStepType.JiraCreate]: 'jira-create',
  [PipelineStepType.JiraUpdate]: 'jira-update',
  [PipelineStepType.Barrier]: 'barrier-open',
  [PipelineStepType.CustomApproval]: 'custom-approval'
}

export const isServiceDependenciesSupported = (stageType: string): boolean => {
  if (stageType === StageType.BUILD || stageType === StageType.SECURITY) {
    return true
  }
  return false
}
