/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import * as React from 'react'
import cx from 'classnames'
import { Icon, Layout, Text, Button, ButtonVariation } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { defaultTo, get } from 'lodash-es'
import { Event, DiagramDrag, DiagramType } from '@pipeline/components/Diagram'
import { STATIC_SERVICE_GROUP_NAME } from '@pipeline/utils/executionUtils'
import { useStrings } from 'framework/strings'
import StepGroupGraph from '../StepGroupGraph/StepGroupGraph'
import { NodeType } from '../../types'
import SVGMarker from '../SVGMarker'
import { getPositionOfAddIcon } from '../utils'
import { useNodeDimensionContext } from '../NodeDimensionStore'
import css from './StepGroupNode.module.scss'
import defaultCss from '../DefaultNode/DefaultNode.module.scss'

export function StepGroupNode(props: any): JSX.Element {
  const allowAdd = defaultTo(props.allowAdd, false)
  const { getString } = useStrings()
  const [showAdd, setVisibilityOfAdd] = React.useState(false)
  const [showAddLink, setShowAddLink] = React.useState(false)
  const [isNodeCollapsed, setNodeCollapsed] = React.useState(false)
  const CreateNode: React.FC<any> | undefined = props?.getNode?.(NodeType.CreateNode)?.component
  const DefaultNode: React.FC<any> | undefined = props?.getDefaultNode()?.component
  const stepGroupData = defaultTo(props?.data?.stepGroup, props?.data?.step?.data?.stepGroup) || props?.data?.step
  const stepsData = stepGroupData?.steps
  const hasStepGroupChild = stepsData?.some((step: { step: { type: string } }) => {
    const stepType = get(step, 'step.type')
    return stepType === 'STEP_GROUP'
  })

  const isExecutionView = Boolean(props?.data?.status)

  const { updateDimensions } = useNodeDimensionContext()
  const isNestedStepGroup = Boolean(get(props, 'data.step.data.isNestedGroup'))

  React.useEffect(() => {
    props?.updateGraphLinks?.()
    updateDimensions?.({ [(props?.data?.id || props?.id) as string]: { height: 100, width: 115 } })
  }, [isNodeCollapsed])

  React.useEffect(() => {
    // collapse stepGroup in execution view till data loads
    if (stepsData?.length === 0 && isExecutionView) {
      setNodeCollapsed(true)
    }
  }, [stepsData])

  return (
    <>
      {isNodeCollapsed && DefaultNode ? (
        <DefaultNode
          onClick={() => {
            setNodeCollapsed(false)
          }}
          {...props}
          icon="step-group"
        />
      ) : (
        <div style={{ position: 'relative' }}>
          <div
            onMouseOver={e => {
              e.stopPropagation()
              allowAdd && setVisibilityOfAdd(true)
            }}
            onMouseLeave={e => {
              e.stopPropagation()
              allowAdd && setVisibilityOfAdd(false)
            }}
            onDragLeave={() => allowAdd && setVisibilityOfAdd(false)}
            style={stepGroupData?.containerCss ? stepGroupData?.containerCss : undefined}
            className={cx(
              css.stepGroup,
              { [css.firstnode]: !props?.isParallelNode },
              { [css.marginBottom]: props?.isParallelNode },
              { [css.nestedGroup]: isNestedStepGroup },
              { [css.stepGroupParent]: hasStepGroupChild },
              { [css.stepGroupNormal]: !isNestedStepGroup && !hasStepGroupChild }
            )}
          >
            <div
              className={cx(
                defaultCss.markerStart,
                defaultCss.stepMarker,
                defaultCss.stepGroupMarkerLeft,
                css.markerStart
              )}
            >
              <SVGMarker />
            </div>
            <div
              className={cx(
                defaultCss.markerEnd,
                defaultCss.stepMarker,
                defaultCss.stepGroupMarkerRight,
                css.markerStart
              )}
            >
              <SVGMarker />
            </div>
            <div id={props?.id} className={css.horizontalBar}></div>
            {props.data?.skipCondition && (
              <div className={css.conditional}>
                <Text
                  tooltip={`Skip condition:\n${props.data?.skipCondition}`}
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
            <div className={css.stepGroupHeader}>
              <Layout.Horizontal
                spacing="xsmall"
                onMouseOver={e => {
                  e.stopPropagation()
                }}
                onMouseOut={e => {
                  e.stopPropagation()
                }}
              >
                <Icon
                  className={css.collapseIcon}
                  name="minus"
                  onClick={e => {
                    e.stopPropagation()
                    setNodeCollapsed(true)
                  }}
                />
                <Text
                  data-nodeid={props.id}
                  className={css.cursor}
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
                    setVisibilityOfAdd(false)
                    props?.fireEvent?.({
                      type: Event.MouseLeaveNode,
                      target: event.target,
                      data: { ...props }
                    })
                  }}
                  lineClamp={1}
                  onClick={event => {
                    event.stopPropagation()
                    setVisibilityOfAdd(false)
                    props?.fireEvent?.({
                      type: Event.StepGroupClicked,
                      target: event.target,
                      data: { ...props }
                    })
                  }}
                >
                  {props.name}
                </Text>
              </Layout.Horizontal>
            </div>
            <div className={css.stepGroupBody}>
              <StepGroupGraph
                {...props}
                data={stepsData}
                isNodeCollapsed={isNodeCollapsed}
                parentIdentifier={props?.identifier}
                hideLinks={props?.identifier === STATIC_SERVICE_GROUP_NAME}
              />
            </div>
            {!props.readonly && props?.identifier !== STATIC_SERVICE_GROUP_NAME && (
              <Button
                className={cx(css.closeNode, { [css.readonly]: props.readonly })}
                minimal
                icon="cross"
                variation={ButtonVariation.PRIMARY}
                iconProps={{ size: 10 }}
                onMouseDown={e => {
                  e.stopPropagation()
                  props?.fireEvent?.({
                    type: Event.RemoveNode,
                    data: {
                      identifier: props?.identifier,
                      node: props
                    }
                  })
                }}
                withoutCurrentColor={true}
              />
            )}
          </div>
          {!props.isParallelNode && !props.readonly && (
            <div
              style={{ left: getPositionOfAddIcon(props) }}
              data-linkid={props?.identifier}
              onMouseOver={event => event.stopPropagation()}
              onClick={event => {
                event.stopPropagation()
                props?.fireEvent?.({
                  type: Event.AddLinkClicked,
                  target: event.target,
                  data: {
                    entityType: DiagramType.Link,
                    node: props,
                    prevNodeIdentifier: props?.prevNodeIdentifier,
                    parentIdentifier: props?.parentIdentifier,
                    identifier: props?.identifier
                  }
                })
              }}
              onDragOver={event => {
                event.stopPropagation()
                event.preventDefault()
                setShowAddLink(true)
              }}
              onDragLeave={event => {
                event.stopPropagation()
                event.preventDefault()
                setShowAddLink(false)
              }}
              onDrop={event => {
                event.stopPropagation()
                setShowAddLink(false)
                props?.fireEvent?.({
                  type: Event.DropLinkEvent,
                  target: event.target,
                  data: {
                    linkBeforeStepGroup: false,
                    entityType: DiagramType.Link,
                    node: JSON.parse(event.dataTransfer.getData(DiagramDrag.NodeDrag)),
                    destination: props
                  }
                })
              }}
              className={cx(defaultCss.addNodeIcon, defaultCss.stepAddIcon, defaultCss.stepGroupAddIcon, {
                [defaultCss.show]: showAddLink
              })}
            >
              <Icon name="plus" color={Color.WHITE} />
            </div>
          )}
          {allowAdd && !props.readonly && CreateNode && (
            <CreateNode
              className={cx(
                defaultCss.addNode,
                { [defaultCss.visible]: showAdd },
                { [defaultCss.marginBottom]: props?.isParallelNode }
              )}
              onMouseOver={() => allowAdd && setVisibilityOfAdd(true)}
              onMouseLeave={() => allowAdd && setVisibilityOfAdd(false)}
              onDrop={(event: any) => {
                props?.fireEvent?.({
                  type: Event.DropNodeEvent,
                  data: {
                    entityType: DiagramType.Default,
                    node: JSON.parse(event.dataTransfer.getData(DiagramDrag.NodeDrag)),
                    destination: props
                  }
                })
              }}
              onClick={(event: any): void => {
                event.stopPropagation()
                props?.fireEvent?.({
                  type: Event.AddParallelNode,
                  target: event.target,
                  data: {
                    identifier: props?.identifier,
                    parentIdentifier: props?.parentIdentifier,
                    entityType: DiagramType.StepGroupNode,
                    node: props
                  }
                })
              }}
              name={''}
              hidden={!showAdd}
            />
          )}
        </div>
      )}
    </>
  )
}
