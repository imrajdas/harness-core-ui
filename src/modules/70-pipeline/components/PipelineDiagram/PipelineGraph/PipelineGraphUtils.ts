/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { defaultTo, get, throttle } from 'lodash-es'
import type { IconName } from '@harness/uicore'
import { v4 as uuid } from 'uuid'
import {
  isCustomGeneratedString,
  StepTypeToPipelineIconMap
} from '@pipeline/components/PipelineStudio/ExecutionGraph/ExecutionGraphUtil'
import { stageTypeToIconMap } from '@pipeline/utils/constants'
import type { DependencyElement } from 'services/ci'
import { getDefaultBuildDependencies } from '@pipeline/utils/stageHelpers'
import type {
  TemplateStepNode,
  ExecutionWrapperConfig,
  StageElementWrapperConfig,
  StepElementConfig
} from 'services/pipeline-ng'
import { getConditionalExecutionFlag } from '@pipeline/components/ExecutionStageDiagram/ExecutionStageDiagramUtils'
import { ExecutionStatusEnum } from '@pipeline/utils/statusHelpers'
import { NodeType, PipelineGraphState, SVGPathRecord, PipelineGraphType, KVPair } from '../types'

const INITIAL_ZOOM_LEVEL = 1
const ZOOM_INC_DEC_LEVEL = 0.1
const toFixed = (num: number): number => Number(num.toFixed(2))
const getScaledValue = (value: number, scalingFactor: number): number => {
  let finalValue

  if (scalingFactor === 1.0) {
    finalValue = value
  } else if (scalingFactor > 1) {
    finalValue = value / scalingFactor
  } else {
    finalValue = value * (1 / scalingFactor)
  }
  return toFixed(finalValue)
}
interface DrawSVGPathOptions {
  isParallelNode?: boolean
  parentElement?: HTMLDivElement
  direction?: 'rtl' | 'ltl' | 'rtr'
  styles?: React.CSSProperties
  nextNode?: string
  parentNode?: string
  scalingFactor?: number
  dataProps?: KVPair
}
/**
 * Direction of SVG Path (Only supported for straight horizontal lines)
 * 'rtl' ---> Right of Element1 to Left of Element2
 * 'ltl' ---> Left of Element1 to Left of Element2
 * 'rtr' ---> Left of Element1 to Right of Element2
 **/
