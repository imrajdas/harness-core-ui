/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import { NoEnvironment } from '../NoEnvironment'

const onCreated = jest.fn()

const renderComponent = (): RenderResult =>
  render(
    <TestWrapper>
      <NoEnvironment onCreated={jest.fn()} />
    </TestWrapper>
  )

describe('NoEnvironment', () => {
  test('it should open Create Environment dialog when New environment button is clicked', async () => {
    renderComponent()

    const btn = screen.getByRole('button', { name: 'plus newEnvironment' })
    expect(btn).toBeInTheDocument()
    expect(onCreated).not.toHaveBeenCalled()

    userEvent.click(btn)

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'cf.environments.create.title' })).toBeInTheDocument()
    )
  })
})
