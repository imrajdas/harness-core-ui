/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext, useMemo } from 'react'

import FileStorePopover from '@filestore/common/FileStorePopover/FileStorePopover'
import useUploadFile from '@filestore/common/useUpload/useUpload'
import useNewNodeModal from '@filestore/common/useNewNodeModal/useNewNodeModal'
import { useStrings } from 'framework/strings'
import { FileStoreNodeTypes } from '@filestore/interfaces/FileStore'
import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'
import type { FileStorePopoverItem } from '@filestore/common/FileStorePopover/FileStorePopover'
import { FileStoreActionTypes } from '@filestore/utils/constants'

interface NewFileButtonProps {
  parentIdentifier: string
}

export const NewFileButton: React.FC<NewFileButtonProps> = (props: NewFileButtonProps): React.ReactElement => {
  const { parentIdentifier } = props
  const fileStoreContext = useContext(FileStoreContext)
  const { isCachedNode, currentNode } = fileStoreContext
  const { getString } = useStrings()

  const configNewNode = useMemo(() => {
    return {
      parentIdentifier,
      editMode: false,
      tempNode: isCachedNode(currentNode.identifier),
      fileStoreContext,
      currentNode: currentNode
    }
  }, [isCachedNode, currentNode, fileStoreContext, parentIdentifier])

  const newFileModal = useNewNodeModal({
    ...configNewNode,
    type: FileStoreNodeTypes.FILE
  })
  const newFolderModal = useNewNodeModal({
    ...configNewNode,
    type: FileStoreNodeTypes.FOLDER
  })

  const newUploadFile = useUploadFile({
    isBtn: false
  })

  const menuItems: FileStorePopoverItem[] = [
    {
      label: newFileModal.label,
      onClick: newFileModal.onClick,
      actionType: FileStoreActionTypes.CREATE_NODE
    },
    {
      label: newFolderModal.label,
      onClick: newFolderModal.onClick,
      actionType: FileStoreActionTypes.CREATE_NODE
    },
    {
      label: newUploadFile.label,
      onClick: newUploadFile.onClick,
      actionType: FileStoreActionTypes.UPLOAD_NODE
    }
  ]

  return <FileStorePopover items={menuItems} icon="plus" btnText={getString('common.new')} />
}
