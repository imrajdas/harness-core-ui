/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, ButtonSize, ButtonVariation, Container, Dialog, Icon, Layout, Text } from '@wings-software/uicore'
import { Intent } from '@blueprintjs/core'
import { Color, FontVariation } from '@wings-software/design-system'
import { useModalHook } from '@harness/use-modal'
import { isEmpty } from 'lodash-es'
import { useStrings } from 'framework/strings'
import type { ErrorNodeSummary, TemplateResponse } from 'services/template-ng'
import { ReconcileDialog } from '@pipeline/components/TemplateLibraryErrorHandling/ReconcileDialog/ReconcileDialog'
import css from './OutOfSyncErrorStrip.module.scss'

export interface OutOfSyncErrorStripProps {
  templateInputsErrorNodeSummary: ErrorNodeSummary
  entity: 'Pipeline' | 'Template'
  isReadOnly: boolean
  onRefreshEntity: () => void
}

export function OutOfSyncErrorStrip({
  templateInputsErrorNodeSummary,
  entity,
  isReadOnly,
  onRefreshEntity
}: OutOfSyncErrorStripProps) {
  const { getString } = useStrings()
  const [resolvedTemplateResponses, setResolvedTemplateResponses] = React.useState<TemplateResponse[]>([])
  const hasChildren = !isEmpty(templateInputsErrorNodeSummary.childrenErrorNodes)

  const [showReconcileDialog, hideReconcileDialog] = useModalHook(() => {
    const onClose = () => {
      hideReconcileDialog()
      if (!isEmpty(resolvedTemplateResponses)) {
        onRefreshEntity()
      }
    }

    return (
      <Dialog enforceFocus={false} isOpen={true} onClose={onClose} className={css.reconcileDialog}>
        <ReconcileDialog
          templateInputsErrorNodeSummary={templateInputsErrorNodeSummary}
          entity={entity}
          setResolvedTemplateResponses={setResolvedTemplateResponses}
          reload={onRefreshEntity}
        />
      </Dialog>
    )
  }, [resolvedTemplateResponses])

  return (
    <Container className={css.mainContainer}>
      <Layout.Horizontal spacing={'medium'} flex={{ justifyContent: 'flex-start', alignItems: 'center' }}>
        <Icon name="warning-sign" intent={Intent.DANGER} />
        <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.RED_600}>
          {getString(
            hasChildren
              ? 'pipeline.outOfSyncErrorStrip.unsyncedTemplateInfo'
              : 'pipeline.outOfSyncErrorStrip.updatedTemplateInfo',
            { entity: entity.toLowerCase() }
          )}
        </Text>
        <Button
          text={getString('pipeline.outOfSyncErrorStrip.reconcile')}
          variation={ButtonVariation.SECONDARY}
          disabled={isReadOnly}
          size={ButtonSize.SMALL}
          onClick={showReconcileDialog}
        />
      </Layout.Horizontal>
    </Container>
  )
}
