/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { SetStateAction, Dispatch } from 'react'
import cx from 'classnames'
import { FormInput, SelectOption, Text, Container } from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { isEmpty, isUndefined, sortBy } from 'lodash-es'
import type { StringKeys, UseStringsReturn } from 'framework/strings'
import { GitSourceProviders } from './TriggersListUtils'
import { ConnectorSection } from '../views/ConnectorSection'
import { eventTypes } from './TriggersWizardPageUtils'
import css from '../views/WebhookTriggerConfigPanel.module.scss'

export const autoAbortPreviousExecutionsTypes = [
  eventTypes.PUSH,
  eventTypes.PULL_REQUEST,
  eventTypes.ISSUE_COMMENT,
  eventTypes.MERGE_REQUEST,
  eventTypes.MR_COMMENT,
  eventTypes.PR_COMMENT
]

export const getAutoAbortDescription = ({
  event,
  getString
}: {
  event: string
  getString: (key: StringKeys) => string
}): string => {
  if (event === eventTypes.PUSH) {
    return getString('triggers.triggerConfigurationPanel.autoAbortPush')
  } else if (event === eventTypes.PULL_REQUEST || event === eventTypes.MERGE_REQUEST) {
    return getString('triggers.triggerConfigurationPanel.autoAbortPR')
  } else if (event === eventTypes.ISSUE_COMMENT || event === eventTypes.MR_COMMENT || event === eventTypes.PR_COMMENT) {
    return getString('triggers.triggerConfigurationPanel.autoAbortIssueComment')
  }
  return ''
}

export const handleSourceRepoChange = ({ e, formikProps }: { e: SelectOption; formikProps: any }): void => {
  if (e.value === GitSourceProviders.CUSTOM.value) {
    formikProps.setValues({
      ...formikProps.values,
      sourceRepo: e.value,
      connectorRef: undefined,
      repoName: '',
      actions: undefined,
      anyAction: false,
      secretToken: undefined
    })
  } else {
    formikProps.setValues({
      ...formikProps.values,
      sourceRepo: e.value,
      connectorRef: undefined,
      repoName: '',
      actions: undefined,
      anyAction: false,
      secretToken: undefined,
      headerConditions: undefined
    })
  }
}

