/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, Classes } from '@blueprintjs/core'
import {
  Button,
  Formik,
  Layout,
  NestedAccordionProvider,
  ButtonVariation,
  PageSpinner,
  VisualYamlSelectedView as SelectedView,
  SelectOption
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useModalHook } from '@harness/use-modal'
import cx from 'classnames'
import { useHistory } from 'react-router-dom'
import { isEmpty, defaultTo, keyBy } from 'lodash-es'
import type { FormikErrors, FormikProps } from 'formik'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import {
  PipelineConfig,
  PipelineInfoConfig,
  ResponseJsonNode,
  useGetPipeline,
  usePostPipelineExecuteWithInputSetYaml,
  useRePostPipelineExecuteWithInputSetYaml,
  StageExecutionResponse,
  useRunStagesWithRuntimeInputYaml,
  useRerunStagesWithRuntimeInputYaml,
  useGetStagesExecutionList,
  useValidateTemplateInputs
} from 'services/pipeline-ng'
import { useToaster } from '@common/exports'
import routes from '@common/RouteDefinitions'
import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import { usePermission } from '@rbac/hooks/usePermission'
import type {
  ExecutionPathProps,
  GitQueryParams,
  InputSetGitQueryParams,
  PipelinePathProps,
  PipelineType
} from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import RbacButton from '@rbac/components/Button/Button'
import {
  ALL_STAGE_VALUE,
  clearRuntimeInput,
  getAllStageData,
  getAllStageItem,
  getFeaturePropsForRunPipelineButton,
  SelectedStageData,
  StageSelectionData
} from '@pipeline/utils/runPipelineUtils'
import { useQueryParams } from '@common/hooks'
import { yamlStringify, yamlParse } from '@common/utils/YamlHelperMethods'
import { PipelineActions } from '@common/constants/TrackingConstants'
import { useTelemetry } from '@common/hooks/useTelemetry'
import type { InputSetDTO } from '@pipeline/utils/types'
import {
  isCloneCodebaseEnabledAtLeastOneStage,
  isCodebaseFieldsRuntimeInputs,
  getPipelineWithoutCodebaseInputs
} from '@pipeline/utils/CIUtils'
import { useDeepCompareEffect } from '@common/hooks/useDeepCompareEffect'
import { StoreType } from '@common/constants/GitSyncTypes'
import { YamlBuilderMemo } from '@common/components/YAMLBuilder/YamlBuilder'
import { PipelineErrorView } from '@pipeline/components/RunPipelineModal/PipelineErrorView'
import { getErrorsList } from '@pipeline/utils/errorUtils'
import { validatePipeline } from '../PipelineStudio/StepUtil'
import { PreFlightCheckModal } from '../PreFlightCheckModal/PreFlightCheckModal'

import factory from '../PipelineSteps/PipelineStepFactory'
import { StepViewType } from '../AbstractSteps/Step'
import SaveAsInputSet from './SaveAsInputSet'
import ReplacedExpressionInputForm from './ReplacedExpressionInputForm'
import {
  KVPair,
  PipelineVariablesContextProvider,
  usePipelineVariables
} from '../PipelineVariablesContext/PipelineVariablesContext'
import type { InputSetSelectorProps } from '../InputSetSelector/InputSetSelector'
import { ApprovalStageInfo, ExpressionsInfo, RequiredStagesInfo } from './RunStageInfoComponents'
import { PipelineInvalidRequestContent } from './PipelineInvalidRequestContent'
import RunModalHeader from './RunModalHeader'
import CheckBoxActions from './CheckBoxActions'
import VisualView from './VisualView'
import { Pipeline, useInputSets } from './useInputSets'

import css from './RunPipelineForm.module.scss'

export interface RunPipelineFormProps extends PipelineType<PipelinePathProps & GitQueryParams> {
  inputSetSelected?: InputSetSelectorProps['value']
  inputSetYAML?: string
  onClose?: () => void
  executionView?: boolean
  mockData?: ResponseJsonNode
  executionInputSetTemplateYaml?: string
  stagesExecuted?: string[]
  executionIdentifier?: string
  source: ExecutionPathProps['source']
}