const getFinalSVGArrowPath = (id1 = '', id2 = '', options?: DrawSVGPathOptions): SVGPathRecord => {
  const scalingFactor = defaultTo(options?.scalingFactor, 1)
  const node1 = getComputedPosition(id1, options?.parentElement)
  const node2 = getComputedPosition(id2, options?.parentElement)
  if (!node1 || !node2) {
    return { [id1]: { pathData: '', dataProps: options?.dataProps } }
  }
  let finalSVGPath = ''
  const node1VerticalMid = getScaledValue(node1.top + node1.height / 2, scalingFactor)
  const node2VerticalMid = getScaledValue(node2.top + node2.height / 2, scalingFactor)

  const startPoint = `${getScaledValue(node1.right, scalingFactor)},${node1VerticalMid}`
  const horizontalMid = Math.abs((node1.right + node2.left) / 2)
  const endPoint = `${getScaledValue(node2.left, scalingFactor)},${node2VerticalMid}`
  const node1Y = Math.round(node1.y)
  const node2Y = Math.round(node2.y)

  if (node2Y < node1Y) {
    //  child node is at top
    const curveLeftToTop = `Q${horizontalMid},${node1VerticalMid} ${horizontalMid},${node1VerticalMid - 20}`
    const curveBottomToRight = `Q${horizontalMid},${node2VerticalMid} ${horizontalMid + 20},${node2VerticalMid}`
    finalSVGPath = `M${startPoint} L${horizontalMid - 20},${node1VerticalMid} ${curveLeftToTop}
    L${horizontalMid},${node2VerticalMid + 20} ${curveBottomToRight} L${endPoint}`
  } else if (node1Y === node2Y) {
    // both nodes are at same level vertically
    if (options?.direction === 'ltl') {
      const startPointLeft = `${node1.left},${node1VerticalMid}`
      finalSVGPath = `M${startPointLeft}  L${endPoint}`
    } else if (options?.direction === 'rtr') {
      const endPointRight = `${getScaledValue(node2.right, scalingFactor)},${node2VerticalMid}`
      finalSVGPath = `M${startPoint}  L${endPointRight}`
    } else {
      finalSVGPath = `M${startPoint}  L${endPoint}`
    }
  } else {
    //  child node is at bottom
    const curveLeftToBottom = `Q${horizontalMid},${node1VerticalMid} ${horizontalMid},${node1VerticalMid + 20}`

    const curveTopToRight = `Q${horizontalMid},${node2VerticalMid} ${horizontalMid + 20},${node2VerticalMid}`

    if (options?.isParallelNode) {
      const updatedStart = getScaledValue(node1.left, scalingFactor) - 45 // new start point
      const parallelLinkStart = `${
        updatedStart // half of link length
      },${node1VerticalMid}`

      const curveLBparallel = `Q${updatedStart + 20},${node1VerticalMid} ${updatedStart + 20},${node1VerticalMid + 20} `
      const curveTRparallel = `Q${updatedStart + 20},${node2VerticalMid} ${updatedStart + 40},${node2VerticalMid}`

      const firstCurve = `M${parallelLinkStart}
      ${curveLBparallel}
      L${updatedStart + 20},${node2VerticalMid - 20}
      ${curveTRparallel}
      L${getScaledValue(node1.left, scalingFactor)},${node2VerticalMid}`

      let secondCurve = ''
      if (options?.nextNode && options?.parentNode) {
        const nextNode = getComputedPosition(options.nextNode, options?.parentElement)
        const parentNode = getComputedPosition(options.parentNode, options?.parentElement)
        if (!nextNode || !parentNode) {
          return { [id1]: { pathData: '', dataProps: options?.dataProps } }
        }
        const childEl = document.getElementById(options.parentNode)
        const parentGraphNodeContainer = getComputedPosition(
          childEl?.closest('.pipeline-graph-node') as HTMLElement,
          options?.parentElement
        ) as DOMRect
        const newRight = getScaledValue(
          parentGraphNodeContainer?.right > node2.right ? parentGraphNodeContainer?.right : node2.right,
          scalingFactor
        )
        const nextNodeVerticalMid = getScaledValue(nextNode.top + nextNode.height / 2, scalingFactor)

        secondCurve = `M${getScaledValue(node2.right, scalingFactor)},${node2VerticalMid}
        L${newRight + 10},${node2VerticalMid}
        Q${newRight + 25},${node2VerticalMid} ${newRight + 25},${node2VerticalMid - 20}
        L${newRight + 25},${nextNodeVerticalMid + 20}
        Q${newRight + 25},${nextNodeVerticalMid} ${newRight + 40},${nextNodeVerticalMid}`
      } else {
        secondCurve = `M${getScaledValue(node2.right, scalingFactor)},${node2VerticalMid}
        L${getScaledValue(node2.right, scalingFactor) + 10},${node2VerticalMid}
        Q${getScaledValue(node2.right, scalingFactor) + 25},${node2VerticalMid} ${
          getScaledValue(node2.right, scalingFactor) + 25
        },${node2VerticalMid - 20}
        L${getScaledValue(node2.right, scalingFactor) + 25},${node1VerticalMid + 20}
        Q${getScaledValue(node2.right, scalingFactor) + 25},${node1VerticalMid} ${
          getScaledValue(node2.right, scalingFactor) + 40
        },${node1VerticalMid}`
      }
      finalSVGPath = firstCurve + secondCurve
      return {
        [id1]: { pathData: firstCurve, dataProps: options?.dataProps },
        [id2]: { pathData: secondCurve, dataProps: options?.dataProps }
      }
    } else {
      finalSVGPath = `M${startPoint} L${horizontalMid - 20},${node1VerticalMid} ${curveLeftToBottom}
    L${horizontalMid},${node2VerticalMid - 20} ${curveTopToRight} L${endPoint}`
    }
  }
  return { [id1]: { pathData: finalSVGPath, dataProps: options?.dataProps } }
}

