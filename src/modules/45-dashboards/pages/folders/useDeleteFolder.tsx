/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Intent } from '@blueprintjs/core'
import { useParams } from 'react-router-dom'
import { useMutate } from 'restful-react'
import { useToaster, useConfirmationDialog } from '@harness/uicore'
import { useStrings } from 'framework/strings'

import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import type { FolderModel } from 'services/custom-dashboards'

interface UseDeleteFolderReturn {
  openDialog: () => void
}

const useDeleteFolder = (folder: FolderModel | undefined, onSuccess: () => void): UseDeleteFolderReturn => {
  const { accountId } = useParams<AccountPathProps>()
  const { mutate: deleteFolder } = useMutate({
    verb: 'DELETE',
    path: 'gateway/dashboard/folder',
    queryParams: {
      accountId: accountId
    }
  })
  const { getString } = useStrings()
  const { showSuccess, showError } = useToaster()
  const { openDialog } = useConfirmationDialog({
    contentText: getString('dashboards.deleteFolder.confirmDeleteText', { name: folder?.name }),
    titleText: getString('dashboards.deleteFolder.confirmDeleteTitle', { name: folder?.name }),
    confirmButtonText: getString('delete'),
    cancelButtonText: getString('cancel'),
    intent: Intent.WARNING,
    onCloseDialog: async (isConfirmed: boolean) => {
      if (isConfirmed) {
        try {
          const deleted = await deleteFolder({ name: folder?.id })
          if (deleted) {
            showSuccess(getString('dashboards.deleteFolder.success'))
            onSuccess()
          }
        } catch (error) {
          showError(error?.data?.responseMessages || getString('dashboards.deleteFolder.failed'))
        }
      }
    }
  })
  return {
    openDialog
  }
}

export default useDeleteFolder
