/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import {
  Button,
  ButtonVariation,
  Container,
  ExpandingSearchInput,
  Icon,
  IconName,
  Layout,
  Text,
  TextInput,
  useConfirmationDialog
} from '@harness/uicore'
import { Color, FontVariation, Intent } from '@harness/design-system'
import cx from 'classnames'
import { useStrings } from 'framework/strings'
import type { CEViewFolder } from 'services/ce'
import { folderViewType } from '@ce/constants'
import { searchList } from '@ce/utils/perspectiveUtils'
import useCreateFolderModal from './CreateFolderModal'
import css from './PerspectiveFoldersSideNav.module.scss'

interface SideNavProps {
  setSelectedFolder: (newState: string) => void
  selectedFolderId: string
  foldersList: CEViewFolder[]
  setRefetchFolders: React.Dispatch<React.SetStateAction<boolean>>
  foldersLoading: boolean
  defaultFolderId: string
  deleteFolder: (id: string) => void
  updateFolder: (id: string, name: string, isPinned: boolean) => void
}

interface SidebarLinkProps {
  folderData: CEViewFolder
  icon?: IconName
  className?: string
  textClassName?: string
  showIcons?: boolean
  selectedFolderId: string
  setSelectedFolder: (newState: string) => void
  onDelete: (id: string) => void
  updateFolder: (id: string, name: string, isPinned: boolean) => void
}

const renderLoader = (): JSX.Element => {
  return (
    <Container className={css.loader} data-testid="loader">
      <Icon name="spinner" color={Color.BLUE_500} size={30} />
    </Container>
  )
}

export const SideNavItem: React.FC<SidebarLinkProps> = ({
  folderData,
  selectedFolderId,
  setSelectedFolder,
  icon,
  textClassName,
  onDelete,
  updateFolder,
  showIcons = true
}) => {
  const { uuid: folderId = '', name = '', pinned = false } = folderData
  const [isEdit, setEditEnable] = useState(false)
  const isActiveFolder = selectedFolderId === folderId

  const onPinClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void = e => {
    e.stopPropagation()
    updateFolder(folderId, name, !pinned)
  }

  const onEditClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void = e => {
    e.stopPropagation()
    setEditEnable(true)
  }

  /* istanbul ignore next */
  const editFlow = (folderName: string) => {
    if (folderName && folderName !== name) {
      updateFolder(folderId, folderName, pinned)
    }
    setEditEnable(false)
  }

  return (
    <li className={cx(css.link, { [css.active]: isActiveFolder })} onClick={() => setSelectedFolder(folderId)}>
      <Layout.Horizontal flex={{ justifyContent: 'space-between' }}>
        {isEdit ? (
          <TextInput
            defaultValue={name}
            wrapperClassName={css.folderNameField}
            onBlur={e => {
              editFlow(e.target.value)
            }}
            autoFocus
            data-testid={'folderNameField'}
          />
        ) : (
          <Text
            icon={icon}
            font={{ variation: FontVariation.BODY }}
            className={cx(textClassName, { [css.activeFolder]: isActiveFolder })}
            lineClamp={1}
            style={{ maxWidth: 200 }}
            iconProps={{
              padding: { right: 'small' },
              color: isActiveFolder ? Color.PRIMARY_7 : Color.GREY_600
            }}
          >
            {name}
          </Text>
        )}
        {showIcons && isActiveFolder && (
          <Layout.Horizontal spacing="small" flex={{ alignItems: 'center' }}>
            <Icon
              name="Edit"
              size={14}
              color={Color.PRIMARY_6}
              onClick={onEditClick}
              className={css.icon}
              data-testid={'editFolder'}
            />
            <Icon
              name="main-trash"
              size={16}
              color={Color.PRIMARY_6}
              onClick={() => onDelete(folderId)}
              className={css.icon}
              data-testid={'deleteFolder'}
            />
            <Icon
              name={pinned ? /* istanbul ignore next */ 'main-unpin' : 'main-pin'}
              size={16}
              color={Color.PRIMARY_6}
              onClick={onPinClick}
              className={css.icon}
              data-testid={'pinFolder'}
            />
          </Layout.Horizontal>
        )}
      </Layout.Horizontal>
    </li>
  )
}

const getCustomFolder = (foldersList: CEViewFolder[]) => {
  return foldersList.filter(
    item => item.viewType === folderViewType.CUSTOMER || item.viewType === folderViewType.DEFAULT
  )
}

