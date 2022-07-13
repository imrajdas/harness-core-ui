/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { SyntheticEvent } from 'react'
import { Drawer, Position } from '@blueprintjs/core'
import { Button } from '@wings-software/uicore'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import { DrawerSizes, DrawerTypes } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateActions'
import TemplateVariablesWrapper from '@templates-library/components/TemplateStudio/TemplateVariables/TemplateVariables'
import { TemplateInputsWrapper } from '@templates-library/components/TemplateStudio/TemplateInputsWrapper/TemplateInputsWrapper'
import css from './RightDrawer.module.scss'

export const RightDrawer: React.FC = (): JSX.Element => {
  const {
    state: {
      templateView: {
        drawerData: { type },
        isDrawerOpened
      },
      templateView
    },
    updateTemplateView
  } = React.useContext(TemplateContext)

  const closeDrawer = React.useCallback(
    (e?: SyntheticEvent<HTMLElement, Event> | undefined): void => {
      e?.persist()
      updateTemplateView({ ...templateView, isDrawerOpened: false })
    },
    [updateTemplateView]
  )

  const onCloseDrawer = React.useCallback(() => {
    closeDrawer()
  }, [closeDrawer])

  return (
    <Drawer
      onClose={closeDrawer}
      usePortal={true}
      autoFocus={true}
      canEscapeKeyClose={true}
      canOutsideClickClose={true}
      enforceFocus={false}
      hasBackdrop={true}
      size={DrawerSizes[type]}
      isOpen={isDrawerOpened}
      position={Position.RIGHT}
      data-type={type}
      className={css.studioDrawer}
    >
      <Button minimal className={css.closeButton} icon="cross" withoutBoxShadow onClick={onCloseDrawer} />
      {type === DrawerTypes.TemplateVariables && <TemplateVariablesWrapper />}
      {type === DrawerTypes.TemplateInputs && <TemplateInputsWrapper />}
    </Drawer>
  )
}
