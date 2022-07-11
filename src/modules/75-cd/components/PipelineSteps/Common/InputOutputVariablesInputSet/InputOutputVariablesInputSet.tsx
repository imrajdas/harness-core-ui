/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { FieldArray } from 'formik'
import { isArray, isEmpty } from 'lodash-es'
import { FormInput, MultiTypeInputType } from '@harness/uicore'

import type { StepElementConfig } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { scriptInputType, scriptOutputType } from '../../ShellScriptStep/shellScriptTypes'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './InputOutputVariablesInputSet.module.scss'

interface InputOutputVariablesInputSetProps {
  allowableTypes: MultiTypeInputType[]
  template?: StepElementConfig
  path?: string
  readonly?: boolean
}

export function InputOutputVariablesInputSet(props: InputOutputVariablesInputSetProps): React.ReactElement {
  const { allowableTypes, readonly, template, path } = props

  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const { NG_EXECUTION_INPUT } = useFeatureFlags()
  const prefix = isEmpty(path) ? '' : `${path}.`

  return (
    <>
      {isArray(template?.spec?.environmentVariables) && template?.spec?.environmentVariables ? (
        <div className={stepCss.formGroup}>
          <MultiTypeFieldSelector
            name="spec.environmentVariables"
            label={getString('pipeline.scriptInputVariables')}
            defaultValueToReset={[]}
            disableTypeSelection
          >
            <FieldArray
              name="spec.environmentVariables"
              render={() => {
                return (
                  <div className={css.panel}>
                    <div className={css.environmentVarHeader}>
                      <span className={css.label}>Name</span>
                      <span className={css.label}>Type</span>
                      <span className={css.label}>Value</span>
                    </div>
                    {template.spec?.environmentVariables?.map((type: any, i: number) => {
                      return (
                        <div className={css.environmentVarHeader} key={type.value}>
                          <FormInput.Text
                            name={`${prefix}spec.environmentVariables[${i}].name`}
                            placeholder={getString('name')}
                            disabled={true}
                          />
                          <FormInput.Select
                            items={scriptInputType}
                            name={`${prefix}spec.environmentVariables[${i}].type`}
                            placeholder={getString('typeLabel')}
                            disabled={true}
                          />
                          <FormInput.MultiTextInput
                            name={`${prefix}spec.environmentVariables[${i}].value`}
                            multiTextInputProps={{
                              allowableTypes,
                              expressions,
                              disabled: readonly,
                              useExecutionTimeInput: NG_EXECUTION_INPUT
                            }}
                            label=""
                            disabled={readonly}
                            placeholder={getString('valueLabel')}
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              }}
            />
          </MultiTypeFieldSelector>
        </div>
      ) : null}
      {isArray(template?.spec?.outputVariables) && template?.spec?.outputVariables ? (
        <div className={stepCss.formGroup}>
          <MultiTypeFieldSelector
            name="spec.outputVariables"
            label={getString('pipeline.scriptOutputVariables')}
            defaultValueToReset={[]}
            disableTypeSelection
          >
            <FieldArray
              name="spec.outputVariables"
              render={() => {
                return (
                  <div className={css.panel}>
                    <div className={css.outputVarHeader}>
                      <span className={css.label}>Name</span>
                      <span className={css.label}>Type</span>
                      <span className={css.label}>Value</span>
                    </div>
                    {template.spec?.outputVariables?.map((output: any, i: number) => {
                      return (
                        <div className={css.outputVarHeader} key={output.name}>
                          <FormInput.Text
                            name={`${prefix}spec.outputVariables[${i}].name`}
                            placeholder={getString('name')}
                            disabled={true}
                          />
                          <FormInput.Select
                            items={scriptOutputType}
                            name={`${prefix}spec.outputVariables[${i}].type`}
                            placeholder={getString('typeLabel')}
                            disabled={true}
                          />

                          <FormInput.MultiTextInput
                            name={`${prefix}spec.outputVariables[${i}].value`}
                            multiTextInputProps={{
                              allowableTypes,
                              expressions,
                              disabled: readonly,
                              useExecutionTimeInput: NG_EXECUTION_INPUT
                            }}
                            label=""
                            disabled={readonly}
                            placeholder={getString('valueLabel')}
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              }}
            />
          </MultiTypeFieldSelector>
        </div>
      ) : null}
    </>
  )
}
