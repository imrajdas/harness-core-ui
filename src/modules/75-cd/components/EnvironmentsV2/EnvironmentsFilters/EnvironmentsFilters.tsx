/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import type { FormikProps } from 'formik'
import { isEmpty, pick } from 'lodash-es'

import { SelectOption, useToaster, MultiSelectOption, Layout } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import {
  usePostFilter,
  useUpdateFilter,
  useDeleteFilter,
  FilterDTO,
  useGetEnvironmentListForProject,
  NGTag
} from 'services/cd-ng'

import { StringUtils } from '@common/exports'
import { useBooleanStatus, useUpdateQueryParams } from '@common/hooks'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { Filter, FilterRef } from '@common/components/Filter/Filter'
import type { CrudOperation } from '@common/components/Filter/FilterCRUD/FilterCRUD'
import {
  isObjectEmpty,
  UNSAVED_FILTER,
  removeNullAndEmpty,
  flattenObject
} from '@common/components/Filter/utils/FilterUtils'
import type { FilterInterface, FilterDataInterface } from '@common/components/Filter/Constants'
import FilterSelector from '@common/components/Filter/FilterSelector/FilterSelector'

import { useFiltersContext } from '@cd/context/FiltersContext'

import EnvironmentsFilterForm from './EnvironmentsFilterForm'
import {
  createRequestBodyPayload,
  EnvironmentsFilterFormType,
  getFilterByIdentifier,
  getMultiSelectFromOptions
} from './filterUtils'
import type { PageQueryParams } from '../PageTemplate/PageTemplate'

const UNSAVED_FILTER_IDENTIFIER = StringUtils.getIdentifierFromName(UNSAVED_FILTER)

