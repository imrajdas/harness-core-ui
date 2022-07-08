/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Menu } from '@blueprintjs/core'
import { Layout, Text, Icon } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { Project } from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import { useStrings } from 'framework/strings'
import { ModuleName } from 'framework/types/ModuleName'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import type { PermissionRequest } from '@rbac/hooks/usePermission'

interface ContextMenuProps {
  project: Project
  reloadProjects?: () => Promise<unknown>
  editProject?: (project: Project) => void
  collaborators?: (project: Project) => void
  setMenuOpen?: (value: React.SetStateAction<boolean>) => void
  openDialog?: () => void
}

const ContextMenu: React.FC<ContextMenuProps> = props => {
  const history = useHistory()
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const { project, editProject, collaborators, setMenuOpen, openDialog } = props
  const { CDNG_ENABLED, CVNG_ENABLED, CING_ENABLED, CENG_ENABLED, CFNG_ENABLED, SECURITY } = useFeatureFlags()

  const permissionRequest: Optional<PermissionRequest, 'permission'> = {
    resourceScope: {
      accountIdentifier: accountId,
      orgIdentifier: project.orgIdentifier
    },
    resource: {
      resourceType: ResourceType.PROJECT,
      resourceIdentifier: project.identifier
    }
  }

  const handleDelete = (event: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    event.stopPropagation()
    setMenuOpen?.(false)
    openDialog?.()
  }

  const handleEdit = (event: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    event.stopPropagation()
    setMenuOpen?.(false)
    editProject?.(project)
  }

  const handleCollaborate = (event: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    event.stopPropagation()
    setMenuOpen?.(false)
    collaborators?.(project)
  }

  const handleCD = (event: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    event.stopPropagation()
    setMenuOpen?.(false)
    history.push(
      routes.toProjectOverview({
        orgIdentifier: project.orgIdentifier || /* istanbul ignore next */ '',
        projectIdentifier: project.identifier,
        accountId,
        module: 'cd'
      })
    )
  }

  const handleCV = (event: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    event.stopPropagation()
    setMenuOpen?.(false)
    history.push(
      routes.toCVSLOs({
        projectIdentifier: project.identifier,
        orgIdentifier: project.orgIdentifier || /* istanbul ignore next */ '',
        accountId
      })
    )
  }

  const handleCF = (event: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    event.stopPropagation()
    setMenuOpen?.(false)
    history.push(
      routes.toCFFeatureFlags({
        projectIdentifier: project.identifier,
        orgIdentifier: project.orgIdentifier || /* istanbul ignore next */ '',
        accountId
      })
    )
  }
  const handleCI = (event: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    event.stopPropagation()
    setMenuOpen?.(false)
    history.push(
      routes.toProjectOverview({
        projectIdentifier: project.identifier,
        orgIdentifier: project.orgIdentifier || /* istanbul ignore next */ '',
        accountId,
        module: 'ci'
      })
    )
  }
  const handleCE = (event: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    event.stopPropagation()
    setMenuOpen?.(false)
    history.push(
      routes.toCECORules({
        accountId,
        params: ''
      })
    )
  }
  const handleSTO = (event: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    event.stopPropagation()
    setMenuOpen?.(false)
    history.push(
      routes.toSTOProjectOverview({
        projectIdentifier: project.identifier,
        orgIdentifier: project.orgIdentifier || /* istanbul ignore next */ '',
        accountId
      })
    )
  }

  return (
    <Menu style={{ minWidth: 'unset' }}>
      {CDNG_ENABLED && project.modules?.includes(ModuleName.CD) ? (
        <Menu.Item
          text={
            <Layout.Horizontal spacing="xsmall">
              <Icon name="cd-main" size={20} />
              <Text color={Color.WHITE}>{getString('projectsOrgs.gotoCD')}</Text>
            </Layout.Horizontal>
          }
          onClick={handleCD}
        />
      ) : null}
      {CING_ENABLED && project.modules?.includes(ModuleName.CI) ? (
        <Menu.Item
          text={
            <Layout.Horizontal spacing="xsmall">
              <Icon name="ci-main" size={20} />
              <Text color={Color.WHITE}>{getString('projectsOrgs.gotoCI')}</Text>
            </Layout.Horizontal>
          }
          onClick={handleCI}
        />
      ) : null}
      {CFNG_ENABLED && project.modules?.includes(ModuleName.CF) ? (
        <Menu.Item
          text={
            <Layout.Horizontal spacing="xsmall">
              <Icon name="cf-main" size={20} />
              <Text color={Color.WHITE}>{getString('projectsOrgs.gotoCF')}</Text>
            </Layout.Horizontal>
          }
          onClick={handleCF}
        />
      ) : null}
      {CENG_ENABLED && project.modules?.includes(ModuleName.CE) ? (
        <Menu.Item
          text={
            <Layout.Horizontal spacing="xsmall">
              <Icon name="ce-main" size={20} />
              <Text color={Color.WHITE}>{getString('projectsOrgs.gotoCloudCosts')}</Text>
            </Layout.Horizontal>
          }
          onClick={handleCE}
        />
      ) : null}
      {CVNG_ENABLED && project.modules?.includes(ModuleName.CV) ? (
        <Menu.Item
          text={
            <Layout.Horizontal spacing="xsmall">
              <Icon name="cv-main" size={20} />
              <Text color={Color.WHITE}>{getString('projectsOrgs.gotoCV')}</Text>
            </Layout.Horizontal>
          }
          onClick={handleCV}
        />
      ) : null}
      {SECURITY && project.modules?.includes(ModuleName.STO) ? (
        <Menu.Item
          text={
            <Layout.Horizontal spacing="xsmall">
              <Icon name="sto-color-filled" size={20} />
              <Text color={Color.WHITE}>{getString('projectsOrgs.gotoSTO')}</Text>
            </Layout.Horizontal>
          }
          onClick={handleSTO}
        />
      ) : null}
      <RbacMenuItem
        icon="edit"
        text={getString('edit')}
        onClick={handleEdit}
        data-testid={'edit-project'}
        permission={{
          ...permissionRequest,
          permission: PermissionIdentifier.UPDATE_PROJECT
        }}
      />
      <RbacMenuItem
        icon="new-person"
        text={getString('projectsOrgs.invite')}
        onClick={handleCollaborate}
        permission={{
          resourceScope: {
            accountIdentifier: accountId,
            orgIdentifier: project.orgIdentifier,
            projectIdentifier: project.identifier
          },
          resource: {
            resourceType: ResourceType.USER
          },
          permission: PermissionIdentifier.INVITE_USER
        }}
      />
      <>
        <Menu.Divider />
        <RbacMenuItem
          icon="trash"
          text={getString('delete')}
          onClick={handleDelete}
          permission={{
            ...permissionRequest,
            permission: PermissionIdentifier.DELETE_PROJECT
          }}
        />
      </>
    </Menu>
  )
}

export default ContextMenu
