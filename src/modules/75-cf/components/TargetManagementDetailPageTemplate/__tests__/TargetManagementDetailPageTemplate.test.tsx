/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

/* eslint-disable react/display-name */
import React, { ReactNode } from 'react'
import { render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { merge } from 'lodash-es'
import { TestWrapper } from '@common/utils/testUtils'
import type { Segment, Target } from 'services/cf'
import * as useDocumentTitle from '@common/hooks/useDocumentTitle'
import TargetManagementDetailPageTemplate, {
  TargetManagementDetailPageTemplateProps
} from '../TargetManagementDetailPageTemplate'

const mockTargetGroup = {
  name: 'Target Group 1',
  identifier: 'tg1',
  createdAt: 1649860628,
  environment: 'env1'
} as Segment

const mockTarget = {
  name: 'Target 1',
  identifier: 't1',
  createdAt: 1649860628,
  environment: 'env1',
  segments: [],
  account: 'ac1',
  org: 'org1',
  project: 'p1'
} as Target

jest.mock('@cf/components/TargetManagementToolbar/TargetManagementToolbar', () => ({
  __esModule: true,
  default: () => <span data-testid="target-management-toolbar">Target Management Toolbar</span>
}))

const renderComponent = (
  props: Partial<TargetManagementDetailPageTemplateProps & { children: ReactNode }> = {}
): RenderResult =>
  render(
    <TestWrapper>
      <TargetManagementDetailPageTemplate item={mockTarget} openDeleteDialog={jest.fn()} leftBar={<div />} {...props} />
    </TestWrapper>
  )

describe('TargetManagementDetailPageTemplate', () => {
  const useDocumentTitleMock = jest.spyOn(useDocumentTitle, 'useDocumentTitle')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('it should display the item name, identifier and created date', async () => {
    const item = merge(mockTarget, { name: 'Item Name', identifier: 'item_id', createdAt: 1649861069 })
    renderComponent({ item })

    expect(screen.getByText(item.name)).toBeInTheDocument()
    expect(screen.getByText(item.identifier)).toBeInTheDocument()
    expect(screen.getByText('cf.targetDetail.createdOnDate')).toBeInTheDocument()
  })

  test('it should call the openDeleteDialog callback when the delete button is pressed', async () => {
    const openDeleteDialogMock = jest.fn()

    renderComponent({ openDeleteDialog: openDeleteDialogMock })

    expect(screen.queryByText('delete')).not.toBeInTheDocument()
    expect(openDeleteDialogMock).not.toHaveBeenCalled()

    const optionsMenuButton = (document.querySelector('[data-icon="Options"]') as HTMLElement).closest(
      'button'
    ) as HTMLButtonElement
    expect(optionsMenuButton).toBeInTheDocument()

    userEvent.click(optionsMenuButton)

    await waitFor(() => expect(screen.getByText('delete')).toBeInTheDocument())

    userEvent.click(screen.getByText('delete'))

    await waitFor(() => expect(openDeleteDialogMock).toHaveBeenCalled())
  })

  test('it should display the element passed as leftBar', async () => {
    const testId = 'el-test-id'

    renderComponent({ leftBar: <div data-testid={testId}>Left Bar</div> })

    expect(screen.getByTestId(testId)).toBeInTheDocument()
  })

  test('it should display the element passed as a child', async () => {
    const testId = 'el-test-id'

    renderComponent({ children: <div data-testid={testId}>Main content</div> })

    expect(screen.getByTestId(testId)).toBeInTheDocument()
  })

  describe('Target', () => {
    test('it should include a link back to the Targets listing', async () => {
      renderComponent({ item: mockTarget })

      const breadcrumb = screen.getByText('cf.shared.targetManagement: cf.shared.targets').closest('a')
      expect(breadcrumb).toBeInTheDocument()
      expect(breadcrumb).toHaveAttribute('href', expect.stringMatching(/target-management\/targets$/))
    })

    test('it should set the document title', async () => {
      renderComponent({ item: mockTarget })

      expect(useDocumentTitleMock).toHaveBeenCalledWith('cf.shared.targetManagement: cf.shared.targets')
    })
  })

  describe('Target Group', () => {
    test('it should include a link back to the Target Groups listing', async () => {
      renderComponent({ item: mockTargetGroup })

      const breadcrumb = screen.getByText('cf.shared.targetManagement: cf.shared.segments').closest('a')
      expect(breadcrumb).toBeInTheDocument()
      expect(breadcrumb).toHaveAttribute('href', expect.stringMatching(/target-management\/target-groups$/))
    })

    test('it should set the document title', async () => {
      renderComponent({ item: mockTargetGroup })

      expect(useDocumentTitleMock).toHaveBeenCalledWith('cf.shared.targetManagement: cf.shared.segments')
    })
  })
})
