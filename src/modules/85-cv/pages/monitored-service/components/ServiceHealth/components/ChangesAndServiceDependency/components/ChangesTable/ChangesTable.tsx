/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState, useMemo } from 'react'
import { defaultTo, noop } from 'lodash-es'
import type { IDrawerProps } from '@blueprintjs/core'
import { useParams, Link } from 'react-router-dom'
import type { Column } from 'react-table'
import { Icon, Container, NoDataCard, PageError, TableV2, Pagination, Layout } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { useChangeEventList } from 'services/cv'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { getCVMonitoringServicesSearchParam, getErrorMessage } from '@cv/utils/CommonUtils'
import { MonitoredServiceEnum } from '@cv/pages/monitored-service/MonitoredServicePage.constants'
import routes from '@common/RouteDefinitions'
import noDataImage from '@cv/assets/noChangesData.svg'
import { useDrawer } from '@cv/hooks/useDrawerHook/useDrawerHook'
import type { ChangesTableContentWrapper, ChangesTableInterface } from './ChangesTable.types'
import { renderTime, renderName, renderImpact, renderType, renderChangeType } from './ChangesTable.utils'
import { PAGE_SIZE } from './ChangesTable.constants'
import ChangeEventCard from './components/ChangeEventCard/ChangeEventCard'
import ChangesTableWrapper from './ChangesTableWrapper'
import css from './ChangeTable.module.scss'

export default function ChangesTable({
  isCardView = true,
  startTime,
  endTime,
  hasChangeSource,
  monitoredServiceIdentifier,
  serviceIdentifier,
  environmentIdentifier,
  customCols,
  changeCategories,
  changeSourceTypes,
  recordsPerPage,
  dataTooltipId
}: ChangesTableInterface): JSX.Element {
  const [page, setPage] = useState(0)
  const { getString } = useStrings()
  const { orgIdentifier, projectIdentifier, accountId, identifier } = useParams<
    ProjectPathProps & { identifier: string }
  >()

  const drawerOptions = {
    size: '800px',
    onClose: noop
  } as IDrawerProps
  const { showDrawer } = useDrawer({
    // eslint-disable-next-line react/display-name
    createDrawerContent: props => <ChangeEventCard activityId={props.id} />,
    drawerOptions
  })

  useEffect(() => {
    setPage(0)
  }, [startTime, endTime])

  const changeEventListQueryParams = useMemo(() => {
    return {
      ...(monitoredServiceIdentifier ? { monitoredServiceIdentifiers: [monitoredServiceIdentifier] } : {}),
      ...(!monitoredServiceIdentifier && serviceIdentifier
        ? { serviceIdentifiers: Array.isArray(serviceIdentifier) ? serviceIdentifier : [serviceIdentifier] }
        : {}),
      ...(!monitoredServiceIdentifier && environmentIdentifier
        ? { envIdentifiers: Array.isArray(environmentIdentifier) ? environmentIdentifier : [environmentIdentifier] }
        : {}),
      changeSourceTypes: defaultTo(changeSourceTypes, []),
      changeCategories: defaultTo(changeCategories, []),
      startTime,
      endTime,
      pageIndex: page,
      pageSize: defaultTo(recordsPerPage, PAGE_SIZE)
    }
  }, [
    endTime,
    recordsPerPage,
    monitoredServiceIdentifier,
    environmentIdentifier,
    serviceIdentifier,
    startTime,
    changeSourceTypes,
    changeCategories,
    page
  ])

  const changeEventListPathParams = useMemo(() => {
    return { accountIdentifier: accountId, projectIdentifier, orgIdentifier }
  }, [accountId, projectIdentifier, orgIdentifier])

  const { data, refetch, loading, error } = useChangeEventList({
    lazy: true,
    ...changeEventListPathParams,
    queryParams: changeEventListQueryParams,
    queryParamStringifyOptions: {
      arrayFormat: 'repeat'
    }
  })

  const { content = [], pageSize = 0, pageIndex = 0, totalPages = 0, totalItems = 0 } = data?.resource ?? {}

  const wrapperProps: ChangesTableContentWrapper = { isCardView, totalItems, dataTooltipId }

  useEffect(() => {
    if (startTime && endTime) {
      refetch({
        queryParams: changeEventListQueryParams,
        queryParamStringifyOptions: {
          arrayFormat: 'repeat'
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, endTime, page, changeEventListQueryParams])

  const columns: Column<any>[] = useMemo(
    () =>
      customCols || [
        {
          Header: getString('timeLabel'),
          Cell: renderTime,
          accessor: 'eventTime',
          width: '15%'
        },
        {
          Header: getString('name'),
          Cell: renderName,
          accessor: 'name',
          width: '30%'
        },
        {
          Header: getString('cv.monitoredServices.changesTable.impact'),
          Cell: renderImpact,
          accessor: 'serviceIdentifier',
          width: '20%'
        },
        {
          Header: getString('source'),
          Cell: renderType,
          accessor: 'type',
          width: '20%'
        },
        {
          Header: getString('typeLabel'),
          width: '15%',
          accessor: 'category',
          Cell: renderChangeType
        }
      ],
    [customCols, content]
  )

  if (loading) {
    return (
      <ChangesTableWrapper {...wrapperProps}>
        <Container height="100%" flex={{ justifyContent: 'center' }}>
          <Icon name="steps-spinner" color={Color.GREY_400} size={30} />
        </Container>
      </ChangesTableWrapper>
    )
  }

  if (error) {
    return (
      <ChangesTableWrapper {...wrapperProps}>
        <PageError message={getErrorMessage(error)} onClick={() => refetch()} />
      </ChangesTableWrapper>
    )
  }

  const configurationsTabRoute =
    routes.toCVAddMonitoringServicesEdit({
      accountId,
      projectIdentifier,
      orgIdentifier,
      identifier,
      module: 'cv'
    }) + getCVMonitoringServicesSearchParam({ tab: MonitoredServiceEnum.Configurations })

  if (!content.length && !hasChangeSource) {
    return (
      <ChangesTableWrapper {...wrapperProps}>
        <NoDataCard
          image={noDataImage}
          containerClassName={css.noDataContainer}
          message={getString('cv.changeSource.noChangeSource')}
          button={<Link to={configurationsTabRoute}>{getString('cv.changeSource.configureChangeSource')}</Link>}
        />
      </ChangesTableWrapper>
    )
  }

  if (!content.length) {
    return (
      <ChangesTableWrapper {...wrapperProps}>
        <NoDataCard
          image={noDataImage}
          containerClassName={css.noDataContainer}
          message={getString('cv.monitoredServices.noAvailableData')}
        />
      </ChangesTableWrapper>
    )
  }

  return (
    <ChangesTableWrapper {...wrapperProps}>
      <Layout.Vertical height="100%">
        <Container className={css.tableContainer}>
          <TableV2 sortable data={content} columns={columns} onRowClick={showDrawer} />
        </Container>
        <Container padding={{ left: 'medium', right: 'medium' }}>
          <Pagination
            pageSize={pageSize}
            pageIndex={pageIndex}
            pageCount={totalPages}
            itemCount={totalItems}
            gotoPage={setPage}
          />
        </Container>
      </Layout.Vertical>
    </ChangesTableWrapper>
  )
}
