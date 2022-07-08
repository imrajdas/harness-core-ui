/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import { PremiumSupport } from '../PremiumSupport'

describe('PremiumSupport', () => {
  test('toggle value', async () => {
    const onChangeMock = jest.fn()
    const { getByRole } = render(
      <TestWrapper>
        <PremiumSupport premiumSupport={true} disabled={false} onChange={onChangeMock} />
      </TestWrapper>
    )
    userEvent.click(getByRole('checkbox'))
    expect(onChangeMock).toHaveBeenCalledWith(false)
  })
})
