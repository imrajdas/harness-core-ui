/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Redirect, useParams } from 'react-router-dom'
import CIPipelineDeploymentList from '@ci/pages/pipeline-deployment-list/CIPipelineDeploymentList'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { MinimalLayout } from '@common/layouts'
import { BannerType } from '@common/layouts/Constants'
import {
  getActiveUsageNumber,
  getPercentageNumber,
  isFeatureCountActive,
  isFeatureLimitBreachedIncludesExceeding,
  isFeatureLimitMet,
  isFeatureOveruseActive,
  isFeatureWarningActive,
  isFeatureWarningActiveIncludesLimit
} from '@common/layouts/FeatureBanner'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import {
  RedirectToModuleTrialHomeFactory,
  RedirectToProjectFactory,
  RedirectToSubscriptionsFactory
} from '@common/Redirects'
import routes from '@common/RouteDefinitions'
import { RouteWithLayout } from '@common/router'
import { accountPathProps, executionPathProps, projectPathProps, pipelineModuleParams } from '@common/utils/routeUtils'
import { ConnectorRouteDestinations } from '@connectors/RouteDestinations'
import { DelegateRouteDestinations } from '@delegates/RouteDestinations'
import { GitSyncRouteDestinations } from '@gitsync/RouteDestinations'
import { GovernanceRouteDestinations } from '@governance/RouteDestinations'
import executionFactory from '@pipeline/factories/ExecutionFactory'

import ExecutionLandingPage from '@pipeline/pages/execution/ExecutionLandingPage/ExecutionLandingPage'
import { PipelineRouteDestinations } from '@pipeline/RouteDestinations'
import { StageType } from '@pipeline/utils/stageHelpers'
import { AccessControlRouteDestinations } from '@rbac/RouteDestinations'
import { SecretRouteDestinations } from '@secrets/RouteDestinations'
import { TemplateRouteDestinations } from '@templates-library/RouteDestinations'
import { TriggersRouteDestinations } from '@triggers/RouteDestinations'
import { VariableRouteDestinations } from '@variables/RouteDestinations'
import FileStorePage from '@filestore/pages/filestore/FileStorePage'
import CIPipelineStudio from '@ci/pages/pipeline-studio/CIPipelineStudio'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import featureFactory from 'framework/featureStore/FeaturesFactory'
import { LICENSE_STATE_NAMES, LicenseRedirectProps } from 'framework/LicenseStore/LicenseStoreContext'
import { ModuleName } from 'framework/types/ModuleName'
import { CIExecutionCardSummary } from './components/CIExecutionCardSummary/CIExecutionCardSummary'
import { CIExecutionSummary } from './components/CIExecutionSummary/CIExecutionSummary'
import CISideNav from './components/CISideNav/CISideNav'
import { CIStageDetails } from './components/CIStageDetails/CIStageDetails'

import './components/PipelineSteps'
import './components/PipelineStudio/BuildStage'
import BuildCommits from './pages/build/sections/commits/BuildCommits'
import CIDashboardPage from './pages/dashboard/CIDashboardPage'
import GetStartedWithCI from './pages/get-started-with-ci/GetStartedWithCI'
import CIHomePage from './pages/home/CIHomePage'
import CITrialHomePage from './pages/home/CITrialHomePage'

executionFactory.registerCardInfo(StageType.BUILD, {
  icon: 'ci-main',
  component: CIExecutionCardSummary
})

executionFactory.registerSummary(StageType.BUILD, {
  component: CIExecutionSummary
})

executionFactory.registerStageDetails(StageType.BUILD, {
  component: CIStageDetails
})

