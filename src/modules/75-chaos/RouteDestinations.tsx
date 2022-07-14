/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Redirect, useParams } from 'react-router-dom'
import { OverviewChartsWithToggle } from '@common/components/OverviewChartsWithToggle/OverviewChartsWithToggle'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import routes from '@common/RouteDefinitions'
import { RouteWithLayout } from '@common/router'
import {
  accountPathProps,
  connectorPathProps,
  delegateConfigProps,
  delegatePathProps,
  orgPathProps,
  pipelineModuleParams,
  projectPathProps,
  resourceGroupPathProps,
  rolePathProps,
  secretPathProps,
  serviceAccountProps,
  userGroupPathProps,
  userPathProps
} from '@common/utils/routeUtils'
import { String as LocaleString } from 'framework/strings'
import ChildAppMounter from 'microfrontends/ChildAppMounter'
import AccessControlPage from '@rbac/pages/AccessControl/AccessControlPage'
import UsersPage from '@rbac/pages/Users/UsersPage'
import UserDetails from '@rbac/pages/UserDetails/UserDetails'
import UserGroups from '@rbac/pages/UserGroups/UserGroups'
import UserGroupDetails from '@rbac/pages/UserGroupDetails/UserGroupDetails'
import ServiceAccountsPage from '@rbac/pages/ServiceAccounts/ServiceAccounts'
import ServiceAccountDetails from '@rbac/pages/ServiceAccountDetails/ServiceAccountDetails'
import ResourceGroups from '@rbac/pages/ResourceGroups/ResourceGroups'
import RoleDetails from '@rbac/pages/RoleDetails/RoleDetails'
import Roles from '@rbac/pages/Roles/Roles'
import ResourceGroupDetails from '@rbac/pages/ResourceGroupDetails/ResourceGroupDetails'
import { ResourceCategory, ResourceType } from '@rbac/interfaces/ResourceType'
import RbacFactory from '@rbac/factories/RbacFactory'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import ConnectorsPage from '@connectors/pages/connectors/ConnectorsPage'
import { ConnectorReferenceField } from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'
import CreateConnectorFromYamlPage from '@connectors/pages/createConnectorFromYaml/CreateConnectorFromYamlPage'
import SecretsPage from '@secrets/pages/secrets/SecretsPage'
import VariablesPage from '@variables/pages/variables/VariablesPage'
import ConnectorDetailsPage from '@connectors/pages/connectors/ConnectorDetailsPage/ConnectorDetailsPage'
import { RedirectToSecretDetailHome } from '@secrets/RouteDestinations'
import SecretDetailsHomePage from '@secrets/pages/secretDetailsHomePage/SecretDetailsHomePage'
import SecretDetails from '@secrets/pages/secretDetails/SecretDetails'
import SecretReferences from '@secrets/pages/secretReferences/SecretReferences'
import DelegatesPage from '@delegates/pages/delegates/DelegatesPage'
import DelegateListing from '@delegates/pages/delegates/DelegateListing'
import DelegateConfigurations from '@delegates/pages/delegates/DelegateConfigurations'
import DelegateDetails from '@delegates/pages/delegates/DelegateDetails'
import DelegateProfileDetails from '@delegates/pages/delegates/DelegateConfigurationDetailPage'
import DelegateTokens from '@delegates/components/DelegateTokens/DelegateTokens'
import CreateSecretFromYamlPage from '@secrets/pages/createSecretFromYaml/CreateSecretFromYamlPage'
import { validateYAMLWithSchema } from '@common/utils/YamlUtils'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import ChaosHomePage from './pages/home/ChaosHomePage'
import type { ChaosCustomMicroFrontendProps } from './interfaces/Chaos.types'
import ChaosSideNav from './components/ChaosSideNav/ChaosSideNav'

// eslint-disable-next-line import/no-unresolved
const ChaosMicroFrontend = React.lazy(() => import('chaos/MicroFrontendApp'))

const ChaosSideNavProps: SidebarContext = {
  navComponent: ChaosSideNav,
  subtitle: 'Chaos',
  title: 'Engineering',
  icon: 'command-stop'
}

