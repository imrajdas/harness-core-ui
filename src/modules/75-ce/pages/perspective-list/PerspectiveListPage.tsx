/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import cx from 'classnames'
import {
  Layout,
  Text,
  Button,
  Container,
  ExpandingSearchInput,
  FlexExpander,
  Page,
  Icon,
  IconName,
  ExpandingSearchInputHandle
} from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { defaultTo, pick } from 'lodash-es'
import { useStrings } from 'framework/strings'
import routes from '@common/RouteDefinitions'
import { PageSpinner, useToaster } from '@common/components'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import {
  useCreatePerspective,
  useDeletePerspective,
  CEView,
  useClonePerspective,
  useGetFolders,
  useDeleteFolder,
  useUpdateFolder
} from 'services/ce'
import {
  CcmMetaData,
  QlceView,
  useFetchAllPerspectivesQuery,
  useFetchCcmMetaDataQuery,
  ViewFieldIdentifier,
  ViewState,
  ViewType
} from 'services/ce/services'
import { generateId, CREATE_CALL_OBJECT } from '@ce/utils/perspectiveUtils'
import NoData from '@ce/components/OverviewPage/OverviewNoData'
import PerspectiveListView from '@ce/components/PerspectiveViews/PerspectiveListView'
import PerspectiveGridView from '@ce/components/PerspectiveViews/PerspectiveGridView'
import { useCreateConnectorMinimal } from '@ce/components/CreateConnector/CreateConnector'
import { Utils } from '@ce/common/Utils'
import { PAGE_NAMES, USER_JOURNEY_EVENTS } from '@ce/TrackingEventsConstants'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import RbacButton from '@rbac/components/Button/Button'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import PerspectiveFoldersSideNav from '@ce/components/PerspectiveFolders/PerspectiveFoldersSideNav'
import { useQueryParamsState } from '@common/hooks/useQueryParamsState'
import EmptyPage from '@ce/common/EmptyPage/EmptyPage'
import { folderViewType } from '@ce/constants'
import bgImage from './images/perspectiveBg.png'
import css from './PerspectiveListPage.module.scss'

const perspectiveSortFunction: (a: any, b: any) => number = (a, b) => {
  const isElementADefault = a?.viewType === ViewType.Default
  const isElementBDefault = b?.viewType === ViewType.Default
  if (isElementADefault && !isElementBDefault) {
    return -1
  }
  if (!isElementADefault && isElementBDefault) {
    return 1
  }
  return 0
}

const getPerspectiveCountInfo: (pespectiveList: QlceView[]) => Record<string, number> = pespectiveList => {
  const countObj = {
    [ViewType.Default]: 0,
    [ViewFieldIdentifier.Aws]: 0,
    [ViewFieldIdentifier.Cluster]: 0,
    [ViewFieldIdentifier.Gcp]: 0,
    [ViewFieldIdentifier.Azure]: 0
  }

  pespectiveList.forEach(per => {
    if (per?.dataSources?.includes(ViewFieldIdentifier.Aws)) {
      countObj[ViewFieldIdentifier.Aws]++
    }
    if (per?.dataSources?.includes(ViewFieldIdentifier.Cluster)) {
      countObj[ViewFieldIdentifier.Cluster]++
    }
    if (per?.dataSources?.includes(ViewFieldIdentifier.Gcp)) {
      countObj[ViewFieldIdentifier.Gcp]++
    }
    if (per?.dataSources?.includes(ViewFieldIdentifier.Azure)) {
      countObj[ViewFieldIdentifier.Azure]++
    }
    if (per?.viewType === ViewType.Default) {
      countObj[ViewType.Default]++
    }
  })

  return countObj
}

const filterPerspectiveBasedOnFilters: (
  pespectiveList: QlceView[],
  searchParam: string,
  quickFilters: Record<string, boolean>
) => QlceView[] = (pespectiveList, searchParam, quickFilters) => {
  return pespectiveList
    .filter(per => {
      if (!per?.name) {
        return false
      }
      if (per.name.toLowerCase().indexOf(searchParam.toLowerCase()) < 0) {
        return false
      }
      return true
    })
    .filter(per => {
      const quickFilterKeysArr = Object.keys(quickFilters)
      if (!quickFilterKeysArr.length) {
        return true
      }

      if (quickFilters[ViewType.Default] && per?.viewType === ViewType.Default) {
        return true
      }

      if (quickFilterKeysArr.some(r => per?.dataSources?.includes(r as any))) {
        return true
      }

      return false
    }) as QlceView[]
}

