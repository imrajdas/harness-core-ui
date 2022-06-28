/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Layout,
  SelectOption,
  FormInput,
  MultiSelectOption,
  ExpandingSearchInput,
  Container,
  ButtonVariation,
  PageError,
  shouldShowError
} from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { useParams, useHistory } from 'react-router-dom'
import type { GetDataError } from 'restful-react'
import { debounce, pick } from 'lodash-es'
import type { FormikErrors } from 'formik'
import {
  useGetConnectorListV2,
  ResponsePageConnectorResponse,
  useGetConnectorCatalogue,
  ConnectorCatalogueItem,
  ResponseConnectorCatalogueResponse,
  useGetConnectorStatistics,
  useGetFilterList,
  FilterDTO,
  usePostFilter,
  useUpdateFilter,
  PageConnectorResponse,
  useDeleteFilter,
  ResponsePageFilterDTO,
  ResponseConnectorStatistics,
  GetConnectorListV2QueryParams,
  Failure,
  ConnectorInfoDTO
} from 'services/cd-ng'
import type { ConnectorFilterProperties } from 'services/cd-ng'
import type { UseGetMockData } from '@common/utils/testUtils'
import { Page, useToaster, StringUtils } from '@common/exports'
import { AddDrawer, PageSpinner } from '@common/components'
import {
  AddDrawerMapInterface,
  DrawerContext,
  CategoryInterface,
  ItemInterface
} from '@common/components/AddDrawer/AddDrawer'
import routes from '@common/RouteDefinitions'
import useCreateConnectorModal from '@connectors/modals/ConnectorModal/useCreateConnectorModal'
import { Filter, FilterRef } from '@common/components/Filter/Filter'
import {
  removeNullAndEmpty,
  isObjectEmpty,
  UNSAVED_FILTER,
  flattenObject
} from '@common/components/Filter/utils/FilterUtils'
import { useStrings } from 'framework/strings'
import type { FilterInterface, FilterDataInterface } from '@common/components/Filter/Constants'
import type { CrudOperation } from '@common/components/Filter/FilterCRUD/FilterCRUD'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import FilterSelector from '@common/components/Filter/FilterSelector/FilterSelector'
import { FeatureFlag } from '@common/featureFlags'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'

import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import GitFilters, { GitFilterScope } from '@common/components/GitFilters/GitFilters'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { Scope } from '@common/interfaces/SecretsInterface'
import ScopedTitle from '@common/components/Title/ScopedTitle'
import { useFeature } from '@common/hooks/useFeatures'
import type { CheckFeatureReturn } from 'framework/featureStore/featureStoreUtil'
import { FeatureWarningTooltip } from '@common/components/FeatureWarning/FeatureWarningWithTooltip'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { getLinkForAccountResources } from '@common/utils/BreadcrumbUtils'
import { Connectors } from '@connectors/constants'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { CE_CONNECTOR_CLICK, CONNECTORS_PAGE } from '@connectors/trackingConstants'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import ConnectorsListView from './views/ConnectorsListView'
import { getIconByType, getConnectorDisplayName } from './utils/ConnectorUtils'
import {
  createRequestBodyPayload,
  ConnectorFormType,
  getValidFilterArguments,
  renderItemByType,
  ConnectorStatCategories,
  getOptionsForMultiSelect,
  validateForm
} from './utils/RequestUtils'
import ConnectorsEmptyState from './images/connectors-empty-state.png'

import css from './ConnectorsPage.module.scss'

interface ConnectorsListProps {
  mockData?: UseGetMockData<ResponsePageConnectorResponse>
  catalogueMockData?: UseGetMockData<ResponseConnectorCatalogueResponse>
  statisticsMockData?: UseGetMockData<ResponseConnectorStatistics>
  filtersMockData?: UseGetMockData<ResponsePageFilterDTO>
}

