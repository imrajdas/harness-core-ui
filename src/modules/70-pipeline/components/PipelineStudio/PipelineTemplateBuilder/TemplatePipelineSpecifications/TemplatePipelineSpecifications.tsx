/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { cloneDeep, debounce, defaultTo, isEqual, merge, noop, set } from 'lodash-es'
import { useParams } from 'react-router-dom'
import React, { useRef } from 'react'
import { parse } from 'yaml'
import { Container, Formik, FormikForm, Heading, Layout, PageError } from '@wings-software/uicore'
import { Color } from '@wings-software/design-system'
import type { FormikProps, FormikErrors } from 'formik'
import { useToaster } from '@common/exports'
import { setTemplateInputs, TEMPLATE_INPUT_PATH } from '@pipeline/utils/templateUtils'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useGetTemplateInputSetYaml, useGetYamlWithTemplateRefsResolved } from 'services/template-ng'
import {
  getIdentifierFromValue,
  getScopeBasedProjectPathParams,
  getScopeFromValue
} from '@common/components/EntityReference/EntityReference'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { PageSpinner } from '@common/components'
import { PipelineInputSetFormInternal } from '@pipeline/components/PipelineInputSetForm/PipelineInputSetForm'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import type { Error, PipelineInfoConfig } from 'services/pipeline-ng'
import { useStrings } from 'framework/strings'
import { validatePipeline } from '@pipeline/components/PipelineStudio/StepUtil'
import { ErrorsStrip } from '@pipeline/components/ErrorsStrip/ErrorsStrip'
import { useMutateAsGet } from '@common/hooks'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import css from './TemplatePipelineSpecifications.module.scss'

