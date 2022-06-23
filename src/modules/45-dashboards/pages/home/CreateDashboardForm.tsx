/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { ModalErrorHandlerBinding, Layout, Container, useToaster } from '@harness/uicore'
import { CreateDashboardResponse, useCreateDashboard } from 'services/custom-dashboards'
import { useStrings } from 'framework/strings'
import routes from '@common/RouteDefinitions'
import type { DashboardPathProps } from '@common/interfaces/RouteInterfaces'
import DashboardForm, { DashboardFormRequestProps } from './DashboardForm'

interface CreateDashboardFormProps {
  hideModal: () => void
}

const CreateDashboardForm: React.FC<CreateDashboardFormProps> = ({ hideModal }) => {
  const { getString } = useStrings()
  const { accountId, folderId } = useParams<DashboardPathProps>()
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding>()
  const history = useHistory()
  const { showSuccess } = useToaster()

  const { mutate: createDashboard, loading } = useCreateDashboard({
    queryParams: { accountId: accountId }
  })

  const onSuccess = (data: CreateDashboardResponse): void => {
    if (data?.resource) {
      showSuccess(getString('dashboards.createModal.success'))
      hideModal()
      history.push({
        pathname: routes.toViewCustomDashboard({
          viewId: data.resource.toString(),
          accountId,
          folderId
        })
      })
    }
  }

  const onComplete = async (formData: DashboardFormRequestProps): Promise<void> => {
    try {
      const response = await createDashboard(formData)
      onSuccess(response)
    } catch (e) {
      modalErrorHandler?.showDanger(e?.data?.responseMessages || getString('dashboards.createModal.submitFail'))
    }
  }

  return (
    <Layout.Horizontal>
      <Container width="50%">
        <DashboardForm
          title={getString('dashboards.createModal.stepOne')}
          modalErrorHandler={modalErrorHandler}
          setModalErrorHandler={setModalErrorHandler}
          loading={loading}
          onComplete={onComplete}
        />
      </Container>
      <Container width="50%" flex={{ align: 'center-center' }} padding="xxlarge">
        <iframe
          allowFullScreen
          frameBorder={0}
          height="200"
          title={getString('dashboards.createModal.howToCreate')}
          src="//fast.wistia.net/embed/iframe/38m8yricif"
          scrolling="no"
          width="350"
        />
      </Container>
    </Layout.Horizontal>
  )
}

export default CreateDashboardForm