interface QuickFiltersProps {
  countInfo: Record<string, number>
  setQuickFilters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  quickFilters: Record<string, boolean>
}

const QuickFilters: (props: QuickFiltersProps) => JSX.Element | null = ({
  countInfo,
  quickFilters,
  setQuickFilters
}) => {
  const FilterPill: (props: { count: number; icon: IconName; name: ViewFieldIdentifier | ViewType }) => JSX.Element = ({
    count,
    icon,
    name
  }) => {
    const isSelected = quickFilters[name]
    const isDisabled = count === 0
    return (
      <Container
        padding="small"
        className={cx(css.quickFilter, { [css.disabledMode]: isDisabled }, { [css.selected]: isSelected })}
        onClick={() => {
          const selectedFilters = { ...quickFilters }
          if (isSelected) {
            delete selectedFilters[name]
          } else {
            selectedFilters[name] = true
          }
          setQuickFilters(selectedFilters)
        }}
      >
        {isSelected ? <Icon color={Color.WHITE} name={icon} /> : <Icon name={icon} />}
        <Text
          padding={{
            left: 'small',
            right: 'small'
          }}
          margin={{
            left: 'xsmall'
          }}
          font={{ variation: FontVariation.FORM_LABEL }}
          color={Color.GREY_600}
          className={css.count}
          background={Color.WHITE}
        >
          {count}
        </Text>
      </Container>
    )
  }

  return (
    <Layout.Horizontal spacing="small">
      <FilterPill name={ViewType.Default} count={countInfo[ViewType.Default]} icon={'harness'} />
      <FilterPill
        name={ViewFieldIdentifier.Cluster}
        count={countInfo[ViewFieldIdentifier.Cluster]}
        icon={'app-kubernetes'}
      />
      <FilterPill name={ViewFieldIdentifier.Aws} count={countInfo[ViewFieldIdentifier.Aws]} icon={'service-aws'} />
      <FilterPill name={ViewFieldIdentifier.Gcp} count={countInfo[ViewFieldIdentifier.Gcp]} icon={'gcp'} />
      <FilterPill
        name={ViewFieldIdentifier.Azure}
        count={countInfo[ViewFieldIdentifier.Azure]}
        icon={'service-azure'}
      />
    </Layout.Horizontal>
  )
}

enum Views {
  LIST,
  GRID
}

interface NoDataPerspectivePageProps {
  showConnectorModal?: boolean
}

const NoDataPerspectivePage: (props: NoDataPerspectivePageProps) => JSX.Element = ({ showConnectorModal }) => {
  const { openModal, closeModal } = useCreateConnectorMinimal({
    portalClassName: css.excludeSideNavOverlay,
    onSuccess: () => {
      closeModal()
    }
  })

  const [showNoDataOverlay, setShowNoDataOverlay] = useState(!showConnectorModal)

  useEffect(() => {
    showConnectorModal && openModal()
  }, [])

  const handleConnectorClick = (): void => {
    setShowNoDataOverlay(false)
    openModal()
  }

  return (
    <div style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', height: '100%', width: '100%' }}>
      {showNoDataOverlay && <NoData onConnectorCreateClick={handleConnectorClick} />}
    </div>
  )
}

interface PerspectiveListGridViewProps {
  pespectiveList: QlceView[]
  navigateToPerspectiveDetailsPage: (
    perspectiveId: string,
    viewState: ViewState,
    name: string,
    viewType: ViewType
  ) => void
  deletePerpsective: (perspectiveId: string, perspectiveName: string) => void
  createNewPerspective: (values: QlceView | Record<string, string>) => void
  clonePerspective: (perspectiveId: string, perspectiveName: string) => void
  filteredPerspectiveData: QlceView[]
  view: Views
  setRefetchFolders: React.Dispatch<React.SetStateAction<boolean>>
  setSelectedFolder: (newState: string) => void
  setRefetchPerspectives: React.Dispatch<React.SetStateAction<boolean>>
}

