/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ModalErrorHandlerBinding, useToaster } from '@harness/uicore'
import type { DashboardPathProps } from '@common/interfaces/RouteInterfaces'
import type { IDashboardFormData } from '@dashboards/types/DashboardTypes'
import { useStrings } from 'framework/strings'
import { ClonedDashboardResponse, useCloneDashboard } from 'services/custom-dashboards'
import DashboardForm, { DashboardFormRequestProps } from './DashboardForm'

export interface CloneDashboardFormProps {
  hideModal: () => void
  reloadDashboards: () => void
  formData?: IDashboardFormData
}

const CloneDashboardForm: React.FC<CloneDashboardFormProps> = ({ hideModal, reloadDashboards, formData }) => {
  const { getString } = useStrings()
  const { accountId } = useParams<DashboardPathProps>()
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding>()
  const { showSuccess } = useToaster()
  const { mutate: cloneDashboard, loading } = useCloneDashboard({
    queryParams: { accountId }
  })

  const onSuccess = (response: ClonedDashboardResponse): void => {
    if (response?.resource) {
      showSuccess(getString('dashboards.cloneDashboardModal.success'))
      hideModal()
      reloadDashboards()
    }
  }
  const onComplete = async (completedFormData: DashboardFormRequestProps): Promise<void> => {
    try {
      const dashboardId = formData?.id || ''
      const response = await cloneDashboard({ ...completedFormData, dashboardId })
      onSuccess(response)
    } catch (e) {
      modalErrorHandler?.showDanger(e?.data?.responseMessages || getString('dashboards.cloneDashboardModal.submitFail'))
    }
  }

  return (
    <DashboardForm
      title={getString('dashboards.cloneDashboardModal.title')}
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

export default CloneDashboardForm