const ConnectorsPage: React.FC<ConnectorsListProps> = ({ catalogueMockData, statisticsMockData, filtersMockData }) => {
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()
  const { isGitSyncEnabled } = useAppStore()
  const { accountId, projectIdentifier, orgIdentifier, module } = useParams<ProjectPathProps & ModulePathParams>()
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<FilterDTO[]>()
  const [appliedFilter, setAppliedFilter] = useState<FilterDTO | null>()
  const { showError } = useToaster()
  const [connectors, setConnectors] = useState<PageConnectorResponse | undefined>()
  const [loading, setLoading] = useState<boolean>(false)
  const [connectorFetchError, setConnectorFetchError] = useState<GetDataError<Failure | Error>>()
  const [isRefreshingFilters, setIsRefreshingFilters] = useState<boolean>(false)
  const [isFetchingStats, setIsFetchingStats] = useState<boolean>(false)
  const filterRef = React.useRef<FilterRef<FilterDTO> | null>(null)
  const [gitFilter, setGitFilter] = useState<GitFilterScope>({ repo: '', branch: '' })
  const [shouldApplyGitFilters, setShouldApplyGitFilters] = useState<boolean>()
  const [queryParamsWithGitContext, setQueryParamsWithGitContext] = useState<GetConnectorListV2QueryParams>({})
  const defaultQueryParams: GetConnectorListV2QueryParams = {
    pageIndex: page,
    pageSize: 10,
    projectIdentifier,
    orgIdentifier,
    accountIdentifier: accountId,
    searchTerm: ''
  }
  const defaultQueryParamsForConnectorStats: GetConnectorListV2QueryParams = {
    projectIdentifier,
    orgIdentifier,
    accountIdentifier: accountId
  }
  const history = useHistory()
  useDocumentTitle(getString('connectorsLabel'))
  const isCustomHealthEnabled = useFeatureFlag(FeatureFlag.CHI_CUSTOM_HEALTH)
  const isErrorTrackingEnabled = useFeatureFlag(FeatureFlag.ERROR_TRACKING_ENABLED)
  const isAzureEnabled = useFeatureFlag(FeatureFlag.NG_AZURE)
  const isOciHelmEnabled = useFeatureFlag(FeatureFlag.HELM_OCI_SUPPORT)
  const { trackEvent } = useTelemetry()

  const ConnectorCatalogueNames = new Map<ConnectorCatalogueItem['category'], string>()
  // This list will control which categories will be displayed in UI and its order
  const connectorCatalogueOrder: Array<ConnectorCatalogueItem['category']> = [
    'CLOUD_PROVIDER',
    'ARTIFACTORY',
    'CLOUD_COST',
    'CODE_REPO',
    'TICKETING',
    'MONITORING',
    'SECRET_MANAGER'
  ]

  ConnectorCatalogueNames.set('CLOUD_PROVIDER', getString('cloudProviders'))
  ConnectorCatalogueNames.set('ARTIFACTORY', getString('artifactRepositories'))
  ConnectorCatalogueNames.set('CODE_REPO', getString('codeRepositories'))
  ConnectorCatalogueNames.set('TICKETING', getString('ticketingSystems'))
  ConnectorCatalogueNames.set('MONITORING', getString('monitoringAndLoggingSystems'))
  ConnectorCatalogueNames.set('SECRET_MANAGER', getString('secretManagers'))
  ConnectorCatalogueNames.set('CLOUD_COST', getString('cloudCostsText'))

  /* #region Connector CRUD section */

  const { mutate: fetchConnectors } = useGetConnectorListV2({
    queryParams: defaultQueryParams
  })

  const refetchConnectorList = React.useCallback(
    async (
      params?: GetConnectorListV2QueryParams,
      filter?: ConnectorFilterProperties,
      needsRefinement = true
    ): Promise<void> => {
      setLoading(true)
      const { connectorNames, connectorIdentifiers, description, types, connectivityStatuses, tags } = filter || {}

      const requestBodyPayload = Object.assign(
        filter
          ? {
              connectorNames: typeof connectorNames === 'string' ? [connectorNames] : connectorNames,
              connectorIdentifiers:
                typeof connectorIdentifiers === 'string' ? [connectorIdentifiers] : connectorIdentifiers,
              description,
              types: needsRefinement ? types?.map(type => type?.toString()) : types,
              connectivityStatuses: needsRefinement
                ? connectivityStatuses?.map(status => status?.toString())
                : connectivityStatuses,
              tags
            }
          : {},
        {
          filterType: 'Connector'
        }
      ) as ConnectorFilterProperties
      const sanitizedFilterRequest = removeNullAndEmpty(requestBodyPayload)
      try {
        const { status, data } = await fetchConnectors(sanitizedFilterRequest, { queryParams: params })
        /* istanbul ignore else */ if (status === 'SUCCESS') {
          setConnectors(data)
          setConnectorFetchError(undefined)
        }
      } /* istanbul ignore next */ catch (e) {
        if (shouldShowError(e)) {
          showError(getRBACErrorMessage(e))
        }
        setConnectorFetchError(e)
      }
      setLoading(false)
    },
    [fetchConnectors]
  )

  /* Different ways to trigger filter search */

  /* Initial page load */
  useEffect(() => {
    refetchConnectorList({ ...defaultQueryParams, searchTerm, pageIndex: 0 })
    setPage(0)
  }, [projectIdentifier, orgIdentifier])

  /* Through page browsing */
  useEffect(() => {
    const updatedQueryParams = {
      ...(shouldApplyGitFilters ? queryParamsWithGitContext : defaultQueryParams),
      searchTerm,
      pageIndex: page
    }
    refetchConnectorList(updatedQueryParams, appliedFilter?.filterProperties)
  }, [page])

  /* Through git filter */
  useEffect(() => {
    const shouldApply = isGitSyncEnabled && !!gitFilter.repo && !!gitFilter.branch
    const updatedQueryParams = { ...defaultQueryParams, repoIdentifier: gitFilter.repo, branch: gitFilter.branch }
    /* Fetch all connectors and stats for filter panel per repo and branch */
    Promise.all([
      refetchConnectorList(
        {
          ...(shouldApply ? updatedQueryParams : defaultQueryParams),
          searchTerm,
          /* For every git-filter, always start from first page(index 0) */
          pageIndex: 0
        },
        appliedFilter?.filterProperties
      ),
      fetchConnectorStats({
        queryParams: shouldApply
          ? {
              ...defaultQueryParamsForConnectorStats,
              repoIdentifier: gitFilter.repo,
              branch: gitFilter.branch
            }
          : defaultQueryParamsForConnectorStats
      })
    ])
    setShouldApplyGitFilters(shouldApply)
    setQueryParamsWithGitContext(updatedQueryParams)
  }, [gitFilter])

  /* Through expandable filter text search */
  const debouncedConnectorSearch = useCallback(
    debounce((query: string): void => {
      /* For a non-empty query string, always start from first page(index 0) */
      const updatedQueryParams = {
        ...(shouldApplyGitFilters ? queryParamsWithGitContext : defaultQueryParams),
        searchTerm: query,
        pageIndex: 0
      }
      if (query) {
        refetchConnectorList(updatedQueryParams, appliedFilter?.filterProperties)
      } /* on clearing query */ else {
        page === 0
          ? /* fetch connectors for 1st page */ refetchConnectorList(
              updatedQueryParams,
              appliedFilter?.filterProperties
            )
          : /* or navigate to first page */ setPage(0)
      }
    }, 500),
    [refetchConnectorList, appliedFilter?.filterProperties, shouldApplyGitFilters, queryParamsWithGitContext]
  )

  /* Clearing filter from Connector Filter Panel */
  const reset = (): void => {
    refetchConnectorList({ ...(shouldApplyGitFilters ? queryParamsWithGitContext : defaultQueryParams), searchTerm })
    setAppliedFilter(undefined)
    setConnectorFetchError(undefined)
  }

  /* #endregion */

  /* #region Create Connector Catalogue section */

  const computeDrawerMap = (
    catalogueData: ResponseConnectorCatalogueResponse | null,
    featureInfo: CheckFeatureReturn
  ): AddDrawerMapInterface => {
    const originalData = catalogueData?.data?.catalogue || []
    originalData.forEach(value => {
      if (value.category === 'SECRET_MANAGER') {
        value.connectors = ['Vault', 'AwsKms', 'AzureKeyVault', 'AwsSecretManager', 'GcpKms']
      }
    })
    const orderedCatalogue: ConnectorCatalogueItem[] | { category: string; connectors: string[] } = []
    connectorCatalogueOrder.forEach(catalogueItem => {
      const catalogueEntry = originalData.find(item => item['category'] === catalogueItem)
      if (catalogueEntry && !(projectIdentifier != undefined && catalogueEntry.category == 'CLOUD_COST')) {
        // CLOUD_COST should not be displayed at project level drawer
        orderedCatalogue.push(catalogueEntry)
      }
    })

    const k8sLimitWarningRenderer = () => {
      const { featureDetail: { count, limit } = {} } = featureInfo
      return (
        <section className={css.limitWarningTooltipCtn}>
          <FeatureWarningTooltip
            featureName={FeatureIdentifier.CCM_K8S_CLUSTERS}
            warningMessage={getString('connectors.ceK8.featureWarning', { count, limit })}
          />
        </section>
      )
    }

    const RestrictionLimitWarningRenderers: Record<string, (item: ItemInterface) => React.ReactNode> = {
      CEK8sCluster: k8sLimitWarningRenderer
    }

    const isRestrictedConnector = (item: ConnectorCatalogueItem, connector: string) => {
      if (!item.category) {
        return false
      }

      // TODO: make it generic
      return connector === 'CEK8sCluster' && !featureInfo.enabled
    }

    const filterConnectors = (connector: string): boolean => {
      switch (connector) {
        case Connectors.ERROR_TRACKING:
          return isErrorTrackingEnabled
        case Connectors.AZURE:
          return isAzureEnabled
        case Connectors.OciHelmRepo:
          return isOciHelmEnabled
        default:
          return true
      }
    }

    return Object.assign(
      {},
      {
        drawerLabel: 'Connectors',
        categories:
          orderedCatalogue.map((item: ConnectorCatalogueItem) => {
            return {
              categoryLabel: ConnectorCatalogueNames.get(item['category']) || '',
              warningTooltipRenderer: i => {
                const renderer = RestrictionLimitWarningRenderers[i.value]
                return renderer && renderer(i)
              },
              items:
                item.connectors
                  ?.filter(connector => filterConnectors(connector))
                  .sort((a, b) => (getConnectorDisplayName(a) < getConnectorDisplayName(b) ? -1 : 1))
                  .filter(entry => {
                    const name = entry.valueOf() || ''
                    if (name !== 'CustomHealth') return true
                    return isCustomHealthEnabled !== false
                  })
                  .map(entry => {
                    const name = entry.valueOf() || ''
                    return {
                      itemLabel: getConnectorDisplayName(entry) || name,
                      iconName: getIconByType(entry),
                      value: name,
                      disabled: isRestrictedConnector(item, entry)
                    }
                  }) || []
            } as CategoryInterface
          }) || []
      }
    )
  }

  const featureInfo = useFeature({
    featureRequest: {
      featureName: FeatureIdentifier.CCM_K8S_CLUSTERS
    }
  })

  const { data: catalogueData, loading: loadingCatalogue } = useGetConnectorCatalogue({
    queryParams: { accountIdentifier: accountId },
    mock: catalogueMockData
  })

  const {
    loading: isFetchingConnectorStats,
    data: metaData,
    refetch: fetchConnectorStats
  } = useGetConnectorStatistics({ queryParams: defaultQueryParamsForConnectorStats, mock: statisticsMockData })

  useEffect(() => {
    setIsFetchingStats(isFetchingConnectorStats)
  }, [isFetchingConnectorStats])

  const refetchAllConnectorsWithStats = async (): Promise<void> => {
    const __params = shouldApplyGitFilters ? queryParamsWithGitContext : defaultQueryParams
    Promise.all([
      refetchConnectorList(
        {
          ...__params,
          searchTerm
        },
        appliedFilter?.filterProperties
      ),
      fetchConnectorStats({
        queryParams: shouldApplyGitFilters
          ? {
              ...defaultQueryParamsForConnectorStats,
              repoIdentifier: queryParamsWithGitContext.repoIdentifier,
              branch: queryParamsWithGitContext.branch
            }
          : defaultQueryParamsForConnectorStats
      })
    ])
  }

  const { openConnectorModal } = useCreateConnectorModal({
    onSuccess: refetchAllConnectorsWithStats,
    onClose: refetchAllConnectorsWithStats
  })

  const rerouteBasedOnContext = (): void => {
    history.push(routes.toCreateConnectorFromYaml({ accountId, projectIdentifier, orgIdentifier, module }))
  }

  const [openDrawer, hideDrawer] = useModalHook(() => {
    const onSelect = (val: ItemInterface): void => {
      if (
        [Connectors.CE_AZURE, Connectors.CE_KUBERNETES, Connectors.CE_GCP, Connectors.CEAWS].includes(val.value as any)
      ) {
        trackEvent(CE_CONNECTOR_CLICK, {
          connectorType: val.value,
          page: CONNECTORS_PAGE
        })
      }
      openConnectorModal(false, val?.value as ConnectorInfoDTO['type'], undefined)
      hideDrawer()
    }

    return loadingCatalogue ? (
      <PageSpinner />
    ) : (
      <AddDrawer
        addDrawerMap={computeDrawerMap(catalogueData, featureInfo)}
        onSelect={onSelect}
        onClose={hideDrawer}
        drawerContext={DrawerContext.PAGE}
        showRecentlyUsed={false}
      />
    )
  }, [catalogueData, featureInfo])

  /* #endregion */

  /* #region Connector Filter CRUD Section */

  const ConnectorForm = (): React.ReactElement => {
    return (
      <>
        <FormInput.MultiSelect
          items={getOptionsForMultiSelect(ConnectorStatCategories.TYPE, metaData || {})}
          name="types"
          label={getString('typeLabel')}
          key="types"
          multiSelectProps={{
            allowCreatingNewItems: false
          }}
        />
        <FormInput.KVTagInput name="tags" label={getString('tagsLabel')} key="tags" />
        <FormInput.MultiSelect
          items={getOptionsForMultiSelect(ConnectorStatCategories.STATUS, metaData || {})}
          name="connectivityStatuses"
          label={getString('connectivityStatus')}
          key="connectivityStatuses"
          multiSelectProps={{
            allowCreatingNewItems: false
          }}
        />
        <FormInput.Text name={'connectorNames'} label={getString('connectors.name')} key={'connectorNames'} />
        <FormInput.Text name={'connectorIdentifiers'} label={getString('identifier')} key={'connectorIdentifiers'} />
        <FormInput.Text name={'description'} label={getString('description')} key={'description'} />
      </>
    )
  }

  const {
    loading: isFetchingFilters,
    data: fetchedFilterResponse,
    refetch: refetchFilterList
  } = useGetFilterList({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      type: 'Connector'
    },
    mock: filtersMockData
  })

  useEffect(() => {
    setFilters(fetchedFilterResponse?.data?.content || [])
    setIsRefreshingFilters(isFetchingFilters)
  }, [fetchedFilterResponse])

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
      type: 'Connector'
    }
  })

  const getFilterByIdentifier = (identifier: string): FilterDTO | undefined =>
    /* istanbul ignore if */
    filters?.find((filter: FilterDTO) => filter.identifier?.toLowerCase() === identifier.toLowerCase())

  const getMultiSelectFormOptions = (values?: any[]): SelectOption[] | undefined => {
    /* istanbul ignore if */
    return values?.map(item => {
      return { label: item, value: item }
    })
  }

  const handleSaveOrUpdate = async (
    isUpdate: boolean,
    data: FilterDataInterface<ConnectorFormType, FilterInterface>
  ): Promise<void> => {
    setIsRefreshingFilters(true)
    const requestBodyPayload = createRequestBodyPayload({ isUpdate, data, projectIdentifier, orgIdentifier })
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

  const typeMultiSelectValues = getOptionsForMultiSelect(ConnectorStatCategories.TYPE, metaData || {})?.map(
    option => option.value
  ) as string[]
  const connectivityStatusMultiValues = getOptionsForMultiSelect(ConnectorStatCategories.STATUS, metaData || {})?.map(
    option => option.value
  ) as string[]

  const [openFilterDrawer, hideFilterDrawer] = useModalHook(() => {
    const onFilterApply = (formData: Record<string, any>) => {
      if (!isObjectEmpty(formData)) {
        const filterFromFormData = getValidFilterArguments({ ...formData })
        const updatedQueryParams = {
          ...(shouldApplyGitFilters ? queryParamsWithGitContext : defaultQueryParams),
          searchTerm,
          pageIndex: 0
        }
        refetchConnectorList(updatedQueryParams, filterFromFormData, false)
        setAppliedFilter({ ...unsavedFilter, filterProperties: filterFromFormData })
        setPage(0)
        hideFilterDrawer()
      } else {
        showError(getString('filters.invalidCriteria'))
      }
    }

    const { connectorNames, connectorIdentifiers, description, types, connectivityStatuses, tags } =
      (appliedFilter?.filterProperties as ConnectorFilterProperties) || {}
    const { name = '', filterVisibility } = appliedFilter || {}
    return isFetchingStats ? (
      <PageSpinner />
    ) : (
      <Filter<ConnectorFormType, FilterDTO>
        onApply={onFilterApply}
        onClose={() => {
          hideFilterDrawer()
          refetchFilterList()
        }}
        filters={filters}
        initialFilter={{
          formValues: {
            connectorNames,
            connectorIdentifiers,
            description,
            types: getMultiSelectFormOptions(types),
            connectivityStatuses: getMultiSelectFormOptions(connectivityStatuses),
            tags
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
        isRefreshingFilters={isRefreshingFilters || isFetchingStats}
        formFields={<ConnectorForm />}
        onValidate={(values: Partial<ConnectorFormType>): FormikErrors<Partial<ConnectorFormType>> => {
          const errors: FormikErrors<{ types?: MultiSelectOption[]; connectivityStatuses?: MultiSelectOption[] }> = {}
          const { typeErrors, connectivityStatusErrors } = validateForm(
            values,
            typeMultiSelectValues,
            connectivityStatusMultiValues,
            metaData || {}
          )
          if (typeErrors?.size > 0) {
            errors.types = getString('filters.invalidSelection') + ': ' + renderItemByType(Array.from(typeErrors))
          }
          if (connectivityStatusErrors?.size > 0) {
            errors.connectivityStatuses =
              getString('filters.invalidSelection') + ': ' + renderItemByType(Array.from(connectivityStatusErrors))
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
  }, [
    isRefreshingFilters,
    filters,
    appliedFilter,
    isFetchingStats,
    searchTerm,
    shouldApplyGitFilters,
    queryParamsWithGitContext
  ])

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
        ...(shouldApplyGitFilters ? queryParamsWithGitContext : defaultQueryParams),
        searchTerm,
        pageIndex: 0
      }
      refetchConnectorList(updatedQueryParams, selectedFilter?.filterProperties, false)
    } else {
      reset()
    }
  }

  const fieldToLabelMapping = new Map<string, string>()
  fieldToLabelMapping.set('connectorNames', getString('connectors.name'))
  fieldToLabelMapping.set('connectorIdentifiers', getString('identifier'))
  fieldToLabelMapping.set('description', getString('description'))
  fieldToLabelMapping.set('types', getString('typeLabel'))
  fieldToLabelMapping.set('tags', getString('tagsLabel'))
  fieldToLabelMapping.set('connectivityStatuses', getString('connectivityStatus'))

  /* #endregion */

  return (
    <>
      <Page.Header
        title={
          <ScopedTitle
            title={{
              [Scope.PROJECT]: getString('connectorsLabel'),
              [Scope.ORG]: getString('connectors.connectorsTitle'),
              [Scope.ACCOUNT]: getString('connectors.connectorsTitle')
            }}
          />
        }
        breadcrumbs={
          <NGBreadcrumbs
            links={getLinkForAccountResources({ accountId, orgIdentifier, projectIdentifier, getString })}
          />
        }
      />
      <Layout.Vertical className={css.listPage}>
        {connectors?.content?.length || isGitSyncEnabled || searchTerm || loading || appliedFilter ? (
          <Layout.Horizontal flex className={css.header}>
            <Layout.Horizontal spacing="small">
              <RbacButton
                variation={ButtonVariation.PRIMARY}
                text={getString('newConnector')}
                icon="plus"
                permission={{
                  permission: PermissionIdentifier.UPDATE_CONNECTOR,
                  resource: {
                    resourceType: ResourceType.CONNECTOR
                  }
                }}
                onClick={openDrawer}
                id="newConnectorBtn"
                data-test="newConnectorButton"
              />
              <RbacButton
                margin={{ left: 'small' }}
                text={getString('createViaYaml')}
                permission={{
                  permission: PermissionIdentifier.UPDATE_CONNECTOR,
                  resource: {
                    resourceType: ResourceType.CONNECTOR
                  },
                  resourceScope: {
                    accountIdentifier: accountId,
                    orgIdentifier,
                    projectIdentifier
                  }
                }}
                onClick={rerouteBasedOnContext}
                id="newYamlConnectorBtn"
                data-test="createViaYamlButton"
                variation={ButtonVariation.SECONDARY}
              />
              {isGitSyncEnabled && (
                <GitSyncStoreProvider>
                  <GitFilters
                    onChange={filter => {
                      setGitFilter(filter)
                      setPage(0)
                    }}
                    className={css.gitFilter}
                  />
                </GitSyncStoreProvider>
              )}
            </Layout.Horizontal>

            <Layout.Horizontal margin={{ left: 'small' }}>
              <Container data-name="connectorSeachContainer">
                <ExpandingSearchInput
                  alwaysExpanded
                  width={200}
                  placeholder={getString('search')}
                  throttle={200}
                  onChange={(query: string) => {
                    debouncedConnectorSearch(encodeURIComponent(query))
                    setSearchTerm(query)
                  }}
                  className={css.expandSearch}
                />
              </Container>
              <FilterSelector<FilterDTO>
                appliedFilter={appliedFilter}
                filters={filters}
                onFilterBtnClick={openFilterDrawer}
                onFilterSelect={handleFilterSelection}
                fieldToLabelMapping={fieldToLabelMapping}
                filterWithValidFields={removeNullAndEmpty(
                  pick(flattenObject(appliedFilter?.filterProperties || {}), ...fieldToLabelMapping.keys())
                )}
              />
            </Layout.Horizontal>
          </Layout.Horizontal>
        ) : null}

        <Page.Body className={css.listBody}>
          {loading ? (
            <div style={{ position: 'relative', height: 'calc(100vh - 128px)' }}>
              <PageSpinner />
            </div>
          ) : /* istanbul ignore next */ connectorFetchError && shouldShowError(connectorFetchError) ? (
            <div style={{ paddingTop: '200px' }}>
              <PageError
                message={(connectorFetchError?.data as Error)?.message || connectorFetchError?.message}
                onClick={(e: React.MouseEvent<Element, MouseEvent>) => {
                  e.preventDefault()
                  e.stopPropagation()
                  reset()
                }}
              />
            </div>
          ) : connectors?.content?.length ? (
            <ConnectorsListView
              data={connectors}
              reload={refetchAllConnectorsWithStats}
              openConnectorModal={openConnectorModal}
              gotoPage={pageNumber => setPage(pageNumber)}
            />
          ) : (
            <Page.NoDataCard
              onClick={openDrawer}
              imageClassName={css.connectorEmptyStateImg}
              buttonText={!searchTerm ? getString('connectors.createConnector') : undefined}
              image={ConnectorsEmptyState}
              message={searchTerm ? getString('noConnectorFound') : getString('connectors.connectorEmptyState')}
            />
          )}
        </Page.Body>
      </Layout.Vertical>
    </>
  )
}

export default ConnectorsPage
