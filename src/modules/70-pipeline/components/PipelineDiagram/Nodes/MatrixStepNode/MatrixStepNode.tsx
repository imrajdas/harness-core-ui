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
import { defaultTo, get, lowerCase } from 'lodash-es'
import { Event, DiagramDrag, DiagramType } from '@pipeline/components/Diagram'
import { STATIC_SERVICE_GROUP_NAME } from '@pipeline/utils/executionUtils'
import { useStrings } from 'framework/strings'
import { useDeepCompareEffect } from '@common/hooks'
import { BaseReactComponentProps, NodeType, PipelineGraphState } from '../../types'
import { getPositionOfAddIcon } from '../utils'
import { Dimensions, useNodeDimensionContext } from '../NodeDimensionStore'
import { NodeStatusIndicator } from '../NodeStatusIndicator'
import css from './MatrixStepNode.module.scss'
import defaultCss from '../DefaultNode/DefaultNode.module.scss'

interface LayoutStyles {
  height: number
  width: number
  marginLeft?: string
}

const COLLAPSED_MATRIX_NODE_LENGTH = 8
const MAX_ALLOWED_MATRIX__COLLAPSED_NODES = 4
const DEFAULT_MATRIX_PARALLELISM = 1

const getHeight = (nodeHeight: number, maxChildLength: number, parallelism: number, showAllNodes: boolean): number => {
  if (parallelism === 0) {
    // parallel case + 20 (nodeGap except last child)
    return maxChildLength * nodeHeight + 20 * (maxChildLength - 1)
  } else if (!showAllNodes && maxChildLength < parallelism) {
    // collapsed mode, single row
    return nodeHeight + 20
  } else {
    return (
      (Math.floor(maxChildLength / parallelism) + Math.ceil((maxChildLength % parallelism) / parallelism)) *
        nodeHeight +
      20
    )
  }
}
export const getCalculatedStepNodeStyles = (
  data: PipelineGraphState[],
  parallelism: number,
  showAllNodes?: boolean,
  childrenDimensions?: Dimensions
): LayoutStyles => {
  let nodeWidth = 145
  let nodeHeight = 124
  parallelism = !parallelism ? 0 : (parallelism === 1 ? data.length : parallelism) || DEFAULT_MATRIX_PARALLELISM

  const maxChildrenDimension = {
    height: 0,
    width: 0
  }
  data.forEach(nodeData => {
    const dimen = childrenDimensions?.[defaultTo((nodeData as any)?.step?.data?.id, (nodeData as any)?.step?.uuid)]
    maxChildrenDimension.height = Math.max(maxChildrenDimension.height, dimen?.height || 0)
    maxChildrenDimension.width = Math.max(maxChildrenDimension.width, dimen?.width || 0)
  })
  nodeHeight = maxChildrenDimension?.height > 0 ? maxChildrenDimension?.height + 100 : nodeHeight
  nodeWidth = maxChildrenDimension?.width > 0 ? maxChildrenDimension?.width + 180 : nodeWidth

  if (showAllNodes) {
    const maxChildLength = defaultTo(data.length, 0)
    const finalHeight = getHeight(nodeHeight, maxChildLength, parallelism, true)
    const finalWidth = nodeWidth * (parallelism === 0 ? 1 : Math.min(parallelism, (data || []).length))
    return { height: finalHeight, width: finalWidth }
  } else {
    const updatedParallelism = Math.min(parallelism, MAX_ALLOWED_MATRIX__COLLAPSED_NODES)
    const maxChildLength = Math.min(data.length, COLLAPSED_MATRIX_NODE_LENGTH)
    const finalHeight = getHeight(nodeHeight, maxChildLength, updatedParallelism, false)
    const finalWidth = nodeWidth * (parallelism === 0 ? 1 : Math.min(updatedParallelism, (data || []).length))
    return { height: finalHeight, width: finalWidth }
  }
}

