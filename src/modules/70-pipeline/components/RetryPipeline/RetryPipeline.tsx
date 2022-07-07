/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import {
  Button,
  Text,
  ButtonVariation,
  Formik,
  FormikForm,
  Heading,
  Layout,
  SelectOption,
  Checkbox,
  PageSpinner,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle
} from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { Color } from '@harness/design-system'
import { useHistory, useParams } from 'react-router-dom'
import cx from 'classnames'
import { parse } from 'yaml'
import { isEmpty, pick } from 'lodash-es'
import type { FormikErrors } from 'formik'
import { Classes, Dialog, Tooltip } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import type { PipelineInfoConfig } from 'services/pipeline-ng'

import {
  getInputSetForPipelinePromise,
  InputSetSummaryResponse,
  RetryGroup,
  useGetInputSetsListForPipeline,
  useGetInputsetYamlV2,
  useGetMergeInputSetFromPipelineTemplateWithListInput,
  useGetPipeline,
  useGetRetryStages,
  useRetryPipeline,
  useValidateTemplateInputs
} from 'services/pipeline-ng'

import type {
  ExecutionPathProps,
  GitQueryParams,
  PipelineType,
  RunPipelineQueryParams
} from '@common/interfaces/RouteInterfaces'
import { useExecutionContext } from '@pipeline/context/ExecutionContext'
import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'

import RbacButton from '@rbac/components/Button/Button'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { usePermission } from '@rbac/hooks/usePermission'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { useToaster } from '@common/exports'
import routes from '@common/RouteDefinitions'
import { useQueryParams } from '@common/hooks'
import { StoreType } from '@common/constants/GitSyncTypes'
import {
  clearRuntimeInput,
  getFeaturePropsForRunPipelineButton,
  mergeTemplateWithInputSetData
} from '@pipeline/utils/runPipelineUtils'
import type { InputSetDTO, Pipeline } from '@pipeline/utils/types'
import { PipelineErrorView } from '@pipeline/components/RunPipelineModal/PipelineErrorView'
import { YamlBuilderMemo } from '@common/components/YAMLBuilder/YamlBuilder'
import GitRemoteDetails from '@common/components/GitRemoteDetails/GitRemoteDetails'
import { getErrorsList } from '@pipeline/utils/errorUtils'
import { ErrorsStrip } from '../ErrorsStrip/ErrorsStrip'
import GitPopover from '../GitPopover/GitPopover'
import SelectStagetoRetry from './SelectStagetoRetry'
import factory from '../PipelineSteps/PipelineStepFactory'

import { PipelineInputSetForm } from '../PipelineInputSetForm/PipelineInputSetForm'
import { StepViewType } from '../AbstractSteps/Step'
import { validatePipeline } from '../PipelineStudio/StepUtil'
import SaveAsInputSet from '../RunPipelineModal/SaveAsInputSet'
import { InputSetSelector, InputSetSelectorProps } from '../InputSetSelector/InputSetSelector'
import SelectExistingInputsOrProvideNew from '../RunPipelineModal/SelectExistingOrProvide'
import { PreFlightCheckModal } from '../PreFlightCheckModal/PreFlightCheckModal'
import type { InputSetValue } from '../InputSetSelector/utils'
import css from './RetryPipeline.module.scss'

export interface ParallelStageOption extends SelectOption {
  isLastIndex: number
}
interface RetryPipelineProps {
  executionIdentifier: string
  pipelineIdentifier: string
  modules?: string[]
  onClose: () => void
}

