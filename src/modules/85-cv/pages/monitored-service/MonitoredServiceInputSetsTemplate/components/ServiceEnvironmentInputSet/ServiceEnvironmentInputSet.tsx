/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Card, Color, SelectOption, Text } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import {
  useGetHarnessServices,
  useGetHarnessEnvironments,
  HarnessServiceAsFormField,
  HarnessEnvironmentAsFormField
} from '@cv/components/HarnessServiceAndEnvironment/HarnessServiceAndEnvironment'
import type { EnvironmentMultiSelectOrCreateProps } from '@cv/components/HarnessServiceAndEnvironment/components/EnvironmentMultiSelectAndEnv/EnvironmentMultiSelectAndEnv'
import type { EnvironmentSelectOrCreateProps } from '@cv/components/HarnessServiceAndEnvironment/components/EnvironmentSelectOrCreate/EnvironmentSelectOrCreate'
import { spacingMedium } from '../../MonitoredServiceInputSetsTemplate.constants'
import css from '@cv/pages/monitored-service/MonitoredServiceInputSetsTemplate/MonitoredServiceInputSetsTemplate.module.scss'

interface ServiceEnvironmentInputSetInterface {
  serviceValue: string
  environmentValue: string | SelectOption
  onChange: any
  isReadOnlyInputSet: boolean
}
export default function ServiceEnvironmentInputSet({
  serviceValue,
  environmentValue,
  isReadOnlyInputSet,
  onChange
}: ServiceEnvironmentInputSetInterface): JSX.Element {
  const { getString } = useStrings()
  const { serviceOptions, setServiceOptions } = useGetHarnessServices()
  const { environmentOptions, setEnvironmentOptions } = useGetHarnessEnvironments()
  const environmentRefValue = environmentOptions?.find(item => item?.value === environmentValue)

  return (
    <Card className={css.cardStyle}>
      <Text font={'medium'} color={Color.BLACK} style={{ paddingBottom: spacingMedium }}>
        {getString('cv.monitoredServices.serviceAndEnvironment')}
      </Text>
      {serviceValue !== undefined && (
        <HarnessServiceAsFormField
          customRenderProps={{
            name: 'serviceRef',
            label: getString('cv.healthSource.serviceLabel')
          }}
          serviceProps={{
            disabled: isReadOnlyInputSet,
            isMultiType: isReadOnlyInputSet,
            item: serviceOptions?.find(item => item?.value === serviceValue) || serviceValue,
            options: serviceOptions,
            onSelect: selectedService => onChange('serviceRef', selectedService.value),
            onNewCreated: newOption => {
              if (newOption?.identifier && newOption.name) {
                const newServiceOption = { label: newOption.name, value: newOption.identifier }
                setServiceOptions([newServiceOption, ...serviceOptions])
                onChange('serviceRef', newServiceOption.value)
              }
            }
          }}
        />
      )}
      {environmentValue !== undefined && (
        <HarnessEnvironmentAsFormField
          customRenderProps={{
            name: 'environmentRef',
            label: getString('cv.healthSource.environmentLabel')
          }}
          isMultiSelectField={false}
          environmentProps={
            {
              disabled: isReadOnlyInputSet,
              isMultiType: isReadOnlyInputSet,
              item: environmentRefValue || (environmentValue as SelectOption),
              onSelect: (selectedEnv: SelectOption) => onChange('environmentRef', selectedEnv.value),
              options: environmentOptions,
              onNewCreated: newOption => {
                if (newOption?.identifier && newOption.name) {
                  const newEnvOption = { label: newOption.name, value: newOption.identifier }
                  setEnvironmentOptions([newEnvOption, ...environmentOptions])
                  onChange('environmentRef', newEnvOption.value)
                }
              }
            } as EnvironmentMultiSelectOrCreateProps | EnvironmentSelectOrCreateProps
          }
        />
      )}
    </Card>
  )
}
