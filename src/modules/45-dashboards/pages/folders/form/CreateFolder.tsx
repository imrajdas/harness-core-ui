/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'
import FolderForm, { FolderFormikValues } from '@dashboards/components/FolderForm/FolderForm'
import { useStrings } from 'framework/strings'
import { useCreateFolder } from 'services/custom-dashboards'

export interface CreateFolderProps {
  onFormCompleted: () => void
}

const CreateFolder: React.FC<CreateFolderProps> = ({ onFormCompleted }) => {
  const { getString } = useStrings()
  const history = useHistory()
  const { accountId } = useParams<AccountPathProps>()

  const [errorMessage, setErrorMessage] = React.useState<string>()
  const { mutate: createFolder, loading } = useCreateFolder({
    queryParams: { accountId }
  })

  const onSubmit = (formData: FolderFormikValues): void => {
    setErrorMessage('')
    createFolder(formData)
      .then(response => {
        history.push({
          pathname: routes.toCustomDashboardHome({
            folderId: response.resource,
            accountId: accountId
          })
        })
        onFormCompleted()
      })
      .catch(e => {
        setErrorMessage(e?.data?.responseMessages || getString('dashboards.createFolder.folderSubmitFail'))
      })
  }

  return <FolderForm onSubmit={onSubmit} error={errorMessage} loading={loading} />
}

export default CreateFolder
