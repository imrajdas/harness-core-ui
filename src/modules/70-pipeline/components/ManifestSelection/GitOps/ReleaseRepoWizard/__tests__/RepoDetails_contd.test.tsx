/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@harness/uicore'

import { TestWrapper } from '@common/utils/testUtils'

import RepoDetails from '../RepoDetails'

describe('RepoDetails contd testing', () => {
  test(`on submit when runtime values for branch and paths`, async () => {
    const submitFn = jest.fn()
    const { container } = render(
      <TestWrapper>
        <RepoDetails
          name={'RepoDetails'}
          stepName={'second step'}
          expressions={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          isReadonly={false}
          prevStepData={{
            connectorRef: RUNTIME_INPUT_VALUE,
            gitFetchType: 'Branch',
            identifier: 'test',
            paths: RUNTIME_INPUT_VALUE,
            branch: RUNTIME_INPUT_VALUE
          }}
          initialValues={{
            identifier: 'test',
            branch: RUNTIME_INPUT_VALUE,
            gitFetchType: 'Branch',
            paths: RUNTIME_INPUT_VALUE
          }}
          manifest={{
            identifier: 'test',
            type: 'ReleaseRepo',
            spec: {
              store: {
                type: 'Git',
                spec: {
                  connectorRef: RUNTIME_INPUT_VALUE,
                  gitFetchType: 'Branch',
                  paths: RUNTIME_INPUT_VALUE,
                  branch: RUNTIME_INPUT_VALUE
                }
              }
            }
          }}
          handleSubmit={submitFn}
        />
      </TestWrapper>
    )
    fireEvent.click(container.querySelector('button[type="submit"]')!)
    await waitFor(() => {
      expect(submitFn).toBeCalled()
      expect(submitFn).toHaveBeenCalledWith({
        manifest: {
          identifier: 'test',
          type: 'ReleaseRepo',
          spec: {
            store: {
              spec: {
                connectorRef: '<+input>',
                gitFetchType: 'Branch',
                paths: ['<+input>'],
                branch: RUNTIME_INPUT_VALUE
              },
              type: undefined
            }
          }
        }
      })
    })
  })
})

describe('test with commitid', () => {
  test(`click submit with commitid`, async () => {
    const submitFn = jest.fn()
    const { container } = render(
      <TestWrapper>
        <RepoDetails
          name={'RepoDetails'}
          stepName={'second step'}
          expressions={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          isReadonly={false}
          prevStepData={{
            connectorRef: {
              value: 'dsfds'
            },
            identifier: 'test'
          }}
          initialValues={{
            identifier: 'test',

            type: 'ReleaseRepo',

            commitId: 'testbranch',

            gitFetchType: 'Commit',
            paths: 'eqwewq'
          }}
          manifest={{
            identifier: 'test',
            type: 'ReleaseRepo',
            spec: {
              store: {
                type: undefined,
                spec: {
                  connectorRef: 'dsfds',
                  gitFetchType: 'Commit',
                  commitId: 'testbranch',
                  paths: ['eqwewq']
                }
              }
            }
          }}
          handleSubmit={submitFn}
        />
      </TestWrapper>
    )

    fireEvent.click(container.querySelector('button[type="submit"]')!)
    await waitFor(() => {
      expect(submitFn).toBeCalled()
      expect(submitFn).toHaveBeenCalledWith({
        manifest: {
          identifier: 'test',
          type: 'ReleaseRepo',
          spec: {
            store: {
              spec: {
                commitId: 'testbranch',
                connectorRef: 'dsfds',
                gitFetchType: 'Commit',
                paths: ['eqwewq']
              },
              type: undefined
            }
          }
        }
      })
    })
  })
})

describe('test with commitid when no connectorref', () => {
  test(`click submit with commitid when no connectorref`, async () => {
    const submitFn = jest.fn()
    const { container } = render(
      <TestWrapper>
        <RepoDetails
          name={'RepoDetails'}
          stepName={'second step'}
          expressions={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          isReadonly={false}
          prevStepData={{
            identifier: 'test'
          }}
          initialValues={{
            identifier: 'test',

            type: 'ReleaseRepo',

            commitId: 'testbranch',

            gitFetchType: 'Commit',
            paths: 'eqwewq'
          }}
          manifest={{
            identifier: 'test',
            type: 'ReleaseRepo',
            spec: {
              store: {
                type: undefined,
                spec: {
                  connectorRef: 'dsfds',
                  gitFetchType: 'Commit',
                  commitId: 'testbranch',
                  paths: ['eqwewq']
                }
              }
            }
          }}
          handleSubmit={submitFn}
        />
      </TestWrapper>
    )

    fireEvent.click(container.querySelector('button[type="submit"]')!)
    await waitFor(() => {
      expect(submitFn).toBeCalled()
      expect(submitFn).toHaveBeenCalledWith({
        manifest: {
          identifier: 'test',
          type: 'ReleaseRepo',
          spec: {
            store: {
              spec: {
                commitId: 'testbranch',
                connectorRef: 'test',
                gitFetchType: 'Commit',
                paths: ['eqwewq']
              },
              type: undefined
            }
          }
        }
      })
    })
  })
})

describe('test with commitid when no connectorref and identifier', () => {
  test(`click submit with commitid when no connectorref`, async () => {
    const submitFn = jest.fn()
    const { container } = render(
      <TestWrapper>
        <RepoDetails
          name={'RepoDetails'}
          stepName={'second step'}
          expressions={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          isReadonly={false}
          initialValues={{
            identifier: 'test',

            type: 'ReleaseRepo',

            commitId: 'testbranch',

            gitFetchType: 'Commit',
            paths: 'eqwewq'
          }}
          manifest={{
            identifier: 'test',
            type: 'ReleaseRepo',
            spec: {
              store: {
                type: undefined,
                spec: {
                  connectorRef: 'dsfds',
                  gitFetchType: 'Commit',
                  commitId: 'testbranch',
                  paths: ['eqwewq']
                }
              }
            }
          }}
          handleSubmit={submitFn}
        />
      </TestWrapper>
    )

    fireEvent.click(container.querySelector('button[type="submit"]')!)
    await waitFor(() => {
      expect(submitFn).toBeCalled()
      expect(submitFn).toHaveBeenCalledWith({
        manifest: {
          identifier: 'test',
          type: 'ReleaseRepo',
          spec: {
            store: {
              spec: {
                commitId: 'testbranch',
                connectorRef: '',
                gitFetchType: 'Commit',
                paths: ['eqwewq']
              },
              type: undefined
            }
          }
        }
      })
    })
  })
})
