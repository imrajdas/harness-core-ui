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
import DialogExtention from '@connectors/common/ConnectorExtention/DialogExtention'
import { CONNECTOR_MODAL_MIN_WIDTH } from '@connectors/constants'

import CreateSecret from '@ce/components/AutoStoppingModal/steps/CreateSecret'
import InstallComponents from '@ce/components/AutoStoppingModal/steps/InstallComponents'
import TestComponents from '@ce/components/AutoStoppingModal/steps/TestComponents'

import EnableCostVisibilityStep from './steps/EnableCostVisibilityStep'
import EnableAutoStoppingStep from './steps/EnableAutoStoppingStep'

import css from './CloudVisibilityModal.module.scss'

export const useCloudVisibilityModal = ({ connector }: { connector: ConnectorInfoDTO }) => {
  const { getString } = useStrings()

  const modalProps: IDialogProps = {
    isOpen: true,
    enforceFocus: false,
    style: {
      width: 'auto',
      minWidth: CONNECTOR_MODAL_MIN_WIDTH,
      minHeight: 640,
      borderLeft: 0,
      paddingBottom: 0,
      position: 'relative',
      overflow: 'auto'
    }
  }

  const [openModal, closeModal] = useModalHook(
    () => (
      <Dialog {...modalProps} onClose={closeModal} className={cx(css.modal, Classes.DIALOG)}>
        <DialogExtention>
          <StepWizard
            icon="ccm-solid"
            iconProps={{ size: 50 }}
            title={getString('ce.cloudIntegration.enableCloudCosts')}
            className={css.stepWizard}
          >
            <EnableCostVisibilityStep
              connector={connector}
              name={getString('ce.cloudIntegration.costVisibilityDialog.step1.title')}
              closeModal={closeModal}
            />
            <EnableAutoStoppingStep name={getString('ce.cloudIntegration.costVisibilityDialog.step2.title')} />
            <StepWizard>
              <CreateSecret
                isCloudReportingModal={true}
                name={getString('ce.cloudIntegration.autoStoppingModal.createSecret.title')}
              />
              <InstallComponents
                isCloudReportingModal={true}
                name={getString('ce.cloudIntegration.autoStoppingModal.installComponents.title')}
              />
              <TestComponents
                closeModal={closeModal}
                isCloudReportingModal={true}
                name={getString('ce.cloudIntegration.autoStoppingModal.testComponents.title')}
              />
            </StepWizard>
          </StepWizard>
        </DialogExtention>
        <Button minimal icon="cross" iconProps={{ size: 18 }} onClick={closeModal} className={css.crossIcon} />
      </Dialog>
    ),
    [connector]
  )

  return [openModal, closeModal]
}
