/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { Layout, useToaster, useConfirmationDialog } from '@wings-software/uicore'
import { Intent } from '@harness/design-system'
import cx from 'classnames'
import { cloneDeep, debounce, isNil } from 'lodash-es'
import type { NodeModelListener, LinkModelListener } from '@projectstorm/react-diagrams-core'
import SplitPane from 'react-split-pane'
import produce from 'immer'
import { DynamicPopover, DynamicPopoverHandlerBinding } from '@common/components/DynamicPopover/DynamicPopover'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { StageActions } from '@common/constants/TrackingConstants'
import type { PipelineInfoConfig, StageElementConfig, StageElementWrapperConfig } from 'services/pipeline-ng'
import { useStrings } from 'framework/strings'
import { CanvasButtons } from '@pipeline/components/CanvasButtons/CanvasButtons'
import { moveStageToFocusDelayed } from '@pipeline/components/ExecutionStageDiagram/ExecutionStageDiagramUtils'
import { useValidationErrors } from '@pipeline/components/PipelineStudio/PiplineHooks/useValidationErrors'
import HoverCard from '@pipeline/components/HoverCard/HoverCard'
import { StepMode as Modes } from '@pipeline/utils/stepUtils'
import ConditionalExecutionTooltip from '@pipeline/components/ConditionalExecutionToolTip/ConditionalExecutionTooltip'
import { useGlobalEventListener } from '@common/hooks'
import type { StageElementWrapper } from '@pipeline/utils/pipelineTypes'
import { StageType } from '@pipeline/utils/stageHelpers'
import { getPipelineGraphData } from '@pipeline/components/PipelineDiagram/PipelineGraph/PipelineGraphUtils'
import PipelineStageNode from '@pipeline/components/PipelineDiagram/Nodes/DefaultNode/PipelineStageNode/PipelineStageNode'
import { DiamondNodeWidget } from '@pipeline/components/PipelineDiagram/Nodes/DiamondNode/DiamondNode'
import { IconNode } from '@pipeline/components/PipelineDiagram/Nodes/IconNode/IconNode'
import { DiagramFactory, NodeType, BaseReactComponentProps } from '@pipeline/components/PipelineDiagram/DiagramFactory'
import CreateNodeStage from '@pipeline/components/PipelineDiagram/Nodes/CreateNode/CreateNodeStage'
import EndNodeStage from '@pipeline/components/PipelineDiagram/Nodes/EndNode/EndNodeStage'
import StartNodeStage from '@pipeline/components/PipelineDiagram/Nodes/StartNode/StartNodeStage'
import DiagramLoader from '@pipeline/components/DiagramLoader/DiagramLoader'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import type { DeploymentStageConfig } from 'services/cd-ng'
import {
  CanvasWidget,
  createEngine,
  DefaultLinkModel,
  DefaultNodeEvent,
  DefaultNodeModel,
  Event,
  NodeStartModel
} from '../../Diagram'
import { StageBuilderModel } from './StageBuilderModel'
import { EmptyStageName, MinimumSplitPaneSize, DefaultSplitPaneSize, MaximumSplitPaneSize } from '../PipelineConstants'
import {
  getNewStageFromType,
  PopoverData,
  EmptyNodeSeparator,
  StageState,
  removeNodeFromPipeline,
  mayBeStripCIProps,
  getNewStageFromTemplate,
  getStageIndexWithParallelNodesFromPipeline,
  getLinkEventListeners,
  getNodeEventListerner,
  MoveDirection,
  MoveStageDetailsType,
  moveStage,
  getFlattenedStages
} from './StageBuilderUtil'
import { useStageBuilderCanvasState } from './useStageBuilderCanvasState'
import { StageList } from './views/StageList'
import { SplitViewTypes } from '../PipelineContext/PipelineActions'
import { usePipelineContext } from '../PipelineContext/PipelineContext'
import { getNodeListenersOld, getLinkListernersOld } from './StageBuildOldUtils'
import css from './StageBuilder.module.scss'

const diagram = new DiagramFactory('graph')

