/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Icon, Text, Button, ButtonVariation, IconName } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import cx from 'classnames'
import { defaultTo } from 'lodash-es'
import { useStrings } from 'framework/strings'
import { DiagramDrag, DiagramType, Event } from '@pipeline/components/Diagram'
import { ExecutionPipelineNodeType } from '@pipeline/components/ExecutionStageDiagram/ExecutionPipelineModel'
import { getStatusProps } from '@pipeline/components/ExecutionStageDiagram/ExecutionStageDiagramUtils'
import { ExecutionStatus, ExecutionStatusEnum } from '@pipeline/utils/statusHelpers'
import { PipelineGraphType, NodeType, BaseReactComponentProps } from '../../types'
import SVGMarker from '../SVGMarker'
import { getPositionOfAddIcon } from '../utils'
import AddLinkNode from '../DefaultNode/AddLinkNode/AddLinkNode'
import cssDefault from '../DefaultNode/DefaultNode.module.scss'
import css from './DiamondNode.module.scss'

interface PipelineStepNodeProps extends BaseReactComponentProps {
  status: string
}

export function DiamondNodeWidget(props: any): JSX.Element {
  const { getString } = useStrings()
  const isSelected = props?.isSelected || props?.selectedNodeId === props?.id
  const [showAddLink, setShowAddLink] = React.useState(false)
  const stepStatus = defaultTo(props?.status, props?.data?.step?.status as ExecutionStatus)
  const { secondaryIconProps, secondaryIcon, secondaryIconStyle } = getStatusProps(
    stepStatus as ExecutionStatus,
    ExecutionPipelineNodeType.DIAMOND
  )
  const isTemplateNode = props?.data?.isTemplateNode
  const showMarkers = defaultTo(props?.showMarkers, true)
  return (
    <div
      className={cx(cssDefault.defaultNode, 'diamond-node')}
      onClick={event => {
        event.stopPropagation()
        if (props?.onClick) {
          props.onClick()
          return
        }
        props?.fireEvent?.({
          type: Event.ClickNode,
          target: event.target,
          data: {
            ...props,
            entityType: DiagramType.DiamondNode,
            identifier: props?.identifier,
            id: props.id
          }
        })
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div
        className={cx(
          cssDefault.defaultCard,
          css.diamond,

          {
            [cssDefault.selected]: isSelected,
            [cssDefault.failed]: stepStatus === ExecutionStatusEnum.Failed,
            [cssDefault.runningNode]: stepStatus === ExecutionStatusEnum.Running,
            [cssDefault.skipped]: stepStatus === ExecutionStatusEnum.Skipped,
            [cssDefault.notStarted]: stepStatus === ExecutionStatusEnum.NotStarted
          },
          { [css.top]: props?.data?.graphType === PipelineGraphType.STAGE_GRAPH }
        )}
        draggable={true}
        onDragStart={event => {
          event.stopPropagation()
          event.dataTransfer.setData(DiagramDrag.NodeDrag, JSON.stringify(props))
          // NOTE: onDragOver we cannot access dataTransfer data
          // in order to detect if we can drop, we are setting and using "keys" and then
          // checking in onDragOver if this type (AllowDropOnLink/AllowDropOnNode) exist we allow drop
          event.dataTransfer.setData(DiagramDrag.AllowDropOnLink, '1')
          event.dataTransfer.dropEffect = 'move'
        }}
        onDragEnd={event => {
          event.preventDefault()
          event.stopPropagation()
        }}
      >
        <div
          id={props.id}
          data-nodeid={props.id}
          className={css.horizontalBar}
          style={{ height: props.data?.graphType === PipelineGraphType.STAGE_GRAPH ? 40 : 64 }}
          onMouseEnter={event => {
            event.stopPropagation()

            props?.fireEvent?.({
              type: Event.MouseEnterNode,
              target: event.target,
              data: { ...props }
            })
          }}
          onMouseLeave={event => {
            event.stopPropagation()
            props?.fireEvent?.({
              type: Event.MouseLeaveNode,
              target: event.target,
              data: { ...props }
            })
          }}
        >
          {showMarkers && (
            <>
              <div
                className={cx(cssDefault.markerStart, cssDefault.diamondStageLeft, {
                  [cssDefault.diamondStep]: props.data?.graphType === PipelineGraphType.STEP_GRAPH
                })}
              >
                <SVGMarker />
              </div>
              <div
                className={cx(cssDefault.markerEnd, cssDefault.diamondStageRight, {
                  [cssDefault.diamondStep]: props.data?.graphType === PipelineGraphType.STEP_GRAPH
                })}
              >
                <SVGMarker />
              </div>
            </>
          )}
        </div>
        <div className="execution-running-animation" />
        {props?.data?.isInComplete && (
          <Icon className={css.inComplete} size={12} name={'warning-sign'} color="orange500" />
        )}
        {props.icon && (
          <Icon
            size={28}
            className={css.primaryIcon}
            inverse={isSelected}
            name={props.icon}
            color={isSelected ? Color.WHITE : Color.PRIMARY_7}
          />
        )}
        {props?.tertiaryIcon && (
          <Icon
            className={css.tertiaryIcon}
            size={15}
            name={props?.tertiaryIcon}
            style={props?.tertiaryIconStyle}
            {...props.tertiaryIconProps}
          />
        )}
        {secondaryIcon && (
          <Icon
            name={secondaryIcon as IconName}
            style={secondaryIconStyle}
            size={13}
            className={css.secondaryIcon}
            {...secondaryIconProps}
          />
        )}
        {props.skipCondition && (
          <div className={css.conditional}>
            <Text
              tooltip={`Skip condition:\n${props.skipCondition}`}
              tooltipProps={{
                isDark: true
              }}
            >
              <Icon size={26} name={'conditional-skip-new'} color="white" />
            </Text>
          </div>
        )}
        {props.data?.conditionalExecutionEnabled && (
          <div className={css.conditional}>
            <Text
              tooltip={getString('pipeline.conditionalExecution.title')}
              tooltipProps={{
                isDark: true
              }}
            >
              <Icon size={26} name={'conditional-skip-new'} color="white" />
            </Text>
          </div>
        )}
        {props.data?.loopingStrategyEnabled && (
          <div className={css.loopingStrategy}>
            <Text
              tooltip={getString('pipeline.loopingStrategy.title')}
              tooltipProps={{
                isDark: true
              }}
            >
              <Icon
                size={18}
                name={'looping'}
                inverse={isSelected}
                color={isSelected ? Color.WHITE : Color.PRIMARY_7}
              />
            </Text>
          </div>
        )}
        {isTemplateNode && (
          <Icon
            size={8}
            className={css.template}
            name={'template-library'}
            color={isSelected ? Color.WHITE : Color.PRIMARY_7}
          />
        )}
        {!props.readonly && (
          <Button
            className={cx(cssDefault.closeNode, css.diamondClose)}
            minimal
            variation={ButtonVariation.PRIMARY}
            icon="cross"
            iconProps={{ size: 10 }}
            onMouseDown={e => {
              e.stopPropagation()
              props?.fireEvent?.({
                type: Event.RemoveNode,
                identifier: props?.identifier,
                node: props
              })
            }}
            withoutCurrentColor={true}
          />
        )}
      </div>
      {props.name && (
        <div className={cssDefault.nodeNameText}>
          <Text
            width={125}
            font={{ size: 'normal', align: 'center' }}
            color={props.defaultSelected ? Color.GREY_900 : Color.GREY_600}
            padding={'small'}
            lineClamp={2}
          >
            {props.name}
          </Text>
        </div>
      )}
      {!props.isParallelNode && !props.readonly && (
        <AddLinkNode<PipelineStepNodeProps>
          nextNode={props?.nextNode}
          parentIdentifier={props?.parentIdentifier}
          isParallelNode={props.isParallelNode}
          readonly={props.readonly}
          data={props}
          fireEvent={props?.fireEvent}
          identifier={props?.identifier}
          prevNodeIdentifier={props.prevNodeIdentifier as string}
          style={{ left: getPositionOfAddIcon(props) }}
          className={cx(
            cssDefault.addNodeIcon,
            {
              [cssDefault.show]: showAddLink
            },
            {
              [cssDefault.stepAddIcon]: props.data?.graphType === PipelineGraphType.STEP_GRAPH
            },
            {
              [cssDefault.stageAddIcon]: props.data?.graphType === PipelineGraphType.STAGE_GRAPH
            }
          )}
          setShowAddLink={setShowAddLink}
        />
      )}
      {(props?.nextNode?.nodeType === NodeType.StepGroupNode || (!props?.nextNode && props?.parentIdentifier)) &&
        !props.isParallelNode &&
        !props.readonly && (
          <AddLinkNode<PipelineStepNodeProps>
            nextNode={props?.nextNode}
            parentIdentifier={props?.parentIdentifier}
            isParallelNode={props.isParallelNode}
            readonly={props.readonly}
            data={props}
            fireEvent={props?.fireEvent}
            identifier={props?.identifier}
            prevNodeIdentifier={props.prevNodeIdentifier as string}
            style={{ right: getPositionOfAddIcon(props, true) }}
            isRightAddIcon={true}
            className={cx(
              cssDefault.addNodeIcon,
              {
                [cssDefault.stepAddIcon]: props.data?.graphType === PipelineGraphType.STEP_GRAPH
              },
              {
                [cssDefault.stageAddIcon]: props.data?.graphType === PipelineGraphType.STAGE_GRAPH
              }
            )}
            setShowAddLink={setShowAddLink}
          />
        )}
    </div>
  )
}
