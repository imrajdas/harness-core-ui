/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  act,
  render,
  waitFor,
  getByText,
  fireEvent,
  getAllByPlaceholderText,
  RenderResult,
  screen
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import * as useFeaturesMock from '@common/hooks/useFeatures'
import * as usePlanEnforcementMock from '@cf/hooks/usePlanEnforcement'
import type { CheckFeatureReturn } from 'framework/featureStore/featureStoreUtil'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import CreateTargetModal, { CreateTargetModalProps } from '../CreateTargetModal'

describe('CreateTargetModal', () => {
  const renderComponent = (props: Partial<CreateTargetModalProps> = {}): RenderResult => {
    return render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <CreateTargetModal loading={false} onSubmitTargets={jest.fn()} onSubmitTargetFile={jest.fn()} {...props} />
      </TestWrapper>
    )
  }

  test('CreateTargetModal should render initial state correctly', async () => {
    const { container } = renderComponent({ loading: true })

    expect(getByText(container, 'cf.targets.create')).toBeDefined()

    const button = container.querySelector('button[type="button"]') as HTMLElement
    expect(button).toBeDefined()
    fireEvent.click(getByText(container, 'cf.targets.create'))

    await waitFor(() => expect(document.querySelector('.bp3-portal')).toBeDefined())

    expect(document.querySelector('.bp3-portal')).toMatchSnapshot()
  })

  test('CreateTargetModal should call callbacks properly', async () => {
    const onSubmitTargets = jest.fn()
    const onSubmitTargetFile = jest.fn()

    const { container } = renderComponent({
      loading: false,
      onSubmitTargets: onSubmitTargets,
      onSubmitTargetFile: onSubmitTargetFile
    })

    fireEvent.click(getByText(container, 'cf.targets.create'))

    await waitFor(() => expect(document.querySelector('.bp3-portal')).toBeDefined())
    fireEvent.change(document.querySelector('input[placeholder="cf.targets.enterName"]') as HTMLInputElement, {
      target: { value: 'Target1' }
    })
    fireEvent.change(document.querySelector('input[placeholder="cf.targets.enterValue"]') as HTMLInputElement, {
      target: { value: 'Target1' }
    })

    await waitFor(() =>
      expect(
        document.querySelector(
          '.bp3-portal [style*="height"] > button[type="button"][class*="intent-primary"][class*=disabled]'
        )
      ).toBeNull()
    )

    await act(async () => {
      fireEvent.click(
        document.querySelector(
          '.bp3-portal [style*="height"] > button[type="button"][class*="intent-primary"]'
        ) as HTMLButtonElement
      )
    })
    expect(onSubmitTargets).toBeCalledTimes(1)
  })

  test('CreateTargetModal can add and remove rows', async () => {
    const { container } = renderComponent()

    expect(getByText(container, 'cf.targets.create')).toBeDefined()

    await act(async () => {
      fireEvent.click(getByText(container, 'cf.targets.create'))
    })

    const modal = document.querySelector('.bp3-portal') as HTMLElement
    await waitFor(() => expect(modal).toBeDefined())

    // add row
    expect(getAllByPlaceholderText(modal, 'cf.targets.enterName').length).toBe(1)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'plus' }))
    })
    expect(getAllByPlaceholderText(modal, 'cf.targets.enterName').length).toBe(2)

    // remove row
    await act(async () => {
      fireEvent.click(document.querySelector('.bp3-icon-minus') as HTMLElement)
    })

    expect(getAllByPlaceholderText(modal, 'cf.targets.enterName').length).toBe(1)
  })

  test('CreateTargetModal can toggle upload options', async () => {
    const { container } = renderComponent()

    expect(getByText(container, 'cf.targets.create')).toBeDefined()

    await act(async () => {
      fireEvent.click(getByText(container, 'cf.targets.create'))
    })

    const modal = document.querySelector('.bp3-portal') as HTMLElement
    await waitFor(() => expect(modal).toBeDefined())

    // click upload targets button
    await act(async () => {
      fireEvent.click(getByText(modal, 'cf.targets.upload'))
    })

    expect(getByText(modal, 'cf.targets.uploadYourFile')).toBeDefined()

    // click add a target
    await act(async () => {
      fireEvent.click(getByText(modal, 'cf.targets.list'))
    })

    expect(getAllByPlaceholderText(modal, 'cf.targets.enterName').length).toBeDefined
  })

  test('+ New Target button should show CreateTargetModal when user is within MAU limit', async () => {
    jest.spyOn(useFeaturesMock, 'useGetFirstDisabledFeature').mockReturnValue({ featureEnabled: true })
    jest.spyOn(usePlanEnforcementMock, 'default').mockReturnValue({ isPlanEnforcementEnabled: true, isFreePlan: true })

    renderComponent()
    const createTargetButton = screen.getByRole('button', { name: 'plus cf.targets.create' })
    userEvent.click(createTargetButton)

    await waitFor(() => {
      const createTargetModal = screen.getByText('cf.targets.addTargetsLabel')
      expect(createTargetModal).toBeInTheDocument()
      expect(screen.queryByText('cf.planEnforcement.upgradeRequiredMau')).not.toBeInTheDocument()
    })
  })

  test('+ New Target button should show plan enforcement tooltip when user exceeds MAU limit', async () => {
    jest.spyOn(usePlanEnforcementMock, 'default').mockReturnValue({ isPlanEnforcementEnabled: true, isFreePlan: true })
    const mockedReturnValue = new Map<FeatureIdentifier, CheckFeatureReturn>()
    mockedReturnValue.set(FeatureIdentifier.MAUS, {
      enabled: false,
      featureDetail: {
        enabled: false,
        featureName: FeatureIdentifier.MAUS,
        moduleType: 'CF',
        count: 100,
        limit: 100
      }
    })
    jest.spyOn(useFeaturesMock, 'useFeatures').mockReturnValue({ features: mockedReturnValue })

    renderComponent()

    const createTargetButton = screen.getByRole('button', { name: 'plus cf.targets.create' })
    fireEvent.mouseOver(createTargetButton)
    await waitFor(() => {
      expect(screen.getByText('cf.planEnforcement.upgradeRequiredMau')).toBeInTheDocument()
      expect(createTargetButton).toHaveClass('bp3-disabled')
    })
  })
})
