/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { Breadcrumb, Layout } from '@harness/uicore'
import routes from '@common/RouteDefinitions'
import { Page } from '@common/exports'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { useDashboardsContext } from '@dashboards/pages/DashboardsContext'
import { SHARED_FOLDER_ID } from '@dashboards/constants'
import {
  ErrorResponse,
  useCreateSignedUrl,
  useGetDashboardDetail,
  useGetFolderDetail
} from 'services/custom-dashboards'
import css from './DashboardView.module.scss'

const DASHBOARDS_ORIGIN = 'https://dashboards.harness.io'
const DashboardViewPage: React.FC = () => {
  const { getString } = useStrings()
  const { includeBreadcrumbs } = useDashboardsContext()

  const { accountId, viewId, folderId } = useParams<AccountPathProps & { viewId: string; folderId: string }>()
  const [embedUrl, setEmbedUrl] = React.useState('')
  const [iframeState] = React.useState(0)
  const history = useHistory()
  const query = location.href.split('?')[1]

  const signedQueryUrl: string = useMemo(
    () => `/embed/dashboards-next/${viewId}?embed_domain=${location.host}&${query}`,
    [viewId, query]
  )

  const {
    mutate: createSignedUrl,
    loading,
    error
  } = useCreateSignedUrl({ queryParams: { accountId, dashboardId: viewId, src: signedQueryUrl } })

  const generateSignedUrl = async (): Promise<void> => {
    const { resource } = await createSignedUrl()
    setEmbedUrl(resource)
  }

  React.useEffect(() => {
    generateSignedUrl()
  }, [viewId])

  React.useEffect(() => {
    window.addEventListener('message', function (event) {
      if (event.origin === DASHBOARDS_ORIGIN) {
        const onChangeData = JSON.parse(event.data)
        if (onChangeData && onChangeData.type === 'page:changed' && onChangeData.page?.url?.includes('embed/explore')) {
          history.go(0)
        }
      }
    })
  }, [])

  const { data: folderDetail, refetch: fetchFolderDetail } = useGetFolderDetail({
    lazy: true,
    queryParams: { accountId, folderId }
  })

  React.useEffect(() => {
    if (folderId !== SHARED_FOLDER_ID) {
      fetchFolderDetail()
    }
  }, [accountId, folderId])

  const { data: dashboardDetail } = useGetDashboardDetail({ dashboard_id: viewId, queryParams: { accountId } })

  React.useEffect(() => {
    const links: Breadcrumb[] = []
    if (folderDetail?.resource) {
      links.push({
        url: routes.toCustomFolderHome({ accountId }),
        label: getString('dashboards.homePage.folders')
      })
      links.push({
        url: routes.toViewCustomFolder({ folderId, accountId }),
        label: folderDetail.resource
      })
    }
    dashboardDetail &&
      links.push({
        url: routes.toViewCustomDashboard({ viewId, folderId, accountId }),
        label: dashboardDetail.title
      })
    includeBreadcrumbs(links)
  }, [folderDetail, dashboardDetail, accountId, viewId])

  return (
    <Page.Body
      className={css.pageContainer}
      loading={loading}
      error={(error?.data as ErrorResponse)?.responseMessages}
      noData={{
        when: () => embedUrl === '',
        icon: 'dashboard',
        message: 'Dashboard not available'
      }}
    >
      <Layout.Vertical className={css.frame}>
        <iframe src={embedUrl} key={iframeState} height="100%" width="100%" frameBorder="0" id="dashboard-render" />
      </Layout.Vertical>
    </Page.Body>
  )
}

export default DashboardViewPage
