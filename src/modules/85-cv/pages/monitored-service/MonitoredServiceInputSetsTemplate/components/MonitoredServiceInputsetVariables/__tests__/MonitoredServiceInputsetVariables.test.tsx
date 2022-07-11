/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { Formik, RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import MonitoredServiceInputsetVariables from '../MonitoredServiceInputsetVariables'

const variablesMock = [
  { name: 'variable 1', type: 'String', value: RUNTIME_INPUT_VALUE },
  { name: 'variable 2', type: 'String', value: RUNTIME_INPUT_VALUE }
]
describe('Validate MonitoredServiceInputsetVariables  ', () => {
  test('should render MonitoredServiceInputsetVariables with variables', () => {
    const { container } = render(
      <TestWrapper>
        <Formik
          initialValues={{
            variables: variablesMock
          }}
          onSubmit={() => undefined}
          formName="wrapperComponent"
        >
          <MonitoredServiceInputsetVariables monitoredServiceVariables={variablesMock} />
        </Formik>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
  test('should render MonitoredServiceInputsetVariables without variables', () => {
    const { container } = render(
      <TestWrapper>
        <Formik initialValues={{ variables: [] }} onSubmit={() => undefined} formName="wrapperComponent">
          <MonitoredServiceInputsetVariables monitoredServiceVariables={undefined} />
        </Formik>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render MonitoredServiceInputsetVariables with empty variables', () => {
    const { container } = render(
      <TestWrapper>
        <Formik initialValues={{ variables: [] }} onSubmit={() => undefined} formName="wrapperComponent">
          <MonitoredServiceInputsetVariables monitoredServiceVariables={[]} />
        </Formik>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
