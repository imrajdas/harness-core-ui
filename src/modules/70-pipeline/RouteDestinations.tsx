/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Redirect, Route, useParams } from 'react-router-dom'
import type {
  ExecutionPathProps,
  Module,
  ModulePathParams,
  PipelinePathProps,
  PipelineType
} from '@common/interfaces/RouteInterfaces'
import { EmptyLayout, MinimalLayout } from '@common/layouts'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import { RouteWithLayout } from '@common/router'
import {
  accountPathProps,
  executionPathProps,
  inputSetFormPathProps,
  pipelinePathProps,
  projectPathProps
} from '@common/utils/routeUtils'
import { EnhancedInputSetForm } from '@pipeline/components/InputSetForm/InputSetForm'
import ExecutionArtifactsView from '@pipeline/pages/execution/ExecutionArtifactsView/ExecutionArtifactsView'
import ExecutionInputsView from '@pipeline/pages/execution/ExecutionInputsView/ExecutionInputsView'
import ExecutionLandingPage from '@pipeline/pages/execution/ExecutionLandingPage/ExecutionLandingPage'
import ExecutionPipelineView from '@pipeline/pages/execution/ExecutionPipelineView/ExecutionPipelineView'
import ExecutionPolicyEvaluationsView from '@pipeline/pages/execution/ExecutionPolicyEvaluationsView/ExecutionPolicyEvaluationsView'
import ExecutionSecurityView from '@pipeline/pages/execution/ExecutionSecurityView/ExecutionSecurityView'
import BuildTests from '@pipeline/pages/execution/ExecutionTestView/BuildTests'
import FullPageLogView from '@pipeline/pages/full-page-log-view/FullPageLogView'
import InputSetList from '@pipeline/pages/inputSet-list/InputSetList'
import PipelineDetails from '@pipeline/pages/pipeline-details/PipelineDetails'
import PipelinesPage from '@pipeline/pages/pipelines/PipelinesPage'
import { PipelineListPage } from '@pipeline/pages/pipeline-list/PipelineListPage'
import DeploymentsList from '@pipeline/pages/deployments-list/DeploymentsList'
import type { LicenseRedirectProps } from 'framework/LicenseStore/LicenseStoreContext'
import '@pipeline/components/CommonPipelineStages/ApprovalStage'
import '@pipeline/components/CommonPipelineStages/CustomStage'
import '@pipeline/components/CommonPipelineStages/PipelineStage'

import RbacFactory from '@rbac/factories/RbacFactory'
import ExecFactory from '@pipeline/factories/ExecutionFactory'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { String } from 'framework/strings'
import LandingDashboardFactory from '@common/factories/LandingDashboardFactory'
import LandingDashboardDeploymentsWidget from '@pipeline/components/LandingDashboardDeploymentsWidget/LandingDashboardDeploymentsWidget'

