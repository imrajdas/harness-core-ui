/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

import { TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { modulePathProps, projectPathProps } from '@common/utils/routeUtils'

import NoData from '../NoData'

const defaultProps = {
  searchTerm: '',
  hasFilters: false,
  clearFilters: jest.fn()
}

describe('No Data', () => {
  test('no data exist', () => {
    render(
      <TestWrapper
        path={routes.toEnvironment({ ...projectPathProps, ...modulePathProps })}
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy', module: 'cd' }}
      >
        <NoData {...defaultProps} emptyContent={<div>No Data</div>} />
      </TestWrapper>
    )
    expect(screen.queryByText('No Data')).toBeInTheDocument()
  })

  test('search returns empty result', () => {
    render(
      <TestWrapper
        path={routes.toEnvironment({ ...projectPathProps, ...modulePathProps })}
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy', module: 'cd' }}
      >
        <NoData {...defaultProps} searchTerm={'test'} emptyContent={<div>No Data</div>} />
      </TestWrapper>
    )

    expect(screen.queryByText('common.searchOther')).toBeInTheDocument()
  })

  test('filter returns empty result', async () => {
    render(
      <TestWrapper
        path={routes.toEnvironment({ ...projectPathProps, ...modulePathProps })}
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy', module: 'cd' }}
      >
        <NoData {...defaultProps} hasFilters={true} emptyContent={<div>No Data</div>} />
      </TestWrapper>
    )

    await expect(screen.queryByText('common.filters.clearFilters')).toBeInTheDocument()
  })
})
