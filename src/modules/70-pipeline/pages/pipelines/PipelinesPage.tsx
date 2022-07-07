/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import {
  ExpandingSearchInput,
  HarnessDocTooltip,
  Icon,
  Layout,
  OverlaySpinner,
  SelectOption,
  Text,
  GridListToggle,
  Views,
  DropDown,
  shouldShowError,
  PageSpinner,
  ExpandingSearchInputHandle
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useModalHook } from '@harness/use-modal'
import { useHistory, useParams } from 'react-router-dom'
import type { FormikProps } from 'formik'
import { defaultTo, isEmpty, pick } from 'lodash-es'
import { Page, StringUtils, useToaster } from '@common/exports'
import routes from '@common/RouteDefinitions'
import {
  FilterDTO,
  GetFilterListQueryParams,
  GetPipelineListQueryParams,
  PagePMSPipelineSummaryResponse,
  PipelineFilterProperties,
  PMSPipelineSummaryResponse,
  ResponsePagePMSPipelineSummaryResponse,
  useDeleteFilter,
  useGetFilterList,
  useGetPipelineList,
  usePostFilter,
  useSoftDeletePipeline,
  useUpdateFilter
} from 'services/pipeline-ng'
import {
  useGetServiceListForProject,
  useGetEnvironmentListForProject,
  useGetServiceDefinitionTypes
} from 'services/cd-ng'
import { useDeepCompareEffect, useQueryParams, useUpdateQueryParams } from '@common/hooks'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import type { UseGetMockData } from '@common/utils/testUtils'
import { String, useStrings } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import type { PipelineType } from '@common/interfaces/RouteInterfaces'
import { Filter, FilterRef } from '@common/components/Filter/Filter'
import type { FilterDataInterface, FilterInterface } from '@common/components/Filter/Constants'
import type { CrudOperation } from '@common/components/Filter/FilterCRUD/FilterCRUD'
import FilterSelector from '@common/components/Filter/FilterSelector/FilterSelector'
import { getBuildType, getFilterByIdentifier } from '@pipeline/utils/PipelineExecutionFilterRequestUtils'
import {
  createRequestBodyPayload,
  getValidFilterArguments,
  PipelineFormType,
  getMultiSelectFormOptions
} from '@pipeline/utils/PipelineFilterRequestUtils'
import {
  isObjectEmpty,
  UNSAVED_FILTER,
  removeNullAndEmpty,
  flattenObject
} from '@common/components/Filter/utils/FilterUtils'
import GitFilters, { GitFilterScope } from '@common/components/GitFilters/GitFilters'
import { NavigatedToPage } from '@common/constants/TrackingConstants'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { deploymentTypeLabel } from '@pipeline/utils/DeploymentTypeUtils'
import useImportResource from '@pipeline/components/ImportResource/useImportResource'
import CreatePipelineButton from '@pipeline/components/CreatePipelineButton/CreatePipelineButton'
import { PreferenceScope, usePreferenceStore } from 'framework/PreferenceStore/PreferenceStoreContext'
import type { StoreType } from '@common/constants/GitSyncTypes'
import { ResourceType } from '@common/interfaces/GitSyncInterface'
import { PipelineGridView } from './views/PipelineGridView'
import { PipelineListView } from './views/PipelineListView'
import PipelineFilterForm from '../pipeline-deployment-list/PipelineFilterForm/PipelineFilterForm'
import pipelineIllustration from './images/deploypipeline-illustration.svg'
import buildpipelineIllustration from './images/buildpipeline-illustration.svg'
import flagpipelineIllustration from './images/flagpipeline-illustration.svg'
import type { QueryParams, StringQueryParams } from './types'
import css from './PipelinesPage.module.scss'

export enum Sort {
  DESC = 'DESC',
  ASC = 'ASC'
}

export enum SortFields {
  LastUpdatedAt = 'lastUpdatedAt',
  RecentActivity = 'executionSummaryInfo.lastExecutionTs',
  AZ09 = 'AZ09',
  ZA90 = 'ZA90',
  Name = 'name'
}

const defaultPageNumber = 0
const defaultSizeNumber = 20
export interface CDPipelinesPageProps {
  mockData?: UseGetMockData<ResponsePagePMSPipelineSummaryResponse>
}

