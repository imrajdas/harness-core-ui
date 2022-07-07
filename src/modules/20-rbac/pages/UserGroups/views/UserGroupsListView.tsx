/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useMemo } from 'react'
import {
  Text,
  Layout,
  Button,
  Popover,
  ButtonVariation,
  Icon,
  TableV2,
  useConfirmationDialog,
  useToaster,
  Dialog
} from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { useModalHook } from '@harness/use-modal'
import type { CellProps, Renderer, Column } from 'react-table'
import { Classes, Position, Menu, Intent, PopoverInteractionKind, IconName, MenuItem } from '@blueprintjs/core'
import { useHistory, useParams } from 'react-router-dom'
import { noop } from 'lodash-es'
import {
  UserGroupAggregateDTO,
  useDeleteUserGroup,
  ResponsePageUserGroupAggregateDTO,
  UserGroupDTO,
  UserMetadataDTO,
  RoleAssignmentMetadataDTO
} from 'services/cd-ng'
import { getPrincipalScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { useStrings, String } from 'framework/strings'
import RoleBindingsList from '@rbac/components/RoleBindingsList/RoleBindingsList'
import {
  getUserGroupActionTooltipText,
  PrincipalType,
  isUserGroupInherited,
  mapfromScopetoPrincipalScope,
  getScopeFromUserGroupDTO,
  getUserGroupMenuOptionText
} from '@rbac/utils/utils'
import type { PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import ManagePrincipalButton from '@rbac/components/ManagePrincipalButton/ManagePrincipalButton'
import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import RbacAvatarGroup from '@rbac/components/RbacAvatarGroup/RbacAvatarGroup'
import { useGetCommunity } from '@common/utils/utils'
import CopyGroupForm from '../CopyGroupMenuItem/CopyGroupForm'
import css from './UserGroupsListView.module.scss'

interface UserGroupsListViewProps {
  data: ResponsePageUserGroupAggregateDTO | null
  gotoPage: (index: number) => void
  reload: () => Promise<void>
  openRoleAssignmentModal: (
    type?: PrincipalType,
    principalInfo?: UserGroupDTO | UserMetadataDTO,
    roleBindings?: RoleAssignmentMetadataDTO[]
  ) => void
  openUserGroupModal: (userGroup?: UserGroupDTO, _isAddMember?: boolean) => void
}

export const UserGroupColumn = (data: UserGroupDTO): React.ReactElement => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const userGroupInherited = isUserGroupInherited(accountId, orgIdentifier, projectIdentifier, data)
  const parentScope = mapfromScopetoPrincipalScope(getScopeFromUserGroupDTO(data))
  const { getString } = useStrings()
  return (
    <Layout.Vertical>
      <Layout.Vertical spacing="xsmall" padding={{ left: 'small' }}>
        <Layout.Horizontal spacing="medium">
          <Text color={Color.BLACK} lineClamp={1}>
            {data.name}
          </Text>
          {data.ssoLinked ? (
            <Popover interactionKind={PopoverInteractionKind.HOVER}>
              <Icon name="link" color={Color.BLUE_500} size={10} />
              <Layout.Vertical spacing="xsmall" padding="medium">
                <Layout.Horizontal spacing="xsmall">
                  <Text color={Color.BLACK}>
                    <String stringID="rbac.userDetails.linkToSSOProviderModal.saml" />
                  </Text>
                  <Text lineClamp={1}>{data.linkedSsoDisplayName}</Text>
                </Layout.Horizontal>
                <Layout.Horizontal spacing="xsmall">
                  <Text color={Color.BLACK}>
                    <String stringID="rbac.userDetails.linkToSSOProviderModal.group" />
                  </Text>
                  <Text lineClamp={1}>{data.ssoGroupName}</Text>
                </Layout.Horizontal>
              </Layout.Vertical>
            </Popover>
          ) : null}
        </Layout.Horizontal>
        <Text color={Color.GREY_600} lineClamp={1} font={{ variation: FontVariation.SMALL }}>
          {getString('idLabel', { id: data.identifier })}
        </Text>
        {userGroupInherited ? (
          <Text color={Color.PURPLE_500} lineClamp={1} font={{ variation: FontVariation.SMALL }}>
            {getString('rbac.unableToEditInheritedMembership', {
              parentScope: parentScope ? parentScope.charAt(0).toUpperCase() + parentScope.slice(1) : undefined
            })}
          </Text>
        ) : null}
      </Layout.Vertical>
    </Layout.Vertical>
  )
}

const RenderColumnUserGroup: Renderer<CellProps<UserGroupAggregateDTO>> = ({ row }) => {
  const data = row.original.userGroupDTO
  return UserGroupColumn(data)
}

const RenderColumnMembers: Renderer<CellProps<UserGroupAggregateDTO>> = ({ row, column }) => {
  const data = row.original
  const { orgIdentifier, projectIdentifier, identifier } = data.userGroupDTO
  const {
    accountId: accountIdentifier,
    orgIdentifier: childOrgIdentifier,
    projectIdentifier: childProjectIdentifier
  } = useParams<ProjectPathProps>()
  const { getString } = useStrings()
  const avatars =
    data.users?.map(user => {
      return { email: user.email, name: user.name }
    }) || []

  const handleAddMember = (e: React.MouseEvent<HTMLElement | Element, MouseEvent>): void => {
    e.stopPropagation()
    ;(column as any).openUserGroupModal(data.userGroupDTO, true)
  }
  const userGroupInherited = isUserGroupInherited(
    accountIdentifier,
    childOrgIdentifier,
    childProjectIdentifier,
    data.userGroupDTO
  )
  const disabled = data.userGroupDTO.ssoLinked || data.userGroupDTO.externallyManaged || userGroupInherited
  const disableTooltipText = getUserGroupActionTooltipText(
    accountIdentifier,
    childOrgIdentifier,
    childProjectIdentifier,
    data.userGroupDTO,
    userGroupInherited
  )

  const avatarTooltip = disableTooltipText ? <Text padding="medium">{disableTooltipText}</Text> : undefined

  return avatars.length ? (
    <RbacAvatarGroup
      avatars={avatars}
      restrictLengthTo={6}
      onAdd={handleAddMember}
      permission={{
        resourceScope: {
          accountIdentifier,
          orgIdentifier,
          projectIdentifier
        },
        resource: {
          resourceType: ResourceType.USERGROUP,
          resourceIdentifier: identifier
        },
        permission: PermissionIdentifier.MANAGE_USERGROUP
      }}
      disabled={disabled}
      onAddTooltip={avatarTooltip}
    />
  ) : (
    <Layout.Horizontal>
      <ManagePrincipalButton
        text={getString('plusNumber', { number: getString('members') })}
        variation={ButtonVariation.LINK}
        onClick={handleAddMember}
        className={css.roleButton}
        resourceType={ResourceType.USERGROUP}
        resourceIdentifier={identifier}
        disabled={disabled}
        tooltip={avatarTooltip}
      />
    </Layout.Horizontal>
  )
}

const RenderColumnRoleAssignments: Renderer<CellProps<UserGroupAggregateDTO>> = ({ row, column }) => {
  const data = row.original.roleAssignmentsMetadataDTO
  const { getString } = useStrings()
  const { accountId: accountIdentifier, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()

  return (
    <Layout.Horizontal spacing="small" flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
      <RoleBindingsList data={data} length={2} />
      <ManagePrincipalButton
        text={getString('common.plusNumber', { number: getString('common.role') })}
        variation={ButtonVariation.LINK}
        data-testid={`addRole-${row.original.userGroupDTO.identifier}`}
        className={css.roleButton}
        onClick={event => {
          event.stopPropagation()
          ;(column as any).openRoleAssignmentModal(
            PrincipalType.USER_GROUP,
            row.original.userGroupDTO,
            row.original.roleAssignmentsMetadataDTO
          )
        }}
        resourceType={ResourceType.USERGROUP}
        resourceIdentifier={row.original.userGroupDTO.identifier}
        resourceScope={{
          accountIdentifier,
          orgIdentifier,
          projectIdentifier
        }}
      />
    </Layout.Horizontal>
  )
}

const RenderColumnMenu: Renderer<CellProps<UserGroupAggregateDTO>> = ({ row, column }) => {
  const data = row.original.userGroupDTO
  const { orgIdentifier, projectIdentifier, identifier } = data
  const {
    accountId: accountIdentifier,
    orgIdentifier: childOrgIdentifier,
    projectIdentifier: childProjectIdentifier
  } = useParams<ProjectPathProps>()
  const [menuOpen, setMenuOpen] = useState(false)
  const { getString } = useStrings()
  const { showSuccess, showError } = useToaster()
  const { mutate: deleteUserGroup } = useDeleteUserGroup({
    queryParams: { accountIdentifier, orgIdentifier, projectIdentifier }
  })
  const permissionRequest = {
    resourceScope: {
      accountIdentifier,
      orgIdentifier,
      projectIdentifier
    },
    resource: {
      resourceType: ResourceType.USERGROUP,
      resourceIdentifier: identifier
    },
    permission: PermissionIdentifier.MANAGE_USERGROUP
  }

  const { openDialog: openDeleteDialog } = useConfirmationDialog({
    contentText: getString('rbac.userGroupPage.confirmDelete', { name: data.name }),
    titleText: getString('rbac.userGroupPage.confirmDeleteTitle'),
    confirmButtonText: getString('delete'),
    cancelButtonText: getString('cancel'),
    intent: Intent.DANGER,
    buttonIntent: Intent.DANGER,
    onCloseDialog: async (isConfirmed: boolean) => {
      /* istanbul ignore else */ if (isConfirmed) {
        try {
          const deleted = await deleteUserGroup(identifier, {
            headers: { 'content-type': 'application/json' }
          })
          /* istanbul ignore else */ if (deleted) {
            showSuccess(getString('rbac.userGroupPage.successMessage', { name: data.name }))
            ;(column as any).reload()
          } else {
            showError(getString('deleteError'))
          }
        } catch (err) {
          /* istanbul ignore next */
          showError(err?.data?.message || err?.message)
        }
      }
    }
  })

  const [openCopyGroupModal, closeCopyGroupModal] = useModalHook(() => {
    return (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        title={getString('rbac.copyGroup.title', { name: data.name })}
        onClose={closeCopyGroupModal}
      >
        <CopyGroupForm closeModal={closeCopyGroupModal} identifier={identifier} />
      </Dialog>
    )
  }, [data])

  const handleDelete = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    e.stopPropagation()
    setMenuOpen(false)
    openDeleteDialog()
  }

  const handleEdit = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    e.stopPropagation()
    setMenuOpen(false)
    ;(column as any).openUserGroupModal(data)
  }

  const handleCopyUserGroup = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.stopPropagation()
    setMenuOpen(false)
    openCopyGroupModal()
  }

  const userGroupInherited = isUserGroupInherited(accountIdentifier, childOrgIdentifier, childProjectIdentifier, data)
  const renderMenuItem = (
    icon: IconName,
    text: string,
    clickHandler: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void,
    tooltipText: React.ReactElement | undefined
  ): React.ReactElement => {
    if (data.externallyManaged || userGroupInherited) {
      return (
        <Popover
          position={Position.TOP}
          fill
          usePortal
          inheritDarkTheme={false}
          interactionKind={PopoverInteractionKind.HOVER}
          hoverCloseDelay={50}
          content={
            <div className={css.popover}>
              <Text font={{ variation: FontVariation.SMALL }}>{tooltipText}</Text>
            </div>
          }
        >
          <div
            onClick={(event: React.MouseEvent<HTMLElement, MouseEvent>) => {
              event.stopPropagation()
            }}
          >
            <MenuItem icon={icon} text={text} onClick={clickHandler} disabled />
          </div>
        </Popover>
      )
    }
    return <RbacMenuItem icon={icon} text={text} onClick={clickHandler} permission={permissionRequest} />
  }

  return (
    <Layout.Horizontal flex={{ justifyContent: 'flex-end' }}>
      <Popover
        isOpen={menuOpen}
        onInteraction={nextOpenState => {
          setMenuOpen(nextOpenState)
        }}
        className={Classes.DARK}
        position={Position.BOTTOM_RIGHT}
      >
        <Button
          minimal
          icon="Options"
          data-testid={`menu-${data.identifier}`}
          onClick={e => {
            e.stopPropagation()
            setMenuOpen(true)
          }}
        />
        <Menu>
          {renderMenuItem(
            'edit',
            getString('edit'),
            handleEdit,
            getUserGroupMenuOptionText(getString('edit'), getString('rbac.group'), data, userGroupInherited)
          )}
          {renderMenuItem(
            'trash',
            getString('delete'),
            handleDelete,
            getUserGroupMenuOptionText(getString('delete'), getString('rbac.group'), data, userGroupInherited)
          )}
          {/* IMP TO VERIFY */}
          {data.externallyManaged && !userGroupInherited ? (
            <MenuItem icon="duplicate" text={getString('common.copy')} onClick={handleCopyUserGroup} />
          ) : undefined}
        </Menu>
      </Popover>
    </Layout.Horizontal>
  )
}

