/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { defaultTo, isEmpty } from 'lodash-es'
import { parse } from 'yaml'
import { Card, Color, Icon, PageError, Text } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { useGetTemplate } from 'services/template-ng'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import NoResultsView from '@templates-library/pages/TemplatesPage/views/NoResultsView/NoResultsView'
import type { TemplateDataInterface } from '../../MonitoredServiceInputSetsTemplate'
import HealthSourceInputsetTable from './components/HealthSourceInputsetTable/HealthSourceInputsetTable'
import HealthSourceInputsetForm from './components/HealthSourceInputsetForm/HealthSourceInputsetForm'
import css from '@cv/pages/monitored-service/MonitoredServiceInputSetsTemplate/MonitoredServiceInputSetsTemplate.module.scss'

interface HealthSourceInputsetInterface {
  sourceType: string
  templateRefData: TemplateDataInterface
  isReadOnlyInputSet?: boolean
}

export default function HealthSourceInputset({
  sourceType,
  templateRefData,
  isReadOnlyInputSet
}: HealthSourceInputsetInterface): JSX.Element {
  const { getString } = useStrings()
  const [monitoredServiceYaml, setMonitoredServiceYaml] = React.useState<any>({})
  // Complete Yaml of Template
  const {
    data: msTemplateResponse,
    loading: msTemplateLoading,
    error: msTemplateError,
    refetch: msTemplateRefetch
  } = useGetTemplate({
    templateIdentifier: templateRefData?.identifier,
    queryParams: {
      accountIdentifier: templateRefData?.accountId,
      orgIdentifier: templateRefData?.orgIdentifier,
      projectIdentifier: templateRefData?.projectIdentifier,
      versionLabel: defaultTo(templateRefData?.versionLabel, ''),
      getDefaultFromOtherRepo: true
    }
  })

  useEffect(() => {
    msTemplateRefetch()
  }, [templateRefData?.identifier, templateRefData?.versionLabel])

  const healthSources = monitoredServiceYaml?.spec?.sources?.healthSources

  // Set complete Yaml as state variable
  React.useEffect(() => {
    if (msTemplateResponse && msTemplateResponse?.data?.yaml) {
      const yaml = parse(msTemplateResponse?.data?.yaml) as any
      setMonitoredServiceYaml(yaml?.template)
    }
  }, [msTemplateResponse])

  let content = <></>
  if (msTemplateLoading) {
    content = <Icon name="spinner" />
  } else if (msTemplateError) {
    content = <PageError message={getErrorMessage(msTemplateError)} onClick={() => msTemplateRefetch()} />
  } else if (isEmpty(monitoredServiceYaml)) {
    content = <NoResultsView minimal={true} text={getString('templatesLibrary.noInputsRequired')} />
  } else if (!isEmpty(monitoredServiceYaml)) {
    content = (
      <>
        <HealthSourceInputsetTable healthSources={healthSources} />
        <HealthSourceInputsetForm
          sourceType={sourceType}
          healthSources={healthSources}
          isReadOnlyInputSet={isReadOnlyInputSet}
        />
      </>
    )
  }

  return (
    <Card className={css.cardStyle}>
      <Text font={'medium'} color={Color.BLACK} style={{ paddingBottom: 'var(--spacing-medium)' }}>
        {getString('cv.templates.healthSourceDetails')}
      </Text>
      {content}
    </Card>
  )
}
