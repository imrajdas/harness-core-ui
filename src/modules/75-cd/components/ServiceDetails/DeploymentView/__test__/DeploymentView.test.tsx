/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import * as cdngServices from 'services/cd-ng'
import { Deployments } from '../DeploymentView'
import dataMock from '../dataMock.json'

describe('DeploymentView ', () => {
  test('render recent deployment info', () => {
    jest.spyOn(cdngServices, 'useGetEnvArtifactDetailsByServiceId').mockImplementation(() => {
      return {
        data: dataMock
      } as any
    })
    const { getByText } = render(
      <TestWrapper>
        <Deployments />
      </TestWrapper>
    )

    //check if table header are visible
    expect(getByText('cd.serviceDashboard.headers.environment')).toBeTruthy()
    expect(getByText('cd.serviceDashboard.headers.artifactVersion')).toBeTruthy()

    //check if table rows are visible

    //value is environment column
    expect(getByText('NewEnv')).toBeTruthy()

    //corresponding artifact version
    expect(getByText('perl')).toBeTruthy()
  })

  test('render no deployment info', () => {
    jest.spyOn(cdngServices, 'useGetEnvArtifactDetailsByServiceId').mockImplementation(() => {
      return {
        mutate: () => Promise.resolve({ loading: false, data: [] })
      } as any
    })
    const { getByText } = render(
      <TestWrapper>
        <Deployments />
      </TestWrapper>
    )

    //check if empty state text is visible
    expect(getByText('pipeline.dashboards.noActiveDeployments')).toBeTruthy()
  })

  test('loading true', () => {
    jest.spyOn(cdngServices, 'useGetEnvArtifactDetailsByServiceId').mockImplementation(() => {
      return {
        loading: true,
        data: []
      } as any
    })
    const { container, getByText } = render(
      <TestWrapper>
        <Deployments />
      </TestWrapper>
    )

    //check if loadin text is visible
    expect(getByText('Loading, please wait...')).toBeTruthy()

    // check if loading spinner visible
    const loadingIcon = container.querySelector('[data-icon="steps-spinner"]')
    expect(loadingIcon).toBeTruthy()
  })

  test('render when error', () => {
    jest.spyOn(cdngServices, 'useGetEnvArtifactDetailsByServiceId').mockImplementation(() => {
      return {
        loading: false,
        data: [],
        error: true,
        refetch: jest.fn()
      } as any
    })
    const { getByText } = render(
      <TestWrapper>
        <Deployments />
      </TestWrapper>
    )

    fireEvent.click(getByText('Retry'))

    // check if error message is visible
    expect(getByText('We cannot perform your request at the moment. Please try again.')).toBeTruthy()
  })
})
