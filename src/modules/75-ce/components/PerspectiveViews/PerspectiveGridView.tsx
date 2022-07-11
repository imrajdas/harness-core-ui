/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import {
  Icon,
  Text,
  Layout,
  Container,
  Card,
  FlexExpander,
  CardBody,
  useConfirmationDialog
} from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { Menu, Classes, Intent } from '@blueprintjs/core'
import { defaultTo } from 'lodash-es'
import routes from '@common/RouteDefinitions'
import { QlceView, ViewType, ViewState } from 'services/ce/services'
import { perspectiveDateLabelToDisplayText, SOURCE_ICON_MAPPING } from '@ce/utils/perspectiveUtils'
import formatCost from '@ce/utils/formatCost'
import { useStrings } from 'framework/strings'
import useMoveFolderModal from '../PerspectiveFolders/MoveFolderModal'
import css from './PerspectiveGridView.module.scss'

interface PerspectiveGridCardProps {
  data: QlceView
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

const PerpsectiveGridCard: (props: PerspectiveGridCardProps) => JSX.Element | null = ({
  data,
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
  const { openMoveFoldersModal } = useMoveFolderModal({
    perspectiveId: data.id || '',
    setRefetchFolders,
    setSelectedFolder,
    setRefetchPerspectives
  })

  const { openDialog: openDeleteDialog } = useConfirmationDialog({
    contentText: (
      <Text>
        {getString('ce.perspectives.confirmDeletePerspectiveMsg', {
          name: data.name
        })}
      </Text>
    ),
    titleText: getString('ce.perspectives.confirmDeletePerspectiveTitle'),
    confirmButtonText: getString('delete'),
    cancelButtonText: getString('cancel'),
    intent: Intent.DANGER,
    buttonIntent: Intent.DANGER,
    onCloseDialog: async (isConfirmed: boolean) => {
      if (isConfirmed) {
        data.id && deletePerpsective(data.id, defaultTo(data.name, ''))
      }
    }
  })

  const dateLabelToDisplayText = perspectiveDateLabelToDisplayText(getString)

  const onEditClick: (perspectiveId: string) => void = perspectiveId => {
    history.push(
      routes.toCECreatePerspective({
        accountId: accountId,
        perspectiveId: perspectiveId
      })
    )
  }

  const editClick: () => void = () => {
    data?.id && onEditClick(data.id)
  }

  const onDeleteClick: () => void = () => {
    openDeleteDialog()
  }

  const onCloneClick: () => void = () => {
    if (data?.id && data?.name) {
      clonePerspective(data.id, data.name)
    }
  }

  const viewType = data?.viewType
  const isDefaultPerspective = viewType === ViewType.Default

  return data ? (
    <Card
      key={data?.id}
      interactive
      className={css.cardClass}
      onClick={() => {
        data.id &&
          data.viewState &&
          navigateToPerspectiveDetailsPage(
            data?.id,
            data.viewState,
            defaultTo(data?.name, data.id),
            defaultTo(data.viewType, ViewType.Customer)
          )
      }}
    >
      <CardBody.Menu
        menuPopoverProps={{
          className: Classes.DARK
        }}
        menuContent={
          <Container
            onClick={e => {
              e.stopPropagation()
            }}
          >
            <Menu>
              <Menu.Item disabled={isDefaultPerspective} onClick={editClick} icon="edit" text="Edit" />
              <Menu.Item
                onClick={onCloneClick}
                icon="duplicate"
                text="Clone"
                data-testid={`clone-perspective-${data?.id}`}
              />
              <Menu.Item
                disabled={isDefaultPerspective}
                className={Classes.POPOVER_DISMISS}
                onClick={onDeleteClick}
                icon="trash"
                text="Delete"
              />
              <Menu.Item
                disabled={isDefaultPerspective}
                className={Classes.POPOVER_DISMISS}
                onClick={openMoveFoldersModal}
                icon="add-to-folder"
                text={getString('ce.perspectives.folders.moveToLabel')}
              />
            </Menu>
          </Container>
        }
      />

      {data.viewState === ViewState.Draft && (
        <div className={css.ribbonTopLeft}>
          <span>Draft</span>
        </div>
      )}
      <Layout.Vertical spacing="small" className={css.cardContent}>
        {isDefaultPerspective && <Container className={css.sampleRibbon}></Container>}

        <Container height={23}>{isDefaultPerspective && <Icon name="harness" size={22} />}</Container>
        {data?.folderName && (
          <Text
            font={{ variation: FontVariation.TINY_SEMI }}
            color={Color.GREY_400}
            lineClamp={1}
            className={css.folderName}
            icon={'main-folder'}
            iconProps={{ color: Color.GREY_400, size: 10 }}
          >
            {data?.folderName}
          </Text>
        )}
        <Text font={{ weight: 'semi-bold' }} color="grey800" lineClamp={2}>
          {data?.name}
        </Text>
        {data && !isNaN(data?.totalCost) ? <Text color="grey800">{formatCost(data?.totalCost)}</Text> : null}
        {data?.timeRange ? (
          <Text font="small" color="grey400">
            {dateLabelToDisplayText[data.timeRange] || getString('common.repo_provider.customLabel')}
          </Text>
        ) : null}
        <FlexExpander />
        {data?.dataSources && data.dataSources.length ? (
          <Container padding={{ top: 'large' }}>
            <Text
              font="xsmall"
              color="grey400"
              margin={{
                bottom: 'small'
              }}
            >
              Data Sources
            </Text>

            <Layout.Horizontal
              spacing="small"
              style={{
                alignItems: 'center'
              }}
            >
              {data.dataSources.map(source =>
                source ? <Icon key={source} size={22} name={SOURCE_ICON_MAPPING[source]} /> : null
              )}
            </Layout.Horizontal>
          </Container>
        ) : null}
      </Layout.Vertical>
    </Card>
  ) : null
}

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
  return (
    <Container className={css.mainGridContainer}>
      {pespectiveData.map(data => {
        return (
          <PerpsectiveGridCard
            navigateToPerspectiveDetailsPage={navigateToPerspectiveDetailsPage}
            clonePerspective={clonePerspective}
            deletePerpsective={deletePerpsective}
            key={data.id}
            data={data}
            setRefetchFolders={setRefetchFolders}
            setSelectedFolder={setSelectedFolder}
            setRefetchPerspectives={setRefetchPerspectives}
          />
        )
      })}
    </Container>
  )
}

export default PerspectiveListView
