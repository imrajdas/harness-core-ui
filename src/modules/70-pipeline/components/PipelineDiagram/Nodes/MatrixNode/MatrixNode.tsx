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
import { defaultTo, get, isEmpty } from 'lodash-es'
import { Event, DiagramDrag, DiagramType } from '@pipeline/components/Diagram'
import { STATIC_SERVICE_GROUP_NAME } from '@pipeline/utils/executionUtils'
import { useStrings } from 'framework/strings'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { useValidationErrors } from '@pipeline/components/PipelineStudio/PiplineHooks/useValidationErrors'
import { useQueryParams } from '@common/hooks'
import type { ExecutionPageQueryParams } from '@pipeline/utils/types'
import { isExecutionNotStarted } from '@pipeline/utils/statusHelpers'
import { useExecutionContext } from '@pipeline/context/ExecutionContext'
import { StageType } from '@pipeline/utils/stageHelpers'
import { BaseReactComponentProps, NodeType, PipelineGraphState, PipelineGraphType } from '../../types'
import { getPositionOfAddIcon } from '../utils'
import { getPipelineGraphData } from '../../PipelineGraph/PipelineGraphUtils'
import { NodeStatusIndicator } from '../NodeStatusIndicator'
import css from './MatrixNode.module.scss'
import defaultCss from '../DefaultNode/DefaultNode.module.scss'

interface LayoutStyles {
  height: string
  width: string
  marginLeft?: string
}
const COLLAPSED_MATRIX_NODE_LENGTH = 8
const MAX_ALLOWED_MATRIX_COLLAPSED_NODES = 4
const DEFAULT_MATRIX_PARALLELISM = 1

const getCalculatedStyles = (data: PipelineGraphState[], parallelism: number, showAllNodes?: boolean): LayoutStyles => {
  const nodeWidth = data?.[0]?.nodeType === StageType.APPROVAL ? 160 : 190 // 100-PipelineStage , 130(Diamond) + 20(text) + 50(padding)
  const nodeHeight = data?.[0]?.nodeType === StageType.APPROVAL ? 130 : 100
  parallelism = !parallelism ? 0 : (parallelism === 1 ? data.length : parallelism) || DEFAULT_MATRIX_PARALLELISM
  if (showAllNodes) {
    const maxChildLength = defaultTo(data?.length, 0)
    const finalHeight =
      parallelism === 0
        ? maxChildLength * nodeHeight
        : (Math.floor(maxChildLength / parallelism) + Math.ceil((maxChildLength % parallelism) / parallelism)) *
          nodeHeight
    const finalWidth = nodeWidth * (parallelism === 0 ? 1 : Math.min(parallelism, (data || []).length))
    return { height: `${finalHeight + 80}px`, width: `${finalWidth}px` } // 80 is link gap that we dont need for last stepgroup node
  } else {
    const updatedParallelism = Math.min(parallelism, MAX_ALLOWED_MATRIX_COLLAPSED_NODES)
    const maxChildLength = Math.min(data.length, COLLAPSED_MATRIX_NODE_LENGTH)

    const finalHeight =
      parallelism === 0
        ? maxChildLength * nodeHeight
        : (Math.floor(maxChildLength / updatedParallelism) +
            Math.ceil((maxChildLength % updatedParallelism) / updatedParallelism)) *
          nodeHeight
    const finalWidth = nodeWidth * (parallelism === 0 ? 1 : Math.min(updatedParallelism, (data || []).length))
    return { height: `${finalHeight + 80}px`, width: `${finalWidth}px` } // 80 is
  }
}

