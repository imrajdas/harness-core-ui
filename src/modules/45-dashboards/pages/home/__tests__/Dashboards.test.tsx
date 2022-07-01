/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, RenderResult, screen, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import type { StringKeys } from 'framework/strings'
import type { DashboardModel } from 'services/custom-dashboards'
import { DashboardLayoutViews, DashboardType } from '@dashboards/types/DashboardTypes'
import * as customDashboardServices from 'services/custom-dashboards'
import Dashboards, { DashboardsProps } from '../Dashboards'

const defaultProps: DashboardsProps = {
  dashboards: [],
  deleteDashboard: jest.fn(),
  triggerRefresh: jest.fn(),
  view: DashboardLayoutViews.GRID
}

const defaultTestDashboard: DashboardModel = {
  id: '1',
  type: DashboardType.SHARED,
  description: 'testTag',
  title: 'testTitle',
  view_count: 0,
  favorite_count: 0,
  created_at: '',
  data_source: [],
  last_accessed_at: '',
  resourceIdentifier: '1',
  folder: {
    id: '',
    title: '',
    created_at: ''
  }
}

const renderComponent = (props: DashboardsProps): RenderResult => {
  return render(
    <TestWrapper>
      <Dashboards {...props} />
    </TestWrapper>
  )
}

const openDashboardCardContextMenu = (): void => {
  const menuButtonText: StringKeys = 'more'
  const button = screen.getByText(menuButtonText)!
  expect(button).toBeInTheDocument()
  act(() => {
    fireEvent.click(button)
  })
}

const mockEmptyGetFolderResponse: customDashboardServices.GetFolderResponse = {
  resource: []
}

describe('Dashboards', () => {
  const useGetFoldersMock = jest.spyOn(customDashboardServices, 'useGetFolders')

  beforeEach(() => {
    jest.clearAllMocks()

    useGetFoldersMock.mockReturnValue({ data: mockEmptyGetFolderResponse, error: null, loading: false } as any)
  })

  test('it should show an empty message when there are no dashboards', () => {
    renderComponent(defaultProps)

    const noDashboardsText: StringKeys = 'dashboards.homePage.noDashboardsAvailable'
    expect(screen.getByText(noDashboardsText)).toBeInTheDocument()
  })

  test('it should show dashboard cards when view set to grid', () => {
    const testProps: DashboardsProps = {
      ...defaultProps,
      dashboards: [defaultTestDashboard]
    }
    const { container } = renderComponent(testProps)

    const noDashboardsText: StringKeys = 'dashboards.homePage.noDashboardsAvailable'
    expect(screen.queryByText(noDashboardsText)).toBeNull()
    expect(container.querySelector('.masonry')).toBeInTheDocument()
  })

  test('it should show dashboard list when view set to list', () => {
    const testProps: DashboardsProps = {
      ...defaultProps,
      dashboards: [defaultTestDashboard],
      view: DashboardLayoutViews.LIST
    }
    renderComponent(testProps)

    const noDashboardsText: StringKeys = 'dashboards.homePage.noDashboardsAvailable'

    const headerViewCount: StringKeys = 'dashboards.dashboardList.headerViewCount'

    expect(screen.queryByText(noDashboardsText)).toBeNull()
    expect(screen.getByText(headerViewCount)).toBeInTheDocument()
  })

  test('it should show edit dashboard form when editDashboard callback triggered', async () => {
    const testDashboard: DashboardModel = {
      ...defaultTestDashboard,
      type: DashboardType.ACCOUNT
    }
    const testProps: DashboardsProps = {
      ...defaultProps,
      dashboards: [testDashboard]
    }
    renderComponent(testProps)

    openDashboardCardContextMenu()

    const editButtonText: StringKeys = 'edit'
    const editButton = screen.getAllByText(editButtonText)
    expect(editButton.length).toBe(2)

    act(() => {
      fireEvent.click(editButton[0])
    })

    const editFormTitle: StringKeys = 'dashboards.editModal.editDashboard'
    await waitFor(() => expect(screen.getByText(editFormTitle)).toBeInTheDocument())
  })

  test('it should trigger delete callback when deleteDashboard triggered', () => {
    const mockCallback = jest.fn()
    const testDashboard: DashboardModel = {
      ...defaultTestDashboard,
      type: DashboardType.ACCOUNT
    }
    const testProps: DashboardsProps = {
      ...defaultProps,
      dashboards: [testDashboard],
      deleteDashboard: mockCallback
    }
    renderComponent(testProps)

    openDashboardCardContextMenu()

    const deleteButtonText: StringKeys = 'delete'
    const deleteButton = screen.getByText(deleteButtonText)
    expect(deleteButton).toBeInTheDocument()

    act(() => {
      fireEvent.click(deleteButton)
    })

    expect(mockCallback).toHaveBeenCalled()
  })

  test('it should trigger clone callback when cloneDashboard triggered', async () => {
    const testDashboard: DashboardModel = {
      ...defaultTestDashboard,
      type: DashboardType.ACCOUNT
    }
    const testProps: DashboardsProps = {
      ...defaultProps,
      dashboards: [testDashboard]
    }
    renderComponent(testProps)

    openDashboardCardContextMenu()

    const cloneButtonText: StringKeys = 'projectCard.clone'
    const cloneButton = screen.getByText(cloneButtonText)
    expect(cloneButton).toBeInTheDocument()

    act(() => {
      fireEvent.click(cloneButton)
    })

    const cloneFormTitle: StringKeys = 'dashboards.cloneDashboardModal.title'
    await waitFor(() => expect(screen.getByText(cloneFormTitle)).toBeInTheDocument())
  })
})
