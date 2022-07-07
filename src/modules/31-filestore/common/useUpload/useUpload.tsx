/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useContext } from 'react'

import { v4 as uuid } from 'uuid'
import { useStrings } from 'framework/strings'

import type { FileStorePopoverItem } from '@filestore/common/FileStorePopover/FileStorePopover'
import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'
import { FileStoreNodeTypes } from '@filestore/interfaces/FileStore'
import { FileStoreActionTypes, FILE_STORE_ROOT, ExtensionType } from '@filestore/utils/constants'
import type { FileStoreNodeDTO } from '@filestore/components/FileStoreContext/FileStoreContext'
import { checkSupportedMime } from '@filestore/utils/FileStoreUtils'

interface UploadFile {
  isBtn?: boolean
  eventMethod?: string
}

export const UPLOAD_EVENTS = {
  UPLOAD: 'UPLOAD',
  REPLACE: 'REPLACE'
}

const useUploadFile = (config: UploadFile): FileStorePopoverItem => {
  const { isBtn = false, eventMethod = UPLOAD_EVENTS.UPLOAD } = config
  const { getString } = useStrings()
  const {
    setCurrentNode,
    currentNode,
    setFileStore,
    fileStore,
    updateCurrentNode,
    tempNodes,
    setTempNodes,
    updateTempNodes
  } = useContext(FileStoreContext)

  const handleChange = (event: Event): void => {
    if (currentNode.tempNode) {
      updateCurrentNode({
        ...currentNode,
        content: ''
      })
    }

    const target = event.target as HTMLInputElement

    if (!target.files?.length) {
      return
    } else {
      if (target.files[0]) {
        const { name } = target.files[0]
        const mimeType = name.split('.')[name.split('.').length - 1]
        const isSupportedMime = checkSupportedMime(mimeType as ExtensionType)

        const reader = new FileReader()
        if (!isSupportedMime) {
          reader.readAsDataURL(target.files[0])
        } else {
          reader.readAsText(target.files[0])
        }

        reader.onload = function () {
          const existNode = currentNode?.children && currentNode.children.find(node => node.identifier === name)

          if (typeof reader.result === 'string') {
            const uniqID = `${name}_${uuid().slice(0, 6)}`
            const node: FileStoreNodeDTO = {
              name,
              identifier: `${currentNode.identifier}_${uniqID.replace(/[^A-Z0-9]+/gi, '_')}`,
              type: FileStoreNodeTypes.FILE,
              mimeType,
              content: reader.result,
              parentIdentifier: currentNode.identifier,
              parentName: currentNode.name
            }
            if (eventMethod === UPLOAD_EVENTS.REPLACE) {
              updateCurrentNode({
                ...node,
                identifier: currentNode.identifier,
                content: reader.result,
                parentIdentifier: currentNode.parentIdentifier,
                parentName: currentNode.parentName
              })
              if (tempNodes?.length) {
                updateTempNodes({
                  ...node,
                  identifier: currentNode.identifier,
                  parentIdentifier: currentNode.parentIdentifier
                })
              }
              return
            }
            if (currentNode?.type === FileStoreNodeTypes.FILE) {
              setTempNodes([
                {
                  ...node,
                  identifier: `${currentNode.parentIdentifier}_${uniqID.replace(/[^A-Z0-9]+/gi, '_')}`,
                  parentIdentifier: currentNode.parentIdentifier,
                  parentName: currentNode.parentName
                }
              ])
              return
            }
            if (currentNode?.type === FileStoreNodeTypes.FOLDER && currentNode?.children && !existNode) {
              if (currentNode?.identifier !== FILE_STORE_ROOT) {
                updateCurrentNode({
                  ...currentNode,
                  children: [...currentNode.children, node]
                })
                setCurrentNode(node)
                setTempNodes([...tempNodes, node])
              } else if (fileStore) {
                setFileStore([node, ...fileStore])
                updateCurrentNode({
                  ...currentNode,
                  children: [node, ...currentNode.children]
                })
                setCurrentNode(node)
                setTempNodes([...tempNodes, node])
              }
            }
          }
        }
      }
    }
  }

  const handleClick = () => {
    const node =
      (document.getElementById('file-upload') as HTMLInputElement) ||
      (document.getElementById('file-upload-modal') as HTMLInputElement)
    node?.addEventListener('change', handleChange, {
      capture: false,
      once: true
    })

    const clickEvent = new MouseEvent('click', {
      bubbles: false,
      cancelable: true
    })
    node.value = ''
    node?.dispatchEvent(clickEvent)

    return () =>
      node?.removeEventListener('change', handleChange, {
        capture: false
      })
  }

  return {
    onClick: handleClick,
    label: isBtn ? getString('filestore.view.replaceFile') : getString('filestore.uploadFileFolder'),
    actionType: FileStoreActionTypes.UPLOAD_NODE
  }
}

export default useUploadFile
