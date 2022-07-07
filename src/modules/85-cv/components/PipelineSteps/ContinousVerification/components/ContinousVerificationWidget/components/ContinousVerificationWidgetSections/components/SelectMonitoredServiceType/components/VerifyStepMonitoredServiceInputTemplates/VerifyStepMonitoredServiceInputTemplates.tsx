/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Card, FormInput, MultiTypeInputType } from '@harness/uicore'
import { Text } from '@wings-software/uicore'
import cx from 'classnames'
import {
  useGetHarnessEnvironments,
  useGetHarnessServices
} from '@cv/components/HarnessServiceAndEnvironment/HarnessServiceAndEnvironment'
import { useStrings } from 'framework/strings'
import type { TemplateInputs } from '@cv/components/PipelineSteps/ContinousVerification/types'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import MonitoredServiceInputTemplatesHealthSources from '../MonitoredServiceInputTemplatesHealthSources/MonitoredServiceInputTemplatesHealthSources'
import MonitoredServiceInputTemplatesHealthSourcesVariables from '../MonitoredServiceInputTemplatesHealthSourcesVariables/MonitoredServiceInputTemplatesHealthSourcesVariables'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './VerifyStepMonitoredServiceInputTemplates.module.scss'

interface VerifyStepMonitoredServiceInputTemplatesProps {
  allowableTypes: MultiTypeInputType[]
  healthSources: TemplateInputs['sources']['healthSources']
  healthSourcesVariables: TemplateInputs['variables']
  versionLabel: string
  monitoredServiceTemplateRef: string
}

export default function VerifyStepMonitoredServiceInputTemplates(
  props: VerifyStepMonitoredServiceInputTemplatesProps
): JSX.Element {
  const { getString } = useStrings()
  const { allowableTypes, healthSources, healthSourcesVariables, versionLabel, monitoredServiceTemplateRef } = props
  const { expressions } = useVariablesExpression()
  const { serviceOptions } = useGetHarnessServices()
  const { environmentOptions } = useGetHarnessEnvironments()

  return (
    <>
      <Text padding={{ bottom: 'medium', top: 'medium' }}>{'Template Inputs'}</Text>
      <Card className={css.card}>
        <div className={cx(stepCss.formGroup)}>
          <FormInput.MultiTypeInput
            name="spec.monitoredService.spec.templateInputs.serviceRef"
            label={getString('cv.healthSource.serviceLabel')}
            selectItems={serviceOptions}
            multiTypeInputProps={{
              expressions,
              allowableTypes
            }}
            useValue
          />
        </div>

        <div className={cx(stepCss.formGroup)}>
          <FormInput.MultiTypeInput
            name="spec.monitoredService.spec.templateInputs.environmentRef"
            label={getString('cv.healthSource.environmentLabel')}
            selectItems={environmentOptions}
            multiTypeInputProps={{
              expressions,
              allowableTypes
            }}
            useValue
          />
        </div>
      </Card>
      <MonitoredServiceInputTemplatesHealthSources
        healthSources={healthSources}
        templateIdentifier={monitoredServiceTemplateRef}
        versionLabel={versionLabel}
        allowableTypes={allowableTypes}
      />
      <MonitoredServiceInputTemplatesHealthSourcesVariables
        healthSourcesVariables={healthSourcesVariables}
        templateIdentifier={monitoredServiceTemplateRef}
        versionLabel={versionLabel}
        allowableTypes={allowableTypes}
      />
    </>
  )
}
