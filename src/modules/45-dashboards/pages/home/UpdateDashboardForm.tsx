/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import type { ModalErrorHandlerBinding } from '@harness/uicore'
import { useToaster } from '@harness/uicore'
import routes from '@common/RouteDefinitions'
import type { DashboardPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { UpdateDashboardResponse, useUpdateDashboard } from 'services/custom-dashboards'
import DashboardForm, { DashboardFormRequestProps } from './DashboardForm'

interface UpdateDashboardFormProps {
  hideModal: () => void
  reloadDashboards: () => void
  formData?: {
    id: string
    resourceIdentifier: string
    title: string
    description: string
  }
}

const UpdateDashboardForm: React.FC<UpdateDashboardFormProps> = ({ hideModal, reloadDashboards, formData }) => {
  const { getString } = useStrings()
  const { accountId } = useParams<DashboardPathProps>()
  const history = useHistory()
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding>()
  const { showSuccess } = useToaster()
  const { mutate: updateDashboard, loading } = useUpdateDashboard({
    queryParams: { accountId: accountId }
  })

  const onSuccess = (data: UpdateDashboardResponse): void => {
    if (data?.resource) {
      showSuccess(getString('dashboards.editModal.success'))
      hideModal()
      if (data.resource.resourceIdentifier !== formData?.resourceIdentifier) {
        history.push({
          pathname: routes.toViewCustomFolder({
            accountId: accountId,
            folderId: data.resource.resourceIdentifier
          })
        })
      } else {
        reloadDashboards()
      }
    }
  }

  const onComplete = async (completedFormData: DashboardFormRequestProps): Promise<void> => {
    try {
      const dashboardId = Number(formData?.id)
      const response = await updateDashboard({ ...completedFormData, dashboardId })
      onSuccess(response)
    } catch (e) {
      modalErrorHandler?.showDanger(e?.data?.responseMessages || getString('dashboards.editModal.submitFail'))
    }
  }

  return (
    <DashboardForm
      title={getString('dashboards.editModal.editDashboard')}
      modalErrorHandler={modalErrorHandler}
      setModalErrorHandler={setModalErrorHandler}
      formData={{
        folderId: formData?.resourceIdentifier || '',
        name: formData?.title || '',
        description: formData?.description
      }}
      loading={loading}
      onComplete={onComplete}
    />
  )
}

export default UpdateDashboardForm