const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
  fileName: `run-pipeline.yaml`,
  entityType: 'Pipelines',
  showSnippetSection: false,
  yamlSanityConfig: {
    removeEmptyString: false,
    removeEmptyObject: false,
    removeEmptyArray: false
  }
}

function RunPipelineFormBasic({
  pipelineIdentifier,
  accountId,
  orgIdentifier,
  projectIdentifier,
  onClose,
  inputSetSelected,
  inputSetYAML,
  module,
  executionView,
  branch,
  source,
  repoIdentifier,
  connectorRef,
  storeType,
  executionInputSetTemplateYaml = '',
  stagesExecuted,
  executionIdentifier
}: RunPipelineFormProps & InputSetGitQueryParams): React.ReactElement {
  const [skipPreFlightCheck, setSkipPreFlightCheck] = useState<boolean>(false)
  const [selectedView, setSelectedView] = useState<SelectedView>(SelectedView.VISUAL)
  const [notifyOnlyMe, setNotifyOnlyMe] = useState<boolean>(false)
  const [selectedInputSets, setSelectedInputSets] = useState<InputSetSelectorProps['value']>(inputSetSelected)
  const [formErrors, setFormErrors] = useState<FormikErrors<InputSetDTO>>({})
  const { trackEvent } = useTelemetry()
  const { showError, showSuccess, showWarning } = useToaster()
  const formikRef = React.useRef<FormikProps<PipelineInfoConfig>>()
  const history = useHistory()
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()
  const { isGitSyncEnabled, isGitSimplificationEnabled } = useAppStore()
  const [runClicked, setRunClicked] = useState(false)
  const [expressionFormState, setExpressionFormState] = useState<KVPair>({})
  const [selectedStageData, setSelectedStageData] = useState<StageSelectionData>({
    allStagesSelected: true,
    selectedStages: [getAllStageData(getString)],
    selectedStageItems: [getAllStageItem(getString)]
  })
  const { setPipeline: updatePipelineInVaribalesContext } = usePipelineVariables()
  const [existingProvide, setExistingProvide] = useState<'existing' | 'provide'>('existing')
  const [yamlHandler, setYamlHandler] = useState<YamlBuilderHandlerBinding | undefined>()

  const [canEdit] = usePermission(
    {
      resourceScope: {
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier
      },
      resource: {
        resourceType: ResourceType.PIPELINE,
        resourceIdentifier: pipelineIdentifier
      },
      permissions: [PermissionIdentifier.EDIT_PIPELINE]
    },
    [accountId, orgIdentifier, projectIdentifier, pipelineIdentifier]
  )

  const stageIdentifiers = useMemo((): string[] => {
    let stageIds: string[] = []
    stageIds = stagesExecuted?.length
      ? stagesExecuted
      : selectedStageData.allStagesSelected
      ? []
      : (selectedStageData.selectedStageItems.map(stageData => stageData.value) as string[])
    if (stageIds.includes(ALL_STAGE_VALUE)) {
      stageIds = []
    }
    return stageIds
  }, [stagesExecuted, selectedStageData])

  const { data: pipelineResponse, loading: loadingPipeline } = useGetPipeline({
    pipelineIdentifier,
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
      identifier: pipelineIdentifier,
      repoIdentifier,
      branch,
      getDefaultFromOtherRepo: true
    }
  })

  const pipeline: PipelineInfoConfig | undefined = React.useMemo(
    () => yamlParse<PipelineConfig>(defaultTo(pipelineResponse?.data?.yamlPipeline, ''))?.pipeline,
    [pipelineResponse?.data?.yamlPipeline]
  )

  const resolvedPipeline: PipelineInfoConfig | undefined = React.useMemo(
    () => yamlParse<PipelineConfig>(defaultTo(pipelineResponse?.data?.resolvedTemplatesPipelineYaml, ''))?.pipeline,
    [pipelineResponse?.data?.resolvedTemplatesPipelineYaml]
  )

  const {
    inputSet,
    inputSetTemplate,
    inputSetYamlResponse,
    hasInputSets,
    loading: loadingInputSets,
    error: inputSetsError,
    isInputSetApplied,
    refetch: getTemplateFromPipeline,
    hasRuntimeInputs
  } = useInputSets({
    accountId,
    projectIdentifier,
    orgIdentifier,
    pipelineIdentifier,
    selectedStageData,
    rerunInputSetYaml: inputSetYAML,
    branch,
    repoIdentifier,
    executionIdentifier,
    inputSetSelected: selectedInputSets,
    resolvedPipeline,
    executionInputSetTemplateYaml,
    executionView
  })

  const { mutate: runPipeline, loading: runLoading } = usePostPipelineExecuteWithInputSetYaml({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      moduleType: module,
      repoIdentifier,
      branch
    },
    identifier: pipelineIdentifier,
    requestOptions: {
      headers: {
        'content-type': 'application/yaml'
      }
    }
  })

  const { mutate: runStage, loading: runStageLoading } = useRunStagesWithRuntimeInputYaml({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      moduleType: module,
      repoIdentifier,
      branch
    },
    identifier: pipelineIdentifier
  })
  const { executionId } = useQueryParams<{ executionId?: string }>()
  const pipelineExecutionId = executionIdentifier ?? executionId
  const { mutate: reRunPipeline, loading: reRunLoading } = useRePostPipelineExecuteWithInputSetYaml({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      moduleType: module,
      repoIdentifier,
      branch
    },
    identifier: pipelineIdentifier,
    originalExecutionId: defaultTo(pipelineExecutionId, ''),
    requestOptions: {
      headers: {
        'content-type': 'application/yaml'
      }
    }
  })
  const { mutate: reRunStages, loading: reRunStagesLoading } = useRerunStagesWithRuntimeInputYaml({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      moduleType: module,
      repoIdentifier,
      branch
    },
    identifier: pipelineIdentifier,
    originalExecutionId: defaultTo(pipelineExecutionId, '')
  })

  const { data: stageExecutionData } = useGetStagesExecutionList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      pipelineIdentifier,
      branch,
      repoIdentifier
    }
  })

  const executionStageList = useMemo((): SelectOption[] => {
    const executionStages: SelectOption[] =
      stageExecutionData?.data?.map((execStage: StageExecutionResponse) => {
        return {
          label: defaultTo(execStage?.stageName, ''),
          value: defaultTo(execStage?.stageIdentifier, '')
        }
      }) || []
    executionStages.unshift(getAllStageItem(getString))

    if (stagesExecuted?.length) {
      const updatedSelectedStageList: SelectedStageData[] = []
      const updatedSelectedItems: SelectOption[] = []
      stagesExecuted.forEach(stageExecuted => {
        const selectedStage = stageExecutionData?.data?.find(stageData => stageData.stageIdentifier === stageExecuted)
        selectedStage && updatedSelectedStageList.push(selectedStage)
        selectedStage &&
          updatedSelectedItems.push({
            label: selectedStage?.stageName as string,
            value: selectedStage?.stageIdentifier as string
          })
      })

      setSelectedStageData({
        selectedStages: updatedSelectedStageList,
        selectedStageItems: updatedSelectedItems,
        allStagesSelected: false
      })
      setSkipPreFlightCheck(true)
    } else {
      setSelectedStageData({
        selectedStages: [getAllStageData(getString)],
        selectedStageItems: [getAllStageItem(getString)],
        allStagesSelected: true
      })
    }
    return executionStages
  }, [stageExecutionData?.data])

  useEffect(() => {
    setSelectedInputSets(inputSetSelected)
  }, [inputSetSelected])

  useEffect(() => {
    if (inputSetYAML) {
      setExistingProvide('provide')
    } else {
      setExistingProvide(hasInputSets ? 'existing' : 'provide')
    }
  }, [inputSetYAML, hasInputSets])

  useEffect(() => {
    if (inputSetsError) {
      showError(getRBACErrorMessage(inputSetsError))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputSetsError])

  const valuesPipelineRef = useRef<PipelineInfoConfig>()

  useDeepCompareEffect(() => {
    if (resolvedPipeline) {
      updatePipelineInVaribalesContext(resolvedPipeline)
    }
  }, [resolvedPipeline])

  useEffect(() => {
    // only applied for CI, Not cloned codebase
    if (
      formikRef?.current?.values?.template?.templateInputs &&
      isCodebaseFieldsRuntimeInputs(formikRef.current.values.template.templateInputs as PipelineInfoConfig) &&
      resolvedPipeline &&
      !isCloneCodebaseEnabledAtLeastOneStage(resolvedPipeline)
    ) {
      const newPipeline = getPipelineWithoutCodebaseInputs(formikRef.current.values)
      formikRef.current.setValues({ ...formikRef.current.values, ...newPipeline })
    }
  }, [formikRef?.current?.values?.template?.templateInputs, resolvedPipeline])

  useEffect(() => {
    setSkipPreFlightCheck(defaultTo(isGitSimplificationEnabled && storeType === StoreType.REMOTE, false))
  }, [isGitSimplificationEnabled, storeType])

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
          pipelineIdentifier={pipelineIdentifier}
          branch={branch}
          repoIdentifier={repoIdentifier}
          onCloseButtonClick={hidePreflightCheckModal}
          onContinuePipelineClick={() => {
            hidePreflightCheckModal()
            handleRunPipeline(valuesPipelineRef.current, true)
          }}
        />
      </Dialog>
    )
  }, [])

  const handleRunPipeline = useCallback(
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
      const expressionValues: KVPair = {}
      Object.entries(expressionFormState).forEach(([key, value]: string[]) => {
        expressionValues[key] = value
      })

      try {
        let response
        if (isEmpty(pipelineExecutionId)) {
          response = selectedStageData.allStagesSelected
            ? await runPipeline(
                !isEmpty(valuesPipelineRef.current)
                  ? (yamlStringify({ pipeline: valuesPipelineRef.current }) as any)
                  : ''
              )
            : await runStage({
                runtimeInputYaml: !isEmpty(valuesPipelineRef.current)
                  ? (yamlStringify({ pipeline: valuesPipelineRef.current }) as any)
                  : '',
                stageIdentifiers: stageIdentifiers,
                expressionValues
              })
        } else {
          response = selectedStageData.allStagesSelected
            ? await reRunPipeline(
                !isEmpty(valuesPipelineRef.current)
                  ? (yamlStringify({ pipeline: valuesPipelineRef.current }) as any)
                  : ''
              )
            : await reRunStages({
                runtimeInputYaml: !isEmpty(valuesPipelineRef.current)
                  ? (yamlStringify({ pipeline: valuesPipelineRef.current }) as any)
                  : '',
                stageIdentifiers: stageIdentifiers,
                expressionValues
              })
        }

        const data = response.data
        const governanceMetadata = data?.planExecution?.governanceMetadata

        if (response.status === 'SUCCESS') {
          if (onClose) {
            onClose()
          }
          if (response.data) {
            showSuccess(getString('runPipelineForm.pipelineRunSuccessFully'))
            history.push({
              pathname: routes.toExecutionPipelineView({
                orgIdentifier,
                pipelineIdentifier,
                projectIdentifier,
                executionIdentifier: defaultTo(data?.planExecution?.uuid, ''),
                accountId,
                module,
                source
              }),
              state: {
                shouldShowGovernanceEvaluations:
                  governanceMetadata?.status === 'error' || governanceMetadata?.status === 'warning',
                governanceMetadata
              }
            })
            trackEvent(PipelineActions.StartedExecution, { module })
          }
        }
      } catch (error: any) {
        showWarning(defaultTo(getRBACErrorMessage(error), getString('runPipelineForm.runPipelineFailed')))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      runPipeline,
      runStage,
      showWarning,
      showSuccess,
      pipelineIdentifier,
      history,
      orgIdentifier,
      module,
      projectIdentifier,
      onClose,
      accountId,
      skipPreFlightCheck,
      formErrors,
      selectedStageData
    ]
  )

  function handleModeSwitch(view: SelectedView): void {
    if (view === SelectedView.VISUAL && yamlHandler && formikRef.current) {
      const parsedYaml = yamlParse<PipelineConfig>(defaultTo(yamlHandler.getLatestYaml(), ''))

      if (parsedYaml.pipeline) {
        formikRef.current.setValues(parsedYaml.pipeline)
        formikRef.current.validateForm(parsedYaml.pipeline)
      }
    }
    setSelectedView(view)
  }

  const blockedStagesSelected = useMemo(() => {
    let areDependentStagesSelected = false
    if (selectedStageData.allStagesSelected) {
      return areDependentStagesSelected
    }

    const allRequiredStagesUpdated: string[] = []
    const stagesSelectedMap: { [key: string]: SelectedStageData } = keyBy(
      selectedStageData.selectedStages,
      'stageIdentifier'
    )
    selectedStageData.selectedStages.forEach((stage: StageExecutionResponse) => {
      if (stage.toBeBlocked) {
        allRequiredStagesUpdated.push(...(stage.stagesRequired || []))
      }
    })

    allRequiredStagesUpdated.forEach((stageId: string) => {
      if (!stagesSelectedMap[stageId]) {
        areDependentStagesSelected = true
      }
    })

    return areDependentStagesSelected
  }, [selectedStageData])

  useDeepCompareEffect(() => {
    if (inputSet?.pipeline && formikRef.current) {
      formikRef.current.setValues(inputSet.pipeline)

      if (isInputSetApplied) {
        formikRef.current.validateForm(inputSet.pipeline)
      }
    }
  }, [inputSet, isInputSetApplied])

  const updateExpressionValue = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (!e.target) {
      return
    }

    const keyName: string = e.target.name
    const exprValue: string = defaultTo(e.target.value, '').trim()
    setExpressionFormState(
      (oldState: KVPair): KVPair => ({
        ...oldState,
        [keyName]: exprValue
      })
    )
    if (formErrors) {
      const formErrorsUpdated = { ...formErrors }
      if (!(formErrors as any)[keyName] && isEmpty(exprValue)) {
        ;(formErrorsUpdated as any)[keyName] = getString('pipeline.expressionRequired')
      } else if ((formErrors as any)[keyName] && !isEmpty(exprValue)) {
        delete (formErrorsUpdated as any)[keyName]
      }

      setFormErrors(formErrorsUpdated)
    }
  }

  const getFormErrors = async (
    latestPipeline: { pipeline: PipelineInfoConfig },
    latestYamlTemplate: PipelineInfoConfig,
    orgPipeline: PipelineInfoConfig | undefined
  ): Promise<FormikErrors<InputSetDTO>> => {
    let errors = formErrors
    function validateErrors(): Promise<FormikErrors<InputSetDTO>> {
      return new Promise(resolve => {
        setTimeout(() => {
          const validatedErrors =
            (validatePipeline({
              pipeline: { ...clearRuntimeInput(latestPipeline.pipeline) },
              template: latestYamlTemplate,
              originalPipeline: orgPipeline,
              resolvedPipeline,
              getString,
              viewType: StepViewType.DeploymentForm
            }) as any) || formErrors
          resolve(validatedErrors)
        }, 300)
      })
    }
    if (latestPipeline?.pipeline && latestYamlTemplate && orgPipeline) {
      errors = await validateErrors()
      const expressionErrors: KVPair = {}

      // vaidate replacedExpressions
      if (inputSetYamlResponse?.data?.replacedExpressions?.length) {
        inputSetYamlResponse.data.replacedExpressions.forEach((value: string) => {
          const currValue = defaultTo(expressionFormState[value], '')
          if (currValue.trim() === '') expressionErrors[value] = getString('pipeline.expressionRequired')
        })
      }
      setFormErrors({ ...errors, ...expressionErrors })
    }
    return errors
  }

  const shouldShowPageSpinner = (): boolean => {
    return (
      loadingPipeline ||
      runLoading ||
      runStageLoading ||
      reRunLoading ||
      reRunStagesLoading ||
      loadingInputSets ||
      loadingValidateTemplateInputs
    )
  }

  const formRefDom = React.useRef<HTMLElement | undefined>()
  const handleValidation = async (values: Pipeline | PipelineInfoConfig): Promise<FormikErrors<InputSetDTO>> => {
    let pl: PipelineInfoConfig | undefined

    if ((values as Pipeline)?.pipeline) {
      pl = (values as Pipeline)?.pipeline
    } else {
      pl = values as PipelineInfoConfig
    }

    const runPipelineFormErrors = await getFormErrors(
      { pipeline: pl } as Required<Pipeline>,
      defaultTo(inputSetTemplate?.pipeline, {} as PipelineInfoConfig),
      pipeline
    )
    // https://github.com/formium/formik/issues/1392
    return runPipelineFormErrors
  }

  if (shouldShowPageSpinner()) {
    return <PageSpinner />
  }

  function handleInputSetSave(newId?: string): void {
    if (newId) {
      setSelectedInputSets([{ label: newId, value: newId, type: 'INPUT_SET' }])
    }
    getTemplateFromPipeline()
  }

  let runPipelineFormContent: React.ReactElement | null = null

  if (validateTemplateInputsResponse?.data?.validYaml === false) {
    // repoName={repoIdentifier} because values is calculated at top and one of them (repoIdentifier, repoName)
    // will be undefined based on the enabled flag (isGitSyncEnabled)
    runPipelineFormContent = (
      <PipelineErrorView
        errorNodeSummary={validateTemplateInputsResponse.data.errorNodeSummary}
        pipelineIdentifier={pipelineIdentifier}
        repoIdentifier={repoIdentifier}
        repoName={repoIdentifier}
        branch={branch}
        connectorRef={connectorRef}
        storeType={storeType}
      />
    )
  } else if (inputSetsError?.message) {
    runPipelineFormContent = <PipelineInvalidRequestContent onClose={onClose} getTemplateError={inputSetsError} />
  } else {
    runPipelineFormContent = (
      <>
        <Formik<PipelineInfoConfig>
          initialValues={defaultTo(inputSet.pipeline, {} as PipelineInfoConfig)}
          formName="runPipeline"
          onSubmit={values => {
            handleRunPipeline(values, false)
          }}
          validate={handleValidation}
        >
          {formik => {
            const { submitForm, values, setValues, setFormikState } = formik
            formikRef.current = formik
            valuesPipelineRef.current = values

            return (
              <Layout.Vertical
                ref={ref => {
                  formRefDom.current = ref as HTMLElement
                }}
              >
                <RunModalHeader
                  pipelineExecutionId={pipelineExecutionId}
                  selectedStageData={selectedStageData}
                  setSelectedStageData={setSelectedStageData}
                  setSkipPreFlightCheck={setSkipPreFlightCheck}
                  handleModeSwitch={handleModeSwitch}
                  runClicked={runClicked}
                  selectedView={selectedView}
                  executionView={executionView}
                  pipelineResponse={pipelineResponse}
                  getTemplateFromPipeline={getTemplateFromPipeline}
                  template={inputSetYamlResponse}
                  formRefDom={formRefDom}
                  formErrors={formErrors}
                  stageExecutionData={stageExecutionData}
                  executionStageList={executionStageList}
                />
                <RequiredStagesInfo
                  selectedStageData={selectedStageData}
                  blockedStagesSelected={blockedStagesSelected}
                  getString={getString}
                />
                <ApprovalStageInfo pipeline={pipeline} selectedStageData={selectedStageData} />
                <ExpressionsInfo template={inputSetYamlResponse} getString={getString} />
                <ReplacedExpressionInputForm
                  updateExpressionValue={updateExpressionValue}
                  expressions={inputSetYamlResponse?.data?.replacedExpressions}
                />
                {selectedView === SelectedView.VISUAL ? (
                  <VisualView
                    executionView={executionView}
                    selectedInputSets={selectedInputSets}
                    existingProvide={existingProvide}
                    setExistingProvide={setExistingProvide}
                    hasRuntimeInputs={hasRuntimeInputs}
                    pipelineIdentifier={pipelineIdentifier}
                    executionIdentifier={pipelineExecutionId}
                    template={defaultTo(inputSetTemplate?.pipeline, {} as PipelineInfoConfig)}
                    pipeline={pipeline}
                    currentPipeline={{ pipeline: values }}
                    getTemplateError={inputSetsError}
                    resolvedPipeline={resolvedPipeline}
                    submitForm={submitForm}
                    setRunClicked={setRunClicked}
                    hasInputSets={hasInputSets}
                    setSelectedInputSets={setSelectedInputSets}
                    loading={false}
                    loadingMergeInputSetUpdate={false}
                  />
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
                <CheckBoxActions
                  executionView={executionView}
                  notifyOnlyMe={notifyOnlyMe}
                  skipPreFlightCheck={skipPreFlightCheck}
                  setSkipPreFlightCheck={setSkipPreFlightCheck}
                  setNotifyOnlyMe={setNotifyOnlyMe}
                  storeType={storeType as StoreType}
                />
                {executionView ? null : (
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
                        text={getString('runPipeline')}
                        onClick={event => {
                          event.stopPropagation()
                          setRunClicked(true)
                          // _formSubmitCount is custom state var used to track submitCount.
                          // enableReinitialize prop resets the submitCount, so error checks fail.
                          setFormikState(prevState => ({ ...prevState, _formSubmitCount: 1 }))
                          if (
                            (!selectedInputSets || selectedInputSets.length === 0) &&
                            existingProvide === 'existing'
                          ) {
                            setExistingProvide('provide')
                          } else {
                            if (selectedView === SelectedView.YAML) {
                              const parsedYaml = yamlParse<PipelineConfig>(defaultTo(yamlHandler?.getLatestYaml(), ''))
                              if (parsedYaml.pipeline) {
                                setValues(parsedYaml.pipeline)
                                setTimeout(() => {
                                  submitForm()
                                }, 0)
                              }
                            } else {
                              submitForm()
                            }
                          }
                        }}
                        featuresProps={getFeaturePropsForRunPipelineButton({
                          modules: inputSetYamlResponse?.data?.modules,
                          getString
                        })}
                        permission={{
                          resource: {
                            resourceIdentifier: pipeline?.identifier as string,
                            resourceType: ResourceType.PIPELINE
                          },
                          permission: PermissionIdentifier.EXECUTE_PIPELINE
                        }}
                        disabled={blockedStagesSelected || (getErrorsList(formErrors).errorCount > 0 && runClicked)}
                      />
                      <div className={css.secondaryButton}>
                        <Button
                          variation={ButtonVariation.TERTIARY}
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
                      key="saveasinput"
                      pipeline={pipeline}
                      currentPipeline={{ pipeline: values }}
                      values={values}
                      template={inputSetYamlResponse?.data?.inputSetTemplateYaml}
                      canEdit={canEdit}
                      accountId={accountId}
                      projectIdentifier={projectIdentifier}
                      orgIdentifier={orgIdentifier}
                      connectorRef={connectorRef}
                      repoIdentifier={repoIdentifier || pipelineResponse?.data?.gitDetails?.repoName}
                      branch={branch || pipelineResponse?.data?.gitDetails?.branch}
                      storeType={storeType}
                      isGitSyncEnabled={isGitSyncEnabled}
                      isGitSimplificationEnabled={isGitSimplificationEnabled}
                      setFormErrors={setFormErrors}
                      refetchParentData={handleInputSetSave}
                    />
                  </Layout.Horizontal>
                )}
              </Layout.Vertical>
            )
          }}
        </Formik>
      </>
    )
  }

  return executionView ? (
    <div className={css.runFormExecutionView}>{runPipelineFormContent}</div>
  ) : (
    <RunPipelineFormWrapper
      accountId={accountId}
      orgIdentifier={orgIdentifier}
      pipelineIdentifier={pipelineIdentifier}
      projectIdentifier={projectIdentifier}
      module={module}
      pipeline={pipeline}
    >
      {runPipelineFormContent}
    </RunPipelineFormWrapper>
  )
}

export interface RunPipelineFormWrapperProps extends PipelineType<PipelinePathProps> {
  children: React.ReactNode
  pipeline?: PipelineInfoConfig
}

export function RunPipelineFormWrapper(props: RunPipelineFormWrapperProps): React.ReactElement {
  const { children } = props

  return (
    <React.Fragment>
      <div className={css.runForm}>{children}</div>
    </React.Fragment>
  )
}

export function RunPipelineForm(props: RunPipelineFormProps & InputSetGitQueryParams): React.ReactElement {
  return (
    <NestedAccordionProvider>
      <PipelineVariablesContextProvider>
        <RunPipelineFormBasic {...props} />
      </PipelineVariablesContextProvider>
    </NestedAccordionProvider>
  )
}