function PipelinesPage({ mockData }: CDPipelinesPageProps): React.ReactElement {
  const { getString } = useStrings()
  const sortOptions: SelectOption[] = [
    {
      label: getString('recentActivity'),
      value: SortFields.RecentActivity
    },
    {
      label: getString('lastUpdatedSort'),
      value: SortFields.LastUpdatedAt
    },
    {
      label: getString('AZ09'),
      value: SortFields.AZ09
    },
    {
      label: getString('ZA90'),
      value: SortFields.ZA90
    }
  ]
  const UNSAVED_FILTER_IDENTIFIER = StringUtils.getIdentifierFromName(UNSAVED_FILTER)
  const filterRef = useRef<FilterRef<FilterDTO> | null>(null)
  const [filters, setFilters] = useState<FilterDTO[]>()
  const [isRefreshingFilters, setIsRefreshingFilters] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const { preference: savedPipelineView, setPreference: setSavedPipelineView } = usePreferenceStore<Views | undefined>(
    PreferenceScope.USER,
    'pipelineViewType'
  )
  const initialSelectedView = savedPipelineView || Views.GRID
  const [view, setView] = useState<Views>(initialSelectedView)
  const [appliedFilter, setAppliedFilter] = useState<FilterDTO | null>()

  // Set Default to LastUpdated
  const [selectedSort, setSelectedSort] = useState<SelectOption>(sortOptions[1])
  const [pipelineList, setPipelineList] = useState<PagePMSPipelineSummaryResponse | undefined>()
  const [isFetchingMetaData, setIsFetchingMetaData] = useState<boolean>(false)

  const { trackEvent } = useTelemetry()
  const history = useHistory()
  const { getRBACErrorMessage } = useRBACError()
  const { showSuccess, showError } = useToaster()
  const { selectedProject, isGitSyncEnabled } = useAppStore()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isReseting, setIsReseting] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [pipelineToDelete, setPipelineToDelete] = useState<PMSPipelineSummaryResponse>()
  const defaultSort = useMemo(() => [SortFields.LastUpdatedAt, Sort.DESC], [])
  const queryParams = useQueryParams<QueryParams>({
    processQueryParams(params: StringQueryParams) {
      let paramsFilters = {}

      try {
        paramsFilters = params.filters ? JSON.parse(params.filters) : undefined
      } catch (_e) {
        // do nothing
      }

      return {
        ...params,
        page: params.page || defaultPageNumber,
        size: params.size || defaultSizeNumber,
        sort: params.sort,
        filters: paramsFilters,
        searchTerm: params.searchTerm,
        repoIdentifier: params.repoIdentifier,
        branch: params.branch
      } as QueryParams
    }
  })
  const { searchTerm, repoIdentifier, branch: repoBranch, getDefaultFromOtherRepo, page, sort, size } = queryParams
  const { updateQueryParams, replaceQueryParams } = useUpdateQueryParams<Partial<StringQueryParams>>()

  const handleRepoChange = (filter: GitFilterScope) => {
    updateQueryParams({
      repoIdentifier: filter.repo || ([] as any),
      branch: filter.branch || ([] as any),
      getDefaultFromOtherRepo: filter.getDefaultFromOtherRepo || ([] as any),
      page: [] as any
    })
  }

  function handleQueryChange(query: string): void {
    if (query) {
      updateQueryParams({ searchTerm: query, page: defaultPageNumber.toString() })
    } else {
      updateQueryParams({ searchTerm: [] as any }) // removes the param
    }
  }

  const { projectIdentifier, orgIdentifier, accountId, module } = useParams<
    PipelineType<{
      projectIdentifier: string
      orgIdentifier: string
      accountId: string
    }>
  >()

  const isCDEnabled = (selectedProject?.modules && selectedProject.modules?.indexOf('CD') > -1) || false
  const isCIEnabled = (selectedProject?.modules && selectedProject.modules?.indexOf('CI') > -1) || false
  const isCIModule = module === 'ci'
  const isCFModule = module === 'cf'
  const searchRef = useRef<ExpandingSearchInputHandle>({} as ExpandingSearchInputHandle)
  const emptyStagePipelineImage = isCIModule
    ? buildpipelineIllustration
    : isCFModule
    ? flagpipelineIllustration
    : pipelineIllustration

  const setPipelineView = (viewType: Views): void => {
    setView(viewType)
    setSavedPipelineView(viewType)
  }

  useDeepCompareEffect(() => {
    setAppliedFilter(
      queryParams.filterIdentifier && queryParams.filterIdentifier !== UNSAVED_FILTER_IDENTIFIER
        ? getFilterByIdentifier(queryParams.filterIdentifier || '', filters)
        : queryParams.filters && !isEmpty(queryParams.filters)
        ? {
            name: UNSAVED_FILTER,
            identifier: UNSAVED_FILTER_IDENTIFIER,
            filterProperties: queryParams.filters,
            filterVisibility: undefined
          }
        : (null as any)
    )
  }, [queryParams, filters])

  const goToPipelineDetail = useCallback(
    (/* istanbul ignore next */ pipeline?: PMSPipelineSummaryResponse) => {
      history.push(
        routes.toPipelineDeploymentList({
          projectIdentifier,
          orgIdentifier,
          pipelineIdentifier: pipeline?.identifier || '-1',
          accountId,
          module,
          branch: pipeline?.gitDetails?.branch,
          repoIdentifier: pipeline?.gitDetails?.repoIdentifier,
          repoName: pipeline?.gitDetails?.repoName,
          connectorRef: pipeline?.connectorRef,
          storeType: pipeline?.storeType as StoreType
        })
      )
    },
    [projectIdentifier, orgIdentifier, history, accountId]
  )

  const goToPipeline = useCallback(
    (pipeline?: PMSPipelineSummaryResponse) => {
      history.push(
        routes.toPipelineStudio({
          projectIdentifier,
          orgIdentifier,
          pipelineIdentifier: pipeline?.identifier || '-1',
          accountId,
          module,
          branch: pipeline?.gitDetails?.branch,
          repoIdentifier: pipeline?.gitDetails?.repoIdentifier,
          repoName: pipeline?.gitDetails?.repoName,
          connectorRef: pipeline?.connectorRef,
          storeType: pipeline?.storeType as StoreType
        })
      )
    },
    [projectIdentifier, orgIdentifier, history, accountId]
  )

  const gitFilter: GitFilterScope = {
    repo: repoIdentifier || '',
    branch: repoBranch,
    getDefaultFromOtherRepo: getDefaultFromOtherRepo
  }

  const defaultQueryParamsForPiplines = {
    accountIdentifier: accountId,
    projectIdentifier,
    orgIdentifier,
    searchTerm,
    page,
    sort: sort?.split(',') || defaultSort,
    size,
    ...(gitFilter?.repo &&
      gitFilter.branch && {
        repoIdentifier: gitFilter.repo,
        branch: gitFilter.branch
      })
  }

  const { mutate: reloadPipelines, cancel } = useGetPipelineList({
    queryParams: defaultQueryParamsForPiplines,
    queryParamStringifyOptions: { arrayFormat: 'comma' },
    mock: mockData
  })

  const { mutate: deletePipeline } = useSoftDeletePipeline({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    }
  })

  const onImportSuccess = (): void => {
    fetchPipelines(defaultQueryParamsForPiplines)
  }

  const { showImportResourceModal } = useImportResource({
    resourceType: ResourceType.PIPELINES,
    modalTitle: getString('common.importEntityFromGit', { resourceType: getString('common.pipeline') }),
    onSuccess: onImportSuccess
  })

  const fetchPipelines = useCallback(
    async (params?: GetPipelineListQueryParams, formData?: PipelineFilterProperties): Promise<void> => {
      try {
        cancel()
        setError(null)
        const filter = Object.assign(
          {
            filterType: 'PipelineSetup'
          },
          isObjectEmpty(formData || {}) ? appliedFilter?.filterProperties : formData
        ) as PipelineFilterProperties
        setIsLoading(true)
        const { status, data } = await reloadPipelines(filter, { queryParams: params })
        if (status === 'SUCCESS') {
          setPipelineList(data)
        }
      } catch (e) {
        if (shouldShowError(e)) {
          showError(getRBACErrorMessage(e), undefined, 'pipeline.fetch.pipeline.error')
          setError(e)
        }
      }
      setIsLoading(false)
      setIsReseting(false)
    },
    [reloadPipelines, showError, cancel, appliedFilter]
  )

  useDocumentTitle([getString('pipelines')])

  const reset = (): void => {
    replaceQueryParams({})
  }

  /* #region FIlter CRUD operations */
  const defaultQueryParamsForFilters: GetFilterListQueryParams = {
    accountIdentifier: accountId,
    projectIdentifier,
    orgIdentifier,
    type: 'PipelineSetup'
  }

  const hasAppliedFilters = () => {
    if (queryParams.filterIdentifier || queryParams.filters) {
      return true
    }
    return false
  }

  const {
    loading: isFetchingFilters,
    data: fetchedFilterResponse,
    error: errorFetchingFilters,
    refetch: refetchFilterList
  } = useGetFilterList({
    queryParams: defaultQueryParamsForFilters
  })
  if (errorFetchingFilters && shouldShowError(errorFetchingFilters)) {
    showError(getRBACErrorMessage(errorFetchingFilters), undefined, 'pipeline.fetch.filter.error')
  }

  useEffect(() => {
    trackEvent(NavigatedToPage.PipelinesPage, {})
  }, [])

  useEffect(() => {
    setFilters(fetchedFilterResponse?.data?.content || [])
    setIsRefreshingFilters(isFetchingFilters)
  }, [fetchedFilterResponse])

  const { mutate: createFilter } = usePostFilter({
    queryParams: defaultQueryParamsForFilters
  })

  const { mutate: updateFilter } = useUpdateFilter({
    queryParams: defaultQueryParamsForFilters
  })

  const { mutate: deleteFilter } = useDeleteFilter({
    queryParams: defaultQueryParamsForFilters
  })
  /* #endregion */

  /* #region Filter interaction callback handlers */
  const handleSaveOrUpdate = async (
    isUpdate: boolean,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    data: FilterDataInterface<PipelineFormType, FilterInterface>
  ): Promise<void> => {
    setIsRefreshingFilters(true)
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

  /* #endregion CRUD filter interactions */

  const unsavedFilter = {
    name: UNSAVED_FILTER,
    identifier: StringUtils.getIdentifierFromName(UNSAVED_FILTER)
  }

  const { data: deploymentTypeResponse, loading: isFetchingDeploymentTypes } = useGetServiceDefinitionTypes({})
  const [deploymentTypeSelectOptions, setDeploymentTypeSelectOptions] = React.useState<SelectOption[]>([])

  React.useEffect(() => {
    if (!isEmpty(deploymentTypeResponse?.data) && deploymentTypeResponse?.data) {
      const options: SelectOption[] = deploymentTypeResponse.data
        .filter(deploymentType => deploymentType in deploymentTypeLabel)
        .map(type => ({
          label: getString(deploymentTypeLabel[type]),
          value: type as string
        }))
      setDeploymentTypeSelectOptions(options)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deploymentTypeResponse?.data])

  const {
    data: servicesResponse,
    loading: isFetchingServices,
    refetch: fetchServices
  } = useGetServiceListForProject({
    queryParams: { accountId, orgIdentifier, projectIdentifier },
    lazy: true
  })

  const {
    data: environmentsResponse,
    loading: isFetchingEnvironments,
    refetch: fetchEnvironments
  } = useGetEnvironmentListForProject({
    queryParams: { accountId, orgIdentifier, projectIdentifier },
    lazy: true
  })

  useEffect(() => {
    fetchServices()
    fetchEnvironments()
  }, [projectIdentifier])

  useEffect(() => {
    setIsFetchingMetaData(isFetchingDeploymentTypes && isFetchingServices && isFetchingEnvironments)
  }, [isFetchingDeploymentTypes, isFetchingServices, isFetchingEnvironments])

  const [openFilterDrawer, hideFilterDrawer] = useModalHook(() => {
    const onApply = (inputFormData: FormikProps<PipelineFormType>['values']) => {
      if (!isObjectEmpty(inputFormData)) {
        const filterFromFormData = getValidFilterArguments({ ...inputFormData })
        updateQueryParams({
          page: [] as any,
          filterIdentifier: [] as any,
          filters: JSON.stringify({ ...(filterFromFormData || {}) })
        })
        hideFilterDrawer()
      } else {
        showError(getString('filters.invalidCriteria'), undefined, 'pipeline.invalid.criteria.error')
      }
    }

    const handleFilterClick = (filterIdentifier: string): void => {
      if (filterIdentifier !== unsavedFilter.identifier) {
        updateQueryParams({
          filterIdentifier,
          filters: [] as any /* this will remove the param */
        })
      }
    }

    const {
      name: pipelineName,
      pipelineTags: _pipelineTags,
      moduleProperties,
      description
    } = (appliedFilter?.filterProperties as PipelineFilterProperties) || {}
    const { name = '', filterVisibility, identifier = '' } = appliedFilter || {}
    const { ci, cd } = moduleProperties || {}
    const { branch, tag, ciExecutionInfoDTO, repoName } = ci || {}
    const { deploymentTypes, environmentNames, infrastructureTypes, serviceNames } = cd || {}
    const { sourceBranch, targetBranch } = ciExecutionInfoDTO?.pullRequest || {}
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const buildType = getBuildType(moduleProperties || {})

    return isFetchingFilters && isFetchingMetaData ? (
      <div style={{ position: 'relative', height: 'calc(100vh - 128px)' }}>
        <OverlaySpinner show={true} className={css.loading}>
          <></>
        </OverlaySpinner>
      </div>
    ) : (
      <Filter<PipelineFormType, FilterDTO>
        formFields={
          <PipelineFilterForm<PipelineFormType>
            isCDEnabled={isCDEnabled}
            isCIEnabled={isCIEnabled}
            initialValues={{
              environments: getMultiSelectFormOptions(environmentsResponse?.data?.content),
              services: getMultiSelectFormOptions(servicesResponse?.data?.content),
              deploymentType: deploymentTypeSelectOptions
            }}
            type="PipelineSetup"
          />
        }
        initialFilter={{
          formValues: {
            name: pipelineName,
            pipelineTags: _pipelineTags?.reduce((obj, item) => Object.assign(obj, { [item.key]: item.value }), {}),
            description,
            branch,
            tag,
            sourceBranch,
            targetBranch,
            buildType,
            repositoryName: repoName ? repoName[0] : undefined,
            deploymentType: deploymentTypes,
            infrastructureType: infrastructureTypes ? infrastructureTypes[0] : undefined,
            services: getMultiSelectFormOptions(serviceNames),
            environments: getMultiSelectFormOptions(environmentNames)
          },
          metadata: { name, filterVisibility, identifier, filterProperties: {} }
        }}
        filters={filters}
        isRefreshingFilters={isRefreshingFilters || isFetchingMetaData}
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
        onSuccessfulCrudOperation={refetchFilterList}
      />
    )
  }, [
    isRefreshingFilters,
    appliedFilter,
    filters,
    module,
    environmentsResponse?.data?.content,
    servicesResponse?.data?.content
  ])

  /* #region Filter Selection */

  const handleFilterSelection = (
    option: SelectOption,
    event?: React.SyntheticEvent<HTMLElement, Event> | undefined
  ): void => {
    event?.stopPropagation()
    event?.preventDefault()
    /* istanbul ignore else */
    if (option.value) {
      updateQueryParams({
        filterIdentifier: option.value.toString(),
        filters: [] as any /* this will remove the param */
      })
    } else {
      reset()
    }
  }

  const fieldToLabelMapping = new Map<string, string>()
  fieldToLabelMapping.set('name', getString('name'))
  fieldToLabelMapping.set('description', getString('description'))
  fieldToLabelMapping.set('pipelineTags', getString('tagsLabel'))
  fieldToLabelMapping.set('sourceBranch', getString('common.sourceBranch'))
  fieldToLabelMapping.set('targetBranch', getString('common.targetBranch'))
  fieldToLabelMapping.set('branch', getString('pipelineSteps.deploy.inputSet.branch'))
  fieldToLabelMapping.set('tag', getString('tagLabel'))
  fieldToLabelMapping.set('repoNames', getString('common.repositoryName'))
  fieldToLabelMapping.set('buildType', getString('filters.executions.buildType'))
  fieldToLabelMapping.set('deploymentTypes', getString('deploymentTypeText'))
  fieldToLabelMapping.set('infrastructureTypes', getString('infrastructureTypeText'))
  fieldToLabelMapping.set('serviceNames', getString('services'))
  fieldToLabelMapping.set('environmentNames', getString('environments'))

  const filterWithValidFields = removeNullAndEmpty(
    pick(flattenObject(appliedFilter?.filterProperties || {}), ...fieldToLabelMapping.keys())
  )

  const filterWithValidFieldsWithMetaInfo =
    filterWithValidFields.sourceBranch && filterWithValidFields.targetBranch
      ? Object.assign(filterWithValidFields, { buildType: getString('filters.executions.pullOrMergeRequest') })
      : filterWithValidFields.branch
      ? Object.assign(filterWithValidFields, { buildType: getString('pipelineSteps.deploy.inputSet.branch') })
      : filterWithValidFields.tag
      ? Object.assign(filterWithValidFields, { buildType: getString('tagLabel') })
      : filterWithValidFields

  /* #endregion */

  useEffect(() => {
    cancel()
    setIsLoading(true)
    if (
      (isFetchingFilters === false && hasAppliedFilters() && fetchedFilterResponse?.data?.content) ||
      !hasAppliedFilters()
    ) {
      fetchPipelines(defaultQueryParamsForPiplines, appliedFilter?.filterProperties as PipelineFilterProperties)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    accountId,
    projectIdentifier,
    orgIdentifier,
    sort,
    appliedFilter?.filterProperties,
    module,
    searchTerm,
    repoIdentifier,
    repoBranch,
    getDefaultFromOtherRepo
  ])

  const shouldRenderFilterSelector = (): boolean => {
    if (isGitSyncEnabled) {
      if (pipelineList?.content?.length) {
        return true
      }
      if (appliedFilter || searchTerm) {
        return true
      }
      return false
    }
    return true
  }

  const onDeletePipeline = async (commitMsg: string): Promise<void> => {
    try {
      setIsDeleting(true)
      const gitParams = pipelineToDelete?.gitDetails?.objectId
        ? {
            ...pick(pipelineToDelete?.gitDetails, ['branch', 'repoIdentifier', 'filePath', 'rootFolder']),
            commitMsg,
            lastObjectId: pipelineToDelete?.gitDetails?.objectId
          }
        : {}

      const deleted = await deletePipeline(defaultTo(pipelineToDelete?.identifier, ''), {
        queryParams: {
          accountIdentifier: accountId,
          orgIdentifier,
          projectIdentifier,
          ...gitParams
        },
        headers: { 'content-type': 'application/json' }
      })
      setIsDeleting(false)

      /* istanbul ignore else */
      if (deleted?.status === 'SUCCESS') {
        showSuccess(getString('pipeline-list.pipelineDeleted', { name: pipelineToDelete?.name }))
      } else {
        throw getString('somethingWentWrong')
      }
      fetchPipelines()
    } catch (err) {
      setIsDeleting(false)
      /* istanbul ignore next */
      showError(getRBACErrorMessage(err), undefined, 'pipeline.delete.pipeline.error')
    }
  }

  if (isDeleting) {
    return <PageSpinner />
  }

  return (
    <>
      <Page.Header
        title={
          <div className="ng-tooltip-native">
            <h2 data-tooltip-id="pipelinesPageHeading"> {getString('pipelines')}</h2>
            <HarnessDocTooltip tooltipId="pipelinesPageHeading" useStandAlone={true} />
          </div>
        }
        breadcrumbs={<NGBreadcrumbs links={[]} />}
      ></Page.Header>
      {(isReseting || !!pipelineList?.content?.length || appliedFilter || isGitSyncEnabled || searchTerm) && (
        <Page.SubHeader>
          <Layout.Horizontal>
            <CreatePipelineButton
              label={getString('pipeline.newPipelineText')}
              iconName={'plus'}
              onCreatePipelineClick={() => goToPipeline()}
              onImportPipelineClick={showImportResourceModal}
            />
            {isGitSyncEnabled && (
              <GitSyncStoreProvider>
                <GitFilters
                  onChange={filter => {
                    handleRepoChange(filter)
                  }}
                  className={css.gitFilter}
                  defaultValue={gitFilter || undefined}
                />
              </GitSyncStoreProvider>
            )}
          </Layout.Horizontal>
          <Layout.Horizontal spacing="small" style={{ alignItems: 'center' }}>
            <>
              <ExpandingSearchInput
                alwaysExpanded
                width={200}
                placeholder={getString('search')}
                onChange={(text: string) => {
                  handleQueryChange(text)
                  setIsReseting(true)
                }}
                defaultValue={searchTerm}
                ref={searchRef}
                className={css.expandSearch}
              />
              {shouldRenderFilterSelector() && (
                <Layout.Horizontal padding={{ left: 'small', right: 'small' }}>
                  <FilterSelector<FilterDTO>
                    appliedFilter={appliedFilter as FilterDTO}
                    filters={filters}
                    onFilterBtnClick={openFilterDrawer}
                    onFilterSelect={handleFilterSelection}
                    fieldToLabelMapping={fieldToLabelMapping}
                    filterWithValidFields={filterWithValidFieldsWithMetaInfo}
                  />
                </Layout.Horizontal>
              )}
            </>
            <GridListToggle initialSelectedView={initialSelectedView} onViewToggle={setPipelineView} />
          </Layout.Horizontal>
        </Page.SubHeader>
      )}
      <Page.Body
        className={css.pageBody}
        error={error?.message}
        retryOnError={/* istanbul ignore next */ () => fetchPipelines()}
      >
        {!!pipelineList?.content?.length && (
          <Layout.Horizontal
            spacing="large"
            margin={{ left: 'large', top: 'large', bottom: 'large', right: 'large' }}
            className={css.topHeaderFields}
          >
            <Text color={Color.GREY_800} iconProps={{ size: 14 }}>
              {getString('total')}: {pipelineList?.totalElements}
            </Text>
            <DropDown
              items={sortOptions}
              value={selectedSort.value.toString()}
              filterable={false}
              width={180}
              icon={'main-sort'}
              iconProps={{ size: 16, color: Color.GREY_400 }}
              onChange={item => {
                let sortValue: string[] = []
                if (item.value === SortFields.AZ09) {
                  sortValue = [SortFields.Name, Sort.ASC]
                } else if (item.value === SortFields.ZA90) {
                  sortValue = [SortFields.Name, Sort.DESC]
                } else if (item.value === SortFields.LastUpdatedAt) {
                  sortValue = [SortFields.LastUpdatedAt, Sort.DESC]
                } else if (item.value === SortFields.RecentActivity) {
                  sortValue = [SortFields.RecentActivity, Sort.DESC]
                }
                updateQueryParams({
                  page: [] as any,
                  sort: sortValue.toString()
                })
                setSelectedSort(item)
              }}
            />
          </Layout.Horizontal>
        )}
        {isLoading || isFetchingFilters ? (
          <PageSpinner />
        ) : !pipelineList?.content?.length ? (
          <div className={css.noPipelineSection}>
            {appliedFilter || searchTerm ? (
              <Layout.Vertical spacing="small" flex>
                <Icon size={50} name={isCIModule ? 'ci-main' : 'cd-main'} margin={{ bottom: 'large' }} />
                <Text
                  margin={{ top: 'large', bottom: 'small' }}
                  font={{ weight: 'bold', size: 'medium' }}
                  color={Color.GREY_800}
                >
                  {getString('common.filters.noMatchingFilterData')}
                </Text>
                <String stringID="common.filters.clearFilters" className={css.clearFilterText} onClick={reset} />
              </Layout.Vertical>
            ) : (
              <Layout.Vertical spacing="small" flex={{ justifyContent: 'center', alignItems: 'center' }} width={720}>
                <img src={emptyStagePipelineImage} className={css.image} />
                <Text className={css.noPipelineText} margin={{ top: 'medium', bottom: 'small' }}>
                  {getString('pipeline.noPipelineText')}
                </Text>
                <Text className={css.aboutPipeline} margin={{ top: 'xsmall', bottom: 'xlarge' }}>
                  {getString('pipeline-list.aboutPipeline')}
                </Text>
                <CreatePipelineButton
                  label={getString('common.createPipeline')}
                  onCreatePipelineClick={() => goToPipeline()}
                  onImportPipelineClick={showImportResourceModal}
                />
              </Layout.Vertical>
            )}
          </div>
        ) : (
          <GitSyncStoreProvider>
            {view === Views.GRID ? (
              <PipelineGridView
                gotoPage={/* istanbul ignore next */ pageNumber => updateQueryParams({ page: pageNumber.toString() })}
                data={pipelineList}
                goToPipelineDetail={goToPipelineDetail}
                goToPipelineStudio={goToPipeline}
                refetchPipeline={fetchPipelines}
                onDeletePipeline={onDeletePipeline}
                onDelete={(pipeline: PMSPipelineSummaryResponse) => {
                  setPipelineToDelete(pipeline)
                }}
              />
            ) : (
              <PipelineListView
                gotoPage={/* istanbul ignore next */ pageNumber => updateQueryParams({ page: pageNumber.toString() })}
                data={pipelineList}
                goToPipelineDetail={goToPipelineDetail}
                goToPipelineStudio={goToPipeline}
                refetchPipeline={fetchPipelines}
                onDelete={(pipeline: PMSPipelineSummaryResponse) => {
                  setPipelineToDelete(pipeline)
                }}
                onDeletePipeline={onDeletePipeline}
              />
            )}
          </GitSyncStoreProvider>
        )}
      </Page.Body>
    </>
  )
}

export default PipelinesPage
