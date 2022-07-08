/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo } from 'lodash-es'
import { FieldArray, FormikProps } from 'formik'
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd'
import {
  Button,
  ButtonVariation,
  Color,
  Container,
  FormInput,
  Icon,
  Layout,
  MultiTypeInputType,
  Text
} from '@harness/uicore'

import { useStrings } from 'framework/strings'
import type { CommandUnitType, CustomScriptCommandUnit } from '../CommandScriptsTypes'
import css from './TailFilesEdit.module.scss'

interface TailFilesEditProps {
  formik: FormikProps<CommandUnitType>
  allowableTypes: MultiTypeInputType[]
  readonly?: boolean
}

export function TailFilesEdit(props: TailFilesEditProps): React.ReactElement {
  const { formik, readonly = false } = props
  const { getString } = useStrings()

  return (
    <DragDropContext
      onDragEnd={(result: DropResult) => {
        if (!result.destination) {
          return
        }
        const res = Array.from(defaultTo((formik.values as CustomScriptCommandUnit).spec.tailFiles, []))
        const [removed] = res.splice(result.source.index, 1)
        res.splice(result.destination.index, 0, removed)
        formik.setFieldValue('spec.tailFiles', res)
      }}
    >
      <Droppable droppableId="droppable">
        {provided => (
          <Layout.Vertical {...provided.droppableProps} ref={provided.innerRef}>
            <Container className={css.filesPatternsHeaderContainer}>
              <Text className={css.filesPatternsHeader}>{getString('cd.steps.commands.filesAndPatterns')}</Text>
              <Text className={css.filesPatternsHeaderOptional}>{getString('optionalField')}</Text>
            </Container>
            <div className={css.panel}>
              <div className={css.header}>
                <div></div>
                <Text color={Color.GREY_600}>{getString('cd.steps.commands.fileToTail')}</Text>
                <Text color={Color.GREY_600}>{getString('cd.steps.commands.patternToSearch')}</Text>
                <div></div>
              </div>
              <FieldArray
                name="spec.tailFiles"
                render={({ push, remove }) => {
                  return (
                    <>
                      {(formik.values as CustomScriptCommandUnit).spec.tailFiles?.map((_tailFile, index) => {
                        return (
                          <Draggable key={index} draggableId={`${index}`} index={index}>
                            {providedDrag => (
                              <Layout.Horizontal
                                key={index}
                                ref={providedDrag.innerRef}
                                {...providedDrag.draggableProps}
                                {...providedDrag.dragHandleProps}
                                className={css.header}
                              >
                                <Container flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
                                  <Icon name="drag-handle-vertical" margin={{ right: 'small' }} />
                                  {`${index + 1}.`}
                                </Container>
                                <FormInput.Text
                                  disabled={readonly}
                                  name={`spec.tailFiles[${index}].tailFile`}
                                  placeholder={getString('cd.steps.commands.fileToTailPlaceholder')}
                                />
                                <FormInput.Text
                                  disabled={readonly}
                                  name={`spec.tailFiles[${index}].tailPattern`}
                                  placeholder={getString('cd.steps.commands.patternToSearchPlaceholder')}
                                />
                                <Button
                                  minimal
                                  disabled={readonly}
                                  icon="main-trash"
                                  data-testid={`remove-tailFile-${index}`}
                                  onClick={() => remove(index)}
                                />
                              </Layout.Horizontal>
                            )}
                          </Draggable>
                        )
                      })}

                      <Button
                        icon="plus"
                        variation={ButtonVariation.LINK}
                        data-testid="add-taileFile"
                        disabled={readonly}
                        onClick={() => push({ tailFile: '', tailPattern: '' })}
                        className={css.addButton}
                      >
                        {getString('add')}
                      </Button>
                    </>
                  )
                }}
              />
            </div>
          </Layout.Vertical>
        )}
      </Droppable>
    </DragDropContext>
  )
}
