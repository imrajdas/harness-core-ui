/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'

import { Formik, FormikForm, MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'

import AzureTrafficShiftInputSet from '../AzureTrafficShiftInputSet'
jest.mock('@common/components/YAMLBuilder/YamlBuilder')

const initialValues = {
  timeout: '10m'
}

const template: any = {
  timeout: RUNTIME_INPUT_VALUE,
  spec: {
    traffic: RUNTIME_INPUT_VALUE
  }
}

describe('Test Azure Traffic Shift input set', () => {
  test('Should render edit view as new step', () => {
    const { container } = render(
      <TestWrapper>
        <Formik initialValues={{}} onSubmit={() => undefined} formName="wrapperComponentTestForm">
          <FormikForm>
            <AzureTrafficShiftInputSet
              initialValues={initialValues as any}
              stepType={StepType.AzureTrafficShift}
              stepViewType={StepViewType.InputSet}
              inputSetData={{
                template
              }}
              path="test"
              allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION, MultiTypeInputType.RUNTIME]}
            />
          </FormikForm>
        </Formik>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
