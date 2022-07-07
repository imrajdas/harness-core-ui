/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { CVNGNotificationChannel, NotificationRuleCondition, NotificationRuleDTORequestBody } from 'services/cv'
import { defaultOption } from '../../NotificationsContainer.constants'
import type { NotificationConditionRow, SRMNotification } from '../../NotificationsContainer.types'
import type { ChangeType } from '../ConfigureMonitoredServiceAlertConditions/ConfigureMonitoredServiceAlertConditions.constants'

export const createNotificationsPayload = (
  orgIdentifier: string,
  projectIdentifier: string,
  wizardData: SRMNotification
): NotificationRuleDTORequestBody => {
  const { conditions, name, notificationMethod, type, identifier } = wizardData || {}
  const updatedConditions = getNotificationConditions(conditions)

  return {
    conditions: updatedConditions,
    identifier: identifier as string,
    name: name as string,
    notificationMethod: notificationMethod as CVNGNotificationChannel,
    orgIdentifier,
    projectIdentifier,
    type
  }
}

export function getNotificationConditions(conditions?: NotificationConditionRow[]): NotificationRuleCondition[] {
  const validConditions = conditions?.filter(el => el?.condition !== null)
  return (
    validConditions?.map(el => {
      return {
        type: el?.condition?.value,
        spec: {
          ...(el.lookBackDuration &&
            el.lookBackDuration !== defaultOption && { lookBackDuration: `${el?.lookBackDuration}m` }),
          ...(el.threshold && el.threshold !== defaultOption && { threshold: el.threshold }),
          ...(el.duration && el.duration !== defaultOption && { period: `${el.duration}m` }),
          ...(el.changeType &&
            el.changeType !== defaultOption && {
              changeEventTypes: el.changeType.map((element: { value: ChangeType }) => element.value)
            })
        }
      }
    }) || []
  )
}
