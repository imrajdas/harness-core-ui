/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import AppDynamicsTier from '../AppDynamicsTier'

describe('AppDynamicsTier', () => {
  test('should render AppDynamicsTier with normal Select', () => {
    const onValidate = jest.fn()
    const setCustomField = jest.fn()
    const { container, rerender } = render(
      <TestWrapper>
        <AppDynamicsTier
          isTemplate={false}
          tierOptions={[]}
          tierLoading={false}
          formikValues={{}}
          onValidate={onValidate}
          setAppDTierCustomField={setCustomField}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()

    // Loading
    rerender(
      <TestWrapper>
        <AppDynamicsTier
          isTemplate={false}
          tierOptions={[]}
          tierLoading={true}
          formikValues={{}}
          onValidate={onValidate}
          setAppDTierCustomField={setCustomField}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()

    // Edit mode
    rerender(
      <TestWrapper>
        <AppDynamicsTier
          isTemplate={false}
          tierOptions={[]}
          tierLoading={false}
          formikValues={{ appDtier: 'tier value', appdApplication: 'app value' }}
          onValidate={onValidate}
          setAppDTierCustomField={setCustomField}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render AppDynamicsTier with multiInputType Select', () => {
    const onValidate = jest.fn()
    const setCustomField = jest.fn()
    const { container, rerender } = render(
      <TestWrapper>
        <AppDynamicsTier
          isTemplate={true}
          tierOptions={[]}
          tierLoading={false}
          formikValues={{}}
          onValidate={onValidate}
          setAppDTierCustomField={setCustomField}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()

    // Loading
    rerender(
      <TestWrapper>
        <AppDynamicsTier
          isTemplate={true}
          tierOptions={[]}
          tierLoading={true}
          formikValues={{}}
          onValidate={onValidate}
          setAppDTierCustomField={setCustomField}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()

    // Edit mode
    rerender(
      <TestWrapper>
        <AppDynamicsTier
          isTemplate={true}
          tierOptions={[]}
          tierLoading={false}
          formikValues={{ appDtier: RUNTIME_INPUT_VALUE, appdApplication: RUNTIME_INPUT_VALUE }}
          onValidate={onValidate}
          setAppDTierCustomField={setCustomField}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
