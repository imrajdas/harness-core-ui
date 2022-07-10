/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SelectOption } from '@wings-software/uicore'
import type {
  MonitoredServiceDTO,
  RiskCount,
  SLODashboardWidget,
  SLOErrorBudgetResetDTO,
  TimeRangeFilter
} from 'services/cv'
import type { SLOActionTypes } from './CVSLOsListingPage.constants'

export interface CVSLOsListingPageProps {
  monitoredService?: Pick<MonitoredServiceDTO, 'name' | 'identifier'>
}

// SLOCardHeader

export interface SLOCardHeaderProps {
  serviceLevelObjective: SLODashboardWidget
  onDelete: (identifier: string, name: string) => void
  onResetErrorBudget: (sloIdentifier: string, formDate: SLOErrorBudgetResetDTO) => void
  monitoredServiceIdentifier?: string
}

// SLOCardContent

export interface SLOCardContentProps {
  isCardView?: boolean
  showUserHint?: boolean
  serviceLevelObjective: SLODashboardWidget
  filteredServiceLevelObjective?: SLODashboardWidget
  timeRangeFilters?: TimeRangeFilter[]
  chartTimeRange?: { startTime: number; endTime: number }
  setChartTimeRange?: (timeRange?: SLOCardContentProps['chartTimeRange']) => void
  sliderTimeRange?: { startTime: number; endTime: number }
  setSliderTimeRange?: (timeRange?: SLOCardContentProps['sliderTimeRange']) => void
}

export interface SLOTargetChartWithChangeTimelineProps extends SLOCardContentProps {
  type: SLOCardToggleViews
  resetSlider: () => void
  showTimelineSlider: boolean
  setShowTimelineSlider: (showTimelineSlider: boolean) => void
  customTimeFilter: boolean
  setCustomTimeFilter: (customTimeFilter: boolean) => void
}

export enum SLOCardToggleViews {
  SLO = 'SLO',
  ERROR_BUDGET = 'ERROR_BUDGET'
}

export interface GetSLOAndErrorBudgetGraphOptions {
  minXLimit: number
  maxXLimit: number
  type: SLOCardToggleViews
  serviceLevelObjective: SLODashboardWidget
  startTime: number
  endTime: number
  isCardView?: boolean
}

export type RiskTypes = 'HEALTHY' | 'OBSERVE' | 'NEED_ATTENTION' | 'UNHEALTHY' | 'EXHAUSTED'

export interface SLODashboardRiskCount {
  displayName?: string
  count?: number
  identifier?: RiskTypes
}

export interface SLORiskFilter extends RiskCount {
  displayColor: string
}

export type SLITypes = 'Availability' | 'Latency' | 'All'
export type SLITypesParams = 'Availability' | 'Latency'
export type TargetTypes = 'Rolling' | 'Calender' | 'All'
export type TargetTypesParams = 'Rolling' | 'Calender'

export interface SLOFilterState {
  userJourney: SelectOption
  monitoredService: SelectOption
  sliTypes: SelectOption
  targetTypes: SelectOption
  sloRiskFilter: SLORiskFilter | null
}

export interface SLOFilterAction {
  type: SLOActionTypes
  payload?: SLOActionPayload
}

export interface SLOActionPayload {
  userJourney?: SelectOption
  monitoredService?: SelectOption
  sliTypes?: SelectOption
  targetTypes?: SelectOption
  sloRiskFilter?: SLORiskFilter | null
}
