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
import * as useFeatureFlag from '@common/hooks/useFeatureFlag'
import type { MappedDashboardTagOptions } from '@dashboards/types/DashboardTypes'
import ModuleTagsFilter, { ModuleTagsFilterProps } from '../ModuleTagsFilter'

const DEFAULT_FILTER: MappedDashboardTagOptions = {
  HARNESS: false,
  CE: false,
  CD: false,
  CI: false,
  CF: false
}

const renderComponent = (props: Partial<ModuleTagsFilterProps> = {}): RenderResult =>
  render(
    <TestWrapper>
      <ModuleTagsFilter selectedFilter={DEFAULT_FILTER} setPredefinedFilter={jest.fn()} {...props} />
    </TestWrapper>
  )

describe('ModuleTagsFilter', () => {
  const useFeatureFlagsMock = jest.spyOn(useFeatureFlag, 'useFeatureFlags')

  beforeEach(() => {
    jest.clearAllMocks()
    useFeatureFlagsMock.mockReturnValue({
      CENG_ENABLED: true,
      CING_ENABLED: true,
      CDNG_ENABLED: true,
      CFNG_ENABLED: true
    })
  })

  test('it should display the tags when all are enabled', async () => {
    renderComponent()

    expect(screen.getByText('dashboards.modules.harness')).toBeInTheDocument()
    expect(screen.getByText('common.purpose.ce.cloudCost')).toBeInTheDocument()
    expect(screen.getByText('buildsText')).toBeInTheDocument()
    expect(screen.getByText('deploymentsText')).toBeInTheDocument()
    expect(screen.getByText('common.purpose.cf.continuous')).toBeInTheDocument()
  })

  test('it should only display HARNESS and any enabled modules', function () {
    useFeatureFlagsMock.mockReturnValue({
      CENG_ENABLED: true,
      CING_ENABLED: true,
      CDNG_ENABLED: false,
      CFNG_ENABLED: false
    })

    renderComponent()

    expect(screen.getByText('dashboards.modules.harness')).toBeInTheDocument()
    expect(screen.getByText('common.purpose.ce.cloudCost')).toBeInTheDocument()
    expect(screen.getByText('buildsText')).toBeInTheDocument()
    expect(screen.queryByText('deploymentsText')).not.toBeInTheDocument()
    expect(screen.queryByText('common.purpose.cf.continuous')).not.toBeInTheDocument()
  })

  test('it should call the setPredefinedFilter callback when an option is toggled', async () => {
    const setPredefinedFilterMock = jest.fn()
    renderComponent({ setPredefinedFilter: setPredefinedFilterMock })

    const firstCheckbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement

    expect(firstCheckbox).toBeInTheDocument()
    expect(firstCheckbox).not.toBeChecked()
    expect(setPredefinedFilterMock).not.toHaveBeenCalled()

    userEvent.click(firstCheckbox)

    await waitFor(() => expect(setPredefinedFilterMock).toHaveBeenCalledWith('HARNESS', true))
  })

  test('it should pre-check the checkbox according to the selectedFilter prop', async () => {
    const selectedFilter = {
      HARNESS: true,
      CE: true,
      CI: true,
      CD: false,
      CF: false
    }
    renderComponent({ selectedFilter })

    const allCheckboxes = [...document.querySelectorAll('input[type="checkbox"]')] as HTMLInputElement[]

    expect(allCheckboxes).toHaveLength(5)
    expect(allCheckboxes.filter(({ checked }) => checked)).toHaveLength(3)
    expect(allCheckboxes.filter(({ checked }) => !checked)).toHaveLength(2)
  })
})
