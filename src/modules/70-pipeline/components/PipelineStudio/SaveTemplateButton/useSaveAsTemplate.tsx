/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useModalHook } from '@harness/use-modal'
import produce from 'immer'
import { omit } from 'lodash-es'
import { Dialog } from '@blueprintjs/core'
import { useParams } from 'react-router-dom'
import { DefaultTemplate } from 'framework/Templates/templates'
import type { NGTemplateInfoConfig } from 'services/template-ng'
import { ModalProps, TemplateConfigModal } from 'framework/Templates/TemplateConfigModal/TemplateConfigModal'
import type { ProjectPathProps, GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import { useSaveTemplate } from '@pipeline/utils/useSaveTemplate'
import type { JsonNode } from 'services/cd-ng'
import { AppStoreContext } from 'framework/AppStore/AppStoreContext'
import type { SaveTemplateButtonProps } from '@pipeline/components/PipelineStudio/SaveTemplateButton/SaveTemplateButton'
import { useStrings } from 'framework/strings'
import type { IGitContextFormProps } from '@common/components/GitContextForm/GitContextForm'
import css from './SaveAsTemplate.module.scss'

interface TemplateActionsReturnType {
  save: () => void
}

interface SaveAsTemplateProps extends Omit<SaveTemplateButtonProps, 'buttonProps'> {
  fireSuccessEvent?: boolean
}

export function useSaveAsTemplate({
  data,
  type,
  fireSuccessEvent = false
}: SaveAsTemplateProps): TemplateActionsReturnType {
  const { orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const [template, setTemplate] = React.useState<NGTemplateInfoConfig>()
  const [modalProps, setModalProps] = React.useState<ModalProps>()
  const { isGitSyncEnabled } = React.useContext(AppStoreContext)
  const { getString } = useStrings()
  const [showConfigModal, hideConfigModal] = useModalHook(
    () => (
      <Dialog enforceFocus={false} isOpen={true} className={css.configDialog}>
        {modalProps && template && (
          <TemplateConfigModal
            initialValues={template}
            onClose={hideConfigModal}
            modalProps={modalProps}
            gitDetails={{ repoIdentifier, branch } as IGitContextFormProps}
            isEdit={false}
          />
        )}
      </Dialog>
    ),
    [template, modalProps, repoIdentifier, branch]
  )
  const { saveAndPublish } = useSaveTemplate({
    gitDetails: { repoIdentifier, branch },
    isPipelineStudio: true,
    fireSuccessEvent
  })

  const onSaveAsTemplate = async () => {
    try {
      const finalData = typeof data === 'function' ? await data() : data
      setTemplate(
        produce(DefaultTemplate, draft => {
          draft.projectIdentifier = projectIdentifier
          draft.orgIdentifier = orgIdentifier
          draft.type = type
          draft.spec = omit(
            finalData,
            'name',
            'identifier',
            'description',
            'tags',
            'orgIdentifier',
            'projectIdentifier'
          ) as JsonNode
        })
      )
      setModalProps({
        title: getString('common.template.saveAsNewTemplateHeading'),
        promise: saveAndPublish,
        shouldGetComment: !isGitSyncEnabled
      })
      showConfigModal()
    } catch (_error) {
      //Do not do anything as there are error in the form
    }
  }

  return { save: onSaveAsTemplate }
}
