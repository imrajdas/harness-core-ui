/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import * as Yup from 'yup'
import type { SelectOption } from '@harness/uicore'
import type { RadioButtonProps } from '@harness/uicore/dist/components/RadioButton/RadioButton'
import type { UseStringsReturn } from 'framework/strings'
import type {
  CopyCommandUnitSpec,
  ScriptCommandUnitSpec,
  ShellScriptInlineSource,
  ShellScriptSourceWrapper,
  StepCommandUnit,
  StepElementConfig,
  StepSpecType
} from 'services/cd-ng'

// Copy Command Unit type
export interface CopyCommandUnit extends StepCommandUnit {
  identifier: string
  spec: CopyCommandUnitSpec
}

// Script Command Unit
interface CustomShellScriptSourceWrapper extends ShellScriptSourceWrapper {
  spec: ShellScriptInlineSource
}
export interface CustomScriptCommandUnitSpec extends ScriptCommandUnitSpec {
  source: CustomShellScriptSourceWrapper
}
export interface CustomScriptCommandUnit extends StepCommandUnit {
  identifier: string
  spec: CustomScriptCommandUnitSpec
}

// Overall Command Unit Type
export type CommandUnitType = CopyCommandUnit | CustomScriptCommandUnit

interface CustomCommandUnitWrapper {
  commandUnit: CommandUnitType
}

export interface CommandScriptStepVariable {
  value: number | string
  id: string
  name?: string
  type?: 'String' | 'Number'
}

export interface CommandScriptsData extends StepElementConfig {
  spec: StepSpecType & {
    commandUnits?: CustomCommandUnitWrapper[]
    delegateSelectors?: string[]
    environmentVariables?: Array<Omit<CommandScriptStepVariable, 'id'>>
    outputVariables?: Array<Omit<CommandScriptStepVariable, 'id'>>
    metadata?: string
    onDelegate: boolean
  }
}

export interface CommandScriptsFormData extends StepElementConfig {
  spec: StepSpecType & {
    commandUnits?: CustomCommandUnitWrapper[]
    delegateSelectors?: string[]
    environmentVariables?: Array<CommandScriptStepVariable>
    outputVariables?: Array<CommandScriptStepVariable>
    metadata?: string
    onDelegate: boolean
  }
}

export const scriptInputType: SelectOption[] = [
  { label: 'String', value: 'String' },
  { label: 'Number', value: 'Number' }
]

export enum CommandType {
  Copy = 'Copy',
  Script = 'Script'
}

export const commandTypeOptions: SelectOption[] = [
  { label: 'Copy', value: 'Copy' },
  { label: 'Script', value: 'Script' }
]

export const sourceTypeOptions: RadioButtonProps[] = [
  { label: 'Artifact', value: 'Artifact' },
  { label: 'Config', value: 'Config' }
]

export const scriptTypeOptions: SelectOption[] = [{ label: 'Bash', value: 'Bash' }]

export const variableSchema = (
  getString: UseStringsReturn['getString']
): Yup.NotRequiredArraySchema<
  | {
      name: string
      value: string
      type: string
    }
  | undefined
> =>
  Yup.array().of(
    Yup.object({
      name: Yup.string().required(getString('common.validation.nameIsRequired')),
      value: Yup.string().required(getString('common.validation.valueIsRequired')),
      type: Yup.string().trim().required(getString('common.validation.typeIsRequired'))
    })
  )
