/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useGetCommunity } from '@common/utils/utils'
import css from './LaunchButton.module.scss'

export interface LaunchButtonProps {
  launchButtonText: string
  redirectUrl: string
}
export const LaunchButton: React.FC<LaunchButtonProps> = props => {
  const launchUrlRedirect = (): void => {
    window.location.href = props.redirectUrl
  }

  if (useGetCommunity()) {
    return null
  }

  return (
    <button type="button" className={css.launchButtonPosition} onClick={launchUrlRedirect}>
      {props.launchButtonText}
    </button>
  )
}
