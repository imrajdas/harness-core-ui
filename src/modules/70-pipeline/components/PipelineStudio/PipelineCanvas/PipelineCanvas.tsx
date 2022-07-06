/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Classes, Dialog, IDialogProps, Intent } from '@blueprintjs/core'
import cx from 'classnames'
import {
  Text,
  Icon,
  Layout,
  Button,
  SelectOption,
  Container,
  ButtonVariation,
  useToaster,
  PageSpinner,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle,
  useConfirmationDialog
} from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { useHistory, useParams, matchPath } from 'react-router-dom'
import { parse } from 'yaml'
import { defaultTo, isEmpty, isEqual, merge, omit } from 'lodash-es'
import produce from 'immer'
import type { PipelineInfoConfig } from 'services/pipeline-ng'
import { useStrings } from 'framework/strings'
import { AppStoreContext, useAppStore } from 'framework/AppStore/AppStoreContext'
import { NavigationCheck } from '@common/components/NavigationCheck/NavigationCheck'
import { accountPathProps, pipelinePathProps, pipelineModuleParams } from '@common/utils/routeUtils'
import type {
  PipelinePathProps,
  ProjectPathProps,
  PathFn,
  PipelineType,
  GitQueryParams,
  PipelineStudioQueryParams,
  RunPipelineQueryParams
} from '@common/interfaces/RouteInterfaces'
import RbacButton from '@rbac/components/Button/Button'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import routes from '@common/RouteDefinitions'
import {
  EntityGitDetails,
  useGetTemplateFromPipeline,
  InputSetSummaryResponse,
  useGetInputsetYaml
} from 'services/pipeline-ng'
import { useMutateAsGet, useQueryParams, useUpdateQueryParams } from '@common/hooks'
import type { GitFilterScope } from '@common/components/GitFilters/GitFilters'
import { TagsPopover } from '@common/components'
import type { IGitContextFormProps } from '@common/components/GitContextForm/GitContextForm'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { PipelineVariablesContextProvider } from '@pipeline/components/PipelineVariablesContext/PipelineVariablesContext'
import GenericErrorHandler from '@common/pages/GenericErrorHandler/GenericErrorHandler'
import NoEntityFound from '@pipeline/pages/utils/NoEntityFound/NoEntityFound'
import { getFeaturePropsForRunPipelineButton } from '@pipeline/utils/runPipelineUtils'
import { RunPipelineForm } from '@pipeline/components/RunPipelineModal/RunPipelineForm'
import { createTemplate } from '@pipeline/utils/templateUtils'
import StageBuilder from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilder'
import { TemplatePipelineBuilder } from '@pipeline/components/PipelineStudio/PipelineTemplateBuilder/TemplatePipelineBuilder/TemplatePipelineBuilder'
import { SavePipelinePopover } from '@pipeline/components/PipelineStudio/SavePipelinePopover/SavePipelinePopover'
import { useSaveTemplateListener } from '@pipeline/components/PipelineStudio/hooks/useSaveTemplateListener'
import { StoreMetadata, StoreType } from '@common/constants/GitSyncTypes'
import GitRemoteDetails from '@common/components/GitRemoteDetails/GitRemoteDetails'
import { OutOfSyncErrorStrip } from '@pipeline/components/TemplateLibraryErrorHandling/OutOfSyncErrorStrip/OutOfSyncErrorStrip'
import { useTemplateSelector } from 'framework/Templates/TemplateSelectorContext/useTemplateSelector'
import { usePipelineContext } from '../PipelineContext/PipelineContext'
import CreatePipelines from '../CreateModal/PipelineCreate'
import { DefaultNewPipelineId, DrawerTypes } from '../PipelineContext/PipelineActions'
import PipelineYamlView from '../PipelineYamlView/PipelineYamlView'
import { RightBar } from '../RightBar/RightBar'
import StudioGitPopover from '../StudioGitPopover'
import usePipelineErrors from './PipelineErrors/usePipelineErrors'
import css from './PipelineCanvas.module.scss'

interface OtherModalProps {
  onSubmit?: (values: PipelineInfoConfig) => void
  initialValues?: PipelineInfoConfig
  onClose?: () => void
}

interface PipelineWithGitContextFormProps extends PipelineInfoConfig {
  repo?: string
  branch?: string
  connectorRef?: string
  filePath?: string
  storeType?: string
}