diagram.registerNode('Deployment', PipelineStageNode as unknown as React.FC<BaseReactComponentProps>, true)
diagram.registerNode('CI', PipelineStageNode as unknown as React.FC<BaseReactComponentProps>)
diagram.registerNode('SecurityTests', PipelineStageNode as unknown as React.FC<BaseReactComponentProps>)
diagram.registerNode('Approval', DiamondNodeWidget)
diagram.registerNode('Barrier', IconNode)
diagram.registerNode(NodeType.CreateNode, CreateNodeStage as unknown as React.FC<BaseReactComponentProps>)
diagram.registerNode(NodeType.EndNode, EndNodeStage)
diagram.registerNode(NodeType.StartNode, StartNodeStage)

const CDPipelineStudioNew = diagram.render()
export type StageStateMap = Map<string, StageState>

declare global {
  interface WindowEventMap {
    CLOSE_CREATE_STAGE_POPOVER: CustomEvent<string>
  }
}

const DEFAULT_MOVE_STAGE_DETAILS: MoveStageDetailsType = {
  direction: MoveDirection.AHEAD,
  event: undefined
}
export const initializeStageStateMap = (stages: StageElementWrapperConfig[], mapState: StageStateMap): void => {
  /* istanbul ignore else */
  stages.forEach?.(node => {
    if (node?.stage && node.stage.name !== EmptyStageName) {
      mapState.set(node.stage.identifier, { isConfigured: true, stage: node })
    } /* istanbul ignore else */ else if (node?.parallel) {
      node.parallel.forEach?.(parallelNode => {
        /* istanbul ignore else */ if (parallelNode.stage && parallelNode.stage.name !== EmptyStageName) {
          mapState.set(parallelNode.stage.identifier, { isConfigured: true, stage: parallelNode })
        }
      })
    }
  })
}

export const renderPopover = ({
  data,
  addStage,
  addStageNew,
  isParallel,
  isGroupStage,
  groupStages,
  groupSelectedStageId,
  onClickGroupStage,
  stagesMap,
  event,
  isStageView,
  onSubmitPrimaryData,
  renderPipelineStage,
  isHoverView,
  contextType,
  templateTypes,
  newPipelineStudioEnabled
}: PopoverData): JSX.Element => {
  if (isStageView && data) {
    const stageData = {
      stage: {
        ...data.stage,
        identifier: data?.stage?.name === EmptyStageName ? '' : /* istanbul ignore next */ data.stage?.identifier,
        name: data?.stage?.name === EmptyStageName ? '' : /* istanbul ignore next */ data.stage?.name
      }
    }
    return renderPipelineStage({
      minimal: true,
      stageType: data.stage?.type,
      stageProps: {
        data: stageData,
        onSubmit: (values: StageElementWrapperConfig, identifier: string) => {
          data.stage = {
            ...(values.stage as StageElementConfig)
          }
          onSubmitPrimaryData?.(values, identifier)
        }
      }
    })
  } else if (isGroupStage) {
    return (
      <StageList
        stagesMap={stagesMap}
        stages={groupStages || []}
        selectedStageId={groupSelectedStageId}
        onClick={onClickGroupStage}
        templateTypes={templateTypes}
      />
    )
  } else if (isHoverView && !!data?.stage?.when) {
    return (
      <HoverCard>
        <ConditionalExecutionTooltip
          status={data.stage.when.pipelineStatus}
          condition={data.stage.when.condition}
          mode={Modes.STAGE}
        />
      </HoverCard>
    )
  }
  if (newPipelineStudioEnabled) {
    return renderPipelineStage({
      isParallel,
      showSelectMenu: true,
      getNewStageFromType: getNewStageFromType as any,
      getNewStageFromTemplate: getNewStageFromTemplate as any,
      onSelectStage: (type, stage, pipelineTemp) => {
        if (stage) {
          addStageNew?.(stage, isParallel, !isParallel, undefined, true, pipelineTemp, event?.node)
        } else {
          addStageNew?.(getNewStageFromType(type as any), isParallel, !isParallel, event?.node)
        }
      },
      contextType: contextType
    })
  }
  return renderPipelineStage({
    isParallel,
    showSelectMenu: true,
    getNewStageFromType: getNewStageFromType as any,
    getNewStageFromTemplate: getNewStageFromTemplate as any,
    onSelectStage: (type, stage, pipelineTemp) => {
      if (stage) {
        addStage?.(stage, isParallel, event, undefined, true, pipelineTemp)
      } else {
        addStage?.(getNewStageFromType(type as any), isParallel, event)
      }
    },
    contextType: contextType
  })
}

