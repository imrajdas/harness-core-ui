/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act, fireEvent, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { ConfigModalProps, TemplateConfigModal } from '../TemplateConfigModal'

const getProps = (): ConfigModalProps => ({
  onClose: jest.fn(),
  initialValues: {
    name: '',
    type: 'Step',
    identifier: '-1',
    versionLabel: 'v1'
  },
  modalProps: {
    title: 'Some Title',
    promise: Promise.resolve
  },
  gitDetails: {
    repoIdentifier: 'test_repo',
    branch: 'test_branch',
    getDefaultFromOtherRepo: true
  },
  submitButtonLabel: 'start'
})

describe('CREATE MODE', () => {
  test('VALIDATIONS', async () => {
    const props = getProps()
    const { container, getByText, queryByText } = render(
      <TestWrapper>
        <TemplateConfigModal {...props} />
      </TestWrapper>
    )
    act(() => {
      fireEvent.change(container.querySelector('input[name="name"]')!, { target: { value: '' } })
    })
    act(() => {
      fireEvent.click(getByText('start'))
    })
    await waitFor(() => expect(queryByText('common.validation.fieldIsRequired')).toBeTruthy())
  })

  test('if form changesupdate the preview card', async () => {
    const props = getProps()
    const { container } = render(
      <TestWrapper>
        <TemplateConfigModal {...props} />
      </TestWrapper>
    )
    act(() => {
      fireEvent.change(container.querySelector('input[name="name"]')!, { target: { value: 'templatename' } })
    })
    expect(container).toMatchSnapshot('changed value should be present in the preview')
  })

  test('if form closes', async () => {
    const props = getProps()
    const { container, getByText } = render(
      <TestWrapper>
        <TemplateConfigModal {...props} />
      </TestWrapper>
    )
    act(() => {
      fireEvent.click(getByText('cancel'))
    })
    await waitFor(() => expect(props.onClose).toBeCalled())

    const crossIcon = container.querySelector('span[icon="cross"]')
    act(() => {
      fireEvent.click(crossIcon!)
    })
    await waitFor(() => expect(props.onClose).toBeCalled())
  })
})
