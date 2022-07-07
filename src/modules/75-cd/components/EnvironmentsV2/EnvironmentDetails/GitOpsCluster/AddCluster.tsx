/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo, get } from 'lodash-es'
import { Dialog, Spinner } from '@blueprintjs/core'

import {
  Button,
  ButtonVariation,
  Checkbox,
  Color,
  Container,
  ExpandingSearchInput,
  FontVariation,
  Layout,
  PageSpinner,
  Text,
  useToaster
} from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { useInfiniteScroll } from '@common/hooks/useInfiniteScroll'

import {
  Cluster,
  ClusterResponse,
  getClusterListFromSourcePromise,
  ResponsePageClusterResponse,
  useLinkClusters
} from 'services/cd-ng'
import ClusterCard from './ClusterCard'
import css from './AddCluster.module.scss'

interface AddClusterProps {
  linkedClusterResponse: ResponsePageClusterResponse | null
  onHide: () => void
  refetch: () => void
  envRef: string
}

const getUnlinkedClusters = (clusters: Cluster[] | any, linkedClusters: ClusterResponse[] | any): Cluster[] => {
  if (!linkedClusters || !clusters) {
    return []
  }
  const unlinkedClusters = []
  for (const clstr of clusters) {
    const clstrObj = linkedClusters.find((obj: ClusterResponse) => obj.clusterRef === clstr.identifier)
    // istanbul ignore else
    if (!clstrObj) {
      unlinkedClusters.push(clstr)
    }
  }
  return unlinkedClusters
}

const UnLinkedClstrsList = ({
  unlinkedClusters,
  attachRefToLastElement,
  loadMoreRef,
  selectedClusters,
  setSelectedClusters
}: {
  unlinkedClusters: Cluster[]
  attachRefToLastElement: any
  loadMoreRef: any
  selectedClusters: Cluster[]
  setSelectedClusters: any
}): React.ReactElement => {
  return (
    <div className={css.listContainer}>
      {defaultTo(unlinkedClusters, []).map((cluster: Cluster, index: number) => {
        return (
          <Layout.Vertical ref={attachRefToLastElement(index) ? loadMoreRef : undefined} key={cluster.identifier}>
            <ClusterCard
              cluster={cluster}
              key={cluster.identifier}
              setSelectedClusters={setSelectedClusters}
              selectedClusters={selectedClusters}
            />
          </Layout.Vertical>
        )
      })}
    </div>
  )
}

const SelectAllCheckBox = ({
  selectedClusters,
  unlinkedClusters,
  setSelectedClusters,
  setLinkAll
}: {
  selectedClusters: Cluster[]
  unlinkedClusters: Cluster[]
  setSelectedClusters: (arr: Cluster[]) => void
  setLinkAll: (linkAll: boolean) => void
}): React.ReactElement => {
  return (
    <Layout.Horizontal color={Color.GREY_700} className={css.listFooter}>
      <Checkbox
        label="Select All"
        onClick={ev => {
          if (ev.currentTarget.checked) {
            setSelectedClusters(unlinkedClusters)
            setLinkAll(true)
          } else {
            setSelectedClusters([])
            setLinkAll(false)
          }
        }}
        className={css.checkBox}
      />
      {selectedClusters.length ? (
        <span className={css.unlinkedCount}>
          ({selectedClusters.length}/{unlinkedClusters.length})
        </span>
      ) : (
        <span className={css.unlinkedCount}>({unlinkedClusters.length})</span>
      )}
    </Layout.Horizontal>
  )
}

const SelectedClustersList = ({
  selectedClusters,
  selectedLabel
}: {
  selectedClusters: Cluster[]
  selectedLabel: string
}): React.ReactElement => {
  return (
    <Layout.Vertical>
      {defaultTo(selectedClusters, []).length ? (
        <>
          <Text className={css.selectedHeader} color={Color.GREY_800}>
            {selectedLabel}
          </Text>
          {selectedClusters.map((clstr: Cluster, index: number) => {
            // istanbul ignore else
            if (index < 10) {
              return (
                <Text
                  key={clstr.identifier}
                  style={{ fontSize: '12' }}
                  color={Color.GREY_800}
                  className={css.selectedIdenfitier}
                >
                  {defaultTo(clstr.identifier, '')}
                </Text>
              )
            }
          })}
          {selectedClusters.length > 10 ? <div>...</div> : <div />}
        </>
      ) : (
        <div />
      )}
    </Layout.Vertical>
  )
}

const returnTitle = (title: string): React.ReactElement => {
  return (
    <Layout.Vertical spacing="xsmall" padding="medium">
      <Text font={{ variation: FontVariation.H4 }} color={Color.BLACK}>
        {title}
      </Text>
    </Layout.Vertical>
  )
}