export const renderNonCustomEventFields = ({
  sourceRepo,
  formikProps,
  event,
  eventOptions,
  getString,
  actionsOptions,
  actions
}: {
  sourceRepo?: string
  formikProps: any
  event?: string
  eventOptions: SelectOption[]
  getString: UseStringsReturn['getString']
  actionsOptions: SelectOption[]
  actions: SelectOption[]
}): JSX.Element => {
  return (
    <>
      {sourceRepo && <ConnectorSection formikProps={formikProps} />}
      <FormInput.Select
        className={cx(!event && css.bottomMarginZero)}
        key={event}
        label={getString('triggers.triggerConfigurationPanel.event')}
        name="event"
        placeholder={getString('triggers.triggerConfigurationPanel.eventPlaceholder')}
        items={eventOptions}
        onChange={e => {
          const additionalValues: any = {}

          if (e.value === eventTypes.PUSH) {
            additionalValues.sourceBranchOperator = undefined
            additionalValues.sourceBranchValue = undefined
          }

          if (e.value !== eventTypes.TAG) {
            additionalValues.tagConditionOperator = undefined
            additionalValues.tagConditionValue = undefined
          }

          formikProps.setValues({
            ...formikProps.values,
            event: e.value,
            actions: e.value === eventTypes.PUSH ? [] : undefined,
            anyAction: false,
            ...additionalValues
          })
        }}
      />
      {event && (
        <>
          {actionsOptions?.length !== 0 && (
            <div className={css.actionsContainer}>
              <div>
                <Text
                  font={{ variation: FontVariation.FORM_INPUT_TEXT, weight: 'semi-bold' }}
                  color={Color.GREY_600}
                  style={{ marginBottom: 'var(--spacing-xsmall)' }}
                >
                  {getString('triggers.triggerConfigurationPanel.actions')}
                </Text>
                <FormInput.MultiSelect
                  className={css.multiSelect}
                  name="actions"
                  items={actionsOptions}
                  // yaml design: empty array means selecting all
                  disabled={Array.isArray(actions) && isEmpty(actions)}
                  onChange={e => {
                    if (!e || (Array.isArray(e) && isEmpty(e))) {
                      formikProps.setFieldValue('actions', undefined)
                    } else {
                      formikProps.setFieldValue('actions', e)
                    }
                  }}
                />
              </div>
              <Container className={css.anyActionContainer}>
                <FormInput.CheckBox
                  name="anyAction"
                  key={Date.now()}
                  label={getString('triggers.triggerConfigurationPanel.anyActions')}
                  defaultChecked={(Array.isArray(actions) && actions.length === 0) || false}
                  className={css.checkboxAlignment}
                  onClick={(e: React.FormEvent<HTMLInputElement>) => {
                    formikProps.setFieldTouched('actions', true)
                    if (e.currentTarget?.checked) {
                      formikProps.setFieldValue('actions', [])
                    } else {
                      formikProps.setFieldValue('actions', undefined)
                    }
                  }}
                />
              </Container>
            </div>
          )}
          {autoAbortPreviousExecutionsTypes.includes(event) && (
            <>
              <FormInput.CheckBox
                style={{ position: 'relative', left: '0' }}
                name="autoAbortPreviousExecutions"
                label="Auto-abort Previous Execution"
                className={css.checkboxAlignment}
              />
              <Text className={css.autoAbortDescription}>{getAutoAbortDescription({ event, getString })}</Text>
            </>
          )}
        </>
      )}
    </>
  )
}
interface ActionsOptionsMapInterface {
  [key: string]: string[]
}

export const getEventLabelMap = (event: string): string => {
  // add space between camelcase-separated words
  if (event === eventTypes.PULL_REQUEST) {
    return 'Pull Request'
  } else if (event === eventTypes.MERGE_REQUEST) {
    return 'Merge Request'
  } else if (event === eventTypes.ISSUE_COMMENT) {
    return 'Issue Comment'
  } else if (event == eventTypes.PR_COMMENT) {
    return 'Pull Request Comment'
  } else if (event == eventTypes.MR_COMMENT) {
    return 'Merge Request Comment'
  }
  return event
}

export const getEventAndActions = ({
  data,
  sourceRepo
}: {
  data: {
    [key: string]: {
      [key: string]: string[]
    }
  }
  sourceRepo: string
}): { eventOptions: SelectOption[]; actionsOptionsMap: ActionsOptionsMapInterface } => {
  const filteredData = data?.[sourceRepo] || {}
  const shouldSortByAlphabetically =
    sourceRepo === GitSourceProviders.GITLAB.value || sourceRepo === GitSourceProviders.BITBUCKET.value
  let eventOptions = Object.keys(filteredData).map(event => ({
    label: getEventLabelMap(event),
    value: event
  }))
  if (shouldSortByAlphabetically) {
    eventOptions = sortBy(eventOptions, ['label'])
  }
  return { eventOptions, actionsOptionsMap: filteredData }
}

export const clearEventsAndActions = ({
  newActionsOptionsMap,
  formikProps,
  setActionsOptions,
  event
}: {
  newActionsOptionsMap: ActionsOptionsMapInterface
  formikProps: any
  setActionsOptions: Dispatch<SetStateAction<SelectOption[]>>
  event: string
}): void => {
  if (isUndefined(newActionsOptionsMap[event])) {
    formikProps.setFieldValue('event', undefined)
    return
  }

  const newActionsOptions = newActionsOptionsMap[event]?.map((val: string) => ({ label: val, value: val }))
  setActionsOptions(newActionsOptions)
  if (newActionsOptions?.length === 0) {
    formikProps.setFieldValue('actions', [])
  }
}
