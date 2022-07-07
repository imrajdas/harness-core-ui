/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { GetDataError } from 'restful-react'
import { get, set, pick, debounce } from 'lodash-es'
import type { FormikErrors } from 'formik'
import { useParams } from 'react-router-dom'
import {
  Container,
  Layout,
  FlexExpander,
  ExpandingSearchInput,
  SelectOption,
  FormInput,
  MultiSelectOption,
  PageError,
  shouldShowError
} from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'

import { Dialog } from '@blueprintjs/core'
import { PageSpinner } from '@common/components'
import type { UseGetMockData } from '@common/utils/testUtils'
import FilterSelector from '@common/components/Filter/FilterSelector/FilterSelector'
import { Filter, FilterRef } from '@common/components/Filter/Filter'
import type { CrudOperation } from '@common/components/Filter/FilterCRUD/FilterCRUD'
import type { FilterInterface, FilterDataInterface } from '@common/components/Filter/Constants'
import {
  removeNullAndEmpty,
  isObjectEmpty,
  UNSAVED_FILTER,
  flattenObject
} from '@common/components/Filter/utils/FilterUtils'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'

import { useStrings } from 'framework/strings'
import {
  GetDelegateGroupsNGV2WithFilterQueryParams,
  useGetDelegateGroupsNGV2WithFilter,
  DelegateGroupDetails
} from 'services/portal'
import { usePostFilter, useUpdateFilter, useDeleteFilter, useGetFilterList } from 'services/cd-ng'
import type { FilterDTO, ResponsePageFilterDTO, Failure, DelegateFilterProperties } from 'services/cd-ng'
import useCreateDelegateModal from '@delegates/modals/DelegateModal/useCreateDelegateModal'
import DelegateInstallationError from '@delegates/components/CreateDelegate/components/DelegateInstallationError/DelegateInstallationError'
import { useToaster, StringUtils } from '@common/exports'
import DelegatesEmptyState from '@delegates/images/DelegatesEmptyState.svg'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { getDelegateStatusSelectOptions } from './utils/DelegateHelper'
import DelegateListingItem, { DelegateListingHeader } from './DelegateListingItem'

import css from './DelegatesPage.module.scss'

const POLLING_INTERVAL = 10000

const fullSizeContentStyle: React.CSSProperties = {
  width: '100%',
  height: '100%'
}

interface DelegatesListProps {
  filtersMockData?: UseGetMockData<ResponsePageFilterDTO>
}

