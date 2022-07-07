/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { CellProps, Column, Renderer } from 'react-table'
import { Container, Layout, TableV2, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { Position } from '@blueprintjs/core'
import { defaultTo, isEmpty, isEqual } from 'lodash-es'
import { TemplateListCardContextMenu } from '@templates-library/pages/TemplatesPage/views/TemplateListCardContextMenu/TemplateListCardContextMenu'
import { useStrings } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import type { TemplateSummaryResponse } from 'services/template-ng'
import { templateColorStyleMap } from '@templates-library/pages/TemplatesPage/TemplatesPageUtils'
import type { TemplatesViewProps } from '@templates-library/pages/TemplatesPage/views/TemplatesView/TemplatesView'
import { TagsPopover } from '@common/components'
import { Badge } from '@pipeline/pages/utils/Badge/Badge'
import GitDetailsColumn from '@common/components/Table/GitDetailsColumn/GitDetailsColumn'
import { TemplateType } from '@templates-library/utils/templatesUtils'
import { ScopeBadge } from '@common/components/ScopeBadge/ScopeBadge'
import css from './TemplatesListView.module.scss'

type CustomColumn<T extends Record<string, any>> = Column<T> & {
  onPreview?: (template: TemplateSummaryResponse) => void
  onOpenEdit?: (template: TemplateSummaryResponse) => void
  onOpenSettings?: (templateIdentifier: string) => void
  onDelete?: (template: TemplateSummaryResponse) => void
}

const RenderColumnMenu: Renderer<CellProps<TemplateSummaryResponse>> = ({ row, column }) => {
  const data = row.original
  const { onPreview, onOpenEdit, onOpenSettings, onDelete } = column as CustomColumn<TemplateSummaryResponse>
  return (
    <Layout.Horizontal style={{ justifyContent: 'flex-end' }}>
      {onPreview && onOpenEdit && onOpenSettings && onDelete && (
        <TemplateListCardContextMenu
          template={data}
          onPreview={onPreview}
          onOpenEdit={onOpenEdit}
          onOpenSettings={onOpenSettings}
          onDelete={onDelete}
        />
      )}
    </Layout.Horizontal>
  )
}

const RenderColumnType: Renderer<CellProps<TemplateSummaryResponse>> = ({ row }) => {
  const data = row.original
  const templateEntityType = data.templateEntityType
  const style = templateColorStyleMap[defaultTo(templateEntityType, TemplateType.Step)]

  return (
    <Layout.Horizontal
      className={css.templateColor}
      spacing="large"
      flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
      padding={{ right: 'medium' }}
    >
      <svg width="8" height="64" viewBox="0 0 8 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7.5 63.5L7.5 0.5H5C2.51472 0.5 0.5 2.51472 0.5 5L0.5 59C0.5 61.4853 2.51472 63.5 5 63.5H7.5Z"
          fill={style.fill}
          stroke={style.stroke}
        />
      </svg>
      {templateEntityType && (
        <Text font={{ size: 'xsmall', weight: 'bold' }} style={{ color: style.color, letterSpacing: 2 }}>
          {templateEntityType.toUpperCase()}
        </Text>
      )}
    </Layout.Horizontal>
  )
}

const RenderColumnTemplate: Renderer<CellProps<TemplateSummaryResponse>> = ({ row }) => {
  const data = row.original
  const { getString } = useStrings()
  return (
    <Layout.Horizontal flex={{ alignItems: 'center', justifyContent: 'start' }} padding={{ right: 'medium' }}>
      <Container>
        <Layout.Vertical spacing="xsmall">
          <Layout.Horizontal spacing="medium">
            <Text
              color={Color.GREY_800}
              tooltipProps={{ position: Position.BOTTOM }}
              lineClamp={1}
              tooltip={
                <Layout.Vertical
                  color={Color.GREY_800}
                  spacing="small"
                  padding="medium"
                  style={{ maxWidth: 400, overflowWrap: 'anywhere' }}
                >
                  <Text color={Color.GREY_800}>{getString('nameLabel', { name: data.name })}</Text>
                  <br />
                  <Text lineClamp={1}>
                    {getString('descriptionLabel', { description: defaultTo(data.description, '-') })}
                  </Text>
                </Layout.Vertical>
              }
            >
              {data.name}
            </Text>
            {data.tags && !isEmpty(data.tags) && <TagsPopover tags={data.tags} />}
          </Layout.Horizontal>
          <Text
            lineClamp={1}
            tooltipProps={{ position: Position.BOTTOM }}
            color={Color.GREY_400}
            font={{ size: 'small' }}
          >
            {getString('idLabel', { id: data.identifier })}
          </Text>
        </Layout.Vertical>
      </Container>
      {data.entityValidityDetails?.valid === false && (
        <Container>
          <Badge
            text={'common.invalid'}
            iconName="error-outline"
            showTooltip={true}
            entityName={data.name}
            entityType={'Template'}
          />
        </Container>
      )}
    </Layout.Horizontal>
  )
}

const RenderColumnLabel: Renderer<CellProps<TemplateSummaryResponse>> = ({ row }) => {
  const data = row.original
  return (
    <Layout.Horizontal padding={{ right: 'medium' }}>
      <Text color={Color.GREY_800} font={{ weight: 'semi-bold' }} lineClamp={1}>
        {data.versionLabel}
      </Text>
    </Layout.Horizontal>
  )
}

const RenderColumnScope: Renderer<CellProps<TemplateSummaryResponse>> = ({ row }) => {
  const data = row.original
  return (
    <Layout.Horizontal padding={{ right: 'medium' }}>
      <ScopeBadge data={data} minimal={true} />
    </Layout.Horizontal>
  )
}

export const TemplatesListView: React.FC<TemplatesViewProps> = (props): JSX.Element => {
  const { getString } = useStrings()
  const { data, selectedTemplate, gotoPage, onPreview, onOpenEdit, onOpenSettings, onDelete, onSelect } = props
  const { isGitSyncEnabled } = useAppStore()
  const hideMenu = !onPreview && !onOpenEdit && !onOpenSettings && !onDelete

  const getTemplateNameWidth = (): string => {
    if (isGitSyncEnabled) {
      if (hideMenu) {
        return '35%'
      }
      return '30%'
    } else {
      if (hideMenu) {
        return '45%'
      }
      return '40%'
    }
  }

  const columns: CustomColumn<TemplateSummaryResponse>[] = React.useMemo(
    () => [
      {
        Header: getString('typeLabel').toUpperCase(),
        accessor: 'templateEntityType',
        width: isGitSyncEnabled ? '15%' : '20%',
        Cell: RenderColumnType
      },
      {
        Header: 'Template',
        accessor: 'name',
        width: getTemplateNameWidth(),
        Cell: RenderColumnTemplate
      },
      {
        Header: getString('version').toUpperCase(),
        accessor: 'versionLabel',
        width: isGitSyncEnabled ? '10%' : '20%',
        Cell: RenderColumnLabel,
        disableSortBy: true
      },
      {
        Header: getString('common.gitSync.repoDetails').toUpperCase(),
        accessor: 'gitDetails',
        width: '30%',
        Cell: GitDetailsColumn,
        disableSortBy: true
      },
      {
        Header: 'Scope',
        accessor: 'accountId',
        width: isGitSyncEnabled ? '10%' : '15%',
        Cell: RenderColumnScope,
        disableSortBy: true
      },
      {
        Header: '',
        accessor: 'version',
        width: '5%',
        Cell: RenderColumnMenu,
        disableSortBy: true,
        onPreview,
        onOpenEdit,
        onOpenSettings,
        onDelete
      }
    ],
    [isGitSyncEnabled, onPreview, onOpenEdit, onOpenSettings, onDelete]
  )

  if (hideMenu) {
    columns.pop()
  }

  if (!isGitSyncEnabled) {
    columns.splice(3, 1)
  }

  return (
    <TableV2<TemplateSummaryResponse>
      className={css.table}
      columns={columns}
      data={defaultTo(data.content, [])}
      onRowClick={item => onSelect(item)}
      pagination={{
        className: css.pagination,
        itemCount: defaultTo(data.totalElements, 0),
        pageSize: defaultTo(data.size, 10),
        pageCount: defaultTo(data.totalPages, 0),
        pageIndex: defaultTo(data.number, 0),
        gotoPage
      }}
      getRowClassName={row => (isEqual(row.original, selectedTemplate) ? css.selected : '')}
    />
  )
}
