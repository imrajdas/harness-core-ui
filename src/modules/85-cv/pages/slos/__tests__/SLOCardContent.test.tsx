/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import SLOCardContent from '../SLOCard/SLOCardContent'
import { testWrapperProps, dashboardWidgetsContent } from './CVSLOsListingPage.mock'

jest.mock('@cv/pages/slos/SLOCard/ErrorBudgetGauge', () => ({
  __esModule: true,
  default: function ErrorBudgetGauge() {
    return <span data-testid="error-budget-gauge" />
  }
}))

jest.mock('@cv/pages/slos/components/SLOTargetChart/SLOTargetChart', () => ({
  __esModule: true,
  SLOTargetChart: function SLOTargetChart() {
    return <span data-testid="SLOTargetChart" />
  }
}))

jest.mock('@cv/components/ChangeTimeline/ChangeTimeline', () => ({
  __esModule: true,
  default: function ChangeTimeline() {
    return <span data-testid="change-timeline" />
  }
}))

// eslint-disable-next-line react/display-name
jest.mock('react-draggable', () => (props: any) => (
  <div>
    <button
      className="onDragEnd"
      onClick={() => props.onStop({ movementX: 15 } as MouseEvent, { deltaX: 15, x: 10 } as any)}
    />
    <button
      className="onDrag"
      onClick={() => props.onDrag({ movementX: 15 } as MouseEvent, { deltaX: 15, x: 10 } as any)}
    />
    {props.children}
  </div>
))

jest.mock('services/cv', () => {
  return {
    useChangeEventTimeline: jest.fn().mockImplementation(() => {
      return {
        data: {},
        refetch: jest.fn(),
        error: null,
        loading: false,
        cancel: jest.fn()
      }
    }),
    useGetMonitoredServiceChangeTimeline: jest.fn().mockImplementation(() => {
      return {
        data: {
          resource: {
            categoryTimeline: {
              Deployment: [],
              Infrastructure: [],
              Alert: []
            }
          }
        },
        refetch: jest.fn(),
        error: null,
        loading: false,
        cancel: jest.fn()
      }
    }),
    useGetAnomaliesSummary: jest.fn().mockImplementation(() => ({
      data: {},
      refetch: jest.fn(),
      error: null,
      loading: false
    }))
  }
})

