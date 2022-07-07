/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'

import { TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { environmentPathProps, modulePathProps, projectPathProps } from '@common/utils/routeUtils'
import EnvironmentDetails from '../EnvironmentDetails'

import mockEnvironmentDetail from './__mocks__/mockEnvironmentDetail.json'

jest.mock('services/cd-ng', () => ({
  useGetEnvironmentV2: jest.fn().mockImplementation(() => {
    return {
      data: mockEnvironmentDetail,
      refetch: jest.fn()
    }
  }),
  useGetYamlSchema: jest.fn().mockImplementation(() => {
    return {
      data: {
        name: 'testenv',
        identifier: 'test-env',
        lastModifiedAt: ''
      },
      refetch: jest.fn()
    }
  })
}))

describe('EnvironmentDetails tests', () => {
  test('initial render', () => {
    const { container } = render(
      <TestWrapper
        path={routes.toEnvironmentDetails({
          ...projectPathProps,
          ...modulePathProps,
          ...environmentPathProps
        })}
        pathParams={{
          accountId: 'dummy',
          projectIdentifier: 'dummy',
          orgIdentifier: 'dummy',
          module: 'cd',
          environmentIdentifier: 'Env_1',
          sectionId: 'CONFIGURATION'
        }}
      >
        <EnvironmentDetails />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })
})
