/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useMemo, useEffect } from 'react'
import {
  Text,
  Layout,
  Button,
  Popover,
  Avatar,
  Icon,
  ButtonVariation,
  useConfirmationDialog,
  useToaster,
  Page,
  TableV2
} from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import type { CellProps, Renderer, Column } from 'react-table'
import { Classes, Position, Menu, Intent, PopoverInteractionKind, MenuItem } from '@blueprintjs/core'
import { useHistory, useParams } from 'react-router-dom'
import { defaultTo, noop } from 'lodash-es'
import {
  UserAggregate,
  useRemoveUser,
  useGetAggregatedUsers,
  UserGroupDTO,
  UserMetadataDTO,
  RoleAssignmentMetadataDTO,
  useUnlockUser,
  checkIfLastAdminPromise
} from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import RoleBindingsList from '@rbac/components/RoleBindingsList/RoleBindingsList'
import { useRoleAssignmentModal } from '@rbac/modals/RoleAssignmentModal/useRoleAssignmentModal'
import { getUserName, PrincipalType } from '@rbac/utils/utils'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useMutateAsGet } from '@common/hooks'
import type { PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import routes from '@common/RouteDefinitions'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import ManagePrincipalButton from '@rbac/components/ManagePrincipalButton/ManagePrincipalButton'
import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import RbacButton from '@rbac/components/Button/Button'
import { setPageNumber, useGetCommunity } from '@common/utils/utils'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { Scope } from '@common/interfaces/SecretsInterface'
import css from './UserListView.module.scss'

interface ActiveUserListViewProps {
  searchTerm?: string
  shouldReload?: boolean
  onRefetch?: () => void
  openRoleAssignmentModal: (
    type?: PrincipalType,
    principalInfo?: UserGroupDTO | UserMetadataDTO,
    roleBindings?: RoleAssignmentMetadataDTO[]
  ) => void
}

const RenderColumnUser: Renderer<CellProps<UserAggregate>> = ({ row }) => {
  const data = row.original.user
  const { getString } = useStrings()

  return (
    <Layout.Horizontal
      spacing="small"
      className={css.overflow}
      flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
      padding={{ right: 'small' }}
    >
      {data.locked ? (
        <Icon
          name="lock"
          border
          className={css.lockIcon}
          width={32}
          height={32}
          color={Color.WHITE}
          background={Color.GREY_300}
          flex={{ align: 'center-center' }}
          margin={{ left: 'xsmall', right: 'xsmall' }}
        />
      ) : (
        <Avatar name={data.name || data.email} email={data.email} hoverCard={false} />
      )}
      <Layout.Vertical width={'100%'}>
        <Text lineClamp={1}>{data.name}</Text>
        {data.locked ? (
          <Text font={'small'} color={Color.GREY_400}>
            {getString('rbac.usersPage.lockedOutLabel')}
          </Text>
        ) : null}
      </Layout.Vertical>
    </Layout.Horizontal>
  )
}
const RenderColumnRoleAssignments: Renderer<CellProps<UserAggregate>> = ({ row, column }) => {
  const data = row.original.roleAssignmentMetadata
  const { getString } = useStrings()

  const handleAddRole = (e: React.MouseEvent<Element, MouseEvent>): void => {
    e.stopPropagation()
    ;(column as any).openRoleAssignmentModal(PrincipalType.USER, row.original.user, row.original.roleAssignmentMetadata)
  }

  return (
    <Layout.Horizontal
      spacing="small"
      flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
      padding={{ right: 'small' }}
    >
      <RoleBindingsList data={data} length={2} />
      <ManagePrincipalButton
        text={getString('common.plusNumber', { number: getString('common.role') })}
        variation={ButtonVariation.LINK}
        className={css.roleButton}
        data-testid={`addRole-${row.original.user.uuid}`}
        onClick={handleAddRole}
        resourceIdentifier={row.original.user.uuid}
        resourceType={ResourceType.USER}
      />
    </Layout.Horizontal>
  )
}

const RenderColumnEmail: Renderer<CellProps<UserAggregate>> = ({ row }) => {
  const data = row.original

  return (
    <Layout.Horizontal
      className={css.overflow}
      flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
      padding={{ right: 'small' }}
    >
      <Text>{data.user?.email}</Text>
    </Layout.Horizontal>
  )
}

const RenderColumnMenu: Renderer<CellProps<UserAggregate>> = ({ row, column }) => {
  const data = row.original.user
  const name = getUserName(data)
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const scope = getScopeFromDTO({ accountIdentifier: accountId, projectIdentifier, orgIdentifier })
  const [menuOpen, setMenuOpen] = useState(false)
  const [isLastAdmin, setIsLastAdmin] = useState(false)
  const { showSuccess, showError } = useToaster()
  const { getString } = useStrings()

  const { mutate: deleteUser } = useRemoveUser({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    }
  })
  const { mutate: unlockUser } = useUnlockUser({
    userId: data.uuid,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    }
  })

  const getContentText = (): string => {
    if (!isLastAdmin) {
      return getString('rbac.usersPage.deleteConfirmation', { name })
    }
    switch (scope) {
      case Scope.PROJECT:
        return getString('rbac.usersPage.deleteLastAdminProjectConfirmation', { name })
      case Scope.ORG:
        return getString('rbac.usersPage.deleteLastAdminOrgConfirmation', { name })
      default: {
        return getString('rbac.usersPage.deleteConfirmation', { name })
      }
    }
  }

  const { openDialog: openDeleteDialog } = useConfirmationDialog({
    contentText: getContentText(),
    titleText: getString('rbac.usersPage.deleteTitle'),
    confirmButtonText: getString('delete'),
    cancelButtonText: getString('cancel'),
    intent: Intent.DANGER,
    buttonIntent: Intent.DANGER,
    onCloseDialog: async didConfirm => {
      if (didConfirm && data) {
        try {
          const deleted = await deleteUser(data.uuid)
          deleted && showSuccess(getString('rbac.usersPage.deleteSuccessMessage', { name }))
          ;(column as any).refetchActiveUsers?.()
        } catch (err) {
          showError(defaultTo(err?.data?.message, err?.message))
        }
      }
    }
  })

  const { openDialog: openUnlockDialog } = useConfirmationDialog({
    contentText: getString('rbac.usersPage.unlockConfirmation', { name }),
    titleText: getString('rbac.usersPage.unlockTitle'),
    confirmButtonText: getString('confirm'),
    cancelButtonText: getString('cancel'),
    intent: Intent.WARNING,
    onCloseDialog: async didConfirm => {
      if (didConfirm && data) {
        try {
          const unlocked = await unlockUser()
          unlocked && showSuccess(getString('rbac.usersPage.unlockSuccessMessage', { name }))
          ;(column as any).refetchActiveUsers?.()
        } catch (err) {
          showError(defaultTo(err?.data?.message, err?.message))
        }
      }
    }
  })

  const handleDelete = async (): Promise<void> => {
    try {
      const response = await checkIfLastAdminPromise({
        queryParams: {
          accountIdentifier: accountId,
          orgIdentifier,
          projectIdentifier,
          userId: data.uuid
        }
      })
      setIsLastAdmin(_oldval => defaultTo(response.data, false))
      if (response.data && scope === Scope.ACCOUNT) {
        showError(getString('rbac.usersPage.deleteLastAdminError', { name }))
        return
      } else {
        openDeleteDialog()
      }
    } catch (err) {
      showError(defaultTo(err?.data?.message, err?.message))
    }
  }

  const permissionRequest = {
    resourceScope: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    resource: {
      resourceType: ResourceType.USER,
      resourceIdentifier: data.uuid
    },
    permission: PermissionIdentifier.MANAGE_USER
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
          withoutBoxShadow
          data-testid={`menu-${data.uuid}`}
          onClick={e => {
            e.stopPropagation()
            setMenuOpen(true)
          }}
        />
        <Menu>
          {data.locked ? (
            <RbacMenuItem
              icon="unlock"
              text={getString('rbac.usersPage.unlockTitle')}
              onClick={e => {
                e.stopPropagation()
                setMenuOpen(false)
                openUnlockDialog()
              }}
              permission={permissionRequest}
            />
          ) : null}
          {data.externallyManaged ? (
            <Popover
              position={Position.TOP}
              fill
              usePortal
              inheritDarkTheme={false}
              interactionKind={PopoverInteractionKind.HOVER}
              hoverCloseDelay={50}
              content={
                <div className={css.popover}>
                  <Text font={{ variation: FontVariation.SMALL }}>
                    {getString('rbac.manageSCIMText', {
                      action: getString('delete').toLowerCase(),
                      target: getString('common.userLabel').toLowerCase()
                    })}
                  </Text>
                </div>
              }
            >
              <div
                onClick={(event: React.MouseEvent<HTMLElement, MouseEvent>) => {
                  event.stopPropagation()
                }}
              >
                <MenuItem icon="trash" text={getString('delete')} disabled />
              </div>
            </Popover>
          ) : (
            <RbacMenuItem
              icon="trash"
              text={getString('delete')}
              onClick={e => {
                e.stopPropagation()
                setMenuOpen(false)
                handleDelete()
              }}
              permission={permissionRequest}
            />
          )}
        </Menu>
      </Popover>
    </Layout.Horizontal>
  )
}

