/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React, { useContext, useMemo, useState } from 'react'
import {
  Container,
  ExpandingSearchInput,
  Icon,
  IconName,
  Layout,
  PageError,
  PageSpinner,
  TableV2,
  Text
} from '@wings-software/uicore'

import type { CellProps, Column, Renderer } from 'react-table'
import { Color } from '@wings-software/design-system'
import ReactTimeago from 'react-timeago'

import { FileStoreContext } from '@filestore/components/FileStoreContext/FileStoreContext'
import { useStrings } from 'framework/strings'
import { EntityDetail, EntitySetupUsageDTO, Error, useGetReferencedBy } from 'services/cd-ng'
import css from './ReferencedBy.module.scss'

export const getIconByType = (type: EntityDetail['type'] | undefined): IconName => {
  switch (type) {
    case 'Pipelines':
      return 'pipeline-ng'
    case 'Connectors':
      return 'connectors-blue'
    case 'Template':
      return 'templates-blue'
    default:
      return 'cog'
  }
}

export default function ReferencedBy(): React.ReactElement {
  const { currentNode, queryParams } = useContext(FileStoreContext)
  const [searchTerm, setSearchTerm] = useState<string | undefined>()
  const [page, setPage] = useState(0)

  const {
    data: referencesResponse,
    loading,
    error,
    refetch
  } = useGetReferencedBy({
    identifier: currentNode.identifier,
    queryParams: {
      ...queryParams,
      searchTerm,
      pageIndex: page,
      pageSize: 10
    },
    debounce: 300
  })

  const data: EntitySetupUsageDTO[] = useMemo(
    () => referencesResponse?.data?.content || [],
    [referencesResponse?.data?.content]
  )
  const { getString } = useStrings()

  const RenderColumnEntity: Renderer<CellProps<EntitySetupUsageDTO>> = ({ row }) => {
    const entity = row.original.referredByEntity

    return (
      <Layout.Horizontal>
        {entity?.type && (
          <Icon name={getIconByType(entity?.type)} size={28} margin={{ top: 'xsmall', right: 'small' }} />
        )}
        <Layout.Vertical>
          <Layout.Horizontal spacing="small" width={230}>
            <Text color={Color.BLACK} lineClamp={1}>
              {entity?.name || ''}
            </Text>
          </Layout.Horizontal>
          <Text color={Color.GREY_600} font={{ size: 'small' }} width={230} lineClamp={2}>
            ({entity?.type})
          </Text>
        </Layout.Vertical>
      </Layout.Horizontal>
    )
  }

  const RenderColumnActivity: Renderer<CellProps<EntitySetupUsageDTO>> = ({ row }) => {
    const createdAt = row.original.createdAt
    return createdAt ? (
      <Layout.Horizontal spacing="small" color={Color.GREY_600}>
        <ReactTimeago date={createdAt} />
      </Layout.Horizontal>
    ) : null
  }

  const columns: Column<EntitySetupUsageDTO>[] = useMemo(
    () => [
      {
        Header: getString('entity'),
        accessor: row => row.referredByEntity?.name,
        id: 'entity',
        width: '50%',
        Cell: RenderColumnEntity
      },
      {
        Header: getString('lastActivity'),
        accessor: row => row.createdAt,
        id: 'activity',
        width: '50%',
        Cell: RenderColumnActivity
      }
    ],
    [getString]
  )

  return (
    <>
      <Layout.Horizontal flex className={css.header}>
        <div style={{ width: '200px' }}>Entity</div>
        <ExpandingSearchInput
          alwaysExpanded
          onChange={text => {
            setSearchTerm(text.trim())
            setPage(0)
          }}
          width={250}
        />
      </Layout.Horizontal>

      {loading ? (
        <div style={{ position: 'relative', height: 'calc(100vh - 128px)' }}>
          <PageSpinner />
        </div>
      ) : error ? (
        <div style={{ paddingTop: '200px' }}>
          <PageError
            message={(error.data as Error)?.message || error.message}
            onClick={/* istanbul ignore next */ () => refetch()}
          />
        </div>
      ) : !referencesResponse?.data?.empty ? (
        <TableV2<EntitySetupUsageDTO>
          className={css.table}
          columns={columns}
          data={data}
          name="ReferenceByView"
          pagination={{
            itemCount: referencesResponse?.data?.totalPages || 0,
            pageSize: referencesResponse?.data?.size || 10,
            pageCount: referencesResponse?.data?.totalPages || -1,
            pageIndex: referencesResponse?.data?.number || 0,
            gotoPage: setPage
          }}
        />
      ) : (
        <Container flex={{ align: 'center-center' }} padding="xxlarge">
          No Data
        </Container>
      )}
    </>
  )
}
