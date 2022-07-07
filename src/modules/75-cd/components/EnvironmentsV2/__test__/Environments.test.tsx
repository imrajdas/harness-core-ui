/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as cdNgServices from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import { modulePathProps, projectPathProps } from '@common/utils/routeUtils'
import { TestWrapper } from '@common/utils/testUtils'
import { Environments } from '../Environments'
import mockEnvironments from '../__mocks__/environments.json'

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

jest.spyOn(cdNgServices, 'useDeleteEnvironmentV2').mockImplementation(() => postResolutionHelper({}, false))
jest
  .spyOn(cdNgServices, 'useGetEnvironmentListForProject')
  .mockImplementation(() => getResolutionHelper(mockEnvironments, false))

jest.spyOn(cdNgServices, 'useGetFilterList').mockImplementation(() => postResolutionHelper({}, false))
jest.spyOn(cdNgServices, 'usePostFilter').mockImplementation(() => postResolutionHelper(null, false))
jest.spyOn(cdNgServices, 'useUpdateFilter').mockImplementation(() => postResolutionHelper(null, false))
jest.spyOn(cdNgServices, 'useDeleteFilter').mockImplementation(() => postResolutionHelper(null, false))

describe('Environments V2 test', () => {
  test('snapshot test with list view and after sort', async () => {
    jest.spyOn(cdNgServices, 'useGetEnvironmentListV2').mockImplementation(() => {
      return postResolutionHelper(mockEnvironments, false)
    })

    const { container } = render(
      <TestWrapper
        path={routes.toEnvironment({
          ...projectPathProps,
          ...modulePathProps
        })}
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy', module: 'dummy' }}
        defaultFeatureFlagValues={{
          NG_SVC_ENV_REDESIGN: true
        }}
      >
        <Environments />
      </TestWrapper>
    )

    const sortButton = screen.queryByTestId('dropdown-button')
    await waitFor(() => expect(sortButton).toBeInTheDocument())

    userEvent.click(sortButton!)
    const sortAscending = screen.queryByText('AZ09')
    userEvent.click(sortAscending!)

    expect(container).toMatchSnapshot()

    const gridToggle = screen.getByTestId('grid-view')
    await waitFor(() => expect(gridToggle).toBeInTheDocument())

    userEvent.click(gridToggle!)
    await waitFor(() => {
      expect(screen.getByText('Env 2')).toBeInTheDocument()
    })
    expect(container).toMatchSnapshot()
  })

  test('view with no data', async () => {
    jest.spyOn(cdNgServices, 'useGetEnvironmentListV2').mockImplementation(() => {
      return postResolutionHelper(
        {
          data: {
            empty: true
          }
        },
        false
      )
    })

    const { container } = render(
      <TestWrapper
        path={routes.toEnvironment({
          ...projectPathProps,
          ...modulePathProps
        })}
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy', module: 'dummy' }}
        defaultFeatureFlagValues={{
          NG_SVC_ENV_REDESIGN: true
        }}
      >
        <Environments />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('cd.noEnvironment.title')).toBeInTheDocument()
    })

    expect(container).toMatchSnapshot()
  })
})
