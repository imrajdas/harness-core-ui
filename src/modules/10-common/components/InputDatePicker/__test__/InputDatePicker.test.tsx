/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { Formik, FormikForm } from '@harness/uicore'
import { noop } from 'lodash-es'
import { TestWrapper } from '@common/utils/testUtils'
import InputDatePicker from '../InputDatePicker'

const mockFormikData = {
  pipelineName: 'pipeline3',
  timeRange: {
    startTime: 24431400000,
    endTime: 24517800000
  }
}

describe('Launch Button test', () => {
  test('Input date picker render ', async () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId" pathParams={{ accountId: '123' }}>
        <Formik initialValues={mockFormikData} onSubmit={noop} formName="allowedValueTest">
          {formik => (
            <FormikForm>
              <InputDatePicker formikProps={formik} />
            </FormikForm>
          )}
        </Formik>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
  test('Should open the datepicker popover', () => {
    const { queryByText, getByTestId, debug, container } = render(
      <TestWrapper path="/account/:accountId" pathParams={{ accountId: '123' }}>
        <Formik initialValues={mockFormikData} onSubmit={noop} formName="allowedValueTest">
          {formik => (
            <FormikForm>
              <InputDatePicker formikProps={formik} />
            </FormikForm>
          )}
        </Formik>
      </TestWrapper>
    )
    const datePickerInput = getByTestId('inputDatePicker')
    expect(datePickerInput).toBeTruthy()
    fireEvent.click(datePickerInput)
    debug(container)
    expect(queryByText('common.timeframe')).toBeInTheDocument()
  })
})
