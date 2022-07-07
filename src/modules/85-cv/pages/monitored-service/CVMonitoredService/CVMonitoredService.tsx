/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'
import {
  Page,
  ButtonVariation,
  Layout,
  Select,
  GridListToggle,
  Views,
  SelectOption,
  Heading,
  HarnessDocTooltip
} from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { useGetMonitoredServiceListEnvironments, useGetCountOfServices } from 'services/cv'
import routes from '@common/RouteDefinitions'
import { useQueryParams } from '@common/hooks'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import RbacButton from '@rbac/components/Button/Button'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useTemplateSelector } from 'framework/Templates/TemplateSelectorContext/useTemplateSelector'
import { getCVMonitoringServicesSearchParam, getErrorMessage, getEnvironmentOptions } from '@cv/utils/CommonUtils'
import ServiceDependencyGraph from '@cv/pages/monitored-service/CVMonitoredService/components/MonitoredServiceGraphView/MonitoredServiceGraphView'
import { getEnvironmentIdentifier } from './CVMonitoredService.utils'
import { FilterTypes } from './CVMonitoredService.types'
import MonitoredServiceList from './components/MonitoredServiceListView/MonitoredServiceList'
import css from './CVMonitoredService.module.scss'

const MonitoredService: React.FC = () => {
  const { getString } = useStrings()

  useDocumentTitle([getString('cv.srmTitle'), getString('cv.monitoredServices.title')])

  const history = useHistory()
  const { view } = useQueryParams<{ view?: Views.GRID }>()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const pathParams = {
    accountId,
    orgIdentifier,
    projectIdentifier
  }

  const [page, setPage] = useState(0)
  const [selectedView, setSelectedView] = useState<Views>(view === Views.GRID ? Views.GRID : Views.LIST)
  const [environment, setEnvironment] = useState<SelectOption>()
  const [selectedFilter, setSelectedFilter] = useState<FilterTypes>(FilterTypes.ALL)

  useEffect(() => {
    setPage(0)
  }, [projectIdentifier])

  const { data: environmentDataList, loading: loadingEnvironments } = useGetMonitoredServiceListEnvironments({
    queryParams: pathParams
  })

  const {
    data: serviceCountData,
    loading: serviceCountLoading,
    error: serviceCountError,
    refetch: refetchServiceCountData
  } = useGetCountOfServices({
    queryParams: {
      ...pathParams,
      environmentIdentifier: getEnvironmentIdentifier(environment)
    }
  })

  useEffect(() => {
    if (serviceCountData) {
      refetchServiceCountData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedView])

  const onFilter = (type: FilterTypes): void => {
    if (type !== selectedFilter) {
      setPage(0)
      setSelectedFilter(type)
      refetchServiceCountData()
    }
  }

  const { getTemplate } = useTemplateSelector()

  const onUseTemplate = async () => {
    const { template } = await getTemplate({ templateType: 'MonitoredService' })
    const templateRefData = {
      identifier: template?.identifier,
      accountId: template?.accountId,
      orgIdentifier: template?.orgIdentifier,
      projectIdentifier: template?.projectIdentifier,
      versionLabel: template?.versionLabel
    }
    history.push({
      pathname: routes.toCVMonitoringServicesInputSets(pathParams),
      search: getCVMonitoringServicesSearchParam({
        view: selectedView,
        templateRef: JSON.stringify(templateRefData)
      })
    })
  }

  const createButton = (hasMonitoredServices: boolean) => {
    {
      const LayoutOrientation = hasMonitoredServices ? Layout.Horizontal : Layout.Vertical
      return (
        <LayoutOrientation spacing="large">
          <RbacButton
            variation={ButtonVariation.PRIMARY}
            icon="plus"
            text={getString('cv.monitoredServices.newMonitoredServices')}
            onClick={() => {
              history.push({
                pathname: routes.toCVAddMonitoringServicesSetup(pathParams),
                search: getCVMonitoringServicesSearchParam({ view: selectedView })
              })
            }}
            permission={{
              permission: PermissionIdentifier.EDIT_MONITORED_SERVICE,
              resource: {
                resourceType: ResourceType.MONITOREDSERVICE,
                resourceIdentifier: projectIdentifier
              }
            }}
          />
          {hasMonitoredServices && (
            <RbacButton
              text={getString('common.useTemplate')}
              variation={ButtonVariation.SECONDARY}
              icon="template-library"
              onClick={onUseTemplate}
              featuresProps={{
                featuresRequest: {
                  featureNames: [FeatureIdentifier.TEMPLATE_SERVICE]
                }
              }}
            />
          )}
        </LayoutOrientation>
      )
    }
  }

  return (
    <>
      <Page.Header
        breadcrumbs={<NGBreadcrumbs />}
        title={
          <Heading level={3} font={{ variation: FontVariation.H4 }}>
            {getString('cv.monitoredServices.title')}
            <HarnessDocTooltip tooltipId={'monitoredServicesTitle'} useStandAlone />
          </Heading>
        }
      />
      <Page.Header
        title={createButton(Boolean(serviceCountData?.allServicesCount))}
        toolbar={
          <Layout.Horizontal>
            <Select
              value={{
                label: `${getString('environment')}: ${defaultTo(environment?.label, getString('all'))}`,
                value: defaultTo(environment?.value, getString('all'))
              }}
              defaultSelectedItem={{ label: getString('all'), value: getString('all') }}
              items={getEnvironmentOptions(environmentDataList, loadingEnvironments, getString)}
              onChange={item => {
                setPage(0)
                setEnvironment(item)
              }}
              className={css.filterSelect}
            />
            <GridListToggle
              initialSelectedView={selectedView}
              onViewToggle={setSelectedView}
              icons={{ left: 'graph' }}
            />
          </Layout.Horizontal>
        }
      />
      {selectedView === Views.LIST ? (
        <MonitoredServiceList
          page={page}
          setPage={setPage}
          environmentIdentifier={getEnvironmentIdentifier(environment)}
          createButton={createButton(Boolean(!serviceCountData?.allServicesCount))}
          selectedFilter={selectedFilter}
          onFilter={onFilter}
          serviceCountData={serviceCountData}
          serviceCountLoading={serviceCountLoading}
          serviceCountErrorMessage={getErrorMessage(serviceCountError)}
          refetchServiceCountData={refetchServiceCountData}
        />
      ) : (
        <ServiceDependencyGraph
          isPageView
          serviceCountData={serviceCountData}
          selectedFilter={selectedFilter}
          onFilter={onFilter}
          refetchServiceCountData={refetchServiceCountData}
          serviceCountLoading={serviceCountLoading}
          createButton={createButton(Boolean(!serviceCountData?.allServicesCount))}
          environmentIdentifier={getEnvironmentIdentifier(environment)}
          serviceCountErrorMessage={getErrorMessage(serviceCountError)}
        />
      )}
    </>
  )
}

export default MonitoredService