const getComputedPosition = (childId: string | HTMLElement, parentElement?: HTMLDivElement): DOMRect | null => {
  try {
    const childEl = typeof childId === 'string' ? (document.getElementById(childId) as HTMLDivElement) : childId
    const childPos = childEl?.getBoundingClientRect() as DOMRect
    const parentPos = defaultTo(parentElement, childEl.closest('#tree-container'))?.getBoundingClientRect() as DOMRect

    const updatedTop = childPos.top - parentPos.top

    const updatedLeft = childPos.left - parentPos.left

    const updatedRight = updatedLeft + childPos.width

    const updatedBottom = updatedTop + childPos.height

    const updatedPos: DOMRect = {
      ...childPos,
      left: getScaledValue(updatedLeft, 1),
      top: getScaledValue(updatedTop, 1),
      right: getScaledValue(updatedRight, 1),
      bottom: updatedBottom,
      width: childPos.height,
      height: childPos.height,
      x: childPos.x,
      y: childPos.y
    }
    return updatedPos
  } catch (e) {
    return null
  }
}

export const scrollZoom = (
  container: HTMLElement,
  max_scale: number,
  factor: number,
  callback: (newScale: number) => void
): void => {
  let scale = 1
  container.style.transformOrigin = '0 0'
  container.onwheel = scrolled

  function scrolled(e: any): void {
    if (!e.ctrlKey) return
    e.preventDefault()
    let delta = e.delta || e.wheelDelta
    if (delta === undefined) {
      //we are on firefox
      delta = e.detail
    }
    delta = Math.max(-1, Math.min(1, delta)) // cap the delta to [-1,1] for cross browser consistency
    // apply zoom
    scale += delta * factor * scale
    scale = Math.min(max_scale, scale)
    callback(scale)
  }
}

const setupDragEventListeners = (draggableParent: HTMLElement, overlay: HTMLElement): void => {
  draggableParent.onmousedown = function (event) {
    if (event?.target !== draggableParent) {
      return
    }
    const initialX = event.pageX
    const initialY = event.pageY
    const overlayPosition = getComputedPosition(overlay, draggableParent as HTMLDivElement) as DOMRect
    const moveAt = (pageX: number, pageY: number): void => {
      const newX = overlayPosition?.left + pageX - initialX
      const newY = overlayPosition?.top + pageY - initialY
      overlay.style.transform = `translate(${newX}px,${newY}px)`
    }

    const onMouseMove = throttle((e: MouseEvent): void => {
      moveAt(e.pageX, e.pageY)
    }, 16)

    draggableParent.addEventListener('mousemove', onMouseMove)
    draggableParent.onmouseup = function () {
      draggableParent.removeEventListener('mousemove', onMouseMove)
      draggableParent.onmouseup = null
    }
    draggableParent.onmouseleave = function () {
      draggableParent.removeEventListener('mousemove', onMouseMove)
    }
  }
}

const getSVGLinksFromPipeline = (
  states?: PipelineGraphState[],
  parentElement?: HTMLDivElement,
  resultArr: SVGPathRecord[] = [],
  endNodeId?: string,
  scalingFactor?: number
): SVGPathRecord[] => {
  let prevElement: PipelineGraphState

  states?.forEach((state, index) => {
    if (state?.children?.length) {
      const nextNodeId = states?.[index + 1]?.id || endNodeId
      getParallelNodeLinks(state?.children, state, resultArr, parentElement, nextNodeId, state.id, scalingFactor)
    }
    if (prevElement) {
      resultArr.push(
        getFinalSVGArrowPath(prevElement.id, state.id, {
          isParallelNode: false,
          parentElement,
          scalingFactor,
          dataProps: {
            'data-link-executed': String(state.status !== ExecutionStatusEnum.NotStarted)
          }
        })
      )
    }
    prevElement = state
  })
  return resultArr
}

