/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import * as constants from '@delegates/constants'
import DelegateSetupStep from '../DelegateSetupStep/DelegateSetupStep'
import DelegateSizesmock from './DelegateSizesmock.json'
import DelegateProfilesMock from './DelegateProfilesMock.json'

const mockGetCallFunction = jest.fn()
jest.mock('services/portal', () => ({
  useGetDelegateSizes: jest.fn().mockImplementation(args => {
    mockGetCallFunction(args)
    return { data: DelegateSizesmock, refetch: jest.fn(), error: null, loading: false }
  }),
  useValidateKubernetesYaml: jest.fn().mockImplementation(args => {
    mockGetCallFunction(args)
    return { data: {}, refetch: jest.fn(), error: null, loading: false }
  })
}))
jest.mock('services/cd-ng', () => ({
  useListDelegateProfilesNg: jest.fn().mockImplementation(args => {
    mockGetCallFunction(args)
    return { data: DelegateProfilesMock, refetch: jest.fn(), error: null, loading: false }
  }),
  useCreateDelegateToken: jest.fn().mockImplementation(() => ({
    mutate: jest.fn().mockImplementation(() => undefined)
  })),
  useGetDelegateTokens: jest.fn().mockImplementation(() => ({
    mutate: jest.fn().mockImplementation(() => ({
      resource: []
    }))
  }))
}))
describe('Create DelegateSetup Step', () => {
  test('render data', () => {
    const { container } = render(
      <TestWrapper>
        <DelegateSetupStep />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('submit click required name', async () => {
    const { container, getByText } = render(
      <TestWrapper>
        <DelegateSetupStep />
      </TestWrapper>
    )
    const submitBtn = getByText('continue')
    act(() => {
      fireEvent.click(submitBtn)
    })
    await waitFor(() => expect(container.innerHTML).toContain('delegateNameRequired'))
  })

  test('submit click required installer selection', async () => {
    jest.spyOn(constants, 'isHelmDelegateEnabled').mockImplementation(() => true)
    const { container, getByText } = render(
      <TestWrapper>
        <DelegateSetupStep />
      </TestWrapper>
    )
    const submitBtn = getByText('continue')
    act(() => {
      fireEvent.click(submitBtn)
    })
    await waitFor(() => expect(container.innerHTML).toContain('delegates.delegateCreation.installerSelectionRequired'))
  })

  test('submit click', async () => {
    const { container, getByText } = render(
      <TestWrapper>
        <DelegateSetupStep />
      </TestWrapper>
    )

    const nameInput = container.getElementsByTagName('input')[0]
    act(() => {
      fireEvent.change(nameInput, 'new name')
    })
    const submitBtn = getByText('continue')
    act(() => {
      fireEvent.click(submitBtn)
    })
    await waitFor(() => expect(container.innerHTML).not.toContain('delegateNameRequired'))
  })
})
