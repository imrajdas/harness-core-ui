/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { FormikProps } from 'formik'
import cx from 'classnames'
import { Accordion, FormInput, getMultiTypeFromValue, MultiTypeInputType, SelectOption } from '@wings-software/uicore'
import { get } from 'lodash-es'

import { useStrings } from 'framework/strings'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { FormMultiTypeDurationField } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { ShellScriptMonacoField, ScriptType } from '@common/components/ShellScriptMonaco/ShellScriptMonaco'

import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'

import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './CreatePrStep.module.scss'

export const shellScriptType: SelectOption[] = [{ label: 'Bash', value: 'Bash' }]

export default function CreatePRScript(props: {
  formik: FormikProps<any>
  isNewStep: boolean
  readonly?: boolean
  stepViewType?: StepViewType
  allowableTypes: MultiTypeInputType[]
}): React.ReactElement {
  const {
    formik: { values: formValues, setFieldValue },
    isNewStep,
    readonly,
    stepViewType,
    allowableTypes
  } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const scriptType: ScriptType = get(formValues, 'spec.shell', 'Bash')
  const timeout = get(formValues, 'timeout', '')
  return (
    <>
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
          multiTypeDurationProps={{ enableConfigureOptions: false, expressions, disabled: readonly, allowableTypes }}
          className={stepCss.duration}
          disabled={readonly}
        />
        {getMultiTypeFromValue(timeout) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            value={timeout as string}
            type="String"
            variableName="step.timeout"
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            // istanbul ignore next
            onChange={
              // istanbul ignore next
              value => {
                // istanbul ignore next
                setFieldValue('timeout', value)
              }
            }
            isReadonly={readonly}
          />
        )}
      </div>
      <div className={stepCss.divider} />

      <Accordion className={cx(stepCss.accordion, css.overrideConfig)}>
        <Accordion.Panel
          id="override-config"
          summary={'Override Configuration'}
          details={
            <>
              <div className={cx(stepCss.formGroup, stepCss.sm)}>
                <FormInput.CheckBox name="spec.overrideConfig" label={'Override Configuration'} />
              </div>
              <div className={cx(stepCss.formGroup, stepCss.sm)}>
                <FormInput.Select
                  items={shellScriptType}
                  name="spec.shell"
                  label={getString('scriptType')}
                  placeholder={getString('scriptType')}
                  disabled
                />
              </div>
              <div className={cx(stepCss.formGroup)}>
                <MultiTypeFieldSelector
                  name="spec.source.spec.updateConfigScript"
                  label={getString('script')}
                  defaultValueToReset=""
                  disabled={readonly}
                  allowedTypes={allowableTypes}
                  disableTypeSelection={readonly}
                  skipRenderValueInExpressionLabel
                  expressionRender={
                    // istanbul ignore next
                    () => {
                      // istanbul ignore next
                      return (
                        <ShellScriptMonacoField
                          name="spec.source.spec.updateConfigScript"
                          scriptType={scriptType}
                          disabled={readonly}
                          expressions={expressions}
                        />
                      )
                    }
                  }
                >
                  <ShellScriptMonacoField
                    name="spec.source.spec.updateConfigScript"
                    scriptType={scriptType}
                    disabled={readonly}
                    expressions={expressions}
                  />
                </MultiTypeFieldSelector>
                {getMultiTypeFromValue(get(formValues, 'spec.source.spec.updateConfigScript', '')) ===
                  MultiTypeInputType.RUNTIME && (
                  <ConfigureOptions
                    value={get(formValues, 'spec.source.spec.updateConfigScript', '')}
                    type="String"
                    variableName="spec.source.spec.updateConfigScript"
                    className={css.minConfigBtn}
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    // istanbul ignore next
                    onChange={
                      // istanbul ignore next
                      value => {
                        // istanbul ignore next
                        setFieldValue('spec.source.spec.updateConfigScript', value)
                      }
                    }
                    isReadonly={readonly}
                  />
                )}
              </div>
            </>
          }
        />
      </Accordion>
    </>
  )
}