const PerspectiveListGridView: (props: PerspectiveListGridViewProps) => JSX.Element | null = ({
  pespectiveList,
  navigateToPerspectiveDetailsPage,
  deletePerpsective,
  clonePerspective,
  filteredPerspectiveData,
  view,
  setRefetchFolders,
  setSelectedFolder,
  setRefetchPerspectives
}) => {
  if (!pespectiveList) {
    return null
  }

  if (view === Views.GRID) {
    return (
      <>
        <PerspectiveGridView
          pespectiveData={filteredPerspectiveData}
          navigateToPerspectiveDetailsPage={navigateToPerspectiveDetailsPage}
          deletePerpsective={deletePerpsective}
          clonePerspective={clonePerspective}
          setRefetchFolders={setRefetchFolders}
          setSelectedFolder={setSelectedFolder}
          setRefetchPerspectives={setRefetchPerspectives}
        />
      </>
    )
  }

  return (
    <>
      <PerspectiveListView
        pespectiveData={filteredPerspectiveData}
        navigateToPerspectiveDetailsPage={navigateToPerspectiveDetailsPage}
        deletePerpsective={deletePerpsective}
        clonePerspective={clonePerspective}
        setRefetchFolders={setRefetchFolders}
        setSelectedFolder={setSelectedFolder}
        setRefetchPerspectives={setRefetchPerspectives}
      />
    </>
  )
}

