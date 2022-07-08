/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Select, SelectOption, SelectProps } from '@wings-software/uicore'
import { EnvironmentResponseDTO, useGetEnvironmentListForProject } from 'services/cd-ng'
import { rewriteCurrentLocationWithActiveEnvironment } from '@cf/utils/CFUtils'

export interface UseEnvironmentSelectV2Params {
  selectedEnvironmentIdentifier?: string
  onChange?: (opt: SelectOption, environment: EnvironmentResponseDTO, userEvent: boolean) => void
  onEmpty?: () => void
}

export const useEnvironmentSelectV2 = (params: UseEnvironmentSelectV2Params) => {
  const { onChange = () => undefined, onEmpty = () => undefined, selectedEnvironmentIdentifier } = params
  const { projectIdentifier, orgIdentifier, accountId } = useParams<Record<string, string>>()
  const { data, loading, error, refetch } = useGetEnvironmentListForProject({
    queryParams: { accountId, orgIdentifier, projectIdentifier }
  })
  const [selectedEnvironment, setSelectedEnvironment] = useState<SelectOption>()
  const selectOptions: SelectOption[] =
    data?.data?.content?.map<SelectOption>(elem => ({
      label: elem.name as string,
      value: elem.identifier as string
    })) || []

  useEffect(() => {
    if (data?.data?.content?.length) {
      if (selectedEnvironmentIdentifier) {
        const found = data?.data?.content?.find(env => env.identifier === selectedEnvironmentIdentifier)

        if (found) {
          const newValue = {
            label: found.name as string,
            value: found.identifier as string
          }
          setSelectedEnvironment(newValue)
          onChange(newValue, found, false)
          rewriteCurrentLocationWithActiveEnvironment(found.identifier)
          return
        }
      }

      setSelectedEnvironment(selectOptions[0])
      onChange(selectOptions[0], data?.data?.content?.[0], false)
      rewriteCurrentLocationWithActiveEnvironment(data?.data?.content?.[0].identifier)
    } else if (data?.data?.content?.length === 0) {
      onEmpty()
      rewriteCurrentLocationWithActiveEnvironment()
    }
  }, [data?.data?.content?.length, data?.data?.content?.find, selectedEnvironmentIdentifier]) // eslint-disable-line

  return {
    EnvironmentSelect: function EnvironmentSelect(props: Partial<SelectProps>) {
      return (
        <Select
          value={selectedEnvironment}
          items={selectOptions}
          onChange={opt => {
            if (selectedEnvironment?.value !== opt.value) {
              setSelectedEnvironment(opt)
              onChange(
                opt,
                data?.data?.content?.find(env => env.identifier === opt.value) as EnvironmentResponseDTO,
                true
              )
              rewriteCurrentLocationWithActiveEnvironment(opt.value as string)
            }
          }}
          {...props}
        />
      )
    },
    loading,
    error,
    refetch,
    environments: data?.data?.content
  }
}
