/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import cx from 'classnames'
import {
  Layout,
  Text,
  Container,
  Button,
  Heading,
  Icon,
  Pagination,
  SelectOption,
  ExpandingSearchInput,
  TableV2
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import { Color } from '@harness/design-system'
import { Select } from '@blueprintjs/select'

import { Dialog, Menu } from '@blueprintjs/core'
import { useParams, useHistory } from 'react-router-dom'
import type { CellProps, Renderer, Column } from 'react-table'
import RbacButton from '@rbac/components/Button/Button'
import { Page } from '@common/exports'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import routes from '@common/RouteDefinitions'

import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { PAGE_SIZE } from '@dashboards/pages/home/HomePage'
import FolderCard from '@dashboards/components/FolderCard/FolderCard'
import { useStrings } from 'framework/strings'
import { ErrorResponse, FolderModel, useGetFolders } from 'services/custom-dashboards'
import CreateFolder from './form/CreateFolder'
import { useDashboardsContext } from '../DashboardsContext'

import css from '../home/HomePage.module.scss'

type CustomColumn<T extends Record<string, any>> = Column<T>

const CustomSelect = Select.ofType<SelectOption>()

enum LayoutViews {
  LIST,
  GRID
}

const defaultSortBy: SelectOption = {
  label: 'Select Option',
  value: ''
}

const RenderDashboardName: Renderer<CellProps<FolderModel>> = ({ row }) => {
  const data = row.original
  return (
    <Text color={Color.BLACK} lineClamp={1}>
      {data.name}
    </Text>
  )
}

const RenderDashboardCount: Renderer<CellProps<FolderModel>> = ({ row }) => {
  const data = row.original
  return (
    <Layout.Horizontal spacing="small">
      <Text
        icon="dashboard"
        iconProps={{ color: Color.GREY_300, size: 24 }}
        color={Color.PRIMARY_7}
        font={{ size: 'medium', weight: 'semi-bold' }}
      >
        {data?.child_count || 0}
      </Text>
    </Layout.Horizontal>
  )
}

const columns: CustomColumn<FolderModel>[] = [
  {
    Header: 'Name',
    id: 'name',
    accessor: row => row.name,
    width: '80%',
    Cell: RenderDashboardName
  },

  {
    Header: 'Dashboard Count',
    id: 'child_count',
    accessor: row => row.child_count,
    width: '20%',
    Cell: RenderDashboardCount
  }
]

const FoldersPage: React.FC = () => {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  const history = useHistory()
  const { includeBreadcrumbs } = useDashboardsContext()

  const [filteredFoldersList, setFilteredList] = React.useState<FolderModel[]>([])

  const [page, setPage] = useState(0)

  const [searchTerm, setSearchTerm] = useState<string | undefined>()
  const [layoutView, setLayoutView] = useState(LayoutViews.GRID)
  const [sortBy, setSortingFilter] = useState<SelectOption>(defaultSortBy)

  const strRefFolders = 'dashboards.homePage.folders'

  React.useEffect(() => {
    const script = document.createElement('script')

    script.src = 'https://fast.wistia.com/assets/external/E-v1.js'
    script.async = true

    document.body.appendChild(script)
  }, [])

  React.useEffect(() => {
    if (searchTerm || sortBy?.value) {
      setPage(0)
    }
  }, [searchTerm, sortBy?.value])

  React.useEffect(() => {
    includeBreadcrumbs([
      {
        url: routes.toCustomFolderHome({ accountId }),
        label: getString(strRefFolders)
      }
    ])
  }, [])

  const {
    data: foldersList,
    loading,
    error,
    refetch: reloadFolders
  } = useGetFolders({
    queryParams: {
      accountId,
      searchTerm,
      page: page + 1,
      pageSize: PAGE_SIZE,
      sortBy: String(sortBy?.value)
    }
  })

  const sortingOptions: SelectOption[] = [
    {
      label: 'Name (A-Z)',
      value: 'name'
    },
    {
      label: 'Name (Z-A)',
      value: 'name desc'
    },
    {
      label: 'Recently Created',
      value: 'created_at desc'
    }
  ]

  const onReload = (): void => {
    reloadFolders?.()
  }

  React.useEffect(() => {
    if (foldersList) {
      const updatedList: FolderModel[] = foldersList?.resource || []
      setFilteredList(updatedList)
    }
  }, [foldersList])

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog isOpen={true} enforceFocus={false} onClose={hideModal} className={cx(css.dashboardDialog, css.create)}>
        <CreateFolder onFormCompleted={hideModal} />
      </Dialog>
    ),
    []
  )

  return (
    <Page.Body
      loading={loading}
      error={(error?.data as ErrorResponse)?.responseMessages}
      retryOnError={() => reloadFolders()}
    >
      <Layout.Horizontal
        spacing="medium"
        background={Color.GREY_0}
        padding="large"
        flex={{ justifyContent: 'space-between', alignItems: 'center' }}
        border={{ bottom: true, color: 'grey100' }}
      >
        <RbacButton
          intent="primary"
          text={getString(strRefFolders)}
          onClick={showModal}
          icon="plus"
          className={css.createButton}
          permission={{
            permission: PermissionIdentifier.EDIT_DASHBOARD,
            resource: {
              resourceType: ResourceType.DASHBOARDS
            }
          }}
        />
        <Layout.Horizontal>
          <CustomSelect
            items={sortingOptions}
            filterable={false}
            itemRenderer={(item, { handleClick, index }) => (
              <Menu.Item key={`dashboard-sort-select-${index}`} text={item.label} onClick={handleClick} />
            )}
            onItemSelect={item => {
              setSortingFilter(item)
            }}
            popoverProps={{ minimal: true, popoverClassName: '' }}
          >
            <Button
              inline
              round
              rightIcon="chevron-down"
              className={css.customSelect}
              text={
                <Text color={Color.BLACK}>
                  {getString('dashboards.sortBy')} {sortBy?.label}
                </Text>
              }
            />
          </CustomSelect>
          <Layout.Horizontal>
            <Button
              minimal
              icon="grid-view"
              aria-label={getString('dashboards.switchToGridView')}
              intent={layoutView === LayoutViews.GRID ? 'primary' : 'none'}
              onClick={() => {
                setLayoutView(LayoutViews.GRID)
              }}
            />
            <Button
              minimal
              aria-label={getString('dashboards.switchToListView')}
              icon="list"
              intent={layoutView === LayoutViews.LIST ? 'primary' : 'none'}
              onClick={() => {
                setLayoutView(LayoutViews.LIST)
              }}
            />
          </Layout.Horizontal>
        </Layout.Horizontal>
      </Layout.Horizontal>

      <Layout.Vertical className={css.foldersContent}>
        <Layout.Horizontal padding={{ top: 'large', right: 'xxxlarge', bottom: 'large', left: 'xxxlarge' }}>
          <ExpandingSearchInput
            placeholder={getString('dashboards.homePage.searchPlaceholder')}
            onChange={(text: string) => {
              setSearchTerm(text)
            }}
            className={css.search}
          />
        </Layout.Horizontal>

        {filteredFoldersList && filteredFoldersList.length > 0 && layoutView === LayoutViews.GRID && (
          <Layout.Vertical padding="large">
            <Container className={css.folderMasonry}>
              <Layout.Masonry
                center
                gutter={25}
                items={filteredFoldersList}
                renderItem={(folder: FolderModel) => (
                  <FolderCard accountId={accountId} folder={folder} onTriggerFolderRefetch={onReload} />
                )}
                keyOf={folder => folder?.id}
              />
            </Container>
          </Layout.Vertical>
        )}

        {filteredFoldersList && filteredFoldersList.length > 0 && layoutView === LayoutViews.LIST && (
          <Container className={css.folderMasonry}>
            <TableV2<FolderModel>
              className={css.table}
              columns={columns}
              data={filteredFoldersList || []}
              onRowClick={data => {
                history.push({
                  pathname: routes.toCustomDashboardHome({
                    folderId: data?.id ? data?.id : 'shared',
                    accountId: accountId
                  })
                })
              }}
            />
          </Container>
        )}

        {filteredFoldersList && filteredFoldersList.length === 0 && !loading && (
          <Container flex={{ justifyContent: 'center' }} className={css.noFoldersContent}>
            <Layout.Vertical flex={{ justifyContent: 'center' }} spacing="medium">
              <Icon name="folder-open" color={Color.GREY_300} size={35} />
              <Heading level={2} font={{ align: 'center' }} color={Color.GREY_500}>
                {getString('dashboards.homePage.noFolderAvailable')}
              </Heading>
            </Layout.Vertical>
          </Container>
        )}
      </Layout.Vertical>

      {!loading && (
        <Layout.Vertical padding={{ right: 'medium', left: 'medium' }}>
          <Pagination
            gotoPage={(pageNumber: number) => setPage(pageNumber)}
            itemCount={foldersList?.items || 1}
            pageCount={foldersList?.pages || 1}
            pageIndex={page}
            pageSize={PAGE_SIZE}
          />
        </Layout.Vertical>
      )}
    </Page.Body>
  )
}

export default FoldersPage