featureFactory.registerFeaturesByModule('ci', {
  features: [
    FeatureIdentifier.MAX_TOTAL_BUILDS,
    FeatureIdentifier.MAX_BUILDS_PER_MONTH,
    FeatureIdentifier.ACTIVE_COMMITTERS
  ],
  renderMessage: (props, getString, additionalLicenseProps = {}) => {
    const {
      isFreeEdition: isCIFree,
      isTeamEdition: isCITeam,
      isEnterpriseEdition: isCIEnterprise
    } = additionalLicenseProps
    const isTeamOrEnterprise = isCIEnterprise || isCITeam
    const featuresMap = props.features
    const maxTotalBuildsFeatureDetail = featuresMap.get(FeatureIdentifier.MAX_TOTAL_BUILDS) // tested both
    const maxBuildsPerMonthFeatureDetail = featuresMap.get(FeatureIdentifier.MAX_BUILDS_PER_MONTH)
    const activeCommittersFeatureDetail = featuresMap.get(FeatureIdentifier.ACTIVE_COMMITTERS)

    // Check for limit breach
    const isMaxBuildsPerMonthBreached = isFeatureLimitBreachedIncludesExceeding(maxBuildsPerMonthFeatureDetail)
    let limitBreachMessageString = ''
    if (isMaxBuildsPerMonthBreached) {
      limitBreachMessageString = getString('pipeline.featureRestriction.maxBuildsPerMonth100PercentLimit')
    }

    if (limitBreachMessageString) {
      return {
        message: () => limitBreachMessageString,
        bannerType: BannerType.LEVEL_UP
      }
    }

    // Checking for limit overuse warning
    let overuseMessageString = ''
    const isActiveCommittersOveruseActive = isFeatureOveruseActive(activeCommittersFeatureDetail)

    if (isActiveCommittersOveruseActive && isTeamOrEnterprise) {
      overuseMessageString = getString('pipeline.featureRestriction.subscriptionExceededLimit')
    }
    if (overuseMessageString) {
      return {
        message: () => overuseMessageString,
        bannerType: BannerType.OVERUSE
      }
    }

    // Checking for limit usage warning
    let warningMessageString = ''
    const isMaxBuildsPerMonthCountActive = isFeatureCountActive(maxBuildsPerMonthFeatureDetail)
    const isMaxTotalBuildsWarningActive = isFeatureWarningActive(maxTotalBuildsFeatureDetail)
    const isMaxTotalBuildsLimitMet = isFeatureLimitMet(maxTotalBuildsFeatureDetail)
    const isActiveCommittersWarningActive = isFeatureWarningActiveIncludesLimit(activeCommittersFeatureDetail)

    if (
      isCIFree &&
      isMaxTotalBuildsLimitMet &&
      isMaxBuildsPerMonthCountActive &&
      typeof maxBuildsPerMonthFeatureDetail?.featureDetail?.count !== 'undefined'
    ) {
      warningMessageString = getString('pipeline.featureRestriction.numMonthlyBuilds', {
        count: maxBuildsPerMonthFeatureDetail.featureDetail.count,
        limit: maxBuildsPerMonthFeatureDetail.featureDetail.limit
      })
    } else if (
      isCIFree &&
      isMaxTotalBuildsWarningActive &&
      maxTotalBuildsFeatureDetail?.featureDetail?.count &&
      maxTotalBuildsFeatureDetail.featureDetail.limit
    ) {
      const usagePercent = getActiveUsageNumber(maxTotalBuildsFeatureDetail)

      warningMessageString = getString('pipeline.featureRestriction.maxTotalBuilds90PercentLimit', {
        usagePercent
      })
    } else if (
      isActiveCommittersWarningActive &&
      activeCommittersFeatureDetail?.featureDetail?.count &&
      activeCommittersFeatureDetail.featureDetail.limit &&
      isTeamOrEnterprise
    ) {
      const usagePercent = getPercentageNumber(maxTotalBuildsFeatureDetail)

      warningMessageString = getString('pipeline.featureRestriction.subscription90PercentLimit', { usagePercent })
    }

    if (warningMessageString) {
      return {
        message: () => warningMessageString,
        bannerType: BannerType.INFO
      }
    }

    // If neither of limit breach/ warning/ overuse needs to be shown, return with an empty string.
    // This will ensure no banner is shown
    return {
      message: () => '',
      bannerType: BannerType.LEVEL_UP
    }
  }
})

const RedirectToCIProject = RedirectToProjectFactory(ModuleName.CI, routes.toCIHome)

const CIDashboardPageOrRedirect = (): React.ReactElement => {
  const params = useParams<ProjectPathProps>()
  const { selectedProject } = useAppStore()
  const { CI_OVERVIEW_PAGE } = useFeatureFlags()

  if (CI_OVERVIEW_PAGE) {
    return <CIDashboardPage />
  } else if (selectedProject?.modules?.includes(ModuleName.CI)) {
    return <Redirect to={routes.toDeployments({ ...params, module: 'ci' })} />
  } else {
    return <Redirect to={routes.toCIHome(params)} />
  }
}

const CISideNavProps: SidebarContext = {
  navComponent: CISideNav,
  subtitle: 'CONTINUOUS',
  title: 'Integration',
  icon: 'ci-main'
}

const moduleParams: ModulePathParams = {
  module: ':module(ci)'
}

const licenseRedirectData: LicenseRedirectProps = {
  licenseStateName: LICENSE_STATE_NAMES.CI_LICENSE_STATE,
  startTrialRedirect: RedirectToModuleTrialHomeFactory(ModuleName.CI),
  expiredTrialRedirect: RedirectToSubscriptionsFactory(ModuleName.CI)
}

