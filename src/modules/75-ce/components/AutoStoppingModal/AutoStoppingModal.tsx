/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, StepWizard } from '@harness/uicore'
import { Dialog, Classes, IDialogProps } from '@blueprintjs/core'
import { useModalHook } from '@harness/use-modal'
import cx from 'classnames'

import { useStrings } from 'framework/strings'
import type { ConnectorInfoDTO } from 'services/cd-ng'

import CreateSecret from './steps/CreateSecret'
import InstallComponents from './steps/InstallComponents'
import TestComponents from './steps/TestComponents'

import css from './AutoStoppingModal.module.scss'

export const useAutoStoppingModal = ({ connector }: { connector: ConnectorInfoDTO }) => {
  const { getString } = useStrings()

  const modalProps: IDialogProps = {
    isOpen: true,
    enforceFocus: false,
    style: {
      width: 1175,
      minHeight: 640,
      borderLeft: 0,
      paddingBottom: 0,
      position: 'relative',
      overflow: 'hidden'
    }
  }

  const [openModal, closeModal] = useModalHook(
    () => (
      <Dialog {...modalProps} onClose={closeModal} className={cx(css.modal, Classes.DIALOG)}>
        <StepWizard
          icon="autostopping"
          iconProps={{ size: 70 }}
          title={getString('ce.cloudIntegration.enableAutoStopping')}
          className={css.stepWizard}
        >
          <CreateSecret name={getString('ce.cloudIntegration.autoStoppingModal.createSecret.title')} />
          <InstallComponents
            connector={connector}
            name={getString('ce.cloudIntegration.autoStoppingModal.installComponents.title')}
          />
          <TestComponents name={getString('ce.cloudIntegration.autoStoppingModal.testComponents.title')} />
        </StepWizard>
        <Button minimal icon="cross" iconProps={{ size: 18 }} onClick={closeModal} className={css.crossIcon} />
      </Dialog>
    ),
    []
  )

  return [openModal, closeModal]
}
