/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Button, Formik, FormikForm, FormInput, Layout, Heading } from '@wings-software/uicore'
import { Dialog, IDialogProps } from '@blueprintjs/core'
import type { AccessPoint } from 'services/lw'
import { useToaster } from '@common/exports'
import { useStrings } from 'framework/strings'
import { useDeleteAccessPoints, DeleteAccessPointPayload } from 'services/lw'
import RbacButton from '@rbac/components/Button/Button'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'

const modalPropsLight: IDialogProps = {
  isOpen: true,
  enforceFocus: false,
  style: {
    width: 500,
    minHeight: 200,
    position: 'relative',
    overflow: 'hidden'
  }
}

interface DeleteAccessPointProps {
  accessPoints: AccessPoint[]
  accountId: string
  refresh: () => void
}

const DeleteAccessPoint = (props: DeleteAccessPointProps) => {
  const { getString } = useStrings()
  const { showError, showSuccess } = useToaster()
  const { accessPoints, accountId, refresh } = props
  const [modalState, setModalState] = useState(false)
  const { mutate: deleteAccessPoints, loading } = useDeleteAccessPoints({
    account_id: accountId,
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const showModal = () => setModalState(true)
  const hideModal = () => setModalState(false)
  const deleteFromCloud = async (withResources: boolean): Promise<void> => {
    const ids = accessPoints.map(ap => ap.id as string)
    const payload: DeleteAccessPointPayload = {
      ids,
      with_resources: withResources // eslint-disable-line
    }
    try {
      await deleteAccessPoints(payload)
      showSuccess(getString('ce.co.accessPoint.delete.success'))
      refresh()
    } catch (e) {
      showError(e.data.errors[0], undefined, 'ce.delete.ap.error')
    }
    hideModal()
  }
  const getTitle = (): string => {
    let str = getString('ce.co.accessPoint.loadbalancers')
    if (accessPoints.length == 1) {
      str = getString('ce.co.accessPoint.loadbalancer')
    }
    return getString('delete') + ' ' + accessPoints.length + ' ' + str
  }
  const DeleteConfirmation = () => (
    <Dialog onClose={hideModal} {...modalPropsLight}>
      <Formik
        onSubmit={values => {
          deleteFromCloud(values.withResources)
        }}
        initialValues={{
          withResources: false
        }}
        formName="deleteAccessPt"
      >
        {() => (
          <FormikForm>
            <Layout.Vertical spacing="xlarge" margin="xlarge">
              <Heading level={2} font={{ weight: 'bold' }}>
                {getTitle()}
              </Heading>
              <FormInput.CheckBox
                name="withResources"
                label={getString('ce.co.accessPoint.delete.withResource')}
                margin={{ left: 'xlarge' }}
                font={{ weight: 'semi-bold' }}
                disabled={loading}
              />
              <Layout.Horizontal spacing="xlarge">
                <Button
                  intent="primary"
                  type="submit"
                  text={getString('delete')}
                  loading={loading}
                  disabled={loading}
                />
                <Button text={getString('cancel')} onClick={() => hideModal()} disabled={loading} />
              </Layout.Horizontal>
            </Layout.Vertical>
          </FormikForm>
        )}
      </Formik>
    </Dialog>
  )
  if (!accessPoints || accessPoints.length == 0) {
    return <></>
  }
  return (
    <>
      <RbacButton
        intent="primary"
        icon="trash"
        text={getString('delete')}
        onClick={() => showModal()}
        permission={{
          permission: PermissionIdentifier.DELETE_CCM_LOADBALANCER,
          resource: {
            resourceType: ResourceType.LOADBALANCER
          }
        }}
      />
      {modalState && <DeleteConfirmation />}
    </>
  )
}

export default DeleteAccessPoint
