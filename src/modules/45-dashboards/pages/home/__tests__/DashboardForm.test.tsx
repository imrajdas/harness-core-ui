/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen, waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
import { TestWrapper } from '@common/utils/testUtils'
import { useStrings } from 'framework/strings'
import * as customDashboardServices from 'services/custom-dashboards'
import DashboardForm, { DashboardFormProps } from '../DashboardForm'

const defaultProps: DashboardFormProps = {
  title: '',
  loading: false,
  onComplete: jest.fn(),
  setModalErrorHandler: jest.fn()
}

const wrapper = ({ children }: React.PropsWithChildren<unknown>): React.ReactElement => (
  <TestWrapper>{children}</TestWrapper>
)

const { result } = renderHook(() => useStrings(), { wrapper })

const renderComponent = (props: DashboardFormProps): RenderResult => {
  return render(
    <TestWrapper>
      <DashboardForm {...props} />
    </TestWrapper>
  )
}

const mockEmptyGetFolderResponse: customDashboardServices.GetFolderResponse = {
  resource: [
    { id: 'shared', name: 'Shared Folder' },
    { id: '1', name: 'folder_one' }
  ] as any
}

describe('DashboardForm', () => {
  beforeEach(() => {
    jest
      .spyOn(customDashboardServices, 'useGetFolders')
      .mockImplementation(() => ({ data: mockEmptyGetFolderResponse, loading: false } as any))
  })
  afterEach(() => {
    jest.spyOn(customDashboardServices, 'useGetFolders').mockReset()
  })

  test('it should display a Dashboard Form with continue button', () => {
    renderComponent(defaultProps)

    const saveButton = screen.getByText(result.current.getString('continue'))
    waitFor(() => expect(saveButton).toBeInTheDocument())
  })

  test('it should display the formData as the initial form values', () => {
    const formData = {
      description: 'tag_one,tag_two',
      folderId: '1',
      name: 'dashboard name'
    }

    renderComponent({ formData: formData, ...defaultProps })

    expect(screen.getByDisplayValue('dashboard name')).toBeInTheDocument()
    expect(screen.getByText('tag_one')).toBeInTheDocument()
    expect(screen.getByText('tag_two')).toBeInTheDocument()
    expect(screen.getByDisplayValue('folder_one')).toBeInTheDocument()
  })

  test('it should select shared as the initial folder when the initial folder ID is not returned', () => {
    const formData = {
      description: 'tags',
      folderId: '1234',
      name: 'dashboard name'
    }

    renderComponent({ formData: formData, ...defaultProps })

    expect(screen.getByDisplayValue('Shared Folder')).toBeInTheDocument()
  })
})