function RetryPipeline({
  executionIdentifier: executionId,
  pipelineIdentifier: pipelineIdf,
  modules,
  onClose
}: RetryPipelineProps): React.ReactElement {
  const { isGitSyncEnabled, isGitSimplificationEnabled } = useAppStore()
  const { getString } = useStrings()
  const { showSuccess, showWarning, showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const history = useHistory()

  const {
    projectIdentifier,
    orgIdentifier,
    pipelineIdentifier,
    accountId,
    executionIdentifier,
    module,
    source = 'executions'
  } = useParams<PipelineType<ExecutionPathProps>>()

  const { pipelineExecutionDetail } = useExecutionContext()

  const repoIdentifier = isGitSyncEnabled
    ? pipelineExecutionDetail?.pipelineExecutionSummary?.gitDetails?.repoIdentifier
    : pipelineExecutionDetail?.pipelineExecutionSummary?.gitDetails?.repoName
  const branch = pipelineExecutionDetail?.pipelineExecutionSummary?.gitDetails?.branch
  const connectorRef = pipelineExecutionDetail?.pipelineExecutionSummary?.connectorRef
  const storeType = pipelineExecutionDetail?.pipelineExecutionSummary?.storeType as StoreType
  const isPipelineRemote = isGitSimplificationEnabled && storeType === StoreType.REMOTE
  const { inputSetType, inputSetValue, inputSetLabel, inputSetRepoIdentifier, inputSetBranch } = useQueryParams<
    GitQueryParams & RunPipelineQueryParams
  >()
  const planExecutionIdentifier = executionIdentifier ?? executionId
  const pipelineId = pipelineIdf ? pipelineIdf : pipelineIdentifier

  const getInputSetSelected = (): InputSetValue[] => {
    if (inputSetType) {
      return [
        {
          type: inputSetType as InputSetSummaryResponse['inputSetType'],
          value: inputSetValue ?? '',
          label: inputSetLabel ?? '',
          gitDetails: {
            repoIdentifier: inputSetRepoIdentifier,
            branch: inputSetBranch
          }
        }
      ]
    }
    return []
  }

  const [selectedView, setSelectedView] = useState<SelectedView>(SelectedView.VISUAL)
  const [yamlHandler, setYamlHandler] = useState<YamlBuilderHandlerBinding | undefined>()
  const [inputSetYaml, setInputSetYaml] = useState('')
  const [currentPipeline, setCurrentPipeline] = useState<{ pipeline?: PipelineInfoConfig } | undefined>(
    inputSetYaml ? parse(inputSetYaml) : undefined
  )
  const [existingProvide, setExistingProvide] = useState('existing')
  const [formErrors, setFormErrors] = useState<FormikErrors<InputSetDTO>>({})
  const [retryClicked, setRetryClicked] = useState(false)
  const [selectedStage, setSelectedStage] = useState<ParallelStageOption | null>(null)
  const [selectedInputSets, setSelectedInputSets] = useState<InputSetSelectorProps['value']>(getInputSetSelected())
  const [isParallelStage, setIsParallelStage] = useState(false)
  const [isLastIndex, setIsLastIndex] = useState(false)
  const [isAllStage, setIsAllStage] = useState(true)
  const [inputSetTemplateYaml, setInputSetTemplateYaml] = useState('')
  const [skipPreFlightCheck, setSkipPreFlightCheck] = useState(false)
  const [notifyOnlyMe, setNotifyOnlyMe] = useState(false)
  const [triggerValidation, setTriggerValidation] = useState(false)
  const [listOfSelectedStages, setListOfSelectedStages] = useState<Array<string>>([])
  const [resolvedPipeline, setResolvedPipeline] = React.useState<PipelineInfoConfig>()

  const yamlTemplate = React.useMemo(() => {
    return parse(inputSetTemplateYaml || '')?.pipeline
  }, [inputSetTemplateYaml])

  /*------------------------------------------------API Calls------------------------------*/

  const { data: pipelineResponse, loading: loadingPipeline } = useGetPipeline({
    pipelineIdentifier: pipelineId,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      repoIdentifier,
      branch,
      getTemplatesResolvedPipeline: true
    }
  })

  const { data: validateTemplateInputsResponse, loading: loadingValidateTemplateInputs } = useValidateTemplateInputs({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      identifier: pipelineId,
      repoIdentifier,
      branch,
      getDefaultFromOtherRepo: true
    }
  })

  const { data: inputSetData, loading: loadingTemplate } = useGetInputsetYamlV2({
    planExecutionId: planExecutionIdentifier,
    queryParams: {
      orgIdentifier,
      resolveExpressions: true,
      projectIdentifier,
      accountIdentifier: accountId
    },
    requestOptions: {
      headers: {
        'content-type': 'application/yaml'
      }
    }
  })

  const { mutate: retryPipeline, loading: loadingRetry } = useRetryPipeline({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      moduleType: module,
      planExecutionId: planExecutionIdentifier,
      retryStages: (!isParallelStage
        ? [selectedStage?.value]
        : (selectedStage?.value as string)?.split(' | ')) as string[],
      runAllStages: isAllStage
    },
    queryParamStringifyOptions: {
      arrayFormat: 'repeat'
    },
    identifier: pipelineId,
    requestOptions: {
      headers: {
        'content-type': 'application/yaml'
      }
    }
  })

  const {
    refetch: getInputSetsList,
    data: inputSetResponse,
    loading: inputSetLoading
  } = useGetInputSetsListForPipeline({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      pipelineIdentifier: pipelineId,
      ...(!isEmpty(repoIdentifier) && !isEmpty(branch)
        ? {
            repoIdentifier,
            branch,
            getDefaultFromOtherRepo: true
          }
        : {})
    },
    lazy: true
  })

  const { mutate: mergeInputSet, loading: loadingUpdate } = useGetMergeInputSetFromPipelineTemplateWithListInput({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      pipelineIdentifier: pipelineId,
      ...(!isEmpty(repoIdentifier) && !isEmpty(branch)
        ? {
            pipelineRepoID: repoIdentifier,
            pipelineBranch: branch,
            repoIdentifier,
            branch,
            getDefaultFromOtherRepo: true
          }
        : {})
    }
  })
  const { data: stageResponse, loading: retryStageLoading } = useGetRetryStages({
    planExecutionId: planExecutionIdentifier,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      pipelineIdentifier: pipelineId,
      repoIdentifier,
      branch,
      getDefaultFromOtherRepo: true
    }
  })
  /*------------------------------------------------API Calls------------------------------*/

  const pipeline: PipelineInfoConfig | undefined = parse(pipelineResponse?.data?.yamlPipeline || '')?.pipeline
  const valuesPipelineRef = useRef<PipelineInfoConfig>()
  const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
    fileName: `retry-pipeline.yaml`,
    entityType: 'Pipelines',
    showSnippetSection: false,
    yamlSanityConfig: {
      removeEmptyString: false,
      removeEmptyObject: false,
      removeEmptyArray: false
    }
  }
  const [canEdit] = usePermission(
    {
      resourceScope: {
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier
      },
      resource: {
        resourceType: ResourceType.PIPELINE,
        resourceIdentifier: pipelineId
      },
      permissions: [PermissionIdentifier.EDIT_PIPELINE]
    },
    [accountId, orgIdentifier, projectIdentifier, pipelineId]
  )
  const inputSets = inputSetResponse?.data?.content

  React.useEffect(() => {
    const mergedPipelineYaml = pipelineResponse?.data?.resolvedTemplatesPipelineYaml
    if (mergedPipelineYaml) {
      setResolvedPipeline(parse(mergedPipelineYaml)?.pipeline)
    }
  }, [pipelineResponse?.data?.resolvedTemplatesPipelineYaml])

  useEffect(() => {
    // Won't actually render out RunPipelineForm
    /* istanbul ignore else */ if (inputSetData?.data?.inputSetYaml) {
      setInputSetYaml(inputSetData.data?.inputSetYaml)
    }
    /* istanbul ignore else */ if (inputSetData?.data?.latestTemplateYaml) {
      setInputSetTemplateYaml(inputSetData.data.latestTemplateYaml)
    }
  }, [inputSetData])

  useEffect(() => {
    if (!inputSets?.length) {
      setExistingProvide('provide')
    }
  }, [inputSets])

  useEffect(() => {
    if (inputSetYaml) {
      const parsedYAML = parse(inputSetYaml)
      setExistingProvide('provide')
      setCurrentPipeline(parsedYAML)
    }
  }, [inputSetYaml])

  useEffect(() => {
    getInputSetsList()
  }, [])

  useEffect(() => {
    setTriggerValidation(true)
  }, [currentPipeline])

  useEffect(() => {
    if (inputSetTemplateYaml) {
      const parsedTemplate = parse(inputSetTemplateYaml) as { pipeline: PipelineInfoConfig }
      if ((selectedInputSets && selectedInputSets.length > 1) || selectedInputSets?.[0]?.type === 'OVERLAY_INPUT_SET') {
        const fetchData = async (): Promise<void> => {
          try {
            const data = await mergeInputSet({
              inputSetReferences: selectedInputSets.map(item => item.value as string)
            })
            if (data?.data?.pipelineYaml) {
              const inputSetPortion = parse(data.data.pipelineYaml) as {
                pipeline: PipelineInfoConfig
              }
              const toBeUpdated = mergeTemplateWithInputSetData({
                templatePipeline: parsedTemplate,
                inputSetPortion,
                allValues: { pipeline: {} } as Pipeline,
                shouldUseDefaultValues: false
              })
              setCurrentPipeline(toBeUpdated)
            }
          } catch (e) {
            showError(getRBACErrorMessage(e), undefined, 'pipeline.feth.inputSetTemplateYaml.error')
          }
        }
        fetchData()
      } else if (selectedInputSets && selectedInputSets.length === 1) {
        const fetchData = async (): Promise<void> => {
          const data = await getInputSetForPipelinePromise({
            inputSetIdentifier: selectedInputSets[0].value as string,
            queryParams: {
              accountIdentifier: accountId,
              projectIdentifier,
              orgIdentifier,
              pipelineIdentifier: pipelineId,
              repoIdentifier: selectedInputSets[0]?.gitDetails?.repoIdentifier,
              branch: selectedInputSets[0]?.gitDetails?.branch
            }
          })
          if (data?.data?.inputSetYaml) {
            if (selectedInputSets[0].type === 'INPUT_SET') {
              const inputSetPortion = pick(parse(data.data.inputSetYaml)?.inputSet, 'pipeline') as {
                pipeline: PipelineInfoConfig
              }
              const toBeUpdated = mergeTemplateWithInputSetData({
                templatePipeline: parsedTemplate,
                inputSetPortion,
                allValues: { pipeline: {} } as Pipeline,
                shouldUseDefaultValues: false
              })
              setCurrentPipeline(toBeUpdated)
            }
          }
        }
        fetchData()
      } else if (!selectedInputSets?.length && !inputSetYaml?.length) {
        setCurrentPipeline(parsedTemplate)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputSetTemplateYaml, selectedInputSets, accountId, projectIdentifier, orgIdentifier, pipelineId])

  useEffect(() => {
    let errors: FormikErrors<InputSetDTO> = formErrors

    if (
      triggerValidation &&
      currentPipeline?.pipeline &&
      inputSetTemplateYaml &&
      yamlTemplate &&
      pipeline &&
      retryClicked
    ) {
      errors = validatePipeline({
        pipeline: { ...clearRuntimeInput(currentPipeline.pipeline) },
        template: parse(inputSetTemplateYaml || '')?.pipeline,
        originalPipeline: currentPipeline.pipeline,
        getString,
        viewType: StepViewType.DeploymentForm
      }) as any
      setFormErrors(errors)
      // triggerValidation should be true every time 'currentPipeline' changes
      // and it needs to be set as false here so that we do not trigger it indefinitely
      setTriggerValidation(false)
    }
  }, [currentPipeline, pipeline, inputSetTemplateYaml, yamlTemplate, selectedInputSets, existingProvide])

  const handleRetryPipeline = useCallback(
    async (valuesPipeline?: PipelineInfoConfig, forceSkipFlightCheck = false) => {
      if (Object.keys(formErrors).length) {
        return
      }
      valuesPipelineRef.current = valuesPipeline
      if (!skipPreFlightCheck && !forceSkipFlightCheck) {
        // Not skipping pre-flight check - open the new modal
        showPreflightCheckModal()
        return
      }

      try {
        const response = await retryPipeline(
          !isEmpty(valuesPipelineRef.current) ? (yamlStringify({ pipeline: valuesPipelineRef.current }) as any) : ''
        )
        const retryPipelineData = response.data
        if (response.status === 'SUCCESS') {
          onClose()
          if (retryPipelineData && retryPipelineData.planExecution?.uuid) {
            showSuccess(getString('runPipelineForm.pipelineRunSuccessFully'))
            history.push(
              routes.toExecutionPipelineView({
                orgIdentifier,
                pipelineIdentifier: pipelineId,
                projectIdentifier,
                executionIdentifier: retryPipelineData?.planExecution?.uuid || '',
                accountId,
                module,
                source
              })
            )
          }
        }
      } catch (error) {
        showWarning(getRBACErrorMessage(error) || getString('runPipelineForm.runPipelineFailed'))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      retryPipeline,
      showWarning,
      showSuccess,
      pipelineId,
      history,
      orgIdentifier,
      module,
      projectIdentifier,
      onClose,
      accountId,
      skipPreFlightCheck,
      formErrors,
      isParallelStage,
      selectedStage,
      isAllStage
    ]
  )

  const checkIfRuntimeInputsNotPresent = (): string | undefined => {
    if (pipeline && !inputSetTemplateYaml) {
      return getString('pipeline.inputSets.noRuntimeInputsWhileExecution')
    }
  }

  const handleModeSwitch = useCallback(
    (view: SelectedView) => {
      if (view === SelectedView.VISUAL) {
        const presentPipeline = parse(yamlHandler?.getLatestYaml() || '') as { pipeline: PipelineInfoConfig }
        setCurrentPipeline(presentPipeline)
      }
      setSelectedView(view)
    },
    [yamlHandler?.getLatestYaml]
  )

  const handleStageChange = (value: ParallelStageOption): void => {
    const stagesList = stageResponse?.data?.groups?.filter((_, stageIdx) => stageIdx < value.isLastIndex)
    const listOfIds: string[] = []

    stagesList?.forEach(stageData => {
      stageData?.info?.forEach(stageInfo => {
        listOfIds.push(stageInfo.identifier as string)
      })
    })

    if (value.label.includes('|')) {
      if ((value as ParallelStageOption).isLastIndex === (stageResponse?.data?.groups as RetryGroup[])?.length - 1) {
        setIsLastIndex(true)
      } else {
        setIsLastIndex(false)
      }
      setIsParallelStage(true)
    } else {
      setIsParallelStage(false)
    }
    setListOfSelectedStages(listOfIds)
    setSelectedStage(value)
  }
  const handleStageType = (e: FormEvent<HTMLInputElement>): void => {
    if ((e.target as any).value === 'allparallel') {
      setIsAllStage(true)
    } else {
      setIsAllStage(false)
    }
  }
  const onExistingProvideRadioChange = (ev: FormEvent<HTMLInputElement>): void => {
    setExistingProvide((ev.target as HTMLInputElement).value)
  }
  const getRetryPipelineDisabledState = (): boolean => {
    return getErrorsList(formErrors).errorCount > 0 || !selectedStage
  }

  const [showPreflightCheckModal, hidePreflightCheckModal] = useModalHook(() => {
    return (
      <Dialog
        className={cx(css.preFlightCheckModal, Classes.DIALOG)}
        enforceFocus={false}
        isOpen
        onClose={hidePreflightCheckModal}
      >
        <PreFlightCheckModal
          pipeline={valuesPipelineRef.current}
          module={module}
          accountId={accountId}
          orgIdentifier={orgIdentifier}
          projectIdentifier={projectIdentifier}
          pipelineIdentifier={pipelineId}
          branch={branch}
          repoIdentifier={repoIdentifier}
          onCloseButtonClick={hidePreflightCheckModal}
          onContinuePipelineClick={() => {
            hidePreflightCheckModal()
            handleRetryPipeline(valuesPipelineRef.current, true)
          }}
        />
      </Dialog>
    )
  }, [isParallelStage, isAllStage, selectedStage])

  const renderPipelineInputSetForm = (): React.ReactElement | undefined => {
    if (loadingUpdate) {
      return (
        <PageSpinner
          className={css.inputSetsUpdatingSpinner}
          message={getString('pipeline.inputSets.applyingInputSets')}
        />
      )
    }
    const templateSource = inputSetTemplateYaml
    if (currentPipeline?.pipeline && resolvedPipeline && templateSource) {
      return (
        <>
          {existingProvide === 'existing' ? <div className={css.divider} /> : null}
          <PipelineInputSetForm
            originalPipeline={resolvedPipeline}
            template={parse(templateSource)?.pipeline}
            readonly={false}
            path=""
            viewType={StepViewType.DeploymentForm}
            isRunPipelineForm
            maybeContainerClass={existingProvide === 'provide' ? css.inputSetFormRunPipeline : ''}
            listOfSelectedStages={listOfSelectedStages}
            isRetryFormStageSelected={selectedStage !== null}
          />
        </>
      )
    }
  }

  const formRefDom = React.useRef<HTMLElement | undefined>()

  if (loadingPipeline || loadingTemplate || inputSetLoading || loadingRetry || loadingValidateTemplateInputs) {
    return <PageSpinner />
  }

  if (validateTemplateInputsResponse?.data?.validYaml === false) {
    // repoName={repoIdentifier} because values is calculated at top and one of them (repoIdentifier, repoName)
    // will be undefined based on the enabled flag (isGitSyncEnabled)
    return (
      <PipelineErrorView
        errorNodeSummary={validateTemplateInputsResponse.data.errorNodeSummary}
        pipelineIdentifier={pipelineId}
        repoIdentifier={repoIdentifier}
        repoName={repoIdentifier}
        branch={branch}
        connectorRef={connectorRef}
        storeType={storeType}
      />
    )
  }

  return (
    <Formik<PipelineInfoConfig>
      initialValues={
        currentPipeline?.pipeline ? clearRuntimeInput(currentPipeline.pipeline) : ({} as PipelineInfoConfig)
      }
      formName="retryPipeline"
      onSubmit={values => {
        handleRetryPipeline(values, false)
      }}
      enableReinitialize
      validate={async values => {
        let errors: FormikErrors<InputSetDTO> = formErrors

        setCurrentPipeline({ ...currentPipeline, pipeline: values as PipelineInfoConfig })

        function validateErrors(): Promise<FormikErrors<InputSetDTO>> {
          return new Promise(resolve => {
            setTimeout(() => {
              const validatedErrors =
                (validatePipeline({
                  pipeline: values as PipelineInfoConfig,
                  template: parse(inputSetTemplateYaml || '')?.pipeline,
                  originalPipeline: pipeline,
                  getString,
                  viewType: StepViewType.DeploymentForm
                }) as any) || formErrors
              resolve(validatedErrors)
            }, 300)
          })
        }

        errors = await validateErrors()

        if (typeof errors !== undefined && retryClicked) {
          setFormErrors(errors)
        }
        return errors
      }}
    >
      {({ submitForm, values }) => {
        const noRuntimeInputs = checkIfRuntimeInputsNotPresent()
        return (
          <Layout.Vertical>
            <>
              <div className={css.runModalHeader}>
                <Heading
                  level={2}
                  font={{ weight: 'bold' }}
                  color={Color.BLACK_100}
                  className={css.runModalHeaderTitle}
                >
                  {getString('pipeline.retryPipeline')}
                </Heading>
                {isPipelineRemote ? (
                  <GitRemoteDetails
                    repoName={repoIdentifier}
                    branch={branch}
                    filePath={pipelineExecutionDetail?.pipelineExecutionSummary?.gitDetails?.filePath}
                    fileUrl={pipelineExecutionDetail?.pipelineExecutionSummary?.gitDetails?.fileUrl}
                    flags={{ readOnly: true }}
                  />
                ) : (
                  isGitSyncEnabled && (
                    <GitSyncStoreProvider>
                      <GitPopover
                        data={pipelineResponse?.data?.gitDetails ?? {}}
                        iconProps={{ margin: { left: 'small', top: 'xsmall' } }}
                      />
                    </GitSyncStoreProvider>
                  )
                )}
                <div className={css.optionBtns}>
                  <VisualYamlToggle
                    selectedView={selectedView}
                    onChange={nextMode => {
                      handleModeSwitch(nextMode)
                    }}
                    disableToggle={!inputSetTemplateYaml}
                  />
                </div>
              </div>
              <ErrorsStrip formErrors={formErrors} domRef={formRefDom} />
            </>
            {selectedView === SelectedView.VISUAL ? (
              <div
                className={css.runModalFormContent}
                ref={ref => {
                  formRefDom.current = ref as HTMLElement
                }}
              >
                <FormikForm>
                  {!retryStageLoading && stageResponse?.data && (
                    <SelectStagetoRetry
                      handleStageChange={handleStageChange}
                      selectedStage={selectedStage}
                      stageResponse={stageResponse?.data}
                      isParallelStage={isParallelStage}
                      handleStageType={handleStageType}
                      isAllStage={isAllStage}
                      isLastIndex={isLastIndex}
                    />
                  )}
                  {noRuntimeInputs ? (
                    <Layout.Horizontal padding="medium" margin="medium">
                      <Text>{noRuntimeInputs}</Text>
                    </Layout.Horizontal>
                  ) : (
                    !!inputSets?.length && (
                      <Layout.Vertical
                        className={css.pipelineHeader}
                        padding={{ top: 'xlarge', left: 'xlarge', right: 'xlarge' }}
                      >
                        <SelectExistingInputsOrProvideNew
                          existingProvide={existingProvide}
                          onExistingProvideRadioChange={onExistingProvideRadioChange}
                        />
                        {pipeline && currentPipeline && inputSetTemplateYaml && existingProvide === 'existing' && (
                          <GitSyncStoreProvider>
                            <InputSetSelector
                              pipelineIdentifier={pipelineId}
                              onChange={inputsets => {
                                setSelectedInputSets(inputsets)
                              }}
                              value={selectedInputSets}
                            />
                          </GitSyncStoreProvider>
                        )}
                      </Layout.Vertical>
                    )
                  )}

                  {renderPipelineInputSetForm()}
                  {existingProvide === 'existing' && selectedInputSets && selectedInputSets?.length > 0 && (
                    <div className={css.noPipelineInputSetForm} />
                  )}
                </FormikForm>
              </div>
            ) : (
              <div className={css.editor}>
                <Layout.Vertical className={css.content} padding="xlarge">
                  <YamlBuilderMemo
                    {...yamlBuilderReadOnlyModeProps}
                    existingJSON={{ pipeline: values }}
                    bind={setYamlHandler}
                    schema={{}}
                    invocationMap={factory.getInvocationMap()}
                    height="55vh"
                    width="100%"
                    showSnippetSection={false}
                    isEditModeSupported={canEdit}
                  />
                </Layout.Vertical>
              </div>
            )}

            <Layout.Horizontal
              margin={{ left: 'xlarge', right: 'xlarge', top: 'medium', bottom: 'medium' }}
              className={css.footerContainer}
            >
              <Checkbox
                label={getString('pre-flight-check.skipCheckBtn')}
                background={Color.GREY_100}
                color={skipPreFlightCheck ? Color.PRIMARY_8 : Color.BLACK}
                className={css.footerCheckbox}
                checked={skipPreFlightCheck}
                onChange={e => setSkipPreFlightCheck(e.currentTarget.checked)}
              />
              <Tooltip position="top" content={getString('featureNA')}>
                <Checkbox
                  background={notifyOnlyMe ? Color.PRIMARY_2 : Color.GREY_100}
                  color={notifyOnlyMe ? Color.PRIMARY_7 : Color.BLACK}
                  className={css.footerCheckbox}
                  margin={{ left: 'medium' }}
                  disabled
                  label={getString('pipeline.runPipelineForm.notifyOnlyMe')}
                  checked={notifyOnlyMe}
                  onChange={e => setNotifyOnlyMe(e.currentTarget.checked)}
                />
              </Tooltip>
            </Layout.Horizontal>

            <Layout.Horizontal
              padding={{ left: 'xlarge', right: 'xlarge', top: 'large', bottom: 'large' }}
              flex={{ justifyContent: 'space-between', alignItems: 'center' }}
              className={css.footer}
            >
              <Layout.Horizontal className={cx(css.actionButtons)}>
                <RbacButton
                  variation={ButtonVariation.PRIMARY}
                  intent="success"
                  type="submit"
                  text={getString('pipeline.retryPipeline')}
                  onClick={event => {
                    event.stopPropagation()
                    setRetryClicked(true)
                    if ((!selectedInputSets || selectedInputSets.length === 0) && existingProvide === 'existing') {
                      setExistingProvide('provide')
                    } else {
                      submitForm()
                    }
                  }}
                  featuresProps={getFeaturePropsForRunPipelineButton({ modules, getString })}
                  permission={{
                    resource: {
                      resourceIdentifier: pipeline?.identifier as string,
                      resourceType: ResourceType.PIPELINE
                    },
                    permission: PermissionIdentifier.EXECUTE_PIPELINE
                  }}
                  disabled={getRetryPipelineDisabledState()}
                  data-testid="retry-failed-pipeline"
                />
                <div className={css.secondaryButton}>
                  <Button
                    variation={ButtonVariation.SECONDARY}
                    id="cancel-runpipeline"
                    text={getString('cancel')}
                    margin={{ left: 'medium' }}
                    background={Color.GREY_50}
                    onClick={() => {
                      if (onClose) {
                        onClose()
                      }
                    }}
                  />
                </div>
              </Layout.Horizontal>
              <SaveAsInputSet
                pipeline={pipeline}
                currentPipeline={currentPipeline}
                values={values}
                template={inputSetTemplateYaml}
                canEdit={canEdit}
                accountId={accountId}
                projectIdentifier={projectIdentifier}
                orgIdentifier={orgIdentifier}
                repoIdentifier={repoIdentifier}
                branch={branch}
                isGitSyncEnabled={isGitSyncEnabled}
                setFormErrors={setFormErrors}
                refetchParentData={() => getInputSetsList()}
              />
            </Layout.Horizontal>
          </Layout.Vertical>
        )
      }}
    </Formik>
  )
}
export default RetryPipeline
