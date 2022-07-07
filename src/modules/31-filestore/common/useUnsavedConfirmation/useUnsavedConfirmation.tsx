import { useContext } from 'react'
import { useConfirmationDialog } from '@harness/uicore'
import { Intent } from '@harness/design-system'
import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'
import { useStrings } from 'framework/strings'
import { FileStoreNodeTypes } from '@filestore/interfaces/FileStore'

interface UseUnsavedConfirmationProps {
  callback: (...args: any) => void
  textProps?: {
    contentText?: string
    titleText?: string
    confirmButtonText?: string
    cancelButtonText?: string
  }
  isNavigationBar?: boolean
}

interface UseUnsavedConfirmation {
  handleUnsavedConfirmation: (...args: any) => void
}
export const useUnsavedConfirmation = ({
  callback,
  textProps,
  isNavigationBar = false
}: UseUnsavedConfirmationProps): UseUnsavedConfirmation => {
  const { getString } = useStrings()
  const { tempNodes, addDeletedNode, setTempNodes, getNode, currentNode, unsavedNodes, setUnsavedNodes } =
    useContext(FileStoreContext)

  const { openDialog } = useConfirmationDialog({
    cancelButtonText: textProps?.cancelButtonText || getString('cancel'),
    contentText: textProps?.contentText || getString('navigationCheckText'),
    titleText: textProps?.titleText || getString('navigationCheckTitle'),
    confirmButtonText: textProps?.confirmButtonText || getString('confirm'),
    intent: Intent.WARNING,
    onCloseDialog: isConfirmed => {
      if (isConfirmed) {
        if (unsavedNodes[0]) {
          setUnsavedNodes([])
          callback()
          return
        }
        addDeletedNode(tempNodes[0].identifier)
        setTempNodes([])
        if (!isNavigationBar) {
          getNode({
            identifier: currentNode?.parentIdentifier || '',
            name: currentNode?.parentName || '',
            type: FileStoreNodeTypes.FOLDER
          })
        }
        callback()
      }
    }
  })

  if (tempNodes[0] || unsavedNodes[0]) {
    return {
      handleUnsavedConfirmation: openDialog
    }
  }

  return {
    handleUnsavedConfirmation: callback
  }
}
