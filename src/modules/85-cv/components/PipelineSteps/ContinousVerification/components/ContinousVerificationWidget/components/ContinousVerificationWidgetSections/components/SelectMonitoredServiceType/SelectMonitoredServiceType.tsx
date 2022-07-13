/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { ButtonVariation, Container, FormInput, MultiTypeInputType, SelectOption } from '@wings-software/uicore'
import cx from 'classnames'

import type { FormikProps } from 'formik'
import { useParams } from 'react-router-dom'
import { isEmpty } from 'lodash-es'
import { useStrings } from 'framework/strings'
import Card from '@cv/components/Card/Card'
import { useTemplateSelector } from 'framework/Templates/TemplateSelectorContext/useTemplateSelector'
import { TemplateSummaryResponse, useGetTemplateInputSetYaml } from 'services/template-ng'
import type {
  ContinousVerificationData,
  TemplateInputs
} from '@cv/components/PipelineSteps/ContinousVerification/types'
import RbacButton from '@rbac/components/Button/Button'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import type { PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { monitoredServiceTypes, MONITORED_SERVICE_TYPE } from './SelectMonitoredServiceType.constants'
import VerifyStepMonitoredServiceInputTemplates from './components/VerifyStepMonitoredServiceInputTemplates/VerifyStepMonitoredServiceInputTemplates'
import {
  getInitialHealthSources,
  getInitialHealthSourceVariables,
  getUpdatedSpecs
} from './SelectMonitoredServiceType.utils'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from './SelectMonitoredServiceType.module.scss'

export interface SelectMonitoredServiceTypeProps {
  formik: FormikProps<ContinousVerificationData>
  allowableTypes: MultiTypeInputType[]
}

export default function SelectMonitoredServiceType(props: SelectMonitoredServiceTypeProps): React.ReactElement {
  const {
    formik,
    formik: { values: formValues, setFieldValue },
    allowableTypes
  } = props
  const { getString } = useStrings()
  const { getTemplate } = useTemplateSelector()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<PipelineType<ProjectPathProps>>()
  const {
    type,
    spec: { versionLabel = '', monitoredServiceTemplateRef = '' }
  } = formik?.values?.spec?.monitoredService || {}

  const [showTemplateButton, setShowTemplateButton] = useState<boolean>(type === MONITORED_SERVICE_TYPE.TEMPLATE)
  const [healthSources, setHealthSources] = useState<TemplateInputs['sources']['healthSources']>(
    getInitialHealthSources(formValues)
  )
  const [healthSourcesVariables, setHealthSourcesVariables] = useState<TemplateInputs['variables']>(
    getInitialHealthSourceVariables(formValues)
  )
  const [templateData, setTemplate] = useState<TemplateSummaryResponse | null>()

  const queryParams = {
    accountIdentifier: accountId,
    orgIdentifier: orgIdentifier,
    projectIdentifier: projectIdentifier,
    versionLabel: '',
    getDefaultFromOtherRepo: true
  }

  const {
    data: templateInputYaml,
    loading: loadingTemplateYaml,
    refetch: fetchTemplateInputSet
  } = useGetTemplateInputSetYaml({
    templateIdentifier: '',
    queryParams,
    lazy: true
  })

  const onUseTemplate = async (): Promise<void> => {
    const { template } = await getTemplate({ templateType: 'MonitoredService' })
    const { versionLabel: latestVersionLabel = '', identifier = '' } = template || {}
    if (latestVersionLabel && identifier) {
      await fetchTemplateInputSet({
        queryParams: { ...queryParams, versionLabel },
        pathParams: { templateIdentifier: identifier }
      })
    }
    setTemplate(template)
  }

  useEffect(() => {
    if (templateInputYaml && templateData) {
      const newSpecs = getUpdatedSpecs(formValues, templateInputYaml, templateData)
      setFieldValue('spec', newSpecs)
      setHealthSources(newSpecs?.monitoredService?.spec?.templateInputs?.sources?.healthSources || [])
      setHealthSourcesVariables(newSpecs?.monitoredService?.spec?.templateInputs?.variables || [])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateData, templateInputYaml])

  const handleOnChangeMonitoredServiceType = (item: SelectOption): void => {
    if (item?.value === MONITORED_SERVICE_TYPE.TEMPLATE) {
      setShowTemplateButton(true)
    }
  }

  const renderMonitoredServiceTemplateInputs = (): JSX.Element => {
    if (loadingTemplateYaml) {
      return <ContainerSpinner />
    } else if (
      !isEmpty(formValues?.spec?.monitoredService?.spec?.templateInputs) &&
      type === MONITORED_SERVICE_TYPE.TEMPLATE
    ) {
      return (
        <VerifyStepMonitoredServiceInputTemplates
          versionLabel={versionLabel}
          monitoredServiceTemplateRef={monitoredServiceTemplateRef}
          allowableTypes={allowableTypes}
          healthSources={healthSources}
          healthSourcesVariables={healthSourcesVariables}
        />
      )
    } else {
      return <></>
    }
  }

  return (
    <Card>
      <>
        <div className={cx(stepCss.formGroup)}>
          <Container flex>
            <FormInput.Select
              className={css.dropdown}
              name="spec.monitoredService.type"
              label={getString('connectors.cdng.monitoredServiceType')}
              items={monitoredServiceTypes as SelectOption[]}
              onChange={handleOnChangeMonitoredServiceType}
            />
            {showTemplateButton && type === MONITORED_SERVICE_TYPE.TEMPLATE ? (
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
            ) : null}
          </Container>
        </div>
        {renderMonitoredServiceTemplateInputs()}
      </>
    </Card>
  )
}
