/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import cx from 'classnames'
import { Popover, ButtonVariation, IconName } from '@harness/uicore'
import { Menu, Position } from '@blueprintjs/core'
import type { FileStoreActionTypes } from '@filestore/utils/constants'
import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'
import {
  firstLetterToUpperCase,
  getIconByActionType,
  getPermissionsByActionType
} from '@filestore/utils/FileStoreUtils'

import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { useUnsavedConfirmation } from '@filestore/common/useUnsavedConfirmation/useUnsavedConfirmation'
import css from './FileStorePopover.module.scss'

export interface FileStorePopoverItem {
  onClick: () => void
  label: string
  disabled?: boolean
  actionType: FileStoreActionTypes
  identifier?: string
}

export interface FileStoreActionPopoverProps {
  items: FileStorePopoverItem[]
  icon?: IconName
  className?: string
  portalClassName?: string
  btnText: string
}

const FileStoreActionPopover = (props: FileStoreActionPopoverProps): React.ReactElement => {
  const { items = [], icon, className, portalClassName, btnText = '' } = props
  const [menuOpen, setMenuOpen] = useState(false)
  const { tempNodes, unsavedNodes } = React.useContext(FileStoreContext)
  const { handleUnsavedConfirmation } = useUnsavedConfirmation({
    callback: () => setMenuOpen(true)
  })
  return (
    <Popover
      isOpen={menuOpen}
      position={Position.BOTTOM}
      className={cx(css.main, className)}
      portalClassName={cx(css.popover, portalClassName)}
      minimal={true}
      usePortal={false}
      onInteraction={nextOpenState => {
        setMenuOpen(nextOpenState)
      }}
    >
      <RbacButton
        variation={ButtonVariation.PRIMARY}
        text={firstLetterToUpperCase(btnText)}
        permission={{
          permission: PermissionIdentifier.EDIT_FILE,
          resource: {
            resourceType: ResourceType.FILE
          }
        }}
        onClick={e => {
          e.stopPropagation()

          if (tempNodes.length > 0 || unsavedNodes.length > 0) {
            handleUnsavedConfirmation()
            return
          } else {
            setMenuOpen(!menuOpen)
          }
        }}
        rightIcon="chevron-down"
        icon={icon}
        id="newFileBtn"
        data-testid="newFileButton"
      />
      <Menu>
        {items.length &&
          items.map((item: FileStorePopoverItem) => {
            const { label, onClick, actionType, identifier } = item
            return (
              <RbacMenuItem
                key={identifier}
                icon={getIconByActionType(actionType)}
                text={label}
                permission={getPermissionsByActionType(actionType, identifier)}
                onClick={e => {
                  e.stopPropagation()
                  onClick()
                  setMenuOpen(false)
                }}
              />
            )
          })}
      </Menu>
    </Popover>
  )
}

export default FileStoreActionPopover
