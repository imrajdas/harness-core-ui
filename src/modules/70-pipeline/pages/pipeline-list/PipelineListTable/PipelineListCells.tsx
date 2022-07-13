/* eslint-disable react/function-component-definition */
/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Classes, Menu, PopoverInteractionKind, Position } from '@blueprintjs/core'
import { Color } from '@harness/design-system'
import { Button, Icon, Layout, Popover, Text, useToggleOpen, Container, TagsPopover } from '@harness/uicore'
import defaultTo from 'lodash-es/defaultTo'
import { useParams, Link } from 'react-router-dom'
import type { CellProps, Renderer } from 'react-table'
import ReactTimeago from 'react-timeago'
import React from 'react'
import { StoreType } from '@common/constants/GitSyncTypes'
import routes from '@common/RouteDefinitions'
import { useRunPipelineModal } from '@pipeline/components/RunPipelineModal/useRunPipelineModal'
import { StatusHeatMap } from '@pipeline/components/StatusHeatMap/StatusHeatMap'
import useDeleteConfirmationDialog from '@pipeline/pages/utils/DeleteConfirmDialog'
import { getFeaturePropsForRunPipelineButton } from '@pipeline/utils/runPipelineUtils'
import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import { usePermission } from '@rbac/hooks/usePermission'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useStrings } from 'framework/strings'
import { Badge } from '@pipeline/pages/utils/Badge/Badge'
import { getReadableDateTime } from '@common/utils/dateUtils'
import type { PMSPipelineSummaryResponse } from 'services/pipeline-ng'
import { ClonePipelineForm } from '@pipeline/pages/pipelines/views/ClonePipelineForm/ClonePipelineForm'
import ExecutionStatusLabel from '@pipeline/components/ExecutionStatusLabel/ExecutionStatusLabel'
import type { ExecutionStatus } from '@pipeline/utils/statusHelpers'
import { getRouteProps } from '../PipelineListUtils'
import type { PipelineListPagePathParams } from '../types'
import css from './PipelineListTable.module.scss'

const LabeValue = ({ label, value }: { label: string; value: string | undefined }) => {
  return (
    <Layout.Horizontal spacing="small">
      <Text color={Color.GREY_200}>{label}:</Text>
      <Text color={Color.WHITE}>{value}</Text>
    </Layout.Horizontal>
  )
}

export const CodeSourceCell: Renderer<CellProps<PMSPipelineSummaryResponse>> = ({ row }) => {
  const { gitDetails } = row.original
  const { getString } = useStrings()
  const data = row.original
  const isRemote = data.storeType === StoreType.REMOTE

  return (
    <div className={css.storeTypeColumnContainer}>
      <Popover
        disabled={!isRemote}
        position={Position.TOP}
        interactionKind={PopoverInteractionKind.HOVER}
        className={Classes.DARK}
        content={
          <Layout.Vertical spacing="medium" padding="medium" style={{ maxWidth: 400 }}>
            <Layout.Horizontal spacing="small">
              <Icon name="github" size={16} color={Color.GREY_200} />
              <Text color={Color.WHITE}>{gitDetails?.repoName || gitDetails?.repoIdentifier}</Text>
            </Layout.Horizontal>
            <Layout.Horizontal spacing="small">
              <Icon name="remotefile" size={16} color={Color.GREY_200} />
              <Text color={Color.WHITE}>{gitDetails?.filePath}</Text>
            </Layout.Horizontal>
          </Layout.Vertical>
        }
      >
        <div className={css.storeTypeColumn}>
          <Icon name={isRemote ? 'remote-setup' : 'repository'} size={12} color={Color.GREY_800} />
          <Text margin={{ left: 'xsmall' }} font={{ size: 'small' }} color={Color.GREY_800}>
            {isRemote ? getString('repository') : getString('inline')}
          </Text>
        </div>
      </Popover>
    </div>
  )
}

