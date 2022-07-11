/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, Formik } from '@harness/uicore'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import CVMultiTypeQuery from '../CVMultiTypeQuery'

const mockQuery = `
    ALERTS_FOR_STATE  {

    }
`

describe('Validate CVMultiTypeQuery', () => {
  test('should render CVMultiTypeQuery', () => {
    const { container, getByText } = render(
      <TestWrapper>
        <Formik formName="" initialValues={{ query: mockQuery }} onSubmit={() => undefined}>
          {_ => {
            return <CVMultiTypeQuery name={'query'} expressions={[]} disableFetchButton />
          }}
        </Formik>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
    expect(container.querySelector('textarea[name="query"]')).toHaveValue(mockQuery)
    expect(getByText('cv.monitoringSources.gcoLogs.fetchRecords').parentElement).toBeDisabled()
  })

  test('should validate cliking on fetchrecords', async () => {
    const fetchRecords = jest.fn()
    const { container, getByText } = render(
      <TestWrapper>
        <Formik formName="" initialValues={{ query: mockQuery }} onSubmit={() => undefined}>
          {_ => {
            return (
              <CVMultiTypeQuery
                name={'query'}
                expressions={['exp1']}
                fetchRecords={fetchRecords}
                disableFetchButton={false}
              />
            )
          }}
        </Formik>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
    expect(getByText('cv.monitoringSources.gcoLogs.fetchRecords').parentElement).not.toBeDisabled()
    await act(() => {
      fireEvent.click(getByText('cv.monitoringSources.gcoLogs.fetchRecords'))
    })
    expect(fetchRecords).toBeCalledTimes(1)
  })

  test('should show errors', async () => {
    const queryErrorMessage = 'Query is required'
    const { getByText } = render(
      <TestWrapper>
        <Formik
          formName=""
          initialValues={{ query: '' }}
          onSubmit={() => undefined}
          validate={() => {
            return { query: queryErrorMessage }
          }}
        >
          {formikProps => {
            return (
              <>
                <CVMultiTypeQuery
                  name={'query'}
                  expressions={['exp1']}
                  fetchRecords={jest.fn()}
                  disableFetchButton={false}
                />
                <Button
                  onClick={() => {
                    formikProps.setTouched({ query: true })
                    formikProps.submitForm()
                  }}
                >
                  Submit Dummy Form
                </Button>
              </>
            )
          }}
        </Formik>
      </TestWrapper>
    )
    const submitBtn = await getByText('Submit Dummy Form')
    fireEvent.click(submitBtn)
    await waitFor(() => expect(getByText(queryErrorMessage)).toBeInTheDocument())
  })
})
