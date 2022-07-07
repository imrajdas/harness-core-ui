/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useState } from 'react'
import cx from 'classnames'
import {
  Dialog,
  Layout,
  Views,
  VisualYamlSelectedView as SelectedView,
  Container,
  GridListToggle,
  useToaster
} from '@harness/uicore'
import { useHistory, useParams } from 'react-router-dom'
import { useModalHook } from '@harness/use-modal'
import { defaultTo } from 'lodash-es'
import { useServiceStore } from '@cd/components/Services/common'
import { useStrings } from 'framework/strings'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'

import { Page } from '@common/exports'
import RbacButton from '@rbac/components/Button/Button'
import { GetServiceListQueryParams, ServiceResponseDTO, useGetServiceList } from 'services/cd-ng'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'
import { useGetCommunity } from '@common/utils/utils'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { NewEditServiceModal } from '@cd/components/PipelineSteps/DeployServiceStep/NewEditServiceModal'
import { FeatureFlag } from '@common/featureFlags'
import ServicesGridView from '../ServicesGridView/ServicesGridView'
import ServicesListView from '../ServicesListView/ServicesListView'
import { ServiceTabs } from '../utils/ServiceUtils'
import css from './ServicesListPage.module.scss'

export const ServicesListPage: React.FC = () => {
  const { accountId, orgIdentifier, projectIdentifier, module } = useParams<ProjectPathProps & ModulePathParams>()
  const isCommunity = useGetCommunity()
  const isSvcEnvEntityEnabled = useFeatureFlag(FeatureFlag.NG_SVC_ENV_REDESIGN)
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { fetchDeploymentList } = useServiceStore()
  const history = useHistory()

  const [view, setView] = useState(Views.LIST)
  const [page, setPage] = useState(0)
  const [mode, setMode] = useState<SelectedView>(SelectedView.VISUAL)
  const [isEdit, setIsEdit] = useState(false)
  const [serviceDetails, setServiceDetails] = useState({
    name: '',
    identifier: '',
    orgIdentifier,
    projectIdentifier,
    description: '',
    tags: {}
  })

  useEffect(() => {
    if (isEdit) {
      showModal()
    }
  }, [isEdit])

  const goToServiceDetails = useCallback(
    (selectedService: ServiceResponseDTO): void => {
      if (isCommunity) {
        const newServiceData = {
          name: defaultTo(selectedService.name, ''),
          identifier: defaultTo(selectedService.identifier, ''),
          orgIdentifier,
          projectIdentifier,
          description: defaultTo(selectedService.description, ''),
          tags: defaultTo(selectedService.tags, {})
        }
        setServiceDetails({ ...newServiceData })
        setIsEdit(true)
        return
      }
      if (selectedService?.identifier) {
        history.push({
          pathname: routes.toServiceStudio({
            accountId,
            orgIdentifier,
            projectIdentifier,
            serviceId: selectedService?.identifier,
            module
          }),
          search: isSvcEnvEntityEnabled ? `tab=${ServiceTabs.Configuration}` : `tab=${ServiceTabs.SUMMARY}`
        })
      } else {
        showError(getString('cd.serviceList.noIdentifier'))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountId, orgIdentifier, projectIdentifier, module]
  )

  const onServiceCreate = useCallback(
    (values: ServiceResponseDTO): void => {
      if (isSvcEnvEntityEnabled) {
        goToServiceDetails(values)
      } else {
        ;(fetchDeploymentList.current as () => void)?.()
        hideModal()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={() => {
          hideModal()
          setIsEdit(false)
        }}
        title={isEdit ? getString('editService') : getString('cd.addService')}
        isCloseButtonShown
        className={cx('padded-dialog', css.dialogStyles)}
      >
        <Container>
          <NewEditServiceModal
            data={isEdit ? serviceDetails : { name: '', identifier: '', orgIdentifier, projectIdentifier }}
            isEdit={isEdit}
            isService={!isEdit}
            onCreateOrUpdate={values => {
              onServiceCreate(values)
              setIsEdit(false)
            }}
            closeModal={() => {
              hideModal()
              setIsEdit(false)
            }}
          />
        </Container>
      </Dialog>
    ),
    [fetchDeploymentList, orgIdentifier, projectIdentifier, mode, isEdit, serviceDetails]
  )

  const queryParams: GetServiceListQueryParams = {
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier,
    size: 10,
    page: page
  }

  const {
    loading,
    data: serviceList,
    refetch
  } = useGetServiceList({
    queryParams
  })

  useEffect(() => {
    fetchDeploymentList.current = refetch
  }, [fetchDeploymentList, refetch])

  return (
    <Page.Body className={css.pageBody}>
      <>
        <Layout.Horizontal
          padding={{ left: 'xlarge', right: 'xlarge', top: 'medium' }}
          flex={{ distribution: 'space-between' }}
        >
          <RbacButton
            intent="primary"
            data-testid="add-service"
            icon="plus"
            iconProps={{ size: 10 }}
            text={getString('newService')}
            permission={{
              permission: PermissionIdentifier.EDIT_SERVICE,
              resource: {
                resourceType: ResourceType.SERVICE
              }
            }}
            onClick={() => {
              showModal()
              setMode(SelectedView.VISUAL)
            }}
          />

          <GridListToggle initialSelectedView={Views.LIST} onViewToggle={setView} />
        </Layout.Horizontal>

        <Layout.Vertical
          margin={{ left: 'xlarge', right: 'xlarge', top: 'large', bottom: 'large' }}
          className={css.container}
        >
          {view === Views.GRID ? (
            <ServicesGridView
              data={serviceList}
              loading={loading}
              onRefresh={() => refetch()}
              gotoPage={(pageNumber: number) => setPage(pageNumber)}
              onServiceSelect={async service => goToServiceDetails(service)}
            />
          ) : (
            <ServicesListView
              data={serviceList}
              loading={loading}
              onRefresh={() => refetch()}
              gotoPage={(pageNumber: number) => setPage(pageNumber)}
              onServiceSelect={async service => goToServiceDetails(service)}
            />
          )}
        </Layout.Vertical>
      </>
    </Page.Body>
  )
}