export function MatrixStepNode(props: any): JSX.Element {
  const allowAdd = defaultTo(props.allowAdd, false)
  const { getString } = useStrings()
  const [showAdd, setVisibilityOfAdd] = React.useState(false)
  const [showAddLink, setShowAddLink] = React.useState(false)
  const [isNodeCollapsed, setNodeCollapsed] = React.useState(false)
  const [showAllNodes, setShowAllNodes] = React.useState(false)
  const [layoutStyles, setLayoutStyles] = React.useState<LayoutStyles>({ height: 100, width: 70 })
  const CreateNode: React.FC<any> | undefined = props?.getNode?.(NodeType.CreateNode)?.component
  const DefaultNode: React.FC<any> | undefined = props?.getDefaultNode()?.component
  const stepGroupData = defaultTo(props?.data?.stepGroup?.steps, props?.data?.step?.data?.stepGroup?.steps)
  const maxParallelism = defaultTo(props?.data?.maxParallelism, props?.data?.step?.data?.maxParallelism)
  const nodeType = defaultTo(props?.data?.nodeType, props?.data?.step?.data?.nodeType)

  const isNestedStepGroup = Boolean(get(props, 'data.step.data.isNestedGroup'))
  const hasChildrenToBeCollapsed = stepGroupData.length > COLLAPSED_MATRIX_NODE_LENGTH

  const { updateDimensions, childrenDimensions } = useNodeDimensionContext()
  React.useEffect(() => {
    props?.updateGraphLinks?.()
  }, [isNodeCollapsed])

  React.useLayoutEffect(() => {
    props?.updateGraphLinks?.()
    // collapsed default matrix node dimensions
    isNodeCollapsed
      ? updateDimensions?.({ [(props?.data?.id || props?.id) as string]: { height: 140, width: 115 } })
      : updateDimensions?.({ [(props?.data?.id || props?.id) as string]: layoutStyles })
  }, [layoutStyles])

  React.useLayoutEffect(() => {
    if (stepGroupData?.length) {
      setLayoutStyles(getCalculatedStepNodeStyles(stepGroupData, maxParallelism, showAllNodes, childrenDimensions))
    } else {
      setNodeCollapsed(true)
    }
  }, [stepGroupData, isNodeCollapsed, props?.isNodeCollapsed, showAllNodes])

  useDeepCompareEffect(() => {
    if (stepGroupData?.length) {
      setLayoutStyles(getCalculatedStepNodeStyles(stepGroupData, maxParallelism, showAllNodes, childrenDimensions))
    }
  }, [childrenDimensions])

  return (
    <>
      <div style={{ position: 'relative' }}>
        <Layout.Horizontal
          className={cx(css.matrixLabel, {
            [css.stepGroupMatrixLabel]: isNestedStepGroup,
            [css.marginTop]: props?.isParallelNode
          })}
        >
          <Icon size={16} name="looping" style={{ marginRight: '5px' }} color={Color.WHITE} />
          <Text color={Color.WHITE} font="small" style={{ paddingRight: '5px' }}>
            {nodeType}
          </Text>
        </Layout.Horizontal>
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
            { [(css.marginBottom, css.marginTop)]: props?.isParallelNode },
            { [css.nestedGroup]: isNestedStepGroup }
            //   { [css.stepGroupParent]: hasStepGroupChild },
            //   { [css.stepGroupNormal]: !isNestedStepGroup && !hasStepGroupChild }
          )}
        >
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
            <Layout.Horizontal flex={{ justifyContent: 'space-between' }}>
              <Layout.Horizontal
                spacing="small"
                style={{ width: '60%' }}
                onMouseOver={e => {
                  e.stopPropagation()
                }}
                onMouseOut={e => {
                  e.stopPropagation()
                }}
              >
                <Icon
                  className={css.collapseIcon}
                  name={isNodeCollapsed ? 'plus' : 'minus'}
                  onClick={e => {
                    e.stopPropagation()
                    setNodeCollapsed(!isNodeCollapsed)
                  }}
                />
                <Text
                  data-nodeid={props.id}
                  font={{ weight: 'semi-bold' }}
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
              {/* Execution summary on collapse */}
              <NodeStatusIndicator nodeState={stepGroupData} />
            </Layout.Horizontal>
          </div>
          <div
            className={cx(css.collapsedMatrixWrapper, {
              [css.isNodeCollapsed]: isNodeCollapsed,
              [css.nestedStepGroup]: lowerCase(stepGroupData?.[0]?.step?.type) === lowerCase(NodeType.StepGroupNode)
            })}
          >
            {isNodeCollapsed && DefaultNode ? (
              <DefaultNode
                onClick={() => {
                  setNodeCollapsed(false)
                }}
                {...props}
                icon="looping"
                showMarkers={false}
                name={`[+] ${stepGroupData.length} Steps`} //matrix collapsed node
              />
            ) : (
              <>
                <div
                  className={cx(css.stepGroupBody, { [css.hasMoreChild]: hasChildrenToBeCollapsed })}
                  style={layoutStyles}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: '80px', rowGap: '20px' }}>
                    {stepGroupData?.map(({ step: node }: any, index: number) => {
                      const defaultNode = props?.getDefaultNode()?.component
                      const NodeComponent: React.FC<BaseReactComponentProps> = defaultTo(
                        props.getNode?.(node?.type)?.component,
                        defaultNode
                      ) as React.FC<BaseReactComponentProps>
                      const matrixNodeName = defaultTo(node?.matrixNodeName, node?.data?.matrixNodeName)
                      return (
                        <React.Fragment key={node.data?.identifier}>
                          {index < (showAllNodes ? stepGroupData?.length : COLLAPSED_MATRIX_NODE_LENGTH) ? (
                            <NodeComponent
                              {...node}
                              id={node?.uuid}
                              nodeType={node?.type}
                              parentIdentifier={node.parentIdentifier}
                              key={node.data?.identifier}
                              getNode={props.getNode}
                              fireEvent={props.fireEvent}
                              getDefaultNode={props.getDefaultNode}
                              className={cx(css.graphNode, node.className)}
                              isSelected={
                                node?.selectedNode && node.selectedNode === (node.data?.id || node.data?.uuid)
                              }
                              isParallelNode={node.isParallelNode}
                              allowAdd={
                                (!node.data?.children?.length && !node.isParallelNode) ||
                                (node.isParallelNode && node.isLastChild)
                              }
                              isFirstParallelNode={true}
                              prevNodeIdentifier={node.prevNodeIdentifier}
                              prevNode={node.prevNode}
                              nextNode={node.nextNode}
                              updateGraphLinks={node.updateGraphLinks}
                              readonly={props.readonly}
                              selectedNodeId={
                                props?.selectedNodeId
                                // || queryParams?.stageId
                              }
                              showMarkers={false}
                              name={matrixNodeName ? `${matrixNodeName}${node?.name}` : node?.name}
                            />
                          ) : null}
                        </React.Fragment>
                      )
                    })}
                  </div>
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
                {hasChildrenToBeCollapsed && (
                  <Layout.Horizontal className={css.matrixFooter}>
                    <Layout.Horizontal className={css.matrixBorderWrapper}>
                      <Layout.Horizontal margin={0} className={css.showNodes}>
                        {hasChildrenToBeCollapsed && (
                          <>
                            <Text padding={0}>{`${
                              !showAllNodes
                                ? Math.min(stepGroupData.length, COLLAPSED_MATRIX_NODE_LENGTH)
                                : stepGroupData.length
                            }/ ${stepGroupData.length}`}</Text>
                            <Text
                              className={css.showNodeText}
                              padding={0}
                              onClick={() => setShowAllNodes(!showAllNodes)}
                            >
                              {`${!showAllNodes ? getString('showAll') : getString('common.hideAll')}`}
                            </Text>
                          </>
                        )}
                      </Layout.Horizontal>

                      <Text font="normal" className={css.concurrencyLabel}>
                        {maxParallelism ? `${getString('pipeline.MatrixNode.maxConcurrency')} ${maxParallelism}` : ''}
                      </Text>
                    </Layout.Horizontal>
                  </Layout.Horizontal>
                )}

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
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
