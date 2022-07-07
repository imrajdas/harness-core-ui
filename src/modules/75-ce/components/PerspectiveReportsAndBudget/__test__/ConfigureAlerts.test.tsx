/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import type { Budget } from 'services/ce'
import { TestWrapper } from '@common/utils/testUtils'
import { fillAtForm, InputTypes } from '@common/utils/JestFormHelper'
import ConfigureAlerts from '../CreateBudgetSteps/ConfigureAlerts'

import MockBudget from './PerspectiveBudgetsResponse.json'

const params = {
  accountId: 'TEST_ACC'
}

const props = {
  isEditMode: true,
  viewId: 'mock_id',
  name: 'mock_name',
  accountId: 'mock_account_id',
  budget: MockBudget.data[0] as Budget,
  onSuccess: jest.fn()
}

describe('Test Cases For ConfigureAlerts', () => {
  test('Should be able to render ConfigureAlerts', () => {
    const { container } = render(
      <TestWrapper pathParams={params}>
        <ConfigureAlerts {...props} />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('Should be able to switch Notification Channels', () => {
    const { container } = render(
      <TestWrapper pathParams={params}>
        <ConfigureAlerts {...props} />
      </TestWrapper>
    )

    fillAtForm([
      {
        container,
        fieldId: 'alertThresholds.0.notificationChannel',
        type: InputTypes.SELECT,
        value: '0' // Switching from Email to Slack
      }
    ])

    // Switch notification channel clears tag input
    expect(container.querySelectorAll('.bp3-tag').length).toBe(0)
  })
})
