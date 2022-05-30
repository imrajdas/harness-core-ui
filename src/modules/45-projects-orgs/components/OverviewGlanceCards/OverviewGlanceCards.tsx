/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { Card, Icon, Layout } from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { Color } from '@harness/design-system'
import GlanceCard, { GlanceCardProps } from '@common/components/GlanceCard/GlanceCard'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { CountChangeDetails, ResponseExecutionResponseCountOverview, useGetCounts } from 'services/dashboard-service'
import { TimeRangeToDays, useLandingDashboardContext } from '@common/factories/LandingDashboardContext'
import { useStrings } from 'framework/strings'
import type { StringsMap } from 'stringTypes'
import type { UseGetMockData } from '@common/utils/testUtils'
import DashboardAPIErrorWidget from '../DashboardAPIErrorWidget/DashboardAPIErrorWidget'
import css from './OverviewGlanceCards.module.scss'

enum OverviewGalanceCard {
  PROJECT = 'PROJECT',
  SERVICES = 'SERVICES',
  ENV = 'ENV',
  PIPELINES = 'PIPELINES'
}

interface RenderGlanceCardData extends Omit<GlanceCardProps, 'title'> {
  title: keyof StringsMap
}

interface RenderGlanceCardProps {
  loading: boolean
  data: RenderGlanceCardData
}

const projectsTitleId = 'projectsText'
const serviceTitleId = 'services'
const envTitleId = 'environments'
const pipelineTitleId = 'pipelines'

const getDataForCard = (
  cardType: OverviewGalanceCard,
  countDetails: CountChangeDetails | undefined
): RenderGlanceCardData => {
  let glanceCardData: RenderGlanceCardData = { title: 'na', iconName: 'placeholder' }

  if (!countDetails) {
    return glanceCardData
  }

  const countChange = countDetails.countChangeAndCountChangeRateInfo?.countChange
  switch (cardType) {
    case OverviewGalanceCard.PROJECT:
      glanceCardData = {
        title: projectsTitleId,
        iconName: 'nav-project',
        iconSize: 16
      }
      break
    case OverviewGalanceCard.SERVICES:
      glanceCardData = {
        title: serviceTitleId,
        iconName: 'services'
      }
      break
    case OverviewGalanceCard.ENV:
      glanceCardData = {
        title: envTitleId,
        iconName: 'infrastructure'
      }
      break
    case OverviewGalanceCard.PIPELINES:
      glanceCardData = {
        title: pipelineTitleId,
        iconName: 'pipeline',
        iconSize: 38
      }
  }
  glanceCardData.number = countDetails.count
  if (countChange) {
    glanceCardData.delta = countChange > 0 ? `+${countChange.toString()}` : countChange.toString()
  }

  return glanceCardData
}

const RenderGlanceCard: React.FC<RenderGlanceCardProps> = props => {
  const { loading, data } = props
  const { getString } = useStrings()
  return loading ? (
    <Card className={css.loadingWrapper}>
      <Icon name="spinner" size={24} color={Color.PRIMARY_7} />
    </Card>
  ) : (
    <GlanceCard {...data} styling={data.title === projectsTitleId} title={getString(data.title)} />
  )
}

export interface OverviewGlanceCardsProp {
  glanceCardData: ResponseExecutionResponseCountOverview
  mockData?: UseGetMockData<ResponseExecutionResponseCountOverview>
}

const OverviewGlanceCards: React.FC<OverviewGlanceCardsProp> = props => {
  const { glanceCardData } = props
  const { accountId } = useParams<ProjectPathProps>()
  const { selectedTimeRange } = useLandingDashboardContext()
  const [range] = useState([Date.now() - TimeRangeToDays[selectedTimeRange] * 24 * 60 * 60000, Date.now()])
  const [pageLoadGlanceCardData, setPageLoadGlanceCardData] =
    React.useState<ResponseExecutionResponseCountOverview | null>(glanceCardData)
  const {
    data: countResponse,
    loading,
    error,
    refetch
  } = useGetCounts({
    queryParams: {
      accountIdentifier: accountId,
      startTime: range[0],
      endTime: range[1]
    },
    lazy: true,
    mock: props.mockData
  })

  useEffect(() => {
    if (pageLoadGlanceCardData) {
      setPageLoadGlanceCardData(null)
    } else {
      refetch({
        queryParams: {
          accountIdentifier: accountId,
          startTime: Date.now() - TimeRangeToDays[selectedTimeRange] * 24 * 60 * 60000,
          endTime: Date.now()
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeRange, pageLoadGlanceCardData])

  const hasAPIFailed = !(
    countResponse?.data?.executionStatus === 'SUCCESS' || glanceCardData?.data?.executionStatus === 'SUCCESS'
  )

  if (!loading && (error || hasAPIFailed)) {
    return (
      <Card className={css.errorCard}>
        <DashboardAPIErrorWidget callback={refetch} iconProps={{ size: 75 }}></DashboardAPIErrorWidget>
      </Card>
    )
  }

  const { projectsCountDetail, envCountDetail, servicesCountDetail, pipelinesCountDetail } =
    countResponse?.data?.response || glanceCardData?.data?.response || {}

  return (
    <Layout.Horizontal spacing="large" style={{ flex: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '16px', width: '100%' }}>
        <RenderGlanceCard loading={!!loading} data={getDataForCard(OverviewGalanceCard.PROJECT, projectsCountDetail)} />
        <RenderGlanceCard loading={!!loading} data={getDataForCard(OverviewGalanceCard.ENV, envCountDetail)} />
        <RenderGlanceCard
          loading={!!loading}
          data={getDataForCard(OverviewGalanceCard.SERVICES, servicesCountDetail)}
        />
        <RenderGlanceCard
          loading={!!loading}
          data={getDataForCard(OverviewGalanceCard.PIPELINES, pipelinesCountDetail)}
        />
      </div>
    </Layout.Horizontal>
  )
}

export default OverviewGlanceCards
