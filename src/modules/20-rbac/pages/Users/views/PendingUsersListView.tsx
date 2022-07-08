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
  ButtonVariation,
  useConfirmationDialog,
  useToaster,
  Page,
  TableV2
} from '@wings-software/uicore'
import type { CellProps, Renderer, Column } from 'react-table'
import { Classes, Position, Menu, Tag, Intent } from '@blueprintjs/core'
import { useParams } from 'react-router-dom'
import { noop } from 'lodash-es'
import { Invite, useDeleteInvite, useGetPendingUsersAggregated, useUpdateInvite } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import RoleBindingsList from '@rbac/components/RoleBindingsList/RoleBindingsList'
import { useRoleAssignmentModal } from '@rbac/modals/RoleAssignmentModal/useRoleAssignmentModal'
import type { AccountPathProps, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useMutateAsGet } from '@common/hooks'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import { setPageNumber, useGetCommunity } from '@common/utils/utils'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import css from './UserListView.module.scss'

interface PendingUserListViewProps {
  searchTerm?: string
  shouldReload?: boolean
}

const RenderColumnUser: Renderer<CellProps<Invite>> = ({ row }) => {
  const data = row.original
  return (
    <Layout.Horizontal
      spacing="small"
      className={css.overflow}
      flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
      padding={{ right: 'small' }}
    >
      <Avatar name={data.name || data.email} email={data.email} hoverCard={false} />
      <Text lineClamp={1}>{data.name || data.email.split('@')[0]}</Text>
    </Layout.Horizontal>
  )
}
const RenderColumnRoleAssignments: Renderer<CellProps<Invite>> = ({ row }) => {
  const data = row.original.roleBindings

  return (
    <Layout.Horizontal
      spacing="small"
      flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
      padding={{ right: 'small' }}
    >
      <RoleBindingsList data={data} length={2} />
    </Layout.Horizontal>
  )
}

const RenderColumnStatus: Renderer<CellProps<Invite>> = () => {
  const { getString } = useStrings()

  return (
    <Tag round className={css.invitation}>
      {getString('rbac.usersPage.pendingInvitation')}
    </Tag>
  )
}
const RenderColumnEmail: Renderer<CellProps<Invite>> = ({ row }) => {
  const data = row.original

  return (
    <Layout.Horizontal
      className={css.overflow}
      flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
      padding={{ right: 'small' }}
    >
      <Text>{data.email}</Text>
    </Layout.Horizontal>
  )
}

const RenderColumnMenu: Renderer<CellProps<Invite>> = ({ row, column }) => {
  const data = row.original
  const { accountId } = useParams<AccountPathProps>()
  const { getRBACErrorMessage } = useRBACError()
  const [menuOpen, setMenuOpen] = useState(false)
  const { mutate: updateInvite } = useUpdateInvite({ inviteId: data.id, queryParams: { accountIdentifier: accountId } })
  const { showSuccess, showError } = useToaster()
  const { getString } = useStrings()
  const { mutate: deleteUser } = useDeleteInvite({})

  const { openDialog } = useConfirmationDialog({
    contentText: getString('rbac.usersPage.deleteConfirmation', { name: data?.name || data?.email }),
    titleText: getString('rbac.usersPage.deleteTitle'),
    confirmButtonText: getString('delete'),
    cancelButtonText: getString('cancel'),
    intent: Intent.DANGER,
    buttonIntent: Intent.DANGER,
    onCloseDialog: async didConfirm => {
      if (didConfirm && data) {
        try {
          const deleted = await deleteUser(data.id, { headers: { 'content-type': 'application/json' } })
          deleted && showSuccess(getString('rbac.usersPage.deleteSuccessMessage', { name: data?.name || data?.email }))
          ;(column as any).refetchPendingUsers?.()
        } catch (err) {
          showError(getRBACErrorMessage(err))
        }
      }
    }
  })

  const handleResend = async (e: React.MouseEvent<HTMLElement, MouseEvent>): Promise<void> => {
    e.stopPropagation()
    setMenuOpen(false)
    try {
      const updated = await updateInvite(data, { pathParams: { inviteId: data.id } })
      if (updated) {
        ;(column as any).refetchPendingUsers?.()
        showSuccess(getString('rbac.usersPage.resendInviteSuccess', { name: data.email }))
      }
    } catch (err) {
      showError(getRBACErrorMessage(err))
    }
  }

  const handleDelete = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    e.stopPropagation()
    setMenuOpen(false)
    openDialog()
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
          data-testid={`menu-${data.id}`}
          onClick={e => {
            e.stopPropagation()
            setMenuOpen(true)
          }}
        />
        <Menu>
          <RbacMenuItem
            icon="reset"
            text={getString('rbac.usersPage.resendInvite')}
            onClick={handleResend}
            permission={{
              resource: {
                resourceType: ResourceType.USER,
                resourceIdentifier: data.id
              },
              permission: PermissionIdentifier.INVITE_USER
            }}
          />
          <RbacMenuItem
            icon="trash"
            text={getString('delete')}
            onClick={handleDelete}
            permission={{
              resource: {
                resourceType: ResourceType.USER,
                resourceIdentifier: data.id
              },
              permission: PermissionIdentifier.INVITE_USER
            }}
          />
        </Menu>
      </Popover>
    </Layout.Horizontal>
  )
}

const PendingUserListView: React.FC<PendingUserListViewProps> = ({ searchTerm, shouldReload }) => {
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const [page, setPage] = useState(0)
  const isCommunity = useGetCommunity()

  const { data, loading, error, refetch } = useMutateAsGet(useGetPendingUsersAggregated, {
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

  useEffect(() => {
    if (searchTerm) setPage(0)
  }, [searchTerm])

  const { openRoleAssignmentModal } = useRoleAssignmentModal({
    onSuccess: refetch
  })

  useEffect(() => {
    shouldReload && refetch()
  }, [shouldReload])

  const { getRBACErrorMessage } = useRBACError()

  const columns: Column<Invite>[] = useMemo(
    () => [
      {
        Header: getString('users'),
        id: 'user',
        accessor: row => row.name,
        width: '25%',
        Cell: RenderColumnUser
      },
      {
        Header: isCommunity ? '' : getString('rbac.usersPage.roleBinding'),
        id: 'roleBinding',
        accessor: row => row.roleBindings,
        width: '35%',
        Cell: isCommunity ? () => noop : RenderColumnRoleAssignments,
        openRoleAssignmentModal: openRoleAssignmentModal
      },
      {
        Header: getString('status'),
        id: 'status',
        accessor: row => row.id,
        width: '15%',
        Cell: RenderColumnStatus
      },
      {
        Header: getString('email'),
        id: 'email',
        accessor: row => row.email,
        width: '20%',
        Cell: RenderColumnEmail
      },
      {
        Header: '',
        id: 'menu',
        accessor: row => row.approved,
        width: '5%',
        Cell: RenderColumnMenu,
        refetchPendingUsers: refetch,
        disableSortBy: true
      }
    ],
    [openRoleAssignmentModal, refetch]
  )

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
      <TableV2<Invite>
        className={css.table}
        columns={columns}
        name="PendingUsersListView"
        data={data?.data?.content || []}
        pagination={{
          itemCount: data?.data?.totalItems || 0,
          pageSize: data?.data?.pageSize || 10,
          pageCount: data?.data?.totalPages || 0,
          pageIndex: data?.data?.pageIndex || 0,
          gotoPage: (pageNumber: number) => setPage(pageNumber)
        }}
      />
    </Page.Body>
  )
}

export default PendingUserListView
