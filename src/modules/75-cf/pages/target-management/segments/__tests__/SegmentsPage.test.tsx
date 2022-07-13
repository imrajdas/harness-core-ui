/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, getAllByText, getByText, render, screen, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import mockEnvironments from '@cf/pages/environments/__tests__/mockEnvironments'
import mockImport from 'framework/utils/mockImport'
import { SegmentsPage } from '../SegmentsPage'

// eslint-disable-next-line jest/no-disabled-tests
describe('SegmentsPage', () => {
  test('SegmentsPage should render loading correctly 1', async () => {
    mockImport('services/cf', {
      useGetAllSegments: () => ({ loading: true, refetch: jest.fn() })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <SegmentsPage />
      </TestWrapper>
    )

    expect(container.querySelector('[data-icon="steps-spinner"]')).toBeDefined()
  })

  test('SegmentsPage should render loading correctly 2', async () => {
    mockImport('services/cf', {
      useGetAllSegments: () => ({ loading: false, data: { segments: [] }, refetch: jest.fn() })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <SegmentsPage />
      </TestWrapper>
    )

    expect(container.querySelector('[data-icon="steps-spinner"]')).toBeDefined()
  })

  test('SegmentsPage should render loading correctly 3', async () => {
    mockImport('services/cf', {
      useGetAllSegments: () => ({ loading: true, refetch: jest.fn() })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        environments: [],
        loading: false,
        error: undefined,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <SegmentsPage />
      </TestWrapper>
    )

    expect(container.querySelector('[data-icon="steps-spinner"]')).toBeDefined()
  })

  test('SegmentsPage should render error correctly 1', async () => {
    const error = { message: 'SOME ERROR OCCURS' }
    mockImport('services/cf', {
      useGetAllSegments: () => ({ error, loading: false, refetch: jest.fn() })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        environments: [{}],
        loading: false,
        error: undefined,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <SegmentsPage />
      </TestWrapper>
    )

    expect(getByText(document.body, error.message)).toBeDefined()
  })

  test('SegmentsPage should render error correctly 2', async () => {
    const error = { message: 'SOME ERROR OCCURS' }
    mockImport('services/cf', {
      useGetAllSegments: () => ({ data: [], loading: false, refetch: jest.fn() })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        environments: undefined,
        loading: false,
        error,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <SegmentsPage />
      </TestWrapper>
    )

    expect(getByText(document.body, error.message)).toBeDefined()
  })

  test('SegmentsPage should render data correctly', async () => {
    const tableHeaders = ['CF.SHARED.SEGMENT', 'IDENTIFIER', 'CF.TARGETS.CREATEDDATE']

    mockImport('services/cf', {
      useGetAllSegments: () => ({
        data: {
          segments: [
            {
              createdAt: 1619397730112,
              environment: 'QA',
              excluded: [],
              identifier: 'segment1',
              included: [],
              name: 'segment1 name',
              rules: []
            }
          ]
        },
        loading: false,
        refetch: jest.fn()
      })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        environments: mockEnvironments,
        loading: false,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <SegmentsPage />
      </TestWrapper>
    )

    expect(screen.getByText('segment1 name')).toBeInTheDocument()
    expect(screen.getByText('segment1')).toBeInTheDocument()
    tableHeaders.forEach(header => {
      expect(screen.getByText(header)).toBeInTheDocument()
    })
  })

  test('No data view should be rendered', async () => {
    mockImport('services/cf', {
      useGetAllSegments: () => ({
        data: { segments: [] },
        loading: false,
        refetch: jest.fn()
      })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        environments: mockEnvironments,
        loading: false,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <SegmentsPage />
      </TestWrapper>
    )

    expect(screen.getByTestId('nodata-image')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'plus cf.segments.create' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'cf.segments.noTargetGroupsForEnv' })).toBeInTheDocument()
  })

  test('No environment view should be rendered', async () => {
    mockImport('services/cf', {
      useGetAllSegments: () => ({
        data: { segments: [] },
        loading: false,
        refetch: jest.fn()
      })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        environments: [],
        loading: false,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <SegmentsPage />
      </TestWrapper>
    )

    expect(screen.getByTestId('nodata-image')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'plus newEnvironment' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'cf.noEnvironment.title' })).toBeInTheDocument()
  })

  test('Should go to edit page by clicking a row', async () => {
    mockImport('services/cf', {
      useGetAllSegments: () => ({
        data: {
          segments: [
            {
              createdAt: 1619397730112,
              environment: 'QA',
              excluded: [],
              identifier: 'segment1',
              included: [],
              name: 'segment1',
              rules: []
            }
          ]
        },
        loading: false,
        refetch: jest.fn()
      })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        environments: mockEnvironments,
        loading: false,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/target-management/target-groups"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <SegmentsPage />
      </TestWrapper>
    )

    await waitFor(() => expect(getAllByText(container, 'segment1')).toBeTruthy())

    fireEvent.click(container.getElementsByClassName('TableV2--row TableV2--card TableV2--clickable')[0] as HTMLElement)

    expect(
      getByText(container, '/account/dummy/cf/orgs/dummy/projects/dummy/target-management/target-groups/segment1')
    ).toBeDefined()
  })

  test('Should go to edit page by clicking edit', async () => {
    mockImport('services/cf', {
      useGetAllSegments: () => ({
        data: {
          segments: [
            {
              createdAt: 1619397730112,
              environment: 'QA',
              excluded: [],
              identifier: 'segment1',
              included: [],
              name: 'segment1',
              rules: []
            }
          ]
        },
        loading: false,
        refetch: jest.fn()
      })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        environments: mockEnvironments,
        loading: false,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/target-management/target-groups"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <SegmentsPage />
      </TestWrapper>
    )

    await waitFor(() => expect(getAllByText(container, 'segment1')).toBeTruthy())

    fireEvent.click(container.querySelector('[data-icon="Options"]') as HTMLElement)
    fireEvent.click(document.querySelector('[icon="edit"]') as HTMLElement)

    expect(
      getByText(container, '/account/dummy/cf/orgs/dummy/projects/dummy/target-management/target-groups/segment1')
    ).toBeDefined()
  })

  test('Should allow deleting', async () => {
    const mutate = jest.fn(() => {
      return Promise.resolve({ data: {} })
    })

    mockImport('services/cf', {
      useGetAllSegments: () => ({
        data: {
          segments: [
            {
              createdAt: 1619397730112,
              environment: 'QA',
              excluded: [],
              identifier: 'segment1',
              included: [],
              name: 'segment1',
              rules: []
            }
          ]
        },
        loading: false,
        refetch: jest.fn()
      }),
      useDeleteSegment: () => ({ mutate })
    })

    mockImport('@cf/hooks/useEnvironmentSelectV2', {
      useEnvironmentSelectV2: () => ({
        environments: mockEnvironments,
        loading: false,
        refetch: jest.fn(),
        EnvironmentSelect: function EnvironmentSelect() {
          return <div />
        }
      })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/target-management/target-groups"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <SegmentsPage />
      </TestWrapper>
    )

    await waitFor(() => expect(getAllByText(container, 'segment1')).toBeTruthy())

    fireEvent.click(container.querySelector('[data-icon="Options"]') as HTMLElement)
    fireEvent.click(document.querySelector('[icon="trash"]') as HTMLElement)

    fireEvent.click(document.querySelector('button[class*=intent-danger]') as HTMLButtonElement)
    await waitFor(() => expect(mutate).toBeCalledTimes(1))
  })
})
