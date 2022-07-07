/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { FormikProps } from 'formik'
import * as Yup from 'yup'
import cx from 'classnames'
import { Formik, FormInput, getMultiTypeFromValue, MultiTypeInputType } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import { setFormikRef, StepFormikFowardRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { getNameAndIdentifierSchema } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { QueueProps, QueueData, getScopeOptions } from './helper'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

function QueueWidget(props: QueueProps, formikRef: StepFormikFowardRef<QueueData>): React.ReactElement {
  const { initialValues, onUpdate, isNewStep = true, onChange, stepViewType, allowableTypes, readonly } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const scopeOptions = getScopeOptions(getString)

  return (
    <>
      <Formik<QueueData>
        onSubmit={(values: QueueData) => {
          onUpdate?.(values)
        }}
        formName="queueStep"
        initialValues={initialValues}
        validate={data => {
          onChange?.(data)
        }}
        validationSchema={Yup.object().shape({
          ...getNameAndIdentifierSchema(getString, stepViewType),
          timeout: getDurationValidationSchema({ minimum: '10s' }).required(
            getString('validation.timeout10SecMinimum')
          ),
          spec: Yup.object().shape({
            key: Yup.string().required(getString('pipeline.queueStep.keyRequired')),
            scope: Yup.string().required(getString('pipeline.queueStep.scopeRequired'))
          })
        })}
      >
        {(formik: FormikProps<QueueData>) => {
          const { values, setFieldValue } = formik
          setFormikRef(formikRef, formik)
          return (
            <>
              {stepViewType !== StepViewType.Template && (
                <div className={cx(stepCss.formGroup, stepCss.lg)}>
                  <FormInput.InputWithIdentifier inputLabel={getString('name')} isIdentifierEditable={isNewStep} />
                </div>
              )}

              <div className={cx(stepCss.formGroup, stepCss.sm)}>
                <FormMultiTypeDurationField
                  name="timeout"
                  label={getString('pipelineSteps.timeoutLabel')}
                  multiTypeDurationProps={{
                    enableConfigureOptions: false,
                    disabled: readonly,
                    allowableTypes
                  }}
                />
                {getMultiTypeFromValue(values.timeout) === MultiTypeInputType.RUNTIME && (
                  <ConfigureOptions
                    value={values.timeout as string}
                    type="String"
                    variableName="step.timeout"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={value => {
                      setFieldValue('timeout', value)
                    }}
                    isReadonly={readonly}
                  />
                )}
              </div>

              <div className={stepCss.divider} />

              <div className={cx(stepCss.formGroup, stepCss.md)}>
                <FormInput.MultiTextInput
                  label={getString('pipeline.queueStep.resourceKey')}
                  name="spec.key"
                  multiTextInputProps={{ expressions, allowableTypes }}
                  placeholder={getString('pipeline.queueStep.keyPlaceholder')}
                  disabled={!!readonly}
                />

                {getMultiTypeFromValue(formik.values.spec.key) === MultiTypeInputType.RUNTIME && (
                  <ConfigureOptions
                    value={values.spec.key}
                    type="String"
                    variableName="spec.key"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={value => formik.setFieldValue('spec.key', value)}
                    isReadonly={readonly}
                  />
                )}
              </div>
              <div className={cx(stepCss.formGroup, stepCss.md)}>
                <FormInput.Select
                  name="spec.scope"
                  label={getString('pipeline.queueStep.scope')}
                  items={scopeOptions}
                  disabled={readonly}
                  placeholder={getString('pipeline.queueStep.scopePlaceholder')}
                />
              </div>
            </>
          )
        }}
      </Formik>
    </>
  )
}

export default QueueWidget