const PerspectiveFoldersSideNav: React.FC<SideNavProps> = props => {
  const { getString } = useStrings()
  const { openCreateFoldersModal } = useCreateFolderModal({
    defaultFolderId: props.defaultFolderId,
    setRefetchFolders: props.setRefetchFolders,
    setSelectedFolder: props.setSelectedFolder
  })
  const [deleteFolderId, setDeleteFolderId] = useState('')
  let defaultFolders: CEViewFolder[] = props.foldersList.filter(item => item.viewType === folderViewType.SAMPLE)
  const customFolders: CEViewFolder[] = getCustomFolder(props.foldersList)
  const [customFoldersList, setCustomFoldersList] = useState(customFolders)

  defaultFolders = [
    ...defaultFolders,
    {
      name: getString('ce.perspectives.folders.allPerspective'),
      uuid: ''
    }
  ]

  useEffect(() => {
    const updateFolders: CEViewFolder[] = getCustomFolder(props.foldersList)
    setCustomFoldersList(updateFolders)
  }, [props.foldersList])

  const onDelete = (folderId: string) => {
    setDeleteFolderId(folderId)
    openDeleteDialog()
  }

  const onFoldersSearch = (searchText: string) => {
    const filteredList = searchList(searchText, customFolders)
    setCustomFoldersList(filteredList)
  }

  const { openDialog: openDeleteDialog } = useConfirmationDialog({
    contentText: <Text>{getString('ce.perspectives.folders.deletedConfirmationDesc')}</Text>,
    titleText: getString('ce.perspectives.folders.deletedConfirmationTitle'),
    confirmButtonText: getString('delete'),
    cancelButtonText: getString('cancel'),
    intent: Intent.DANGER,
    buttonIntent: Intent.DANGER,
    onCloseDialog: async (isConfirmed: boolean) => {
      if (isConfirmed) {
        props.deleteFolder(deleteFolderId)
      }
    }
  })

  return (
    <Layout.Vertical spacing={'small'} className={css.sidenavWrapper}>
      {props.foldersLoading ? (
        renderLoader()
      ) : (
        <>
          <ul className={css.foldersList} style={{ paddingTop: 'var(--spacing-medium)' }}>
            {defaultFolders.map(item => {
              return (
                <SideNavItem
                  key={item.uuid}
                  folderData={item}
                  icon={item.viewType === folderViewType.SAMPLE ? 'harness-with-color' : 'dashboard'}
                  className={css.sidenav}
                  textClassName={css.sidenavText}
                  showIcons={false}
                  selectedFolderId={props.selectedFolderId}
                  setSelectedFolder={props.setSelectedFolder}
                  onDelete={onDelete}
                  updateFolder={props.updateFolder}
                />
              )
            })}
          </ul>
          <Container className={css.customFoldersNav}>
            <Text
              color={Color.GREY_700}
              font={{ variation: FontVariation.BODY }}
              border={{ bottom: true }}
              padding={{ bottom: 'xsmall' }}
            >
              {getString('ce.perspectives.folders.customFolders')}
            </Text>
            <ExpandingSearchInput
              onChange={text => onFoldersSearch(text.trim())}
              placeholder={getString('search')}
              flip
              className={css.searchInput}
            />
            <Button
              icon="plus"
              onClick={openCreateFoldersModal}
              text={getString('ce.perspectives.folders.newFolder')}
              variation={ButtonVariation.LINK}
              style={{ justifyContent: 'flex-start', paddingLeft: 0, paddingTop: 'var(--spacing-small)' }}
            />
          </Container>
          <ul className={css.foldersList}>
            {customFoldersList.map(item => {
              return (
                <SideNavItem
                  key={item.uuid}
                  folderData={item}
                  icon={
                    props.selectedFolderId === item.uuid ? /* istanbul ignore next */ 'main-folder-open' : 'main-folder'
                  }
                  showIcons={item.viewType === folderViewType.DEFAULT ? false : true}
                  className={css.sidenav}
                  textClassName={css.sidenavText}
                  selectedFolderId={props.selectedFolderId}
                  setSelectedFolder={props.setSelectedFolder}
                  onDelete={onDelete}
                  updateFolder={props.updateFolder}
                />
              )
            })}
          </ul>
        </>
      )}
    </Layout.Vertical>
  )
}

export default PerspectiveFoldersSideNav