function StageBuilder(): JSX.Element {
  const pipelineContext = usePipelineContext()
  const {
    state: {
      pipeline,
      pipelineView: {
        isSplitViewOpen,
        splitViewData: { type = SplitViewTypes.StageView }
      },
      pipelineView,
      isInitialized,
      selectionState: { selectedStageId },
      templateTypes
    },
    // contextType = 'Pipeline',
    isReadonly,
    stagesMap,
    updatePipeline,
    updatePipelineView,
    renderPipelineStage,
    getStageFromPipeline,
    setSelection
  } = usePipelineContext()

  // NOTE: we are using ref as setSelection is getting cached somewhere
  const setSelectionRef = React.useRef(setSelection)
  setSelectionRef.current = setSelection

  const newPipelineStudioEnabled: boolean = useFeatureFlag(FeatureFlag.NEW_PIPELINE_STUDIO)

  const { trackEvent } = useTelemetry()

  const { getString } = useStrings()
  const [dynamicPopoverHandler, setDynamicPopoverHandler] = React.useState<
    DynamicPopoverHandlerBinding<PopoverData> | undefined
  >()
  useGlobalEventListener('CLOSE_CREATE_STAGE_POPOVER', () => {
    dynamicPopoverHandler?.hide()
  })

  const [deleteId, setDeleteId] = React.useState<string | undefined>(undefined)
  const { showSuccess, showError } = useToaster()

  let deletionContentText = `${getString('stageConfirmationText', {
    name: getStageFromPipeline(deleteId || '').stage?.stage?.name || deleteId,
    id: deleteId
  })} `

  if (deleteId) {
    const propagatingStages = getFlattenedStages(pipeline)
      .stages?.filter(
        currentStage =>
          (currentStage.stage?.spec as DeploymentStageConfig)?.serviceConfig?.useFromStage?.stage === deleteId
      )
      ?.reduce((prev, next) => {
        return prev ? `${prev}, ${next.stage?.name}` : next.stage?.name || ''
      }, '')

    if (propagatingStages)
      deletionContentText = getString('pipeline.parentStageDeleteWarning', {
        propagatingStages
      })
  }

  const { openDialog: confirmDeleteStage } = useConfirmationDialog({
    contentText: deletionContentText,
    titleText: getString('deletePipelineStage'),
    confirmButtonText: getString('delete'),
    cancelButtonText: getString('cancel'),
    intent: Intent.DANGER,
    buttonIntent: Intent.DANGER,
    onCloseDialog: async (isConfirmed: boolean) => {
      if (deleteId && isConfirmed) {
        const cloned = cloneDeep(pipeline)
        const stageToDelete = getStageFromPipeline(deleteId, cloned)
        const isRemove = removeNodeFromPipeline(stageToDelete, cloned, stageMap)
        const isStripped = mayBeStripCIProps(cloned)
        if (isRemove || isStripped) {
          updatePipeline(cloned)
          showSuccess(getString('deleteStageSuccess'))
          // call telemetry
          trackEvent(StageActions.DeleteStage, { stageType: stageToDelete?.stage?.stage?.type || '' })
        } else {
          showError(getString('deleteStageFailure'), undefined, 'pipeline.delete.stage.error')
        }
      }
    }
  })

  const canvasRef = React.useRef<HTMLDivElement | null>(null)
  const [stageMap, setStageMap] = React.useState(new Map<string, StageState>())
  const { errorMap } = useValidationErrors()

  const selectedStage = getStageFromPipeline(selectedStageId || '')
  const openSplitView = isSplitViewOpen && !!selectedStage?.stage

  const updateDeleteId = (id: string | undefined) => {
    setDeleteId(id)
  }

  const addStage = (
    newStage: StageElementWrapper,
    isParallel = false,
    event?: DefaultNodeEvent,
    insertAt?: number,
    openSetupAfterAdd?: boolean,
    pipelineTemp?: PipelineInfoConfig
  ): void => {
    // call telemetry
    trackEvent(StageActions.SetupStage, { stageType: newStage?.stage?.type || '' })
    if (!pipeline.stages) {
      pipeline.stages = []
    }
    if (event?.entity && event.entity instanceof DefaultLinkModel) {
      let node = event.entity.getSourcePort().getNode() as DefaultNodeModel
      if (node instanceof NodeStartModel) {
        pipeline.stages = produce(pipeline.stages, draft => {
          draft.unshift(newStage)
        })
      } else {
        let { stage } = getStageFromPipeline(node.getIdentifier())
        let next = 1
        if (!stage) {
          node = event.entity.getTargetPort().getNode() as DefaultNodeModel
          stage = getStageFromPipeline(node.getIdentifier()).stage
          next = 0
        }
        if (stage) {
          const index = pipeline.stages.indexOf(stage)
          if (index > -1) {
            pipeline.stages = produce(pipeline.stages, draft => {
              draft.splice(index + next, 0, newStage)
            })
          }
        } else {
          // parallel next parallel case
          let nodeParallel = event.entity.getSourcePort().getNode() as DefaultNodeModel
          let nodeId = nodeParallel.getIdentifier().split(EmptyNodeSeparator)[1]
          stage = getStageFromPipeline(nodeId).parent
          next = 1
          if (!stage) {
            nodeParallel = event.entity.getTargetPort().getNode() as DefaultNodeModel
            nodeId = nodeParallel.getIdentifier().split(EmptyNodeSeparator)[2]
            const parallelOrRootLevelStage = getStageFromPipeline(nodeId)
            // NOTE: in a case of two stages parallel node is moved to root level
            // so we use parallelOrRootLevelStage.parent if defined, otherwise we use parallelOrRootLevelStage
            stage = parallelOrRootLevelStage.parent ? parallelOrRootLevelStage.parent : parallelOrRootLevelStage.stage
            next = 0
          }
          if (stage) {
            const index = pipeline.stages.indexOf(stage)
            if (index > -1) {
              pipeline.stages = produce(pipeline.stages, draft => {
                draft.splice(index + next, 0, newStage)
              })
            }
          }
        }
      }
    } else if (isParallel && event?.entity && event.entity instanceof DefaultNodeModel) {
      const { stage, parent } = getStageFromPipeline(event.entity.getIdentifier())
      const parentTemp = parent as StageElementWrapperConfig
      if (stage) {
        if (parentTemp && parentTemp.parallel && parentTemp.parallel.length > 0) {
          parentTemp.parallel = produce(parentTemp.parallel, draft => {
            draft.push(newStage)
          })
        } else {
          const index = pipeline.stages.indexOf(stage)
          if (index > -1) {
            pipeline.stages = produce(pipeline.stages, draft => {
              draft.splice(index, 1, {
                parallel: [stage, newStage]
              })
            })
          }
        }
      }
    } else {
      if (!isNil(insertAt) && insertAt > -1) {
        pipeline.stages = produce(pipeline.stages, draft => {
          draft.splice(insertAt, 0, newStage)
        })
      } else {
        pipeline.stages = produce(pipeline.stages, draft => {
          draft.push(newStage)
        })
      }
    }
    dynamicPopoverHandler?.hide()
    model.addUpdateGraph({
      data: pipeline,
      listeners: {
        nodeListeners,
        linkListeners
      },
      stagesMap,
      getString,
      isReadonly,
      parentPath: 'pipeline.stages',
      errorMap,
      templateTypes,
      zoomLevel: 0
    })
    if (newStage.stage && newStage.stage.name !== EmptyStageName) {
      stageMap.set(newStage.stage.identifier, { isConfigured: true, stage: newStage })
    }
    engine.repaintCanvas()
    updatePipeline({ ...(pipelineTemp || {}), ...pipeline }).then(() => {
      if (openSetupAfterAdd) {
        setSelectionRef.current({ stageId: newStage.stage?.identifier })
        moveStageToFocusDelayed(engine, newStage.stage?.identifier || '', true)
      }
    })
  }

  const addStageNew = (
    newStage: StageElementWrapper,
    isParallel?: boolean,
    droppedOnLink?: boolean,
    insertAt?: number,
    openSetupAfterAdd?: boolean,
    pipelineTemp?: PipelineInfoConfig,
    destination?: any
  ): void => {
    // call telemetry
    trackEvent(StageActions.SetupStage, { stageType: newStage?.stage?.type || '' })

    if (!pipeline.stages) {
      pipeline.stages = []
    }
    if (droppedOnLink) {
      if (!destination) {
        pipeline.stages.push(newStage)
      } else {
        const { parIndex } = getStageIndexWithParallelNodesFromPipeline(
          pipeline,
          destination?.stage?.identifier || destination?.identifier
        )
        if (parIndex === 0) {
          pipeline.stages.unshift(newStage)
        } else if (parIndex > 0) {
          pipeline.stages.splice(parIndex, 0, newStage)
        }
      }
    } else if (isParallel && !droppedOnLink) {
      const { stage, parent } = getStageFromPipeline(destination?.stage?.identifier || destination?.identifier || '')
      const parentTemp = parent as StageElementWrapperConfig
      if (stage) {
        if (parentTemp && parentTemp.parallel && parentTemp.parallel.length > 0) {
          parentTemp.parallel.push(newStage)
        } else {
          const index = pipeline.stages.indexOf(stage)
          if (index > -1) {
            pipeline.stages.splice(index, 1, {
              parallel: [stage, newStage]
            })
          }
        }
      }
    } else {
      if (!isNil(insertAt) && insertAt > -1) {
        pipeline.stages.splice(insertAt, 0, newStage)
      } else {
        pipeline.stages.push(newStage)
      }
    }
    dynamicPopoverHandler?.hide()

    if (newStage.stage && newStage.stage.name !== EmptyStageName) {
      stageMap.set(newStage.stage.identifier, { isConfigured: true, stage: newStage })
    }
    updatePipeline({ ...(pipelineTemp || {}), ...pipeline }).then(() => {
      if (openSetupAfterAdd) {
        setSelectionRef.current({ stageId: newStage.stage?.identifier })
        moveStageToFocusDelayed(engine, newStage.stage?.identifier || '', true)
      }
    })
  }

  // open split panel if stage is selected stage exist
  // note: this open split panel when user use direct url
  React.useEffect(() => {
    if (selectedStageId && !isSplitViewOpen) {
      updatePipelineView({
        ...pipelineView,
        isSplitViewOpen: true,
        splitViewData: { type: SplitViewTypes.StageView }
      })
    }

    if (!selectedStageId && isSplitViewOpen) {
      updatePipelineView({
        ...pipelineView,
        isSplitViewOpen: false,
        splitViewData: {}
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStageId, isSplitViewOpen])

  React.useEffect(() => {
    if (isInitialized && !isSplitViewOpen && pipeline.stages) {
      const map = new Map<string, StageState>()
      initializeStageStateMap(pipeline.stages, map)
      setStageMap(map)
    }
  }, [isInitialized, pipeline.stages, isSplitViewOpen])

  // updates stages when stage is dragged to add stage link
  const updateStageOnAddLink = (event: any, dropNode: StageElementWrapper | undefined, current: any): void => {
    // Check Drop Node and Current node should not be same
    if (event.node.identifier !== event.entity.getIdentifier()) {
      const isRemove = removeNodeFromPipeline(getStageFromPipeline(event.node.identifier), pipeline, stageMap, false)
      if (isRemove && dropNode) {
        if (!current.parent && current.stage) {
          const index = pipeline.stages?.indexOf(current.stage) ?? -1
          if (index > -1) {
            // Remove current Stage also and make it parallel
            pipeline?.stages?.splice(index, 1)
            // Now make a parallel stage and update at the same place
            addStage(
              {
                parallel: [current.stage, dropNode]
              },
              false,
              event,
              index,
              false
            )
          }
        } else {
          addStage(dropNode, current?.parent?.parallel?.length > 0, event, undefined, false)
        }
      }
    }
  }

  const updateStageOnAddLinkNew = (event: any, dropNode: StageElementWrapper | undefined, current: any): void => {
    // Check Drop Node and Current node should not be same
    if (dropNode?.stage?.identifier !== current?.stage?.stage?.identifier) {
      const isRemove = removeNodeFromPipeline(getStageFromPipeline(event.node.identifier), pipeline, stageMap, false)
      if (isRemove && dropNode) {
        if (!current.parent && current.stage) {
          const index = pipeline.stages?.indexOf(current.stage) ?? -1
          if (index > -1) {
            // Remove current Stage also and make it parallel
            pipeline?.stages?.splice(index, 1)
            // Now make a parallel stage and update at the same place
            addStageNew(
              {
                parallel: [current.stage, dropNode]
              },
              false,
              false,
              index,
              false,
              undefined,
              current?.stage
            )
          }
        } else {
          addStageNew(
            dropNode,
            current?.parent?.parallel?.length > 0,
            false,
            undefined,
            false,
            undefined,
            current?.stage
          )
        }
      }
    }
  }

  //1) setup the diagram engine
  const engine = React.useMemo(() => createEngine({}), [])

  //2) setup the diagram model
  const model = React.useMemo(() => new StageBuilderModel(), [])

  React.useEffect(() => {
    setDeleteId(deleteId)
  }, [deleteId])

  const [moveStageDetails, setMoveStageDetails] = React.useState<MoveStageDetailsType>({
    ...DEFAULT_MOVE_STAGE_DETAILS
  })

  const updateMoveStageDetails = (moveStageDetail: MoveStageDetailsType): void => {
    setMoveStageDetails(moveStageDetail)
  }

  const { openDialog: confirmMoveStage } = useConfirmationDialog({
    contentText: getString('pipeline.moveStage.description'),
    titleText: getString('pipeline.moveStage.title'),
    confirmButtonText: getString('common.move'),
    cancelButtonText: getString('cancel'),
    intent: Intent.WARNING,
    onCloseDialog: async (isConfirmed: boolean) => {
      if (isConfirmed) {
        moveStage({
          moveStageDetails,
          updateStageOnAddLink,
          updateStageOnAddLinkNew,
          addStage,
          pipelineContext,
          stageMap,
          resetPipelineStages,
          addStageNew,
          newPipelineStudioEnabled
        })
      }
    }
  })

  const nodeListeners: NodeModelListener = getNodeListenersOld(
    updateStageOnAddLink,
    setSelectionRef,
    confirmDeleteStage,
    updateDeleteId,
    dynamicPopoverHandler,
    pipelineContext,
    addStage,
    updateMoveStageDetails,
    confirmMoveStage,
    stageMap,
    engine
  )

  const nodeListenersNew: NodeModelListener = getNodeEventListerner(
    updateStageOnAddLinkNew,
    setSelectionRef,
    confirmDeleteStage,
    updateDeleteId,
    dynamicPopoverHandler,
    pipelineContext,
    addStageNew,
    updateMoveStageDetails,
    confirmMoveStage,
    stageMap,
    newPipelineStudioEnabled
  )

  const resetPipelineStages = (stages: StageElementWrapperConfig[]): void => {
    updatePipeline({
      ...pipeline,
      stages
    }).then(() => {
      resetMoveStageDetails()
    })
  }

  const resetMoveStageDetails = (): void =>
    setMoveStageDetails({
      ...DEFAULT_MOVE_STAGE_DETAILS
    })

  const linkListeners: LinkModelListener = getLinkListernersOld(
    dynamicPopoverHandler,
    pipelineContext,
    addStage,
    openSplitView,
    updateMoveStageDetails,
    confirmMoveStage,
    stageMap
  )

  const linkListenersNew: LinkModelListener = getLinkEventListeners(
    dynamicPopoverHandler,
    pipelineContext,
    addStageNew,
    updateMoveStageDetails,
    confirmMoveStage,
    stageMap,
    newPipelineStudioEnabled
  )

  const canvasClick = (): void => {
    dynamicPopoverHandler?.hide()
  }

  const events = {
    [Event.DropLinkEvent]: linkListenersNew[Event.DropLinkEvent],
    [Event.DropNodeEvent]: nodeListenersNew[Event.DropNodeEvent],
    [Event.ClickNode]: nodeListenersNew[Event.ClickNode],
    [Event.AddParallelNode]: nodeListenersNew[Event.AddParallelNode],
    [Event.RemoveNode]: nodeListenersNew[Event.RemoveNode],
    [Event.AddLinkClicked]: linkListenersNew[Event.AddLinkClicked],
    [Event.CanvasClick]: canvasClick,
    [Event.MouseEnterNode]: nodeListenersNew[Event.MouseEnterNode],
    [Event.MouseLeaveNode]: nodeListenersNew[Event.MouseLeaveNode],
    [Event.DragStart]: nodeListenersNew[Event.MouseLeaveNode]
  }

  if (diagram) diagram.registerListeners(events)

  const [splitPaneSize, setSplitPaneSize] = React.useState(DefaultSplitPaneSize)

  model.addUpdateGraph({
    data: pipeline,
    listeners: {
      nodeListeners,
      linkListeners
    },
    stagesMap,
    getString,
    isReadonly,
    selectedStageId,
    splitPaneSize,
    parentPath: 'pipeline.stages',
    errorMap,
    templateTypes,
    zoomLevel: 0
  })
  const setSplitPaneSizeDeb = React.useRef(debounce(setSplitPaneSize, 200))
  // load model into engine
  engine.setModel(model)

  /* Ignoring this function as it is used by "react-split-pane" */
  /* istanbul ignore next */
  function handleStageResize(size: number): void {
    setSplitPaneSizeDeb.current(size)
  }

  // handle position and zoom of canvas
  useStageBuilderCanvasState(engine, [])

  const StageCanvas = (
    <div
      className={css.canvas}
      ref={canvasRef}
      onClick={e => {
        const div = e.target as HTMLDivElement
        if (div === canvasRef.current?.children[0]) {
          dynamicPopoverHandler?.hide()
        }

        if (isSplitViewOpen) {
          setSelectionRef.current({ stageId: undefined, sectionId: undefined })
        }
      }}
    >
      <CanvasWidget engine={engine} />
      <DynamicPopover
        darkMode={false}
        className={css.renderPopover}
        render={renderPopover}
        bind={setDynamicPopoverHandler}
      />
      <CanvasButtons tooltipPosition="left" engine={engine} callback={() => dynamicPopoverHandler?.hide()} />
    </div>
  )
  // eslint-disable-next-line
  const resizerStyle = !!navigator.userAgent.match(/firefox/i)
    ? { display: 'flow-root list-item' }
    : { display: 'inline-table' }

  const stageType = selectedStage?.stage?.stage?.template ? StageType.Template : selectedStage?.stage?.stage?.type
  const stageData = useMemo(() => {
    return getPipelineGraphData({
      data: pipeline.stages as StageElementWrapperConfig[],
      templateTypes: templateTypes,
      serviceDependencies: undefined,
      errorMap: errorMap,
      parentPath: `pipeline.stages`
    })
  }, [pipeline, errorMap, templateTypes])

  return (
    <Layout.Horizontal className={cx(css.canvasContainer)} padding="medium">
      <div className={css.canvasWrapper}>
        <SplitPane
          size={openSplitView ? splitPaneSize : '100%'}
          split="horizontal"
          minSize={MinimumSplitPaneSize}
          maxSize={MaximumSplitPaneSize}
          style={{ overflow: openSplitView ? 'auto' : 'hidden' }}
          pane2Style={{ overflow: 'initial', zIndex: 2 }}
          resizerStyle={resizerStyle}
          onChange={handleStageResize}
          allowResize={openSplitView}
        >
          {newPipelineStudioEnabled ? (
            <div
              className={css.canvas}
              ref={canvasRef}
              onClick={e => {
                const div = e.target as HTMLDivElement
                if (div === canvasRef.current?.children[0]) {
                  dynamicPopoverHandler?.hide()
                }

                if (isSplitViewOpen) {
                  setSelectionRef.current({ stageId: undefined, sectionId: undefined })
                }
              }}
            >
              <CDPipelineStudioNew
                selectedNodeId={selectedStageId}
                data={stageData}
                loaderComponent={DiagramLoader}
                parentSelector={'.Pane1'}
                collapsibleProps={{ percentageNodeVisible: 0.8, bottomMarginInPixels: 80 }}
                createNodeTitle={getString('addStage')}
                graphLinkClassname={css.graphLink}
              />
              <DynamicPopover
                darkMode={false}
                className={css.renderPopover}
                render={renderPopover}
                bind={setDynamicPopoverHandler}
              />
            </div>
          ) : (
            StageCanvas
          )}

          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'white'
            }}
          >
            {openSplitView && type === SplitViewTypes.StageView
              ? renderPipelineStage({
                  stageType: stageType,
                  minimal: false
                })
              : null}
          </div>
        </SplitPane>
      </div>
    </Layout.Horizontal>
  )
}

export default StageBuilder
