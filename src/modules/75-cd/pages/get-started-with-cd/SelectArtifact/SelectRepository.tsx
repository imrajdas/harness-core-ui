/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import { debounce } from 'lodash-es'
import type { Column, CellProps } from 'react-table'
import {
  Text,
  FontVariation,
  Layout,
  TableV2,
  Container,
  RadioButton,
  Color,
  TextInput,
  FormError,
  Icon
} from '@harness/uicore'
import { useGetListOfAllReposByRefConnector, UserRepoResponse } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { ACCOUNT_SCOPE_PREFIX, getFullRepoName } from '../DeployProvisioningWizard/Constants'

import css from '../DeployProvisioningWizard/DeployProvisioningWizard.module.scss'

export interface SelectRepositoryRef {
  repository: UserRepoResponse
}

export type SelectRepositoryForwardRef =
  | ((instance: SelectRepositoryRef | null) => void)
  | React.MutableRefObject<SelectRepositoryRef | null>
  | null

interface SelectRepositoryProps {
  selectedRepository?: UserRepoResponse
  showError?: boolean
  validatedConnectorRef?: string
  disableNextBtn: () => void
  enableNextBtn: () => void
}

const SelectRepositoryRef = (
  props: SelectRepositoryProps,
  forwardRef: SelectRepositoryForwardRef
): React.ReactElement => {
  const { selectedRepository, showError, validatedConnectorRef, disableNextBtn, enableNextBtn } = props
  const { getString } = useStrings()
  const [repository, setRepository] = useState<UserRepoResponse | undefined>(selectedRepository)
  const [query, setQuery] = useState<string>('')
  const [repositories, setRepositories] = useState<UserRepoResponse[]>()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const {
    data: repoData,
    loading: fetchingRepositories,
    refetch: fetchRepositories
  } = useGetListOfAllReposByRefConnector({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      connectorRef: ''
    },
    lazy: true
  })

  useEffect(() => {
    if (validatedConnectorRef) {
      fetchRepositories({
        queryParams: {
          accountIdentifier: accountId,
          projectIdentifier,
          orgIdentifier,
          connectorRef: `${ACCOUNT_SCOPE_PREFIX}${validatedConnectorRef}`
        }
      })
    }
  }, [validatedConnectorRef])

  useEffect(() => {
    setRepositories(repoData?.data)
  }, [repoData?.data])

  const debouncedRepositorySearch = useCallback(
    debounce((queryText: string): void => {
      setQuery(queryText)
    }, 500),
    []
  )

  useEffect(() => {
    if (fetchingRepositories) {
      disableNextBtn()
    } else {
      enableNextBtn()
    }
  }, [fetchingRepositories])

  useEffect(() => {
    if (selectedRepository) {
      setRepository(selectedRepository)
    }
  }, [selectedRepository])

  useEffect(() => {
    if (query) {
      setRepositories((repoData?.data || []).filter(item => item.name?.includes(query)))
    } else {
      setRepositories(repoData?.data)
    }
  }, [query])

  useEffect(() => {
    if (!forwardRef) {
      return
    }

    if (typeof forwardRef === 'function') {
      return
    }

    if (repository) {
      forwardRef.current = {
        repository: repository
      }
    }
  })

  const renderView = React.useCallback((): JSX.Element => {
    if (fetchingRepositories) {
      return (
        <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} spacing="small" padding={{ top: 'large' }}>
          <Icon name="steps-spinner" color="primary7" size={25} />
          <Text font={{ variation: FontVariation.H6 }}>{getString('common.getStarted.fetchingRepos')}</Text>
        </Layout.Horizontal>
      )
    }
    if (Array.isArray(repositories) && repositories.length > 0) {
      return <RepositorySelectionTable repositories={repositories} onRowClick={setRepository} />
    }
    return (
      <Text flex={{ justifyContent: 'center' }} padding={{ top: 'medium' }}>
        {getString('noSearchResultsFoundPeriod')}
      </Text>
    )
  }, [fetchingRepositories, repositories, repoData?.data])

  const showValidationErrorForRepositoryNotSelected = showError && !repository?.name

  return (
    <Layout.Vertical spacing="small">
      <Text font={{ variation: FontVariation.BODY2 }}>{getString('common.getStarted.codebaseHelptext')}</Text>
      <Container padding={{ top: 'small' }} className={cx(css.repositories)}>
        <TextInput
          leftIcon="search"
          placeholder={getString('common.getStarted.searchRepo')}
          className={css.repositorySearch}
          leftIconProps={{ name: 'search', size: 18, padding: 'xsmall' }}
          onChange={e => {
            debouncedRepositorySearch((e.currentTarget as HTMLInputElement).value)
          }}
          disabled={fetchingRepositories}
        />
        {renderView()}
        {showValidationErrorForRepositoryNotSelected ? (
          <Container padding={{ top: 'xsmall' }}>
            <FormError
              name={'repository'}
              errorMessage={getString('common.getStarted.plsChoose', {
                field: `a ${getString('repository').toLowerCase()}`
              })}
            />
          </Container>
        ) : null}
      </Container>
    </Layout.Vertical>
  )
}

interface RepositorySelectionTableProps {
  repositories: UserRepoResponse[]
  onRowClick: (repo: UserRepoResponse) => void
}

function RepositorySelectionTable({ repositories, onRowClick }: RepositorySelectionTableProps): React.ReactElement {
  const { getString } = useStrings()
  const [selectedRow, setSelectedRow] = useState<UserRepoResponse | undefined>(undefined)

  useEffect(() => {
    if (selectedRow) {
      onRowClick(selectedRow)
    }
  }, [selectedRow])

  const columns: Column<UserRepoResponse>[] = React.useMemo(
    () => [
      {
        accessor: 'name',
        width: '100%',
        Cell: ({ row }: CellProps<UserRepoResponse>) => {
          const { name: repositoryName } = row.original
          const isRowSelected = repositoryName === selectedRow?.name
          return (
            <Layout.Horizontal
              data-testid={repositoryName}
              className={css.repositoryRow}
              flex={{ justifyContent: 'flex-start' }}
              spacing="small"
            >
              <RadioButton checked={isRowSelected} />
              <Text
                lineClamp={1}
                font={{ variation: FontVariation.BODY2 }}
                color={isRowSelected ? Color.PRIMARY_7 : Color.GREY_900}
              >
                {getFullRepoName(row.original)}
              </Text>
            </Layout.Horizontal>
          )
        },
        disableSortBy: true
      }
    ],
    [getString]
  )

  return (
    <TableV2<UserRepoResponse>
      columns={columns}
      data={repositories || []}
      hideHeaders={true}
      minimal={true}
      resizable={false}
      sortable={false}
      className={css.repositoryTable}
      onRowClick={data => setSelectedRow(data)}
    />
  )
}

export const SelectRepository = React.forwardRef(SelectRepositoryRef)