const UserGroupsListView: React.FC<UserGroupsListViewProps> = props => {
  const { data, gotoPage, reload, openRoleAssignmentModal, openUserGroupModal } = props
  const { accountId, orgIdentifier, projectIdentifier, module } = useParams<PipelineType<ProjectPathProps>>()
  const { getString } = useStrings()
  const isCommunity = useGetCommunity()
  const history = useHistory()
  const columns: Column<UserGroupAggregateDTO>[] = useMemo(
    () => [
      {
        Header: getString('common.userGroup'),
        id: 'userGroup',
        accessor: row => row.userGroupDTO.name,
        width: '30%',
        Cell: RenderColumnUserGroup
      },
      {
        Header: getString('members'),
        id: 'members',
        accessor: row => row.users,
        width: '30%',
        openUserGroupModal: openUserGroupModal,
        Cell: RenderColumnMembers
      },
      {
        Header: isCommunity ? '' : getString('rbac.roleBinding'),
        id: 'roleBindings',
        accessor: row => row.roleAssignmentsMetadataDTO,
        width: '35%',
        Cell: isCommunity ? () => noop : RenderColumnRoleAssignments,
        openRoleAssignmentModal: openRoleAssignmentModal
      },
      {
        Header: '',
        id: 'menu',
        accessor: row => row.userGroupDTO.identifier,
        width: '5%',
        Cell: RenderColumnMenu,
        reload: reload,
        openUserGroupModal: openUserGroupModal,
        disableSortBy: true
      }
    ],
    [openRoleAssignmentModal, openUserGroupModal, reload]
  )
  return (
    <TableV2<UserGroupAggregateDTO>
      className={css.table}
      columns={columns}
      name="UserGroupsListView"
      data={data?.data?.content || []}
      onRowClick={userGroup => {
        history.push({
          pathname: routes.toUserGroupDetails({
            accountId,
            orgIdentifier,
            projectIdentifier,
            module,
            userGroupIdentifier: userGroup.userGroupDTO.identifier
          }),
          search: `?parentScope=${getPrincipalScopeFromDTO(userGroup.userGroupDTO)}`
        })
      }}
      pagination={{
        itemCount: data?.data?.totalItems || 0,
        pageSize: data?.data?.pageSize || 10,
        pageCount: data?.data?.totalPages || 0,
        pageIndex: data?.data?.pageIndex || 0,
        gotoPage: gotoPage
      }}
    />
  )
}

export default UserGroupsListView
