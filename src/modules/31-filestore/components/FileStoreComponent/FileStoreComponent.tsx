/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { useModalHook } from '@harness/use-modal'
import { Container, Button, Layout, Text, Tabs, Tab, Icon, IconName, ButtonVariation } from '@harness/uicore'
import { useParams } from 'react-router-dom'
import { FontVariation, Color } from '@harness/design-system'
import { Dialog, Classes } from '@blueprintjs/core'
import cx from 'classnames'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { Scope } from '@common/interfaces/SecretsInterface'
import type { StringKeys } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { FILE_STORE_ROOT } from '@filestore/utils/constants'
import type { FileStoreNodeDTO } from '@filestore/components/FileStoreContext/FileStoreContext'
import FileStorePage from '@filestore/pages/filestore/FileStorePage'

import css from './FileStoreComponent.module.scss'

export interface UseFileStoreModalReturn {
  openFileStoreModal: () => void
  closeFileStoreModal: () => void
}

interface FileStoreNodeDTOWithScope extends FileStoreNodeDTO {
  scope?: string
}

interface UseFileStoreModalProps {
  applySelected: (file: any) => void
}

const useFileStoreModal = ({ applySelected }: UseFileStoreModalProps): UseFileStoreModalReturn => {
  const [activeTab, setActiveTab] = useState<string>(Scope.ACCOUNT)
  const { getString } = useStrings()

  const {
    selectedProject,
    selectedOrg,
    currentUserInfo: { accounts = [] }
  } = useAppStore()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

  const selectedAccount = accounts.find(account => account.uuid === accountId)
  const [selectedFile, setSelectedFile] = useState<FileStoreNodeDTOWithScope>({} as FileStoreNodeDTOWithScope)

  const handleSelectFile = (selectedNode: FileStoreNodeDTOWithScope): void => {
    setSelectedFile(selectedNode)
  }
  const handleActiveTab = (tabId: string): void => {
    setSelectedFile({} as FileStoreNodeDTOWithScope)
    setActiveTab(tabId)
  }

  const handleApplySelectedFile = (): void => {
    applySelected(selectedFile)
    setSelectedFile({} as FileStoreNodeDTOWithScope)
    hideModal()
  }

  const handleCancelSelectedFile = (): void => {
    applySelected({})
    setSelectedFile({} as FileStoreNodeDTOWithScope)
    hideModal()
  }

  const renderTabSubHeading = false
  const iconProps = {
    size: 14
  }

  const commonProps = {
    isModalView: true,
    onNodeChange: handleSelectFile
  }

  const renderTab = (
    show: boolean,
    id: string,
    scope: string,
    icon: IconName,
    title: StringKeys,
    tabDesc = ''
  ): React.ReactElement | null => {
    return show ? (
      <Tab
        className={css.tabClass}
        id={id}
        title={
          <Layout.Horizontal
            onClick={() => handleActiveTab(id)}
            flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
            padding={{ left: 'xsmall', right: 'xsmall' }}
          >
            <Icon name={icon} {...iconProps} className={css.tabIcon} />
            <Text lineClamp={1} font={{ variation: FontVariation.H6, weight: 'light' }}>
              {getString(title)}
            </Text>
            {renderTabSubHeading && tabDesc && (
              <Text
                lineClamp={1}
                font={{ variation: FontVariation.FORM_LABEL, weight: 'light' }}
                padding={{ left: 'xsmall' }}
                className={css.tabValue}
              >
                {`[${tabDesc}]`}
              </Text>
            )}
          </Layout.Horizontal>
        }
        panel={<FileStorePage scope={scope} {...commonProps} />}
      />
    ) : null
  }

  const TabsRender = React.useMemo(() => {
    return (
      <Container className={cx(css.container)}>
        <div className={css.tabsContainer}>
          <Tabs id="fileStoreTabs" selectedTabId={activeTab}>
            {renderTab(
              !!projectIdentifier,
              Scope.PROJECT,
              Scope.PROJECT,
              'projects-wizard',
              'projectLabel',
              selectedProject?.name
            )}
            {renderTab(!!orgIdentifier, Scope.ORG, Scope.ORG, 'diagram-tree', 'orgLabel', selectedOrg?.name)}
            {renderTab(true, Scope.ACCOUNT, Scope.ACCOUNT, 'layers', 'account', selectedAccount?.accountName)}
          </Tabs>
        </div>
      </Container>
    )
  }, [activeTab])

  const [showModal, hideModal] = useModalHook(() => {
    return (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        onClose={() => {
          hideModal()
        }}
        title={
          <Text lineClamp={1} color={Color.GREY_700} style={{ fontSize: 24, fontWeight: 600 }}>
            {getString('common.entityReferenceTitle', { compName: 'Config file' })}
          </Text>
        }
        className={cx(css.fileStoreField, css.dialog)}
      >
        {TabsRender}
        <Layout.Horizontal spacing="medium" padding={{ top: 'medium' }}>
          <Button
            variation={ButtonVariation.PRIMARY}
            text={getString('entityReference.apply')}
            onClick={handleApplySelectedFile}
            disabled={!!(selectedFile?.name && selectedFile.name === FILE_STORE_ROOT)}
            className={cx(Classes.POPOVER_DISMISS)}
          />
          {
            <Button
              variation={ButtonVariation.TERTIARY}
              text={getString('cancel')}
              onClick={handleCancelSelectedFile}
            />
          }
        </Layout.Horizontal>
      </Dialog>
    )
  }, [activeTab, selectedFile])

  return {
    openFileStoreModal: () => {
      showModal()
    },
    closeFileStoreModal: hideModal
  }
}

export default useFileStoreModal
