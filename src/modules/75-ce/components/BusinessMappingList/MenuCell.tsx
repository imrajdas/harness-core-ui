/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Button, Text, Popover, useConfirmationDialog } from '@wings-software/uicore'
import { Classes, Menu, Position, Intent } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'

interface MenuCellProps {
  handleEdit: () => void
  id: string
  handleDelete: (id: string, name: string) => void
  name: string
}

const MenuCell: (props: MenuCellProps) => JSX.Element = ({ handleEdit, handleDelete, id, name }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { getString } = useStrings()

  const getConfirmationDialogContent = (): JSX.Element => {
    return (
      <div>
        <Text>
          {getString('ce.businessMapping.confirmDialogBody', {
            name: name
          })}
        </Text>
      </div>
    )
  }

  const { openDialog } = useConfirmationDialog({
    contentText: getConfirmationDialogContent(),
    titleText: getString('ce.businessMapping.confirmDialogHeading'),
    confirmButtonText: getString('delete'),
    cancelButtonText: getString('cancel'),
    intent: Intent.DANGER,
    buttonIntent: Intent.DANGER,
    onCloseDialog: async (isConfirmed: boolean) => {
      /* istanbul ignore else */ if (isConfirmed && id) {
        handleDelete(id, name)
      }
    }
  })

  return (
    <Popover
      isOpen={isOpen}
      onInteraction={nextOpenState => {
        setIsOpen(nextOpenState)
      }}
      className={Classes.DARK}
      position={Position.RIGHT_TOP}
    >
      <Button
        minimal
        icon="Options"
        onClick={e => {
          e.stopPropagation()
          setIsOpen(true)
        }}
      />
      <Menu>
        <RbacMenuItem
          text={getString('edit')}
          onClick={(e: React.MouseEvent<HTMLElement, MouseEvent>) => {
            e.stopPropagation()
            setIsOpen(false)
            handleEdit()
          }}
          permission={{
            permission: PermissionIdentifier.EDIT_CCM_COST_CATEGORY,
            resource: {
              resourceType: ResourceType.CCM_COST_CATEGORY
            }
          }}
        />
        <RbacMenuItem
          text={getString('delete')}
          onClick={(e: React.MouseEvent<HTMLElement, MouseEvent>) => {
            e.stopPropagation()
            setIsOpen(false)
            openDialog()
          }}
          permission={{
            permission: PermissionIdentifier.DELETE_CCM_COST_CATEGORY,
            resource: {
              resourceType: ResourceType.CCM_COST_CATEGORY
            }
          }}
        />
      </Menu>
    </Popover>
  )
}

export default MenuCell
