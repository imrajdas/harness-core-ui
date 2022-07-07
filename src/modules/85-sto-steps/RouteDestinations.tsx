/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Redirect, Route, useParams } from 'react-router-dom'
import { ConnectorRouteDestinations } from '@connectors/RouteDestinations'
import { DelegateRouteDestinations } from '@delegates/RouteDestinations'
import { GitSyncRouteDestinations } from '@gitsync/RouteDestinations'
import { PipelineRouteDestinations } from '@pipeline/RouteDestinations'
import { AccessControlRouteDestinations } from '@rbac/RouteDestinations'
import { TemplateRouteDestinations } from '@templates-library/RouteDestinations'
import { TriggersRouteDestinations } from '@triggers/RouteDestinations'
import { VariableRouteDestinations } from '@variables/RouteDestinations'
import CIPipelineDeploymentList from '@ci/pages/pipeline-deployment-list/CIPipelineDeploymentList'
import CIPipelineStudio from '@ci/pages/pipeline-studio/CIPipelineStudio'
import { GovernanceRouteDestinations } from '@governance/RouteDestinations'
import { SecretRouteDestinations } from '@secrets/RouteDestinations'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import routes from '@common/RouteDefinitions'
import { RouteWithLayout } from '@common/router'
import { accountPathProps, projectPathProps } from '@common/utils/routeUtils'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import CardRailView from '@pipeline/components/Dashboards/CardRailView/CardRailView'
import ExecutionCard from '@pipeline/components/ExecutionCard/ExecutionCard'
import executionFactory from '@pipeline/factories/ExecutionFactory'
import { StageType } from '@pipeline/utils/stageHelpers'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import ChildAppMounter from 'microfrontends/ChildAppMounter'
import STOSideNav from '@sto-steps/components/STOSideNav/STOSideNav'
import STOExecutionCardSummary from '@sto-steps/components/STOExecutionCardSummary/STOExecutionCardSummary'
import '@sto-steps/components/PipelineStages/SecurityTestsStage'
import { ResourceCategory, ResourceType } from '@rbac/interfaces/ResourceType'
import RbacFactory from '@rbac/factories/RbacFactory'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { String as LocaleString } from 'framework/strings'

const STOApp = React.lazy(() => import('sto/App')) // eslint-disable-line import/no-unresolved

const STOSideNavProps: SidebarContext = {
  navComponent: STOSideNav,
  title: 'Security Tests',
  icon: 'sto-color-filled'
}

const moduleParams: ModulePathParams = {
  module: ':module(sto)'
}

RbacFactory.registerResourceCategory(ResourceCategory.STO, {
  icon: 'sto-color-filled',
  label: 'common.purpose.sto.continuous'
})

RbacFactory.registerResourceTypeHandler(ResourceType.STO_TESTTARGET, {
  icon: 'sto-color-filled',
  label: 'stoSteps.targets.testTargets',
  category: ResourceCategory.STO,
  permissionLabels: {
    [PermissionIdentifier.VIEW_STO_TESTTARGET]: <LocaleString stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.EDIT_STO_TESTTARGET]: <LocaleString stringID="rbac.permissionLabels.createEdit" />
  }
})
RbacFactory.registerResourceTypeHandler(ResourceType.STO_EXEMPTION, {
  icon: 'sto-color-filled',
  label: 'stoSteps.exemptions',
  category: ResourceCategory.STO,
  permissionLabels: {
    [PermissionIdentifier.VIEW_STO_EXEMPTION]: <LocaleString stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.CREATE_STO_EXEMPTION]: <LocaleString stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.APPROVE_STO_EXEMPTION]: <LocaleString stringID="common.approve" />
  }
})
RbacFactory.registerResourceTypeHandler(ResourceType.STO_SCAN, {
  icon: 'sto-color-filled',
  label: 'stoSteps.scans',
  category: ResourceCategory.STO,
  permissionLabels: {
    [PermissionIdentifier.VIEW_STO_SCAN]: <LocaleString stringID="rbac.permissionLabels.view" />
  }
})
RbacFactory.registerResourceTypeHandler(ResourceType.STO_ISSUE, {
  icon: 'sto-color-filled',
  label: 'stoSteps.issues',
  category: ResourceCategory.STO,
  permissionLabels: {
    [PermissionIdentifier.VIEW_STO_ISSUE]: <LocaleString stringID="rbac.permissionLabels.view" />
  }
})

