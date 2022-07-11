/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { FieldArray } from 'formik'
import { defaultTo, get, isEmpty } from 'lodash-es'
import cx from 'classnames'
import { Color, Container, getMultiTypeFromValue, Icon, Layout, MultiTypeInputType, Text } from '@harness/uicore'

import { useStrings } from 'framework/strings'
import { MultiTypeTextField } from '@common/components/MultiTypeText/MultiTypeText'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { ScriptType, ShellScriptMonacoField } from '@common/components/ShellScriptMonaco/ShellScriptMonaco'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import type { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import type { CommandScriptsData, CopyCommandUnit, CustomScriptCommandUnit } from './CommandScriptsTypes'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './CommandListInputSet.module.scss'

interface CommandListInputSetProps {
  initialValues: CommandScriptsData
  stepViewType: StepViewType
  allowableTypes: MultiTypeInputType[]
  template?: CommandScriptsData
  path?: string
  readonly?: boolean
}

export function CommandListInputSet(props: CommandListInputSetProps): React.ReactElement {
  const { initialValues, allowableTypes, readonly, path, template } = props
  const { getString } = useStrings()
  const prefix = isEmpty(path) ? '' : `${path}.`
  const { expressions } = useVariablesExpression()
  const { NG_EXECUTION_INPUT } = useFeatureFlags()
  const scriptType: ScriptType = get(initialValues, 'spec.shell', 'Bash')

  return (
    <div className={cx(stepCss.formGroup, stepCss.lg)}>
      <Layout.Vertical>
        <FieldArray
          name={`${path}.spec.commandUnits`}
          render={() => {
            return (
              <>
                {template?.spec.commandUnits?.map((command, i) => (
                  <React.Fragment key={(command.commandUnit as any).identifier}>
                    <Layout.Horizontal className={css.commandUnitName}>
                      {i + 1}
                      <Layout.Horizontal spacing="small" margin={{ left: 'small' }}>
                        <Icon name="command-shell-script" />
                        <Text lineClamp={1}>
                          {defaultTo(command.commandUnit.name, (command.commandUnit as any).identifier)}
                        </Text>
                      </Layout.Horizontal>
                    </Layout.Horizontal>

                    {getMultiTypeFromValue((command?.commandUnit as CopyCommandUnit).spec?.destinationPath) ===
                      MultiTypeInputType.RUNTIME && (
                      <Container className={css.textField}>
                        <MultiTypeTextField
                          label={
                            <Text
                              tooltipProps={{ dataTooltipId: 'destinationPath' }}
                              className={css.textFieldLabel}
                              color={Color.GREY_500}
                            >
                              {getString('cd.steps.commands.destinationPath')}
                            </Text>
                          }
                          name={`${prefix}spec.commandUnits[${i}].commandUnit.spec.destinationPath`}
                          multiTextInputProps={{
                            multiTextInputProps: { expressions, allowableTypes },
                            disabled: readonly,
                            placeholder: getString('cd.steps.commands.destinationPathPlaceholder')
                          }}
                        />
                      </Container>
                    )}

                    {getMultiTypeFromValue((command.commandUnit as CustomScriptCommandUnit)?.spec?.workingDirectory) ===
                      MultiTypeInputType.RUNTIME && (
                      <Container className={css.textField}>
                        <MultiTypeTextField
                          label={
                            <Text
                              tooltipProps={{ dataTooltipId: 'workingDirectory' }}
                              className={css.textFieldLabel}
                              color={Color.GREY_500}
                            >
                              {getString('workingDirectory')}
                            </Text>
                          }
                          name={`${prefix}spec.commandUnits[${i}].commandUnit.spec.workingDirectory`}
                          multiTextInputProps={{
                            multiTextInputProps: { expressions, allowableTypes },
                            disabled: readonly,
                            placeholder: getString('cd.enterWorkDirectory')
                          }}
                        />
                      </Container>
                    )}

                    {getMultiTypeFromValue(
                      (command.commandUnit as CustomScriptCommandUnit)?.spec?.source?.spec?.script
                    ) === MultiTypeInputType.RUNTIME ? (
                      <div className={cx(stepCss.formGroup, stepCss.alignStart, stepCss.md)}>
                        <MultiTypeFieldSelector
                          name={`${prefix}spec.commandUnits[${i}].commandUnit.spec.source.spec.script`}
                          label={getString('script')}
                          defaultValueToReset=""
                          disabled={readonly}
                          allowedTypes={allowableTypes}
                          disableTypeSelection={readonly}
                          skipRenderValueInExpressionLabel
                          useExecutionTimeInput={NG_EXECUTION_INPUT}
                          expressionRender={() => {
                            return (
                              <ShellScriptMonacoField
                                name={`${prefix}spec.commandUnits[${i}].commandUnit.spec.source.spec.script`}
                                scriptType={scriptType}
                                disabled={readonly}
                                expressions={expressions}
                              />
                            )
                          }}
                        >
                          <ShellScriptMonacoField
                            name={`${prefix}spec.commandUnits[${i}].commandUnit.spec.source.spec.script`}
                            scriptType={scriptType}
                            disabled={readonly}
                            expressions={expressions}
                          />
                        </MultiTypeFieldSelector>
                      </div>
                    ) : null}
                  </React.Fragment>
                ))}
              </>
            )
          }}
        />
      </Layout.Vertical>
    </div>
  )
}
