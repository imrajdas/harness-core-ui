/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

import { Layout, Button, ButtonVariation } from '@harness/uicore'

interface FooterRendererProps {
  onSubmit?: () => void
  onCancel: () => void
  confirmText: string
  cancelText: string
  type?: 'submit'
  loading?: boolean
}

export const FooterRenderer = (props: FooterRendererProps): React.ReactElement => {
  const { onSubmit, onCancel, confirmText, cancelText, type, loading = false } = props
  return (
    <Layout.Horizontal spacing="small" padding="none" margin="none">
      <Button
        type={type}
        disabled={loading}
        loading={loading}
        onClick={onSubmit}
        text={confirmText}
        variation={ButtonVariation.PRIMARY}
      ></Button>
      <Button onClick={onCancel} text={cancelText} variation={ButtonVariation.TERTIARY}></Button>
    </Layout.Horizontal>
  )
}
