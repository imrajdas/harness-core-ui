/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import {
  Text,
  Icon,
  IconName,
  Container,
  Layout,
  ModalDialog,
  ButtonVariation,
  PageSpinner
} from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { HelpPanel, HelpPanelType } from '@harness/help-panel'
import routes from '@common/RouteDefinitions'
import {
  useGetListOfExecutions,
  useGetFilterList,
  GetListOfExecutionsQueryParams,
  useGetPipelineList,
  PMSPipelineSummaryResponse,
  PagePipelineExecutionSummary
} from 'services/pipeline-ng'
import { String, useStrings, UseStringsReturn } from 'framework/strings'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import type { Module } from 'framework/types/ModuleName'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { Page, StringUtils } from '@common/exports'
import { useQueryParams, useMutateAsGet, useUpdateQueryParams } from '@common/hooks'
import type { GitQueryParams, PipelinePathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { UNSAVED_FILTER } from '@common/components/Filter/utils/FilterUtils'
import { useModuleInfo } from '@common/hooks/useModuleInfo'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import RbacButton from '@rbac/components/Button/Button'
import PipelineSummaryCards from '@pipeline/components/Dashboards/PipelineSummaryCards/PipelineSummaryCards'
import PipelineBuildExecutionsChart from '@pipeline/components/Dashboards/BuildExecutionsChart/PipelineBuildExecutionsChart'
import useTabVisible from '@common/hooks/useTabVisible'
import { useGetCommunity } from '@common/utils/utils'
import type { StoreType } from '@common/constants/GitSyncTypes'
import type { StringsMap } from 'stringTypes'
import pipelineIllustration from '@pipeline/pages/pipelines/images/deploypipeline-illustration.svg'
import { ExecutionCompiledYaml } from '@pipeline/components/ExecutionCompiledYaml/ExecutionCompiledYaml'
import type { PipelineExecutionSummary } from 'services/pipeline-ng'
import { ExecutionCompareProvider } from '@pipeline/components/ExecutionCompareYaml/ExecutionCompareContext'
import ExecutionsList from './ExecutionsList/ExecutionsList'
import ExecutionsPagination from './ExecutionsPagination/ExecutionsPagination'
import { PipelineDeploymentListHeader } from './PipelineDeploymentListHeader/PipelineDeploymentListHeader'
import { FilterContextProvider } from './FiltersContext/FiltersContext'
import type { QueryParams, StringQueryParams, QuickStatusParam } from './types'
import deploymentIllustrations from './images/deployments-illustrations.svg'
import buildIllustrations from './images/builds-illustrations.svg'
import securityTestsIllustration from './images/security-tests-illustration.svg'

import css from './PipelineDeploymentList.module.scss'

const pollingIntervalInMilliseconds = 5_000

export interface PipelineDeploymentListProps {
  onRunPipeline(): void
  showHealthAndExecution?: boolean
  isPipelineInvalid?: boolean
  isCDOverview?: boolean
}

const getHasFilterIdentifier = (filterIdentifier?: string): boolean =>
  (filterIdentifier && filterIdentifier !== StringUtils.getIdentifierFromName(UNSAVED_FILTER)) || false

const getHasFilters = ({
  queryParams,
  filterIdentifier,
  searchTerm,
  myDeployments,
  status
}: {
  queryParams: QueryParams
  filterIdentifier?: string
  searchTerm?: string
  myDeployments?: boolean
  status: GetListOfExecutionsQueryParams['status']
}): boolean => {
  return (
    [queryParams.pipelineIdentifier, queryParams.filters, filterIdentifier, searchTerm].some(
      filter => filter !== undefined
    ) ||
    myDeployments ||
    (Array.isArray(status) && status.length > 0)
  )
}

const getCreateRunPipeline = ({
  pipelineExecutionSummary,
  pipelineDataElements
}: {
  pipelineExecutionSummary: PagePipelineExecutionSummary | undefined
  pipelineDataElements: number | undefined
}): { createPipeline: boolean; runPipeline: boolean } => {
  let createPipeline = false
  let runPipeline = false
  const executionPresent = !!pipelineExecutionSummary?.content?.length
  if (!executionPresent) {
    if (pipelineDataElements === 0) {
      createPipeline = true
    } else {
      runPipeline = true
    }
  }
  return { createPipeline, runPipeline }
}

const renderDeploymentListHeader = ({
  pipelineExecutionSummary,
  hasFilters,
  onRunPipeline,
  isPipelineInvalid
}: {
  pipelineExecutionSummary: PagePipelineExecutionSummary
  hasFilters: boolean
  onRunPipeline: () => void
  isPipelineInvalid?: boolean
}): JSX.Element | null => {
  if (!!pipelineExecutionSummary?.content?.length || hasFilters) {
    return <PipelineDeploymentListHeader onRunPipeline={onRunPipeline} isPipelineInvalid={isPipelineInvalid} />
  }
  return null
}

function NoDeployments(props: {
  hasFilters: boolean
  module: Module
  getString: UseStringsReturn['getString']
  clearFilters: () => void
  runPipeline: boolean
  createPipeline: boolean
  goToPipeline: (pipeline?: PMSPipelineSummaryResponse | undefined) => void
  pipelineIdentifier: string
  queryParams: QueryParams
  onRunPipeline: () => void
  isPipelineInvalid?: boolean
}): JSX.Element {
  const {
    hasFilters,
    module,
    getString,
    clearFilters,
    runPipeline,
    createPipeline,
    goToPipeline,
    pipelineIdentifier,
    queryParams,
    onRunPipeline,
    isPipelineInvalid
  } = props || {}

  let icon: IconName
  let img: JSX.Element
  let noDeploymentString: keyof StringsMap
  let aboutDeploymentString: keyof StringsMap

  switch (module) {
    case 'ci':
      icon = 'ci-main'
      img = <img src={buildIllustrations} className={css.image} />
      noDeploymentString = 'pipeline.noBuildsText'
      aboutDeploymentString = 'noBuildsText'
      break

    case 'sto':
      icon = 'sto-color-filled'
      img = <img src={securityTestsIllustration} className={css.image} />
      noDeploymentString = 'stoSteps.noScansText'
      aboutDeploymentString = 'stoSteps.noScansRunPipelineText'
      break

    default:
      icon = 'cd-main'
      img = <img src={deploymentIllustrations} className={css.image} />
      noDeploymentString = 'pipeline.noDeploymentText'
      aboutDeploymentString = 'noDeploymentText'
  }

  if (!runPipeline) {
    aboutDeploymentString = 'pipeline.noPipelineText'
  }

  return (
    <div className={css.noDeploymentSection}>
      {hasFilters ? (
        <Layout.Vertical spacing="small" flex>
          <Icon size={50} name={icon} margin={{ bottom: 'large' }} />
          <Text
            margin={{ top: 'large', bottom: 'small' }}
            font={{ weight: 'bold', size: 'medium' }}
            color={Color.GREY_800}
          >
            {getString('common.filters.noMatchingFilterData')}
          </Text>
          <String stringID="common.filters.clearFilters" className={css.clearFilterText} onClick={clearFilters} />
        </Layout.Vertical>
      ) : (
        <Layout.Vertical spacing="small" flex={{ justifyContent: 'center', alignItems: 'center' }} width={720}>
          {img}

          <Text className={css.noDeploymentText} margin={{ top: 'medium', bottom: 'small' }}>
            {getString(noDeploymentString)}
          </Text>
          <Text className={css.aboutDeployment} margin={{ top: 'xsmall', bottom: 'xlarge' }}>
            {getString(aboutDeploymentString)}
          </Text>
          <RbacButton
            intent="primary"
            text={runPipeline ? getString('pipeline.runAPipeline') : getString('common.createPipeline')}
            disabled={isPipelineInvalid}
            tooltip={isPipelineInvalid ? getString('pipeline.cannotRunInvalidPipeline') : ''}
            onClick={createPipeline ? () => goToPipeline() : onRunPipeline}
            permission={{
              permission: runPipeline ? PermissionIdentifier.EXECUTE_PIPELINE : PermissionIdentifier.EDIT_PIPELINE,
              resource: {
                resourceType: ResourceType.PIPELINE,
                resourceIdentifier: pipelineIdentifier || queryParams.pipelineIdentifier
              },
              options: {
                skipCondition: ({ resourceIdentifier }) => !resourceIdentifier
              }
            }}
          />
        </Layout.Vertical>
      )}
    </div>
  )
}

function NoDeploymentsCDOverview(props: {
  getString: UseStringsReturn['getString']
  runPipeline: boolean
  createPipeline: boolean
  goToPipeline: (pipeline?: PMSPipelineSummaryResponse | undefined) => void
  pipelineIdentifier: string
  queryParams: QueryParams
  onRunPipeline: () => void
  isPipelineInvalid?: boolean
}): JSX.Element {
  const {
    getString,
    runPipeline,
    createPipeline,
    goToPipeline,
    pipelineIdentifier,
    queryParams,
    onRunPipeline,
    isPipelineInvalid
  } = props
  return (
    <ModalDialog
      isOpen={true}
      style={{ width: 610 }}
      enforceFocus={false}
      portalClassName={css.createModalCss}
      usePortal={true}
    >
      <Layout.Horizontal>
        <Layout.Vertical width="40%">
          <Text
            className={css.noPipelineText}
            margin={{ top: 'medium', bottom: 'small' }}
            font={{ weight: 'bold', size: 'medium' }}
            color={Color.GREY_700}
          >
            {createPipeline
              ? getString('pipeline.OverviewEmptyStates.createPipelineHeaderMsg')
              : getString('pipeline.OverviewEmptyStates.runPipelineHeaderMsg')}
          </Text>
          <Text
            margin={{ top: 'xsmall', bottom: 'xlarge' }}
            font={{ variation: FontVariation.BODY }}
            color={Color.GREY_700}
            padding={{ bottom: 'small' }}
          >
            {createPipeline
              ? getString('pipeline.OverviewEmptyStates.createPipelineInfo')
              : getString('pipeline.OverviewEmptyStates.runPipelineInfo')}
          </Text>
          <RbacButton
            width="155px"
            variation={ButtonVariation.PRIMARY}
            text={runPipeline ? getString('pipeline.runAPipeline') : getString('common.createPipeline')}
            disabled={isPipelineInvalid}
            tooltip={isPipelineInvalid ? getString('pipeline.cannotRunInvalidPipeline') : ''}
            onClick={createPipeline ? () => goToPipeline() : onRunPipeline}
            permission={{
              permission: runPipeline ? PermissionIdentifier.EXECUTE_PIPELINE : PermissionIdentifier.EDIT_PIPELINE,
              resource: {
                resourceType: ResourceType.PIPELINE,
                resourceIdentifier: pipelineIdentifier || queryParams.pipelineIdentifier
              },
              options: {
                skipCondition: ({ resourceIdentifier }) => !resourceIdentifier
              }
            }}
          />
        </Layout.Vertical>
        <Container width="50%">
          <img src={createPipeline ? pipelineIllustration : deploymentIllustrations} />
        </Container>
      </Layout.Horizontal>
    </ModalDialog>
  )
}

export function processQueryParams(params: StringQueryParams & GitQueryParams) {
  let filters = {}

  try {
    filters = params.filters ? JSON.parse(params.filters) : undefined
  } catch (_e) {
    // do nothing
  }

  return {
    ...params,
    page: parseInt(params.page || '1', 10),
    size: parseInt(params.size || '20', 10),
    sort: [],
    status: ((Array.isArray(params.status) ? params.status : [params.status]) as QuickStatusParam)?.filter(p => p),
    myDeployments: !!params.myDeployments,
    searchTerm: params.searchTerm,
    filters,
    repoIdentifier: params.repoIdentifier,
    repoName: params.repoName,
    branch: params.branch,
    connectorRef: params.connectorRef,
    storeType: params.storeType
  }
}
function DeploymentPageSpinner() {
  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 128px)' }}>
      <PageSpinner />
    </div>
  )
}

