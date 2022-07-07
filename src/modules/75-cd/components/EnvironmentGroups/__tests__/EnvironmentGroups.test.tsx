/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import * as cdNgServices from 'services/cd-ng'

import routes from '@common/RouteDefinitions'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import { modulePathProps, projectPathProps } from '@common/utils/routeUtils'

import EnvironmentGroupsPage from '../EnvironmentGroups'

import environmentGroupsData from './__mocks__/environmentGroups.json'
import filtersData from './__mocks__/filtersMockData.json'
import environmentsListData from './__mocks__/environmentsListForProject.json'

function getResolutionHelper(data: any, loading: boolean) {
  return { data, loading } as any
}

function postResolutionHelper(data: any, loading: boolean) {
  let mutateFn = jest.fn()
  if (data) {
    mutateFn = jest.fn().mockResolvedValue(data)
  }
  return {
    loading,
    mutate: mutateFn,
    cancel: jest.fn(),
    error: null
  } as any
}

const intersectionObserverMock = () => ({
  observe: () => null,
  unobserve: () => null
})

window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock)

describe('Environment Group Tests', () => {
  beforeEach(() => {
    jest
      .spyOn(cdNgServices, 'useGetEnvironmentGroupList')
      .mockImplementation(() => postResolutionHelper(environmentGroupsData, false))
    jest.spyOn(cdNgServices, 'useGetFilterList').mockImplementation(() => postResolutionHelper(filtersData, false))
    jest
      .spyOn(cdNgServices, 'useGetEnvironmentListForProject')
      .mockImplementation(() => getResolutionHelper(environmentsListData, false))
    jest.spyOn(cdNgServices, 'usePostFilter').mockImplementation(() => postResolutionHelper(null, false))
    jest.spyOn(cdNgServices, 'useUpdateFilter').mockImplementation(() => postResolutionHelper(null, false))
    jest.spyOn(cdNgServices, 'useDeleteFilter').mockImplementation(() => postResolutionHelper(null, false))
    jest.spyOn(cdNgServices, 'useGetYamlSchema').mockImplementation(() => getResolutionHelper(null, false))

    jest.mock('@common/exports', () => ({
      useToaster: () => ({
        showSuccess: jest.fn(),
        showError: jest.fn(),
        clear: jest.fn()
      })
    }))
  })

  test('first render and search term change', async () => {
    const { container } = render(
      <TestWrapper
        path={routes.toEnvironmentGroups({ ...projectPathProps, ...modulePathProps })}
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy', module: 'cd' }}
      >
        <EnvironmentGroupsPage />
      </TestWrapper>
    )

    await waitFor(() => expect(screen.queryByText('Env Group 1')).toBeInTheDocument())

    expect(container).toMatchSnapshot()

    const searchInput = screen.queryByPlaceholderText('search')
    await userEvent.type(searchInput!, 'test')

    expect((searchInput as HTMLInputElement)?.value).toEqual('test')
  })

  test('opens create environment group modal', async () => {
    jest.spyOn(cdNgServices, 'getEnvironmentListPromise').mockImplementation(() =>
      Promise.resolve({
        data: {
          content: [
            {
              lastModifiedAt: 123456789,
              createdAt: 123456789,
              environment: {
                name: 'Env 1',
                identifier: 'Env_1',
                tags: {
                  tag1: ''
                }
              }
            }
          ]
        }
      })
    )
    jest.spyOn(cdNgServices, 'useGetYamlSchema').mockImplementation(() => getResolutionHelper(null, false))

    await act(async () => {
      render(
        <TestWrapper
          path={routes.toEnvironmentGroups({ ...projectPathProps, ...modulePathProps })}
          pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy', module: 'cd' }}
        >
          <EnvironmentGroupsPage />
        </TestWrapper>
      )

      const createButton = screen.queryByTestId('add-environment-group')
      await waitFor(() => expect(createButton).toBeInTheDocument())

      fireEvent.click(createButton!)
    })

    const dialog = findDialogContainer() as HTMLElement
    await waitFor(() => expect(dialog).toBeInTheDocument())

    expect(dialog).toMatchSnapshot()
  })

  test('search term change', async () => {
    act(() => {
      render(
        <TestWrapper
          path={routes.toEnvironmentGroups({ ...projectPathProps, ...modulePathProps })}
          pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy', module: 'cd' }}
          queryParams={{ searchTerm: '' }}
        >
          <EnvironmentGroupsPage />
        </TestWrapper>
      )
    })

    await waitFor(() => expect(screen.queryByText('Env Group 1')).toBeInTheDocument())
    const searchInput = screen.queryByPlaceholderText('search')
    await userEvent.type(searchInput!, 'test')

    await waitFor(() =>
      expect(cdNgServices.useGetEnvironmentGroupList).toHaveBeenCalledWith({
        body: {
          filterType: 'EnvironmentGroup'
        },
        queryParamStringifyOptions: {
          arrayFormat: 'comma'
        },
        queryParams: {
          accountIdentifier: 'dummy',
          filterIdentifier: undefined,
          orgIdentifier: 'dummy',
          page: 0,
          projectIdentifier: 'dummy',
          searchTerm: 'test',
          size: 10,
          sort: ['lastModifiedAt', 'DESC']
        }
      })
    )

    await userEvent.type(searchInput!, '')
    await waitFor(() =>
      expect(cdNgServices.useGetEnvironmentGroupList).toHaveBeenCalledWith({
        body: {
          filterType: 'EnvironmentGroup'
        },
        queryParamStringifyOptions: {
          arrayFormat: 'comma'
        },
        queryParams: {
          accountIdentifier: 'dummy',
          filterIdentifier: undefined,
          orgIdentifier: 'dummy',
          page: 0,
          projectIdentifier: 'dummy',
          searchTerm: '',
          size: 10,
          sort: ['lastModifiedAt', 'DESC']
        }
      })
    )
  })

  test('sort change', async () => {
    await act(async () => {
      render(
        <TestWrapper
          path={routes.toEnvironmentGroups({ ...projectPathProps, ...modulePathProps })}
          pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy', module: 'cd' }}
        >
          <EnvironmentGroupsPage />
        </TestWrapper>
      )
      await waitFor(() => expect(screen.queryByText('Env Group 1')).toBeInTheDocument())
    })

    const sortDropdown = screen.queryByTestId('dropdown-button')
    fireEvent.click(sortDropdown!)

    const sortAscText = screen.queryByText('AZ09')
    fireEvent.click(sortAscText!)

    await waitFor(() =>
      expect(cdNgServices.useGetEnvironmentGroupList).toHaveBeenCalledWith({
        body: {
          filterType: 'EnvironmentGroup'
        },
        queryParamStringifyOptions: {
          arrayFormat: 'comma'
        },
        queryParams: {
          accountIdentifier: 'dummy',
          filterIdentifier: undefined,
          orgIdentifier: 'dummy',
          page: 0,
          projectIdentifier: 'dummy',
          searchTerm: undefined,
          size: 10,
          sort: ['name', 'ASC']
        }
      })
    )

    fireEvent.click(sortDropdown!)

    const sortDescText = screen.queryByText('ZA90')
    fireEvent.click(sortDescText!)

    await waitFor(() =>
      expect(cdNgServices.useGetEnvironmentGroupList).toHaveBeenCalledWith({
        body: {
          filterType: 'EnvironmentGroup'
        },
        queryParamStringifyOptions: {
          arrayFormat: 'comma'
        },
        queryParams: {
          accountIdentifier: 'dummy',
          filterIdentifier: undefined,
          orgIdentifier: 'dummy',
          page: 0,
          projectIdentifier: 'dummy',
          searchTerm: undefined,
          size: 10,
          sort: ['name', 'DESC']
        }
      })
    )

    fireEvent.click(sortDropdown!)

    const sortByLastUpdated = screen.queryByText('lastUpdatedSort')
    fireEvent.click(sortByLastUpdated!)

    await waitFor(() =>
      expect(cdNgServices.useGetEnvironmentGroupList).toHaveBeenCalledWith({
        body: {
          filterType: 'EnvironmentGroup'
        },
        queryParamStringifyOptions: {
          arrayFormat: 'comma'
        },
        queryParams: {
          accountIdentifier: 'dummy',
          filterIdentifier: undefined,
          orgIdentifier: 'dummy',
          page: 0,
          projectIdentifier: 'dummy',
          searchTerm: undefined,
          size: 10,
          sort: ['lastModifiedAt', 'DESC']
        }
      })
    )
  })
})
