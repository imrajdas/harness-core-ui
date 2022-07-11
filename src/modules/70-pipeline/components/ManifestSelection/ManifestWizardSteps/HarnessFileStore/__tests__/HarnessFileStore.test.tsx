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
  getByText as getElementByText,
  queryByText
} from '@testing-library/react'
import { MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import userEvent from '@testing-library/user-event'
import { omit } from 'lodash-es'
import { TestWrapper } from '@common/utils/testUtils'
import { ManifestDataType } from '@pipeline/components/ManifestSelection/Manifesthelper'
import type { ManifestTypes } from '@pipeline/components/ManifestSelection/ManifestInterface'
import HarnessFileStore from '../HarnessFileStore'

jest.mock('uuid')
jest.mock('services/portal', () => ({
  useGetDelegateSelectorsUpTheHierarchy: jest
    .fn()
    .mockImplementation(() => ['delegate-selector', 'delegate1', 'delegate2'])
}))

const props = {
  stepName: 'Manifest details',
  expressions: [],
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  handleSubmit: jest.fn(),
  selectedManifest: 'K8sManifest' as ManifestTypes,
  manifestIdsList: [],
  isReadonly: false,
  prevStepData: {}
}
const initialValues = {
  identifier: '',
  spec: {},
  type: ManifestDataType.K8sManifest,
  files: [],
  valuesPaths: []
}

describe('Custom remote tests', () => {
  beforeEach(() => jest.spyOn(uuid, 'v5').mockReturnValue('MockedUUID'))

  test('initial rendering', () => {
    const { container } = render(
      <TestWrapper>
        <HarnessFileStore {...props} initialValues={initialValues} />
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
        files: RUNTIME_INPUT_VALUE,
        valuesPaths: RUNTIME_INPUT_VALUE
      },
      prevStepData: {
        store: 'Harness'
      },
      handleSubmit: jest.fn()
    }
    const { container, getByText } = render(
      <TestWrapper>
        <HarnessFileStore {...defaultProps} initialValues={initialValues} />
      </TestWrapper>
    )
    const valuesPaths = getByText('pipeline.manifestType.valuesYamlPath')
    expect(valuesPaths).toBeDefined()
    expect(container).toMatchSnapshot()
  })

  test('submits with right payload', async () => {
    const prevStepData = {
      store: 'Harness'
    }
    const { container } = render(
      <TestWrapper>
        <HarnessFileStore {...props} prevStepData={prevStepData} initialValues={initialValues} />
      </TestWrapper>
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)
    await act(async () => {
      fireEvent.change(queryByNameAttribute('identifier')!, { target: { value: 'testidentifier' } })
    })

    fireEvent.click(container.querySelector('button[type="submit"]')!)
    await waitFor(() => {
      expect(props.handleSubmit).toHaveBeenCalledTimes(1)
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
        type: ManifestDataType.K8sManifest,
        spec: {
          skipResourceVersioning: false,
          valuesPaths: ['test-path'],
          store: {
            spec: {
              files: ['file path']
            },
            type: undefined
          }
        }
      },
      prevStepData: {
        store: 'Harness'
      },
      selectedManifest: 'K8sManifest' as ManifestTypes,
      handleSubmit: jest.fn(),
      previousStep: jest.fn()
    }
    const { getByText } = render(
      <TestWrapper>
        <HarnessFileStore {...defaultProps} />
      </TestWrapper>
    )
    const backButton = getByText('back').parentElement
    userEvent.click(backButton!)
    await waitFor(() => expect(defaultProps.previousStep).toBeCalled())
    expect(defaultProps.previousStep).toHaveBeenCalledWith(defaultProps.prevStepData)
  })

  test('when extractionScript, skipResourceVersioning and file path is runtime input', async () => {
    const defaultProps = {
      ...props,
      stepName: 'Manifest details',
      expressions: [],
      initialValues: {
        identifier: 'test',
        spec: {
          valuesPaths: ['values-path'],
          store: {
            spec: {
              files: RUNTIME_INPUT_VALUE
            }
          }
        },
        type: ManifestDataType.HelmChart
      },
      prevStepData: {
        store: 'Harness'
      },
      handleSubmit: jest.fn()
    }
    const { container } = render(
      <TestWrapper>
        <HarnessFileStore {...defaultProps} />
      </TestWrapper>
    )

    const filesInput = queryByAttribute('name', container, 'files') as HTMLInputElement
    expect(filesInput.value).toBe('<+input>')
  })

  test('going back to prev step and submitting to next step works as expected', async () => {
    const defaultProps = {
      stepName: 'Manifest details',
      manifestIdsList: [],
      expressions: [],
      allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
      initialValues: {
        identifier: 'testidentifier',
        type: ManifestDataType.K8sManifest,
        spec: {
          valuesPaths: ['values-path'],
          store: {
            spec: {
              files: RUNTIME_INPUT_VALUE
            }
          }
        }
      },
      prevStepData: {
        store: 'Harness'
      },
      selectedManifest: 'K8sManifest' as ManifestTypes,
      handleSubmit: jest.fn(),
      previousStep: jest.fn()
    }
    const { container, getByText } = render(
      <TestWrapper>
        <HarnessFileStore {...defaultProps} />
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

  test('valuesPaths is not present when selected manifest is of type Values', () => {
    const manifestProps = {
      stepName: 'Manifest details',
      expressions: [],
      allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
      handleSubmit: jest.fn(),
      selectedManifest: 'Values' as ManifestTypes,
      manifestIdsList: [],
      isReadonly: false,
      prevStepData: {}
    }
    const defaultProps = {
      ...manifestProps,
      prevStepData: {
        store: 'Harness'
      },
      initialValues: { ...omit(initialValues, 'type', 'valuesPaths'), type: ManifestDataType.Values },
      handleSubmit: jest.fn()
    }

    const { container } = render(
      <TestWrapper>
        <HarnessFileStore {...defaultProps} />
      </TestWrapper>
    )
    const valuesPathsText = queryByText(container, 'pipeline.manifestType.valuesYamlPath')
    expect(valuesPathsText).toBeNull()
  })
})
