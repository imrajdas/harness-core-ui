/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { Tag } from '@wings-software/uicore'
import type { ScopedObjectDTO } from '@common/components/EntityReference/EntityReference'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import css from './ScopeBadge.module.scss'

interface ScopeBadgeProps {
  data: ScopedObjectDTO
  minimal?: boolean
}

export const ScopeBadge = ({ data, minimal = false }: ScopeBadgeProps): JSX.Element => {
  const scope = getScopeFromDTO(data)
  const scopeLabel = scope.toUpperCase()

  return <Tag className={cx(css.scopeLabel, scope)}>{minimal ? scopeLabel : `SCOPE: ${scopeLabel}`}</Tag>
}