import PipelineResourceModal from '@pipeline/components/RbacResourceModals/PipelineResourceModal/PipelineResourceModal'
import ServiceResourceModal from '@pipeline/components/RbacResourceModals/ServiceResourceModal/ServiceResourceModal'
import EnvironmentResourceModal from '@pipeline/components/RbacResourceModals/EnvironmentResourceModal/EnvironmentResourceModal'
import EnvironmentGroupsResourceModal from '@pipeline/components/RbacResourceModals/EnvironmentGroupsResourceModal/EnvironmentGroupsResourceModal'
import { HarnessApprovalView } from '@pipeline/components/execution/StepDetails/views/HarnessApprovalView/HarnessApprovalView'
import { JiraApprovalView } from '@pipeline/components/execution/StepDetails/views/JiraApprovalView/JiraApprovalView'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { ServiceNowApprovalView } from '@pipeline/components/execution/StepDetails/views/ServiceNowApprovalView/ServiceNowApprovalView'
import { CustomApprovalView } from '@pipeline/components/execution/StepDetails/views/CustomApprovalView/CustomApprovalView'
import { PolicyEvaluationView } from '@pipeline/components/execution/StepDetails/views/PolicyEvaluationView/PolicyEvaluationView'
import { QueueStepView } from '@pipeline/components/execution/StepDetails/views/QueueStepView/QueueStepView'
import type { ResourceDTO } from 'services/audit'
import AuditTrailFactory, { ResourceScope } from '@audit-trail/factories/AuditTrailFactory'
import routes from '@common/RouteDefinitions'
import { ServiceNowCreateUpdateView } from '@pipeline/components/execution/StepDetails/views/ServiceNowCreateUpdateView/ServiceNowCreateUpdateView'
import { ModuleName } from 'framework/types/ModuleName'
import PipelineResourceRenderer from './components/RbacResourceModals/PipelineResourceRenderer/PipelineResourceRenderer'
import { JiraCreateUpdateView } from './components/execution/StepDetails/views/JiraCreateUpdateView/JiraCreateUpdateView'
import ExecutionErrorTrackingView from './pages/execution/ExecutionErrorTrackingView/ExecutionErrorTrackingView'
/**
 * Register RBAC resources
 */
RbacFactory.registerResourceTypeHandler(ResourceType.PIPELINE, {
  icon: 'pipeline-deployment',
  label: 'pipelines',
  permissionLabels: {
    [PermissionIdentifier.VIEW_PIPELINE]: <String stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.EDIT_PIPELINE]: <String stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.DELETE_PIPELINE]: <String stringID="rbac.permissionLabels.delete" />,
    [PermissionIdentifier.EXECUTE_PIPELINE]: <String stringID="rbac.permissionLabels.execute" />
  },
  // eslint-disable-next-line react/display-name
  addResourceModalBody: props => <PipelineResourceModal {...props} />,
  // eslint-disable-next-line react/display-name
  staticResourceRenderer: props => <PipelineResourceRenderer {...props} />
})

RbacFactory.registerResourceTypeHandler(ResourceType.SERVICE, {
  icon: 'service-deployment',
  label: 'services',
  permissionLabels: {
    [PermissionIdentifier.VIEW_SERVICE]: <String stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.EDIT_SERVICE]: <String stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.DELETE_SERVICE]: <String stringID="rbac.permissionLabels.delete" />,
    [PermissionIdentifier.RUNTIMEACCESS_SERVICE]: <String stringID="rbac.permissionLabels.access" />
  },
  // eslint-disable-next-line react/display-name
  addResourceModalBody: props => <ServiceResourceModal {...props} />
})

RbacFactory.registerResourceTypeHandler(ResourceType.ENVIRONMENT, {
  icon: 'environment',
  label: 'environments',
  permissionLabels: {
    [PermissionIdentifier.VIEW_ENVIRONMENT]: <String stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.EDIT_ENVIRONMENT]: <String stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.DELETE_ENVIRONMENT]: <String stringID="rbac.permissionLabels.delete" />,
    [PermissionIdentifier.RUNTIMEACCESS_ENVIRONMENT]: <String stringID="rbac.permissionLabels.access" />
  },
  // eslint-disable-next-line react/display-name
  addResourceModalBody: props => <EnvironmentResourceModal {...props} />
})

RbacFactory.registerResourceTypeHandler(ResourceType.ENVIRONMENT_GROUP, {
  icon: 'environment-group',
  label: 'common.environmentGroups.label',
  permissionLabels: {
    [PermissionIdentifier.VIEW_ENVIRONMENT_GROUP]: <String stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.EDIT_ENVIRONMENT_GROUP]: <String stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.DELETE_ENVIRONMENT_GROUP]: <String stringID="rbac.permissionLabels.delete" />
  },
  addResourceModalBody: props => <EnvironmentGroupsResourceModal {...props} />
})

/**
 * Register execution step detail views
 */
