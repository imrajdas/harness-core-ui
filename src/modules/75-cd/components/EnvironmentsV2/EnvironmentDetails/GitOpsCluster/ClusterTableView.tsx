/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

/* eslint-disable react-hooks/exhaustive-deps */
import {
  Button,
  Color,
  Container,
  Intent,
  Layout,
  PageSpinner,
  TableV2,
  useConfirmationDialog,
  Text,
  useToaster
} from '@harness/uicore'
import React from 'react'
import { useParams } from 'react-router-dom'
import type { CellProps, Column, Renderer } from 'react-table'
import ReactTimeago from 'react-timeago'
import { defaultTo, get, noop } from 'lodash-es'

import { useStrings } from 'framework/strings'

import { ClusterResponse, ResponsePageClusterResponse, useDeleteCluster } from 'services/cd-ng'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'

import css from '../EnvironmentDetails.module.scss'

interface ClusterTableViewProps {
  linkedClusters: ResponsePageClusterResponse | null
  loading: boolean
  refetch: any
  envRef: string
}

const RenderClusterRef: Renderer<CellProps<ClusterResponse>> = ({ row }) => {
  const data = row.original.clusterRef as any
  const { getString } = useStrings()
  return (
    <Layout.Vertical>
      <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} spacing="small" margin={{ bottom: 'small' }}>
        <Text color={Color.BLACK}>{data}</Text>
      </Layout.Horizontal>

      <Text color={Color.GREY_500} font={{ size: 'small' }} lineClamp={1}>
        {getString('common.ID')}: {data}
      </Text>
    </Layout.Vertical>
  )
}
const RenderColumnMenu: Renderer<CellProps<ClusterResponse>> = ({ row, column }) => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const data = row.original.clusterRef as any
  const refetchCall = (column as any).refetch
  const environmentIdentifier = row.original.envRef
  const { getString } = useStrings()
  const toast = useToaster()
  const { mutate } = useDeleteCluster({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier: orgIdentifier,
      projectIdentifier: projectIdentifier,
      environmentIdentifier: environmentIdentifier
    },
    requestOptions: {
      headers: {
        'content-type': 'application/json'
      }
    }
  })

  const { openDialog } = useConfirmationDialog({
    contentText: 'Are you sure you want to unlink the cluster?',
    titleText: 'Unlink cluster',
    confirmButtonText: getString('cd.unLink'),
    cancelButtonText: getString('cancel'),
    intent: Intent.DANGER,
    buttonIntent: Intent.DANGER,
    onCloseDialog: async didConfirm => {
      // istanbul ignore else
      if (didConfirm) {
        try {
          /* istanbul ignore next */
          const deleted = await mutate(data)
          // istanbul ignore else
          if (deleted) {
            /* istanbul ignore next */
            toast.showSuccess(getString('cd.unLinkedCluster'))
            /* istanbul ignore next */
            refetchCall()
          }
        } catch (err: any) {
          /* istanbul ignore next */
          if (err) {
            /* istanbul ignore next */
            toast.showError(err?.data?.message || err?.message)
          }
        }
      }
    }
  })

  return (
    <>
      <Button
        icon="trash"
        data-test-id={'unlink-btn'}
        minimal
        onClick={() => {
          openDialog()
        }}
      />
    </>
  )
}

const RenderLastUpdatedBy: Renderer<CellProps<ClusterResponse>> = ({ row }): JSX.Element => {
  const rowdata = row.original
  return (
    <Layout.Vertical spacing={'small'}>
      <ReactTimeago date={defaultTo(rowdata.linkedAt, 0)} />
    </Layout.Vertical>
  )
}

const ClusterTableView = (props: ClusterTableViewProps): React.ReactElement => {
  const { loading, linkedClusters } = props
  const { getString } = useStrings()
  const columns: Array<Column<ClusterResponse>> = React.useMemo(
    () => [
      {
        Header: 'Clusters',
        id: 'clusterRef',
        accessor: 'clusterRef',
        width: '75%',
        Cell: RenderClusterRef
      },
      {
        Header: 'Last Updated At',
        id: 'linkedAt',
        accessor: 'linkedAt',
        width: '15%',
        Cell: RenderLastUpdatedBy
      },
      {
        id: 'menuBtn',
        width: '5%',
        disableSortBy: true,
        Cell: RenderColumnMenu,
        environmentIdentifier: defaultTo(props.envRef, ''),
        refetch: defaultTo(props.refetch, noop)
      }
    ],
    // istanbul ignore next
    []
  )

  if (loading) {
    return <PageSpinner />
  }
  const content = get(linkedClusters, 'data.content', [])
  if (content.length) {
    return (
      <TableV2
        columns={columns}
        data={content}
        sortable
        rowDataTestID={() => {
          return `clusterDataRow`
        }}
        className={css.clusterDataTable}
      />
    )
  }
  return <Container style={{ padding: '20px' }}>{getString('cd.noLinkedClusters')}</Container>
}

export default ClusterTableView
