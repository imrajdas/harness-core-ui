/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { CSSProperties, useRef } from 'react'
import cx from 'classnames'
import { defaultTo } from 'lodash-es'
import { Icon, IconName, Text, Layout } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { DiagramDrag, DiagramType, Event } from '@pipeline/components/Diagram'
import { DynamicPopover, DynamicPopoverHandlerBinding } from '@common/exports'
import ExecutionStatusLabel from '@pipeline/components/ExecutionStatusLabel/ExecutionStatusLabel'
import { ExecutionStatus, ExecutionStatusEnum } from '@pipeline/utils/statusHelpers'
import { getStatusProps } from '@pipeline/components/ExecutionStageDiagram/ExecutionStageDiagramUtils'
import { ExecutionPipelineNodeType } from '@pipeline/components/ExecutionStageDiagram/ExecutionPipelineModel'
import { NodeType, BaseReactComponentProps } from '../../types'
import AddLinkNode from '../DefaultNode/AddLinkNode/AddLinkNode'
import { getPositionOfAddIcon } from '../utils'
import css from '../DefaultNode/DefaultNode.module.scss'
import groupnodecss from './GroupNode.module.scss'
export interface GroupNodeProps extends BaseReactComponentProps {
  intersectingIndex: number
  children?: any
  customNodeStyle?: CSSProperties | undefined
  status?: string
}
interface Node {
  name: string
  icon: IconName
  identifier: string
  id: string
  type: string
  status: string
}
function GroupNode(props: GroupNodeProps): React.ReactElement {
  const [selected, setSelected] = React.useState<boolean>(false)
  const [hasFailedNode, setFailedNode] = React.useState<boolean>(false)
  const [hasRunningNode, setRunningNode] = React.useState<boolean>(false)
  const allowAdd = defaultTo(props.allowAdd, false)
  const [showAdd, setVisibilityOfAdd] = React.useState(false)
  const CreateNode: React.FC<BaseReactComponentProps> | undefined = props?.getNode?.(NodeType.CreateNode)?.component
  const [dynamicPopoverHandler, setDynamicPopoverHandler] = React.useState<
    DynamicPopoverHandlerBinding<{ nodesInfo: Node[]; isExecutionView: boolean }> | undefined
  >()
  const canvasClickListener = React.useCallback((): void => dynamicPopoverHandler?.hide(), [dynamicPopoverHandler])
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const nodesInfo = React.useMemo(() => {
    let nodesArr
    if (props.intersectingIndex < 1) {
      const firstNodeData: Node = {
        name: props.name as string,
        icon: props.icon as IconName,
        identifier: props.identifier as string,
        id: props.id,
        type: props.type as string,
        status: props.status as string
      }

      nodesArr = props?.children && props.children.length ? [firstNodeData, ...props.children] : [firstNodeData]
    } else {
      nodesArr = props?.children?.slice(props.intersectingIndex - 1)
    }

    const nodesFinal: Node[] = []
    let isNodeSelected = false
    const runningNodeFound = nodesArr.find((node: Node) => node.status === ExecutionStatusEnum.Running)
    setRunningNode(runningNodeFound)
    nodesArr.forEach((node: Node) => {
      if (node.status === ExecutionStatusEnum.Failed) {
        setFailedNode(true)
      }
      const isSelectedNode = node.identifier === props.selectedNodeId || node.id === props.selectedNodeId
      if (isSelectedNode) {
        isNodeSelected = isSelectedNode
      }
      const nodeToBePushed = {
        name: node.name,
        icon: node.icon as IconName,
        identifier: node.identifier,
        id: node.id,
        type: node.type,
        status: node.status as string
      }
      if (isSelectedNode) {
        nodesFinal.unshift(nodeToBePushed)
      } else {
        nodesFinal.push(nodeToBePushed)
      }
    })
    if (isNodeSelected !== selected) {
      setSelected(isNodeSelected)
    }
    return nodesFinal
  }, [props?.children, props.intersectingIndex, props.selectedNodeId])

  React.useEffect(() => {
    document.addEventListener('CANVAS_CLICK_EVENT', canvasClickListener)
    return () => {
      document.removeEventListener('CANVAS_CLICK_EVENT', canvasClickListener)
    }
  }, [dynamicPopoverHandler])

  const renderPopover = ({
    nodesInfo: stageList,
    isExecutionView
  }: {
    nodesInfo: Node[]
    isExecutionView: boolean
  }): JSX.Element => {
    const { restStageList, runningStageList } = stageList.reduce(
      (acc, node) => {
        if (node.status === ExecutionStatusEnum.Running) {
          acc?.runningStageList?.push(node)
        } else {
          acc?.restStageList?.push(node)
        }
        return acc
      },
      {
        runningStageList: [] as Node[],
        restStageList: [] as Node[]
      }
    )

    const renderView = (node: Node): JSX.Element => {
      return (
        <Layout.Horizontal
          style={{ cursor: 'pointer' }}
          spacing="small"
          padding="small"
          key={node.identifier}
          onClick={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            event.stopPropagation()
            props?.fireEvent?.({
              type: Event.ClickNode,
              target: event.target,
              data: {
                entityType: DiagramType.GroupNode,
                node,
                ...props,
                identifier: node?.identifier,
                id: node.id
              }
            })
            dynamicPopoverHandler?.hide()
          }}
        >
          <Icon name={node.icon} />
          <Text lineClamp={1} width={200}>
            {node.name}
          </Text>
          {isExecutionView && <ExecutionStatusLabel status={node?.status as ExecutionStatus} />}
        </Layout.Horizontal>
      )
    }
    return (
      <div className={groupnodecss.nodelistpopover}>
        {runningStageList.length > 0 && runningStageList.map((node: Node) => renderView(node))}
        {restStageList.map((node: Node) => renderView(node))}
      </div>
    )
  }

  const getGroupNodeName = (): string => {
    return `${defaultTo(nodesInfo?.[0]?.name, '')} +  ${nodesInfo.length - 1} more stages`
  }

  const setAddVisibility = (visibility: boolean): void => {
    if (!allowAdd) {
      return
    }
    setVisibilityOfAdd(visibility)
  }
  const isExecutionView = Boolean(props?.data?.status)
  const { secondaryIconProps, secondaryIcon, secondaryIconStyle } = getStatusProps(
    ExecutionStatusEnum.Failed as ExecutionStatus,
    ExecutionPipelineNodeType.NORMAL
  )
  // running status style
  const {
    secondaryIconProps: runningIconProps,
    secondaryIcon: runningIcon,
    secondaryIconStyle: runningIconStyle
  } = getStatusProps(ExecutionStatusEnum.Running as ExecutionStatus, ExecutionPipelineNodeType.NORMAL)

  return (
    <div style={{ position: 'relative' }}>
      <div
        className={css.defaultNode}
        onClick={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          event.preventDefault()
          event.stopPropagation()
          dynamicPopoverHandler?.show(
            nodeRef.current as Element,
            { nodesInfo, isExecutionView },
            {
              useArrows: true,
              darkMode: false,
              fixedPosition: false
            }
          )
        }}
        onMouseOver={() => setAddVisibility(true)}
        onMouseLeave={() => setAddVisibility(false)}
        onDragOver={event => {
          if (event.dataTransfer.types.indexOf(DiagramDrag.AllowDropOnNode) !== -1) {
            setAddVisibility(true)
            event.preventDefault()
          }
        }}
        onDragLeave={event => {
          if (event.dataTransfer.types.indexOf(DiagramDrag.AllowDropOnNode) !== -1) {
            setAddVisibility(false)
          }
        }}
        onDrop={event => {
          event.stopPropagation()
          props?.fireEvent?.({
            type: Event.DropNodeEvent,
            target: event.target,
            data: {
              entityType: DiagramType.Default,
              node: JSON.parse(event.dataTransfer.getData(DiagramDrag.NodeDrag)),
              // last element of groupnode
              destination: props?.children?.slice(-1)?.[0]
            }
          })
        }}
      >
        <div
          className={css.defaultCard}
          style={{
            position: 'absolute',
            width: defaultTo(props.width, 90),
            height: defaultTo(props.height, 40),
            marginTop: -8,
            marginLeft: 8
          }}
        ></div>
        <div
          className={css.defaultCard}
          style={{
            position: 'absolute',
            width: defaultTo(props.width, 90),
            height: defaultTo(props.height, 40),
            marginTop: -4,
            marginLeft: 4
          }}
        ></div>

        <div
          ref={nodeRef}
          id={props.id}
          data-nodeid={props.id}
          className={cx(css.defaultCard, { [css.selected]: selected })}
          style={{
            width: defaultTo(props.width, 90),
            height: defaultTo(props.height, 40),
            marginTop: 32 - defaultTo(props.height, 64) / 2,
            ...props.customNodeStyle
          }}
        >
          <div className={css.iconGroup}>
            {nodesInfo?.[0]?.icon && nodesInfo[0].icon && <Icon size={28} name={nodesInfo[0].icon} />}
            {nodesInfo?.[1]?.icon && nodesInfo[1].icon && <Icon size={28} name={nodesInfo[1].icon} />}
          </div>
        </div>
        {secondaryIcon && hasFailedNode && !hasRunningNode && (
          <Icon
            name={secondaryIcon}
            style={secondaryIconStyle}
            size={13}
            className={css.secondaryIcon}
            {...secondaryIconProps}
          />
        )}
        {runningIcon && hasRunningNode && (
          <Icon
            name={runningIcon}
            style={runningIconStyle}
            size={13}
            className={css.secondaryIcon}
            {...runningIconProps}
          />
        )}
        <div className={cx(css.nodeNameText, css.stageName)}>
          <Text
            width={125}
            font={{ size: 'normal', align: 'center' }}
            color={props.defaultSelected ? Color.GREY_900 : Color.GREY_600}
            padding={'small'}
            lineClamp={2}
            onClick={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
              event.stopPropagation()
              dynamicPopoverHandler?.show(
                nodeRef.current as Element,
                { nodesInfo, isExecutionView },
                {
                  useArrows: true,
                  darkMode: false,
                  fixedPosition: false
                }
              )
            }}
          >
            {getGroupNodeName()}
          </Text>
        </div>
      </div>
      {allowAdd && !props.readonly && CreateNode && (
        <CreateNode
          id={props.id}
          onMouseOver={() => setAddVisibility(true)}
          onMouseLeave={() => setAddVisibility(false)}
          onClick={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            event.stopPropagation()
            props?.fireEvent?.({
              type: Event.AddParallelNode,
              target: event.target,
              data: {
                identifier: props?.identifier,
                parentIdentifier: props?.parentIdentifier,
                entityType: DiagramType.Default,
                node: props
              }
            })
          }}
          className={cx(css.addNode, { [css.visible]: showAdd }, css.stageAddNode)}
          data-nodeid="add-parallel"
        />
      )}
      <DynamicPopover
        darkMode={false}
        className={css.renderPopover}
        render={renderPopover}
        bind={setDynamicPopoverHandler}
        closeOnMouseOut
        usePortal
      />
      {!props.readonly && (
        <AddLinkNode<GroupNodeProps>
          id={props.id}
          nextNode={props?.nextNode}
          parentIdentifier={props?.parentIdentifier}
          isParallelNode={false}
          readonly={props.readonly}
          data={props}
          fireEvent={props.fireEvent}
          style={{ left: getPositionOfAddIcon(props) }}
          identifier={props.identifier}
          prevNodeIdentifier={props.prevNodeIdentifier as string}
          className={cx(css.addNodeIcon, css.left, css.stageAddIcon)}
        />
      )}
    </div>
  )
}

export default GroupNode