const getParallelNodeLinks = (
  stages: PipelineGraphState[],
  firstStage: PipelineGraphState | undefined,
  resultArr: SVGPathRecord[] = [],
  parentElement?: HTMLDivElement,
  nextNode?: string,
  parentNode?: string,
  scalingFactor?: number
): void => {
  stages?.forEach(stage => {
    resultArr.push(
      getFinalSVGArrowPath(firstStage?.id as string, stage?.id, {
        isParallelNode: true,
        parentElement,
        nextNode,
        parentNode,
        scalingFactor,
        dataProps: {
          'data-link-executed': String(stage.status !== ExecutionStatusEnum.NotStarted)
        }
      })
    )
  })
}

const getScaleToFitValue = (
  elm: HTMLElement,
  containerEl?: HTMLElement,
  paddingHorizontal = 0,
  paddingVertical = 20
): number => {
  const width = elm.scrollWidth
  const height = elm.scrollHeight
  const container = containerEl ? containerEl : document.body
  return (
    1 /
    Math.max(
      width / (container.offsetWidth - paddingHorizontal),
      height / (container.offsetHeight - container.offsetTop - paddingVertical)
    )
  )
}

const NodeTypeToNodeMap: Record<string, string> = {
  Deployment: NodeType.Default,
  CI: NodeType.Default,
  SecurityTests: NodeType.Default,
  Pipeline: NodeType.Default,
  Custom: NodeType.Default,
  Approval: NodeType.Default
}
interface GetPipelineGraphDataParams {
  data: StageElementWrapperConfig[] | ExecutionWrapperConfig[]
  templateTypes?: KVPair
  serviceDependencies?: DependencyElement[] | undefined
  errorMap?: Map<string, string[]>
  parentPath?: string
  graphDataType?: PipelineGraphType
}
const getPipelineGraphData = ({
  data = [],
  templateTypes,
  serviceDependencies,
  errorMap,
  parentPath,
  graphDataType
}: GetPipelineGraphDataParams): PipelineGraphState[] => {
  let graphState: PipelineGraphState[] = []
  const pipGraphDataType = graphDataType ? graphDataType : getPipelineGraphDataType(data)

  if (pipGraphDataType === PipelineGraphType.STAGE_GRAPH) {
    graphState = transformStageData(data, pipGraphDataType, templateTypes, errorMap, parentPath)
  } else {
    graphState = transformStepsData(data, pipGraphDataType, templateTypes, errorMap, parentPath)

    if (Array.isArray(serviceDependencies)) {
      //CI module
      const dependencyStepGroup = getDefaultBuildDependencies(serviceDependencies)
      graphState.unshift(dependencyStepGroup)
    }
  }

  return graphState
}

