/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { PageError, Pagination } from '@harness/uicore'
import routes from '@common/RouteDefinitions'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import type { EnvironmentResponseDTO } from 'services/cd-ng'
import { ApiKey, useGetAllAPIKeys } from 'services/cf'
import { useSyncedEnvironment } from '@cf/hooks/useSyncedEnvironment'
import { useStrings } from 'framework/strings'
import { CF_DEFAULT_PAGE_SIZE, getErrorMessage } from '@cf/utils/CFUtils'
import AddKeyDialog from '@cf/components/AddKeyDialog/AddKeyDialog'
import { EnvironmentType } from '@common/constants/EnvironmentType'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import { DetailPageTemplate } from '@cf/components/DetailPageTemplate/DetailPageTemplate'
import CFEnvironmentDetailsBody from './EnvironmentDetailsBody'

const EnvironmentDetails: React.FC = () => {
  const { getString } = useStrings()
  const { projectIdentifier, environmentIdentifier, orgIdentifier, accountId } = useParams<Record<string, string>>()
  const { withActiveEnvironment } = useActiveEnvironment()
  const [page, setPage] = useState<number>(0)
  const [recents, setRecents] = useState<ApiKey[]>([])

  const updateApiKeyList = (key: ApiKey): void => {
    setRecents([...recents, key])
  }

  const queryParams = {
    projectIdentifier: projectIdentifier,
    environmentIdentifier: environmentIdentifier,
    accountIdentifier: accountId,
    orgIdentifier: orgIdentifier
  }

  const { loading, data, error, refetch } = useSyncedEnvironment({
    accountId,
    orgIdentifier,
    projectIdentifier,
    environmentIdentifier
  })

  const {
    data: keys,
    loading: keysLoading,
    error: keysError,
    refetch: refetchKeys
  } = useGetAllAPIKeys({
    queryParams: {
      ...queryParams,
      pageSize: CF_DEFAULT_PAGE_SIZE,
      pageNumber: page
    }
  })

  const environment = data?.data as EnvironmentResponseDTO
  const hasKeys = Boolean(keys?.apiKeys?.length)
  const hasData = Boolean(environment)

  useDocumentTitle(getString('environments'))

  const breadcrumbs = [
    {
      label: getString('environments'),
      url: withActiveEnvironment(
        routes.toCFEnvironments({
          accountId,
          orgIdentifier,
          projectIdentifier
        })
      )
    }
  ]

  const onNewKeyCreated = useCallback(() => {
    setPage(0)
    refetchKeys()
  }, [refetchKeys])

  return (
    <>
      {hasData && (
        <DetailPageTemplate
          breadcrumbs={breadcrumbs}
          title={environment.name}
          identifier={environment.identifier}
          subTitle={environment.description}
          metaData={{
            environment: getString(environment.type === EnvironmentType.PRODUCTION ? 'production' : 'nonProduction')
          }}
          toolbar={
            hasKeys && (
              <AddKeyDialog
                apiKeys={keys?.apiKeys}
                environment={environment}
                primary
                onCreate={(newKey: ApiKey, hideModal) => {
                  setRecents([...recents, newKey])
                  onNewKeyCreated()
                  hideModal()
                }}
              />
            )
          }
          footer={
            !!keys?.itemCount && (
              <Pagination
                itemCount={keys?.itemCount ?? 0}
                pageCount={keys?.pageCount ?? 0}
                pageIndex={keys?.pageIndex ?? 0}
                pageSize={CF_DEFAULT_PAGE_SIZE}
                gotoPage={(index: number) => {
                  setPage(index)
                }}
              />
            )
          }
        >
          <CFEnvironmentDetailsBody
            data={keys}
            loading={keysLoading}
            error={keysError}
            refetch={refetchKeys}
            onNewKeyCreated={onNewKeyCreated}
            environment={environment}
            updatePageNumber={setPage}
            updateApiKeyList={updateApiKeyList}
            recents={recents}
          />
        </DetailPageTemplate>
      )}
      {loading && <ContainerSpinner flex={{ align: 'center-center' }} />}
      {error && (
        <PageError
          message={getErrorMessage(error)}
          onClick={() => {
            refetch()
          }}
        />
      )}
    </>
  )
}

export default EnvironmentDetails
