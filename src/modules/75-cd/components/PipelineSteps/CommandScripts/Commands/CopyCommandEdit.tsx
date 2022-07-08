/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { FormikProps } from 'formik'
import { Color, Container, FormInput, MultiTypeInputType, Text } from '@harness/uicore'

import { useStrings } from 'framework/strings'
import { MultiTypeTextField } from '@common/components/MultiTypeText/MultiTypeText'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { CommandUnitType, sourceTypeOptions } from '../CommandScriptsTypes'
import css from './CommandEdit.module.scss'

interface CopyCommandEditProps {
  formik: FormikProps<CommandUnitType>
  allowableTypes: MultiTypeInputType[]
  readonly?: boolean
}

export function CopyCommandEdit(props: CopyCommandEditProps): React.ReactElement {
  const { formik, readonly, allowableTypes } = props

  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()

  return (
    <>
      <FormInput.RadioGroup
        name="spec.sourceType"
        radioGroup={{ inline: true }}
        items={sourceTypeOptions}
        label={getString('cd.steps.commands.sourceTypeLabel')}
        disabled={readonly}
        onChange={(event: React.FormEvent<HTMLInputElement>) => {
          const currentValue = event.currentTarget?.value
          formik.setFieldValue('spec.sourceType', currentValue)
        }}
      />

      <Container className={css.destinationPath}>
        <MultiTypeTextField
          label={
            <Text
              tooltipProps={{ dataTooltipId: 'destinationPath' }}
              className={css.destinationPathLabel}
              color={Color.GREY_500}
            >
              {getString('cd.steps.commands.destinationPath')}
            </Text>
          }
          name="spec.destinationPath"
          multiTextInputProps={{
            multiTextInputProps: { expressions, allowableTypes },
            disabled: readonly,
            placeholder: getString('cd.steps.commands.destinationPathPlaceholder')
          }}
        />
      </Container>
    </>
  )
}
