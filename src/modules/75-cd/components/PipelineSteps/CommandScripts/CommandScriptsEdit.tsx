/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo } from 'lodash-es'
import * as Yup from 'yup'
import type { FormikProps } from 'formik'
import cx from 'classnames'
import {
  Accordion,
  Checkbox,
  Formik,
  FormInput,
  getMultiTypeFromValue,
  MultiTypeInputType
} from '@wings-software/uicore'

import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { setFormikRef, StepFormikFowardRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { useStrings } from 'framework/strings'
import { getNameAndIdentifierSchema } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import type { CommandScriptsData, CommandScriptsFormData } from './CommandScriptsTypes'
import { CommandList } from './CommandList'
import { VariableList } from './VariableList'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

interface ShellScriptWidgetProps {
  initialValues: CommandScriptsFormData
  onUpdate?: (data: CommandScriptsFormData) => void
  onChange?: (data: CommandScriptsFormData) => void
  allowableTypes: MultiTypeInputType[]
  readonly?: boolean
  stepViewType?: StepViewType
  isNewStep?: boolean
}

function CommandScriptsEditWidget(
  {
    initialValues,
    onUpdate,
    onChange,
    allowableTypes,
    isNewStep = true,
    readonly,
    stepViewType
  }: ShellScriptWidgetProps,
  formikRef: StepFormikFowardRef
): JSX.Element {
  const { getString } = useStrings()

  const validationSchema = Yup.object().shape({
    timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString('validation.timeout10SecMinimum')),
    ...getNameAndIdentifierSchema(getString, stepViewType)
  })

  const values: CommandScriptsFormData = {
    ...initialValues,
    spec: {
      ...initialValues.spec
    }
  }
  const { expressions } = useVariablesExpression()

  return (
    <Formik<CommandScriptsFormData>
      onSubmit={submit => {
        onUpdate?.(submit)
      }}
      validate={formValues => {
        onChange?.(formValues)
      }}
      formName="shellScriptForm"
      initialValues={values}
      validationSchema={validationSchema}
    >
      {(formik: FormikProps<CommandScriptsData>) => {
        // this is required
        setFormikRef(formikRef, formik)

        return (
          <React.Fragment>
            {stepViewType !== StepViewType.Template && (
              <div className={cx(stepCss.formGroup, stepCss.lg)}>
                <FormInput.InputWithIdentifier
                  inputLabel={getString('pipelineSteps.stepNameLabel')}
                  isIdentifierEditable={isNewStep && !readonly}
                  inputGroupProps={{
                    placeholder: getString('pipeline.stepNamePlaceholder'),
                    disabled: readonly
                  }}
                />
              </div>
            )}
            <div className={cx(stepCss.formGroup, stepCss.sm)}>
              <FormMultiTypeDurationField
                name="timeout"
                label={getString('pipelineSteps.timeoutLabel')}
                multiTypeDurationProps={{
                  enableConfigureOptions: false,
                  expressions,
                  disabled: readonly,
                  allowableTypes
                }}
                className={stepCss.duration}
                disabled={readonly}
              />
              {getMultiTypeFromValue(formik.values?.timeout) === MultiTypeInputType.RUNTIME && (
                <ConfigureOptions
                  value={formik.values?.timeout as string}
                  type="String"
                  variableName="step.timeout"
                  showRequiredField={false}
                  showDefaultField={false}
                  showAdvanced={true}
                  onChange={value => {
                    formik.setFieldValue('timeout', value)
                  }}
                  isReadonly={readonly}
                />
              )}
            </div>
            <div className={stepCss.divider} />
            <CommandList allowableTypes={allowableTypes} readonly={readonly} />
            <Accordion className={stepCss.accordion}>
              <Accordion.Panel
                id="optional-config"
                summary={getString('common.optionalConfig')}
                details={
                  <div className={stepCss.stepPanel}>
                    <VariableList
                      varType={'Input'}
                      formik={formik}
                      fieldName={'spec.environmentVariables'}
                      fieldLabel={getString('pipeline.scriptInputVariables')}
                      allowableTypes={allowableTypes}
                      readonly={readonly}
                    />
                    <VariableList
                      varType={'Output'}
                      formik={formik}
                      fieldName={'spec.outputVariables'}
                      fieldLabel={getString('pipeline.scriptOutputVariables')}
                      allowableTypes={allowableTypes}
                      readonly={readonly}
                    />
                    <div className={stepCss.formGroup}>
                      <Checkbox
                        name={'spec.onDelegate'}
                        label={getString('cd.steps.commands.runOnDelegate')}
                        data-testid={`runOnDelegate`}
                        defaultChecked={defaultTo(formik.values.spec.onDelegate, false)}
                        onChange={(event: React.FormEvent<HTMLInputElement>) =>
                          formik.setFieldValue('spec.onDelegate', event.currentTarget.checked)
                        }
                      />
                    </div>
                  </div>
                }
              />
            </Accordion>
          </React.Fragment>
        )
      }}
    </Formik>
  )
}

export const CommandScriptsEdit = React.forwardRef(CommandScriptsEditWidget)