const PerspectiveListPage: React.FC = () => {
  const history = useHistory()
  const { accountId } = useParams<{
    accountId: string
  }>()
  const [searchParam, setSearchParam] = useState<string>('')
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()
  const { showError, showSuccess } = useToaster()
  const [view, setView] = useState(Views.GRID)
  const [quickFilters, setQuickFilters] = useState<Record<string, boolean>>({})
  const { trackPage, trackEvent } = useTelemetry()
  const [defaultFolderId, setDefaultFolderId] = useState('')
  const [sampleFolderId, setSampleFolderId] = useState('')
  const [selectedFolderId, setSelectedFolder] = useQueryParamsState<string | undefined>('folderId', '')
  const [isRefetchFolders, setRefetchFolders] = useState(false)
  const [refetchPerspectives, setRefetchPerspectives] = useState(false)
  const searchRef = React.useRef<ExpandingSearchInputHandle>()

  useDocumentTitle(getString('ce.perspectives.sideNavText'), true)

  const [result, executeQuery] = useFetchAllPerspectivesQuery({
    variables: {
      folderId: selectedFolderId || ''
    }
  })
  const { data, fetching } = result

  const {
    data: foldersListResullt,
    loading: foldersLoading,
    refetch: fetchFoldersList
  } = useGetFolders({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const foldersList = foldersListResullt?.data || []

  useEffect(() => {
    if (isRefetchFolders) {
      fetchFoldersList()
      setRefetchFolders(false)
    }
  }, [fetchFoldersList, isRefetchFolders])

  useEffect(() => {
    executeQuery({
      requestPolicy: 'network-only'
    })
    if (searchParam) {
      searchRef.current?.clear()
    }
  }, [selectedFolderId])

  useEffect(() => {
    if (refetchPerspectives) {
      executeQuery({
        requestPolicy: 'network-only'
      })
      setRefetchPerspectives(false)
    }
  }, [refetchPerspectives])

  useEffect(() => {
    if (foldersList) {
      const defaultFolder = foldersList.filter(folders => folders.viewType === folderViewType.DEFAULT)
      const sampleFolder = foldersList.filter(folders => folders.viewType === folderViewType.SAMPLE)
      setDefaultFolderId(defaultFolder[0]?.uuid || '')
      setSampleFolderId(sampleFolder[0]?.uuid || '')
    }
  }, [foldersList])

  const { mutate: createView, loading: createViewLoading } = useCreatePerspective({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { mutate: deleteView } = useDeletePerspective({
    queryParams: {
      accountIdentifier: accountId,
      perspectiveId: '' // this will be set by deleteView fn when called.
    }
  })

  const { mutate: cloneView } = useClonePerspective({
    perspectiveId: '', // this will be set by cloneView fn when called.
    queryParams: {
      accountIdentifier: accountId,
      cloneName: '' // this will be set by cloneView fn when called.
    }
  })

  const { mutate: deletePerspectiveFolder } = useDeleteFolder({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { mutate: updatePerspectiveFolder } = useUpdateFolder({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const [ccmMetaResult] = useFetchCcmMetaDataQuery()
  const { data: ccmData, fetching: fetchingCCMMetaData } = ccmMetaResult

  const { cloudDataPresent, clusterDataPresent } = (ccmData?.ccmMetaData || {}) as CcmMetaData

  const createNewPerspective: (values: QlceView | Record<string, string>) => void = async (values = {}) => {
    const valuesToBeSent = pick(values, ['name', 'viewTimeRange', 'viewVisualization'])
    let formData: Record<string, any> = {
      ...valuesToBeSent,
      viewVersion: 'v1'
    }

    const folderId = selectedFolderId === sampleFolderId ? defaultFolderId : selectedFolderId

    formData['name'] = `Perspective-${generateId(6).toUpperCase()}`
    formData = { ...CREATE_CALL_OBJECT, ...formData, folderId }

    try {
      const response = await createView(formData as CEView)
      const uuid = response?.data?.uuid

      if (uuid) {
        history.push(
          routes.toCECreatePerspective({
            accountId: accountId,
            perspectiveId: uuid
          })
        )
      }
    } catch (e: any) {
      const errMessage = e.data.message
      showError(errMessage)
    }
  }

  const clonePerspective: (perspectiveId: string, perspectiveName: string) => void = async (
    perspectiveId,
    perspectiveName
  ) => {
    const cloneName = `${perspectiveName}-clone`

    try {
      const response = await cloneView(void 0, {
        queryParams: {
          accountIdentifier: accountId,
          cloneName
        },
        pathParams: {
          perspectiveId: perspectiveId
        },
        headers: { 'content-type': 'application/json' }
      })

      const uuid = response?.data?.uuid

      if (uuid) {
        history.push(
          routes.toCECreatePerspective({
            accountId: accountId,
            perspectiveId: uuid
          })
        )
      }
    } catch (e: any) {
      showError(getRBACErrorMessage(e))
    }
  }

  const deletePerpsective: (perspectiveId: string, perspectiveName: string) => void = async (
    perspectiveId,
    perspectiveName
  ) => {
    try {
      const deleted = await deleteView(void 0, {
        queryParams: {
          perspectiveId: perspectiveId,
          accountIdentifier: accountId
        },
        headers: {
          'content-type': 'application/json'
        }
      })
      if (deleted) {
        showSuccess(
          getString('ce.perspectives.perspectiveDeletedTxt', {
            name: perspectiveName
          })
        )
        executeQuery({
          requestPolicy: 'network-only'
        })
      }
    } catch (e) {
      const errMessage = e.data.message
      showError(errMessage)
    }
  }

  const deleteFolder = async (folderId: string) => {
    try {
      await deletePerspectiveFolder(folderId, {
        headers: {
          'content-type': 'application/json'
        }
      })
      showSuccess(getString('ce.perspectives.folders.folderDeleted'))
      fetchFoldersList()
      if (folderId === selectedFolderId) {
        setSelectedFolder(defaultFolderId)
      }
    } catch (e) {
      const errMessage = e.data.message
      showError(errMessage)
    }
  }

  const updateFolder = async (folderId: string, folderName: string, isPinned: boolean) => {
    try {
      await updatePerspectiveFolder({
        uuid: folderId,
        name: folderName,
        pinned: isPinned
      })
      showSuccess(getString('ce.perspectives.folders.folderUpdated'))
      fetchFoldersList()
    } catch (e) {
      const errMessage = e.data.message
      showError(errMessage)
    }
  }

  const navigateToPerspectiveDetailsPage: (
    perspectiveId: string,
    viewState: ViewState,
    name: string,
    viewType: ViewType
  ) => void = (perspectiveId, viewState, name, viewType) => {
    trackEvent(USER_JOURNEY_EVENTS.OPEN_PERSPECTIVE_DETAILS, {
      perspectiveType: viewType
    })

    if (viewState !== ViewState.Draft) {
      history.push(
        routes.toPerspectiveDetails({
          accountId: accountId,
          perspectiveId: perspectiveId,
          perspectiveName: name
        })
      )
    } else {
      history.push(
        routes.toCECreatePerspective({
          accountId,
          perspectiveId
        })
      )
    }
  }

  const pespectiveList = defaultTo(data?.perspectives?.customerViews, []) as QlceView[]

  useEffect(() => {
    trackPage(PAGE_NAMES.PERSPECTIVE_LIST, {})
  }, [])

  useEffect(() => {
    if (data) {
      trackEvent(USER_JOURNEY_EVENTS.PERSPECTIVE_LOADED, { count: pespectiveList.length })
    }
  }, [data])

  useMemo(() => {
    pespectiveList.sort(perspectiveSortFunction)
  }, [pespectiveList])

  const countInfo: Record<string, number> = useMemo(() => {
    return getPerspectiveCountInfo(pespectiveList)
  }, [pespectiveList])

  const filteredPerspectiveData = useMemo(() => {
    return filterPerspectiveBasedOnFilters(pespectiveList, searchParam, quickFilters)
  }, [pespectiveList, searchParam, quickFilters])

  if (fetchingCCMMetaData) {
    return <PageSpinner />
  }

  if (ccmData && !Utils.accountHasConnectors(ccmData.ccmMetaData as CcmMetaData)) {
    return <NoDataPerspectivePage showConnectorModal />
  }

  if (ccmData && !cloudDataPresent && !clusterDataPresent) {
    return <NoDataPerspectivePage />
  }

  return (
    <>
      <Page.Header
        title={
          <Text
            color="grey800"
            style={{ fontSize: 20, fontWeight: 'bold' }}
            tooltipProps={{ dataTooltipId: 'ccmPerspectives' }}
          >
            {getString('ce.perspectives.sideNavText')}
          </Text>
        }
        breadcrumbs={<NGBreadcrumbs />}
      />
      <Layout.Horizontal className={css.bodyWrapper}>
        <PerspectiveFoldersSideNav
          setSelectedFolder={setSelectedFolder}
          selectedFolderId={selectedFolderId || ''}
          foldersList={foldersList}
          setRefetchFolders={setRefetchFolders}
          foldersLoading={foldersLoading}
          defaultFolderId={defaultFolderId}
          deleteFolder={deleteFolder}
          updateFolder={updateFolder}
        />
        <div style={{ flex: 1 }}>
          {pespectiveList.length ? (
            <Layout.Horizontal spacing="large" className={css.header}>
              <Layout.Horizontal spacing="large" style={{ alignItems: 'center' }}>
                <RbacButton
                  intent="primary"
                  text={getString('ce.perspectives.newPerspective')}
                  icon="plus"
                  featuresProps={{
                    featuresRequest: {
                      featureNames: [FeatureIdentifier.PERSPECTIVES]
                    }
                  }}
                  onClick={() => {
                    trackEvent(USER_JOURNEY_EVENTS.CREATE_NEW_PERSPECTIVE, {})
                    createNewPerspective({})
                  }}
                />
              </Layout.Horizontal>
              <FlexExpander />

              <QuickFilters quickFilters={quickFilters} setQuickFilters={setQuickFilters} countInfo={countInfo} />
              <ExpandingSearchInput
                placeholder={getString('ce.perspectives.searchPerspectives')}
                onChange={text => {
                  setSearchParam(text.trim())
                }}
                ref={searchRef}
                className={css.search}
              />
              <Layout.Horizontal>
                <Button
                  minimal
                  icon="grid-view"
                  intent={view === Views.GRID ? 'primary' : undefined}
                  onClick={() => {
                    setView(Views.GRID)
                  }}
                />
                <Button
                  minimal
                  icon="list"
                  intent={view === Views.LIST ? 'primary' : undefined}
                  onClick={() => {
                    setView(Views.LIST)
                  }}
                />
              </Layout.Horizontal>
            </Layout.Horizontal>
          ) : null}
          <Page.Body>
            {(fetching || createViewLoading) && <Page.Spinner />}
            {!pespectiveList.length ? (
              <EmptyPage
                title={getString('ce.perspectives.emptyStateTitle')}
                subtitle={getString('ce.perspectives.emptyStateDesc')}
                buttonText={getString('ce.perspectives.newPerspective')}
                buttonAction={() => {
                  trackEvent(USER_JOURNEY_EVENTS.CREATE_NEW_PERSPECTIVE, {})
                  createNewPerspective({})
                }}
              />
            ) : null}
            <Container
              padding={{
                right: 'xxxlarge',
                left: 'xxxlarge',
                bottom: 'large',
                top: 'large'
              }}
            >
              <PerspectiveListGridView
                pespectiveList={pespectiveList}
                navigateToPerspectiveDetailsPage={navigateToPerspectiveDetailsPage}
                deletePerpsective={deletePerpsective}
                createNewPerspective={createNewPerspective}
                clonePerspective={clonePerspective}
                filteredPerspectiveData={filteredPerspectiveData}
                view={view}
                setRefetchFolders={setRefetchFolders}
                setSelectedFolder={setSelectedFolder}
                setRefetchPerspectives={setRefetchPerspectives}
              />
            </Container>
          </Page.Body>
        </div>
      </Layout.Horizontal>
    </>
  )
}

export default PerspectiveListPage
