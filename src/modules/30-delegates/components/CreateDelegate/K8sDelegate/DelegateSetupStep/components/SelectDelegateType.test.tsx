/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act, fireEvent } from '@testing-library/react'
import { Formik } from '@wings-software/uicore'
import type { FormikProps } from 'formik'
import { TestWrapper } from '@common/utils/testUtils'
import SelectDelegateType, { FormikForSelectDelegateType } from './SelectDelegateType'
import { DelegateType } from '../DelegateSetupStep.types'

describe('Render Select Delegate Type Nested Form', () => {
  test('matches snapshot', () => {
    const { container, getByText } = render(
      <TestWrapper>
        <Formik
          initialValues={{ delegateType: DelegateType.HELM_CHART }}
          onSubmit={() => void 0}
          formName="SelectDelegateTypeSubForm"
        >
          {(formikProps: FormikProps<FormikForSelectDelegateType>) => <SelectDelegateType formikProps={formikProps} />}
        </Formik>
      </TestWrapper>
    )

    act(() => {
      fireEvent.click(getByText('pipeline.manifestTypeLabels.HelmChartLabel'))
    })

    expect(container).toMatchSnapshot()
  })
})
