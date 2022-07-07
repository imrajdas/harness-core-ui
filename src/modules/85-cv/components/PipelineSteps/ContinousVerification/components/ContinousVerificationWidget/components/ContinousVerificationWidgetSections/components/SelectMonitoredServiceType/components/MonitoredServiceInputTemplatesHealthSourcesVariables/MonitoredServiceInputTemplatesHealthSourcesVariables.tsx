/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Card, FormInput, MultiTypeInputType, Text } from '@harness/uicore'
import React from 'react'
import { useStrings } from 'framework/strings'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import type { MonitoredServiceTemplateVariable } from '@cv/components/PipelineSteps/ContinousVerification/types'
import css from './MonitoredServiceInputTemplatesHealthSourcesVariables.module.scss'

interface MonitoredServiceInputTemplatesHealthSourcesVariablesProps {
  templateIdentifier: string
  versionLabel: string
  allowableTypes: MultiTypeInputType[]
  healthSourcesVariables: MonitoredServiceTemplateVariable[]
}

export default function MonitoredServiceInputTemplatesHealthSourcesVariables(
  props: MonitoredServiceInputTemplatesHealthSourcesVariablesProps
): JSX.Element {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const { allowableTypes, healthSourcesVariables } = props

  return (
    <>
      {Boolean(healthSourcesVariables?.length) && (
        <Card className={css.card}>
          <Text font={'normal'} style={{ paddingBottom: 'medium' }}>
            {getString('common.variables')}
          </Text>
          {healthSourcesVariables?.map((variable: MonitoredServiceTemplateVariable, index: number) => {
            return (
              <FormInput.MultiTextInput
                key={variable?.name}
                name={`spec.monitoredService.spec.templateInputs.variables.${index}.value`}
                label={variable?.name}
                multiTextInputProps={{
                  expressions,
                  allowableTypes
                }}
              />
            )
          })}
        </Card>
      )}
    </>
  )
}
