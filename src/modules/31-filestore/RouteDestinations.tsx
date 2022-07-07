/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { String } from 'framework/strings'
import RbacFactory from '@rbac/factories/RbacFactory'
import { ResourceCategory, ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { RouteWithLayout } from '@common/router'
import { AccountSideNavProps } from '@common/RouteDestinations'
import routes from '@common/RouteDefinitions'
import { accountPathProps } from '@common/utils/routeUtils'
import FileStorePage from '@filestore/pages/filestore/FileStorePage'

RbacFactory.registerResourceTypeHandler(ResourceType.FILE, {
  icon: 'file',
  label: 'common.files',
  category: ResourceCategory.SHARED_RESOURCES,
  permissionLabels: {
    [PermissionIdentifier.VIEW_FILE]: <String stringID="rbac.permissionLabels.view" />,
    [PermissionIdentifier.EDIT_FILE]: <String stringID="rbac.permissionLabels.createEdit" />,
    [PermissionIdentifier.DELETE_FILE]: <String stringID="rbac.permissionLabels.delete" />,
    [PermissionIdentifier.ACCESS_FILE]: <String stringID="rbac.permissionLabels.access" />
  }
})

export default (
  <>
    <RouteWithLayout sidebarProps={AccountSideNavProps} path={routes.toFileStore({ ...accountPathProps })} exact>
      <FileStorePage />
    </RouteWithLayout>
  </>
)