export const LastExecutionCell: Renderer<CellProps<PMSPipelineSummaryResponse>> = ({ row }) => {
  const data = row.original
  const lastExecutionTs = data.executionSummaryInfo?.lastExecutionTs
  return (
    <Layout.Horizontal spacing="small" style={{ alignItems: 'center' }}>
      <div className={css.avatar}>OL</div>
      <Layout.Vertical spacing="small">
        <Text color={Color.GREY_600} font={{ size: 'small' }}>
          OliviaLee@gmail.com
        </Text>
        <Text color={Color.GREY_400} font={{ size: 'small' }}>
          {lastExecutionTs ? <ReactTimeago date={lastExecutionTs} /> : 'This pipeline never ran'}
        </Text>
      </Layout.Vertical>
    </Layout.Horizontal>
  )
}

export const LastModifiedCell: Renderer<CellProps<PMSPipelineSummaryResponse>> = ({ row }) => {
  const data = row.original
  return (
    <Text color={Color.GREY_600} font={{ size: 'small' }}>
      {getReadableDateTime(data.lastUpdatedAt)}
    </Text>
  )
}

export const MenuCell: Renderer<CellProps<PMSPipelineSummaryResponse>> = ({ row, column }) => {
  const data = row.original
  const pathParams = useParams<PipelineListPagePathParams>()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const { getString } = useStrings()
  const { projectIdentifier, orgIdentifier, accountId } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()

  const { confirmDelete } = useDeleteConfirmationDialog(data, 'pipeline', (column as any).onDeletePipeline)
  const { isGitSyncEnabled, isGitSimplificationEnabled } = useAppStore()
  const [canDelete, canRun] = usePermission(
    {
      resourceScope: {
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier
      },
      resource: {
        resourceType: ResourceType.PIPELINE,
        resourceIdentifier: data.identifier as string
      },
      permissions: [PermissionIdentifier.DELETE_PIPELINE, PermissionIdentifier.EXECUTE_PIPELINE]
    },
    [data.identifier]
  )

  const runPipeline = (): void => {
    openRunPipelineModal()
  }

  const { openRunPipelineModal } = useRunPipelineModal({
    pipelineIdentifier: (data.identifier || '') as string,
    repoIdentifier: isGitSyncEnabled ? data.gitDetails?.repoIdentifier : data.gitDetails?.repoName,
    branch: data.gitDetails?.branch,
    connectorRef: data.connectorRef,
    storeType: data.storeType as StoreType
  })

  const {
    open: openClonePipelineModal,
    isOpen: isClonePipelineModalOpen,
    close: closeClonePipelineModal
  } = useToggleOpen()

  return (
    <Layout.Horizontal style={{ justifyContent: 'flex-end' }}>
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
          className={css.actionButton}
          icon="more"
          onClick={e => {
            e.stopPropagation()
            setMenuOpen(true)
          }}
        />
        <Menu style={{ minWidth: 'unset' }} onClick={e => e.stopPropagation()}>
          <RbacMenuItem
            icon="play"
            text={getString('runPipelineText')}
            disabled={!canRun || data?.entityValidityDetails?.valid === false}
            onClick={runPipeline}
            featuresProps={getFeaturePropsForRunPipelineButton({ modules: data.modules, getString })}
          />
          <Menu.Item
            className={css.link}
            icon="cog"
            text={
              <Link to={routes.toPipelineStudio(getRouteProps(pathParams, data))}>
                {getString('pipeline.viewPipeline')}
              </Link>
            }
          />
          <Menu.Item
            className={css.link}
            icon="list-detail-view"
            text={
              <Link to={routes.toPipelineDetail(getRouteProps(pathParams, data))}>{getString('viewExecutions')}</Link>
            }
          />
          <Menu.Divider />
          <Menu.Item
            icon="duplicate"
            text={getString('projectCard.clone')}
            disabled={isGitSyncEnabled || isGitSimplificationEnabled}
            onClick={openClonePipelineModal}
          />
          <Menu.Item
            icon="trash"
            text={getString('delete')}
            disabled={!canDelete}
            onClick={() => {
              ;(column as any).onDelete(data)
              confirmDelete()
              setMenuOpen(false)
            }}
          />
        </Menu>
      </Popover>
      <ClonePipelineForm isOpen={isClonePipelineModalOpen} onClose={closeClonePipelineModal} originalPipeline={data} />
    </Layout.Horizontal>
  )
}