export default (
  <>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      path={[
        routes.toCI({ ...accountPathProps, ...projectPathProps }),
        routes.toCIProject({ ...accountPathProps, ...projectPathProps })
      ]}
      exact
    >
      <RedirectToCIProject />
    </RouteWithLayout>
    <RouteWithLayout
      layout={MinimalLayout}
      path={routes.toModuleTrialHome({ ...accountPathProps, module: 'ci' })}
      pageName={PAGE_NAME.CITrialHomePage}
      exact
    >
      <CITrialHomePage />
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={[routes.toCIHome({ ...accountPathProps })]}
      pageName={PAGE_NAME.CIHomePage}
      exact
    >
      <CIHomePage />
    </RouteWithLayout>
    <RouteWithLayout
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toProjectOverview({ ...accountPathProps, ...projectPathProps, ...moduleParams })}
      exact
    >
      <CIDashboardPageOrRedirect />
    </RouteWithLayout>
    {/* <RouteWithLayout path={routes.toCIBuilds({ ...accountPathProps, ...projectPathProps })} exact>
        <CIBuildList />
      </RouteWithLayout>

      <Route path={routes.toCIBuild({ ...accountPathProps, ...projectPathProps, ...buildPathProps })} exact>
        <RedirectToBuildPipelineGraph />
      </Route>

      <BuildSubroute
        path={routes.toCIBuildPipelineGraph({ ...accountPathProps, ...projectPathProps, ...buildPathProps })}
        component={<PipelineGraph />}
      />
      <BuildSubroute
        path={routes.toCIBuildPipelineLog({ ...accountPathProps, ...projectPathProps, ...buildPathProps })}
        component={<PipelineLog />}
      />
      <BuildSubroute
        path={routes.toCIBuildArtifacts({ ...accountPathProps, ...projectPathProps, ...buildPathProps })}
        component={<BuildArtifacts />}
      />
      <BuildSubroute
        path={routes.toCIBuildTests({ ...accountPathProps, ...projectPathProps, ...buildPathProps })}
        component={<BuildTests />}
      />
      <BuildSubroute
        path={routes.toCIBuildInputs({ ...accountPathProps, ...projectPathProps, ...buildPathProps })}
        component={<BuildInputs />}
      />
      <BuildSubroute
        path={routes.toCIBuildCommits({ ...accountPathProps, ...projectPathProps, ...buildPathProps })}
        component={<BuildCommits />}
      /> */}

    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      pageName={PAGE_NAME.GetStartedWithCI}
      path={routes.toGetStartedWithCI({ ...accountPathProps, ...projectPathProps, ...moduleParams })}
    >
      <GetStartedWithCI />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toExecutionCommitsView({
        ...accountPathProps,
        ...executionPathProps,
        ...moduleParams
      })}
      pageName={PAGE_NAME.BuildCommits}
    >
      <ExecutionLandingPage>
        <BuildCommits />
      </ExecutionLandingPage>
    </RouteWithLayout>
    <RouteWithLayout
      exact
      licenseRedirectData={licenseRedirectData}
      sidebarProps={CISideNavProps}
      path={routes.toFileStore({ ...accountPathProps, ...projectPathProps, ...pipelineModuleParams })}
      pageName={PAGE_NAME.FileStorePage}
    >
      <FileStorePage />
    </RouteWithLayout>

    {
      PipelineRouteDestinations({
        pipelineStudioComponent: CIPipelineStudio,
        pipelineStudioPageName: PAGE_NAME.CIPipelineStudio,
        pipelineDeploymentListComponent: CIPipelineDeploymentList,
        pipelineDeploymentListPageName: PAGE_NAME.CIPipelineDeploymentList,
        moduleParams,
        licenseRedirectData,
        sidebarProps: CISideNavProps
      })?.props.children
    }

    {
      AccessControlRouteDestinations({
        moduleParams,
        licenseRedirectData,
        sidebarProps: CISideNavProps
      })?.props.children
    }

    {
      ConnectorRouteDestinations({
        moduleParams,
        licenseRedirectData,
        sidebarProps: CISideNavProps
      })?.props.children
    }

    {
      SecretRouteDestinations({
        moduleParams,
        licenseRedirectData,
        sidebarProps: CISideNavProps
      })?.props.children
    }

    {
      VariableRouteDestinations({
        moduleParams,
        licenseRedirectData,
        sidebarProps: CISideNavProps
      })?.props.children
    }

    {
      DelegateRouteDestinations({
        moduleParams,
        licenseRedirectData,
        sidebarProps: CISideNavProps
      })?.props.children
    }

    {
      TemplateRouteDestinations({
        moduleParams,
        licenseRedirectData,
        sidebarProps: CISideNavProps
      })?.props.children
    }

    {
      GitSyncRouteDestinations({
        moduleParams,
        licenseRedirectData,
        sidebarProps: CISideNavProps
      })?.props.children
    }

    {
      TriggersRouteDestinations({
        moduleParams,
        licenseRedirectData,
        sidebarProps: CISideNavProps
      })?.props.children
    }

    {
      GovernanceRouteDestinations({
        sidebarProps: CISideNavProps,
        pathProps: { ...accountPathProps, ...projectPathProps, ...moduleParams }
      })?.props.children
    }
  </>
)
