/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { MutableRefObject } from 'react'
import { defaultTo, isEmpty, noop } from 'lodash-es'
import type { NodeModelListener, LinkModelListener, DiagramEngine } from '@projectstorm/react-diagrams-core'
import type { StageElementWrapperConfig, PipelineInfoConfig } from 'services/pipeline-ng'
import type * as Diagram from '@pipeline/components/Diagram'
import type { DeploymentStageElementConfig, StageElementWrapper } from '@pipeline/utils/pipelineTypes'
import {
  DefaultLinkEvent,
  DefaultNodeEvent,
  DefaultNodeModel,
  DiagramType,
  Event,
  GroupNodeModelOptions
} from '@pipeline/components/Diagram'
import type { DynamicPopoverHandlerBinding } from '@common/components/DynamicPopover/DynamicPopover'
import { moveStageToFocusDelayed } from '@pipeline/components/ExecutionStageDiagram/ExecutionStageDiagramUtils'
import { PipelineOrStageStatus } from '@pipeline/components/PipelineSteps/AdvancedSteps/ConditionalExecutionPanel/ConditionalExecutionPanelUtils'
import { EmptyStageName } from '../PipelineConstants'
import type { PipelineContextInterface } from '../PipelineContext/PipelineContext'
import {
  PopoverData,
  resetDiagram,
  StageState,
  getAffectedDependentStages,
  getStageIndexFromPipeline,
  getStageIndexByIdentifier,
  getDependantStages,
  EmptyNodeSeparator,
  removeNodeFromPipeline,
  MoveStageDetailsType
} from './StageBuilderUtil'
import type { PipelineSelectionState } from '../PipelineQueryParamState/usePipelineQueryParam'

export enum MoveDirection {
  AHEAD,
  BEHIND
}