export default function EnvironmentsFilters(): React.ReactElement {
  const [loading, setLoading] = React.useState(false)
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { state: isFiltersDrawerOpen, open: openFilterDrawer, close: hideFilterDrawer } = useBooleanStatus()
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { updateQueryParams, replaceQueryParams } =
    useUpdateQueryParams<Partial<Record<keyof PageQueryParams, string>>>()
  const filterRef = React.useRef<FilterRef<FilterDTO> | null>(null)
  const { savedFilters: filters, isFetchingFilters, refetchFilters, queryParams } = useFiltersContext()

  const { mutate: createFilter } = usePostFilter({
    queryParams: { accountIdentifier: accountId }
  })

  const { mutate: updateFilter } = useUpdateFilter({
    queryParams: { accountIdentifier: accountId }
  })

  const { mutate: deleteFilter } = useDeleteFilter({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      type: 'Environment'
    }
  })

  const { data: environmentsResponse, loading: isFetchingEnvironments } = useGetEnvironmentListForProject({
    queryParams: { accountId, orgIdentifier, projectIdentifier },
    lazy: isFiltersDrawerOpen
  })

  const appliedFilter =
    queryParams.filterIdentifier && queryParams.filterIdentifier !== UNSAVED_FILTER_IDENTIFIER
      ? getFilterByIdentifier(queryParams.filterIdentifier, filters)
      : queryParams.filters && !isEmpty(queryParams.filters)
      ? {
          name: UNSAVED_FILTER,
          identifier: UNSAVED_FILTER_IDENTIFIER,
          filterProperties: queryParams.filters,
          filterVisibility: undefined
        }
      : null

  const { environmentName, description, environmentTags, environmentTypes, environmentIdentifiers } =
    (appliedFilter?.filterProperties as EnvironmentsFilterFormType) || {}
  const { name = '', filterVisibility, identifier = '' } = appliedFilter || {}
  const fieldToLabelMapping = React.useMemo(
    () =>
      new Map<string, string>([
        ['environmentName', getString('cd.environment.filters.environmentNamePlaceholder')],
        ['description', getString('description')],
        ['environmentTags', getString('tagsLabel')],
        ['environmentTypes', getString('envType')],
        ['environmentIdentifiers', getString('environments')]
      ]),
    [getString]
  )

  const filterWithValidFields = removeNullAndEmpty(
    pick(flattenObject(appliedFilter?.filterProperties || {}), ...fieldToLabelMapping.keys())
  )

  const handleFilterSelection = (
    option: SelectOption,
    event?: React.SyntheticEvent<HTMLElement, Event> | undefined
  ) => {
    event?.stopPropagation()
    event?.preventDefault()

    if (option.value) {
      updateQueryParams({
        filterIdentifier: option.value.toString(),
        filters: [] as any /* this will remove the param */
      })
    } else {
      updateQueryParams({
        filterIdentifier: [] as any /* this will remove the param */,
        filters: [] as any /* this will remove the param */
      })
    }
  }

  const onApply = (inputFormData: FormikProps<EnvironmentsFilterFormType>['values']) => {
    if (!isObjectEmpty(inputFormData)) {
      const filterFromFormData = {
        ...(inputFormData.environmentName && {
          environmentNames: [inputFormData.environmentName]
        }),
        ...(inputFormData.description && {
          description: inputFormData.description
        }),
        ...(inputFormData.environmentTags && {
          tags: inputFormData.environmentTags
        }),
        ...(inputFormData.environmentTypes && {
          environmentTypes: inputFormData.environmentTypes?.map((environmentType: any) => environmentType?.value)
        }),
        ...(inputFormData.environments?.length && {
          environmentIdentifiers: inputFormData.environments?.map((env: MultiSelectOption) => env?.value)
        })
      }
      updateQueryParams({ page: [] as any, filters: JSON.stringify({ ...(filterFromFormData || {}) }) })
      hideFilterDrawer()
    } else {
      showError(getString('filters.invalidCriteria'))
    }
  }

  const handleSaveOrUpdate = async (
    isUpdate: boolean,
    data: FilterDataInterface<EnvironmentsFilterFormType, FilterInterface>
  ) => {
    setLoading(true)
    const requestBodyPayload = createRequestBodyPayload({
      isUpdate,
      data,
      projectIdentifier,
      orgIdentifier
    })

    const saveOrUpdateHandler = filterRef.current?.saveOrUpdateFilterHandler
    if (saveOrUpdateHandler && typeof saveOrUpdateHandler === 'function') {
      const updatedFilter = await saveOrUpdateHandler(isUpdate, requestBodyPayload)
      updateQueryParams({ filters: JSON.stringify({ ...(updatedFilter || {}) }) })
    }

    setLoading(false)
    refetchFilters()
  }

  const handleDelete = async (filterIdentifier: string) => {
    setLoading(true)
    const deleteHandler = filterRef.current?.deleteFilterHandler
    if (deleteHandler && typeof deleteFilter === 'function') {
      await deleteHandler(filterIdentifier)
    }
    setLoading(false)

    if (filterIdentifier === appliedFilter?.identifier) {
      reset()
    }
    refetchFilters()
  }

  const handleFilterClick = (filterIdentifier: string) => {
    if (filterIdentifier !== UNSAVED_FILTER_IDENTIFIER) {
      updateQueryParams({
        filterIdentifier,
        filters: [] as any
      })
    }
  }

  const reset = () => {
    replaceQueryParams({})
  }

  return (
    <Layout.Horizontal padding={{ left: 'medium', right: 'small' }}>
      <FilterSelector<FilterDTO>
        appliedFilter={appliedFilter}
        filters={filters}
        onFilterBtnClick={openFilterDrawer}
        onFilterSelect={handleFilterSelection}
        fieldToLabelMapping={fieldToLabelMapping}
        filterWithValidFields={filterWithValidFields}
      />
      <Filter<EnvironmentsFilterFormType, FilterDTO>
        isOpen={isFiltersDrawerOpen}
        formFields={
          <EnvironmentsFilterForm environments={getMultiSelectFromOptions(environmentsResponse?.data?.content)} />
        }
        initialFilter={{
          formValues: {
            environmentName,
            description,
            environmentTags: environmentTags?.reduce(
              (obj: Record<string, any>, item: NGTag) => Object.assign(obj, { [item.key]: item.value }),
              {}
            ),
            environmentTypes: getMultiSelectFromOptions(environmentTypes),
            environments: getMultiSelectFromOptions(environmentIdentifiers)
          },
          metadata: { name, filterVisibility, identifier, filterProperties: {} }
        }}
        filters={filters}
        isRefreshingFilters={isFetchingFilters || isFetchingEnvironments || loading}
        onApply={onApply}
        onClose={() => hideFilterDrawer()}
        onSaveOrUpdate={handleSaveOrUpdate}
        onDelete={handleDelete}
        onFilterSelect={handleFilterClick}
        onClear={reset}
        ref={filterRef}
        dataSvcConfig={
          new Map<CrudOperation, (...rest: any[]) => Promise<any>>([
            ['ADD', createFilter],
            ['UPDATE', updateFilter],
            ['DELETE', deleteFilter]
          ])
        }
        onSuccessfulCrudOperation={() => refetchFilters()}
      />
    </Layout.Horizontal>
  )
}
