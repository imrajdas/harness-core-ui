/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import ReactTimeago from 'react-timeago'
import { set } from 'lodash-es'
import { useParams, useHistory } from 'react-router-dom'
import {
  Button,
  Container,
  Text,
  Layout,
  Popover,
  Card,
  useToaster,
  useConfirmationDialog,
  Icon
} from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { Menu, MenuItem, Classes, Position } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import { useDeleteDelegateGroupByIdentifier, DelegateGroupDetails } from 'services/portal'
import routes from '@common/RouteDefinitions'
import { TagsViewer } from '@common/components/TagsViewer/TagsViewer'
import { delegateTypeToIcon } from '@common/utils/delegateUtils'
import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { usePermission } from '@rbac/hooks/usePermission'

import css from './DelegatesPage.module.scss'

type delTroubleshoterProps = {
  delegate: DelegateGroupDetails
  setOpenTroubleshoter: (prop: { isConnected: boolean | undefined }) => void
}

const columnWidths = {
  icon: '80px',
  name: '25%',
  tags: '20%',
  instances: '20%',
  heartbeat: 'calc(15% - 40px)',
  status: 'calc(15% - 40px)',
  actions: '5%'
}

export const DelegateListingHeader = () => {
  const { getString } = useStrings()
  return (
    <Layout.Horizontal className={css.delegateListHeader}>
      <div key="icon" style={{ width: columnWidths.icon }}></div>
      <div key="del-name" style={{ width: columnWidths.name }}>
        {getString('delegate.DelegateName')}
      </div>
      <div key="tags" style={{ width: columnWidths.tags }}>
        {getString('tagsLabel')}
      </div>
      <div key="instances" style={{ width: columnWidths.instances }}>
        {getString('instanceFieldOptions.instances')}
      </div>
      <div key="heartbeat" style={{ width: columnWidths.heartbeat }}>
        {getString('delegate.LastHeartBeat')}
      </div>
      <div key="status" style={{ width: columnWidths.status }}>
        {getString('connectivityStatus')}
      </div>
      <div key="actions" style={{ width: columnWidths.actions }} />
    </Layout.Horizontal>
  )
}

const RenderColumnMenu = ({ delegate, setOpenTroubleshoter }: delTroubleshoterProps) => {
  const { delegateGroupIdentifier, groupName, activelyConnected } = delegate
  const { getString } = useStrings()
  const [menuOpen, setMenuOpen] = useState(false)
  const { showSuccess, showError } = useToaster()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<Record<string, string>>()

  const { mutate: forceDeleteDelegate } = useDeleteDelegateGroupByIdentifier({
    queryParams: { accountId: accountId, orgId: orgIdentifier, projectId: projectIdentifier }
  })

  const deleteDelegateDialogContent = (
    <>
      <Text font={{ variation: FontVariation.BODY }} margin={{ bottom: 'medium' }}>
        {getString('delegates.infoForDeleteDelegate')}
      </Text>
      <Text font={{ variation: FontVariation.BODY }}>
        {getString('delegates.questionForceDeleteDelegate', {
          name: groupName
        })}
      </Text>
    </>
  )

  const forceDeleteDialog = useConfirmationDialog({
    contentText: deleteDelegateDialogContent,
    titleText: getString('delegate.deleteDelegate'),
    confirmButtonText: getString('delete'),
    cancelButtonText: getString('cancel'),
    onCloseDialog: async (isConfirmed: boolean) => {
      if (isConfirmed) {
        try {
          if (delegateGroupIdentifier) {
            const deleted = await forceDeleteDelegate(delegateGroupIdentifier)

            if (deleted) {
              showSuccess(getString('delegates.delegateDeleted', { name: groupName }))
            }
          }
        } catch (error) {
          showError(error.data?.responseMessages?.[0].message || error.message)
        }
      }
    }
  })

  const handleForceDelete = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => {
    e.stopPropagation()
    setMenuOpen(false)
    forceDeleteDialog.openDialog()
  }

  return (
    <Layout.Horizontal className={css.itemActionContainer}>
      <Popover
        isOpen={menuOpen}
        onInteraction={nextOpenState => {
          setMenuOpen(nextOpenState)
        }}
        className={Classes.DARK}
        position={Position.RIGHT_TOP}
      >
        <Button
          minimal
          icon="Options"
          onClick={e => {
            e.stopPropagation()
            setMenuOpen(true)
          }}
        />
        <Menu style={{ minWidth: 'unset' }}>
          <RbacMenuItem
            permission={{
              resourceScope: {
                accountIdentifier: accountId,
                orgIdentifier,
                projectIdentifier
              },
              resource: {
                resourceType: ResourceType.DELEGATE,
                resourceIdentifier: delegateGroupIdentifier
              },
              permission: PermissionIdentifier.VIEW_DELEGATE
            }}
            icon="edit"
            text={getString('details')}
          />
          <RbacMenuItem
            permission={{
              resourceScope: {
                accountIdentifier: accountId,
                orgIdentifier,
                projectIdentifier
              },
              resource: {
                resourceType: ResourceType.DELEGATE,
                resourceIdentifier: delegateGroupIdentifier
              },
              permission: PermissionIdentifier.DELETE_DELEGATE
            }}
            icon="trash"
            text={getString('delete')}
            onClick={handleForceDelete}
          />
          {delegate.delegateType === 'KUBERNETES' && (
            <MenuItem
              text={getString('delegates.openTroubleshooter')}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                setOpenTroubleshoter({ isConnected: activelyConnected })
              }}
              icon="book"
            />
          )}
        </Menu>
      </Popover>
    </Layout.Horizontal>
  )
}

