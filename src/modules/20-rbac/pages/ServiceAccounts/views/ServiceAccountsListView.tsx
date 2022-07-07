/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import {
  Avatar,
  Button,
  ButtonVariation,
  Layout,
  Popover,
  TableV2,
  Text,
  useConfirmationDialog
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { CellProps, Column, Renderer } from 'react-table'
import { Classes, Intent, Menu, Position } from '@blueprintjs/core'
import { noop } from 'lodash-es'
import {
  PageServiceAccountAggregateDTO,
  RoleAssignmentMetadataDTO,
  ServiceAccountAggregateDTO,
  ServiceAccountDTO,
  useDeleteServiceAccount
} from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { TagsPopover, useToaster } from '@common/components'
import RoleBindingsList from '@rbac/components/RoleBindingsList/RoleBindingsList'
import routes from '@common/RouteDefinitions'
import type { PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import RbacButton from '@rbac/components/Button/Button'
import { PrincipalType } from '@rbac/utils/utils'
import { useGetCommunity } from '@common/utils/utils'
import css from './ServiceAccountsListView.module.scss'

interface ServiceAccountsListViewProps {
  data?: PageServiceAccountAggregateDTO
  reload: () => void
  openRoleAssignmentModal: (
    type?: PrincipalType,
    principalInfo?: ServiceAccountDTO,
    roleBindings?: RoleAssignmentMetadataDTO[]
  ) => void
  openServiceAccountModal: (serviceAccount?: ServiceAccountDTO) => void
  gotoPage: (index: number) => void
}

const RenderColumnDetails: Renderer<CellProps<ServiceAccountAggregateDTO>> = ({ row }) => {
  const data = row.original.serviceAccount
  const { getString } = useStrings()
  return (
    <Layout.Horizontal spacing="small" padding={{ right: 'small' }}>
      <Avatar name={data.name} hoverCard={false} />
      <div>
        <Layout.Horizontal spacing="small">
          <Text color={Color.BLACK} lineClamp={1} className={css.wordBreak}>
            {data.name}
          </Text>
          {data.tags && Object.keys(data.tags).length ? <TagsPopover tags={data.tags} /> : null}
        </Layout.Horizontal>
        <Text color={Color.GREY_400} lineClamp={1} font={{ size: 'small' }} className={css.wordBreak}>
          {getString('idLabel', { id: data.identifier })}
        </Text>
      </div>
    </Layout.Horizontal>
  )
}

const RenderColumnRoleAssignments: Renderer<CellProps<ServiceAccountAggregateDTO>> = ({ row, column }) => {
  const data = row.original
  const { getString } = useStrings()

  return (
    <Layout.Horizontal spacing="small" flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
      <RoleBindingsList data={data.roleAssignmentsMetadataDTO} length={2} />
      <RbacButton
        text={getString('common.plusNumber', { number: getString('common.role') })}
        variation={ButtonVariation.LINK}
        className={css.roleButton}
        data-testid={`addRole-${data.serviceAccount.identifier}`}
        onClick={event => {
          event.stopPropagation()
          ;(column as any).openRoleAssignmentModal(
            PrincipalType.SERVICE,
            data.serviceAccount,
            data.roleAssignmentsMetadataDTO
          )
        }}
        permission={{
          permission: PermissionIdentifier.EDIT_SERVICEACCOUNT,
          resource: {
            resourceType: ResourceType.SERVICEACCOUNT,
            resourceIdentifier: data.serviceAccount.identifier
          }
        }}
      />
    </Layout.Horizontal>
  )
}

const RenderColumnApiKeyCount: Renderer<CellProps<ServiceAccountAggregateDTO>> = ({ row }) => {
  const data = row.original
  return (
    <Text padding={{ right: 'small' }} lineClamp={1}>
      {data.tokensCount}
    </Text>
  )
}

const RenderColumnEmail: Renderer<CellProps<ServiceAccountAggregateDTO>> = ({ row }) => {
  const data = row.original.serviceAccount
  return (
    <Text padding={{ right: 'small' }} lineClamp={1} className={css.wordBreak}>
      {data.email}
    </Text>
  )
}

const RenderColumnMenu: Renderer<CellProps<ServiceAccountAggregateDTO>> = ({ row, column }) => {
  const data = row.original.serviceAccount
  const { accountIdentifier, orgIdentifier, projectIdentifier, identifier } = data
  const [menuOpen, setMenuOpen] = useState(false)
  const { getString } = useStrings()
  const { showSuccess, showError } = useToaster()
  const { mutate: deleteServiceAccount } = useDeleteServiceAccount({
    queryParams: { accountIdentifier: accountIdentifier || '', orgIdentifier, projectIdentifier }
  })

  const { openDialog: openDeleteDialog } = useConfirmationDialog({
    contentText: getString('rbac.serviceAccounts.confirmDelete', { name: data.name }),
    titleText: getString('rbac.serviceAccounts.confirmDeleteTitle'),
    confirmButtonText: getString('delete'),
    cancelButtonText: getString('cancel'),
    intent: Intent.DANGER,
    buttonIntent: Intent.DANGER,
    onCloseDialog: async (isConfirmed: boolean) => {
      /* istanbul ignore else */ if (isConfirmed) {
        try {
          const deleted = await deleteServiceAccount(identifier || '', {
            headers: { 'content-type': 'application/json' }
          })
          /* istanbul ignore else */ if (deleted) {
            showSuccess(getString('rbac.serviceAccounts.successMessage', { name: data.name }))
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

  const handleDelete = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    e.stopPropagation()
    setMenuOpen(false)
    openDeleteDialog()
  }

  const handleEdit = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    e.stopPropagation()
    setMenuOpen(false)
    ;(column as any).openServiceAccountModal(data)
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
          <RbacMenuItem
            icon="edit"
            text={getString('edit')}
            onClick={handleEdit}
            permission={{
              permission: PermissionIdentifier.EDIT_SERVICEACCOUNT,
              resource: {
                resourceType: ResourceType.SERVICEACCOUNT,
                resourceIdentifier: data.identifier
              }
            }}
          />
          <RbacMenuItem
            icon="trash"
            text={getString('delete')}
            onClick={handleDelete}
            permission={{
              permission: PermissionIdentifier.DELETE_SERVICEACCOUNT,
              resource: {
                resourceType: ResourceType.SERVICEACCOUNT,
                resourceIdentifier: data.identifier
              }
            }}
          />
        </Menu>
      </Popover>
    </Layout.Horizontal>
  )
}

const ServiceAccountsListView: React.FC<ServiceAccountsListViewProps> = ({
  data,
  reload,
  openRoleAssignmentModal,
  openServiceAccountModal,
  gotoPage
}) => {
  const { accountId, orgIdentifier, projectIdentifier, module } = useParams<PipelineType<ProjectPathProps>>()
  const { getString } = useStrings()
  const isCommunity = useGetCommunity()
  const history = useHistory()
  const columns: Column<ServiceAccountAggregateDTO>[] = useMemo(
    () => [
      {
        Header: getString('serviceAccount'),
        accessor: row => row.serviceAccount.name,
        id: 'name',
        width: '30%',
        Cell: RenderColumnDetails
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
        Header: getString('common.apiKeys'),
        id: 'apiKeys',
        accessor: row => row.tokensCount,
        width: '10%',
        Cell: RenderColumnApiKeyCount
      },
      {
        Header: getString('email'),
        id: 'email',
        accessor: row => row.serviceAccount.email,
        width: '20%',
        Cell: RenderColumnEmail
      },
      {
        Header: '',
        id: 'menu',
        accessor: row => row.serviceAccount.identifier,
        width: '5%',
        Cell: RenderColumnMenu,
        reload: reload,
        openServiceAccountModal: openServiceAccountModal,
        disableSortBy: true
      }
    ],
    []
  )

  return (
    <TableV2
      data={data?.content || []}
      columns={columns}
      className={css.table}
      name="ServiceAccountsListView"
      onRowClick={serviceAcc => {
        history.push(
          routes.toServiceAccountDetails({
            accountId,
            orgIdentifier,
            projectIdentifier,
            module,
            serviceAccountIdentifier: serviceAcc.serviceAccount.identifier
          })
        )
      }}
      rowDataTestID={serviceAcc => `row-${serviceAcc.serviceAccount.identifier}`}
      pagination={{
        itemCount: data?.totalItems || 0,
        pageSize: data?.pageSize || 10,
        pageCount: data?.totalPages || 0,
        pageIndex: data?.pageIndex || 0,
        gotoPage: gotoPage
      }}
    />
  )
}

export default ServiceAccountsListView
