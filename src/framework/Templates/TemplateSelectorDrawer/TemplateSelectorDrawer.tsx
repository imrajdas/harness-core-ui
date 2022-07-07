/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback } from 'react'
import { Drawer, Position } from '@blueprintjs/core'
import { Button } from '@wings-software/uicore'
import { TemplateSelector } from '@templates-library/components/TemplateSelector/TemplateSelector'
import { useTemplateSelectorContext } from 'framework/Templates/TemplateSelectorContext/TemplateSelectorContext'
import css from './TemplateSelectorDrawer.module.scss'

export const TemplateSelectorDrawer: React.FC = (): JSX.Element => {
  const {
    state: { isDrawerOpened, selectorData }
  } = useTemplateSelectorContext()
  const { onCancel } = selectorData || {}

  const closeTemplateView = useCallback(() => {
    onCancel?.()
  }, [onCancel])

  if (!isDrawerOpened) {
    return <></>
  }

  return (
    <Drawer
      onClose={closeTemplateView}
      usePortal={true}
      autoFocus={true}
      canEscapeKeyClose={true}
      canOutsideClickClose={true}
      enforceFocus={false}
      hasBackdrop={true}
      size={'1287px'}
      isOpen={true}
      position={Position.RIGHT}
    >
      <Button
        minimal
        className={css.almostFullScreenCloseBtn}
        icon="cross"
        withoutBoxShadow
        onClick={closeTemplateView}
      />
      <TemplateSelector />
    </Drawer>
  )
}
