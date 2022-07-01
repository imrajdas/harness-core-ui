/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { accountPathProps } from '@common/utils/routeUtils'
import { useDashboardsContext } from '@dashboards/pages/DashboardsContext'
import * as sharedService from 'services/custom-dashboards'
import DashboardViewPage from '../DashboardView'

const accountId = 'ggre4325'
const folderId = 'gh544'
const viewId = '45udb23'

const renderComponent = (folder = folderId): RenderResult =>
  render(
    <TestWrapper
      path={routes.toViewCustomDashboard({ ...accountPathProps, folderId: ':folderId', viewId: ':viewId' })}
      pathParams={{ accountId: accountId, folderId: folder, viewId: viewId }}
    >
      <DashboardViewPage />
    </TestWrapper>
  )

jest.mock('@dashboards/pages/DashboardsContext', () => ({
  useDashboardsContext: jest.fn()
}))

const useDashboardsContextMock = useDashboardsContext as jest.Mock

describe('DashboardView', () => {
  const useCreateSignedUrlMock = jest.spyOn(sharedService, 'useCreateSignedUrl')
  const useGetDashboardDetailMock = jest.spyOn(sharedService, 'useGetDashboardDetail')
  const useGetFolderDetailMock = jest.spyOn(sharedService, 'useGetFolderDetail')

  const includeBreadcrumbs = jest.fn()
  const fetchFolderDetailMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useGetFolderDetailMock.mockReturnValue({ data: { resource: 'folder name' }, refetch: fetchFolderDetailMock } as any)
    useGetDashboardDetailMock.mockReturnValue({ resource: true, title: 'dashboard name' } as any)
    useDashboardsContextMock.mockReturnValue({ includeBreadcrumbs: includeBreadcrumbs, breadcrumbs: [] })
    useCreateSignedUrlMock.mockReturnValue({
      mutate: () => new Promise(() => void 0),
      loading: true,
      error: null
    } as any)
  })

  test('it should display loading message before dashboard request completes', async () => {
    renderComponent()

    expect(screen.getByText('Loading, please wait...')).toBeInTheDocument()
  })

  test('it should display Dashboard not available when dashboard request returns no URL', async () => {
    useCreateSignedUrlMock.mockReturnValue({
      mutate: () => new Promise(() => void 0),
      loading: false,
      error: null
    } as any)

    renderComponent()

    expect(screen.getByText('Dashboard not available')).toBeInTheDocument()
  })

  test('it should display an error message when dashboard request fails', async () => {
    const testErrorMessage = 'this the actual error message'
    useCreateSignedUrlMock.mockReturnValue({
      mutate: () => new Promise(() => void 0),
      loading: false,
      error: { data: { responseMessages: testErrorMessage } }
    } as any)

    renderComponent()

    expect(screen.getByText(testErrorMessage)).toBeInTheDocument()
  })

  test('it should include a folder link in breadcrumbs when using a named folder', async () => {
    renderComponent()

    expect(includeBreadcrumbs).toBeCalledWith([
      { label: 'dashboards.homePage.folders', url: `/account/${accountId}/dashboards/folders` },
      { label: 'folder name', url: `/account/${accountId}/dashboards/folder/${folderId}` }
    ])
  })

  test('it should include a dashboard in breadcrumbs when a dashboard details has been retrieved', async () => {
    useGetFolderDetailMock.mockReturnValue({ data: null, refetch: jest.fn() } as any)

    const mockDashboardTitle = 'Test Dashboard'
    const mockDashboardDetail: sharedService.GetDashboardDetailResponse = {
      resource: true,
      title: mockDashboardTitle
    }
    useGetDashboardDetailMock.mockReturnValue({ data: mockDashboardDetail } as any)
    renderComponent()

    expect(includeBreadcrumbs).toBeCalledWith([
      { label: mockDashboardTitle, url: `/account/${accountId}/dashboards/folder/${folderId}/view/${viewId}` }
    ])
  })

  test('it should not include a folder link in breadcrumbs when using the shared folder', async () => {
    useGetFolderDetailMock.mockReturnValue({} as any)

    renderComponent('shared')

    expect(includeBreadcrumbs).toBeCalledWith([])
  })

  test('it should not call the folder detail endpoint when using the shared folder', async () => {
    renderComponent('shared')

    expect(fetchFolderDetailMock).not.toHaveBeenCalled()
  })
})