interface InputSetValue extends SelectOption {
  type: InputSetSummaryResponse['inputSetType']
  gitDetails?: EntityGitDetails
}

const runModalProps: IDialogProps = {
  isOpen: true,
  // usePortal: true,
  autoFocus: true,
  canEscapeKeyClose: true,
  canOutsideClickClose: false,
  enforceFocus: false,
  className: css.runPipelineDialog,
  style: { width: 872, height: 'fit-content', overflow: 'auto' },
  isCloseButtonShown: false
}

export interface PipelineCanvasProps {
  // diagram?: DiagramFactory
  toPipelineStudio: PathFn<PipelineType<PipelinePathProps> & PipelineStudioQueryParams>
  toPipelineDetail: PathFn<PipelineType<PipelinePathProps>>
  toPipelineList: PathFn<PipelineType<ProjectPathProps>>
  toPipelineProject: PathFn<PipelineType<ProjectPathProps>>
  getOtherModal?: (
    onSubmit: (values: PipelineInfoConfig, storeMetadata?: StoreMetadata, gitDetails?: EntityGitDetails) => void,
    onClose: () => void
  ) => React.ReactElement<OtherModalProps>
}

export function PipelineCanvas({
  // diagram,
  toPipelineList,
  toPipelineStudio,
  getOtherModal
}: PipelineCanvasProps): JSX.Element {
  const { isGitSyncEnabled } = React.useContext(AppStoreContext)
  const {
    state,
    updatePipeline,
    updatePipelineStoreMetadata,
    updateGitDetails,
    deletePipelineCache,
    fetchPipeline,
    view,
    setView,
    isReadonly,
    updatePipelineView,
    setSelectedStageId,
    setSelectedSectionId
  } = usePipelineContext()
  const { getTemplate } = useTemplateSelector()
  const {
    repoIdentifier,
    branch,
    runPipeline,
    executionId,
    inputSetType,
    inputSetValue,
    inputSetLabel,
    inputSetRepoIdentifier,
    inputSetBranch,
    stagesExecuted,
    repoName,
    connectorRef,
    storeType
  } = useQueryParams<GitQueryParams & RunPipelineQueryParams>()
  const { updateQueryParams, replaceQueryParams } = useUpdateQueryParams<PipelineStudioQueryParams>()
  const {
    pipeline,
    isUpdated,
    pipelineView: { isYamlEditable },
    pipelineView,
    isLoading,
    isInitialized,
    originalPipeline,
    yamlHandler,
    isBEPipelineUpdated,
    gitDetails,
    entityValidityDetails,
    templateError,
    templateInputsErrorNodeSummary,
    yamlSchemaErrorWrapper
  } = state

  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier, pipelineIdentifier, module } = useParams<
    PipelineType<{
      orgIdentifier: string
      projectIdentifier: string
      pipelineIdentifier: string
      accountId: string
    }> &
      GitQueryParams
  >()

  const { data: template } = useMutateAsGet(useGetTemplateFromPipeline, {
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      pipelineIdentifier,
      projectIdentifier,
      repoIdentifier,
      branch
    },
    body: {}
  })

  const { showError, clear } = useToaster()

  useDocumentTitle([parse(pipeline?.name || getString('pipelines'))])
  const [discardBEUpdateDialog, setDiscardBEUpdate] = React.useState(false)
  const { openDialog: openConfirmBEUpdateError } = useConfirmationDialog({
    cancelButtonText: getString('cancel'),
    contentText: getString('pipelines-studio.pipelineUpdatedError'),
    titleText: getString('pipelines-studio.pipelineUpdated'),
    confirmButtonText: getString('update'),
    intent: Intent.WARNING,
    onCloseDialog: isConfirmed => {
      if (isConfirmed) {
        fetchPipeline({ forceFetch: true, forceUpdate: true })
      } else {
        setDiscardBEUpdate(true)
      }
    }
  })

  const history = useHistory()
  const { isGitSimplificationEnabled } = useAppStore()
  const { openPipelineErrorsModal } = usePipelineErrors()
  const isYaml = view === SelectedView.YAML
  const [isYamlError, setYamlError] = React.useState(false)
  const [blockNavigation, setBlockNavigation] = React.useState(false)
  const [selectedBranch, setSelectedBranch] = React.useState(branch || '')
  const [disableVisualView, setDisableVisualView] = React.useState(entityValidityDetails?.valid === false)
  const [useTemplate, setUseTemplate] = React.useState<boolean>(false)
  const isPipelineRemote = isGitSimplificationEnabled && storeType === StoreType.REMOTE

  React.useEffect(() => {
    if (isGitSyncEnabled || isPipelineRemote) {
      openPipelineErrorsModal(yamlSchemaErrorWrapper?.schemaErrors)
    }
  }, [yamlSchemaErrorWrapper, isGitSyncEnabled, isPipelineRemote])

  const { openDialog: openUnsavedChangesDialog } = useConfirmationDialog({
    cancelButtonText: getString('cancel'),
    contentText: isYamlError ? getString('navigationYamlError') : getString('navigationCheckText'),
    titleText: isYamlError ? getString('navigationYamlErrorTitle') : getString('navigationCheckTitle'),
    confirmButtonText: getString('confirm'),
    intent: Intent.WARNING,
    onCloseDialog: async isConfirmed => {
      if (isConfirmed) {
        deletePipelineCache(gitDetails).then(() => {
          history.push(
            routes.toPipelineStudio({
              projectIdentifier,
              orgIdentifier,
              pipelineIdentifier: pipeline?.identifier || '-1',
              accountId,
              module,
              branch: selectedBranch,
              repoIdentifier,
              repoName,
              connectorRef,
              storeType
            })
          )
          location.reload()
        })
      } else {
        setSelectedBranch(branch || '')
      }
      setBlockNavigation(false)
    }
  })

  const isValidYaml = function (): boolean {
    if (yamlHandler) {
      try {
        const parsedYaml = parse(yamlHandler.getLatestYaml())
        if (!parsedYaml) {
          clear()
          showError(getString('invalidYamlText'))
          return false
        }
        if (yamlHandler.getYAMLValidationErrorMap()?.size > 0) {
          clear()
          setYamlError(true)
          showError(getString('invalidYamlText'))
          return false
        }
        updatePipeline(parsedYaml.pipeline)
      } catch (e) {
        clear()
        setYamlError(true)
        showError(e.message || getString('invalidYamlText'))
        return false
      }
    }
    return true
  }

  useSaveTemplateListener()

  const [showModal, hideModal] = useModalHook(() => {
    const dialogWidth = isGitSimplificationEnabled ? '800px' : isGitSyncEnabled ? '614px' : 'auto'

    if (getOtherModal) {
      pipeline.identifier = ''
      updatePipeline(pipeline)
      return (
        <PipelineVariablesContextProvider pipeline={pipeline}>
          {getOtherModal(onSubmit, onCloseCreate)}
        </PipelineVariablesContextProvider>
      )
    } else {
      return (
        <PipelineVariablesContextProvider pipeline={pipeline}>
          <Dialog
            style={{
              width: dialogWidth,
              background: 'var(--form-bg)',
              paddingTop: '36px'
            }}
            enforceFocus={false}
            isOpen={true}
            className={'padded-dialog'}
            onClose={onCloseCreate}
            title={
              pipelineIdentifier === DefaultNewPipelineId
                ? getString('moduleRenderer.newPipeLine')
                : getString('editPipeline')
            }
          >
            <CreatePipelines
              afterSave={onSubmit}
              initialValues={merge(pipeline, {
                repo: repoName || gitDetails.repoIdentifier || '',
                branch: branch || gitDetails.branch || '',
                connectorRef: connectorRef || '',
                storeType: storeType || '',
                filePath: gitDetails.filePath
              })}
              closeModal={onCloseCreate}
              gitDetails={gitDetails as IGitContextFormProps}
            />
          </Dialog>
        </PipelineVariablesContextProvider>
      )
    }
  }, [
    isGitSimplificationEnabled,
    isGitSyncEnabled,
    pipeline,
    pipelineIdentifier,
    repoName,
    gitDetails,
    branch,
    connectorRef
  ])

  React.useEffect(() => {
    // for new pipeline always use UI as default view
    if (pipelineIdentifier === DefaultNewPipelineId) {
      setView(SelectedView.VISUAL)
    } else if (entityValidityDetails?.valid === false || view === SelectedView.YAML) {
      setView(SelectedView.YAML)
    } else {
      setView(SelectedView.VISUAL)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineIdentifier, entityValidityDetails?.valid])

  React.useEffect(() => {
    if (entityValidityDetails?.valid === false) {
      setDisableVisualView(true)
    } else {
      setDisableVisualView(false)
    }
  }, [entityValidityDetails?.valid])

  React.useEffect(() => {
    if (isInitialized) {
      if (pipeline?.identifier === DefaultNewPipelineId) {
        showModal()
      }
      if (isBEPipelineUpdated && !discardBEUpdateDialog) {
        openConfirmBEUpdateError()
      }
      if (blockNavigation && isUpdated) {
        openUnsavedChangesDialog()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    pipeline?.identifier,
    showModal,
    isInitialized,
    isBEPipelineUpdated,
    discardBEUpdateDialog,
    blockNavigation
  ])

  React.useEffect(() => {
    if (pipeline?.name) {
      window.dispatchEvent(new CustomEvent('RENAME_PIPELINE', { detail: pipeline?.name }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipeline?.name])

  const onCloseCreate = React.useCallback(() => {
    if (pipelineIdentifier === DefaultNewPipelineId || getOtherModal) {
      deletePipelineCache(gitDetails)
      history.push(toPipelineList({ orgIdentifier, projectIdentifier, accountId, module }))
    }
    hideModal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accountId,
    hideModal,
    history,
    module,
    orgIdentifier,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    pipeline?.identifier,
    projectIdentifier,
    toPipelineList,
    getOtherModal,
    gitDetails,
    deletePipelineCache
  ])

  const onSubmit = React.useCallback(
    (
      values: PipelineInfoConfig,
      currStoreMetadata?: StoreMetadata,
      updatedGitDetails?: EntityGitDetails,
      shouldUseTemplate = false
    ) => {
      pipeline.name = values.name
      pipeline.description = values.description
      pipeline.identifier = values.identifier
      pipeline.tags = values.tags ?? {}
      delete (pipeline as PipelineWithGitContextFormProps).repo
      delete (pipeline as PipelineWithGitContextFormProps).branch
      delete (pipeline as PipelineWithGitContextFormProps).connectorRef
      delete (pipeline as PipelineWithGitContextFormProps).filePath
      delete (pipeline as PipelineWithGitContextFormProps).storeType
      updatePipeline(pipeline)
      if (currStoreMetadata?.storeType) {
        updatePipelineStoreMetadata(currStoreMetadata, gitDetails)
      }

      if (updatedGitDetails) {
        if (gitDetails?.objectId || gitDetails?.commitId) {
          updatedGitDetails = { ...gitDetails, ...updatedGitDetails }
        }
        updateGitDetails(updatedGitDetails).then(() => {
          if (updatedGitDetails) {
            if (isGitSyncEnabled) {
              updateQueryParams(
                { repoIdentifier: updatedGitDetails.repoIdentifier, branch: updatedGitDetails.branch },
                { skipNulls: true }
              )
            } else if (isGitSimplificationEnabled && currStoreMetadata?.storeType === StoreType.REMOTE) {
              updateQueryParams(
                {
                  connectorRef: currStoreMetadata.connectorRef,
                  repoName: updatedGitDetails?.repoName,
                  branch: updatedGitDetails.branch,
                  storeType: currStoreMetadata.storeType as StoreType
                },
                { skipNulls: true }
              )
            }
          }
        })
      }
      setUseTemplate(shouldUseTemplate)
      hideModal()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hideModal, pipeline, updatePipeline]
  )

  const getPipelineTemplate = async () => {
    const { template: newTemplate, isCopied } = await getTemplate({ templateType: 'Pipeline' })
    const processNode = isCopied
      ? produce(defaultTo(parse(newTemplate?.yaml || '')?.template.spec, {}) as PipelineInfoConfig, draft => {
          draft.name = defaultTo(pipeline?.name, '')
          draft.identifier = defaultTo(pipeline?.identifier, '')
        })
      : createTemplate(pipeline, newTemplate)
    processNode.description = pipeline.description
    processNode.tags = pipeline.tags
    processNode.projectIdentifier = pipeline.projectIdentifier
    processNode.orgIdentifier = pipeline.orgIdentifier
    await updatePipeline(processNode)
  }

  React.useEffect(() => {
    if (useTemplate && (!isGitSyncEnabled || !isEmpty(gitDetails))) {
      getPipelineTemplate()
        .catch(_ => {
          // Do nothing.. user cancelled template selection
        })
        .finally(() => {
          setUseTemplate(false)
        })
    }
  }, [useTemplate, gitDetails])

  function handleViewChange(newView: SelectedView): boolean {
    if (newView === view) return false
    if (newView === SelectedView.VISUAL && yamlHandler && isYamlEditable) {
      if (!isValidYaml()) return false
    }
    setView(newView)
    updatePipelineView({
      splitViewData: {},
      isDrawerOpened: false,
      isYamlEditable: false,
      isSplitViewOpen: false,
      drawerData: { type: DrawerTypes.AddStep }
    })
    setSelectedStageId(undefined)
    setSelectedSectionId(undefined)
    return true
  }

  const [inputSetYaml, setInputSetYaml] = React.useState('')

  const { data, refetch, loading } = useGetInputsetYaml({
    planExecutionId: executionId ?? '',
    queryParams: {
      orgIdentifier,
      projectIdentifier,
      accountIdentifier: accountId
    },
    lazy: true,
    requestOptions: {
      headers: {
        'content-type': 'application/yaml'
      }
    }
  })

  const getInputSetSelected = (): InputSetValue[] => {
    if (inputSetType) {
      const inputSetSelected: InputSetValue[] = [
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
      return inputSetSelected
    }
    return []
  }

  React.useEffect(() => {
    if (data) {
      ;(data as unknown as Response).text().then(str => {
        setInputSetYaml(str)
      })
    }
  }, [data])

  React.useEffect(() => {
    if (executionId && executionId !== null) {
      refetch()
    }
  }, [executionId])

  function onCloseRunPipelineModal(): void {
    closeRunPipelineModal()
    setInputSetYaml('')
    replaceQueryParams({ repoIdentifier, branch, connectorRef, storeType, repoName }, { skipNulls: true }, true)
  }

  React.useEffect(() => {
    if (runPipeline) {
      openRunPipelineModal()
    }
  }, [runPipeline])

  React.useEffect(() => {
    isPipelineRemote &&
      gitDetails.repoName &&
      gitDetails.branch &&
      updatePipelineStoreMetadata({ connectorRef, storeType }, gitDetails)
  }, [isPipelineRemote, gitDetails, connectorRef, storeType])

  const [openRunPipelineModal, closeRunPipelineModal] = useModalHook(
    () =>
      loading ? (
        <PageSpinner />
      ) : (
        <Dialog {...runModalProps}>
          <Layout.Vertical className={css.modalCard}>
            <RunPipelineForm
              pipelineIdentifier={pipelineIdentifier}
              orgIdentifier={orgIdentifier}
              projectIdentifier={projectIdentifier}
              accountId={accountId}
              module={module}
              inputSetYAML={inputSetYaml || ''}
              inputSetSelected={getInputSetSelected()}
              connectorRef={connectorRef}
              repoIdentifier={isPipelineRemote ? repoName : repoIdentifier}
              branch={branch}
              source="executions"
              onClose={() => {
                onCloseRunPipelineModal()
              }}
              stagesExecuted={stagesExecuted}
              storeType={storeType}
            />
            <Button
              aria-label="close modal"
              icon="cross"
              variation={ButtonVariation.ICON}
              onClick={() => {
                onCloseRunPipelineModal()
              }}
              className={css.crossIcon}
            />
          </Layout.Vertical>
        </Dialog>
      ),
    [
      loading,
      inputSetYaml,
      inputSetRepoIdentifier,
      inputSetBranch,
      branch,
      repoIdentifier,
      inputSetType,
      inputSetValue,
      inputSetLabel,
      pipelineIdentifier
    ]
  )

  const onGitBranchChange = React.useMemo(
    () => (selectedFilter: GitFilterScope) => {
      setSelectedBranch(selectedFilter.branch as string)
      if (isUpdated && branch !== selectedFilter.branch) {
        setBlockNavigation(true)
      } else if (branch !== selectedFilter.branch) {
        deletePipelineCache({ repoIdentifier: selectedFilter.repo || '', branch: selectedFilter.branch || '' }).then(
          () => {
            history.push(
              routes.toPipelineStudio({
                projectIdentifier,
                orgIdentifier,
                pipelineIdentifier: pipelineIdentifier || '-1',
                accountId,
                module,
                branch: selectedFilter.branch,
                repoIdentifier: selectedFilter.repo,
                ...(isPipelineRemote
                  ? {
                      repoIdentifier: repoName,
                      repoName,
                      connectorRef,
                      storeType
                    }
                  : {})
              })
            )
            location.reload()
          }
        )
      }
    },
    [
      isUpdated,
      branch,
      deletePipelineCache,
      history,
      projectIdentifier,
      orgIdentifier,
      pipelineIdentifier,
      accountId,
      module,
      isPipelineRemote,
      repoName,
      connectorRef,
      storeType
    ]
  )

  if (isLoading) {
    return (
      <React.Fragment>
        <PageSpinner fixed />
        <div /> {/* this empty div is required for rendering layout correctly */}
      </React.Fragment>
    )
  }

  const getPipelineNameTextContainerWidth = (): number | undefined => {
    if (isPipelineRemote) {
      return 100
    }

    if (isGitSyncEnabled) {
      if (pipelineIdentifier === DefaultNewPipelineId) {
        if (!isEmpty(pipeline?.tags)) {
          return 150
        }
        return 175
      }
      if (!isEmpty(pipeline?.tags)) {
        return 125
      }
      return 155
    }
    return 400
  }

  if (templateError?.data && !isGitSyncEnabled && !isPipelineRemote) {
    return (
      <GenericErrorHandler
        errStatusCode={templateError?.status}
        errorMessage={(templateError?.data as Error)?.message}
      />
    )
  }

  if (templateError?.data && isEmpty(pipeline) && (isGitSyncEnabled || isPipelineRemote)) {
    return <NoEntityFound identifier={pipelineIdentifier} entityType={'pipeline'} />
  }

  return (
    <PipelineVariablesContextProvider pipeline={pipeline}>
      <div
        className={cx(Classes.POPOVER_DISMISS, css.content)}
        onClick={e => {
          e.stopPropagation()
        }}
      >
        <NavigationCheck
          when={getOtherModal && pipeline.identifier !== ''}
          shouldBlockNavigation={nextLocation => {
            let localUpdated = isUpdated
            const matchDefault = matchPath(nextLocation.pathname, {
              path: toPipelineStudio({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams }),
              exact: true
            })

            // This is special handler when user update yaml and immediately click on run
            if (isYaml && yamlHandler && isYamlEditable && !localUpdated) {
              try {
                const parsedYaml = parse(yamlHandler.getLatestYaml())
                if (!parsedYaml) {
                  clear()
                  showError(getString('invalidYamlText'), undefined, 'pipeline.parse.yaml.error')
                  return true
                }
                if (yamlHandler.getYAMLValidationErrorMap()?.size > 0) {
                  setYamlError(true)
                  return true
                }
                localUpdated = !isEqual(omit(originalPipeline, 'repo', 'branch'), parsedYaml.pipeline)
                updatePipeline(parsedYaml.pipeline)
              } catch (e) {
                setYamlError(true)
                return true
              }
            }
            setYamlError(false)
            const shouldBlockNavigation =
              !matchDefault?.isExact &&
              localUpdated &&
              !isReadonly &&
              !(pipelineIdentifier === DefaultNewPipelineId && isEmpty(pipeline?.name)) &&
              !(useTemplate && isEmpty(pipeline?.template))
            if (!shouldBlockNavigation) {
              !matchDefault?.isExact && deletePipelineCache(gitDetails)
            }
            return shouldBlockNavigation
          }}
          textProps={{
            contentText: isYamlError ? getString('navigationYamlError') : getString('navigationCheckText'),
            titleText: isYamlError ? getString('navigationYamlErrorTitle') : getString('navigationCheckTitle')
          }}
          navigate={newPath => {
            const isPipeline = matchPath(newPath, {
              path: toPipelineStudio({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams }),
              exact: true
            })
            !isPipeline?.isExact && deletePipelineCache(gitDetails)
            history.push(newPath)
          }}
        />
        <Layout.Vertical height={'100%'}>
          <div className={css.titleBar}>
            <div className={css.breadcrumbsMenu}>
              <div className={css.pipelineMetadataContainer}>
                <Layout.Horizontal className={css.pipelineNameContainer}>
                  <Icon className={css.pipelineIcon} padding={{ right: 'small' }} name="pipeline" size={32} />
                  <Text
                    className={css.pipelineName}
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: getPipelineNameTextContainerWidth()
                    }}
                    tooltip={pipeline?.name}
                  >
                    {pipeline?.name}
                  </Text>
                  {!isEmpty(pipeline?.tags) && pipeline.tags && (
                    <Container className={css.tagsContainer}>
                      <TagsPopover tags={pipeline.tags} />
                    </Container>
                  )}
                  {isGitSyncEnabled && (
                    <StudioGitPopover
                      gitDetails={gitDetails}
                      identifier={pipelineIdentifier}
                      isReadonly={isReadonly}
                      entityData={{ ...pipeline, versionLabel: '', type: 'Step' }} // Just to avoid type issues
                      onGitBranchChange={onGitBranchChange}
                      entityType={'Pipeline'}
                    />
                  )}
                  {isYaml || isReadonly ? null : (
                    <Button variation={ButtonVariation.ICON} icon="Edit" onClick={showModal} />
                  )}
                </Layout.Horizontal>
              </div>
            </div>
            {isPipelineRemote && (
              <div className={css.gitRemoteDetailsWrapper}>
                <GitRemoteDetails
                  connectorRef={connectorRef}
                  repoName={repoName || gitDetails.repoName || gitDetails.repoIdentifier || ''}
                  filePath={gitDetails.filePath || ''}
                  fileUrl={gitDetails.fileUrl || ''}
                  branch={branch || ''}
                  onBranchChange={onGitBranchChange}
                  flags={{
                    readOnly: pipelineIdentifier === DefaultNewPipelineId
                  }}
                />
              </div>
            )}
            <VisualYamlToggle
              className={css.visualYamlToggle}
              selectedView={isYaml || disableVisualView ? SelectedView.YAML : SelectedView.VISUAL}
              disableToggle={disableVisualView}
              onChange={nextMode => {
                handleViewChange(nextMode)
              }}
              showDisableToggleReason={true}
            />
            <div>
              <div className={css.savePublishContainer}>
                {isReadonly && (
                  <div className={css.readonlyAccessTag}>
                    <Icon name="eye-open" size={16} />
                    <div className={css.readonlyAccessText}>{getString('common.viewAndExecutePermissions')}</div>
                  </div>
                )}
                {isUpdated && !isReadonly && <div className={css.tagRender}>{getString('unsavedChanges')}</div>}
                <SavePipelinePopover toPipelineStudio={toPipelineStudio} />
                {pipelineIdentifier !== DefaultNewPipelineId && !isReadonly && (
                  <Button
                    disabled={!isUpdated}
                    onClick={() => {
                      updatePipelineView({ ...pipelineView, isYamlEditable: false })
                      fetchPipeline({ forceFetch: true, forceUpdate: true })
                    }}
                    className={css.discardBtn}
                    variation={ButtonVariation.SECONDARY}
                    text={getString('pipeline.discard')}
                  />
                )}
                <RbacButton
                  data-testid="card-run-pipeline"
                  variation={ButtonVariation.PRIMARY}
                  icon="run-pipeline"
                  intent="success"
                  disabled={
                    isUpdated || entityValidityDetails?.valid === false || !isEmpty(templateInputsErrorNodeSummary)
                  }
                  className={css.runPipelineBtn}
                  text={getString('runPipelineText')}
                  tooltip={
                    entityValidityDetails?.valid === false
                      ? getString('pipeline.cannotRunInvalidPipeline')
                      : isUpdated
                      ? 'Please click Save and then run the pipeline.'
                      : ''
                  }
                  onClick={e => {
                    e.stopPropagation()
                    openRunPipelineModal()
                  }}
                  featuresProps={getFeaturePropsForRunPipelineButton({ modules: template?.data?.modules, getString })}
                  permission={{
                    resourceScope: {
                      accountIdentifier: accountId,
                      orgIdentifier,
                      projectIdentifier
                    },
                    resource: {
                      resourceType: ResourceType.PIPELINE,
                      resourceIdentifier: pipeline?.identifier as string
                    },
                    permission: PermissionIdentifier.EXECUTE_PIPELINE
                  }}
                />
              </div>
            </div>
          </div>
          {templateInputsErrorNodeSummary && (
            <OutOfSyncErrorStrip
              templateInputsErrorNodeSummary={templateInputsErrorNodeSummary}
              entity={'Pipeline'}
              isReadOnly={isReadonly}
              onRefreshEntity={() => {
                fetchPipeline({ forceFetch: true, forceUpdate: true })
              }}
            />
          )}
          <Container className={css.builderContainer}>
            {isYaml ? <PipelineYamlView /> : pipeline.template ? <TemplatePipelineBuilder /> : <StageBuilder />}
          </Container>
        </Layout.Vertical>
      </div>
      <RightBar />
    </PipelineVariablesContextProvider>
  )
}