export const getNodeListenersOld = (
  updateStageOnAddLink: (event: any, dropNode: StageElementWrapper | undefined, current: any) => void,
  setSelectionRef: MutableRefObject<(selectionState: PipelineSelectionState) => void>,
  confirmDeleteStage: () => void,
  updateDeleteId: (id: string | undefined) => void,

  dynamicPopoverHandler: DynamicPopoverHandlerBinding<PopoverData> | undefined,
  pipelineContext: PipelineContextInterface,
  addStage: (
    newStage: StageElementWrapperConfig,
    isParallel?: boolean,
    event?: Diagram.DefaultNodeEvent,
    insertAt?: number,
    openSetupAfterAdd?: boolean,
    pipeline?: PipelineInfoConfig
  ) => void,

  updateMoveStageDetails: (moveStageDetails: MoveStageDetailsType) => void,
  confirmMoveStage: () => void,
  stageMap: Map<string, StageState>,
  engine: DiagramEngine
): NodeModelListener => {
  const {
    state: {
      pipeline,
      pipelineView: { isSplitViewOpen },
      pipelineView,
      selectionState: { selectedStageId },
      templateTypes
    },
    contextType = 'Pipeline',
    stagesMap,
    updatePipeline,
    updatePipelineView,
    renderPipelineStage,
    getStageFromPipeline
  } = pipelineContext
  return {
    // Can not remove this Any because of React Diagram Issue
    [Event.ClickNode]: (event: any) => {
      const eventTemp = event as DefaultNodeEvent
      dynamicPopoverHandler?.hide()

      /* istanbul ignore else */ if (eventTemp.entity) {
        if (eventTemp.entity.getType() === DiagramType.CreateNew) {
          setSelectionRef.current({ stageId: undefined, sectionId: undefined })
          dynamicPopoverHandler?.show(
            `[data-nodeid="${eventTemp.entity.getID()}"]`,
            {
              addStage,
              isStageView: false,
              renderPipelineStage,
              stagesMap,
              contextType,
              templateTypes
            },
            { useArrows: true, darkMode: false, fixedPosition: false }
          )
        } else if (eventTemp.entity.getType() === DiagramType.GroupNode) {
          const parent = getStageFromPipeline(eventTemp.entity.getIdentifier()).parent as StageElementWrapperConfig
          const parallelStages = (eventTemp.entity.getOptions() as GroupNodeModelOptions).parallelNodes
          /* istanbul ignore else */ if (parent?.parallel) {
            dynamicPopoverHandler?.show(
              `[data-nodeid="${eventTemp.entity.getID()}"]`,
              {
                isGroupStage: true,
                groupSelectedStageId: selectedStageId,
                isStageView: false,
                groupStages: parent.parallel.filter(
                  node => parallelStages.indexOf(defaultTo(node.stage?.identifier, '')) > -1
                ),
                onClickGroupStage: (stageId: string) => {
                  dynamicPopoverHandler?.hide()
                  setSelectionRef.current({ stageId })
                  moveStageToFocusDelayed(engine, stageId, true)
                },
                stagesMap,
                renderPipelineStage,
                contextType,
                templateTypes
              },
              { useArrows: false, darkMode: false, fixedPosition: false }
            )
          }
        } /* istanbul ignore else */ else if (eventTemp.entity.getType() !== DiagramType.StartNode) {
          const data = getStageFromPipeline(eventTemp.entity.getIdentifier()).stage
          if (isSplitViewOpen && data?.stage?.identifier) {
            if (data?.stage?.name === EmptyStageName) {
              // TODO: check if this is unused code
              dynamicPopoverHandler?.show(
                `[data-nodeid="${eventTemp.entity.getID()}"]`,
                {
                  isStageView: true,
                  data,
                  onSubmitPrimaryData: (node, identifier) => {
                    updatePipeline(pipeline)
                    stageMap.set(node.stage?.identifier || '', { isConfigured: true, stage: node })
                    dynamicPopoverHandler.hide()
                    resetDiagram(engine)
                    setSelectionRef.current({ stageId: identifier })
                  },
                  stagesMap,
                  renderPipelineStage,
                  contextType,
                  templateTypes
                },
                { useArrows: false, darkMode: false, fixedPosition: false }
              )
              setSelectionRef.current({ stageId: undefined, sectionId: undefined })
            } else {
              setSelectionRef.current({ stageId: data?.stage?.identifier, sectionId: undefined })
              moveStageToFocusDelayed(engine, data?.stage?.identifier, true)
            }
          } /* istanbul ignore else */ else if (!isSplitViewOpen) {
            if (stageMap.has(data?.stage?.identifier || '')) {
              setSelectionRef.current({ stageId: data?.stage?.identifier })
              moveStageToFocusDelayed(engine, data?.stage?.identifier || '', true)
            } else {
              // TODO: check if this is unused code
              dynamicPopoverHandler?.show(
                `[data-nodeid="${eventTemp.entity.getID()}"]`,
                {
                  isStageView: true,
                  data,
                  onSubmitPrimaryData: (node, identifier) => {
                    updatePipeline(pipeline)
                    stageMap.set(node.stage?.identifier || '', { isConfigured: true, stage: node })
                    dynamicPopoverHandler.hide()
                    resetDiagram(engine)
                    setSelectionRef.current({ stageId: identifier })
                  },
                  stagesMap,
                  renderPipelineStage,
                  contextType,
                  templateTypes
                },
                { useArrows: false, darkMode: false, fixedPosition: false }
              )
            }
          }
        }
      }
    },
    // Can not remove this Any because of React Diagram Issue
    [Event.RemoveNode]: (event: any) => {
      const eventTemp = event as DefaultNodeEvent
      const stageIdToBeRemoved = eventTemp.entity.getIdentifier()
      updateDeleteId(stageIdToBeRemoved)
      confirmDeleteStage()
    },
    [Event.AddParallelNode]: (event: any) => {
      const eventTemp = event as DefaultNodeEvent
      eventTemp.stopPropagation()
      // dynamicPopoverHandler?.hide()

      updatePipelineView({
        ...pipelineView,
        isSplitViewOpen: false,
        splitViewData: {}
      })
      setSelectionRef.current({ stageId: undefined, sectionId: undefined })

      if (eventTemp.entity) {
        dynamicPopoverHandler?.show(
          `[data-nodeid="${eventTemp.entity.getID()}"] [data-nodeid="add-parallel"]`,
          {
            addStage,
            isParallel: true,
            isStageView: false,
            event: eventTemp,
            stagesMap,
            renderPipelineStage,
            contextType,
            templateTypes
          },
          { useArrows: false, darkMode: false, fixedPosition: false },
          eventTemp.callback
        )
      }
    },
    [Event.DropLinkEvent]: (event: any) => {
      const eventTemp = event as DefaultNodeEvent
      eventTemp.stopPropagation()
      if (event.node?.identifier) {
        const dropNode = getStageFromPipeline(event.node.identifier).stage
        const current = getStageFromPipeline(eventTemp.entity.getIdentifier())
        const dependentStages = getDependantStages(pipeline, dropNode)
        const parentStageId = (dropNode?.stage as DeploymentStageElementConfig)?.spec?.serviceConfig?.useFromStage
          ?.stage
        if (parentStageId?.length) {
          const { stageIndex } = getStageIndexByIdentifier(pipeline, current?.stage?.stage?.identifier)

          const { index: parentIndex } = getStageIndexFromPipeline(pipeline, parentStageId)
          if (stageIndex <= parentIndex) {
            updateMoveStageDetails({
              event,
              direction: MoveDirection.AHEAD,
              currentStage: current
            })
            confirmMoveStage()
            return
          }

          return
        } else if (dependentStages?.length) {
          let finalDropIndex = -1
          let firstDependentStageIndex
          const { stageIndex: dependentStageIndex, parallelStageIndex: dependentParallelIndex = -1 } =
            getStageIndexByIdentifier(pipeline, dependentStages[0])

          firstDependentStageIndex = dependentStageIndex

          if (current.parent) {
            const { stageIndex } = getStageIndexByIdentifier(pipeline, current?.stage?.stage?.identifier)
            finalDropIndex = stageIndex
            firstDependentStageIndex = dependentStageIndex
          } else if (current?.stage) {
            const { stageIndex } = getStageIndexByIdentifier(pipeline, current?.stage?.stage?.identifier)
            finalDropIndex = stageIndex
          }

          finalDropIndex = finalDropIndex === -1 ? pipeline.stages?.length || 0 : finalDropIndex
          const stagesTobeUpdated = getAffectedDependentStages(
            dependentStages,
            finalDropIndex,
            pipeline,
            dependentParallelIndex
          )

          if (finalDropIndex >= firstDependentStageIndex) {
            updateMoveStageDetails({
              event,
              direction: MoveDirection.BEHIND,
              dependentStages: stagesTobeUpdated,
              currentStage: current,
              isLastAddLink: !current.parent
            })

            confirmMoveStage()
            return
          }
        }
        updateStageOnAddLink(event, dropNode, current)
      }
    },
    [Event.MouseEnterNode]: (event: any) => {
      const eventTemp = event as DefaultNodeEvent
      eventTemp.stopPropagation()
      const current = getStageFromPipeline(eventTemp.entity.getIdentifier())
      if (current.stage?.stage?.when) {
        const { pipelineStatus, condition } = current.stage.stage.when
        if (pipelineStatus === PipelineOrStageStatus.SUCCESS && isEmpty(condition)) {
          return
        }
        dynamicPopoverHandler?.show(
          `[data-nodeid="${eventTemp.entity.getID()}"]`,
          {
            event: eventTemp,
            data: current.stage,
            isStageView: false,
            isHoverView: true,
            stagesMap,
            renderPipelineStage,
            contextType,
            templateTypes
          },
          { useArrows: true, darkMode: false, fixedPosition: false, placement: 'top' },
          noop,
          true
        )
      }
    },
    [Event.MouseLeaveNode]: (event: any) => {
      const eventTemp = event as DefaultNodeEvent
      eventTemp.stopPropagation()
      if (dynamicPopoverHandler?.isHoverView?.()) {
        dynamicPopoverHandler?.hide()
      }
    }
  }
}