const AddCluster = (props: AddClusterProps): React.ReactElement => {
  const [selectedClusters, setSelectedClusters] = React.useState<Cluster | any>([])
  const { getString } = useStrings()
  const { showSuccess, showError } = useToaster()
  const [searching, setSearching] = useState(false)
  const [linkAllClusters, setLinkAllClusters] = useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    orgIdentifier: string
    projectIdentifier: string
    accountId: string
  }>()

  const loadMoreRef = useRef(null)

  const defaultQueryParams = {
    accountIdentifier: accountId,
    orgIdentifier: orgIdentifier,
    projectIdentifier: projectIdentifier,
    page: 0,
    size: 50
  }

  const { mutate: createCluster } = useLinkClusters({
    queryParams: { accountIdentifier: accountId }
  })

  const { items, attachRefToLastElement, fetching, error } = useInfiniteScroll({
    getItems: options => {
      // istanbul ignore next
      return getClusterListFromSourcePromise({
        queryParams: { ...defaultQueryParams, page: options.offset, size: options.limit, searchTerm }
      })
    },
    limit: 100,
    loadMoreRef,
    searchTerm
  })
  const linkedClusters = get(props.linkedClusterResponse, 'data.content', [])

  const unlinkedClusters = getUnlinkedClusters(items, linkedClusters)

  useEffect(() => {
    /* istanbul ignore next */
    if (searchTerm && fetching) {
      /* istanbul ignore next */
      setSearching(true)
    } else if (!fetching) {
      /* istanbul ignore next */
      setSearching(false)
    }
  }, [searchTerm, fetching])

  useEffect(() => {
    // istanbul ignore else
    if (error) {
      /* istanbul ignore next */
      setSearching(false)

      showError(error)
    }
  }, [error])

  const onSubmit = (): void => {
    //istanbul ignore else
    if (selectedClusters && selectedClusters.length) {
      setSubmitting(true)
      const payload = {
        envRef: props.envRef,
        clusters: selectedClusters.map((clstr: Cluster) => ({
          identifier: defaultTo(clstr.identifier, ''),
          name: defaultTo(clstr.identifier, '')
        })),
        orgIdentifier,
        projectIdentifier,
        accountId,
        linkAllClusters
      }
      if (linkAllClusters) {
        delete payload['clusters']
      }
      createCluster(payload, { queryParams: { accountIdentifier: accountId } })
        .then(() => {
          showSuccess(getString('cd.successfullyLinkedClusters'))
          props.onHide()
          setSubmitting(false)
          props.refetch()
        })
        ///* istanbul ignore next */
        .catch(err => {
          /* istanbul ignore next */
          showError(err?.data?.message)
          /* istanbul ignore next */
          setSubmitting(false)
        })
    }
  }
  return (
    <Dialog
      isOpen
      style={{
        width: 648,
        height: 551,
        borderLeft: 0,
        padding: 24
      }}
      enforceFocus={false}
      usePortal
      canOutsideClickClose={false}
      onClose={props.onHide}
      title={returnTitle(getString('cd.selectGitopsCluster'))}
      isCloseButtonShown={true}
    >
      <Container>
        <Container margin={{ bottom: 'small' }}>
          <ExpandingSearchInput
            alwaysExpanded
            placeholder={'Search Clusters'}
            autoFocus={false}
            width={'100%'}
            onChange={setSearchTerm}
            throttle={200}
            data-test-id="search"
          />
        </Container>

        <Layout.Vertical>
          <Layout.Horizontal className={css.contentContainer} height={'339px'}>
            <div className={css.clusterList}>
              {(fetching || submitting) && !searchTerm && !error ? <PageSpinner /> : null}
              {searching ? <Spinner /> : null}
              {!searching ? (
                <>
                  <UnLinkedClstrsList
                    unlinkedClusters={unlinkedClusters}
                    attachRefToLastElement={attachRefToLastElement}
                    loadMoreRef={loadMoreRef}
                    selectedClusters={selectedClusters}
                    setSelectedClusters={setSelectedClusters}
                  />
                  <SelectAllCheckBox
                    unlinkedClusters={unlinkedClusters}
                    selectedClusters={selectedClusters}
                    setSelectedClusters={setSelectedClusters}
                    setLinkAll={setLinkAllClusters}
                  />
                </>
              ) : null}
            </div>

            <Layout.Vertical
              flex={{ justifyContent: 'center', alignItems: 'flex-start' }}
              padding={{ left: 'huge', right: 'huge' }}
            >
              <Text
                font={{ variation: FontVariation.H5 }}
                padding={{ bottom: 'medium' }}
                margin={{ bottom: 'medium' }}
                border={{ bottom: true }}
              >
                {getString('cd.clustersSelected')}({selectedClusters.length})
              </Text>
              <SelectedClustersList selectedClusters={selectedClusters} selectedLabel={getString('cd.selectedLabel')} />
            </Layout.Vertical>
          </Layout.Horizontal>
        </Layout.Vertical>

        <Container className={css.footerStyle} margin={{ top: 'medium !important' }}>
          <Button
            variation={ButtonVariation.PRIMARY}
            text={'Add'}
            onClick={onSubmit}
            disabled={!selectedClusters.length}
          />
          <Button text="Cancel" variation={ButtonVariation.TERTIARY} onClick={props.onHide} />
        </Container>
      </Container>
    </Dialog>
  )
}

export default AddCluster