export function MatrixNode(props: any): JSX.Element {
  const allowAdd = defaultTo(props.allowAdd, false)
  const { getString } = useStrings()
  const [showAdd, setVisibilityOfAdd] = React.useState(false)
  const [showAddLink, setShowAddLink] = React.useState(false)
  const [treeRectangle, setTreeRectangle] = React.useState<DOMRect | void>()
  const [state, setState] = React.useState<PipelineGraphState[]>([])
  const [isNodeCollapsed, setNodeCollapsed] = React.useState(false)
  const [showAllNodes, setShowAllNodes] = React.useState(false)
  const [layoutStyles, setLayoutStyles] = React.useState<LayoutStyles>({ height: '100px', width: '70px' })
  const CreateNode: React.FC<any> | undefined = props?.getNode?.(NodeType.CreateNode)?.component
  const DefaultNode: React.FC<any> | undefined = props?.getDefaultNode()?.component
  const queryParams = useQueryParams<ExecutionPageQueryParams>()
  const defaultNode = props.getDefaultNode()?.component
  const { selectedStageExecutionId } = useExecutionContext()
  const isNestedStepGroup = Boolean(get(props, 'data.step.data.isNestedGroup'))
  const updateTreeRect = (): void => {
    const treeContainer = document.getElementById('tree-container')
    const rectBoundary = treeContainer?.getBoundingClientRect()
    setTreeRectangle(rectBoundary)
  }
  const maxParallelism = props?.data?.maxParallelism
  const { errorMap } = useValidationErrors()
  const {
    state: { templateTypes },
    getStagePathFromPipeline
  } = usePipelineContext()

  const stagePath = getStagePathFromPipeline(props?.identifier || '', 'pipeline.stages')

  React.useEffect(() => {
    props?.updateGraphLinks?.()
  }, [isNodeCollapsed])

  React.useEffect(() => {
    props?.data?.status && setNodeCollapsed(isExecutionNotStarted(props?.data?.status))
  }, [props?.data?.status])

  React.useLayoutEffect(() => {
    if (state?.length) {
      props?.updateGraphLinks?.()
    }
  }, [layoutStyles])

  React.useEffect(() => {
    updateTreeRect()
  }, [])

  React.useLayoutEffect(() => {
    if (props?.data?.children?.length) {
      setState(
        getPipelineGraphData({
          data: props.data?.children,
          templateTypes: templateTypes,
          serviceDependencies: undefined,
          errorMap: errorMap,
          graphDataType: PipelineGraphType.STAGE_GRAPH,
          parentPath: `${stagePath}.stage.spec.execution.steps.stepGroup.steps` //index after step missing - getStepPathFromPipeline??
        })
      )
    } else {
      setState([])
      setNodeCollapsed(true)
    }
  }, [treeRectangle, props.data, templateTypes])

  React.useLayoutEffect(() => {
    if (state?.length) {
      setLayoutStyles(getCalculatedStyles(state, maxParallelism, showAllNodes))
    } else {
      setLayoutStyles({ height: '100px', width: '70px' })
    }
  }, [state, props?.isNodeCollapsed, showAllNodes, isNodeCollapsed])

  const isSelectedNode = React.useMemo(() => {
    return state.some(node => node?.id && node.id === queryParams?.stageExecId)
  }, [queryParams?.stageExecId, isNodeCollapsed])

  return (
    <>
      <div style={{ position: 'relative' }}>
        <Layout.Horizontal
          className={cx(css.matrixLabel, {
            [css.marginTop]: props?.isParallelNode
          })}
        >
          <Icon size={16} name="looping" style={{ marginRight: '5px' }} color={Color.WHITE} />
          <Text color={Color.WHITE} font="small" style={{ paddingRight: '5px' }}>
            {props?.data?.nodeType}
          </Text>
        </Layout.Horizontal>
        <div
          onMouseOver={e => {
            e.stopPropagation()
            !props.readonly && allowAdd && setVisibilityOfAdd(true)
          }}
          onMouseLeave={e => {
            e.stopPropagation()
            !props.readonly && allowAdd && setVisibilityOfAdd(false)
          }}
          onDragLeave={() => !props.readonly && allowAdd && setVisibilityOfAdd(false)}
          className={cx(css.stepGroup, {
            [css.firstnode]: !props?.isParallelNode,
            [css.marginBottom]: props?.isParallelNode,
            [css.nestedGroup]: isNestedStepGroup
          })}
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
              <NodeStatusIndicator nodeState={state} />
            </Layout.Horizontal>
          </div>
          <div
            className={cx(css.collapsedMatrixWrapper, {
              [css.isNodeCollapsed]: isNodeCollapsed,
              [css.approvalStage]: isNodeCollapsed || state?.[0]?.type === StageType.APPROVAL
            })}
          >
            {isNodeCollapsed && DefaultNode ? (
              <DefaultNode
                onClick={() => {
                  setNodeCollapsed(false)
                }}
                {...props}
                isSelected={isSelectedNode}
                icon="looping"
                showMarkers={false}
                name={`[+] ${state.length} Stages`} //matrix collapsed node
              />
            ) : (
              <>
                <div
                  className={cx(
                    css.stepGroupBody
                    // { [css.multiParallelism]: maxParallelism }
                  )}
                  style={layoutStyles}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: '80px', rowGap: '20px' }}>
                    {state.map((node: any, index: number) => {
                      const NodeComponent: React.FC<BaseReactComponentProps> = defaultTo(
                        props.getNode?.(node?.type)?.component,
                        defaultNode
                      ) as React.FC<BaseReactComponentProps>

                      return (
                        <React.Fragment key={node.data?.identifier}>
                          {index < (showAllNodes ? state?.length : COLLAPSED_MATRIX_NODE_LENGTH) ? (
                            <NodeComponent
                              {...node}
                              parentIdentifier={node.parentIdentifier}
                              key={node.data?.identifier}
                              getNode={props.getNode}
                              fireEvent={props.fireEvent}
                              getDefaultNode={props.getDxefaultNode}
                              className={cx(css.graphNode, node.className)}
                              isSelected={node.selectedNode === node.data?.id}
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
                                isEmpty(queryParams?.stageExecId)
                                  ? selectedStageExecutionId
                                  : queryParams?.stageExecId || props?.selectedNodeId
                              }
                              showMarkers={false}
                              name={node?.matrixNodeName ? `${node?.matrixNodeName}${node?.name}` : node?.name}
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
                {state.length > COLLAPSED_MATRIX_NODE_LENGTH && (
                  <Layout.Horizontal className={css.matrixFooter}>
                    <Layout.Horizontal className={css.matrixBorderWrapper}>
                      <Layout.Horizontal className={css.showNodes}>
                        <>
                          <Text padding={0}>{`${
                            !showAllNodes ? Math.min(state.length, COLLAPSED_MATRIX_NODE_LENGTH) : state.length
                          }/ ${state.length}`}</Text>
                          <Text className={css.showNodeText} padding={0} onClick={() => setShowAllNodes(!showAllNodes)}>
                            {`${!showAllNodes ? getString('showAll') : getString('common.hideAll')}`}
                          </Text>
                        </>
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
                    onMouseOver={() => !props.readonly && allowAdd && setVisibilityOfAdd(true)}
                    onMouseLeave={() => !props.readonly && allowAdd && setVisibilityOfAdd(false)}
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
                          entityType: DiagramType.MatrixNode,
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