export const DelegateListing: React.FC<DelegatesListProps> = ({ filtersMockData }) => {
  const { getRBACErrorMessage } = useRBACError()
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier, module } = useParams<Record<string, string>>()
  const [searchTerm, setSearchTerm] = useState('')
  const [showDelegateLoader, setShowDelegateLoader] = useState<boolean>(true)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<FilterDTO[]>()
  const [appliedFilter, setAppliedFilter] = useState<FilterDTO | null>()
  const { showError } = useToaster()
  const [delegateGroups, setDelegateGroups] = useState<Array<DelegateGroupDetails>>([])
  const [delegateFetchError, setDelegateFetchError] = useState<GetDataError<Failure | Error>>()
  const [isRefreshingFilters, setIsRefreshingFilters] = useState<boolean>(false)
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false)
  const filterRef = React.useRef<FilterRef<FilterDTO> | null>(null)

  const [troubleshoterOpen, setOpenTroubleshoter] = useState<
    { isConnected: boolean | undefined; delegateType: string | undefined } | undefined
  >(undefined)

  const queryParams: GetDelegateGroupsNGV2WithFilterQueryParams = useMemo(
    () =>
      ({
        accountId,
        orgId: orgIdentifier,
        projectId: projectIdentifier,
        module,
        pageIndex: page,
        pageSize: 10,
        searchTerm: ''
      } as GetDelegateGroupsNGV2WithFilterQueryParams),
    [accountId, module, orgIdentifier, projectIdentifier, page]
  )
  const { mutate: fetchDelegates, loading: isFetchingDelegates } = useGetDelegateGroupsNGV2WithFilter({ queryParams })
  const { openDelegateModal } = useCreateDelegateModal()

  useEffect(() => {
    setShowDelegateLoader(true)
    refetchDelegates(queryParams)
  }, [queryParams])

  const {
    loading: isFetchingFilters,
    data: fetchedFilterResponse,
    refetch: refetchFilterList
  } = useGetFilterList({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      type: 'Delegate'
    },
    mock: filtersMockData
  })

  useEffect(() => {
    setFilters(fetchedFilterResponse?.data?.content || [])
    setIsRefreshingFilters(isFetchingFilters)
  }, [fetchedFilterResponse])

  const refetchDelegates = useCallback(
    async (params: GetDelegateGroupsNGV2WithFilterQueryParams, filter?): Promise<void> => {
      const { delegateGroupIdentifier, delegateName, delegateType, description, hostName, status, delegateTags } =
        filter || {}
      if (params.searchTerm === '') {
        delete params.searchTerm
      }
      const requestBodyPayload = Object.assign(
        filter
          ? {
              delegateGroupIdentifier,
              delegateName,
              delegateType,
              description,
              hostName,
              status,
              delegateTags
            }
          : {},
        {
          filterType: 'Delegate'
        }
      )
      const sanitizedFilterRequest = removeNullAndEmpty(requestBodyPayload)
      try {
        setDelegateFetchError(undefined)
        const delegateResponse = await fetchDelegates(sanitizedFilterRequest, { queryParams: params })
        const delGroups = delegateResponse?.resource?.delegateGroupDetails || []
        if (delGroups) {
          delGroups.forEach((delegateGroup: DelegateGroupDetails) => {
            const delName = `${get(delegateGroup, 'groupName', '')} ${getString('delegate.instancesCount', {
              count: delegateGroup?.delegateInstanceDetails?.length,
              total: ''
            })}`
            set(delegateGroup, 'delegateName', delName)
          })
          setDelegateGroups(delGroups)
        }
      } catch (e) {
        if (shouldShowError(e)) {
          showError(getRBACErrorMessage(e))
        }
        setDelegateFetchError(e)
      } finally {
        setShowDelegateLoader(false)
      }
    },
    [fetchDelegates]
  )

  // Add polling
  useEffect(() => {
    let timeoutId = 0

    if (!isFetchingDelegates && !delegateFetchError && !isFilterOpen) {
      timeoutId = window.setTimeout(() => {
        setShowDelegateLoader(false)
        refetchDelegates({ ...queryParams, searchTerm }, appliedFilter?.filterProperties)
      }, POLLING_INTERVAL)
    }

    return () => {
      clearTimeout(timeoutId)
    }
  }, [isFetchingDelegates, delegateFetchError, refetchDelegates, isFilterOpen])

  const formatPayload = (data: FilterDataInterface<DelegateFilterProperties, FilterInterface>, isUpdate: boolean) => {
    const {
      metadata: { name: _name, filterVisibility, identifier },
      formValues: { delegateGroupIdentifier, delegateName, delegateType, description, hostName, status, delegateTags }
    } = data
    return {
      name: _name,
      identifier: isUpdate ? identifier : StringUtils.getIdentifierFromName(_name),
      projectIdentifier,
      orgIdentifier,
      filterVisibility: filterVisibility,
      filterProperties: {
        filterType: 'Delegate',
        delegateGroupIdentifier,
        delegateName,
        delegateType,
        description,
        hostName,
        status,
        delegateTags
      } as DelegateFilterProperties
    }
  }

  const handleSaveOrUpdate = async (
    isUpdate: boolean,
    data: FilterDataInterface<DelegateFilterProperties, FilterInterface>
  ): Promise<void> => {
    await setIsRefreshingFilters(true)
    const requestBodyPayload = formatPayload(data, isUpdate)
    const saveOrUpdateHandler = filterRef.current?.saveOrUpdateFilterHandler
    if (saveOrUpdateHandler && typeof saveOrUpdateHandler === 'function') {
      const updatedFilter = await saveOrUpdateHandler(isUpdate, requestBodyPayload)
      setAppliedFilter(updatedFilter)
    }
    await refetchFilterList()
    setIsRefreshingFilters(false)
  }

  const handleDelete = async (identifier: string): Promise<void> => {
    setIsRefreshingFilters(true)
    const deleteHandler = filterRef.current?.deleteFilterHandler
    if (deleteHandler && typeof deleteFilter === 'function') {
      await deleteHandler(identifier)
    }
    if (identifier === appliedFilter?.identifier) {
      reset()
    }
    await refetchFilterList()
    setIsRefreshingFilters(false)
  }

  const unsavedFilter = {
    name: UNSAVED_FILTER,
    identifier: StringUtils.getIdentifierFromName(UNSAVED_FILTER)
  }

  const handleFilterClick = (identifier: string): void => {
    if (identifier !== unsavedFilter.identifier) {
      setAppliedFilter(getFilterByIdentifier(identifier))
    }
  }

  const DelegateForm = (): React.ReactElement => {
    return (
      <>
        <FormInput.Text name={'delegateName'} label={getString('delegate.delegateName')} key={'delegateName'} />
        <FormInput.Text name={'delegateType'} label={getString('delegate.delegateType')} key={'delegateType'} />
        <FormInput.Text name={'description'} label={getString('description')} key={'description'} />
        <FormInput.Text name={'hostName'} label={getString('delegate.hostName')} key={'hostName'} />
        <FormInput.Select
          items={getDelegateStatusSelectOptions(getString)}
          name={'status'}
          label={getString('status')}
          key={'status'}
        />
        <FormInput.Text
          name={'delegateGroupIdentifier'}
          label={getString('delegates.delegateIdentifier')}
          key={'delegateGroupIdentifier'}
        />
        <FormInput.KVTagInput
          isArray={true}
          name="delegateTags"
          label={getString('delegate.delegateTags')}
          key="delegateTags"
        />
      </>
    )
  }

  const { mutate: createFilter } = usePostFilter({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { mutate: updateFilter } = useUpdateFilter({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { mutate: deleteFilter } = useDeleteFilter({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      type: 'Delegate'
    }
  })

  const [openFilterDrawer, hideFilterDrawer] = useModalHook(() => {
    const onFilterApply = (formData: Record<string, any>) => {
      if (!isObjectEmpty(formData)) {
        const filterFromFormData = { ...formData }
        const updatedQueryParams = {
          ...queryParams,
          searchTerm,
          pageIndex: 0
        }
        setShowDelegateLoader(true)
        refetchDelegates(updatedQueryParams, filterFromFormData)
        setAppliedFilter({ ...unsavedFilter, filterProperties: filterFromFormData })
        setPage(0)
        hideFilterDrawer()
        setIsFilterOpen(false)
      } else {
        showError(getString('filters.invalidCriteria'))
      }
    }

    const { delegateName, delegateGroupIdentifier, delegateType, description, hostName, status, delegateTags } =
      (appliedFilter?.filterProperties as any) || {}
    const { name = '', filterVisibility } = appliedFilter || {}
    return isFetchingFilters ? (
      <PageSpinner />
    ) : (
      <Filter<DelegateFilterProperties, FilterDTO>
        onApply={onFilterApply}
        onClose={() => {
          hideFilterDrawer()
          setIsFilterOpen(false)
          refetchFilterList()
        }}
        filters={filters}
        initialFilter={{
          formValues: {
            delegateName,
            delegateGroupIdentifier,
            delegateType,
            description,
            hostName,
            status,
            delegateTags
          },
          metadata: {
            name,
            filterVisibility: filterVisibility,
            identifier: appliedFilter?.identifier || '',
            filterProperties: {}
          }
        }}
        onSaveOrUpdate={handleSaveOrUpdate}
        onDelete={handleDelete}
        onFilterSelect={handleFilterClick}
        isRefreshingFilters={isRefreshingFilters}
        formFields={<DelegateForm />}
        onValidate={(values: Partial<DelegateFilterProperties>): FormikErrors<Partial<DelegateFilterProperties>> => {
          const errors: FormikErrors<{ description?: MultiSelectOption[] }> = {}
          if (values.description === '') {
            errors.description = ''
          }
          return errors
        }}
        dataSvcConfig={
          new Map<CrudOperation, (...rest: any[]) => Promise<any>>([
            ['ADD', createFilter],
            ['UPDATE', updateFilter],
            ['DELETE', deleteFilter]
          ])
        }
        onSuccessfulCrudOperation={refetchFilterList}
        ref={filterRef}
        onClear={reset}
      />
    )
  }, [isRefreshingFilters, filters, appliedFilter, searchTerm, queryParams])

  const reset = (): void => {
    setShowDelegateLoader(true)
    refetchDelegates(queryParams)
    setAppliedFilter(undefined)
    setDelegateFetchError(undefined)
  }

  const debouncedDelegateSearch = useCallback(
    debounce((query: string): void => {
      /* For a non-empty query string, always start from first page(index 0) */
      const updatedQueryParams = {
        ...queryParams,
        searchTerm: query,
        pageIndex: 0
      }
      setShowDelegateLoader(true)
      refetchDelegates(updatedQueryParams, appliedFilter?.filterProperties)
    }, 500),
    [refetchDelegates, appliedFilter?.filterProperties]
  )

  const getFilterByIdentifier = (identifier: string): FilterDTO | undefined =>
    /* istanbul ignore if */
    filters?.find((filter: FilterDTO) => filter.identifier?.toLowerCase() === identifier.toLowerCase())

  const handleFilterSelection = (
    option: SelectOption,
    event?: React.SyntheticEvent<HTMLElement, Event> | undefined
  ): void => {
    event?.stopPropagation()
    event?.preventDefault()
    /* istanbul ignore else */
    if (option.value) {
      const selectedFilter = getFilterByIdentifier(option.value?.toString())
      setAppliedFilter(selectedFilter)
      const updatedQueryParams = {
        ...queryParams,
        searchTerm,
        pageIndex: 0
      }
      setShowDelegateLoader(true)
      refetchDelegates(updatedQueryParams, selectedFilter?.filterProperties)
    } else {
      reset()
    }
  }

  const fieldToLabelMapping = new Map<string, string>()
  fieldToLabelMapping.set('delegateGroupIdentifier', getString('delegates.delegateIdentifier'))
  fieldToLabelMapping.set('delegateName', getString('delegate.delegateName'))
  fieldToLabelMapping.set('delegateType', getString('delegate.delegateType'))
  fieldToLabelMapping.set('description', getString('description'))
  fieldToLabelMapping.set('hostName', getString('delegate.hostName'))
  fieldToLabelMapping.set('status', getString('status'))
  fieldToLabelMapping.set('delegateTags', getString('delegate.delegateTags'))

  const permissionRequestNewDelegate = {
    resourceScope: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    permission: PermissionIdentifier.UPDATE_DELEGATE,
    resource: {
      resourceType: ResourceType.DELEGATE
    }
  }

  const hideHeader = delegateGroups.length === 0 && !appliedFilter && !searchTerm

  const newDelegateBtn = (
    <RbacButton
      intent="primary"
      text={hideHeader ? getString('delegates.createDelegate') : getString('delegates.newDelegate')}
      icon="plus"
      permission={permissionRequestNewDelegate}
      onClick={() => openDelegateModal()}
      id="newDelegateBtn"
      data-testid="newDelegateButton"
    />
  )

  return (
    <Container height="100%">
      <Dialog
        isOpen={!!troubleshoterOpen}
        enforceFocus={false}
        style={{ width: '680px', height: '100%' }}
        onClose={() => setOpenTroubleshoter(undefined)}
      >
        <DelegateInstallationError
          showDelegateInstalledMessage={false}
          delegateType={troubleshoterOpen?.delegateType}
        />
      </Dialog>
      {!hideHeader && (
        <Layout.Horizontal className={css.header}>
          {newDelegateBtn}
          <FlexExpander />
          <Layout.Horizontal spacing="xsmall">
            <ExpandingSearchInput
              alwaysExpanded
              width={250}
              placeholder={getString('search')}
              throttle={200}
              onChange={text => {
                debouncedDelegateSearch(text)
                setSearchTerm(text.trim())
              }}
              className={css.search}
            />
            <FilterSelector<FilterDTO>
              appliedFilter={appliedFilter}
              filters={filters}
              onFilterBtnClick={() => {
                openFilterDrawer()
                setIsFilterOpen(true)
              }}
              onFilterSelect={handleFilterSelection}
              fieldToLabelMapping={fieldToLabelMapping}
              filterWithValidFields={removeNullAndEmpty(
                pick(flattenObject(appliedFilter?.filterProperties || {}), ...fieldToLabelMapping.keys())
              )}
            />
          </Layout.Horizontal>
        </Layout.Horizontal>
      )}
      <Layout.Vertical className={css.listBody}>
        {showDelegateLoader ? (
          <Container style={fullSizeContentStyle}>
            <ContainerSpinner />
          </Container>
        ) : delegateFetchError && shouldShowError(delegateFetchError) ? (
          <div style={{ paddingTop: '200px' }}>
            <PageError
              message={(delegateFetchError?.data as Error)?.message || delegateFetchError?.message}
              onClick={(e: React.MouseEvent<Element, MouseEvent>) => {
                e.preventDefault()
                e.stopPropagation()
                reset()
              }}
            />
          </div>
        ) : (
          <Container className={css.delegateListContainer}>
            {delegateGroups.length ? (
              <Container width="100%">
                <DelegateListingHeader />
                {delegateGroups.map((delegate: DelegateGroupDetails) => (
                  <DelegateListingItem
                    key={delegate.delegateGroupIdentifier}
                    delegate={delegate}
                    setOpenTroubleshoter={() =>
                      setOpenTroubleshoter({
                        isConnected: troubleshoterOpen?.isConnected,
                        delegateType: delegate?.delegateType
                      })
                    }
                  />
                ))}
              </Container>
            ) : (
              <div className={css.emptyStateContainer}>
                <img src={DelegatesEmptyState} />
                <div className={css.emptyStateText}>
                  {projectIdentifier
                    ? getString('delegates.noDelegatesInProject')
                    : orgIdentifier
                    ? getString('delegates.noDelegatesInOrganization')
                    : getString('delegates.noDelegatesInAccount')}
                </div>
                {hideHeader && newDelegateBtn}
              </div>
            )}
          </Container>
        )}
      </Layout.Vertical>
    </Container>
  )
}
export default DelegateListing