const transformStageData = (
  stages: StageElementWrapperConfig[],
  graphType: PipelineGraphType,
  templateTypes?: KVPair,
  errorMap?: Map<string, string[]>,
  parentPath?: string,
  offsetIndex = 0
): PipelineGraphState[] => {
  const finalData: PipelineGraphState[] = []
  stages.forEach((stage: any, index: number) => {
    if (stage?.stage) {
      const updatedStagetPath = `${parentPath}.${index + offsetIndex}`
      const hasErrors =
        errorMap && [...errorMap.keys()].some(key => updatedStagetPath && key.startsWith(updatedStagetPath))
      const templateRef = stage.stage?.template?.templateRef

      const type = (templateRef ? get(templateTypes, templateRef) : stage.stage.type) as string
      const { nodeType, iconName } = getNodeInfo(defaultTo(type, ''), graphType)

      finalData.push({
        id: uuid() as string,
        identifier: stage.stage.identifier as string,
        name: stage.stage.name as string,
        type: type,
        nodeType: nodeType as string,
        icon: iconName,
        data: {
          graphType,
          ...stage,
          isInComplete: isCustomGeneratedString(stage.stage.identifier) || hasErrors,
          loopingStrategyEnabled: !!stage.stage?.strategy,
          conditionalExecutionEnabled: stage.stage.when
            ? stage.stage.when?.pipelineStatus !== 'Success' || !!stage.stage.when?.condition?.trim()
            : false,
          isTemplateNode: Boolean(templateRef)
        }
      })
    } else if (stage?.parallel?.length) {
      const updatedStagetPath = `${parentPath}.${index}.parallel`
      const currentStagetPath = `${updatedStagetPath}.0`

      const hasErrors =
        errorMap && [...errorMap.keys()].some(key => updatedStagetPath && key.startsWith(currentStagetPath))

      const [first, ...rest] = stage.parallel
      const templateRef = first.stage?.template?.templateRef
      const type = (templateRef ? get(templateTypes, templateRef) : first?.stage?.type) as string
      const { nodeType, iconName } = getNodeInfo(defaultTo(type, ''), graphType)
      finalData.push({
        id: uuid() as string,
        identifier: first?.stage?.identifier as string,
        name: first?.stage?.name as string,
        nodeType: nodeType as string,
        type,
        icon: iconName,
        data: {
          graphType,
          ...stage,
          isInComplete: isCustomGeneratedString(first?.stage?.identifier as string) || hasErrors,
          loopingStrategyEnabled: !!first.stage?.strategy,
          conditionalExecutionEnabled: first?.stage?.when
            ? first?.stage?.when?.pipelineStatus !== 'Success' || !!first?.stage.when?.condition?.trim()
            : false,
          isTemplateNode: Boolean(templateRef)
        },
        children: transformStageData(rest, graphType, templateTypes, errorMap, updatedStagetPath, 1)
      })
    } else {
      const updatedStagetPath = `${parentPath}.${index + offsetIndex}`
      const hasErrors =
        errorMap && [...errorMap.keys()].some(key => updatedStagetPath && key.startsWith(updatedStagetPath))
      const templateRef = stage.stage?.template?.templateRef

      const type = (templateRef ? get(templateTypes, templateRef) : stage?.type) as string
      const { nodeType, iconName } = getNodeInfo(defaultTo(type, ''), graphType)
      finalData.push({
        id: stage.id, //uuid() as string
        identifier: stage.identifier as string,
        name: stage.name as string,
        type: type,
        nodeType: nodeType as string,
        icon: iconName,
        ...stage.data,
        data: {
          graphType,
          ...stage,
          isInComplete: isCustomGeneratedString(stage.identifier) || hasErrors,
          loopingStrategyEnabled: !!stage?.strategy,
          conditionalExecutionEnabled: stage.when
            ? stage.when?.pipelineStatus !== 'Success' || !!stage.when?.condition?.trim()
            : false,
          isTemplateNode: Boolean(templateRef)
        }
      })
    }
  })
  return finalData
}

const getuniqueIdForStep = (step: ExecutionWrapperConfig): string =>
  defaultTo(get(step, 'step.uuid') || get(step, 'step.id'), uuid() as string)

