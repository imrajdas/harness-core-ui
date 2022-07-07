/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  render,
  findByText as findByTextGlobal,
  queryByText as queryByTextGlobal,
  waitFor
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TestWrapper } from '@common/utils/testUtils'
import MonacoEditorMock from '@common/components/MonacoEditor/__mocks__/MonacoEditor'
import { yamlStringify } from '@common/utils/YamlHelperMethods'

import { LoopingStrategy } from '../LoopingStrategy'

jest.mock('@common/components/YAMLBuilder/YamlBuilder', () => ({
  YamlBuilderMemo: ({ existingJSON, renderCustomHeader, ...rest }: any) => (
    <React.Fragment>
      {renderCustomHeader()}
      <MonacoEditorMock data-testid="editor" value={yamlStringify(existingJSON)} {...rest} />
    </React.Fragment>
  )
}))

const deleteModalTitle = 'pipeline.loopingStrategy.deleteModal.title'
const changeTypeModalTitle = 'pipeline.loopingStrategy.toggleTypeModal.title'

describe('<LoopingStrategy /> tests', () => {
  test('snapshot test', () => {
    const { container } = render(
      <TestWrapper>
        <LoopingStrategy />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('can select matrix', async () => {
    const { findByTestId, container } = render(
      <TestWrapper>
        <LoopingStrategy />
      </TestWrapper>
    )

    const matrix = await findByTestId('matrix')

    userEvent.click(matrix)

    const editor = (await findByTestId('editor')) as HTMLTextAreaElement

    expect(editor.value.trim()).toBe('matrix: {}')
    expect(container).toMatchSnapshot()
  })

  test('can select for', async () => {
    const { findByTestId, container } = render(
      <TestWrapper>
        <LoopingStrategy />
      </TestWrapper>
    )

    const for_ = await findByTestId('for')

    userEvent.click(for_)

    const editor = (await findByTestId('editor')) as HTMLTextAreaElement

    expect(editor.value.trim()).toBe('for: {}')
    expect(container).toMatchSnapshot()
  })

  test('can select parallelism', async () => {
    const { findByTestId, container } = render(
      <TestWrapper>
        <LoopingStrategy />
      </TestWrapper>
    )

    const parallelism = await findByTestId('parallelism')

    userEvent.click(parallelism)

    const editor = (await findByTestId('editor')) as HTMLTextAreaElement

    expect(editor.value.trim()).toBe('parallelism: 1')
    expect(container).toMatchSnapshot()
  })

  test('Prompts warning before switch if data is present', async () => {
    const { findByTestId } = render(
      <TestWrapper>
        <LoopingStrategy strategy={{ matrix: {} }} />
      </TestWrapper>
    )

    const parallelism = await findByTestId('parallelism')
    userEvent.click(parallelism)

    await waitFor(() => findByTextGlobal(document.body, changeTypeModalTitle))

    // cancel the prompt
    const cancel = await findByTextGlobal(document.body, 'cancel')
    userEvent.click(cancel)

    const editor1 = (await findByTestId('editor')) as HTMLTextAreaElement
    expect(editor1.value.trim()).toBe('matrix: {}')

    userEvent.click(parallelism)

    await waitFor(() => findByTextGlobal(document.body, changeTypeModalTitle))

    // apply the changes
    const apply = await findByTextGlobal(document.body, 'applyChanges')
    userEvent.click(apply)

    const editor2 = (await findByTestId('editor')) as HTMLTextAreaElement
    expect(editor2.value.trim()).toBe('parallelism: 1')
  })

  test('Prompts warning before delete if data is present', async () => {
    const { findByTestId, queryByTestId } = render(
      <TestWrapper>
        <LoopingStrategy strategy={{ matrix: {} }} />
      </TestWrapper>
    )

    const delete_ = await findByTestId('delete')
    userEvent.click(delete_)

    await waitFor(() => findByTextGlobal(document.body, deleteModalTitle))

    // cancel the prompt
    const cancel = await findByTextGlobal(document.body, 'cancel')
    userEvent.click(cancel)

    const editor1 = (await findByTestId('editor')) as HTMLTextAreaElement
    expect(editor1.value.trim()).toBe('matrix: {}')

    userEvent.click(delete_)
    await waitFor(() => findByTextGlobal(document.body, deleteModalTitle))

    // apply the changes
    const apply = await findByTextGlobal(document.body, 'applyChanges')
    userEvent.click(apply)

    expect(queryByTestId('editor')).not.toBeInTheDocument()
  })

  test('onChange', async () => {
    const onUpdateStrategy = jest.fn()

    const { findByTestId } = render(
      <TestWrapper>
        <LoopingStrategy onUpdateStrategy={onUpdateStrategy} />
      </TestWrapper>
    )

    const parallelism = await findByTestId('parallelism')

    userEvent.click(parallelism)

    const editor = (await findByTestId('editor')) as HTMLTextAreaElement

    expect(editor.value.trim()).toBe('parallelism: 1')

    userEvent.type(editor, '2')

    expect(onUpdateStrategy).toHaveBeenCalled()
  })

  test('readonly', async () => {
    const { findByTestId } = render(
      <TestWrapper>
        <LoopingStrategy isReadonly strategy={{ matrix: {} }} />
      </TestWrapper>
    )

    const parallelism = await findByTestId('parallelism')

    userEvent.click(parallelism)

    expect(queryByTextGlobal(document.body, changeTypeModalTitle)).not.toBeInTheDocument()

    const editor = (await findByTestId('editor')) as HTMLTextAreaElement

    expect(editor.value.trim()).toBe('matrix: {}')
  })
})
