/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Formik, MultiTypeInputType, RUNTIME_INPUT_VALUE, Text } from '@harness/uicore'
import { fireEvent, render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import CVMultiTypeQuery from '../CVMultiTypeQuery'

const mockQuery = `
    ALERTS_FOR_STATE  {

    }
`

jest.mock('@common/components/ShellScriptMonaco/ShellScriptMonaco', () => ({
  ShellScriptMonacoField: function MockComponent() {
    return <Text> ShellScriptMonaco </Text>
  }
}))

describe('validate Multitype option', () => {
  test('should switch from fixed to expression type', async () => {
    const { container, getByText } = render(
      <TestWrapper>
        <Formik formName="" initialValues={{ query: mockQuery }} onSubmit={() => undefined}>
          {_ => {
            return (
              <CVMultiTypeQuery
                name={'query'}
                expressions={['exp1']}
                fetchRecords={jest.fn()}
                disableFetchButton={false}
              />
            )
          }}
        </Formik>
      </TestWrapper>
    )
    const fixedInputIcon = container.querySelector('span[data-icon="fixed-input"]')
    fireEvent.click(fixedInputIcon!)
    const runtimeBtn = await getByText('Runtime input')
    const expressionBtn = await getByText('Expression')
    expect(runtimeBtn).toBeInTheDocument()
    expect(expressionBtn).toBeInTheDocument()
    fireEvent.click(expressionBtn)
    const expressionInputIcon = container.querySelector('span[data-icon="expression-input"]')
    fireEvent.click(expressionInputIcon!)
    const fixedinputBtn = await getByText('Fixed value')
    const runtimeBtnNew = await getByText('Runtime input')
    expect(fixedinputBtn).toBeInTheDocument()
    expect(runtimeBtnNew).toBeInTheDocument()
    fireEvent.click(runtimeBtnNew)
  })

  test('should render with allowed types', async () => {
    const { container, getByText, getAllByRole } = render(
      <TestWrapper>
        <Formik formName="" initialValues={{ query: RUNTIME_INPUT_VALUE }} onSubmit={() => undefined}>
          {_ => {
            return (
              <CVMultiTypeQuery
                name={'query'}
                expressions={['exp1']}
                fetchRecords={jest.fn()}
                disableFetchButton={false}
                allowedTypes={[MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
              />
            )
          }}
        </Formik>
      </TestWrapper>
    )
    const runtimeInputIcon = await container.querySelector('span[data-icon="runtime-input"]')
    expect(runtimeInputIcon).toBeInTheDocument()
    fireEvent.click(runtimeInputIcon!)
    const runtimeBtn = await getByText('Runtime input')
    const expressionBtn = await getByText('Expression')
    expect(getAllByRole('listitem').length).toEqual(2)
    expect(runtimeBtn).toBeInTheDocument()
    expect(expressionBtn).toBeInTheDocument()
  })
})