export const DelegateListingItem = ({ delegate, setOpenTroubleshoter }: delTroubleshoterProps) => {
  const { getString } = useStrings()
  const [isExtended, setIsExtended] = useState(false)
  const { accountId, orgIdentifier, projectIdentifier, module } = useParams<Record<string, string>>()
  const history = useHistory()

  const [canAccessDelegate] = usePermission(
    {
      resourceScope: {
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier
      },
      resource: {
        resourceType: ResourceType.DELEGATE
      },
      permissions: [PermissionIdentifier.VIEW_DELEGATE]
    },
    []
  )

  const onDelegateClick = (): void => {
    if (canAccessDelegate) {
      const params = {
        accountId,
        delegateIdentifier: delegate.delegateGroupIdentifier as string
      }
      if (orgIdentifier) {
        set(params, 'orgIdentifier', orgIdentifier)
      }
      if (projectIdentifier) {
        set(params, 'projectIdentifier', projectIdentifier)
      }
      if (module) {
        set(params, 'module', module)
      }
      history.push(routes.toDelegatesDetails(params))
    }
  }

  const isConnected = delegate.activelyConnected
  const text = isConnected ? getString('connected') : getString('delegate.notConnected')
  const color: Color = isConnected ? Color.GREEN_600 : Color.GREY_400
  const allSelectors = Object.keys(delegate.groupImplicitSelectors || {}).concat(delegate.groupCustomSelectors || [])

  return (
    <Card elevation={2} interactive={true} onClick={onDelegateClick} className={css.delegateItemContainer}>
      <Layout.Horizontal className={css.delegateItemSubcontainer}>
        <div style={{ width: columnWidths.icon }} className={css.delegateItemIcon}>
          <Icon
            name={isExtended ? 'chevron-down' : 'chevron-right'}
            className={css.expandIcon}
            size={20}
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              setIsExtended(!isExtended)
            }}
          />
          <Text icon={delegateTypeToIcon(delegate.delegateType as string)} iconProps={{ size: 24 }} />
        </div>
        <Layout.Horizontal width={columnWidths.name}>
          <Layout.Vertical>
            <Layout.Horizontal spacing="small" data-testid={delegate.groupName}>
              <Text color={Color.BLACK}>{delegate.groupName}</Text>
            </Layout.Horizontal>
          </Layout.Vertical>
        </Layout.Horizontal>

        <Container className={css.connectivity} width={columnWidths.tags}>
          {delegate.groupImplicitSelectors && (
            <>
              <TagsViewer key="tags" tags={allSelectors.slice(0, 3)} />
              <span key="hidenTags">{allSelectors.length > 3 ? '+' + (allSelectors.length - 3) : ''}</span>
            </>
          )}
        </Container>

        <Layout.Horizontal width={columnWidths.instances}>
          {delegate.delegateInstanceDetails?.length || 0}
        </Layout.Horizontal>

        <Layout.Horizontal width={columnWidths.heartbeat}>
          {delegate.lastHeartBeat ? <ReactTimeago date={delegate.lastHeartBeat} live /> : getString('na')}
        </Layout.Horizontal>

        <Layout.Vertical width={columnWidths.status}>
          <Text icon="full-circle" iconProps={{ size: 6, color, padding: 'small' }}>
            {text}
          </Text>
          {!isConnected && delegate.delegateType === 'KUBERNETES' && (
            <div
              className={css.troubleshootLink}
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                setOpenTroubleshoter({ isConnected })
              }}
            >
              {getString('delegates.troubleshootOption')}
            </div>
          )}
        </Layout.Vertical>

        <Layout.Vertical width={columnWidths.actions}>
          {RenderColumnMenu({ delegate, setOpenTroubleshoter })}
        </Layout.Vertical>
      </Layout.Horizontal>

      {isExtended && <Layout.Horizontal className={css.podDetailsSeparator}></Layout.Horizontal>}

      {isExtended && (
        <Layout.Vertical className={`${css.instancesContainer} ${css.podDetailsContainer}`}>
          {!delegate.delegateInstanceDetails?.length && (
            <Layout.Horizontal className={css.delegateItemSubcontainer}>
              <Layout.Horizontal style={{ width: columnWidths.icon }} />
              <Layout.Horizontal width={columnWidths.name}>
                <Text color={Color.BLACK}>{getString('delegates.noInstances')}</Text>
              </Layout.Horizontal>
              <Container width={columnWidths.tags} />
              <Layout.Horizontal width={columnWidths.instances} />
              <Layout.Horizontal width={columnWidths.heartbeat} />
              <Layout.Vertical width={columnWidths.status} />
              <Layout.Vertical width={columnWidths.actions} />
            </Layout.Horizontal>
          )}
          {delegate.delegateInstanceDetails?.map((instanceDetails, index) => {
            const podStatusColor = instanceDetails.activelyConnected ? Color.GREEN_600 : Color.GREY_400
            const statusText = instanceDetails.activelyConnected
              ? getString('connected')
              : getString('delegate.notConnected')
            return (
              <Layout.Horizontal key={instanceDetails.hostName} width="100%" spacing={'small'}>
                <Layout.Horizontal style={{ width: columnWidths.icon }} />
                <Layout.Horizontal width={columnWidths.name}>
                  {index === 0 && <Text color={Color.BLACK}>{getString('instanceFieldOptions.instances')}</Text>}
                </Layout.Horizontal>
                <Container className={css.connectivity} width={columnWidths.tags} />
                <Layout.Horizontal width={columnWidths.instances}>{instanceDetails.hostName}</Layout.Horizontal>
                <Layout.Horizontal width={columnWidths.heartbeat}>
                  {instanceDetails.lastHeartbeat ? (
                    <ReactTimeago date={instanceDetails.lastHeartbeat} live />
                  ) : (
                    getString('na')
                  )}
                </Layout.Horizontal>
                <Layout.Vertical width={columnWidths.status}>
                  <Text icon="full-circle" iconProps={{ size: 6, color: podStatusColor, padding: 'small' }}>
                    {statusText}
                  </Text>
                </Layout.Vertical>

                <Layout.Vertical width={columnWidths.actions} />
              </Layout.Horizontal>
            )
          })}
        </Layout.Vertical>
      )}
    </Card>
  )
}
export default DelegateListingItem
