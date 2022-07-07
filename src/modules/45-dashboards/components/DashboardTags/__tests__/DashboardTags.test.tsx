/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import type { DashboardModel } from 'services/custom-dashboards'
import { DashboardType } from '@dashboards/types/DashboardTypes'
import type { StringKeys } from 'framework/strings'
import DashboardTags, { DashboardTagProps } from '../DashboardTags'

const defaultTestDashboard: DashboardModel = {
  id: '1',
  type: DashboardType.SHARED,
  description: 'testTag',
  title: 'test title',
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

const renderComponent = (props: DashboardTagProps): RenderResult => {
  return render(
    <TestWrapper>
      <DashboardTags {...props} />
    </TestWrapper>
  )
}

describe('DashboardTags', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('it should display a Harness tag when shared Dashboard displayed', async () => {
    renderComponent({ dashboard: defaultTestDashboard })

    const expectedText: StringKeys = 'dashboards.modules.harness'
    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  test('it should display a custom tag when account Dashboard displayed', async () => {
    const customTag = 'testTag'
    const mockDashboard: DashboardModel = {
      ...defaultTestDashboard,
      type: DashboardType.ACCOUNT,
      description: customTag
    }
    renderComponent({ dashboard: mockDashboard })
    expect(screen.getByText(customTag)).toBeInTheDocument()
  })

  test('it should display a Cloud Cost tag when Dashboard Tag is CE', async () => {
    const mockDashboard: DashboardModel = {
      ...defaultTestDashboard,
      data_source: ['CE']
    }
    renderComponent({ dashboard: mockDashboard })

    const expectedText: StringKeys = 'common.purpose.ce.cloudCost'
    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  test('it should display a Builds tag when Dashboard Tag is CI', async () => {
    const mockDashboard: DashboardModel = {
      ...defaultTestDashboard,
      data_source: ['CI']
    }
    renderComponent({ dashboard: mockDashboard })

    const expectedText: StringKeys = 'buildsText'
    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  test('it should display a Deployments tag when Dashboard Tag is CD', async () => {
    const mockDashboard: DashboardModel = {
      ...defaultTestDashboard,
      data_source: ['CD']
    }
    renderComponent({ dashboard: mockDashboard })

    const expectedText: StringKeys = 'deploymentsText'
    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  test('it should display a Feature Flags tag when Dashboard Tag is CF', async () => {
    const mockDashboard: DashboardModel = {
      ...defaultTestDashboard,
      data_source: ['CF']
    }
    renderComponent({ dashboard: mockDashboard })

    const expectedText: StringKeys = 'common.purpose.cf.continuous'
    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  test('it should display a Current Gen tag when Dashboard Tag is CG', async () => {
    const mockDashboard: DashboardModel = {
      ...defaultTestDashboard,
      data_source: ['CG_CD']
    }
    renderComponent({ dashboard: mockDashboard })

    const expectedText: StringKeys = 'dashboards.modules.cgDeployments'
    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })
})