const chaosModuleParams: ModulePathParams = {
  module: ':module(chaos)'
}
const module = 'chaos'

// RedirectToAccessControlHome: redirects to users page in access control
const RedirectToAccessControlHome = (): React.ReactElement => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

  return <Redirect to={routes.toUsers({ accountId, projectIdentifier, orgIdentifier, module })} />
}

// RedirectToChaosProject: if project is selected redirects to project dashboard, else to module homepage
const RedirectToChaosProject = (): React.ReactElement => {
  const { accountId } = useParams<ProjectPathProps>()
  const { selectedProject } = useAppStore()
  if (selectedProject) {
    return (
      <Redirect
        to={routes.toProjectOverview({
          accountId,
          orgIdentifier: selectedProject.orgIdentifier || '',
          projectIdentifier: selectedProject.identifier,
          module
        })}
      />
    )
  } else {
    return <Redirect to={routes.toModuleHome({ accountId, module })} />
  }
}

export default function ChaosRoutes(): React.ReactElement {
  const isChaosEnabled = useFeatureFlag(FeatureFlag.CHAOS_ENABLED)

  // Register Chaos into RBAC Factory only when Feature Flag is enabled
  if (isChaosEnabled) {
    RbacFactory.registerResourceCategory(ResourceCategory.CHAOS, {
      icon: 'ci-dev-exp',
      label: 'common.chaosText'
    })

    RbacFactory.registerResourceTypeHandler(ResourceType.CHAOS_HUB, {
      icon: 'ci-dev-exp',
      label: 'chaos.chaoshub',
      category: ResourceCategory.CHAOS,
      permissionLabels: {
        [PermissionIdentifier.VIEW_CHAOSHUB]: <LocaleString stringID="rbac.permissionLabels.view" />,
        [PermissionIdentifier.EDIT_CHAOSHUB]: <LocaleString stringID="rbac.permissionLabels.createEdit" />,
        [PermissionIdentifier.DELETE_CHAOSHUB]: <LocaleString stringID="delete" />
      }
    })
  }

  return (
    <>
      <RouteWithLayout sidebarProps={ChaosSideNavProps} path={routes.toChaos({ ...accountPathProps })} exact>
        <RedirectToChaosProject />
      </RouteWithLayout>

      {/* Chaos Routes */}
      <RouteWithLayout
        sidebarProps={ChaosSideNavProps}
        path={routes.toModuleHome({ ...projectPathProps, ...chaosModuleParams })}
        exact
        pageName={PAGE_NAME.ChaosHomePage}
      >
        <ChaosHomePage />
      </RouteWithLayout>

      {/* Access Control */}
      <RouteWithLayout
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toConnectors({ ...accountPathProps, ...projectPathProps, ...chaosModuleParams })}
      >
        <ConnectorsPage />
      </RouteWithLayout>
      <RouteWithLayout
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toCreateConnectorFromYaml({ ...accountPathProps, ...projectPathProps, ...chaosModuleParams })}
        pageName={PAGE_NAME.CreateConnectorFromYamlPage}
      >
        <CreateConnectorFromYamlPage />
      </RouteWithLayout>
      <RouteWithLayout
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toCreateConnectorFromYaml({ ...accountPathProps, ...orgPathProps })}
        pageName={PAGE_NAME.CreateConnectorFromYamlPage}
      >
        <CreateConnectorFromYamlPage />
      </RouteWithLayout>
      <RouteWithLayout
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toSecrets({ ...accountPathProps, ...projectPathProps, ...chaosModuleParams })}
        pageName={PAGE_NAME.SecretsPage}
      >
        <SecretsPage />
      </RouteWithLayout>
      <RouteWithLayout
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toVariables({ ...accountPathProps, ...projectPathProps, ...chaosModuleParams })}
      >
        <VariablesPage />
      </RouteWithLayout>
      <RouteWithLayout
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toConnectorDetails({
          ...accountPathProps,
          ...projectPathProps,
          ...connectorPathProps,
          ...pipelineModuleParams
        })}
        pageName={PAGE_NAME.ConnectorDetailsPage}
      >
        <ConnectorDetailsPage />
      </RouteWithLayout>
      <RouteWithLayout
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toSecretDetails({
          ...accountPathProps,
          ...projectPathProps,
          ...secretPathProps,
          ...pipelineModuleParams
        })}
      >
        <RedirectToSecretDetailHome />
      </RouteWithLayout>
      <RouteWithLayout
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toSecretDetailsOverview({
          ...accountPathProps,
          ...projectPathProps,
          ...secretPathProps,
          ...pipelineModuleParams
        })}
        pageName={PAGE_NAME.SecretDetails}
      >
        <SecretDetailsHomePage>
          <SecretDetails />
        </SecretDetailsHomePage>
      </RouteWithLayout>
      <RouteWithLayout
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toSecretDetailsReferences({
          ...accountPathProps,
          ...projectPathProps,
          ...secretPathProps,
          ...pipelineModuleParams
        })}
        pageName={PAGE_NAME.SecretReferences}
      >
        <SecretDetailsHomePage>
          <SecretReferences />
        </SecretDetailsHomePage>
      </RouteWithLayout>
      <RouteWithLayout
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toDelegateList({
          ...accountPathProps,
          ...projectPathProps,
          ...pipelineModuleParams
        })}
        pageName={PAGE_NAME.DelegateListing}
      >
        <DelegatesPage>
          <DelegateListing />
        </DelegatesPage>
      </RouteWithLayout>
      <RouteWithLayout
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toDelegateConfigs({
          ...accountPathProps,
          ...projectPathProps,
          ...pipelineModuleParams
        })}
        pageName={PAGE_NAME.DelegateConfigurations}
      >
        <DelegatesPage>
          <DelegateConfigurations />
        </DelegatesPage>
      </RouteWithLayout>
      <RouteWithLayout
        exact
        sidebarProps={ChaosSideNavProps}
        path={routes.toDelegatesDetails({
          ...accountPathProps,
          ...projectPathProps,
          ...delegatePathProps,
          ...pipelineModuleParams
        })}
        pageName={PAGE_NAME.DelegateDetails}
      >
        <DelegateDetails />
      </RouteWithLayout>
      <RouteWithLayout
        exact
        sidebarProps={ChaosSideNavProps}
        path={[
          routes.toDelegateConfigsDetails({
            ...accountPathProps,
            ...projectPathProps,
            ...delegateConfigProps,
            ...pipelineModuleParams
          }),
          routes.toEditDelegateConfigsDetails({
            ...accountPathProps,
            ...projectPathProps,
            ...delegateConfigProps,
            ...pipelineModuleParams
          })
        ]}
        pageName={PAGE_NAME.DelegateProfileDetails}
      >
        <DelegateProfileDetails />
      </RouteWithLayout>

      <RouteWithLayout
        exact
        sidebarProps={ChaosSideNavProps}
        path={[
          routes.toDelegateTokens({
            ...accountPathProps,
            ...projectPathProps,
            ...pipelineModuleParams
          })
        ]}
        pageName={PAGE_NAME.DelegateTokens}
      >
        <DelegatesPage>
          <DelegateTokens />
        </DelegatesPage>
      </RouteWithLayout>
      <RouteWithLayout
        sidebarProps={ChaosSideNavProps}
        path={routes.toCreateSecretFromYaml({
          ...accountPathProps,
          ...projectPathProps,
          ...orgPathProps,
          ...pipelineModuleParams
        })}
        exact
        pageName={PAGE_NAME.CreateSecretFromYamlPage}
      >
        <CreateSecretFromYamlPage />
      </RouteWithLayout>
      <RouteWithLayout
        sidebarProps={ChaosSideNavProps}
        path={routes.toAccessControl({ ...projectPathProps, ...chaosModuleParams })}
        exact
      >
        <RedirectToAccessControlHome />
      </RouteWithLayout>
      <RouteWithLayout
        sidebarProps={ChaosSideNavProps}
        path={[routes.toUsers({ ...projectPathProps, ...chaosModuleParams })]}
        exact
        pageName={PAGE_NAME.UsersPage}
      >
        <AccessControlPage>
          <UsersPage />
        </AccessControlPage>
      </RouteWithLayout>

      <RouteWithLayout
        sidebarProps={ChaosSideNavProps}
        path={routes.toUserDetails({ ...projectPathProps, ...chaosModuleParams, ...userPathProps })}
        exact
        pageName={PAGE_NAME.UserDetails}
      >
        <UserDetails />
      </RouteWithLayout>

      <RouteWithLayout
        sidebarProps={ChaosSideNavProps}
        path={[routes.toUserGroups({ ...projectPathProps, ...chaosModuleParams })]}
        exact
        pageName={PAGE_NAME.UserGroups}
      >
        <AccessControlPage>
          <UserGroups />
        </AccessControlPage>
      </RouteWithLayout>

      <RouteWithLayout
        sidebarProps={ChaosSideNavProps}
        path={routes.toUserGroupDetails({ ...projectPathProps, ...chaosModuleParams, ...userGroupPathProps })}
        exact
        pageName={PAGE_NAME.UserGroupDetails}
      >
        <UserGroupDetails />
      </RouteWithLayout>

      <RouteWithLayout
        sidebarProps={ChaosSideNavProps}
        path={routes.toServiceAccounts({ ...projectPathProps, ...chaosModuleParams })}
        exact
        pageName={PAGE_NAME.ServiceAccountsPage}
      >
        <AccessControlPage>
          <ServiceAccountsPage />
        </AccessControlPage>
      </RouteWithLayout>

      <RouteWithLayout
        sidebarProps={ChaosSideNavProps}
        path={routes.toServiceAccountDetails({ ...projectPathProps, ...chaosModuleParams, ...serviceAccountProps })}
        exact
        pageName={PAGE_NAME.ServiceAccountDetails}
      >
        <ServiceAccountDetails />
      </RouteWithLayout>

      <RouteWithLayout
        sidebarProps={ChaosSideNavProps}
        path={[routes.toResourceGroups({ ...projectPathProps, ...chaosModuleParams })]}
        exact
        pageName={PAGE_NAME.ResourceGroups}
      >
        <AccessControlPage>
          <ResourceGroups />
        </AccessControlPage>
      </RouteWithLayout>

      <RouteWithLayout
        sidebarProps={ChaosSideNavProps}
        path={[routes.toRoles({ ...projectPathProps, ...chaosModuleParams })]}
        exact
        pageName={PAGE_NAME.Roles}
      >
        <AccessControlPage>
          <Roles />
        </AccessControlPage>
      </RouteWithLayout>

      <RouteWithLayout
        sidebarProps={ChaosSideNavProps}
        path={[routes.toRoleDetails({ ...projectPathProps, ...chaosModuleParams, ...rolePathProps })]}
        exact
        pageName={PAGE_NAME.RoleDetails}
      >
        <RoleDetails />
      </RouteWithLayout>
      <RouteWithLayout
        sidebarProps={ChaosSideNavProps}
        path={[routes.toResourceGroupDetails({ ...projectPathProps, ...chaosModuleParams, ...resourceGroupPathProps })]}
        exact
        pageName={PAGE_NAME.ResourceGroupDetails}
      >
        <ResourceGroupDetails />
      </RouteWithLayout>

      {/* Loads the Chaos MicroFrontend */}
      <RouteWithLayout sidebarProps={ChaosSideNavProps} path={routes.toChaosMicroFrontend({ ...projectPathProps })}>
        <ChildAppMounter<ChaosCustomMicroFrontendProps>
          ChildApp={ChaosMicroFrontend}
          customComponents={{
            ConnectorReferenceField,
            OverviewChartsWithToggle,
            validateYAMLWithSchema
          }}
        />
      </RouteWithLayout>
    </>
  )
}
