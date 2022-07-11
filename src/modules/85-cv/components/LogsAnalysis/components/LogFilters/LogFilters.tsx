/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { Checkbox, Container, Layout } from '@harness/uicore'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { HealthSourceMultiSelectDropDown } from '@cv/components/ExecutionVerification/components/HealthSourcesMultiSelectDropdown/HealthSourceMultiSelectDropDown'
import { useStrings } from 'framework/strings'
import { useGetAllHealthSourcesForMonitoredServiceIdentifier } from 'services/cv'
import { VerificationType } from '@cv/components/HealthSourceDropDown/HealthSourceDropDown.constants'
import type { LogFiltersProps } from './LogFilters.types'
import type { EventTypeFullName } from '../../../ExecutionVerification/components/LogAnalysisContainer/LogAnalysis.constants'
import { getClusterTypes } from '../../../ExecutionVerification/components/LogAnalysisContainer/LogAnalysis.utils'
import css from '../../../ExecutionVerification/components/LogAnalysisContainer/components/ClusterTypeFiltersForLogs.module.scss'

const LogFilters: React.FC<LogFiltersProps> = ({
  clusterTypeFilters,
  onFilterChange,
  monitoredServiceIdentifier,
  onHealthSouceChange,
  selectedHealthSources
}) => {
  const { getString } = useStrings()

  const checkboxItems = getClusterTypes(getString)

  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

  const { data, error, loading } = useGetAllHealthSourcesForMonitoredServiceIdentifier({
    monitoredServiceIdentifier,
    queryParams: { accountId, projectIdentifier, orgIdentifier }
  })

  return (
    <Container className={css.main}>
      <Layout.Horizontal className={css.filterContainer}>
        <HealthSourceMultiSelectDropDown
          data={data}
          verificationType={VerificationType.LOG}
          error={error}
          loading={loading}
          onChange={onHealthSouceChange}
          selectedValues={selectedHealthSources}
        />
        <Layout.Horizontal margin={{ left: 'small' }} padding={{ left: 'small' }} border={{ left: true }}>
          {checkboxItems.map(item => (
            <Checkbox
              key={item.label}
              label={item.label}
              value={item.value as string}
              data-testid={item.label}
              /* istanbul ignore next */
              defaultChecked={clusterTypeFilters?.includes(item.value as EventTypeFullName)}
              onChange={inputEl => {
                onFilterChange((inputEl.target as HTMLInputElement).checked, item.value as EventTypeFullName)
              }}
            />
          ))}
        </Layout.Horizontal>
      </Layout.Horizontal>
    </Container>
  )
}

export default LogFilters
