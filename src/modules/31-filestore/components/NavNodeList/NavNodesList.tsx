/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { PropsWithChildren, ReactElement, useContext, useEffect, useMemo, useState } from 'react'

import { Container, Layout, Text } from '@harness/uicore'
import { Color } from '@harness/design-system'
import cx from 'classnames'
import { Position, Spinner } from '@blueprintjs/core'
import RootFolderIcon from '@filestore/images/root-folder.svg'
import ClosedFolderIcon from '@filestore/images/closed-folder.svg'
import OpenFolderIcon from '@filestore/images/open-folder.svg'
import FileIcon from '@filestore/images/file-.svg'
import type { FileStoreNodeDTO } from '@filestore/components/FileStoreContext/FileStoreContext'
import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'
import { FileStoreNodeTypes, StoreNodeType } from '@filestore/interfaces/FileStore'
import { FILE_STORE_ROOT } from '@filestore/utils/constants'
import NodeMenuButton from '@filestore/common/NodeMenu/NodeMenuButton'
import useNewNodeModal from '@filestore/common/useNewNodeModal/useNewNodeModal'
import useUploadFile, { UPLOAD_EVENTS } from '@filestore/common/useUpload/useUpload'
import { getMenuOptionItems, FileStorePopoverOptionItem } from '@filestore/utils/FileStoreUtils'
import { useUnsavedConfirmation } from '@filestore/common/useUnsavedConfirmation/useUnsavedConfirmation'

import useDelete from '@filestore/common/useDelete/useDelete'
import css from './NavNodeList.module.scss'

export interface FolderNodesListProps {
  fileStore: FileStoreNodeDTO[]
}
export interface RootNodesListProps {
  rootStore: FileStoreNodeDTO[]
}

export const FolderNodesList = ({ fileStore }: FolderNodesListProps): React.ReactElement => (
  <>
    {fileStore?.length &&
      fileStore.map((node: FileStoreNodeDTO) => {
        return <FolderNode key={node.identifier} {...node} />
      })}
  </>
)

