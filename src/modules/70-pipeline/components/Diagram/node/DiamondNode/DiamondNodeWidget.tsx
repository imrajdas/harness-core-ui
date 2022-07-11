/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Position } from '@blueprintjs/core'
import type { DiagramEngine } from '@projectstorm/react-diagrams-core'
import { Icon, Text, Button, ButtonVariation } from '@wings-software/uicore'
import cx from 'classnames'
import { Color } from '@harness/design-system'
import { DefaultPortLabel } from '@pipeline/components/Diagram/port/DefaultPortLabelWidget'
import type { DefaultPortModel } from '@pipeline/components/Diagram/port/DefaultPortModel'
import { useStrings } from 'framework/strings'
import type { DiamondNodeModel } from './DiamondNodeModel'
import { DiagramDrag, Event } from '../../Constants'
import type { DefaultNodeModel } from '../DefaultNodeModel'
import css from './DiamondNode.module.scss'
import cssDefault from '../DefaultNode.module.scss'

export interface DiamondNodeProps {
  node: DiamondNodeModel
  engine?: DiagramEngine
}

const generatePort = (port: DefaultPortModel, props: DiamondNodeProps): JSX.Element => {
  return props.engine ? (
    <DefaultPortLabel
      engine={props.engine}
      port={port}
      key={port.getID()}
      className={cx({ [css.diamondPortIn]: port.getOptions().in }, { [css.diamondPortOut]: !port.getOptions().in })}
    />
  ) : (
    <></>
  )
}
const onClick = (e: React.MouseEvent<Element, MouseEvent>, node: DiamondNodeModel): void => {
  e.stopPropagation()
  node.fireEvent({}, Event.RemoveNode)
}
const onClickNode = (e: React.MouseEvent<Element, MouseEvent>, node: DefaultNodeModel): void => {
  e.stopPropagation()
  node.fireEvent({}, Event.ClickNode)
}

const onMouseEnterNode = (e: MouseEvent, node: DefaultNodeModel): void => {
  e.stopPropagation()
  node.fireEvent({ target: e.target }, Event.MouseEnterNode)
}

const onMouseLeaveNode = (e: MouseEvent, node: DefaultNodeModel): void => {
  e.stopPropagation()
  node.fireEvent({ target: e.target }, Event.MouseLeaveNode)
}

export function DiamondNodeWidget(props: DiamondNodeProps): JSX.Element {
  const options = props.node.getOptions()
  const [dragging, setDragging] = React.useState(false)
  const { getString } = useStrings()
  const isSelected = options.defaultSelected ?? props.node.isSelected()

  return (
    <div
      className={cssDefault.defaultNode}
      onClick={e => {
        if (!options.disableClick) {
          onClickNode(e, props.node)
        }
      }}
      onMouseEnter={event => onMouseEnterNode(event as unknown as MouseEvent, props.node)}
      onMouseLeave={event => onMouseLeaveNode(event as unknown as MouseEvent, props.node)}
    >
      <div
        draggable={options.draggable}
        onDragStart={event => {
          setDragging(true)
          event.dataTransfer.setData(DiagramDrag.NodeDrag, JSON.stringify(props.node.serialize()))
          // NOTE: onDragOver we cannot access dataTransfer data
          // in order to detect if we can drop, we are setting and using "keys" and then
          // checking in onDragOver if this type (AllowDropOnLink/AllowDropOnNode) exist we allow drop
          if (options.allowDropOnLink) event.dataTransfer.setData(DiagramDrag.AllowDropOnLink, '1')
          if (options.allowDropOnNode) event.dataTransfer.setData(DiagramDrag.AllowDropOnNode, '1')
          event.dataTransfer.dropEffect = 'move'
        }}
        onDragEnd={event => {
          event.preventDefault()
          setDragging(false)
        }}
      >
        <div
          className={cx(
            cssDefault.defaultCard,
            css.diamond,
            { [cssDefault.selected]: options.defaultSelected ?? props.node.isSelected() },
            options.nodeClassName
          )}
          style={{
            width: options.width,
            height: options.height,
            opacity: dragging ? 0.4 : 1,
            ...options.customNodeStyle
          }}
        >
          <div className="execution-running-animation" />
          {options.icon && <Icon size={28} inverse={isSelected} name={options.icon} style={options.iconStyle} />}
          {options.isInComplete && (
            <Icon className={css.inComplete} size={12} name={'warning-sign'} color="orange500" />
          )}
          {props.node.getInPorts().map(port => generatePort(port, props))}
          {props.node.getOutPorts().map(port => generatePort(port, props))}
          {options?.tertiaryIcon && (
            <Icon
              className={css.tertiaryIcon}
              size={15}
              name={options?.tertiaryIcon}
              style={options?.tertiaryIconStyle}
              {...options.tertiaryIconProps}
            />
          )}
          {options.secondaryIcon && (
            <Icon
              className={css.secondaryIcon}
              size={8}
              name={options.secondaryIcon}
              style={options.secondaryIconStyle}
              {...options.secondaryIconProps}
            />
          )}
          {options.skipCondition && (
            <div className={css.conditional}>
              <Text
                tooltip={`Skip condition:\n${options.skipCondition}`}
                tooltipProps={{
                  isDark: true
                }}
              >
                <Icon size={26} name={'conditional-skip-new'} color="white" />
              </Text>
            </div>
          )}
          {options.conditionalExecutionEnabled && (
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
          {options?.loopingStrategyEnabled && (
            <div className={css.loopingStrategy}>
              <Text
                tooltip={getString('pipeline.loopingStrategy.title')}
                tooltipProps={{
                  isDark: true
                }}
              >
                <Icon
                  size={16}
                  name={'looping'}
                  inverse={isSelected}
                  color={isSelected ? Color.WHITE : Color.PRIMARY_7}
                />
              </Text>
            </div>
          )}
          {options.isTemplate && (
            <Icon
              size={8}
              className={css.template}
              name={'template-library'}
              color={isSelected ? Color.WHITE : Color.PRIMARY_7}
            />
          )}
          {options.canDelete && (
            <Button
              className={cx(cssDefault.closeNode, css.diamondClose)}
              minimal
              variation={ButtonVariation.PRIMARY}
              icon="cross"
              iconProps={{ size: 10 }}
              onMouseDown={e => onClick(e, props.node)}
              withoutCurrentColor={true}
            />
          )}
        </div>
        <Text
          font={{ size: 'normal', align: 'center' }}
          style={{ cursor: 'pointer', lineHeight: '1.6', overflowWrap: 'normal', wordBreak: 'keep-all' }}
          margin={{ top: 'xsmall' }}
          padding="xsmall"
          width={125}
          lineClamp={2}
          tooltipProps={{ position: Position.RIGHT, portalClassName: cssDefault.hoverName }}
        >
          {options.name}
        </Text>
      </div>
    </div>
  )
}
