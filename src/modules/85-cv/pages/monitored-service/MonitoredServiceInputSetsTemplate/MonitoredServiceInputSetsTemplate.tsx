/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo, isEmpty } from 'lodash-es'
import { parse } from 'yaml'
import { useHistory, useParams } from 'react-router-dom'
import {
  Button,
  ButtonVariation,
  Card,
  Formik,
  Layout,
  Page,
  PageError,
  PageSpinner,
  useToaster
} from '@harness/uicore'
import routes from '@common/RouteDefinitions'
import { useQueryParams } from '@common/hooks'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { useGetTemplateInputSetYaml } from 'services/template-ng'
import { useSaveMonitoredServiceFromYaml } from 'services/cv'
import NoResultsView from '@templates-library/pages/TemplatesPage/views/NoResultsView/NoResultsView'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import DetailsBreadcrumb from '@cv/pages/monitored-service/views/DetailsBreadcrumb'
import ServiceEnvironmentInputSet from './components/ServiceEnvironmentInputSet/ServiceEnvironmentInputSet'
import HealthSourceInputset from './components/HealthSourceInputset/HealthSourceInputset'
import MonitoredServiceInputsetVariables from './components/MonitoredServiceInputsetVariables/MonitoredServiceInputsetVariables'
import { validateInputSet } from './MonitoredServiceInputSetsTemplate.utils'
import css from './MonitoredServiceInputSetsTemplate.module.scss'

export interface TemplateDataInterface {
  identifier: string
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
  versionLabel: string
}

