/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Layout, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { NodeModelListener } from '@projectstorm/react-diagrams-core'
import { defaultTo, set } from 'lodash-es'
import { useParams } from 'react-router-dom'
import {
  CreateNewModel,
  CreateNewWidget,
  DefaultNodeModel,
  DefaultNodeModelOptions,
  DefaultNodeWidget,
  DiamondNodeModel,
  DiamondNodeWidget,
  Event
} from '@pipeline/components/Diagram'
import type { StageElementConfig } from 'services/cd-ng'
import { DynamicPopover } from '@common/components'
import { renderPopover } from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilder'
import type { DynamicPopoverHandlerBinding } from '@common/components/DynamicPopover/DynamicPopover'
import {
  StageAttributes,
  usePipelineContext
} from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { useGlobalEventListener } from '@common/hooks'
import type { StageElementWrapper } from '@pipeline/utils/pipelineTypes'
import { PopoverData, getCommonStyles } from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilderUtil'
import { DefaultNewTemplateId } from 'framework/Templates/templates'
import type { TemplateStudioPathProps } from '@common/interfaces/RouteInterfaces'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import { DefaultNewStageId } from '@templates-library/components/TemplateStudio/StageTemplateCanvas/StageTemplateForm/StageTemplateForm'
import { SplitViewTypes } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineActions'
import stageBuilderCss from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilder.module.scss'
import css from './StageTemplateDiagram.module.scss'

const CREATE_NODE_ID = 'create-node'

export const StageTemplateDiagram = (): JSX.Element => {
  const {
    state: { template, gitDetails }
  } = React.useContext(TemplateContext)
  const {
    state: {
      pipeline,
      pipelineView,
      selectionState: { selectedStageId },
      templateTypes
    },
    contextType,
    stagesMap,
    updatePipeline,
    updatePipelineView,
    setSelection,
    renderPipelineStage,
    getStageFromPipeline
  } = usePipelineContext()
  const selectedStage = getStageFromPipeline(defaultTo(selectedStageId, ''))
  const [dynamicPopoverHandler, setDynamicPopoverHandler] = React.useState<
    DynamicPopoverHandlerBinding<PopoverData> | undefined
  >()
  const [stageData, setStageData] = React.useState<StageAttributes>()
  const canvasRef = React.useRef<HTMLDivElement | null>(null)
  const { templateIdentifier } = useParams<TemplateStudioPathProps>()

  useGlobalEventListener('CLOSE_CREATE_STAGE_POPOVER', () => {
    dynamicPopoverHandler?.hide()
  })

  const openStageSelection = (nodeId: string) => {
    dynamicPopoverHandler?.show(
      `[data-nodeid="${nodeId}"]`,
      {
        addStage: async (newStage: StageElementWrapper) => {
          dynamicPopoverHandler?.hide()
          set(pipeline, 'stages[0].stage', { ...newStage.stage, identifier: DefaultNewStageId })
          await updatePipeline(pipeline)
          setSelection({ stageId: DefaultNewStageId })
          updatePipelineView({
            ...pipelineView,
            isSplitViewOpen: true,
            splitViewData: { type: SplitViewTypes.StageView }
          })
        },
        isStageView: false,
        renderPipelineStage,
        stagesMap: stagesMap,
        contextType,
        templateTypes
      },
      { useArrows: true, darkMode: false, fixedPosition: false, placement: 'bottom-start' }
    )
  }

  const nodeListeners: NodeModelListener = {
    [Event.ClickNode]: (_event: any) => {
      dynamicPopoverHandler?.hide()
      if (templateIdentifier === DefaultNewTemplateId) {
        openStageSelection(CREATE_NODE_ID)
      }
    }
  }

  const getCreateNode = () => {
    const createNode = new CreateNewModel({
      id: CREATE_NODE_ID,
      width: 90,
      height: 40,
      customNodeStyle: { borderColor: 'var(--pipeline-grey-border)' },
      nodeClassName: css.createNewModal
    })
    createNode.registerListener(nodeListeners)
    return createNode
  }

  const getOptions = (stage: StageElementConfig): DefaultNodeModelOptions => {
    return {
      identifier: stage.identifier,
      id: stage.identifier,
      customNodeStyle: { ...getCommonStyles(false), borderColor: 'var(--primary-7)', borderStyle: 'solid' },
      name: '',
      isInComplete: false,
      defaultSelected: false,
      draggable: false,
      canDelete: false,
      conditionalExecutionEnabled: stage.when
        ? stage.when?.pipelineStatus !== 'Success' || !!stage.when?.condition?.trim()
        : false,
      allowAdd: false,
      iconStyle: { color: stagesMap[defaultTo(stage.type, '')]?.iconColor },
      icon: stagesMap[defaultTo(stage.type, '')]?.icon,
      nodeClassName: css.createNewModal,
      ...(stage.when && {})
    }
  }

  const getStageNode = (stage: StageElementConfig) => {
    const stageNode = new DefaultNodeModel({ ...getOptions(stage), width: 90, height: 40 })
    stageNode.registerListener(nodeListeners)
    return stageNode
  }

  const getDiamondStageNode = (stage: StageElementConfig) => {
    const stageNode = new DiamondNodeModel({ ...getOptions(stage), width: 57, height: 57, secondaryIcon: undefined })
    stageNode.registerListener(nodeListeners)
    return stageNode
  }

  React.useEffect(() => {
    if (!!template.name && !(template.spec as StageElementConfig)?.type) {
      openStageSelection(CREATE_NODE_ID)
    }
  }, [template.name, gitDetails])

  React.useEffect(() => {
    const stageType = selectedStage.stage?.stage?.type || ''
    if (stageType) {
      setStageData(stagesMap[stageType])
    }
  }, [selectedStageId])

  return (
    <Container
      className={css.container}
      background={Color.FORM_BG}
      width={'100%'}
      padding={{ left: 'xxxlarge', right: 'xxxlarge' }}
      ref={canvasRef}
      onClick={e => {
        const div = e.target as HTMLDivElement
        if (div === canvasRef.current?.children[0]) {
          dynamicPopoverHandler?.hide()
        }
      }}
    >
      <Layout.Vertical height={'100%'} flex={{ justifyContent: 'center', alignItems: 'flex-start' }} spacing={'small'}>
        <Text font={{ size: 'small', weight: 'semi-bold' }} color={Color.GREY_600}>
          Stage Type
        </Text>
        <Container>
          <Layout.Horizontal className={stageData?.isApproval ? css.approvalLayout : css.normalLayout}>
            <Container data-nodeid={CREATE_NODE_ID}>
              {selectedStage.stage?.stage?.type ? (
                stageData?.isApproval ? (
                  <DiamondNodeWidget node={getDiamondStageNode(selectedStage.stage?.stage)} />
                ) : (
                  <DefaultNodeWidget node={getStageNode(selectedStage.stage?.stage)} />
                )
              ) : (
                <CreateNewWidget node={getCreateNode()} />
              )}
            </Container>
            <Text font={{ size: 'small', weight: 'semi-bold' }} color={Color.GREY_600} className={css.stageType}>
              {defaultTo(stageData?.name, '')}
            </Text>
          </Layout.Horizontal>
        </Container>
      </Layout.Vertical>
      <DynamicPopover
        darkMode={false}
        className={stageBuilderCss.renderPopover}
        render={renderPopover}
        bind={setDynamicPopoverHandler}
      />
    </Container>
  )
}