export const PipelineNameCell: Renderer<CellProps<PMSPipelineSummaryResponse>> = ({ row }) => {
  const data = row.original
  const { getString } = useStrings()
  const pathParams = useParams<PipelineListPagePathParams>()

  return (
    <Layout.Horizontal flex={{ alignItems: 'center', justifyContent: 'space-between' }}>
      <Layout.Vertical spacing="xsmall" data-testid={data.identifier}>
        <Layout.Horizontal spacing="medium">
          <Link to={routes.toPipelines(getRouteProps(pathParams, data))}>
            <Text
              font={{ size: 'normal' }}
              color={Color.PRIMARY_7}
              tooltipProps={{ isDark: true }}
              tooltip={
                <Layout.Vertical spacing="medium" padding="medium" style={{ maxWidth: 400 }}>
                  <LabeValue label={getString('name')} value={data.name} />
                  <LabeValue label={getString('common.ID')} value={data.identifier} />
                  {data.description && <LabeValue label={getString('description')} value={data.description} />}
                </Layout.Vertical>
              }
            >
              {data.name}
            </Text>
          </Link>
          {data.tags && Object.keys(data.tags || {}).length ? <TagsPopover tags={data.tags} /> : null}
        </Layout.Horizontal>
        <Text color={Color.GREY_400} font="small">
          {getString('idLabel', { id: data.identifier })}
        </Text>
      </Layout.Vertical>
      {data?.entityValidityDetails?.valid === false && (
        <Container margin={{ left: 'large' }}>
          <Badge
            text={'common.invalid'}
            iconName="error-outline"
            showTooltip={true}
            entityName={data.name}
            entityType={'Pipeline'}
          />
        </Container>
      )}
    </Layout.Horizontal>
  )
}

export const RecentTenExecutionsCell: Renderer<CellProps<PMSPipelineSummaryResponse>> = () => {
  const { getString } = useStrings()

  // TODO: temp data, replace once BE is ready
  const statuses: ExecutionStatus[] = [
    'Skipped',
    'Queued',
    'Errored',
    'Suspended',
    'Success',
    'IgnoreFailed',
    'Running',
    'ResourceWaiting',
    'InputWaiting',
    'Paused'
  ]
  const executions = Array(10)
    .fill({})
    .map((_, index) => ({
      executionId: index.toString(),
      lastExecutedBy: 'OliviaLee@gmail.com',
      status: index < 6 ? 'Success' : statuses[Math.floor(Math.random() * statuses.length)],
      triggerName: 'chart trigger'
    }))
  return (
    <StatusHeatMap
      data={executions}
      getId={i => defaultTo(i.executionId, '')}
      getStatus={i => i.status}
      getPopoverProps={i => ({
        position: Position.TOP,
        interactionKind: PopoverInteractionKind.HOVER,
        content: (
          <Layout.Vertical padding="medium" spacing="medium">
            <div>
              <ExecutionStatusLabel status={i.status as ExecutionStatus} />
            </div>
            <LabeValue label={getString('pipeline.executionId')} value={i.executionId} />
            <LabeValue label={getString('pipeline.lastExecutedBy')} value={i.status} />
            <LabeValue label={getString('common.triggerName')} value={i.triggerName} />
          </Layout.Vertical>
        ),
        className: Classes.DARK
      })}
    />
  )
}
