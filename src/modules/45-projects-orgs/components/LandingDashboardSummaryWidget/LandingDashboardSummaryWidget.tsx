/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import {
  Card,
  Container,
  Icon,
  IconName,
  Layout,
  Text,
  StackedSummaryInterface,
  StackedSummaryTable,
  getStackedSummaryBarCount
} from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { FontVariation, Color } from '@harness/design-system'
import cx from 'classnames'
import { TimeRangeToDays, useLandingDashboardContext } from '@common/factories/LandingDashboardContext'
import { useStrings, String } from 'framework/strings'
import { ModuleName } from 'framework/types/ModuleName'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import {
  ResponseExecutionResponseCountOverview,
  TopProjectsDashboardInfoCountWithSuccessFailureDetails,
  TopProjectsPanel,
  useGetTopProjects
} from 'services/dashboard-service'
import type { StringsMap } from 'stringTypes'
import routes from '@common/RouteDefinitions'
import DashboardNoDataWidget from '@projects-orgs/components/DashboardNoDataWidget/DashboardNoDataWidget'
import DashboardAPIErrorWidget, {
  DashboardAPIErrorWidgetProps
} from '@projects-orgs/components/DashboardAPIErrorWidget/DashboardAPIErrorWidget'

import OverviewGlanceCards from '@projects-orgs/components/OverviewGlanceCards/OverviewGlanceCards'
import css from './LandingDashboardSummaryWidget.module.scss'

const getModuleSummaryHeader = (iconName: IconName, title: string): JSX.Element | string => {
  return (
    <Layout.Horizontal spacing="small" margin={{ left: 'large' }} className={'summaryTableHeader'}>
      <Icon name={iconName}></Icon>
      <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{title}</Text>
    </Layout.Horizontal>
  )
}

const renderTooltipForProjectLabel = (
  projectData: TopProjectsDashboardInfoCountWithSuccessFailureDetails
): JSX.Element => {
  return (
    <Layout.Vertical padding="medium" spacing="small">
      <Text color={Color.WHITE}>{projectData?.projectInfo?.projectName ?? ''}</Text>
      {projectData?.orgInfo?.orgName ? (
        <Layout.Horizontal padding={{ top: 'small' }} flex={{ alignItems: 'center' }}>
          <Icon name="union" color={Color.GREY_300} margin={{ right: 'xsmall' }} />
          <Text inline color={Color.GREY_300}>
            <String stringID="common.org" />
          </Text>
          <Text color={Color.GREY_300}>:&nbsp;</Text>

          <Text color={Color.WHITE}>{projectData?.orgInfo?.orgName}</Text>
        </Layout.Horizontal>
      ) : undefined}
    </Layout.Vertical>
  )
}

const formatSummaryData = (
  response: Array<TopProjectsDashboardInfoCountWithSuccessFailureDetails>,
  accountId: string
): Array<StackedSummaryInterface> => {
  const formattedData = response.map(projectData => {
    const { projectInfo, countDetails } = projectData
    const orgIdentifier = projectData?.orgInfo?.orgIdentifier
    const projectIdentifier = projectInfo?.projectIdentifier
    const labelLink =
      orgIdentifier && projectIdentifier
        ? routes.toProjectDetails({
            accountId,
            orgIdentifier,
            projectIdentifier
          })
        : undefined
    const { successCount = 0, failureCount = 0, countChangeAndCountChangeRateInfo } = countDetails || {}

    const stackData: StackedSummaryInterface = {
      label: projectInfo?.projectName || '',
      labelTooltip: renderTooltipForProjectLabel(projectData),
      labelLink,
      barSectionsData: [
        { count: successCount, color: Color.GREEN_500 },
        { count: failureCount, color: Color.RED_500 }
      ],
      trend: `${Math.round(countChangeAndCountChangeRateInfo?.countChangeRate ?? 0)}%`
    }

    return stackData
  })

  return formattedData.sort?.(
    (a, b) => getStackedSummaryBarCount(b.barSectionsData) - getStackedSummaryBarCount(a.barSectionsData)
  )
}

const renderModuleSummary = (
  responseData: TopProjectsPanel | undefined,
  dataKey: keyof TopProjectsPanel | undefined,
  accountId: string,
  strings: Record<string, string>,
  iconName: IconName,
  refetch: DashboardAPIErrorWidgetProps['callback']
): JSX.Element => {
  return dataKey && responseData?.[dataKey]?.executionStatus === 'SUCCESS' ? (
    responseData?.[dataKey]?.response?.length ? (
      <StackedSummaryTable
        columnHeaders={[strings.projectText, getModuleSummaryHeader(iconName, strings.title)]}
        summaryData={formatSummaryData(
          responseData?.[dataKey]?.response as TopProjectsDashboardInfoCountWithSuccessFailureDetails[],
          accountId
        )}
        columnWidth={[200, 700]}
        barLength={630}
      ></StackedSummaryTable>
    ) : (
      <DashboardNoDataWidget
        className={'glanceModuleErrorWrapper'}
        label={
          <Text font={{ variation: FontVariation.BODY }} margin="small">
            {strings.noDeployments}
          </Text>
        }
        iconProps={{ size: 100 }}
        getStartedLink={routes.toCDHome({ accountId })}
      ></DashboardNoDataWidget>
    )
  ) : (
    <DashboardAPIErrorWidget
      className={'glanceModuleErrorWrapper'}
      callback={refetch}
      iconProps={{ size: 80 }}
    ></DashboardAPIErrorWidget>
  )
}

