/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { Route, useHistory, useParams } from 'react-router-dom'
import { Container } from '@wings-software/uicore'
import routes from '@common/RouteDefinitions'
import { accountPathProps } from '@common/utils/routeUtils'
import { RouteWithLayout } from '@common/router'
import type { SidebarContext } from '@common/navigation/SidebarProvider'
import AccountSideNav from '@common/components/AccountSideNav/AccountSideNav'
import type { GovernancePathProps, Module } from '@common/interfaces/RouteInterfaces'
import { String } from 'framework/strings'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import RbacFactory from '@rbac/factories/RbacFactory'
import { ResourceCategory, ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import AuditTrailFactory, { ResourceScope } from '@audit-trail/factories/AuditTrailFactory'
import type { AuditEventData, ResourceDTO } from 'services/audit'
import { PAGE_NAME } from '@common/pages/pageContext/PageName'
import { GovernanceRemoteComponentMounter } from './GovernanceApp'

export const AccountSideNavProps: SidebarContext = {
  navComponent: AccountSideNav,
  icon: 'nav-settings',
  title: 'Account Settings'
}

RbacFactory.registerResourceTypeHandler(ResourceType.GOVERNANCE_POLICY, {
  icon: 'nav-settings',
  label: 'governance.permissions.governancePolicies',
  category: ResourceCategory.SHARED_RESOURCES,
  permissionLabels: {
    [PermissionIdentifier.GOV_VIEW_POLICY]: <String stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.GOV_EDIT_POLICY]: <String stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.GOV_DELETE_POLICY]: <String stringID="rbac.permissionLabels.delete" />
  }
})

RbacFactory.registerResourceTypeHandler(ResourceType.GOVERNANCE_POLICYSETS, {
  icon: 'nav-settings',
  label: 'governance.permissions.governancePolicySets',
  category: ResourceCategory.SHARED_RESOURCES,
  permissionLabels: {
    [PermissionIdentifier.GOV_VIEW_POLICYSET]: <String stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.GOV_EDIT_POLICYSET]: <String stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.GOV_DELETE_POLICYSET]: <String stringID="rbac.permissionLabels.delete" />,
    [PermissionIdentifier.GOV_EVALUATE_POLICYSET]: <String stringID="rbac.permissionLabels.evaluate" />
  }
})

AuditTrailFactory.registerResourceHandler('GOVERNANCE_POLICY', {
  moduleIcon: {
    name: 'governance'
  },
  moduleLabel: 'common.governance',
  resourceLabel: 'common.policy.label',
  resourceUrl: (
    resource: ResourceDTO,
    resourceScope: ResourceScope,
    _module?: Module,
    auditEventData?: AuditEventData
  ) => {
    const { orgIdentifier, accountIdentifier, projectIdentifier } = resourceScope
    return routes.toGovernanceEditPolicy({
      orgIdentifier,
      accountId: accountIdentifier,
      projectIdentifier,
      module: (auditEventData as any)?.eventModule,
      policyIdentifier: resource.identifier
    })
  }
})

AuditTrailFactory.registerResourceHandler('GOVERNANCE_POLICY_SET', {
  moduleIcon: {
    name: 'governance'
  },
  moduleLabel: 'common.governance',
  resourceLabel: 'common.policiesSets.policyset',
  resourceUrl: (
    resource: ResourceDTO,
    resourceScope: ResourceScope,
    _module?: Module,
    auditEventData?: AuditEventData
  ) => {
    const { orgIdentifier, accountIdentifier, projectIdentifier } = resourceScope
    return routes.toGovernancePolicySetDetail({
      orgIdentifier,
      accountId: accountIdentifier,
      projectIdentifier,
      module: (auditEventData as any)?.eventModule,
      policySetIdentifier: resource.identifier
    })
  }
})

const RedirectToDefaultGovernanceRoute: React.FC = () => {
  const { accountId, orgIdentifier, projectIdentifier, module } = useParams<GovernancePathProps>()
  const history = useHistory()

  useEffect(() => {
    history.replace(routes.toGovernancePolicyDashboard({ accountId, orgIdentifier, projectIdentifier, module }))
  }, [history, accountId, orgIdentifier, projectIdentifier, module])

  return null
}

//
// This function constructs Governance Routes based on context. Governance can be mounted in three
// places: Account Settings, Project Detail, and Org Detail. Depends on pathProps of where this module
// is mounted, this function will generate proper Governance routes.
//
export const GovernanceRouteDestinations: React.FC<{
  sidebarProps: SidebarContext
  pathProps: GovernancePathProps
}> = ({ sidebarProps, pathProps }) => {
  return (
    <Route path={routes.toGovernance(pathProps)}>
      <Route path={routes.toGovernance(pathProps)} exact>
        <RedirectToDefaultGovernanceRoute />
      </Route>
      <RouteWithLayout
        path={routes.toGovernance(pathProps)}
        sidebarProps={sidebarProps}
        pageName={PAGE_NAME.OPAPolicyDashboard}
      >
        <GovernanceRemoteComponentMounter
          spinner={
            <Container height="100%" flex={{ align: 'center-center' }}>
              <ContainerSpinner />
            </Container>
          }
        />
      </RouteWithLayout>
    </Route>
  )
}

export default <>{GovernanceRouteDestinations({ sidebarProps: AccountSideNavProps, pathProps: accountPathProps })}</>
