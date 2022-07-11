/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { FieldArray, FieldArrayRenderProps, useFormikContext } from 'formik'
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd'
import { defaultTo } from 'lodash-es'
import cx from 'classnames'
import {
  Button,
  ButtonVariation,
  FontVariation,
  FormikTooltipContext,
  HarnessDocTooltip,
  Icon,
  Label,
  Layout,
  MultiTypeInputType,
  Text
} from '@harness/uicore'
import { useStrings } from 'framework/strings'
import type { CommandScriptsData } from './CommandScriptsTypes'
import useCommands from './Commands/useCommand'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './CommandScripts.module.scss'

interface CommandListProps {
  allowableTypes: MultiTypeInputType[]
  readonly?: boolean
}

export function CommandList(props: CommandListProps): React.ReactElement {
  const { allowableTypes, readonly } = props
  const { getString } = useStrings()
  const tooltipContext = React.useContext(FormikTooltipContext)
  const formik = useFormikContext<CommandScriptsData>()
  const dataTooltipId = tooltipContext?.formName ? `${tooltipContext?.formName}_commandUnits` : ''

  const { openCommandModal } = useCommands({
    allowableTypes,
    readonly
  })

  return (
    <div className={cx(stepCss.formGroup, stepCss.lg)}>
      <DragDropContext
        onDragEnd={(result: DropResult) => {
          if (!result.destination) {
            return
          }
          const res = Array.from(defaultTo(formik.values.spec.commandUnits, []))
          const [removed] = res.splice(result.source.index, 1)
          res.splice(result.destination.index, 0, removed)
          formik.setFieldValue('spec.commandUnits', res)
        }}
      >
        <Droppable droppableId="droppable">
          {provided => (
            <Layout.Vertical {...provided.droppableProps} ref={provided.innerRef}>
              <Label data-tooltip-id={dataTooltipId}>
                <Text font={{ variation: FontVariation.BODY2_SEMI }}>
                  {getString('cd.steps.commands.runTheCommands')}
                </Text>
                <HarnessDocTooltip useStandAlone={true} tooltipId={dataTooltipId} />
              </Label>
              <FieldArray
                name="spec.commandUnits"
                render={(arrayHelpers: FieldArrayRenderProps) => {
                  return (
                    <>
                      {formik.values.spec.commandUnits?.map((command, i) => (
                        <Draggable
                          key={command.commandUnit?.name}
                          draggableId={command.commandUnit?.name || ''}
                          index={i}
                        >
                          {providedDrag => (
                            <Layout.Horizontal
                              spacing="medium"
                              flex={{ alignItems: 'center' }}
                              ref={providedDrag.innerRef}
                              {...providedDrag.draggableProps}
                              {...providedDrag.dragHandleProps}
                            >
                              <Icon name="drag-handle-vertical" margin={{ right: 'small' }} />
                              {i + 1}
                              <Layout.Horizontal
                                flex={{ justifyContent: 'space-between' }}
                                spacing="small"
                                className={css.textBox}
                                style={{ flex: 1 }}
                              >
                                <Layout.Horizontal spacing="small">
                                  <Icon name="command-shell-script" />
                                  <Text
                                    lineClamp={1}
                                    style={{ width: 200 }}
                                    font={{ variation: FontVariation.SMALL_SEMI }}
                                  >
                                    {command.commandUnit?.name}
                                  </Text>
                                </Layout.Horizontal>
                                <Button
                                  icon="edit"
                                  disabled={readonly}
                                  variation={ButtonVariation.ICON}
                                  onClick={() => {
                                    openCommandModal({
                                      arrayHelpers,
                                      isUpdate: true,
                                      initialModalValues: command.commandUnit,
                                      updateIndex: i
                                    })
                                  }}
                                ></Button>
                              </Layout.Horizontal>
                              <Button
                                icon="main-trash"
                                disabled={readonly}
                                onClick={() => arrayHelpers.remove(i)}
                                variation={ButtonVariation.ICON}
                              ></Button>
                            </Layout.Horizontal>
                          )}
                        </Draggable>
                      ))}
                      <Button
                        icon="plus"
                        variation={ButtonVariation.LINK}
                        data-testid="add-command-unit"
                        disabled={readonly}
                        onClick={() => {
                          openCommandModal({
                            arrayHelpers,
                            isUpdate: false
                          })
                        }}
                        className={css.addButton}
                      >
                        {getString('cd.steps.commands.addCommand')}
                      </Button>
                    </>
                  )
                }}
              />
            </Layout.Vertical>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
