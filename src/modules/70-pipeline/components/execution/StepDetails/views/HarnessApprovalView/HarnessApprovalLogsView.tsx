/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { DefaultConsoleViewStepDetails, logsRenderer } from '@pipeline/components/LogsContent/LogsContent'
import type { ConsoleViewStepDetailProps, RenderLogsInterface } from '@pipeline/factories/ExecutionFactory/types'

export function HarnessApprovalLogsView(props: ConsoleViewStepDetailProps) {
  const renderLogs = (renderLogsProps: RenderLogsInterface) => {
    return (
      <div>
        Approve Button comes here
        {logsRenderer(renderLogsProps)}
      </div>
    )
  }
  return <DefaultConsoleViewStepDetails {...props} renderLogs={renderLogs} />
}