export const FolderNode = React.memo((props: PropsWithChildren<FileStoreNodeDTO>): ReactElement => {
  const { identifier, type } = props
  const context = useContext(FileStoreContext)
  const {
    currentNode,
    setCurrentNode,
    getNode,
    loading,
    tempNodes,
    isCachedNode,
    deletedNode,
    fileStore,
    setFileStore,
    unsavedNodes
  } = context

  const [childNodes, setChildNodes] = useState<FileStoreNodeDTO[]>([])
  const [isOpenNode, setIsOpenNode] = useState<boolean>(false)
  const [nodeItem, setNodeItem] = useState<FileStoreNodeDTO>(props)
  const uploadFile = useUploadFile({
    isBtn: false,
    eventMethod: UPLOAD_EVENTS.UPLOAD
  })

  useEffect(() => {
    if (identifier === FILE_STORE_ROOT) {
      setIsOpenNode(true)
    }
  }, [identifier])

  useEffect(() => {
    const cachedNode = isCachedNode(props.identifier)
    if (cachedNode && props?.type === FileStoreNodeTypes.FILE) {
      setNodeItem({
        ...props,
        ...cachedNode
      })
    }
  }, [tempNodes, isCachedNode, props])

  useEffect(() => {
    if (!!tempNodes.length && tempNodes[0].parentIdentifier === nodeItem.identifier && Array.isArray(fileStore)) {
      const existChildNode =
        childNodes.find(item => item.identifier === tempNodes[0].identifier) ||
        fileStore.find(item => item.identifier === tempNodes[0].identifier)
      if (!existChildNode) {
        if (identifier === FILE_STORE_ROOT) {
          setFileStore([tempNodes[0], ...fileStore])
        } else {
          setChildNodes([tempNodes[0], ...childNodes])
        }
        setCurrentNode(tempNodes[0])
      }
    }
  }, [tempNodes])

  React.useEffect(() => {
    const existDeletedItem = childNodes.find(item => item.identifier === deletedNode)

    if (existDeletedItem && identifier !== FILE_STORE_ROOT) {
      setChildNodes(childNodes.filter(node => node.identifier !== deletedNode))
    }
    const existInFS = !!fileStore && fileStore.find((item: FileStoreNodeDTO) => item.identifier === deletedNode)

    if (identifier === FILE_STORE_ROOT && existInFS && !!fileStore) {
      setFileStore(fileStore.filter((item: FileStoreNodeDTO) => item.identifier !== deletedNode))
    }
  }, [deletedNode])

  const isActiveNode = React.useMemo(() => currentNode.identifier === identifier, [currentNode, identifier])
  const isRootNode = React.useMemo(() => identifier === FILE_STORE_ROOT, [identifier])

  useEffect(() => {
    if (currentNode.identifier === nodeItem.identifier) {
      setNodeItem(prevState => {
        return {
          ...prevState,
          ...currentNode
        }
      })
    }
    if (currentNode?.children && isActiveNode && !isRootNode) {
      setNodeItem(currentNode)
      setChildNodes(
        currentNode.children.map(node => ({
          ...node,
          parentName: props.name
        }))
      )
    }
  }, [currentNode, isActiveNode, isRootNode, setNodeItem])

  const handleGetNodes = (e: React.MouseEvent): void => {
    if (!tempNodes[0] && !unsavedNodes[0]) {
      e.stopPropagation()
    }
    if (!loading) {
      setIsOpenNode(true)
      if (!isActiveNode) {
        setCurrentNode(nodeItem)
      }
      if (props.type === FileStoreNodeTypes.FILE) {
        return
      }
      if (!isRootNode) {
        getNode({
          ...nodeItem,
          children: undefined
        })
      } else {
        getNode({
          identifier: FILE_STORE_ROOT,
          name: FILE_STORE_ROOT,
          type: FileStoreNodeTypes.FOLDER
        })
      }
    }
  }

  const { handleUnsavedConfirmation } = useUnsavedConfirmation({
    callback: handleGetNodes,
    isNavigationBar: true
  })

  const getNodeIcon = (nodeType: StoreNodeType): string => {
    switch (nodeType) {
      case FileStoreNodeTypes.FILE:
        return FileIcon
      case FileStoreNodeTypes.FOLDER:
        if (isRootNode) {
          return RootFolderIcon
        }
        return isOpenNode ? OpenFolderIcon : ClosedFolderIcon
      default:
        return RootFolderIcon
    }
  }

  const configNewNode = useMemo(() => {
    return {
      parentIdentifier: identifier,
      editMode: false,
      tempNode: context.isCachedNode(identifier),
      currentNode: context.currentNode,
      fileStoreContext: context,
      type: context.currentNode.type as FileStoreNodeTypes
    }
  }, [identifier, context])

  const newFileMenuItem = useNewNodeModal({
    ...configNewNode,
    type: FileStoreNodeTypes.FILE
  })
  const newFolderMenuItem = useNewNodeModal({
    ...configNewNode
  })
  const editMenuItem = useNewNodeModal({
    ...configNewNode,
    editMode: true
  })
  const deleteMenuItem = useDelete(identifier, props.name, type)

  const ACTIONS: FileStorePopoverOptionItem[] =
    identifier !== FILE_STORE_ROOT
      ? [newFileMenuItem, newFolderMenuItem, uploadFile, '-', editMenuItem, deleteMenuItem]
      : [newFileMenuItem, newFolderMenuItem, uploadFile]

  const optionsMenuItems = getMenuOptionItems(ACTIONS, nodeItem.type as FileStoreNodeTypes)

  const NodesList = React.useMemo(() => {
    return (
      <Layout.Vertical style={{ marginLeft: '3%' }}>
        <FolderNodesList fileStore={childNodes} />
      </Layout.Vertical>
    )
  }, [childNodes])

  return (
    <Layout.Vertical style={{ marginLeft: !isRootNode ? '3%' : 'none', cursor: 'pointer' }} key={identifier}>
      <div
        className={cx(css.mainNode, isActiveNode && css.activeNode)}
        style={{ position: 'relative' }}
        onClick={handleUnsavedConfirmation}
      >
        <div style={{ display: 'flex' }}>
          <img src={getNodeIcon(type)} alt={type} />
          <Text
            font={{ size: 'normal' }}
            color={!isActiveNode ? Color.PRIMARY_9 : Color.GREY_0}
            style={{
              maxWidth: 150,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {nodeItem.name}
          </Text>
        </div>
        {isActiveNode &&
          (!loading ? (
            <NodeMenuButton items={optionsMenuItems} position={Position.RIGHT_TOP} />
          ) : (
            <Container margin={{ right: 'small' }}>
              <Spinner size={20} />
            </Container>
          ))}
      </div>
      {!!childNodes.length && NodesList}
    </Layout.Vertical>
  )
})

FolderNode.displayName = 'FolderNode'

export const RootNodesList = ({ rootStore }: RootNodesListProps): React.ReactElement => (
  <Layout.Vertical padding={{ left: 'small' }} margin={{ top: 'xlarge' }}>
    <Container>
      <FolderNode type={FileStoreNodeTypes.FOLDER} identifier={FILE_STORE_ROOT} name={FILE_STORE_ROOT} />
    </Container>
    <FolderNodesList fileStore={rootStore} />
  </Layout.Vertical>
)
