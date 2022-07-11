/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  SelectOption,
  FormInput,
  MultiTypeInputType,
  getMultiTypeFromValue,
  MultiTypeInput,
  Label,
  FormError,
  RUNTIME_INPUT_VALUE
} from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import { getPlaceholder, getTypeOfInput, setAppDynamicsTier } from '../../AppDHealthSource.utils'
import { getInputGroupProps } from '../../../MonitoredServiceConnector.utils'
import css from '../../AppDHealthSource.module.scss'

interface AppDynamicsTierInterface {
  isTemplate?: boolean
  expressions?: string[]
  tierOptions: SelectOption[]
  tierLoading: boolean
  formikValues: any
  onValidate: (
    appName: string,
    tierName: string,
    metricObject: {
      [key: string]: any
    }
  ) => Promise<void>
  setAppDTierCustomField: (tierValue: string) => void
  tierError?: string
}

export default function AppDynamicsTier({
  isTemplate,
  expressions,
  tierOptions,
  tierLoading,
  formikValues,
  onValidate,
  setAppDTierCustomField,
  tierError
}: AppDynamicsTierInterface): JSX.Element {
  const { getString } = useStrings()
  const allowedTypes =
    getMultiTypeFromValue(formikValues?.appdApplication) === MultiTypeInputType.RUNTIME ||
    getMultiTypeFromValue(formikValues?.appdApplication) === MultiTypeInputType.EXPRESSION
      ? [MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
      : [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]

  const [multitypeInputValue, setMultitypeInputValue] = React.useState<MultiTypeInputType | undefined>(
    getTypeOfInput(formikValues?.appDTier || formikValues?.appdApplication)
  )

  // React.useEffect(() => {
  //   setMultitypeInputValue(getTypeOfInput(formikValues?.appdApplication))
  // }, [formikValues?.appdApplication])

  return isTemplate ? (
    <>
      <Label>{getString('cv.healthSource.connectors.AppDynamics.trierLabel')}</Label>
      <MultiTypeInput
        key={multitypeInputValue + formikValues?.appdApplication}
        name={'appDTier'}
        placeholder={getPlaceholder(tierLoading, 'cv.healthSource.connectors.AppDynamics.tierPlaceholder', getString)}
        selectProps={{
          items: tierOptions
        }}
        allowableTypes={allowedTypes}
        value={setAppDynamicsTier(tierLoading, formikValues?.appDTier, tierOptions, multitypeInputValue)}
        style={{ width: '300px' }}
        expressions={expressions}
        multitypeInputValue={multitypeInputValue}
        onChange={async (item, _valueType, multiType) => {
          if (multitypeInputValue !== multiType) {
            setMultitypeInputValue(multiType)
          }
          const selectedItem = item as string | SelectOption
          const selectedValue = typeof selectedItem === 'string' ? selectedItem : selectedItem?.label?.toString()
          setAppDTierCustomField(selectedValue as string)
          if (!(formikValues?.appdApplication === RUNTIME_INPUT_VALUE || formikValues?.appDTier === '<+input>')) {
            await onValidate(formikValues?.appdApplication, selectedValue, formikValues.metricData)
          }
        }}
      />
      {tierError && <FormError name={'appdApplication'} errorMessage={tierError} />}
    </>
  ) : (
    <FormInput.Select
      className={css.tierDropdown}
      name={'appDTier'}
      placeholder={getPlaceholder(tierLoading, 'cv.healthSource.connectors.AppDynamics.tierPlaceholder', getString)}
      value={setAppDynamicsTier(tierLoading, formikValues?.appDTier, tierOptions) as SelectOption}
      onChange={async item => {
        setAppDTierCustomField(item.label)
        if (!(formikValues?.appdApplication === RUNTIME_INPUT_VALUE || formikValues?.appDTier === '<+input>')) {
          await onValidate(formikValues.appdApplication, item.label as string, formikValues.metricData)
        }
      }}
      items={tierOptions}
      label={getString('cv.healthSource.connectors.AppDynamics.trierLabel')}
      {...getInputGroupProps(() => setAppDTierCustomField(''))}
    />
  )
}
