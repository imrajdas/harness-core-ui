/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC } from 'react'
import { Redirect, Route, useParams } from 'react-router-dom'
import { RouteWithLayout } from '@common/router'
import routes from '@common/RouteDefinitions'
import {
  accountPathProps,
  environmentPathProps,
  featureFlagPathProps,
  projectPathProps,
  segmentPathProps,
  targetPathProps
} from '@common/utils/routeUtils'
import type { AccountPathProps, ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { MinimalLayout } from '@common/layouts'
import CFHomePage from '@cf/pages/home/CFHomePage'
import FeatureFlagsDetailPage from '@cf/pages/feature-flags-detail/FeatureFlagsDetailPage'
import EnvironmentsPage from '@cf/pages/environments/EnvironmentsPage'
import EnvironmentDetails from '@cf/pages/environment-details/EnvironmentDetails'
import CFWorkflowsPage from '@cf/pages/workflows/CFWorkflowsPage'
import { PipelineRouteDestinations } from '@pipeline/RouteDestinations'
import { ConnectorRouteDestinations } from '@connectors/RouteDestinations'
import { GitSyncRouteDestinations } from '@gitsync/RouteDestinations'
import { VariableRouteDestinations } from '@variables/RouteDestinations'
import { SecretRouteDestinations } from '@secrets/RouteDestinations'
import { TemplateRouteDestinations } from '@templates-library/RouteDestinations'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { ModuleName } from 'framework/types/ModuleName'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import { CFSideNavProps } from '@cf/constants'
import CFPipelineDeploymentList from '@cf/pages/pipeline-deployment-list/CFPipelineDeploymentList'
import CFPipelineStudio from '@cf/pages/pipeline-studio/CFPipelineStudio'
import RbacFactory from '@rbac/factories/RbacFactory'
import { ResourceCategory, ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { TriggersRouteDestinations } from '@triggers/RouteDestinations'
import featureFactory from 'framework/featureStore/FeaturesFactory'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { getBannerText } from '@cf/utils/UsageLimitUtils'
import { String } from 'framework/strings'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { GovernanceRouteDestinations } from '@governance/RouteDestinations'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import { RedirectToModuleTrialHomeFactory, RedirectToSubscriptionsFactory } from '@common/Redirects'
import { AccessControlRouteDestinations } from '@rbac/RouteDestinations'
import { LICENSE_STATE_NAMES, LicenseRedirectProps } from 'framework/LicenseStore/LicenseStoreContext'
import { registerFeatureFlagPipelineStage } from './pages/pipeline-studio/views/FeatureFlagStage'
import { registerFlagConfigurationPipelineStep } from './components/PipelineSteps'
import { TargetsPage } from './pages/target-management/targets/TargetsPage'
import { TargetDetailPage as LegacyTargetDetailPage } from './pages/target-details/TargetDetailPage'
import TargetDetailPage from './pages/target-detail/TargetDetailPage'
import { SegmentsPage } from './pages/target-management/segments/SegmentsPage'
import { SegmentDetailPage } from './pages/segment-details/SegmentDetailPage'
import TargetGroupDetailPage from './pages/target-group-detail/TargetGroupDetailPage'
import { OnboardingPage } from './pages/onboarding/OnboardingPage'
import { OnboardingDetailPage } from './pages/onboarding/OnboardingDetailPage'
import CFTrialHomePage from './pages/home/CFTrialHomePage'
import FeatureFlagsLandingPage from './pages/feature-flags/FeatureFlagsLandingPage'
import { FFGitSyncProvider } from './contexts/ff-git-sync-context/FFGitSyncContext'

featureFactory.registerFeaturesByModule('cf', {
  features: [FeatureIdentifier.MAUS],
  renderMessage: (props, getString, additionalLicenseProps = {}) => {
    const monthlyActiveUsers = props.features.get(FeatureIdentifier.MAUS)
    const count = monthlyActiveUsers?.featureDetail?.count
    const limit = monthlyActiveUsers?.featureDetail?.limit

    const { message, bannerType } = getBannerText(getString, additionalLicenseProps, count, limit)

    return {
      message: () => message,
      bannerType
    }
  }
})

const RedirectToCFHome = (): React.ReactElement => {
  const params = useParams<AccountPathProps>()

  return <Redirect to={routes.toCFHome(params)} />
}

const RedirectToCFProject = (): React.ReactElement => {
  const params = useParams<ProjectPathProps>()
  const { selectedProject } = useAppStore()

  if (selectedProject?.modules?.includes(ModuleName.CF)) {
    return <Redirect to={routes.toCFFeatureFlags(params)} />
  } else {
    return <Redirect to={routes.toCFHome(params)} />
  }
}

const RedirectToTargets = (): React.ReactElement => {
  const { withActiveEnvironment } = useActiveEnvironment()
  const params = useParams<ProjectPathProps & AccountPathProps>()

  return <Redirect to={withActiveEnvironment(routes.toCFTargets(params))} />
}

const moduleParams: ModulePathParams = {
  module: ':module(cf)'
}

const licenseRedirectData: LicenseRedirectProps = {
  licenseStateName: LICENSE_STATE_NAMES.FF_LICENSE_STATE,
  startTrialRedirect: RedirectToModuleTrialHomeFactory(ModuleName.CF),
  expiredTrialRedirect: RedirectToSubscriptionsFactory(ModuleName.CF)
}

RbacFactory.registerResourceCategory(ResourceCategory.FEATUREFLAG_FUNCTIONS, {
  icon: 'nav-cf',
  label: 'cf.rbac.category'
})

RbacFactory.registerResourceTypeHandler(ResourceType.FEATUREFLAG, {
  icon: 'nav-cf',
  label: 'cf.rbac.featureflag.label',
  category: ResourceCategory.FEATUREFLAG_FUNCTIONS,
  permissionLabels: {
    [PermissionIdentifier.TOGGLE_FF_FEATUREFLAG]: <String stringID="cf.rbac.featureflag.toggle" />,
    [PermissionIdentifier.EDIT_FF_FEATUREFLAG]: <String stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.DELETE_FF_FEATUREFLAG]: <String stringID="cf.rbac.featureflag.delete" />
  }
})

RbacFactory.registerResourceTypeHandler(ResourceType.TARGETGROUP, {
  icon: 'nav-cf',
  label: 'cf.rbac.targetgroup.label',
  category: ResourceCategory.FEATUREFLAG_FUNCTIONS,
  permissionLabels: {
    [PermissionIdentifier.EDIT_FF_TARGETGROUP]: <String stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.DELETE_FF_TARGETGROUP]: <String stringID="cf.rbac.targetgroup.delete" />
  }
})

