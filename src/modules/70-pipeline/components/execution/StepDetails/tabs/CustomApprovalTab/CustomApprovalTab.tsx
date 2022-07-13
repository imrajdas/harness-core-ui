/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { ApprovalInstanceResponse } from 'services/pipeline-ng'
import { Duration } from '@common/exports'
import { ApprovalStatus } from '@pipeline/utils/approvalUtils'
import { String } from 'framework/strings'
import ExecutionStatusLabel from '@pipeline/components/ExecutionStatusLabel/ExecutionStatusLabel'
import { CustomApprovalCriteria } from './CustomApprovalCriteria/CustomApprovalCriteria'
import headerCss from '@pipeline/pages/execution/ExecutionPipelineView/ExecutionGraphView/ExecutionStageDetailsHeader/ExecutionStageDetailsHeader.module.scss'
import css from './CustomApprovalTab.module.scss'

export interface CustomApprovalTabProps {
  approvalData: ApprovalInstanceResponse
  isWaiting: boolean
}

export function CustomApprovalTab(props: CustomApprovalTabProps): React.ReactElement {
  const { approvalData, isWaiting } = props
  const wasApproved = !isWaiting && approvalData?.status === ApprovalStatus.APPROVED
  const wasRejected =
    !isWaiting && (approvalData?.status === ApprovalStatus.REJECTED || approvalData?.status === ApprovalStatus.EXPIRED)
  const wasFailed = !isWaiting && approvalData?.status === ApprovalStatus.FAILED
  const wasAborted = !isWaiting && approvalData?.status === ApprovalStatus.ABORTED

  return (
    <>
      {wasFailed ? (
        <div className={headerCss.errorMsgWrapper}>
          <ExecutionStatusLabel status={'Failed'} />
          <div className={headerCss.errorMsg}>
            <String className={headerCss.errorTitle} stringID="errorSummaryText" tagName="div" />
            <p>{approvalData?.errorMessage}</p>
          </div>
        </div>
      ) : (
        <div className={css.info} data-type="customApproval">
          {isWaiting ? (
            <>
              <div className={css.timer}>
                <Duration
                  className={css.duration}
                  durationText=""
                  icon="hourglass"
                  startTime={approvalData?.deadline}
                  iconProps={{ size: 8 }}
                />
                <String stringID="pipeline.timeRemainingSuffix" />
              </div>
              <div className={css.customApprovalTicket}>
                <String stringID="pipeline.customApprovalStep.execution.customApprovalTicket" />
              </div>
            </>
          ) : null}
          {wasApproved ? (
            <div className={css.customApprovalTicket}>
              <String stringID="pipeline.customApprovalStep.execution.wasApproved" />
            </div>
          ) : null}

          {wasRejected ? (
            <div className={css.customApprovalTicket}>
              {approvalData?.status === ApprovalStatus.REJECTED ? (
                <String stringID="pipeline.customApprovalStep.execution.wasRejected" />
              ) : null}
              {approvalData?.status === ApprovalStatus.EXPIRED ? (
                <String stringID="pipeline.customApprovalStep.execution.wasExpired" />
              ) : null}
            </div>
          ) : null}

          {wasAborted ? (
            <div className={css.customApprovalTicket}>
              <String stringID="pipeline.customApprovalStep.execution.wasAborted" />
            </div>
          ) : null}
        </div>
      )}

      <div className={css.customApproval}>
        {approvalData?.details?.approvalCriteria ? (
          <CustomApprovalCriteria type="approval" criteria={approvalData.details.approvalCriteria} />
        ) : null}
        {approvalData?.details?.rejectionCriteria ? (
          <CustomApprovalCriteria type="rejection" criteria={approvalData.details.rejectionCriteria} />
        ) : null}
      </div>
    </>
  )
}
