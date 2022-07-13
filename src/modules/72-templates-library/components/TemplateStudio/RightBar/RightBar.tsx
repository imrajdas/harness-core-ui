/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import cx from 'classnames'
import { Button, ButtonVariation } from '@wings-software/uicore'
import React from 'react'
import { useStrings } from 'framework/strings'
import { RightDrawer } from '@templates-library/components/TemplateStudio/RightDrawer/RightDrawer'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import { DrawerTypes } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateActions'
import css from './RightBar.module.scss'

export const RightBar = (): JSX.Element => {
  const { getString } = useStrings()
  const {
    state: {
      templateView: {
        isDrawerOpened,
        drawerData: { type }
      },
      templateView,
      isUpdated
    },
    updateTemplateView
  } = React.useContext(TemplateContext)

  const openTemplatesInputDrawer = React.useCallback(() => {
    updateTemplateView({
      ...templateView,
      isDrawerOpened: true,
      drawerData: { type: DrawerTypes.TemplateInputs }
    })
  }, [templateView, updateTemplateView])

  const openVariablesDrawer = React.useCallback(() => {
    updateTemplateView({
      ...templateView,
      isDrawerOpened: true,
      drawerData: { type: DrawerTypes.TemplateVariables }
    })
  }, [templateView, updateTemplateView])

  return (
    <div className={css.rightBar}>
      <Button
        className={cx(css.iconButton, { [css.selected]: isDrawerOpened && type === DrawerTypes.TemplateInputs })}
        onClick={openTemplatesInputDrawer}
        variation={ButtonVariation.TERTIARY}
        font={{ weight: 'semi-bold', size: 'xsmall' }}
        icon="template-inputs"
        withoutCurrentColor={true}
        iconProps={{ size: 28 }}
        text={getString('pipeline.templateInputs')}
        data-testid="template-inputs"
        disabled={isUpdated}
      />
      <Button
        className={cx(css.iconButton, { [css.selected]: isDrawerOpened && type === DrawerTypes.TemplateVariables })}
        onClick={openVariablesDrawer}
        variation={ButtonVariation.TERTIARY}
        font={{ weight: 'semi-bold', size: 'xsmall' }}
        icon="pipeline-variables"
        withoutCurrentColor={true}
        iconProps={{ size: 28 }}
        text={getString('common.variables')}
        data-testid="input-variable"
      />
      <RightDrawer />
    </div>
  )
}