registerFeatureFlagPipelineStage()
registerFlagConfigurationPipelineStep()

const CFRoutes: FC = () => {
  const { FF_PIPELINE, FFM_1512, FFM_1827 } = useFeatureFlags()

  return (
    <>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        path={routes.toCF({ ...accountPathProps })}
        exact
        pageName={PAGE_NAME.CFHomePage}
      >
        <RedirectToCFHome />
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        path={routes.toCFProject({ ...accountPathProps, ...projectPathProps })}
        exact
      >
        <RedirectToCFProject />
      </RouteWithLayout>

      <RouteWithLayout
        layout={MinimalLayout}
        path={routes.toModuleTrialHome({ ...accountPathProps, module: 'cf' })}
        exact
        pageName={PAGE_NAME.CFTrialHomePage}
      >
        <CFTrialHomePage />
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={CFSideNavProps}
        path={routes.toCFHome({ ...accountPathProps })}
        exact
        pageName={PAGE_NAME.CFHomePage}
      >
        <CFHomePage />
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={CFSideNavProps}
        path={routes.toCFFeatureFlags({ ...accountPathProps, ...projectPathProps })}
        exact
        pageName={PAGE_NAME.FeatureFlagsLandingPage}
      >
        <FFGitSyncProvider>
          <FeatureFlagsLandingPage />
        </FFGitSyncProvider>
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={CFSideNavProps}
        path={routes.toCFFeatureFlagsDetail({
          ...accountPathProps,
          ...projectPathProps,
          ...featureFlagPathProps
        })}
        exact
        pageName={PAGE_NAME.FeatureFlagsDetailPage}
      >
        <FFGitSyncProvider>
          <FeatureFlagsDetailPage />
        </FFGitSyncProvider>
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={CFSideNavProps}
        path={routes.toCFSegmentDetails({
          ...accountPathProps,
          ...projectPathProps,
          ...segmentPathProps
        })}
        exact
        pageName={FFM_1512 ? PAGE_NAME.TargetGroupDetailPage : PAGE_NAME.SegmentDetailPage}
      >
        <FFGitSyncProvider> {FFM_1512 ? <TargetGroupDetailPage /> : <SegmentDetailPage />}</FFGitSyncProvider>
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={CFSideNavProps}
        path={routes.toCFTargetDetails({
          ...accountPathProps,
          ...projectPathProps,
          ...targetPathProps
        })}
        exact
        pageName={FFM_1827 ? PAGE_NAME.TargetDetailPage : PAGE_NAME.LegacyTargetDetailPage}
      >
        <FFGitSyncProvider> {FFM_1827 ? <TargetDetailPage /> : <LegacyTargetDetailPage />} </FFGitSyncProvider>
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        path={routes.toCFTargetManagement({ ...accountPathProps, ...projectPathProps })}
        exact
      >
        <RedirectToTargets />
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={CFSideNavProps}
        path={routes.toCFSegments({ ...accountPathProps, ...projectPathProps })}
        exact
        pageName={PAGE_NAME.SegmentsPage}
      >
        <FFGitSyncProvider>
          <SegmentsPage />
        </FFGitSyncProvider>
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={CFSideNavProps}
        path={routes.toCFTargets({ ...accountPathProps, ...projectPathProps })}
        exact
        pageName={PAGE_NAME.TargetsPage}
      >
        <TargetsPage />
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={CFSideNavProps}
        path={routes.toCFEnvironments({ ...accountPathProps, ...projectPathProps })}
        exact
        pageName={PAGE_NAME.EnvironmentsPage}
      >
        <FFGitSyncProvider>
          <EnvironmentsPage />
        </FFGitSyncProvider>
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={CFSideNavProps}
        path={routes.toCFEnvironmentDetails({ ...accountPathProps, ...projectPathProps, ...environmentPathProps })}
        exact
        pageName={PAGE_NAME.EnvironmentDetails}
      >
        <FFGitSyncProvider>
          <EnvironmentDetails />
        </FFGitSyncProvider>
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={CFSideNavProps}
        path={routes.toCFOnboarding({ ...accountPathProps, ...projectPathProps, ...environmentPathProps })}
        exact
        pageName={PAGE_NAME.OnboardingPage}
      >
        <OnboardingPage />
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={CFSideNavProps}
        path={routes.toCFOnboardingDetail({ ...accountPathProps, ...projectPathProps, ...environmentPathProps })}
        exact
        pageName={PAGE_NAME.OnboardingDetailPage}
      >
        <OnboardingDetailPage />
      </RouteWithLayout>

      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={CFSideNavProps}
        path={routes.toCFWorkflows({ ...accountPathProps, ...projectPathProps })}
        exact
        pageName={PAGE_NAME.CFWorkflowsPage}
      >
        <CFWorkflowsPage />
      </RouteWithLayout>

      <Route path="/account/:accountId/:module(cf)">
        <TemplateRouteDestinations
          moduleParams={moduleParams}
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CFSideNavProps}
        />
        <ConnectorRouteDestinations
          moduleParams={moduleParams}
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CFSideNavProps}
        />
        <SecretRouteDestinations
          moduleParams={moduleParams}
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CFSideNavProps}
        />
        <VariableRouteDestinations
          moduleParams={moduleParams}
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CFSideNavProps}
        />
        <GitSyncRouteDestinations
          moduleParams={moduleParams}
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CFSideNavProps}
        />
        <AccessControlRouteDestinations
          moduleParams={moduleParams}
          licenseRedirectData={licenseRedirectData}
          sidebarProps={CFSideNavProps}
        />
        {FF_PIPELINE && (
          <>
            <PipelineRouteDestinations
              pipelineStudioComponent={CFPipelineStudio}
              pipelineDeploymentListComponent={CFPipelineDeploymentList}
              moduleParams={moduleParams}
              licenseRedirectData={licenseRedirectData}
              sidebarProps={CFSideNavProps}
            />
            <TriggersRouteDestinations
              moduleParams={moduleParams}
              licenseRedirectData={licenseRedirectData}
              sidebarProps={CFSideNavProps}
            />
          </>
        )}
        <GovernanceRouteDestinations
          sidebarProps={CFSideNavProps}
          pathProps={{ ...accountPathProps, ...projectPathProps, ...moduleParams }}
        />
      </Route>
    </>
  )
}

export default CFRoutes
