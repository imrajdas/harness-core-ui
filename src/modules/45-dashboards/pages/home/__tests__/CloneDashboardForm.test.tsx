/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, RenderResult, screen, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import type { IDashboardFormData } from '@dashboards/types/DashboardTypes'
import type { StringKeys } from 'framework/strings'
import * as customDashboardServices from 'services/custom-dashboards'
import CloneDashboardForm, { CloneDashboardFormProps } from '../CloneDashboardForm'

const defaultProps: CloneDashboardFormProps = {
  hideModal: jest.fn(),
  reloadDashboards: jest.fn()
}

const renderComponent = (props: CloneDashboardFormProps): RenderResult => {
  return render(
    <TestWrapper>
      <CloneDashboardForm {...props} />
    </TestWrapper>
  )
}

const mockEmptyGetFolderResponse: customDashboardServices.GetFolderResponse = {
  resource: []
}

describe('CloneDashboardForm', () => {
  beforeEach(() => {
    jest
      .spyOn(customDashboardServices, 'useGetFolders')
      .mockImplementation(() => ({ data: mockEmptyGetFolderResponse, loading: false } as any))
  })
  afterEach(() => {
    jest.spyOn(customDashboardServices, 'useCloneDashboard').mockReset()
    jest.spyOn(customDashboardServices, 'useGetFolders').mockReset()
  })

  test('it should display Clone Dashboard Form', () => {
    renderComponent(defaultProps)

    const formTitle: StringKeys = 'dashboards.cloneDashboardModal.title'
    expect(screen.getByText(formTitle)).toBeInTheDocument()
  })

  test('it should trigger callbacks and show toast upon successful submission', async () => {
    const resourceIdentifier = '456'
    const testFormData: IDashboardFormData = {
      id: '123',
      resourceIdentifier,
      title: 'testTitle',
      description: ''
    }
    const mockCallbackClone = jest.fn(() => Promise.resolve({ resource: { resourceIdentifier } }))
    jest
      .spyOn(customDashboardServices, 'useCloneDashboard')
      .mockImplementation(() => ({ mutate: mockCallbackClone, loading: false } as any))
    const mockCallbackHide = jest.fn()
    const mockCallbackReload = jest.fn()

    const testProps: CloneDashboardFormProps = {
      hideModal: mockCallbackHide,
      reloadDashboards: mockCallbackReload,
      formData: testFormData
    }

    renderComponent(testProps)

    const formButtonText: StringKeys = 'continue'
    const formButton = screen.getByText(formButtonText)
    expect(formButton).toBeInTheDocument()

    act(() => {
      fireEvent.click(formButton)
    })

    const successToastText: StringKeys = 'dashboards.cloneDashboardModal.success'
    await waitFor(() => expect(screen.getByText(successToastText)).toBeInTheDocument())

    expect(mockCallbackClone).toHaveBeenCalled()
    expect(mockCallbackHide).toHaveBeenCalled()
    expect(mockCallbackReload).toHaveBeenCalled()
  })

  test('it should show failure toast upon unsuccessful submission', async () => {
    const resourceIdentifier = '456'
    const testFormData: IDashboardFormData = {
      id: '123',
      resourceIdentifier,
      title: 'testTitle',
      description: ''
    }
    const mockCallbackClone = jest.fn(() => Promise.reject())
    jest
      .spyOn(customDashboardServices, 'useCloneDashboard')
      .mockImplementation(() => ({ mutate: mockCallbackClone, loading: false } as any))
    const mockCallbackHide = jest.fn()
    const mockCallbackReload = jest.fn()

    const testProps: CloneDashboardFormProps = {
      hideModal: mockCallbackHide,
      reloadDashboards: mockCallbackReload,
      formData: testFormData
    }

    renderComponent(testProps)

    const formButtonText: StringKeys = 'continue'
    const formButton = screen.getByText(formButtonText)
    expect(formButton).toBeInTheDocument()

    act(() => {
      fireEvent.click(formButton)
    })

    const failToastText: StringKeys = 'dashboards.cloneDashboardModal.submitFail'
    await waitFor(() => expect(screen.getByText(failToastText)).toBeInTheDocument())

    expect(mockCallbackClone).toHaveBeenCalledTimes(1)
    expect(mockCallbackHide).toHaveBeenCalledTimes(0)
    expect(mockCallbackReload).toHaveBeenCalledTimes(0)
  })
})