export const getLinkListernersOld = (
  dynamicPopoverHandler: DynamicPopoverHandlerBinding<PopoverData> | undefined,
  pipelineContext: PipelineContextInterface,
  addStage: (
    newStage: StageElementWrapperConfig,
    isParallel?: boolean,
    event?: Diagram.DefaultNodeEvent,
    insertAt?: number,
    openSetupAfterAdd?: boolean,
    pipeline?: PipelineInfoConfig
  ) => void,

  openSplitView: boolean,
  updateMoveStageDetails: (moveStageDetails: MoveStageDetailsType) => void,
  confirmMoveStage: () => void,
  stageMap: Map<string, StageState>
): LinkModelListener => {
  const {
    state: { pipeline, templateTypes },
    contextType = 'Pipeline',
    stagesMap,
    renderPipelineStage,
    getStageFromPipeline
  } = pipelineContext
  return {
    [Event.AddLinkClicked]: (event: any) => {
      const eventTemp = event as DefaultNodeEvent
      dynamicPopoverHandler?.hide()
      if (eventTemp.entity) {
        dynamicPopoverHandler?.show(
          `[data-linkid="${eventTemp.entity.getID()}"] circle`,
          {
            addStage,
            isStageView: true,
            event: eventTemp,
            stagesMap,
            renderPipelineStage,
            contextType,
            templateTypes
          },
          { useArrows: false, darkMode: false, fixedPosition: openSplitView }
        )
      }
    },
    [Event.DropLinkEvent]: (event: any) => {
      // console.log(event.node.identifier === event.entity.getIdentifier())
      const eventTemp = event as DefaultLinkEvent
      eventTemp.stopPropagation()
      if (event.node?.identifier) {
        const dropNode = getStageFromPipeline(event.node.identifier).stage
        const parentStageName = (dropNode?.stage as DeploymentStageElementConfig)?.spec?.serviceConfig?.useFromStage
          ?.stage
        const dependentStages = getDependantStages(pipeline, dropNode)

        if (parentStageName?.length) {
          const node = event.entity.getTargetPort().getNode() as DefaultNodeModel
          const { stage } = getStageFromPipeline(node.getIdentifier())
          const dropIndex = pipeline?.stages?.indexOf(stage!) || -1
          const { stageIndex: parentIndex = -1 } = getStageIndexByIdentifier(pipeline, parentStageName)

          if (dropIndex < parentIndex) {
            updateMoveStageDetails({
              event,
              direction: MoveDirection.AHEAD
            })
            confirmMoveStage()
            return
          }
        } else if (dependentStages?.length) {
          let dropIndex = -1
          const node = event.entity.getSourcePort().getNode() as DefaultNodeModel
          const { stage } = getStageFromPipeline(node.getIdentifier())
          if (!stage) {
            //  node on sourceport is parallel so split nodeId to get original node identifier
            const nodeId = node.getIdentifier().split(EmptyNodeSeparator)[1]

            const { stageIndex: nextStageIndex } = getStageIndexByIdentifier(pipeline, nodeId)
            dropIndex = nextStageIndex + 1 // adding 1 as we checked source port that is prev to index where we will move this node
          } else {
            dropIndex = pipeline?.stages?.indexOf(stage!) || -1
          }

          const { stageIndex: firstDependentStageIndex = -1 } = getStageIndexByIdentifier(pipeline, dependentStages[0])

          if (dropIndex >= firstDependentStageIndex) {
            const stagesTobeUpdated = getAffectedDependentStages(dependentStages, dropIndex, pipeline)

            updateMoveStageDetails({
              event,
              direction: MoveDirection.BEHIND,
              dependentStages: stagesTobeUpdated
            })
            confirmMoveStage()
            return
          }
        }

        const isRemove = removeNodeFromPipeline(getStageFromPipeline(event.node.identifier), pipeline, stageMap, false)
        if (isRemove && dropNode) {
          addStage(dropNode, false, event)
        }
      }
    }
  }
}
