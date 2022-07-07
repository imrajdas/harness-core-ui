/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, waitFor, getByText, screen } from '@testing-library/react'
import mockImport from 'framework/utils/mockImport'
import mockEnvironments from '@cd/components/PipelineSteps/DeployEnvStep/__tests__/mock.json'
import { TestWrapper, findDialogContainer } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { modulePathProps, projectPathProps } from '@common/utils/routeUtils'
import EnvironmentsGrid from '../EnvironmentsGrid'

const deleteEnvironment = jest.fn().mockResolvedValue({ data: {} })
const showError = jest.fn()

jest.mock('services/cd-ng', () => ({
  useGetEnvironmentListV2: jest
    .fn()
    .mockImplementation(() => ({ loading: false, data: mockEnvironments, refetch: jest.fn() })),
  useDeleteEnvironmentV2: () => ({ mutate: deleteEnvironment })
}))

jest.mock('@harness/uicore', () => ({
  ...jest.requireActual('@harness/uicore'),
  useToaster: () => ({
    showSuccess: jest.fn(),
    showError
  })
}))

describe('EnvironmentsGrid', () => {
  test('renders Environment Grid', () => {
    const { container } = render(
      <TestWrapper>
        <EnvironmentsGrid response={mockEnvironments.data} refetch={jest.fn()} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})

describe('EnvironmentCardGrid', () => {
  test('should be possible to edit from Environment Card menu', async () => {
    const { getByTestId } = render(
      <TestWrapper
        path={routes.toEnvironment({ ...projectPathProps, ...modulePathProps })}
        pathParams={{ accountId: 'dummy', module: 'cd', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <EnvironmentsGrid response={mockEnvironments.data} refetch={jest.fn()} />
      </TestWrapper>
    )

    fireEvent.click(screen.getAllByRole('button', { name: /more/i })[0])
    fireEvent.click(screen.getAllByText(/edit/i)[0])
    await waitFor(() => getByTestId('location'))

    expect(getByTestId('location')).toHaveTextContent(
      '/account/dummy/cd/orgs/dummy/projects/dummy/environment/gjhjghjhg/details?sectionId=CONFIGURATION'
    )
  })

  test('should be possible to delete from Environment Card menu', async () => {
    render(
      <TestWrapper
        path={routes.toEnvironment({ ...projectPathProps, ...modulePathProps })}
        pathParams={{ accountId: 'dummy', module: 'cd', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <EnvironmentsGrid response={mockEnvironments.data} refetch={jest.fn()} />
      </TestWrapper>
    )

    fireEvent.click(screen.getAllByRole('button', { name: /more/i })[0])
    fireEvent.click(screen.getAllByText(/delete/i)[0])
    const form = findDialogContainer() as HTMLElement
    expect(form).toBeTruthy()
    expect(getByText(form, 'delete')).toBeInTheDocument()
    fireEvent.click(getByText(form, 'delete') as HTMLButtonElement)
    await waitFor(() => expect(deleteEnvironment).toBeCalledTimes(1))
  })

  test('Error handling during the deletion of items from the Environment Card Menu', async () => {
    mockImport('services/cd-ng', {
      useDeleteEnvironmentV2: () => ({
        mutate: jest.fn().mockRejectedValue({
          message: 'Something went wrong!'
        })
      })
    })

    render(
      <TestWrapper
        path={routes.toEnvironment({ ...projectPathProps, ...modulePathProps })}
        pathParams={{ accountId: 'dummy', module: 'cd', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <EnvironmentsGrid response={mockEnvironments.data} refetch={jest.fn()} />
      </TestWrapper>
    )

    fireEvent.click(screen.getAllByRole('button', { name: /more/i })[0])
    fireEvent.click(screen.getAllByText(/delete/i)[0])
    const form = findDialogContainer() as HTMLElement
    expect(form).toBeTruthy()
    expect(getByText(form, 'delete')).toBeInTheDocument()
    fireEvent.click(getByText(form, 'delete') as HTMLButtonElement)
    await waitFor(() => expect(showError).toHaveBeenCalled())
  })
})