interface ModuleDataType {
  iconName: IconName
  titleId: keyof StringsMap
  dataKey?: keyof TopProjectsPanel
}

const getModuleData = (moduleType: ModuleName): ModuleDataType => {
  switch (moduleType) {
    case ModuleName.CD:
      return {
        iconName: 'cd-main',
        titleId: 'executionsText',
        dataKey: 'cdtopProjectsInfo'
      }
    case ModuleName.CI:
      return {
        iconName: 'ci-main',
        titleId: 'buildsText',
        dataKey: 'citopProjectsInfo'
      }

    case ModuleName.CF:
      return {
        iconName: 'cf-main',
        titleId: 'common.purpose.cf.continuous',
        dataKey: 'cftopProjectsInfo'
      }
    default:
      return {
        iconName: 'placeholder',
        titleId: 'na'
      }
  }
}

interface LandingDashboardSummaryWidgetProps {
  glanceCardData: ResponseExecutionResponseCountOverview
}

const LandingDashboardSummaryWidget: React.FC<LandingDashboardSummaryWidgetProps> = props => {
  const { selectedTimeRange } = useLandingDashboardContext()
  const { accountId } = useParams<ProjectPathProps>()
  const [range] = useState([Date.now() - TimeRangeToDays[selectedTimeRange] * 24 * 60 * 60000, Date.now()])
  const { getString } = useStrings()

  const {
    data: response,
    loading,
    error,
    refetch
  } = useGetTopProjects({
    queryParams: {
      accountIdentifier: accountId,
      startTime: range[0],
      endTime: range[1]
    },
    lazy: true
  })

  useEffect(() => {
    refetch({
      queryParams: {
        accountIdentifier: accountId,
        startTime: Date.now() - TimeRangeToDays[selectedTimeRange] * 24 * 60 * 60000,
        endTime: Date.now()
      }
    })
  }, [selectedTimeRange, refetch, accountId])

  const { iconName, titleId, dataKey } = getModuleData(ModuleName.CD)

  return (
    <div className={css.dashboardSumary}>
      <Layout.Horizontal className={css.atGlanceWrapper} spacing="large">
        <OverviewGlanceCards glanceCardData={props.glanceCardData} />
        <Card className={css.topProjectsCard}>
          <Layout.Vertical className={css.topProjectsContainer}>
            <Text font={{ variation: FontVariation.CARD_TITLE }}>
              {getString('projectsOrgs.landingDashboard.title')}
            </Text>
            {loading ? (
              <Container flex className={cx(css.topProjectsWrapper, { [css.loadingProjects]: !!loading })}>
                <Icon name="spinner" size={24} color={Color.PRIMARY_7} flex={{ alignItems: 'center' }} />
              </Container>
            ) : !error && response?.data?.executionStatus === 'SUCCESS' ? (
              <Layout.Horizontal className={css.topProjectsWrapper}>
                {renderModuleSummary(
                  response.data?.response,
                  dataKey,
                  accountId,
                  {
                    projectText: getString('projectsText'),
                    title: getString(titleId),
                    noDeployments: getString('common.noDeployments')
                  },
                  iconName,
                  refetch
                )}

                {/* This is temporary handling till support for CI, CF modules are added */}
                {/* <Layout.Vertical flex={{ justifyContent: 'center' }}>
                  <Icon name="ci-main" size={40} margin="small" />
                  <Text>{getString('common.comingSoon')}</Text>
                </Layout.Vertical> */}

                {/* <Layout.Vertical flex={{ justifyContent: 'center' }}>
                  <Icon name="cf-main" size={40} margin="small" />
                  <Text>{getString('common.comingSoon')}</Text>
                </Layout.Vertical> */}
              </Layout.Horizontal>
            ) : (
              <DashboardAPIErrorWidget
                className={css.topProjectsWrapper}
                callback={refetch}
                iconProps={{ size: 80 }}
              ></DashboardAPIErrorWidget>
            )}
          </Layout.Vertical>
        </Card>
      </Layout.Horizontal>
    </div>
  )
}

export default LandingDashboardSummaryWidget
