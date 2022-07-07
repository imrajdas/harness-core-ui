/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Form, Formik } from 'formik'
import type { ObjectSchema } from 'yup'
import * as yup from 'yup'
import { ButtonVariation, ExpandingSearchInput, Page, Pagination } from '@harness/uicore'
import type { Feature, Segment, Target } from 'services/cf'
import { useStrings } from 'framework/strings'
import { CF_DEFAULT_PAGE_SIZE } from '@cf/utils/CFUtils'
import usePercentageRolloutValidationSchema from '@cf/hooks/usePercentageRolloutValidationSchema'
import { useFFGitSyncContext } from '@cf/contexts/ff-git-sync-context/FFGitSyncContext'
import TargetManagementFlagsListing from '../TargetManagementFlagsListing/TargetManagementFlagsListing'
import NoSearchResults from '../NoData/NoSearchResults'
import NoFlags, { NoFlagsProps } from './NoFlags'
import AllFlagsRemoved from './AllFlagsRemoved'
import useProcessedFlags from './useProcessedFlags'
import useFormDisabled from './useFormDisabled'
import FormButtons from './FormButtons'
import AddFlagButton from './AddFlagButton'
import { STATUS, TargetManagementFlagConfigurationPanelFormValues as FormValues } from './types'
import TargetManagementToolbar from '../TargetManagementToolbar/TargetManagementToolbar'

import css from './TargetManagementFlagConfigurationPanel.module.scss'

export interface TargetManagementFlagConfigurationPanelProps {
  item: Target | Segment
  flags: Feature[]
  onChange: (values: FormValues) => Promise<void>
  onAdd: (values: FormValues) => Promise<void>
  initialValues: FormValues
  includePercentageRollout?: boolean
  noFlagsMessage: NoFlagsProps['message']
  addFlagsDialogTitle: string
}

const TargetManagementFlagConfigurationPanel: FC<TargetManagementFlagConfigurationPanelProps> = ({
  item,
  flags,
  onChange,
  onAdd,
  initialValues,
  includePercentageRollout = false,
  noFlagsMessage,
  addFlagsDialogTitle
}) => {
  const [removedFlags, setRemovedFlags] = useState<Feature[]>([])
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [pageNumber, setPageNumber] = useState<number>(0)
  const { getString } = useStrings()

  const { disabled, planEnforcementProps, ReasonTooltip } = useFormDisabled(item)

  const percentageRolloutValidationSchema = usePercentageRolloutValidationSchema()

  const { isGitSyncActionsEnabled } = useFFGitSyncContext()

  const validationSchema = useMemo(() => {
    if (!includePercentageRollout) {
      return undefined
    }

    return yup.object({
      flags: yup.lazy(obj =>
        yup
          .object()
          .shape(
            Object.keys(obj as FormValues['flags']).reduce<Record<string, ObjectSchema>>(
              (objShape, key) => ({
                ...objShape,
                [key]: yup.object({
                  variation: yup.string().trim().required(getString('cf.segmentDetail.variationIsRequired')),
                  percentageRollout: percentageRolloutValidationSchema
                })
              }),
              {}
            )
          )
          .required()
      )
    })
  }, [getString, includePercentageRollout, percentageRolloutValidationSchema])

  const { searchedFlags, filteredFlags, pagedFlags } = useProcessedFlags({
    flags,
    searchTerm,
    removedFlags,
    pageNumber
  })

  const onSubmit = useCallback(
    async (values: FormValues) => {
      setSubmitting(true)
      await onChange(values)
      setSubmitting(false)
    },
    [onChange]
  )

  useEffect(() => {
    if (searchedFlags.length && !pagedFlags.length && pageNumber) {
      setPageNumber(pageNumber - 1)
    }
  }, [pageNumber, pagedFlags.length, searchedFlags.length])

  const onSearch = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm.trim().toLocaleLowerCase())
    setPageNumber(0)
  }, [])

  const onFlagRemoved = useCallback((flag: Feature) => setRemovedFlags([...removedFlags, flag]), [removedFlags])

  const state = useMemo<STATUS>(() => {
    if (submitting) {
      return STATUS.submitting
    } else if (!flags.length) {
      return STATUS.noFlags
    } else if (searchTerm && !searchedFlags.length) {
      return STATUS.noSearchResults
    } else if (!filteredFlags.length) {
      return STATUS.noFlagsRemaining
    }

    return STATUS.ok
  }, [filteredFlags.length, flags.length, searchTerm, searchedFlags.length, submitting])

  const existingFlagIds = useMemo<string[]>(() => flags.map(({ identifier }) => identifier), [flags])

  if (state === STATUS.noFlags) {
    return (
      <NoFlags message={noFlagsMessage}>
        <AddFlagButton
          item={item}
          onAdd={onAdd}
          existingFlagIds={existingFlagIds}
          includePercentageRollout={includePercentageRollout}
          planEnforcementProps={planEnforcementProps}
          title={addFlagsDialogTitle}
          variation={ButtonVariation.PRIMARY}
        />
      </NoFlags>
    )
  }

  const pageCount = Math.ceil(searchedFlags.length / CF_DEFAULT_PAGE_SIZE)

  return (
    <Formik<FormValues>
      onSubmit={values => {
        onSubmit(values)
      }}
      onReset={() => setRemovedFlags([])}
      initialValues={initialValues}
      enableReinitialize
      validationSchema={includePercentageRollout ? validationSchema : undefined}
    >
      {({ dirty, setFieldValue }) => (
        <Form className={css.layout}>
          <Page.SubHeader className={css.toolbar}>
            <div className={css.flagGitSync}>
              <AddFlagButton
                item={item}
                onAdd={onAdd}
                existingFlagIds={existingFlagIds}
                includePercentageRollout={includePercentageRollout}
                planEnforcementProps={planEnforcementProps}
                title={addFlagsDialogTitle}
              />
              {isGitSyncActionsEnabled && <TargetManagementToolbar />}
            </div>
            <ExpandingSearchInput alwaysExpanded onChange={onSearch} />
          </Page.SubHeader>

          <div className={css.listing}>
            {state === STATUS.noSearchResults && <NoSearchResults />}

            {state === STATUS.noFlagsRemaining && <AllFlagsRemoved />}

            {[STATUS.ok, STATUS.submitting].includes(state) && (
              <fieldset
                disabled={state === STATUS.submitting || disabled}
                className={css.listingFieldset}
                data-testid="listing-fieldset"
              >
                <TargetManagementFlagsListing
                  includePercentageRollout={includePercentageRollout}
                  flags={pagedFlags}
                  onRowDelete={flag => {
                    if (state !== STATUS.submitting && !disabled) {
                      setFieldValue(`flags.${flag.identifier}`, undefined)
                      onFlagRemoved(flag)
                    }
                  }}
                  ReasonTooltip={ReasonTooltip}
                />
              </fieldset>
            )}
          </div>

          {[STATUS.ok, STATUS.submitting].includes(state) && (
            <div className={css.pagination} data-testid="listing-pagination">
              <Pagination
                pageSize={CF_DEFAULT_PAGE_SIZE}
                pageCount={pageCount}
                itemCount={searchedFlags.length}
                pageIndex={pageNumber < pageCount ? pageNumber : pageCount - 1}
                gotoPage={setPageNumber}
              />
            </div>
          )}

          {dirty && !disabled && <FormButtons state={state} />}
        </Form>
      )}
    </Formik>
  )
}

export default TargetManagementFlagConfigurationPanel
