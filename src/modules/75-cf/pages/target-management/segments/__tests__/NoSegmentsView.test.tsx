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
import { NoSegmentsView } from '../NoSegmentsView'

const onNewSegmentCreated = jest.fn()

const renderComponent = (): RenderResult =>
  render(
    <TestWrapper>
      <NoSegmentsView onNewSegmentCreated={jest.fn()} />
    </TestWrapper>
  )

describe('NoTargetsView', () => {
  test('it should open Add new Target Groups dialog when New Target Groups button is clicked', async () => {
    renderComponent()

    const btn = screen.getByRole('button', { name: 'plus cf.segments.create' })
    expect(btn).toBeInTheDocument()
    expect(onNewSegmentCreated).not.toHaveBeenCalled()

    userEvent.click(btn)

    await waitFor(() => expect(screen.getByRole('heading', { name: 'cf.segments.modalTitle' })).toBeInTheDocument())
  })
})
