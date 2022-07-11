/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import type { FieldArrayRenderProps } from 'formik'
import { Dialog } from '@blueprintjs/core'
import type { MultiTypeInputType } from '@harness/uicore'
import { HideModal, useModalHook } from '@harness/use-modal'

import { useStrings } from 'framework/strings'
import { CommandType, CommandUnitType, CustomScriptCommandUnit, CopyCommandUnit } from '../CommandScriptsTypes'
import { CommandEdit } from './CommandEdit'

interface OpenCommandModalArgs {
  arrayHelpers: FieldArrayRenderProps
  isUpdate?: boolean
  initialModalValues?: CommandUnitType
  updateIndex?: number
}
interface UseImportResourceReturnType {
  openCommandModal: (args: OpenCommandModalArgs) => void
  hideCommandModal: HideModal
}

interface UseImportResourceProps {
  allowableTypes: MultiTypeInputType[]
  readonly?: boolean
}

export default function useCommands(props: UseImportResourceProps): UseImportResourceReturnType {
  const { allowableTypes, readonly = false } = props
  const [initialValues, setInitialValues] = useState<CommandUnitType>({
    identifier: '',
    name: '',
    type: 'Copy',
    spec: { sourceType: 'Artifact', destinationPath: '' }
  })
  const [isEdit, setIsEdit] = useState<boolean>(false)
  const [editIndex, setEditIndex] = useState<number>(0)
  const [allArrayHelpers, setAllArrayHelpers] = useState<FieldArrayRenderProps>()

  const { getString } = useStrings()

  const getCommandDataByType = (commandData: CommandUnitType): CommandUnitType => {
    if (commandData.type === CommandType.Copy) {
      const copyCommandData = commandData as CopyCommandUnit
      return {
        ...copyCommandData,
        spec: {
          sourceType: copyCommandData.spec.sourceType,
          destinationPath: copyCommandData.spec.destinationPath
        }
      }
    }
    const scriptCommandData = commandData as CustomScriptCommandUnit
    return {
      ...scriptCommandData,
      spec: {
        workingDirectory: scriptCommandData.spec.workingDirectory,
        shell: scriptCommandData.spec.shell,
        source: {
          type: scriptCommandData.spec.source.type,
          spec: {
            type: scriptCommandData.spec.source.spec.type,
            script: scriptCommandData.spec.source.spec.script
          }
        },
        tailFiles: scriptCommandData.spec.tailFiles
      }
    }
  }

  const onAddEditCommand = React.useCallback(
    (commandData: CommandUnitType): void => {
      const transformedCommandData = getCommandDataByType(commandData)
      if (isEdit) {
        allArrayHelpers?.replace(editIndex, { commandUnit: transformedCommandData })
      } else {
        allArrayHelpers?.push({ commandUnit: { ...transformedCommandData } })
      }
      hideCommandModal()
    },
    [isEdit, editIndex, allArrayHelpers]
  )

  const openCommandModal = (args: OpenCommandModalArgs): void => {
    const { isUpdate = false, initialModalValues, updateIndex, arrayHelpers } = args
    setAllArrayHelpers(arrayHelpers)
    setIsEdit(isUpdate)
    if (updateIndex) {
      setEditIndex(updateIndex)
    }
    if (initialModalValues) {
      setInitialValues(initialModalValues)
    } else {
      setInitialValues({
        identifier: '',
        name: '',
        type: 'Copy',
        spec: { sourceType: 'Artifact', destinationPath: '' }
      })
    }
    showCommandModal()
  }

  const [showCommandModal, hideCommandModal] = useModalHook(() => {
    return (
      <Dialog
        style={{
          width: '668px',
          background: 'var(--form-bg)',
          paddingTop: '60px',
          minHeight: '775px'
        }}
        enforceFocus={false}
        isOpen={true}
        className={'padded-dialog'}
        onClose={hideCommandModal}
        title={isEdit ? getString('cd.steps.commands.editCommand') : getString('cd.steps.commands.addCommand')}
      >
        <CommandEdit
          isEdit={isEdit}
          initialValues={initialValues as CommandUnitType}
          allowableTypes={allowableTypes}
          onAddEditCommand={onAddEditCommand}
          onCancelClick={hideCommandModal}
          readonly={readonly}
        />
      </Dialog>
    )
  }, [initialValues, allowableTypes, onAddEditCommand, isEdit, readonly])

  return {
    openCommandModal,
    hideCommandModal
  }
}
