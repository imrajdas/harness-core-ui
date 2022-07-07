/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import * as Yup from 'yup'
import { Formik, FormInput, getMultiTypeFromValue, MultiTypeInputType } from '@harness/uicore'
import { get } from 'lodash-es'
import { useStrings } from 'framework/strings'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { NameSchema } from '@common/utils/Validation'
import { useQueryParams } from '@common/hooks'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { setFormikRef, StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import type { AzureTrafficShiftProps } from './AzureTrafficShiftInterface.types'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

export const AzureTrafficShiftRef = (props: AzureTrafficShiftProps, formikRef: StepFormikFowardRef): JSX.Element => {
  /* istanbul ignore next */
  const { allowableTypes, isNewStep = true, readonly, initialValues, onUpdate, onChange } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const query = useQueryParams()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sectionId = (query as any).sectionId || ''

  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialValues}
      formName={`AzureTrafficShift-${sectionId}`}
      validate={values => {
        const payload = {
          ...values
        }
        /* istanbul ignore next */
        onChange?.(payload)
      }}
      onSubmit={values => {
        const payload = {
          ...values
        }
        /* istanbul ignore next */
        onUpdate?.(payload)
      }}
      validationSchema={Yup.object().shape({
        name: NameSchema({ requiredErrorMsg: getString('pipelineSteps.stepNameRequired') }),
        timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString('validation.timeout10SecMinimum')),
        spec: Yup.object().shape({
          traffic: Yup.string().required(getString('fieldRequired', { field: getString('pipeline.traffic') }))
        })
      })}
    >
      {formik => {
        setFormikRef(formikRef, formik)
        return (
          <>
            <div className={cx(stepCss.formGroup, stepCss.lg)}>
              <FormInput.InputWithIdentifier
                inputLabel={getString('name')}
                isIdentifierEditable={isNewStep}
                inputGroupProps={{
                  disabled: readonly
                }}
              />
            </div>
            <div className={cx(stepCss.formGroup, stepCss.sm)}>
              <FormMultiTypeDurationField
                name="timeout"
                label={getString('pipelineSteps.timeoutLabel')}
                multiTypeDurationProps={{ enableConfigureOptions: false, expressions, allowableTypes }}
                disabled={readonly}
              />
              {getMultiTypeFromValue(get(formik, 'values.timeout')) === MultiTypeInputType.RUNTIME && (
                <ConfigureOptions
                  value={get(formik, 'values.timeout') as string}
                  type="String"
                  variableName="step.timeout"
                  showRequiredField={false}
                  showDefaultField={false}
                  showAdvanced={true}
                  onChange={
                    /* istanbul ignore next */ value => {
                      formik?.setFieldValue('timeout', value)
                    }
                  }
                  isReadonly={readonly}
                />
              )}
            </div>
            <div className={stepCss.divider} />
            <div className={cx(stepCss.formGroup, stepCss.md)}>
              <FormInput.MultiTextInput
                name="spec.traffic"
                placeholder={getString('pipeline.traffic')}
                label={getString('pipeline.traffic')}
                multiTextInputProps={{ expressions, allowableTypes }}
                disabled={readonly}
              />
              {getMultiTypeFromValue(get(formik, 'values.spec.traffic')) === MultiTypeInputType.RUNTIME && (
                <ConfigureOptions
                  value={get(formik, 'values.spec.traffic') as string}
                  type="String"
                  variableName="spec.traffic"
                  showRequiredField={false}
                  showDefaultField={false}
                  showAdvanced={true}
                  onChange={
                    /* istanbul ignore next */ value => {
                      formik?.setFieldValue('spec.traffic', value)
                    }
                  }
                  isReadonly={readonly}
                />
              )}
            </div>
          </>
        )
      }}
    </Formik>
  )
}
