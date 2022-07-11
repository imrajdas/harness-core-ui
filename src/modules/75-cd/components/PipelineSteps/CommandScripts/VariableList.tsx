/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { get } from 'lodash-es'
import { FieldArray, FormikProps } from 'formik'
import { v4 as uuid } from 'uuid'
import { Button, ButtonVariation, FormInput, MultiTypeInputType } from '@wings-software/uicore'

import type { NGVariable } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { CommandScriptsData, scriptInputType } from './CommandScriptsTypes'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './VariableList.module.scss'

interface VariableListProps {
  varType?: 'Input' | 'Output'
  formik: FormikProps<CommandScriptsData>
  fieldName: string
  fieldLabel: string
  readonly?: boolean
  allowableTypes: MultiTypeInputType[]
}

export const VariableList = (props: VariableListProps): React.ReactElement => {
  const { varType, formik, fieldName, fieldLabel, readonly = false, allowableTypes } = props
  const { getString } = useStrings()

  const { expressions } = useVariablesExpression()

  return (
    <div className={stepCss.formGroup}>
      <MultiTypeFieldSelector
        name={fieldName}
        label={fieldLabel}
        isOptional
        optionalLabel={getString('common.optionalLabel')}
        defaultValueToReset={[]}
        disableTypeSelection
      >
        <FieldArray
          name={fieldName}
          render={({ push, remove }) => {
            return (
              <div className={css.panel}>
                <div className={css.environmentVarHeader}>
                  <span className={css.label}>{getString('name')}</span>
                  <span className={css.label}>{getString('typeLabel')}</span>
                  <span className={css.label}>{getString('valueLabel')}</span>
                </div>
                {get(formik.values, fieldName)?.map((_var: NGVariable, i: number) => {
                  return (
                    <div className={css.environmentVarHeader} key={i}>
                      <FormInput.Text
                        name={`${fieldName}[${i}].name`}
                        placeholder={getString('name')}
                        disabled={readonly}
                      />
                      <FormInput.Select
                        items={scriptInputType}
                        name={`${fieldName}[${i}].type`}
                        placeholder={getString('typeLabel')}
                        disabled={readonly}
                      />
                      <FormInput.MultiTextInput
                        name={`${fieldName}[${i}].value`}
                        placeholder={getString('valueLabel')}
                        multiTextInputProps={{
                          allowableTypes,
                          expressions,
                          disabled: readonly
                        }}
                        label=""
                        disabled={readonly}
                      />
                      <Button
                        variation={ButtonVariation.ICON}
                        icon="main-trash"
                        data-testid={`${fieldName}-${i}`}
                        onClick={() => remove(i)}
                        disabled={readonly}
                      />
                    </div>
                  )
                })}
                <Button
                  icon="plus"
                  variation={ButtonVariation.LINK}
                  data-testid={`add-${fieldName}`}
                  disabled={readonly}
                  onClick={() => push({ name: '', type: 'String', value: '', id: uuid() })}
                  className={css.addButton}
                >
                  {varType === 'Input' ? getString('addInputVar') : getString('addOutputVar')}
                </Button>
              </div>
            )
          }}
        />
      </MultiTypeFieldSelector>
    </div>
  )
}
