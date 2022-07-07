/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactElement } from 'react'
import { ButtonVariation, Container, Layout, Button } from '@wings-software/uicore'
import { Dialog } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import SaveFlagToGitSubForm from '../SaveFlagToGitSubForm/SaveFlagToGitSubForm'

interface SaveFlagToGitSubFormModalProps {
  title: string
  onSubmit?: () => void
  onClose: () => void
  hideNameField?: boolean
}

const SaveFlagToGitSubFormModal = ({
  title,
  onSubmit,
  onClose,
  hideNameField
}: SaveFlagToGitSubFormModalProps): ReactElement => {
  const { getString } = useStrings()

  return (
    <Dialog enforceFocus={false} isOpen={true} onClose={onClose} title="">
      <Container
        id="save-flag-to-git-modal-body"
        data-testid="save-flag-to-git-modal-body"
        padding={{ bottom: 'xlarge', left: 'xlarge', right: 'xlarge' }}
      >
        <SaveFlagToGitSubForm title={title} hideNameField={hideNameField} />
        <Layout.Horizontal spacing="small" style={{ alignItems: 'center' }} padding={{ top: 'xxlarge' }}>
          <Button
            text={getString('save')}
            variation={ButtonVariation.PRIMARY}
            onClick={onSubmit}
            data-testid="save-flag-to-git-modal-save-button"
          />
          <Button
            text={getString('cancel')}
            variation={ButtonVariation.SECONDARY}
            data-testid="save-flag-to-git-modal-cancel-button"
            onClick={event => {
              event.preventDefault()
              onClose()
            }}
          />
        </Layout.Horizontal>
      </Container>
    </Dialog>
  )
}

export default SaveFlagToGitSubFormModal
