/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import * as uuid from 'uuid'
import {
  act,
  fireEvent,
  queryByAttribute,
  render,
  waitFor,
  getByText as getElementByText
} from '@testing-library/react'
import { MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import { ManifestDataType } from '@pipeline/components/ManifestSelection/Manifesthelper'
import type { ManifestTypes } from '@pipeline/components/ManifestSelection/ManifestInterface'
import InheritFromManifest from '../InheritFromManifest'

jest.mock('uuid')

const props = {
  stepName: 'Manifest details',
  expressions: [],
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  handleSubmit: jest.fn(),
  selectedManifest: 'Values' as ManifestTypes,
  manifestIdsList: [],
  isReadonly: false,
  prevStepData: {}
}
const initialValues = {
  identifier: '',
  spec: {},
  type: ManifestDataType.Values,
  paths: []
}

describe('Custom remote tests', () => {
  beforeEach(() => jest.spyOn(uuid, 'v5').mockReturnValue('MockedUUID'))

  test('initial rendering', () => {
    const { container } = render(
      <TestWrapper>
        <InheritFromManifest {...props} initialValues={initialValues} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('when fields are runtime input', () => {
    const defaultProps = {
      ...props,
      stepName: 'Manifest details',
      expressions: [],
      initialValues: {
        identifier: 'test',
        paths: ['test']
      },
      prevStepData: {
        store: 'InheritFromManifest'
      },
      handleSubmit: jest.fn()
    }
    const { container, getByText } = render(
      <TestWrapper>
        <InheritFromManifest {...defaultProps} initialValues={initialValues} />
      </TestWrapper>
    )
    const pathsText = getByText('fileFolderPathText')
    expect(pathsText).toBeDefined()
    expect(container).toMatchSnapshot()
  })

  test('submits with right payload', async () => {
    const prevStepData = {
      store: 'InheritFromManifest'
    }
    const { container } = render(
      <TestWrapper>
        <InheritFromManifest {...props} prevStepData={prevStepData} initialValues={initialValues} />
      </TestWrapper>
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)
    await act(async () => {
      fireEvent.change(queryByNameAttribute('identifier')!, { target: { value: 'testidentifier' } })
      fireEvent.change(queryByNameAttribute('paths[0].path')!, { target: { value: 'test-path' } })
    })
    fireEvent.click(container.querySelector('button[type="submit"]')!)
    await waitFor(() => {
      expect(props.handleSubmit).toHaveBeenCalledTimes(1)
      expect(props.handleSubmit).toHaveBeenCalledWith({
        manifest: {
          identifier: 'testidentifier',
          type: 'Values',
          spec: {
            store: {
              spec: {
                paths: ['test-path']
              },
              type: 'InheritFromManifest'
            }
          }
        }
      })
    })
  })

  test('renders form in edit mode', async () => {
    const defaultProps = {
      stepName: 'Manifest details',
      manifestIdsList: [],
      expressions: [],
      allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
      initialValues: {
        identifier: 'testidentifier',
        type: ManifestDataType.KustomizePatches,
        spec: {
          store: {
            spec: {
              paths: ['file-path']
            },
            type: undefined
          }
        }
      },
      prevStepData: {
        store: 'InheritFromManifest'
      },
      selectedManifest: 'Values' as ManifestTypes,
      handleSubmit: jest.fn(),
      previousStep: jest.fn()
    }
    const { getByText } = render(
      <TestWrapper>
        <InheritFromManifest {...defaultProps} />
      </TestWrapper>
    )
    const backButton = getByText('back').parentElement
    userEvent.click(backButton!)
    await waitFor(() => expect(defaultProps.previousStep).toBeCalled())
    expect(defaultProps.previousStep).toHaveBeenCalledWith(defaultProps.prevStepData)
  })

  test('when paths is runtime input', async () => {
    const defaultProps = {
      ...props,
      stepName: 'Manifest details',
      expressions: [],
      initialValues: {
        identifier: 'test',
        spec: {
          store: {
            spec: {
              paths: RUNTIME_INPUT_VALUE
            }
          }
        },
        type: ManifestDataType.OpenshiftParam
      },
      prevStepData: {
        store: 'InheritFromManifest'
      },
      handleSubmit: jest.fn()
    }
    const { container } = render(
      <TestWrapper>
        <InheritFromManifest {...defaultProps} />
      </TestWrapper>
    )

    const pathsInput = queryByAttribute('name', container, 'paths') as HTMLInputElement
    expect(pathsInput.value).toBe('<+input>')
  })

  test('going back to prev step and submitting to next step works as expected', async () => {
    const defaultProps = {
      stepName: 'Manifest details',
      manifestIdsList: [],
      expressions: [],
      allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
      initialValues: {
        identifier: 'testidentifier',
        type: ManifestDataType.Values,
        spec: {
          store: {
            spec: {
              paths: RUNTIME_INPUT_VALUE
            }
          }
        }
      },
      prevStepData: {
        store: 'InheritFromManifest'
      },
      selectedManifest: 'Values' as ManifestTypes,
      handleSubmit: jest.fn(),
      previousStep: jest.fn()
    }
    const { container, getByText } = render(
      <TestWrapper>
        <InheritFromManifest {...defaultProps} />
      </TestWrapper>
    )
    const backButton = getByText('back').parentElement
    userEvent.click(backButton!)
    await waitFor(() => expect(defaultProps.previousStep).toBeCalled())
    expect(defaultProps.previousStep).toHaveBeenCalledWith(defaultProps.prevStepData)
    const submitButton = getElementByText(container, 'submit')
    userEvent.click(submitButton!)
    const titleText = getElementByText(container, 'Manifest details')
    expect(titleText).toBeDefined()
  })
})
