/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { ApprovalInstanceResponse } from 'services/pipeline-ng'

export type ApprovalStatusType = ApprovalInstanceResponse['status']

export const ApprovalStatus: Record<ApprovalStatusType, ApprovalStatusType> = {
  WAITING: 'WAITING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  FAILED: 'FAILED',
  ABORTED: 'ABORTED',
  EXPIRED: 'EXPIRED'
}

export function isApprovalWaiting(status: ApprovalStatusType): boolean {
  return status === ApprovalStatus.WAITING
}

export function isApprovalApproved(status: ApprovalStatusType): boolean {
  return status === ApprovalStatus.APPROVED
}

export function isApprovalRejected(status: ApprovalStatusType): boolean {
  return status === ApprovalStatus.REJECTED
}

export function isApprovalFailed(status: ApprovalStatusType): boolean {
  return status === ApprovalStatus.FAILED
}

export function isApprovalExpired(status: ApprovalStatusType): boolean {
  return status === ApprovalStatus.EXPIRED
}
