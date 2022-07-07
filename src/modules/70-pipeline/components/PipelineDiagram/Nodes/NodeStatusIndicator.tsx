/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Icon, Layout } from '@harness/uicore'
import { defaultTo } from 'lodash-es'
import React from 'react'
import { ExecutionStatusEnum } from '@pipeline/utils/statusHelpers'
import type { PipelineGraphState } from '../types'
import css from './NodeStatusIndicator.module.scss'

interface NodeStatusIndicatorProps {
  nodeState: PipelineGraphState[]
}
export function NodeStatusIndicator(props: NodeStatusIndicatorProps): JSX.Element {
  const { nodeState } = props
  let successfulStagesCount = 0
  let failedStagesCount = 0
  let runningStagesCount = 0

  nodeState.forEach((stateVal: PipelineGraphState & any) => {
    const nodeStatus = defaultTo(stateVal?.status, stateVal?.step?.status)

    if (nodeStatus === ExecutionStatusEnum.Success) {
      successfulStagesCount += 1
    } else if (nodeStatus === ExecutionStatusEnum.Failed) {
      failedStagesCount += 1
    } else if (nodeStatus === ExecutionStatusEnum.Running) {
      runningStagesCount += 1
    }
  })
  return (
    <Layout.Horizontal padding={0} className={css.stepCountWrapper}>
      <div className={css.stepCount} data-status="success">
        <Icon name={'success-tick'} size={14} />
        {successfulStagesCount}
      </div>
      {runningStagesCount > 0 && (
        <div className={css.stepCount} data-status="running">
          <Icon name={'loading'} size={14} />
          {runningStagesCount}
        </div>
      )}
      <div className={css.stepCount} data-status="failed">
        <Icon name={'execution-warning'} size={16} data-status="failed" />
        {failedStagesCount}
      </div>
    </Layout.Horizontal>
  )
}
