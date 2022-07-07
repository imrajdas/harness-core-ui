/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useRef } from 'react'
import { DateRange, DateRangePicker } from '@blueprintjs/datetime'
import { Button, ButtonVariation } from '@wings-software/uicore'
import { FormGroup, InputGroup } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import type { DynamicPopoverHandlerBinding } from '@common/exports'
import { DynamicPopover } from '..'
interface InputDatePickerProps {
  formikProps: any
}

export const FORM_CLICK_EVENT = 'FORM_CLICK_EVENT'

export default function InputDatePicker(props: InputDatePickerProps) {
  const { getString } = useStrings()
  const ref = useRef(null)
  const { formikProps } = props
  const getText = () => {
    const endDate = new Date(formikProps?.values?.timeRange?.endTime || 0)
    if (formikProps?.values?.timeRange?.endTime) endDate.setDate(endDate.getDate() - 1)
    return formikProps?.values?.timeRange
      ? `${new Date(formikProps?.values?.timeRange?.startTime || 0)?.toLocaleDateString() || ''} - ${
          endDate?.toLocaleDateString() || ''
        }`
      : null
  }
  const [dynamicPopoverHandler, setDynamicPopoverHandler] = React.useState<
    DynamicPopoverHandlerBinding<{ data: null }> | undefined
  >()
  const getValue = (): DateRange | undefined => {
    const endDate = new Date(formikProps?.values?.timeRange?.endTime || 0)
    if (formikProps?.values?.timeRange?.endTime) endDate.setDate(endDate.getDate() - 1)
    return [new Date(formikProps?.values?.timeRange?.startTime || 0), endDate]
  }

  const canvasClickListener = React.useCallback((): void => dynamicPopoverHandler?.hide(), [dynamicPopoverHandler])
  React.useEffect(() => {
    document.addEventListener('FORM_CLICK_EVENT', canvasClickListener)
    return () => {
      document.removeEventListener('FORM_CLICK_EVENT', canvasClickListener)
    }
  }, [dynamicPopoverHandler])

  const renderPopover = () => {
    return (
      <DateRangePicker
        onShortcutChange={() => dynamicPopoverHandler?.hide()}
        allowSingleDayRange={true}
        shortcuts={true}
        defaultValue={getValue()}
        minDate={new Date(0)}
        onChange={selectedDates => {
          const updatedEndTime = new Date(selectedDates[1] || selectedDates[0] || 0)
          updatedEndTime.setDate(updatedEndTime.getDate() + 1)
          formikProps?.setValues({
            ...formikProps?.values,
            timeRange: {
              startTime: (selectedDates[0] || new Date(0))?.getTime(),
              endTime: updatedEndTime?.getTime()
            }
          })
          if (selectedDates[0] && selectedDates[1]) {
            dynamicPopoverHandler?.hide()
          }
        }}
      />
    )
  }
  return (
    <>
      <div
        data-nodeid="inputDatePicker"
        data-testid="inputDatePicker"
        onClick={e => {
          e.stopPropagation()
          dynamicPopoverHandler?.show(`[data-nodeid="inputDatePicker"]`, { data: null })
        }}
      >
        <FormGroup label={getString('common.timeframe')}>
          <InputGroup
            placeholder={getText() || getString('common.selectTimeFrame')}
            rightElement={
              <Button
                icon="cross"
                variation={ButtonVariation.ICON}
                onClick={e => {
                  e.stopPropagation()
                  formikProps?.setValues({ ...formikProps?.values, timeRange: null })
                }}
              />
            }
          />
        </FormGroup>
      </div>
      <div ref={ref} onClick={e => e.stopPropagation()}>
        <DynamicPopover render={renderPopover} bind={setDynamicPopoverHandler} />
      </div>
    </>
  )
}