describe('SLOCardContent', () => {
  test('Toggle the SLO and Error budget', () => {
    render(
      <TestWrapper {...testWrapperProps}>
        <SLOCardContent serviceLevelObjective={dashboardWidgetsContent} />
      </TestWrapper>
    )

    expect(screen.getAllByText('cv.SLO')[0]).toHaveClass('PillToggle--selected')
    expect(screen.getByText('cv.errorBudget')).not.toHaveClass('PillToggle--selected')
    expect(screen.getByText('cv.SLOPerformanceTrend')).toBeInTheDocument()
    expect(screen.queryByText('cv.sloRecalculationInProgress')).not.toBeInTheDocument()

    userEvent.click(screen.getByText('cv.errorBudget'))

    expect(screen.queryByTestId('error-budget-gauge')).toBeInTheDocument()
    expect(screen.getAllByText('cv.SLO')[0]).not.toHaveClass('PillToggle--selected')
    expect(screen.getByText('cv.errorBudget')).toHaveClass('PillToggle--selected')
    expect(screen.getByText('cv.errorBudgetRemainingWithMins')).toBeInTheDocument()
    expect(screen.getByText('cv.errorBudgetBurnDown')).toBeInTheDocument()

    userEvent.click(screen.getByText('cv.SLO'))

    expect(screen.getAllByText('cv.SLO')[0]).toHaveClass('PillToggle--selected')
  })

  test('it should call setSliderTimeRange when toggle triggered', () => {
    const setSliderTimeRange = jest.fn()
    const setChartTimeRange = jest.fn()

    render(
      <TestWrapper {...testWrapperProps}>
        <SLOCardContent
          isCardView
          setSliderTimeRange={setSliderTimeRange}
          setChartTimeRange={setChartTimeRange}
          serviceLevelObjective={dashboardWidgetsContent}
        />
      </TestWrapper>
    )

    userEvent.click(screen.getByText('cv.errorBudget'))

    expect(screen.getByText('cv.errorBudget')).toHaveClass('PillToggle--selected')

    expect(setSliderTimeRange).toBeCalledTimes(1)
    expect(setChartTimeRange).toBeCalledTimes(0)
  })

  test('it should show the SLI recalculation in progress warning', () => {
    render(
      <TestWrapper {...testWrapperProps}>
        <SLOCardContent serviceLevelObjective={{ ...dashboardWidgetsContent, recalculatingSLI: true }} />
      </TestWrapper>
    )

    expect(screen.getByText('cv.sloRecalculationInProgress')).toBeInTheDocument()
  })

  test('it should handle resetSlider for type SLO', () => {
    const setSliderTimeRange = jest.fn()

    render(
      <TestWrapper {...testWrapperProps}>
        <SLOCardContent
          isCardView
          serviceLevelObjective={dashboardWidgetsContent}
          setSliderTimeRange={setSliderTimeRange}
        />
      </TestWrapper>
    )

    expect(screen.getByTestId('timeline-slider-container')).toBeInTheDocument()
    userEvent.click(screen.getByTestId('timeline-slider-container'))

    expect(setSliderTimeRange).toBeCalledTimes(1)

    expect(screen.getByText('reset')).toBeInTheDocument()

    userEvent.click(screen.getByText('reset'))

    expect(screen.queryByText('reset')).not.toBeInTheDocument()
    expect(setSliderTimeRange).toBeCalledTimes(2)
  })

  test('it should handle resetSlider for type Error Budget', () => {
    const sliderTimeRange = { startTime: 1639993400000, endTime: 1639993420000 }

    render(
      <TestWrapper {...testWrapperProps}>
        <SLOCardContent
          isCardView
          sliderTimeRange={sliderTimeRange}
          setSliderTimeRange={jest.fn()}
          serviceLevelObjective={dashboardWidgetsContent}
        />
      </TestWrapper>
    )

    userEvent.click(screen.getByText('cv.errorBudget'))
    expect(screen.queryByTestId('error-budget-gauge')).toBeInTheDocument()

    expect(screen.getByTestId('timeline-slider-container')).toBeInTheDocument()
    userEvent.click(screen.getByTestId('timeline-slider-container'))

    userEvent.click(screen.getByTestId('timeline-slider-container'))

    expect(screen.getByText('reset')).toBeInTheDocument()

    userEvent.click(screen.getByText('reset'))

    expect(screen.queryByText('reset')).not.toBeInTheDocument()
  })

  test('should not render the user hint if showUserHint prop is not passed', () => {
    const sliderTimeRange = { startTime: 1639993400000, endTime: 1639993420000 }

    render(
      <TestWrapper {...testWrapperProps}>
        <SLOCardContent
          isCardView
          sliderTimeRange={sliderTimeRange}
          setSliderTimeRange={jest.fn()}
          serviceLevelObjective={dashboardWidgetsContent}
        />
      </TestWrapper>
    )

    expect(screen.queryByTestId('SLOCard_UserHint_SLO')).not.toBeInTheDocument()

    userEvent.click(screen.getByText('cv.errorBudget'))

    expect(screen.queryByTestId('SLOCard_UserHint_ErrorBudget')).not.toBeInTheDocument()
  })

  test('should render the user hint if showUserHint prop is passed', () => {
    const sliderTimeRange = { startTime: 1639993400000, endTime: 1639993420000 }

    render(
      <TestWrapper {...testWrapperProps}>
        <SLOCardContent
          isCardView
          sliderTimeRange={sliderTimeRange}
          setSliderTimeRange={jest.fn()}
          serviceLevelObjective={dashboardWidgetsContent}
          showUserHint
        />
      </TestWrapper>
    )

    expect(screen.queryByTestId('SLOCard_UserHint_SLO')).toBeInTheDocument()

    userEvent.click(screen.getByText('cv.errorBudget'))

    expect(screen.queryByTestId('SLOCard_UserHint_ErrorBudget')).toBeInTheDocument()
  })
})