export default function PipelineDeploymentList(props: PipelineDeploymentListProps): React.ReactElement {
  const { orgIdentifier, projectIdentifier, pipelineIdentifier, accountId } =
    useParams<PipelineType<PipelinePathProps>>()
  const [pollingRequest, setPollingRequest] = React.useState(false)
  const [pipelineDataElements, setData] = React.useState<number | undefined>()
  const history = useHistory()
  const queryParams = useQueryParams<QueryParams & GitQueryParams>({ processQueryParams })
  const { replaceQueryParams } = useUpdateQueryParams<Partial<GetListOfExecutionsQueryParams>>()
  const { module = 'cd' } = useModuleInfo()
  const { isCDOverview } = props
  const { isGitSyncEnabled } = useAppStore()
  const [viewCompiledYaml, setViewCompiledYaml] = React.useState<PipelineExecutionSummary | undefined>(undefined)

  const { page, filterIdentifier, myDeployments, status, repoIdentifier, branch, searchTerm } = queryParams

  const hasFilters = getHasFilters({
    queryParams,
    filterIdentifier,
    searchTerm,
    myDeployments,
    status
  })

  const { getString } = useStrings()
  const hasFilterIdentifier = getHasFilterIdentifier(filterIdentifier)

  const { mutate: reloadPipelines, cancel } = useGetPipelineList({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      module,
      orgIdentifier,
      searchTerm,
      page,
      size: 1
    }
  })

  const fetchPipelines = React.useCallback(async () => {
    cancel()
    setData(await (await reloadPipelines({ filterType: 'PipelineSetup' }))?.data?.totalElements)
  }, [cancel])

  const isCommunity = useGetCommunity()

  const isCommunityAndCDModule = module === 'cd' && isCommunity

  const {
    data,
    loading,
    refetch: fetchExecutions,
    error
  } = useMutateAsGet(useGetListOfExecutions, {
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      module,
      size: 20,
      pipelineIdentifier: pipelineIdentifier || queryParams.pipelineIdentifier,
      page: page ? page - 1 : 0,
      filterIdentifier: hasFilterIdentifier ? filterIdentifier : undefined,
      myDeployments,
      status,
      branch,
      searchTerm,
      ...(isGitSyncEnabled ? { repoIdentifier } : {})
    },
    queryParamStringifyOptions: {
      arrayFormat: 'repeat'
    },
    body: hasFilterIdentifier
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (null as any)
      : {
          ...queryParams.filters,
          filterType: 'PipelineExecution'
        }
  })

  const {
    data: filterData,
    loading: isFetchingFilters,
    refetch: refetchFilters
  } = useGetFilterList({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      type: 'PipelineExecution'
    }
  })
  const pipelineExecutionSummary = data?.data || {}
  const filters = filterData?.data?.content || []
  const visible = useTabVisible()
  /* #region Polling logic */
  //  - At any moment of time, only one polling is done
  //  - Only do polling on first page
  //  - When component is loading, wait until loading is done
  //  - When polling call (API) is being processed, wait until it's done then re-schedule
  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (page === 1 && !loading && visible) {
        setPollingRequest(true)
        fetchExecutions()?.then(
          () => setPollingRequest(false),
          () => setPollingRequest(false)
        )
      }
    }, pollingIntervalInMilliseconds)

    return () => {
      window.clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, loading, visible])

  React.useEffect(() => {
    fetchPipelines()
  }, [projectIdentifier])

  const clearFilters = (): void => {
    replaceQueryParams({})
  }

  // for handling the description when we have no pipelines or we have pipelines but no executions

  const { createPipeline, runPipeline } = getCreateRunPipeline({ pipelineExecutionSummary, pipelineDataElements })

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

  const isInitialLoading = loading && !pollingRequest

  if (isCDOverview && !isInitialLoading) {
    return (
      <NoDeploymentsCDOverview
        onRunPipeline={props.onRunPipeline}
        getString={getString}
        runPipeline={runPipeline}
        createPipeline={createPipeline}
        goToPipeline={goToPipeline}
        pipelineIdentifier={pipelineIdentifier}
        queryParams={queryParams}
        isPipelineInvalid={props.isPipelineInvalid}
      />
    )
  }
  return (
    <>
      <GitSyncStoreProvider spinner={DeploymentPageSpinner}>
        <FilterContextProvider
          savedFilters={filters}
          isFetchingFilters={isFetchingFilters}
          refetchFilters={refetchFilters}
          queryParams={queryParams}
        >
          <ExecutionCompareProvider>
            {renderDeploymentListHeader({
              pipelineExecutionSummary,
              hasFilters,
              onRunPipeline: props.onRunPipeline,
              isPipelineInvalid: props.isPipelineInvalid
            })}
            <Page.Body
              className={css.main}
              key={pipelineIdentifier}
              error={(error?.data as Error)?.message || error?.message}
              retryOnError={() => fetchExecutions()}
            >
              {props.showHealthAndExecution && !isCommunityAndCDModule && (
                <Container className={css.healthAndExecutions}>
                  <PipelineSummaryCards />
                  <PipelineBuildExecutionsChart />
                </Container>
              )}
              {isInitialLoading ? (
                <DeploymentPageSpinner />
              ) : !pipelineExecutionSummary?.content?.length ? (
                <NoDeployments
                  onRunPipeline={props.onRunPipeline}
                  hasFilters={hasFilters}
                  module={module}
                  getString={getString}
                  clearFilters={clearFilters}
                  runPipeline={runPipeline}
                  createPipeline={createPipeline}
                  goToPipeline={goToPipeline}
                  pipelineIdentifier={pipelineIdentifier}
                  queryParams={queryParams}
                  isPipelineInvalid={props.isPipelineInvalid}
                />
              ) : (
                <React.Fragment>
                  <ExecutionsList
                    pipelineExecutionSummary={pipelineExecutionSummary?.content}
                    isPipelineInvalid={props.isPipelineInvalid}
                    onViewCompiledYaml={executionSummary => setViewCompiledYaml(executionSummary)}
                  />
                  <ExecutionsPagination pipelineExecutionSummary={pipelineExecutionSummary} />
                </React.Fragment>
              )}
              <ExecutionCompiledYaml
                onClose={() => setViewCompiledYaml(undefined)}
                executionSummary={viewCompiledYaml}
              />
            </Page.Body>
          </ExecutionCompareProvider>
        </FilterContextProvider>
      </GitSyncStoreProvider>
      <HelpPanel referenceId="ExecutionHistory" type={HelpPanelType.FLOATING_CONTAINER} />
    </>
  )
}
