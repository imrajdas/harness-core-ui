/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { FormikValues } from 'formik'
import { Layout } from '@wings-software/uicore'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { RbacThumbnailItem, RbacThumbnailSelect } from '@rbac/components/RbacThumbnailSelect/RbacThumbnailSelect'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import css from './ApprovalStageMinimalMode.module.scss'

/*
The component to select approval type card in stage
Used in both minimal view as well as detailed view
*/
export function ApprovalTypeCards({ isReadonly }: { formikProps: FormikValues; isReadonly?: boolean }): JSX.Element {
  const isCustomApprovalEnabled = useFeatureFlag(FeatureFlag.NG_CUSTOM_APPROVAL)
  const approvalTypeCardsData: RbacThumbnailItem[] = React.useMemo(
    () => [
      {
        label: 'Harness Approval',
        value: StepType.HarnessApproval,
        icon: 'nav-harness'
      },
      {
        label: 'Jira',
        value: StepType.JiraApproval,
        icon: 'service-jira',
        featureProps: {
          featureRequest: {
            featureName: FeatureIdentifier.INTEGRATED_APPROVALS_WITH_JIRA
          }
        }
      },
      {
        label: 'ServiceNow',
        value: 'SERVICENOW_APPROVAL',
        icon: 'service-servicenow',
        featureProps: {
          featureRequest: {
            featureName: FeatureIdentifier.INTEGRATED_APPROVALS_WITH_SERVICE_NOW
          }
        }
      },
      {
        label: 'Custom',
        value: 'CUSTOM_APPROVAL',
        icon: 'custom-approval',
        disabled: !isCustomApprovalEnabled
      }
    ],
    [isCustomApprovalEnabled]
  )
  return (
    <Layout.Vertical>
      <RbacThumbnailSelect
        name="approvalType"
        items={approvalTypeCardsData}
        className={css.approvalTypesThumbnail}
        isReadonly={isReadonly}
      />
    </Layout.Vertical>
  )
}
