/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import moment from 'moment'
import type { CellProps, Renderer, Column } from 'react-table'
import {
  Icon,
  Text,
  Layout,
  Button,
  Popover,
  Container,
  IconName,
  TableV2,
  useConfirmationDialog
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { Classes, Menu, Position, Intent, PopoverInteractionKind } from '@blueprintjs/core'
import { defaultTo } from 'lodash-es'
import routes from '@common/RouteDefinitions'
import { QlceView, ViewState, ViewType } from 'services/ce/services'
import { perspectiveDateLabelToDisplayText, SOURCE_ICON_MAPPING } from '@ce/utils/perspectiveUtils'
import formatCost from '@ce/utils/formatCost'
import { useStrings } from 'framework/strings'
import useMoveFolderModal from '../PerspectiveFolders/MoveFolderModal'
import css from './PerspectiveListView.module.scss'

interface PerspectiveListViewProps {
  pespectiveData: QlceView[]
  navigateToPerspectiveDetailsPage: (
    perspectiveId: string,
    viewState: ViewState,
    name: string,
    viewType: ViewType
  ) => void
  deletePerpsective: (perspectiveId: string, perspectiveName: string) => void
  clonePerspective: (perspectiveId: string, perspectiveName: string) => void
  setRefetchFolders: React.Dispatch<React.SetStateAction<boolean>>
  setSelectedFolder: (newState: string) => void
  setRefetchPerspectives: React.Dispatch<React.SetStateAction<boolean>>
}

const PerspectiveListView: React.FC<PerspectiveListViewProps> = ({
  pespectiveData,
  navigateToPerspectiveDetailsPage,
  deletePerpsective,
  clonePerspective,
  setRefetchFolders,
  setSelectedFolder,
  setRefetchPerspectives
}) => {
  const history = useHistory()
  const { accountId } = useParams<{
    accountId: string
  }>()
  const { getString } = useStrings()

  const dateLabelToDisplayText = perspectiveDateLabelToDisplayText(getString)

  const TimePeriodCell: Renderer<CellProps<QlceView>> = cell => {
    return cell.value ? (
      <Text>{dateLabelToDisplayText[cell.value] || getString('common.repo_provider.customLabel')}</Text>
    ) : null
  }

  const DataSourcesCell: Renderer<CellProps<QlceView>> = cell => {
    const dataSources = (cell.value || []) as string[]
    return (
      <Layout.Horizontal
        spacing="small"
        style={{
          alignItems: 'center'
        }}
      >
        {dataSources.map(source => (
          <Icon key={source} size={22} name={SOURCE_ICON_MAPPING[source]} />
        ))}
      </Layout.Horizontal>
    )
  }

  const CostCell: Renderer<CellProps<QlceView>> = cell => {
    return !isNaN(cell.value) ? (
      <Text font={{ weight: 'semi-bold' }} color="grey800">
        {formatCost(cell.value)}
      </Text>
    ) : null
  }

  const LastEditedCell: Renderer<CellProps<QlceView>> = cell => {
    return cell.value ? moment(cell.value).format('LLL') : null
  }

  const onEditClick: (perspectiveId: string) => void = perspectiveId => {
    history.push(
      routes.toCECreatePerspective({
        accountId: accountId,
        perspectiveId: perspectiveId
      })
    )
  }

  const NameCell: Renderer<CellProps<QlceView>> = cell => {
    const viewState = (cell as any).row?.original?.viewState
    const viewType = (cell as any).row?.original?.viewType
    const folderName = (cell as any).row?.original?.folderName
    let iconName: IconName | undefined
    if (viewState === ViewState.Draft) {
      iconName = 'deployment-incomplete-new'
    }
    if (viewType === ViewType.Default) {
      iconName = 'harness'
    }
    return cell.value ? (
      <Container className={css.nameContainer}>
        <Text icon={iconName} inline color="grey800">
          {cell.value}
        </Text>
        {folderName && (
          <Popover
            position={Position.TOP}
            interactionKind={PopoverInteractionKind.HOVER}
            content={
              <Text padding={'medium'} background={Color.GREY_0} color={Color.GREY_600}>
                {folderName}
              </Text>
            }
          >
            <Icon name={'main-folder'} color={Color.GREY_400} size={14} margin={{ left: 'small' }} />
          </Popover>
        )}
        {viewType === ViewType.Default && <Container className={css.sampleRibbon}></Container>}
      </Container>
    ) : null
  }

  const RenderColumnMenu: Renderer<CellProps<QlceView>> = ({ row }) => {
    const [menuOpen, setMenuOpen] = useState(false)

    const { openDialog } = useConfirmationDialog({
      contentText: (
        <div>
          <Text>
            {getString('ce.perspectives.confirmDeletePerspectiveMsg', {
              name: row.original.name
            })}
          </Text>
        </div>
      ),
      titleText: getString('ce.perspectives.confirmDeletePerspectiveTitle'),
      confirmButtonText: getString('delete'),
      cancelButtonText: getString('cancel'),
      intent: Intent.DANGER,
      buttonIntent: Intent.DANGER,
      onCloseDialog: async (isConfirmed: boolean) => {
        if (isConfirmed) {
          row.original.id && deletePerpsective(row.original.id, defaultTo(row.original.name, ''))
        }
      }
    })

    const { openMoveFoldersModal } = useMoveFolderModal({
      perspectiveId: row.original.id || '',
      setRefetchFolders,
      setSelectedFolder,
      setRefetchPerspectives
    })

    const viewType = row?.original?.viewType
    const disableActions = viewType === ViewType.Default ? true : false

    const editClick: (e: any) => void = e => {
      e.stopPropagation()
      setMenuOpen(false)
      row.original.id && onEditClick(row.original.id)
    }

    const onDeleteClick: (e: any) => void = e => {
      e.stopPropagation()
      setMenuOpen(false)
      openDialog()
    }

    const onCloneClick: (e: any) => void = e => {
      e.stopPropagation()
      setMenuOpen(false)
      if (row.original.id && row.original.name) {
        clonePerspective(row.original.id, row.original.name)
      }
    }

    const onMoveClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void = e => {
      e.stopPropagation()
      setMenuOpen(false)
      openMoveFoldersModal()
    }

    return (
      <Layout.Horizontal>
        <Popover
          isOpen={menuOpen}
          onInteraction={nextOpenState => {
            setMenuOpen(nextOpenState)
          }}
          position={Position.BOTTOM_RIGHT}
          className={Classes.DARK}
        >
          <Button
            minimal
            icon="Options"
            onClick={e => {
              e.stopPropagation()
              setMenuOpen(true)
            }}
            data-testid={`menu-${row.original.id}`}
          />
          <Container>
            <Menu>
              <Menu.Item disabled={disableActions} onClick={editClick} icon="edit" text="Edit" />
              <Menu.Item
                onClick={onCloneClick}
                icon="duplicate"
                text="Clone"
                data-testid={`clone-perspective-${row.original.id}`}
              />
              <Menu.Item disabled={disableActions} onClick={onDeleteClick} icon="trash" text="Delete" />
              <Menu.Item
                disabled={disableActions}
                onClick={onMoveClick}
                icon="add-to-folder"
                text={getString('ce.perspectives.folders.moveToLabel')}
              />
            </Menu>
          </Container>
        </Popover>
      </Layout.Horizontal>
    )
  }

  const columns: Column<QlceView>[] = useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name',
        width: '30%',
        Cell: NameCell
      },
      {
        Header: 'Data Sources',
        accessor: 'dataSources',
        width: '15%',
        Cell: DataSourcesCell
      },
      {
        Header: 'Total Cost',
        accessor: 'totalCost',
        width: '20%',
        Cell: CostCell
      },
      {
        Header: 'Time Period',
        accessor: 'timeRange',
        width: '15%',
        Cell: TimePeriodCell
      },
      { Header: 'Last Edit', accessor: 'lastUpdatedAt', width: '15%', Cell: LastEditedCell },
      {
        Header: '',
        id: 'menu',
        width: '5%',
        Cell: RenderColumnMenu,
        onEditClick: onEditClick
      }
    ],
    []
  )

  if (!pespectiveData.length) {
    return null
  }

  return (
    <TableV2<QlceView>
      onRowClick={row => {
        row.id &&
          row.viewState &&
          row.name &&
          navigateToPerspectiveDetailsPage(row.id, row.viewState, row.name, row.viewType || ViewType.Customer)
      }}
      columns={columns}
      data={pespectiveData}
    />
  )
}

export default PerspectiveListView