const transformStepsData = (
  steps: ExecutionWrapperConfig[],
  graphType: PipelineGraphType,
  templateTypes?: KVPair,
  errorMap?: Map<string, string[]>,
  parentPath?: string,
  offsetIndex = 0
): PipelineGraphState[] => {
  const finalData: PipelineGraphState[] = []

  steps.forEach((step: ExecutionWrapperConfig, index: number) => {
    if (step?.step) {
      const updatedStagetPath = `${parentPath}.${index + offsetIndex}`

      const hasErrors =
        errorMap && [...errorMap.keys()].some(key => updatedStagetPath && key.startsWith(updatedStagetPath))

      const templateRef = (step?.step as unknown as TemplateStepNode)?.template?.templateRef
      const stepIcon = get(step, 'step.icon')
      const type = (templateRef ? get(templateTypes, templateRef) : step?.step?.type) as string
      const { nodeType, iconName } = getNodeInfo(defaultTo(type, ''), graphType)
      const isExecutionView = get(step, 'step.status', false)
      finalData.push({
        id: getuniqueIdForStep(step),
        identifier: step.step.identifier as string,
        name: step.step.name as string,
        type,
        nodeType: nodeType as string,
        icon: stepIcon ? stepIcon : iconName,
        data: {
          graphType,
          ...step,
          isInComplete: isCustomGeneratedString(step.step.identifier) || hasErrors,
          conditionalExecutionEnabled: isExecutionView
            ? getConditionalExecutionFlag(step.step?.when)
            : step.step?.when
            ? step.step?.when?.stageStatus !== 'Success' || !!step.step?.when?.condition?.trim()
            : false,
          isTemplateNode: Boolean(templateRef)
        },
        children: (step?.step as any)?.children
          ? transformStepsData((step?.step as any)?.children, graphType, templateTypes, errorMap, updatedStagetPath, 1)
          : []
      })
    } else if (step?.parallel?.length) {
      const updatedStagetPath = `${parentPath}.${index}.parallel`
      const currentStagetPath = `${updatedStagetPath}.0`

      const hasErrors =
        errorMap && [...errorMap.keys()].some(key => currentStagetPath && key.startsWith(currentStagetPath))

      const [first, ...rest] = step.parallel
      if (first.stepGroup) {
        const { iconName } = getNodeInfo('', graphType)
        finalData.push({
          id: getuniqueIdForStep(first),
          identifier: first.stepGroup?.identifier as string,
          name: first.stepGroup?.name as string,
          type: 'StepGroup',
          nodeType: 'StepGroup',
          icon: iconName,
          data: {
            ...first,
            isInComplete: isCustomGeneratedString(first.stepGroup?.identifier) || hasErrors,
            graphType
          },
          children: transformStepsData(
            rest as ExecutionWrapperConfig[],
            graphType,
            templateTypes,
            errorMap,
            updatedStagetPath,
            1
          )
        })
      } else {
        const templateRef = (first?.step as unknown as TemplateStepNode)?.template?.templateRef
        const type = (templateRef ? get(templateTypes, templateRef) : first?.step?.type) as string
        const { nodeType, iconName } = getNodeInfo(defaultTo(type, ''), graphType)
        const isExecutionView = get(first, 'step.status', false)
        finalData.push({
          id: getuniqueIdForStep(first),
          identifier: first?.step?.identifier as string,
          name: first?.step?.name as string,
          type,
          nodeType: nodeType as string,
          icon: iconName,
          data: {
            ...first,
            isInComplete: isCustomGeneratedString(first?.step?.identifier as string) || hasErrors,
            conditionalExecutionEnabled: isExecutionView
              ? getConditionalExecutionFlag(first.step?.when)
              : first.step?.when
              ? first.step?.when?.stageStatus !== 'Success' || !!first.step?.when?.condition?.trim()
              : false,
            isTemplateNode: Boolean(templateRef),
            graphType
          },
          children: transformStepsData(rest, graphType, templateTypes, errorMap, updatedStagetPath, 1)
        })
      }
    } else {
      const { iconName } = getNodeInfo('', graphType)
      const updatedStagetPath = `${parentPath}.${index}.stepGroup.steps`
      const hasErrors =
        errorMap && [...errorMap.keys()].some(key => updatedStagetPath && key.startsWith(updatedStagetPath))
      const isExecutionView = get(step, 'stepGroup.status', false)
      if (step?.stepGroup) {
        finalData.push({
          id: getuniqueIdForStep(step),
          identifier: step.stepGroup?.identifier as string,
          name: step.stepGroup?.name as string,
          type: 'StepGroup',
          nodeType: 'StepGroup',
          icon: iconName,
          data: {
            ...step,
            type: 'StepGroup',
            nodeType: 'StepGroup',
            icon: iconName,
            conditionalExecutionEnabled: isExecutionView
              ? getConditionalExecutionFlag(step.stepGroup?.when)
              : step.stepGroup?.when
              ? step.stepGroup?.when?.stageStatus !== 'Success' || !!step.stepGroup?.when?.condition?.trim()
              : false,
            graphType,
            isInComplete: isCustomGeneratedString(step.stepGroup?.identifier as string) || hasErrors
          }
        })
      } else {
        const stepData = step as StepElementConfig
        finalData.push({
          id: getuniqueIdForStep({ step } as any),
          identifier: stepData?.identifier as string,
          name: stepData?.name as string,
          type: stepData?.type as string,
          nodeType: stepData?.type as string,
          icon: iconName,
          status: get(stepData, 'status', ''),
          data: {
            step: {
              ...get(stepData, 'data.step', {})
            },
            type: stepData?.name as string,
            nodeType: stepData?.name as string,
            icon: iconName,
            conditionalExecutionEnabled: isExecutionView
              ? getConditionalExecutionFlag(stepData?.when)
              : stepData?.when
              ? stepData?.when?.stageStatus !== 'Success' || !!stepData?.when?.condition?.trim()
              : false,
            graphType,
            isInComplete: isCustomGeneratedString(stepData?.identifier as string) || hasErrors
          }
        })
      }
    }
  })
  return finalData
}