ExecFactory.registerStepDetails(StepType.HarnessApproval, {
  component: HarnessApprovalView
})

ExecFactory.registerStepDetails(StepType.JiraCreate, {
  component: JiraCreateUpdateView
})

ExecFactory.registerStepDetails(StepType.JiraUpdate, {
  component: JiraCreateUpdateView
})

ExecFactory.registerStepDetails(StepType.JiraApproval, {
  component: JiraApprovalView
})

ExecFactory.registerStepDetails(StepType.ServiceNowApproval, {
  component: ServiceNowApprovalView
})

ExecFactory.registerStepDetails(StepType.CustomApproval, {
  component: CustomApprovalView
})

ExecFactory.registerStepDetails(StepType.ServiceNowCreate, {
  component: ServiceNowCreateUpdateView
})
ExecFactory.registerStepDetails(StepType.ServiceNowUpdate, {
  component: ServiceNowCreateUpdateView
})

ExecFactory.registerStepDetails(StepType.Policy, {
  component: PolicyEvaluationView
})

ExecFactory.registerStepDetails(StepType.Queue, {
  component: QueueStepView
})

/**
 * Register for Landing Page
 * */
LandingDashboardFactory.registerModuleDashboardHandler(ModuleName.CD, {
  label: 'deploymentsText',
  icon: 'cd-main',
  iconProps: { size: 20 },
  // eslint-disable-next-line react/display-name
  moduleDashboardRenderer: () => <LandingDashboardDeploymentsWidget />
})

/**
 * Register for Audit Trail
 * */
const cdLabel = 'common.purpose.cd.continuous'
AuditTrailFactory.registerResourceHandler(ResourceType.PIPELINE, {
  moduleIcon: {
    name: 'cd-main'
  },
  moduleLabel: cdLabel,
  resourceLabel: 'common.pipeline',
  resourceUrl: (_: ResourceDTO, resourceScope: ResourceScope, module?: Module) => {
    const { accountIdentifier, orgIdentifier, projectIdentifier } = resourceScope
    if (module && orgIdentifier && projectIdentifier) {
      return routes.toPipelines({
        module,
        orgIdentifier,
        projectIdentifier,
        accountId: accountIdentifier
      })
    }
    return undefined
  }
})

AuditTrailFactory.registerResourceHandler(ResourceType.SERVICE, {
  moduleIcon: {
    name: 'cd-main'
  },
  moduleLabel: cdLabel,
  resourceLabel: 'service',
  resourceUrl: (_: ResourceDTO, resourceScope: ResourceScope, module?: Module) => {
    const { accountIdentifier, orgIdentifier, projectIdentifier } = resourceScope
    if (module && orgIdentifier && projectIdentifier) {
      return routes.toServices({
        module,
        orgIdentifier,
        projectIdentifier,
        accountId: accountIdentifier
      })
    }
    return undefined
  }
})

AuditTrailFactory.registerResourceHandler(ResourceType.ENVIRONMENT, {
  moduleIcon: {
    name: 'cd-main'
  },
  moduleLabel: cdLabel,
  resourceLabel: 'environment'
})

export function RedirectToPipelineDetailHome(): React.ReactElement {
  const params = useParams<PipelineType<PipelinePathProps>>()

  return <Redirect to={routes.toPipelineStudio(params)} />
}

export function RedirectToExecutionPipeline(): React.ReactElement {
  const params = useParams<PipelineType<ExecutionPathProps>>()

  return <Redirect to={routes.toExecutionPipelineView(params)} />
}

interface PipelineRouteDestinationsProps {
  pipelineStudioComponent: React.FC
  pipelineStudioPageName?: PAGE_NAME
  pipelineDeploymentListComponent: React.FC
  pipelineDeploymentListPageName?: PAGE_NAME
  moduleParams: ModulePathParams
  licenseRedirectData?: LicenseRedirectProps
  sidebarProps?: SidebarContext
}