export default function MonitoredServiceInputSetsTemplate({
  templateData
}: {
  templateData?: TemplateDataInterface
}): JSX.Element {
  const { templateRef } = useQueryParams<{ templateRef?: string }>()
  const isReadOnlyInputSet = Boolean(templateData)
  const templateRefData: TemplateDataInterface = isReadOnlyInputSet ? templateData : JSON.parse(templateRef || '{}')
  const { getString } = useStrings()
  const history = useHistory()
  const { showSuccess, showError } = useToaster()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const pathParams = {
    accountId,
    orgIdentifier,
    projectIdentifier
  }

  const [showLoading, setShowLoading] = React.useState(false)

  // InputSet Yaml
  const {
    data: templateInputYaml,
    loading: loadingTemplateYaml,
    error: errorTemplateYaml,
    refetch: refetchTemplateInputYaml
  } = useGetTemplateInputSetYaml({
    lazy: true,
    templateIdentifier: defaultTo(templateRefData?.identifier, ''),
    queryParams: {
      accountIdentifier: templateRefData?.accountId,
      orgIdentifier: templateRefData?.orgIdentifier,
      projectIdentifier: templateRefData?.projectIdentifier,
      versionLabel: defaultTo(templateRefData?.versionLabel, ''),
      getDefaultFromOtherRepo: true
    }
  })

  React.useEffect(() => {
    refetchTemplateInputYaml()
  }, [templateRefData?.identifier, templateRefData?.versionLabel])

  // default value for formik
  const [isInputSetCreated, setInputSet] = React.useState(false)
  const [monitoredServiceInputSet, setMonitoredServiceInputSet] = React.useState<any>({})

  // Set InputSet Yaml as state variable
  React.useEffect(() => {
    if (templateInputYaml && templateInputYaml?.data && !isInputSetCreated && !loadingTemplateYaml) {
      const inputSet = isReadOnlyInputSet
        ? parse(templateInputYaml?.data)
        : (parse(templateInputYaml?.data?.replace(/"<\+input>"/g, '""')) as any)
      setMonitoredServiceInputSet(inputSet)
      setInputSet(true)
    }
  }, [templateInputYaml])

  const { mutate: refetchSaveTemplateYaml } = useSaveMonitoredServiceFromYaml({
    queryParams: {
      accountId: templateRefData?.accountId,
      orgIdentifier: templateRefData?.orgIdentifier,
      projectIdentifier: templateRefData?.projectIdentifier
    }
  })

  const onSave = async (value: any): Promise<void> => {
    if (monitoredServiceInputSet.serviceRef !== undefined) {
      monitoredServiceInputSet.serviceRef = value.serviceRef
    }
    if (monitoredServiceInputSet.environmentRef !== undefined) {
      monitoredServiceInputSet.environmentRef = value.environmentRef
    }
    const populateSource = value.sources ? { sources: value.sources } : {}
    const populateVariables = value.variables ? { variables: value.variables } : {}
    const structure = {
      monitoredService: {
        template: {
          templateRef: templateRefData?.identifier,
          versionLabel: templateRefData?.versionLabel,
          templateInputs: {
            ...monitoredServiceInputSet,
            ...populateSource,
            ...populateVariables
          }
        }
      }
    }
    setShowLoading(true)
    refetchSaveTemplateYaml(yamlStringify(structure))
      .then(() => {
        showSuccess(getString('cv.monitoredServices.monitoredServiceCreated'))
        history.push({
          pathname: routes.toCVMonitoringServices(pathParams)
        })
      })
      .catch(error => {
        setShowLoading(false)
        showError(getErrorMessage(error))
      })
  }

  let content = <></>
  const healthSourcesWithRuntimeList = monitoredServiceInputSet?.sources?.healthSources?.map(
    (healthSource: any) => healthSource.identifier
  )
  if (loadingTemplateYaml) {
    content = <PageSpinner />
  } else if (errorTemplateYaml) {
    content = (
      <Card className={css.cardStyle}>
        <PageError message={getErrorMessage(errorTemplateYaml)} onClick={() => refetchTemplateInputYaml()} />
      </Card>
    )
  } else if (!monitoredServiceInputSet || isEmpty(monitoredServiceInputSet)) {
    content = (
      <Card>
        <Layout.Vertical>
          <Card className={css.cardStyle}>
            <NoResultsView minimal={true} text={getString('templatesLibrary.noInputsRequired')} />
          </Card>
          {!isReadOnlyInputSet && (
            <Button
              disabled={showLoading}
              loading={showLoading}
              variation={ButtonVariation.PRIMARY}
              onClick={() => onSave(monitoredServiceInputSet)}
            >
              {getString('submit')}
            </Button>
          )}
        </Layout.Vertical>
      </Card>
    )
  } else if (monitoredServiceInputSet) {
    content = (
      <Formik
        formName="MonitoredServiceForm"
        onSubmit={value => onSave(value)}
        initialValues={monitoredServiceInputSet}
        enableReinitialize
        validate={value => validateInputSet(value, getString)}
      >
        {formik => {
          return (
            <Card>
              <Layout.Vertical>
                <ServiceEnvironmentInputSet
                  serviceValue={formik.values.serviceRef}
                  environmentValue={formik.values.environmentRef}
                  onChange={formik.setFieldValue}
                  isReadOnlyInputSet={isReadOnlyInputSet}
                />
                <HealthSourceInputset
                  templateRefData={templateRefData}
                  sourceType={formik?.values?.sourceType}
                  isReadOnlyInputSet={isReadOnlyInputSet}
                  healthSourcesWithRuntimeList={healthSourcesWithRuntimeList}
                />
                <MonitoredServiceInputsetVariables monitoredServiceVariables={monitoredServiceInputSet?.variables} />
                {!isReadOnlyInputSet && (
                  <Button
                    disabled={showLoading}
                    loading={showLoading}
                    variation={ButtonVariation.PRIMARY}
                    onClick={formik.submitForm}
                  >
                    {getString('submit')}
                  </Button>
                )}
              </Layout.Vertical>
            </Card>
          )
        }}
      </Formik>
    )
  }

  return (
    <>
      {!isReadOnlyInputSet && <Page.Header breadcrumbs={<DetailsBreadcrumb />} title={'Monitored service inputset'} />}
      <div className={css.inputsetContainer}>{content}</div>
    </>
  )
}
