/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Color } from '@harness/design-system'
import {
  Button,
  ExpandingSearchInput,
  ExpandingSearchInputHandle,
  HarnessDocTooltip,
  Layout,
  PageSpinner,
  shouldShowError,
  Text
} from '@wings-software/uicore'
import { defaultTo, pick } from 'lodash-es'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import GitFilters, { GitFilterScope } from '@common/components/GitFilters/GitFilters'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { NavigatedToPage } from '@common/constants/TrackingConstants'
import { Page, useToaster } from '@common/exports'
import { useQueryParams, useUpdateQueryParams } from '@common/hooks'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { ResourceType } from '@common/interfaces/GitSyncInterface'
import routes from '@common/RouteDefinitions'
import CreatePipelineButton from '@pipeline/components/CreatePipelineButton/CreatePipelineButton'
import useImportResource from '@pipeline/components/ImportResource/useImportResource'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { useStrings } from 'framework/strings'
import {
  FilterDTO,
  PagePMSPipelineSummaryResponse,
  PipelineFilterProperties,
  PMSPipelineSummaryResponse,
  useGetPipelineList,
  useSoftDeletePipeline
} from 'services/pipeline-ng'
import { PipelineListEmpty } from './PipelineListEmpty/PipelineListEmpty'
import { PipelineListFilter } from './PipelineListFilter/PipelineListFilter'
import { PipelineListTable } from './PipelineListTable/PipelineListTable'
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE, getRouteProps } from './PipelineListUtils'
import type { PipelineListPagePathParams, PipelineListPageQueryParams } from './types'
import css from './PipelineListPage.module.scss'

