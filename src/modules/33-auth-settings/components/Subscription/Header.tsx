/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { MultiStepProgressIndicator } from '@harness/uicore'

type StepStatus = 'TODO' | 'INPROGRESS' | 'FAILED' | 'SUCCESS'

function getProgressMap(step: number): Map<number, { StepStatus: StepStatus }> {
  const progressMap = new Map<number, { StepStatus: StepStatus }>([
    [1, { StepStatus: 'TODO' }],
    [2, { StepStatus: 'TODO' }],
    [3, { StepStatus: 'TODO' }]
  ])

  while (step > 0) {
    progressMap.set(step, { StepStatus: 'SUCCESS' })
    step--
  }

  return progressMap
}

export const Header: React.FC<{ step: number }> = ({ step }) => {
  return <MultiStepProgressIndicator progressMap={getProgressMap(step)} />
}
