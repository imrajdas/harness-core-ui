/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  SelectOption,
  FormInput,
  MultiTypeInputType,
  FormError,
  MultiTypeInput,
  Label,
  RUNTIME_INPUT_VALUE
} from '@wings-software/uicore'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { getPlaceholder, getTypeOfInput, setAppDynamicsApplication } from '../../AppDHealthSource.utils'
import { getInputGroupProps } from '../../../MonitoredServiceConnector.utils'
import css from '../../AppDHealthSource.module.scss'

interface AppDApplicationsInterface {
  applicationOptions: any
  applicationLoading: boolean
  connectorIdentifier: string
  formikAppDynamicsValue: any
  refetchTier: any
  setCustomFieldAndValidation: any
  isTemplate?: boolean
  expressions?: string[]
  applicationError?: string
  allowedTypes?: MultiTypeInputType[]
}

export default function AppDApplications({
  applicationOptions,
  applicationLoading,
  connectorIdentifier,
  formikAppDynamicsValue,
  refetchTier,
  setCustomFieldAndValidation,
  isTemplate,
  expressions,
  allowedTypes,
  applicationError
}: AppDApplicationsInterface): JSX.Element {
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()

  const queryParams = useMemo(() => {
    return {
      accountId,
      connectorIdentifier,
      orgIdentifier,
      projectIdentifier,
      offset: 0,
      pageSize: 10000
    }
  }, [])

  const [inputType, setInputType] = React.useState<MultiTypeInputType | undefined>(
    getTypeOfInput(formikAppDynamicsValue)
  )

  React.useEffect(() => {
    if (
      getTypeOfInput(connectorIdentifier) !== MultiTypeInputType.FIXED &&
      getTypeOfInput(formikAppDynamicsValue) !== MultiTypeInputType.FIXED
    ) {
      setInputType(getTypeOfInput(formikAppDynamicsValue))
    }
  }, [formikAppDynamicsValue])

  return isTemplate ? (
    <>
      <Label>{getString('cv.healthSource.connectors.AppDynamics.applicationLabel')}</Label>
      <MultiTypeInput
        key={inputType}
        name={'appdApplication'}
        placeholder={getPlaceholder(
          applicationLoading,
          'cv.healthSource.connectors.AppDynamics.applicationPlaceholder',
          getString
        )}
        selectProps={{
          items: applicationOptions
        }}
        multitypeInputValue={inputType}
        allowableTypes={allowedTypes}
        value={setAppDynamicsApplication(formikAppDynamicsValue, applicationOptions, inputType)}
        style={{ width: '300px' }}
        expressions={expressions}
        onChange={(item, _valueType, multiType) => {
          if (inputType !== multiType) {
            setInputType(multiType)
          }
          const selectedItem = item as string | SelectOption
          const selectedValue = typeof selectedItem === 'string' ? selectedItem : selectedItem?.label?.toString()
          if (selectedValue && selectedValue !== RUNTIME_INPUT_VALUE && !/^</.test(selectedValue)) {
            refetchTier({
              queryParams: {
                appName: selectedValue,
                ...queryParams
              }
            })
          }
          setCustomFieldAndValidation(selectedValue, true)
        }}
      />
      {applicationError && <FormError name={'appdApplication'} errorMessage={applicationError} />}
    </>
  ) : (
    <FormInput.Select
      className={css.applicationDropdown}
      onChange={item => {
        refetchTier({
          queryParams: {
            appName: item.label.toString(),
            ...queryParams
          }
        })
        setCustomFieldAndValidation(item.label, true)
      }}
      value={setAppDynamicsApplication(formikAppDynamicsValue, applicationOptions) as SelectOption}
      name={'appdApplication'}
      placeholder={getPlaceholder(
        applicationLoading,
        'cv.healthSource.connectors.AppDynamics.applicationPlaceholder',
        getString
      )}
      items={applicationOptions}
      label={getString('cv.healthSource.connectors.AppDynamics.applicationLabel')}
      {...getInputGroupProps(() => setCustomFieldAndValidation(''))}
    />
  )
}
