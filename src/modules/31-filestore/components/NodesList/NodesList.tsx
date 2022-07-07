/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext, useEffect, useState } from 'react'
import type { Column, Renderer, CellProps } from 'react-table'
import { Position } from '@blueprintjs/core'
import ReactTimeago from 'react-timeago'

import { Layout, TableV2, Text, Container } from '@harness/uicore'
import { Color } from '@harness/design-system'
import type { FileStoreNodeDTO } from '@filestore/components/FileStoreContext/FileStoreContext'
import NodeMenuButton from '@filestore/common/NodeMenu/NodeMenuButton'
import { useStrings } from 'framework/strings'
import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'
import FolderIcon from '@filestore/images/closed-folder.svg'
import FileIcon from '@filestore/images/file-.svg'

import { FileStoreNodeTypes, FileUsage } from '@filestore/interfaces/FileStore'
import type { StoreNodeType } from '@filestore/interfaces/FileStore'
import { getFileUsageNameByType, getMenuOptionItems } from '@filestore/utils/FileStoreUtils'
import useDelete from '@filestore/common/useDelete/useDelete'
import useNewNodeModal from '@filestore/common/useNewNodeModal/useNewNodeModal'

interface FileStoreNodeRenderDTO extends FileStoreNodeDTO {
  fileUsage: FileUsage
}

const RenderColumnName: Renderer<CellProps<FileStoreNodeRenderDTO>> = ({ row }) => {
  const { original } = row
  const getNodeIcon = (type: StoreNodeType): string => {
    switch (type) {
      case FileStoreNodeTypes.FOLDER:
        return FolderIcon
      case FileStoreNodeTypes.FILE:
        return FileIcon
      default:
        return FolderIcon
    }
  }
  return (
    <Layout.Horizontal style={{ alignItems: 'center' }}>
      <img src={getNodeIcon(original.type)} style={{ marginRight: 10 }} />
      <Text color={Color.GREY_800} font={{ size: 'small' }} lineClamp={1}>
        {original.name}
      </Text>
    </Layout.Horizontal>
  )
}

const RenderColumnType: Renderer<CellProps<FileStoreNodeRenderDTO>> = ({ row }) => {
  const { original } = row
  return (
    <Text color={Color.GREY_800} font={{ size: 'small' }} lineClamp={1}>
      {original.type === FileStoreNodeTypes.FOLDER ? 'Folder' : 'File'}
    </Text>
  )
}

const RenderColumnFileUsage: Renderer<CellProps<FileStoreNodeRenderDTO>> = ({ row }) => {
  const { original } = row
  return (
    <Text color={Color.GREY_800} font={{ size: 'small' }} lineClamp={1}>
      {original.type === FileStoreNodeTypes.FILE && original?.fileUsage
        ? getFileUsageNameByType(original.fileUsage)
        : ''}
    </Text>
  )
}

const RenderColumnLastModified: Renderer<CellProps<FileStoreNodeRenderDTO>> = ({ row }) => {
  const { original } = row
  return (
    <Text color={Color.GREY_800} font={{ size: 'small' }} lineClamp={1}>
      {original.lastModifiedAt && <ReactTimeago date={original.lastModifiedAt} />}
    </Text>
  )
}

const RenderColumnLastModifiedBy: Renderer<CellProps<FileStoreNodeRenderDTO>> = ({ row }) => {
  const { original } = row
  return (
    <Text color={Color.GREY_800} font={{ size: 'small' }} lineClamp={1}>
      {original.lastModifiedBy?.name}
    </Text>
  )
}

const RenderColumnMenu: Renderer<CellProps<FileStoreNodeDTO>> = ({ row }) => {
  const context = useContext(FileStoreContext)
  const { original } = row
  const NOT_CURRENT_NODE = true
  const editMenuItem = useNewNodeModal({
    parentIdentifier: original.parentIdentifier || '',
    currentNode: {
      name: original.name,
      identifier: original.identifier,
      type: original.type,
      fileUsage: original.fileUsage,
      parentIdentifier: original.parentIdentifier,
      tags: original.tags,
      description: original.description
    },
    fileStoreContext: context,
    type: original.type as FileStoreNodeTypes,
    editMode: true,
    notCurrentNode: NOT_CURRENT_NODE
  })
  const deleteMenuItem = useDelete(original.identifier, original.name, original.type, NOT_CURRENT_NODE)
  const optionsMenuItems = getMenuOptionItems([editMenuItem, deleteMenuItem])

  return <NodeMenuButton items={optionsMenuItems} position={Position.RIGHT_TOP} />
}

const NodesList: React.FC = () => {
  const { getString } = useStrings()
  const [childNodes, setChildNodes] = useState<FileStoreNodeDTO[]>([])
  const { currentNode, getNode, setCurrentNode, deletedNode } = useContext(FileStoreContext)

  useEffect(() => {
    if (currentNode?.children) {
      setChildNodes(currentNode.children)
    } else {
      setChildNodes([])
    }
  }, [currentNode])

  React.useEffect(() => {
    const existDeletedItem = childNodes.find((node: FileStoreNodeDTO) => node.identifier === deletedNode)
    if (existDeletedItem) {
      setChildNodes(childNodes.filter((node: FileStoreNodeDTO) => node.identifier !== deletedNode))
    }
  }, [deletedNode])

  const columns: Column<FileStoreNodeDTO>[] = [
    {
      Header: getString('filestore.view.fileName'),
      accessor: row => row?.name,
      id: 'fileName',
      width: '30%',
      Cell: RenderColumnName
    },
    {
      Header: getString('common.file'),
      accessor: row => row.type,
      id: 'fileType',
      width: '15%',
      Cell: RenderColumnType
    },
    {
      Header: getString('filestore.view.fileUsage'),
      accessor: row => row,
      id: 'fileUsage',
      width: '15%',
      Cell: RenderColumnFileUsage
    },
    {
      Header: getString('common.lastModifiedTime'),
      accessor: row => row,
      id: 'lastModifiedTime',
      width: '15%',
      Cell: RenderColumnLastModified
    },
    {
      Header: getString('filestore.view.lastModifiedBy'),
      accessor: row => row,
      id: 'lastModifiedBy',
      width: '15%',
      Cell: RenderColumnLastModifiedBy
    },
    {
      accessor: row => row,
      id: 'menu',
      width: '10%',
      Cell: RenderColumnMenu
    }
  ]
  return (
    <Container padding="xlarge">
      {currentNode?.children?.length ? (
        <TableV2
          columns={columns}
          data={childNodes}
          name="FileStoreView"
          onRowClick={node => {
            if (node.type === FileStoreNodeTypes.FILE) {
              setCurrentNode(node)
            } else {
              getNode(node)
            }
          }}
        />
      ) : null}
    </Container>
  )
}

export default NodesList