const getNodeInfo = (type: string, graphType: PipelineGraphType): { iconName: IconName; nodeType: string } => {
  return graphType === PipelineGraphType.STEP_GRAPH
    ? {
        iconName: StepTypeToPipelineIconMap[type],
        nodeType: NodeTypeToNodeMap[type]
      }
    : {
        iconName: stageTypeToIconMap[type],
        nodeType: NodeTypeToNodeMap[type]
      }
}

const getPipelineGraphDataType = (data: StageElementWrapperConfig[] | ExecutionWrapperConfig[]): PipelineGraphType => {
  const hasStageData = defaultTo(get(data, '[0].parallel.[0].stage'), get(data, '[0].stage'))
  if (hasStageData) {
    return PipelineGraphType.STAGE_GRAPH
  }
  return PipelineGraphType.STEP_GRAPH
}
const getTerminalNodeLinks = ({
  firstNodeId = '',
  lastNodeId = '',
  createNodeId,
  startNodeId,
  endNodeId,
  readonly = false,
  scalingFactor
}: {
  startNodeId: string
  endNodeId: string
  firstNodeId?: string
  lastNodeId?: string
  createNodeId?: string
  readonly?: boolean
  scalingFactor?: number
}): SVGPathRecord[] => {
  const finalNodeLinks: SVGPathRecord[] = []
  if (firstNodeId && !readonly) {
    finalNodeLinks.push(
      ...[
        getFinalSVGArrowPath(startNodeId, firstNodeId, { scalingFactor }),
        getFinalSVGArrowPath(lastNodeId, createNodeId, { scalingFactor }),
        getFinalSVGArrowPath(createNodeId, endNodeId, { scalingFactor })
      ]
    )
  }
  if (firstNodeId && readonly) {
    finalNodeLinks.push(
      ...[
        getFinalSVGArrowPath(startNodeId, firstNodeId, { scalingFactor }),
        getFinalSVGArrowPath(lastNodeId, endNodeId, { scalingFactor })
      ]
    )
  }
  if (!firstNodeId && !readonly) {
    finalNodeLinks.push(
      ...[
        getFinalSVGArrowPath(startNodeId, createNodeId, { scalingFactor }),
        getFinalSVGArrowPath(createNodeId, endNodeId, { scalingFactor })
      ]
    )
  }
  return finalNodeLinks
}
export interface RelativeBounds {
  top: number
  right: number
  bottom: number
  left: number
}

const getRelativeBounds = (parentElement: HTMLElement, targetElement: HTMLElement): RelativeBounds => {
  const parentPos = parentElement.getBoundingClientRect()
  const childPos = targetElement.getBoundingClientRect()
  const relativePos: RelativeBounds = { top: 0, right: 0, bottom: 0, left: 0 }

  relativePos.top = childPos.top - parentPos.top
  relativePos.right = childPos.right - parentPos.right
  relativePos.bottom = childPos.bottom - parentPos.bottom
  relativePos.left = childPos.left - parentPos.left
  return relativePos
}

const dispatchCustomEvent = (type: string, data: KVPair): void => {
  const event = new Event(type, data)
  document.dispatchEvent(event)
}
const CANVAS_CLICK_EVENT = 'CANVAS_CLICK_EVENT'
export {
  ZOOM_INC_DEC_LEVEL,
  INITIAL_ZOOM_LEVEL,
  CANVAS_CLICK_EVENT,
  NodeTypeToNodeMap,
  getScaleToFitValue,
  getComputedPosition,
  getFinalSVGArrowPath,
  getPipelineGraphData,
  setupDragEventListeners,
  getSVGLinksFromPipeline,
  getTerminalNodeLinks,
  getRelativeBounds,
  dispatchCustomEvent
}
