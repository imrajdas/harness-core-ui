/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { ScopeBadge } from '@common/components/ScopeBadge/ScopeBadge'

describe('<ScopeBadge /> tests', () => {
  test('should match snapshot for account scope', async () => {
    const { container } = render(
      <TestWrapper>
        <ScopeBadge data={{ accountIdentifier: 'accountId' }} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should match snapshot for org scope', async () => {
    const { container } = render(
      <TestWrapper>
        <ScopeBadge data={{ accountIdentifier: 'accountId', orgIdentifier: 'ordId' }} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should match snapshot for project scope', async () => {
    const { container } = render(
      <TestWrapper>
        <ScopeBadge data={{ accountIdentifier: 'accountId', orgIdentifier: 'ordId', projectIdentifier: 'projectId' }} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should match minimal snapshot', async () => {
    const { container } = render(
      <TestWrapper>
        <ScopeBadge data={{ accountIdentifier: 'accountId', orgIdentifier: 'ordId', projectIdentifier: 'projectId' }} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
