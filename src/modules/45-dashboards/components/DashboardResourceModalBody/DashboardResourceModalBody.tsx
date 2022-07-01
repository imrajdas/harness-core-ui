/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Layout, Text, Icon } from '@harness/uicore'
import { Color } from '@harness/design-system'
import type { CellProps, Renderer } from 'react-table'
import { useParams, Link } from 'react-router-dom'
import ResourceHandlerTable from '@rbac/components/ResourceHandlerTable/ResourceHandlerTable'

import { PageSpinner } from '@common/components'

import routes from '@common/RouteDefinitions'
import { useGetFolder, useGetOotbFolderId } from 'services/custom-dashboards'

import { useStrings } from 'framework/strings'

import css from './DashboardResourceModalBody.module.scss'

interface FolderList {
  id: string
  identifier: string
  name: string
  Children: { id: string; name: string }[]
}

const PAGE_SIZE = 5

export const RenderColumnSecret: Renderer<CellProps<FolderList>> = ({ row }) => {
  const data = row.original
  const { accountId } = useParams<{ accountId: string }>()

  return (
    <Layout.Vertical>
      <Text color={Color.BLACK} lineClamp={1}>
        {data.name} ({data.Children.length}){'  '}
        <Link
          target="_blank"
          to={routes.toCustomDashboardHome({
            folderId: data.identifier,
            accountId: accountId
          })}
        >
          <Icon name="main-share" color={Color.GREY_600} />
        </Link>
      </Text>
      <Container flex={{ justifyContent: 'start' }} className={css.dashboardShortcutList}>
        {data.Children.map((dashboards: { id: string; name: string }) => {
          return (
            <Layout.Horizontal className={css.dashboardDetail} key={dashboards?.name + '_' + dashboards?.id}>
              {dashboards.name}
              <Link
                target="_blank"
                className={css.dashboardDetailLink}
                to={routes.toViewCustomDashboard({
                  viewId: dashboards.id,
                  accountId: accountId,
                  folderId: data.identifier
                })}
              >
                <Icon name="main-share" color={Color.GREY_600} />
              </Link>
            </Layout.Horizontal>
          )
        })}
      </Container>
    </Layout.Vertical>
  )
}

export interface DashboardResourceModalBodyProps {
  onSelectChange: (items: string[]) => void
  selectedData: string[]
  resourceScope: { accountIdentifier: string }
}

const DashboardResourceModalBody: React.FC<DashboardResourceModalBodyProps> = ({
  // searchTerm,
  onSelectChange,
  selectedData,
  resourceScope
}) => {
  const { accountIdentifier } = resourceScope

  const [page, setPage] = React.useState(0)
  const { getString } = useStrings()

  const { data: folders, loading: fetchingFolders } = useGetFolder({
    queryParams: { accountId: accountIdentifier, page: page + 1, pageSize: PAGE_SIZE, isAdmin: true }
  })

  const { data: ootbFolder, loading: fetchingOotbFolder } = useGetOotbFolderId({
    queryParams: { accountId: accountIdentifier }
  })

  const includeOotbBeforeOnChange = (items: string[]) => {
    if (ootbFolder?.resource) {
      items = items.filter((val: string) => val !== ootbFolder.resource)
      if (items.length > 0) {
        items.push(ootbFolder.resource)
      }
    }
    onSelectChange(items)
  }

  const parsedFolders =
    folders?.resource?.map((folder: { id: string; name: string }) => ({
      identifier: folder.id,
      ...folder
    })) || []

  if (fetchingFolders || fetchingOotbFolder) return <PageSpinner />
  return parsedFolders?.length > 0 ? (
    <Container className={css.container}>
      <ResourceHandlerTable
        data={parsedFolders}
        selectedData={selectedData}
        columns={[
          {
            id: 'name',
            accessor: 'name',
            width: '95%',
            Cell: RenderColumnSecret,
            disableSortBy: true
          }
        ]}
        pagination={{
          itemCount: folders?.items || 0,
          pageSize: PAGE_SIZE,
          pageCount: folders?.pages || 1,
          pageIndex: page || 0,
          gotoPage: pageNumber => setPage(pageNumber)
        }}
        onSelectChange={includeOotbBeforeOnChange}
      />
    </Container>
  ) : (
    <Layout.Vertical flex={{ align: 'center-center' }} spacing="small">
      <Icon name="resources-icon" size={20} />
      <Text font="medium" color={Color.BLACK}>
        {getString('noData')}
      </Text>
    </Layout.Vertical>
  )
}

export default DashboardResourceModalBody
