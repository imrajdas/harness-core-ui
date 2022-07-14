/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { MultiSelectOption, SelectOption } from '@harness/uicore'

import type { EnvironmentFilterProperties, FilterDTO } from 'services/cd-ng'

import { StringUtils } from '@common/exports'
import type { FilterDataInterface, FilterInterface } from '@common/components/Filter/Constants'

import { UNSAVED_FILTER } from '@common/components/Filter/utils/FilterUtils'
import type { PageQueryParams } from '../PageTemplate/PageTemplate'

export const getHasFilterIdentifier = (filterIdentifier?: string): boolean =>
  Boolean(filterIdentifier && filterIdentifier !== StringUtils.getIdentifierFromName(UNSAVED_FILTER))

export const getHasFilters = ({
  queryParams,
  filterIdentifier
}: {
  queryParams: PageQueryParams
  filterIdentifier?: string
  searchTerm?: string
}): boolean => {
  return [queryParams.filters, filterIdentifier].some(filter => filter !== undefined)
}
export interface EnvironmentsFilterFormType
  extends Omit<EnvironmentFilterProperties, 'environmentTypes' | 'environmentNames'> {
  environmentName?: string
  environments?: MultiSelectOption[]
  environmentTags?: Record<string, any>
  environmentTypes?: MultiSelectOption[]
}

export const createRequestBodyPayload = ({
  isUpdate,
  data,
  projectIdentifier,
  orgIdentifier
}: {
  isUpdate: boolean
  data: FilterDataInterface<EnvironmentsFilterFormType, FilterInterface>
  projectIdentifier: string
  orgIdentifier: string
}): FilterDTO => {
  const {
    metadata: { name, filterVisibility, identifier },
    formValues
  } = data
  const { environmentName, description, environmentTags, environments, environmentTypes } = formValues
  return {
    name,
    identifier: isUpdate ? identifier : StringUtils.getIdentifierFromName(name),
    filterVisibility: filterVisibility,
    projectIdentifier,
    orgIdentifier,
    filterProperties: {
      filterType: 'Environment',
      environmentNames: [environmentName],
      description: description,
      tags: environmentTags,
      environmentTypes: /* istanbul ignore next */ environmentTypes?.map(
        (environmentType: any) => environmentType?.value
      ),
      environmentIdentifiers: /* istanbul ignore next */ environments?.map((env: MultiSelectOption) => env?.value)
    } as EnvironmentFilterProperties
  }
}

export const getFilterByIdentifier = (identifier: string, filters?: FilterDTO[]): FilterDTO | undefined =>
  filters?.find((filter: FilterDTO) => filter.identifier?.toLowerCase() === identifier.toLowerCase())

export const getMultiSelectFromOptions = (values?: any[]): SelectOption[] | undefined => {
  return values?.map(item => {
    return { label: item.name ?? item, value: item.identifier ?? item }
  })
}