executionFactory.registerCardInfo(StageType.SECURITY, {
  icon: 'sto-color-filled',
  component: STOExecutionCardSummary
})

const RedirectToProjectOverviewPage = (): React.ReactElement => {
  const { accountId } = useParams<ProjectPathProps>()
  const { selectedProject } = useAppStore()

  if (selectedProject) {
    return (
      <Redirect
        to={routes.toSTOProjectOverview({
          accountId,
          orgIdentifier: selectedProject.orgIdentifier || '',
          projectIdentifier: selectedProject.identifier
        })}
      />
    )
  } else {
    return <Redirect to={routes.toSTOOverview({ accountId })} />
  }
}

export default (
  <>
    <RouteWithLayout
      exact
      // licenseRedirectData={licenseRedirectData}
      path={routes.toSTO({ ...accountPathProps })}
    >
      <RedirectToProjectOverviewPage />
    </RouteWithLayout>

    <RouteWithLayout
      exact
      // licenseRedirectData={licenseRedirectData}
      sidebarProps={STOSideNavProps}
      path={[
        routes.toSTOOverview({ ...accountPathProps }),
        routes.toSTOProjectOverview({ ...accountPathProps, ...projectPathProps })
      ]}
    >
      <ChildAppMounter ChildApp={STOApp} customComponents={{ ExecutionCard, CardRailView }} />
    </RouteWithLayout>

    <RouteWithLayout
      sidebarProps={STOSideNavProps}
      path={[
        routes.toSTOTargets({ ...accountPathProps }),
        routes.toSTOProjectTargets({ ...accountPathProps, ...projectPathProps })
      ]}
    >
      <ChildAppMounter ChildApp={STOApp} />
    </RouteWithLayout>

    <Route path="/account/:accountId/:module(sto)">
      <PipelineRouteDestinations
        pipelineStudioComponent={CIPipelineStudio}
        pipelineDeploymentListComponent={CIPipelineDeploymentList}
        moduleParams={moduleParams}
        // licenseRedirectData={licenseRedirectData}
        sidebarProps={STOSideNavProps}
      />
      <AccessControlRouteDestinations
        moduleParams={moduleParams}
        // licenseRedirectData={licenseRedirectData}
        sidebarProps={STOSideNavProps}
      />
      <ConnectorRouteDestinations
        moduleParams={moduleParams}
        // licenseRedirectData={licenseRedirectData}
        sidebarProps={STOSideNavProps}
      />
      <SecretRouteDestinations
        moduleParams={moduleParams}
        // licenseRedirectData={licenseRedirectData}
        sidebarProps={STOSideNavProps}
      />
      <VariableRouteDestinations
        moduleParams={moduleParams}
        // licenseRedirectData={licenseRedirectData}
        sidebarProps={STOSideNavProps}
      />
      <DelegateRouteDestinations
        moduleParams={moduleParams}
        // licenseRedirectData={licenseRedirectData}
        sidebarProps={STOSideNavProps}
      />
      <TemplateRouteDestinations
        moduleParams={moduleParams}
        // licenseRedirectData={licenseRedirectData}
        sidebarProps={STOSideNavProps}
      />
      <GitSyncRouteDestinations
        moduleParams={moduleParams}
        // licenseRedirectData={licenseRedirectData}
        sidebarProps={STOSideNavProps}
      />
      <TriggersRouteDestinations
        moduleParams={moduleParams}
        // licenseRedirectData={licenseRedirectData}
        sidebarProps={STOSideNavProps}
      />
      <GovernanceRouteDestinations
        sidebarProps={STOSideNavProps}
        pathProps={{ ...accountPathProps, ...projectPathProps, ...moduleParams }}
      />
    </Route>
  </>
)
