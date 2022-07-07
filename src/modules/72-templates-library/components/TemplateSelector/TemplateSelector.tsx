/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Button, ButtonVariation, Container, Layout, useConfirmationDialog } from '@wings-software/uicore'
import { Intent } from '@blueprintjs/core'
import { Color } from '@harness/design-system'
import type { TemplateSummaryResponse } from 'services/template-ng'
import { String, useStrings } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import NoResultsView from '@templates-library/pages/TemplatesPage/views/NoResultsView/NoResultsView'
import { TemplateSelectorLeftView } from '@templates-library/components/TemplateSelector/TemplateSelectorLeftView/TemplateSelectorLeftView'
import { areTemplatesEqual, getTemplateNameWithLabel } from '@pipeline/utils/templateUtils'
import { useTemplateSelectorContext } from 'framework/Templates/TemplateSelectorContext/TemplateSelectorContext'
import { TemplateDetails } from '../TemplateDetails/TemplateDetails'
import css from './TemplateSelector.module.scss'

export const TemplateSelector: React.FC = (): JSX.Element => {
  const {
    state: { selectorData }
  } = useTemplateSelectorContext()
  const { onSubmit, selectedTemplate: defaultTemplate } = selectorData || {}
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSummaryResponse | undefined>()
  const { getString } = useStrings()
  const { isGitSyncEnabled } = useAppStore()

  const getTemplateDetails: React.ReactElement = React.useMemo(() => {
    if (selectedTemplate) {
      return (
        <TemplateDetails template={selectedTemplate} setTemplate={setSelectedTemplate} allowStableSelection={true} />
      )
    } else {
      return <></>
    }
  }, [selectedTemplate, setSelectedTemplate])

  const onUseTemplateConfirm = React.useCallback(
    (isCopied = false) => {
      if (selectedTemplate) {
        onSubmit?.(selectedTemplate, isCopied)
      }
    },
    [selectedTemplate, onSubmit]
  )

  const { openDialog: openChangeTemplateDialog } = useConfirmationDialog({
    intent: Intent.WARNING,
    cancelButtonText: getString('cancel'),
    contentText: (
      <String
        stringID="templatesLibrary.changeTemplate"
        vars={{
          name: getTemplateNameWithLabel(selectedTemplate),
          entity: selectedTemplate?.templateEntityType?.toLowerCase()
        }}
        useRichText={true}
      />
    ),
    titleText: `${getString('pipeline.changeTemplateLabel')}?`,
    confirmButtonText: getString('confirm'),
    onCloseDialog: async isConfirmed => {
      if (isConfirmed) {
        onUseTemplateConfirm()
      }
    }
  })

  const { openDialog: openCopyTemplateDialog } = useConfirmationDialog({
    intent: Intent.WARNING,
    cancelButtonText: getString('cancel'),
    contentText: (
      <String
        stringID="templatesLibrary.copyTemplate"
        vars={{
          name: getTemplateNameWithLabel(selectedTemplate),
          entity: selectedTemplate?.templateEntityType?.toLowerCase()
        }}
        useRichText={true}
      />
    ),
    titleText: `${getString('templatesLibrary.copyTemplateLabel')}?`,
    confirmButtonText: getString('confirm'),
    onCloseDialog: async isConfirmed => {
      if (isConfirmed) {
        onUseTemplateConfirm(true)
      }
    }
  })

  const onUseTemplateClick = React.useCallback(async () => {
    if (defaultTemplate) {
      openChangeTemplateDialog()
    } else {
      onUseTemplateConfirm()
    }
  }, [defaultTemplate, openChangeTemplateDialog, onUseTemplateConfirm])

  const onCopyTemplateClick = React.useCallback(async () => {
    if (defaultTemplate) {
      openCopyTemplateDialog()
    } else {
      onUseTemplateConfirm(true)
    }
  }, [defaultTemplate, openCopyTemplateDialog, onUseTemplateConfirm])

  return (
    <Container height={'100%'} className={css.container}>
      <Layout.Horizontal height={'100%'}>
        <TemplateSelectorLeftView setTemplate={setSelectedTemplate} />
        <Container width={525}>
          {selectedTemplate ? (
            <Layout.Vertical height={'100%'}>
              <Container className={css.detailsContainer}>
                {isGitSyncEnabled ? (
                  <GitSyncStoreProvider>{getTemplateDetails}</GitSyncStoreProvider>
                ) : (
                  getTemplateDetails
                )}
              </Container>
              <Container>
                <Layout.Horizontal
                  padding={'xxlarge'}
                  background={Color.FORM_BG}
                  className={css.btnContainer}
                  spacing={'small'}
                >
                  <Button
                    variation={ButtonVariation.PRIMARY}
                    text={getString('templatesLibrary.useTemplateLabel')}
                    disabled={areTemplatesEqual(defaultTemplate, selectedTemplate)}
                    onClick={onUseTemplateClick}
                  />
                  <Button
                    variation={ButtonVariation.LINK}
                    text={getString('templatesLibrary.copyTemplateLabel')}
                    onClick={onCopyTemplateClick}
                  />
                </Layout.Horizontal>
              </Container>
            </Layout.Vertical>
          ) : (
            <Container padding={{ top: 'xxlarge', right: 'xlarge', bottom: 'xxlarge', left: 'xlarge' }} height={'100%'}>
              <Layout.Vertical
                className={css.empty}
                spacing={'large'}
                height={'100%'}
                flex={{ align: 'center-center' }}
              >
                <NoResultsView text={getString('templatesLibrary.selectTemplateToPreview')} minimal={true} />
              </Layout.Vertical>
            </Container>
          )}
        </Container>
      </Layout.Horizontal>
    </Container>
  )
}
