/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import FolderForm, { FolderFormikValues } from '@dashboards/components/FolderForm/FolderForm'
import { useStrings } from 'framework/strings'
import { FolderModel, usePatchFolder } from 'services/custom-dashboards'

export interface UpdateFolderProps {
  onFormCompleted: () => void
  folderData: FolderModel
}

const UpdateFolder: React.FC<UpdateFolderProps> = ({ folderData, onFormCompleted }) => {
  const { id: folderId } = folderData
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  const [errorMessage, setErrorMessage] = React.useState<string>()

  const { mutate: updateFolder, loading } = usePatchFolder({
    queryParams: { accountId: accountId }
  })

  const onSubmit = (formData: FolderFormikValues): void => {
    setErrorMessage('')
    updateFolder({ ...formData, folderId })
      .then(() => {
        onFormCompleted()
      })
      .catch(e => {
        setErrorMessage(e?.data?.responseMessages || getString('dashboards.updateFolder.folderUpdateFail'))
      })
  }

  return <FolderForm onSubmit={onSubmit} error={errorMessage} loading={loading} initialFolderData={folderData} />
}

export default UpdateFolder