export function PipelineRouteDestinations({
  pipelineStudioComponent: PipelineStudio,
  pipelineStudioPageName,
  pipelineDeploymentListComponent: PipelineDeploymentList,
  pipelineDeploymentListPageName,
  moduleParams,
  licenseRedirectData,
  sidebarProps
}: PipelineRouteDestinationsProps) {
  return (
    <>
      <RouteWithLayout
        exact
        licenseRedirectData={licenseRedirectData}
        sidebarProps={sidebarProps}
        path={routes.toPipelineStudio({ ...accountPathProps, ...pipelinePathProps, ...moduleParams })}
        pageName={pipelineStudioPageName}
      >
        <PipelineDetails>
          <PipelineStudio />
        </PipelineDetails>
      </RouteWithLayout>
      <RouteWithLayout
        exact
        layout={EmptyLayout}
        licenseRedirectData={licenseRedirectData}
        sidebarProps={sidebarProps}
        path={routes.toPipelineLogs({
          ...accountPathProps,
          ...executionPathProps,
          ...moduleParams,
          stageIdentifier: ':stageIdentifier',
          stepIndentifier: ':stepIndentifier'
        })}
        pageName={PAGE_NAME.FullPageLogView}
      >
        <FullPageLogView />
      </RouteWithLayout>
      <RouteWithLayout
        exact
        licenseRedirectData={licenseRedirectData}
        sidebarProps={sidebarProps}
        path={routes.toPipelineList({ ...accountPathProps, ...projectPathProps, ...moduleParams })}
        pageName={PAGE_NAME.PipelineListPage}
      >
        <PipelineListPage />
      </RouteWithLayout>
      <RouteWithLayout
        exact
        licenseRedirectData={licenseRedirectData}
        sidebarProps={sidebarProps}
        path={routes.toPipelines({ ...accountPathProps, ...projectPathProps, ...moduleParams })}
        pageName={PAGE_NAME.PipelinesPage}
      >
        <PipelinesPage />
      </RouteWithLayout>
      <RouteWithLayout
        exact
        licenseRedirectData={licenseRedirectData}
        sidebarProps={sidebarProps}
        path={routes.toDeployments({ ...accountPathProps, ...projectPathProps, ...moduleParams })}
      >
        <DeploymentsList />
      </RouteWithLayout>
      <RouteWithLayout
        exact
        licenseRedirectData={licenseRedirectData}
        sidebarProps={sidebarProps}
        path={routes.toInputSetList({ ...accountPathProps, ...pipelinePathProps, ...moduleParams })}
        pageName={PAGE_NAME.InputSetList}
      >
        <PipelineDetails>
          <InputSetList />
        </PipelineDetails>
      </RouteWithLayout>
      <RouteWithLayout
        exact
        licenseRedirectData={licenseRedirectData}
        sidebarProps={sidebarProps}
        path={routes.toInputSetForm({ ...accountPathProps, ...inputSetFormPathProps, ...moduleParams })}
        pageName={PAGE_NAME.EnhancedInputSetForm}
      >
        <EnhancedInputSetForm />
      </RouteWithLayout>
      <Route
        exact
        licenseStateName={licenseRedirectData?.licenseStateName}
        sidebarProps={sidebarProps}
        path={routes.toExecution({ ...accountPathProps, ...executionPathProps, ...moduleParams })}
      >
        <RedirectToExecutionPipeline />
      </Route>
      <RouteWithLayout
        exact
        licenseRedirectData={licenseRedirectData}
        sidebarProps={sidebarProps}
        layout={MinimalLayout}
        path={routes.toExecutionPipelineView({ ...accountPathProps, ...executionPathProps, ...moduleParams })}
        pageName={PAGE_NAME.ExecutionPipelineView}
      >
        <ExecutionLandingPage>
          <ExecutionPipelineView />
        </ExecutionLandingPage>
      </RouteWithLayout>
      <RouteWithLayout
        exact
        licenseRedirectData={licenseRedirectData}
        sidebarProps={sidebarProps}
        layout={MinimalLayout}
        path={routes.toExecutionPolicyEvaluationsView({
          ...accountPathProps,
          ...executionPathProps,
          ...moduleParams
        })}
        pageName={PAGE_NAME.ExecutionPolicyEvaluationsView}
      >
        <ExecutionLandingPage>
          <ExecutionPolicyEvaluationsView />
        </ExecutionLandingPage>
      </RouteWithLayout>
      <RouteWithLayout
        exact
        licenseRedirectData={licenseRedirectData}
        sidebarProps={sidebarProps}
        layout={MinimalLayout}
        path={routes.toExecutionSecurityView({
          ...accountPathProps,
          ...executionPathProps,
          ...moduleParams
        })}
        pageName={PAGE_NAME.ExecutionSecurityView}
      >
        <ExecutionLandingPage>
          <ExecutionSecurityView />
        </ExecutionLandingPage>
      </RouteWithLayout>
      <RouteWithLayout
        licenseRedirectData={licenseRedirectData}
        sidebarProps={sidebarProps}
        layout={MinimalLayout}
        path={routes.toExecutionErrorTrackingView({
          ...accountPathProps,
          ...executionPathProps,
          ...moduleParams
        })}
        pageName={PAGE_NAME.ErrorTrackingListPage}
      >
        <ExecutionLandingPage>
          <ExecutionErrorTrackingView />
        </ExecutionLandingPage>
      </RouteWithLayout>
      <RouteWithLayout
        exact
        licenseRedirectData={licenseRedirectData}
        sidebarProps={sidebarProps}
        layout={MinimalLayout}
        path={routes.toExecutionInputsView({ ...accountPathProps, ...executionPathProps, ...moduleParams })}
        pageName={PAGE_NAME.ExecutionInputsView}
      >
        <ExecutionLandingPage>
          <ExecutionInputsView />
        </ExecutionLandingPage>
      </RouteWithLayout>
      <RouteWithLayout
        exact
        licenseRedirectData={licenseRedirectData}
        sidebarProps={sidebarProps}
        layout={MinimalLayout}
        path={routes.toExecutionArtifactsView({
          ...accountPathProps,
          ...executionPathProps,
          ...moduleParams
        })}
        pageName={PAGE_NAME.ExecutionArtifactsView}
      >
        <ExecutionLandingPage>
          <ExecutionArtifactsView />
        </ExecutionLandingPage>
      </RouteWithLayout>
      <RouteWithLayout
        exact
        licenseRedirectData={licenseRedirectData}
        sidebarProps={sidebarProps}
        layout={MinimalLayout}
        path={routes.toExecutionTestsView({
          ...accountPathProps,
          ...executionPathProps,
          ...moduleParams
        })}
        pageName={PAGE_NAME.BuildTests}
      >
        <ExecutionLandingPage>
          <BuildTests />
        </ExecutionLandingPage>
      </RouteWithLayout>
      <RouteWithLayout
        exact
        licenseRedirectData={licenseRedirectData}
        sidebarProps={sidebarProps}
        path={routes.toPipelineDeploymentList({
          ...accountPathProps,
          ...pipelinePathProps,
          ...moduleParams
        })}
        pageName={pipelineDeploymentListPageName}
      >
        <PipelineDetails>
          <PipelineDeploymentList />
        </PipelineDetails>
      </RouteWithLayout>
      <RouteWithLayout
        exact
        licenseRedirectData={licenseRedirectData}
        sidebarProps={sidebarProps}
        path={routes.toPipelineDetail({ ...accountPathProps, ...pipelinePathProps, ...moduleParams })}
      >
        <RedirectToPipelineDetailHome />
      </RouteWithLayout>
    </>
  )
}