export function PipelineListPage(): React.ReactElement {
  const { getString } = useStrings()
  const searchRef = useRef({} as ExpandingSearchInputHandle)
  const [pipelineList, setPipelineList] = useState<PagePMSPipelineSummaryResponse | undefined>()
  const [appliedFilter, setAppliedFilter] = useState<FilterDTO | undefined>() // selected filter
  const { trackEvent } = useTelemetry()
  const history = useHistory()
  const { getRBACErrorMessage } = useRBACError()
  const { showSuccess, showError } = useToaster()
  const { isGitSyncEnabled } = useAppStore()
  const [pipelineToDelete, setPipelineToDelete] = useState<PMSPipelineSummaryResponse>()

  const queryParams = useQueryParams<PipelineListPageQueryParams>({
    processQueryParams(params: PipelineListPageQueryParams) {
      return {
        ...params,
        page: params.page || DEFAULT_PAGE_NUMBER,
        size: params.size || DEFAULT_PAGE_SIZE,
        sort: params.sort
      }
    }
  })
  const { searchTerm, repoIdentifier, branch, page, size, sort } = queryParams
  const pathParams = useParams<PipelineListPagePathParams>()
  const { projectIdentifier, orgIdentifier, accountId } = pathParams
  const { updateQueryParams, replaceQueryParams } = useUpdateQueryParams<Partial<PipelineListPageQueryParams>>()

  const handleRepoChange = (filter: GitFilterScope) => {
    updateQueryParams({
      repoIdentifier: filter.repo || undefined,
      branch: filter.branch || undefined,
      page: undefined
    })
  }

  const goToPipelineStudio = (pipeline?: PMSPipelineSummaryResponse) =>
    history.push(routes.toPipelineStudio(getRouteProps(pathParams, pipeline)))

  const {
    mutate: loadPipelineList,
    error: pipelineListLoadingError,
    loading: isPipelineListLoading
  } = useGetPipelineList({
    queryParamStringifyOptions: { arrayFormat: 'comma' }
  })

  const { mutate: deletePipeline, loading: isDeletingPipeline } = useSoftDeletePipeline({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    }
  })

  const { showImportResourceModal } = useImportResource({
    resourceType: ResourceType.PIPELINES,
    modalTitle: getString('common.importEntityFromGit', { resourceType: getString('common.pipeline') }),
    onSuccess: () => fetchPipelines()
  })

  const fetchPipelines = useCallback(async () => {
    try {
      const filter: PipelineFilterProperties = {
        filterType: 'PipelineSetup',
        ...appliedFilter?.filterProperties
      }
      const { status, data } = await loadPipelineList(filter, {
        queryParams: {
          accountIdentifier: accountId,
          projectIdentifier,
          orgIdentifier,
          searchTerm,
          page,
          sort,
          size,
          ...(repoIdentifier &&
            branch && {
              repoIdentifier,
              branch
            })
        }
      })
      if (status === 'SUCCESS') {
        setPipelineList(data)
      }
    } catch (e) {
      if (shouldShowError(e)) {
        showError(getRBACErrorMessage(e), undefined, 'pipeline.fetch.pipeline.error')
      }
    }
  }, [
    accountId,
    appliedFilter?.filterProperties,
    branch,
    orgIdentifier,
    page,
    projectIdentifier,
    repoIdentifier,
    searchTerm,
    size,
    sort?.toString()
  ])

  useDocumentTitle([getString('pipelines')])

  const resetFilter = (): void => {
    setAppliedFilter(undefined)
    replaceQueryParams({})
  }

  useEffect(() => {
    fetchPipelines()
  }, [fetchPipelines])

  useEffect(() => {
    trackEvent(NavigatedToPage.PipelinesPage, {})
  }, [])

  const onDeletePipeline = async (commitMsg: string): Promise<void> => {
    try {
      const gitParams = pipelineToDelete?.gitDetails?.objectId
        ? {
            ...pick(pipelineToDelete?.gitDetails, ['branch', 'repoIdentifier', 'filePath', 'rootFolder']),
            commitMsg,
            lastObjectId: pipelineToDelete?.gitDetails?.objectId
          }
        : {}

      const { status } = await deletePipeline(defaultTo(pipelineToDelete?.identifier, ''), {
        queryParams: {
          accountIdentifier: accountId,
          orgIdentifier,
          projectIdentifier,
          ...gitParams
        }
      })

      if (status === 'SUCCESS') {
        showSuccess(getString('pipeline-list.pipelineDeleted', { name: pipelineToDelete?.name }))
      } else {
        throw getString('somethingWentWrong')
      }
      fetchPipelines()
    } catch (err) {
      showError(getRBACErrorMessage(err), undefined, 'pipeline.delete.pipeline.error')
    }
  }

  const createPipelineButton = (
    <CreatePipelineButton
      label={getString('common.createPipeline')}
      onCreatePipelineClick={() => goToPipelineStudio()}
      onImportPipelineClick={showImportResourceModal}
    />
  )

  return (
    <GitSyncStoreProvider>
      <Page.Header
        title={
          <div className="ng-tooltip-native">
            <h2 data-tooltip-id="pipelinesPageHeading"> {getString('pipelines')}</h2>
            <HarnessDocTooltip tooltipId="pipelinesPageHeading" useStandAlone={true} />
          </div>
        }
        breadcrumbs={<NGBreadcrumbs links={[]} />}
      />
      <Page.SubHeader>
        <Layout.Horizontal>
          {createPipelineButton}
          {isGitSyncEnabled && (
            <GitFilters
              onChange={handleRepoChange}
              className={css.gitFilter}
              defaultValue={{
                repo: repoIdentifier,
                branch
              }}
            />
          )}
        </Layout.Horizontal>
        <Layout.Horizontal style={{ alignItems: 'center' }}>
          <ExpandingSearchInput
            alwaysExpanded
            width={200}
            placeholder={getString('search')}
            onChange={text => {
              updateQueryParams({ searchTerm: text ?? undefined, page: DEFAULT_PAGE_NUMBER })
            }}
            defaultValue={searchTerm}
            ref={searchRef}
            className={css.expandSearch}
          />
          <PipelineListFilter
            queryParams={queryParams}
            setAppliedFilter={setAppliedFilter}
            appliedFilter={appliedFilter}
          />
        </Layout.Horizontal>
      </Page.SubHeader>
      <Page.Body
        className={css.pageBody}
        error={pipelineListLoadingError?.message}
        retryOnError={() => fetchPipelines()}
      >
        {isPipelineListLoading || isDeletingPipeline ? (
          <PageSpinner />
        ) : pipelineList?.content?.length ? (
          <>
            <div className={css.tableTitle}>
              <Text color={Color.GREY_800} font={{ weight: 'bold' }}>
                {`${getString('total')}: ${pipelineList?.totalElements}`}
              </Text>
              <Button intent="primary" icon="refresh" onClick={() => fetchPipelines()} minimal title="refresh" />
            </div>
            <PipelineListTable
              gotoPage={pageNumber => updateQueryParams({ page: pageNumber })}
              data={pipelineList}
              onDelete={setPipelineToDelete}
              onDeletePipeline={onDeletePipeline}
              setSortBy={sortArray => {
                updateQueryParams({ sort: sortArray })
              }}
              sortBy={sort}
            />
          </>
        ) : (
          <PipelineListEmpty
            hasFilter={!!(appliedFilter || searchTerm)}
            resetFilter={resetFilter}
            createPipeline={createPipelineButton}
          />
        )}
      </Page.Body>
    </GitSyncStoreProvider>
  )
}