export function TemplatePipelineSpecifications(): JSX.Element {
  const {
    state: { pipeline, schemaErrors, gitDetails },
    allowableTypes,
    updatePipeline,
    isReadonly
  } = usePipelineContext()
  const queryParams = useParams<ProjectPathProps>()
  const templateRef = getIdentifierFromValue(defaultTo(pipeline.template?.templateRef, ''))
  const scope = getScopeFromValue(defaultTo(pipeline.template?.templateRef, ''))
  const { showError } = useToaster()
  const { getString } = useStrings()
  const formikRef = React.useRef<FormikProps<unknown> | null>(null)
  const formRefDom = React.useRef<HTMLElement | undefined>()
  const [inputsTemplate, setInputsTemplate] = React.useState<PipelineInfoConfig>()
  const [allValues, setAllValues] = React.useState<PipelineInfoConfig>()
  const [initialValues, setInitialValues] = React.useState<PipelineInfoConfig>(pipeline)
  const [formikErrors, setFormikErrors] = React.useState<FormikErrors<PipelineInfoConfig>>()
  const [showFormError, setShowFormError] = React.useState<boolean>()
  const dummyPipeline = useRef(pipeline)
  const viewTypeMetadata = { isTemplateBuilder: true }
  const onChange = React.useCallback(
    debounce(async (values: PipelineInfoConfig): Promise<void> => {
      await updatePipeline({ ...pipeline, ...values })
    }, 300),
    [pipeline, updatePipeline]
  )

  const {
    data: pipelineResponse,
    error: pipelineError,
    refetch: refetchPipeline,
    loading: pipelineLoading
  } = useMutateAsGet(useGetYamlWithTemplateRefsResolved, {
    queryParams: {
      ...getScopeBasedProjectPathParams(queryParams, scope),
      pipelineIdentifier: pipeline.identifier,
      repoIdentifier: gitDetails.repoIdentifier,
      branch: gitDetails.branch,
      getDefaultFromOtherRepo: true
    },
    body: {
      originalEntityYaml: yamlStringify({ pipeline: dummyPipeline.current })
    }
  })

  const {
    data: templateInputSetYaml,
    error: templateInputSetError,
    refetch: refetchTemplateInputSet,
    loading: templateInputSetLoading
  } = useGetTemplateInputSetYaml({
    templateIdentifier: templateRef,
    queryParams: {
      ...getScopeBasedProjectPathParams(queryParams, scope),
      versionLabel: defaultTo(pipeline.template?.versionLabel, ''),
      repoIdentifier: gitDetails.repoIdentifier,
      branch: gitDetails.branch,
      getDefaultFromOtherRepo: true
    }
  })

  React.useEffect(() => {
    if (!templateInputSetLoading) {
      try {
        const templateInputs = parse(defaultTo(templateInputSetYaml?.data, ''))
        setInputsTemplate(templateInputs)
      } catch (error) {
        showError(error.message, undefined, 'template.parse.inputSet.error')
      }
    }
  }, [templateInputSetLoading, templateInputSetYaml?.data])

  React.useEffect(() => {
    if (pipelineResponse?.data?.mergedPipelineYaml) {
      setAllValues(parse(pipelineResponse.data.mergedPipelineYaml).pipeline)
    }
  }, [pipelineResponse?.data?.mergedPipelineYaml])

  React.useEffect(() => {
    if (inputsTemplate !== undefined) {
      const mergedTemplateInputs = merge({}, inputsTemplate, pipeline.template?.templateInputs)
      setTemplateInputs(pipeline, mergedTemplateInputs)
      updatePipeline(pipeline)
      setInitialValues(cloneDeep(pipeline))
    }
  }, [inputsTemplate])

  React.useEffect(() => {
    dummyPipeline.current = pipeline
    setFormikErrors({})
  }, [pipeline.template?.templateRef, pipeline.template?.versionLabel])

  React.useEffect(() => {
    if (schemaErrors) {
      formikRef.current?.submitForm()
      setShowFormError(true)
    }
  }, [schemaErrors])

  const validateForm = (values: PipelineInfoConfig) => {
    if (
      isEqual(values.template?.templateRef, pipeline.template?.templateRef) &&
      isEqual(values.template?.versionLabel, pipeline.template?.versionLabel) &&
      inputsTemplate
    ) {
      onChange?.(values)
      const errorsResponse = validatePipeline({
        pipeline: values.template?.templateInputs as PipelineInfoConfig,
        template: inputsTemplate,
        originalPipeline: allValues,
        getString,
        viewType: StepViewType.DeploymentForm,
        viewTypeMetadata
      })
      const newFormikErrors = set({}, TEMPLATE_INPUT_PATH, errorsResponse)
      setFormikErrors(newFormikErrors)
      return newFormikErrors
    } else {
      setFormikErrors({})
      return {}
    }
  }

  const refetch = () => {
    refetchPipeline()
    refetchTemplateInputSet()
  }

  return (
    <Container className={css.contentSection} height={'100%'} background={Color.FORM_BG}>
      {(pipelineLoading || templateInputSetLoading) && <PageSpinner />}
      {!pipelineLoading && !templateInputSetLoading && (pipelineError || templateInputSetError) && (
        <PageError
          message={
            defaultTo((pipelineError?.data as Error)?.message, pipelineError?.message) ||
            defaultTo((templateInputSetError?.data as Error)?.message, templateInputSetError?.message)
          }
          onClick={() => refetch()}
        />
      )}
      {!pipelineLoading &&
        !templateInputSetLoading &&
        !pipelineError &&
        !templateInputSetError &&
        inputsTemplate &&
        allValues &&
        initialValues && (
          <>
            {showFormError && formikErrors && <ErrorsStrip formErrors={formikErrors} domRef={formRefDom} />}
            <Formik<PipelineInfoConfig>
              initialValues={initialValues}
              formName="templateStageOverview"
              onSubmit={noop}
              validate={validateForm}
            >
              {(formik: FormikProps<PipelineInfoConfig>) => {
                formikRef.current = formik as FormikProps<unknown> | null
                return (
                  <FormikForm>
                    <Container
                      className={css.inputsContainer}
                      ref={ref => {
                        formRefDom.current = ref as HTMLElement
                      }}
                    >
                      <Layout.Vertical padding={{ bottom: 'large' }} spacing={'xlarge'}>
                        <Heading level={5} color={Color.BLACK}>
                          Template Inputs
                        </Heading>
                        <Container>
                          <PipelineInputSetFormInternal
                            template={inputsTemplate}
                            originalPipeline={allValues}
                            path={TEMPLATE_INPUT_PATH}
                            readonly={isReadonly}
                            viewType={StepViewType.InputSet}
                            allowableTypes={allowableTypes}
                            viewTypeMetadata={viewTypeMetadata}
                          />
                        </Container>
                      </Layout.Vertical>
                    </Container>
                  </FormikForm>
                )
              }}
            </Formik>
          </>
        )}
    </Container>
  )
}