const ActiveUserListView: React.FC<ActiveUserListViewProps> = ({
  searchTerm,
  openRoleAssignmentModal,
  shouldReload,
  onRefetch
}) => {
  const { getString } = useStrings()
  const history = useHistory()
  const { accountId, orgIdentifier, projectIdentifier, module } = useParams<PipelineType<ProjectPathProps>>()
  const [page, setPage] = useState(0)
  const isCommunity = useGetCommunity()

  const { data, loading, error, refetch } = useMutateAsGet(useGetAggregatedUsers, {
    body: {},
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      pageIndex: page,
      pageSize: 10,
      searchTerm: searchTerm
    },
    debounce: 300
  })

  useEffect(() => {
    setPageNumber({ setPage, page, pageItemsCount: data?.data?.pageItemCount })
  }, [data?.data])

  const { openRoleAssignmentModal: addRole } = useRoleAssignmentModal({
    onSuccess: refetch
  })

  useEffect(() => {
    if (searchTerm) setPage(0)
  }, [searchTerm])

  useEffect(() => {
    if (shouldReload) {
      refetch()
      onRefetch?.()
    }
  }, [shouldReload])

  const columns: Column<UserAggregate>[] = useMemo(
    () => [
      {
        Header: getString('users'),
        id: 'user',
        accessor: row => row.user?.name,
        width: '30%',
        Cell: RenderColumnUser
      },
      {
        Header: isCommunity ? '' : getString('rbac.usersPage.roleBinding'),
        id: 'roleBinding',
        accessor: row => row.roleAssignmentMetadata,
        width: '45%',
        Cell: isCommunity ? () => noop : RenderColumnRoleAssignments,
        openRoleAssignmentModal: addRole
      },
      {
        Header: getString('email'),
        id: 'email',
        accessor: row => row.user?.email,
        width: '20%',
        Cell: RenderColumnEmail
      },
      {
        Header: '',
        id: 'menu',
        accessor: row => row.user?.uuid,
        width: '5%',
        Cell: RenderColumnMenu,
        refetchActiveUsers: refetch,
        disableSortBy: true
      }
    ],
    [openRoleAssignmentModal, refetch]
  )

  const { getRBACErrorMessage } = useRBACError()

  return (
    <Page.Body
      loading={loading}
      error={error ? getRBACErrorMessage(error) : ''}
      retryOnError={() => refetch()}
      noData={
        !searchTerm
          ? {
              when: () => !data?.data?.content?.length,
              icon: 'nav-project',
              message: getString('rbac.usersPage.noDataDescription'),
              button: (
                <RbacButton
                  text={getString('newUser')}
                  variation={ButtonVariation.PRIMARY}
                  icon="plus"
                  onClick={() => openRoleAssignmentModal()}
                  permission={{
                    resource: {
                      resourceType: ResourceType.USER
                    },
                    permission: PermissionIdentifier.INVITE_USER
                  }}
                />
              )
            }
          : {
              when: () => !data?.data?.content?.length,
              icon: 'nav-project',
              message: getString('rbac.usersPage.noUsersFound')
            }
      }
    >
      <TableV2<UserAggregate>
        className={css.table}
        columns={columns}
        data={data?.data?.content || []}
        name="ActiveUsersListView"
        pagination={{
          itemCount: data?.data?.totalItems || 0,
          pageSize: data?.data?.pageSize || 10,
          pageCount: data?.data?.totalPages || 0,
          pageIndex: data?.data?.pageIndex || 0,
          gotoPage: (pageNumber: number) => setPage(pageNumber)
        }}
        onRowClick={user => {
          history.push(
            routes.toUserDetails({
              accountId,
              orgIdentifier,
              projectIdentifier,
              module,
              userIdentifier: user.user.uuid
            })
          )
        }}
      />
    </Page.Body>
  )
}

export default ActiveUserListView
