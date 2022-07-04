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

import EnableCostVisibilityStep from './steps/EnableCostVisibilityStep'
import EnableAutoStoppingStep from './steps/EnableAutoStoppingStep'
import Overview from './steps/Overview'

import css from './CloudVisibilityModal.module.scss'

export const useCloudVisibilityModal = () => {
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

  const [openModal, closeModal] = useModalHook(() => (
    <Dialog {...modalProps} onClose={closeModal} className={cx(css.modal, Classes.DIALOG)}>
      <StepWizard
        icon="ccm-solid"
        iconProps={{ size: 50 }}
        title={getString('ce.cloudIntegration.enableCloudCosts')}
        className={css.stepWizard}
      >
        <EnableCostVisibilityStep
          name={getString('ce.cloudIntegration.costVisibilityDialog.step1.title')}
          closeModal={closeModal}
        />
        <EnableAutoStoppingStep name={getString('ce.cloudIntegration.costVisibilityDialog.step2.title')} />
        <StepWizard>
          <Overview />
        </StepWizard>
      </StepWizard>
      <Button minimal icon="cross" iconProps={{ size: 18 }} onClick={closeModal} className={css.crossIcon} />
    </Dialog>
  ))

  return [openModal, closeModal]
}
