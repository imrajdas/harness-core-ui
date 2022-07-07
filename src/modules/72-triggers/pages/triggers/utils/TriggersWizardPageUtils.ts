/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { isNull, isUndefined, omitBy, isEmpty, get, set, flatten, cloneDeep } from 'lodash-es'
import { string, array, object, ObjectSchema } from 'yup'
import type { ConnectorResponse, ManifestConfigWrapper } from 'services/cd-ng'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { Scope } from '@common/interfaces/SecretsInterface'
import type { NGTriggerSourceV2, PipelineInfoConfig, NGVariable } from 'services/pipeline-ng'
import { connectorUrlType } from '@connectors/constants'
import type { PanelInterface } from '@common/components/Wizard/Wizard'
import { illegalIdentifiers, regexIdentifier } from '@common/utils/StringUtils'
import { ManifestStoreMap, ManifestDataType } from '@pipeline/components/ManifestSelection/Manifesthelper'
import type { StringKeys, UseStringsReturn } from 'framework/strings'
import { ENABLED_ARTIFACT_TYPES } from '@pipeline/components/ArtifactsSelection/ArtifactHelper'
import { getStageDeploymentType, isServerlessDeploymentType } from '@pipeline/utils/stageHelpers'
import { getStageFromPipeline } from '@pipeline/components/PipelineStudio/PipelineContext/helpers'
import type { DeploymentStageElementConfig, StageElementWrapper } from '@pipeline/utils/pipelineTypes'
import type { StringsMap } from 'framework/strings/StringsContext'
import { isCronValid } from '../views/subviews/ScheduleUtils'
import type { AddConditionInterface } from '../views/AddConditionsSection'
import type {
  artifactManifestData,
  artifactTableDetails,
  artifactTableItem,
  ManifestInterface,
  TriggerConfigDTO,
  TriggerTypeSourceInterface,
  FlatOnEditValuesInterface
} from '../interface/TriggersWizardInterface'
export const CUSTOM = 'Custom'
export const AWS_CODECOMMIT = 'AWS_CODECOMMIT'
export const AwsCodeCommit = 'AwsCodeCommit'
export const PRIMARY_ARTIFACT = 'primary'

export const eventTypes = {
  PUSH: 'Push',
  BRANCH: 'Branch',
  TAG: 'Tag',
  PULL_REQUEST: 'PullRequest',
  MERGE_REQUEST: 'MergeRequest',
  ISSUE_COMMENT: 'IssueComment',
  PR_COMMENT: 'PRComment',
  MR_COMMENT: 'MRComment'
}

export const getArtifactId = (isManifest?: boolean, selectedArtifactId?: string) => {
  if (isManifest || selectedArtifactId) {
    return selectedArtifactId
  } else if (!isManifest) {
    return PRIMARY_ARTIFACT
  }
  return ''
}

export const TriggerTypes = {
  WEBHOOK: 'Webhook',
  NEW_ARTIFACT: 'NewArtifact',
  SCHEDULE: 'Scheduled',
  MANIFEST: 'Manifest',
  ARTIFACT: 'Artifact'
}

export const isArtifactOrManifestTrigger = (triggerType?: string): boolean =>
  triggerType === TriggerTypes.MANIFEST || triggerType === TriggerTypes.ARTIFACT

export const PayloadConditionTypes = {
  TARGET_BRANCH: 'targetBranch',
  SOURCE_BRANCH: 'sourceBranch',
  CHANGED_FILES: 'changedFiles',
  TAG: 'tag'
}

export const EventConditionTypes = {
  VERSION: 'version',
  BUILD: 'build'
}

export const ResponseStatus = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  ERROR: 'ERROR'
}

const getTriggerTitle = ({
  triggerType,
  triggerName,
  getString
}: {
  triggerType: NGTriggerSourceV2['type']
  triggerName?: string
  getString: UseStringsReturn['getString']
}): string => {
  if (triggerName) {
    return `Trigger: ${triggerName}`
  } else if (triggerType === TriggerTypes.WEBHOOK) {
    return getString('triggers.onNewWebhookTitle')
  } else if (triggerType === TriggerTypes.ARTIFACT) {
    return getString('triggers.onNewArtifactTitle', {
      artifact: getString('pipeline.artifactTriggerConfigPanel.artifact')
    })
  } else if (triggerType === TriggerTypes.MANIFEST) {
    return getString('triggers.onNewArtifactTitle', {
      artifact: getString('manifestsText')
    })
  } else if (triggerType === TriggerTypes.SCHEDULE) {
    return getString('triggers.onNewScheduleTitle')
  }
  return ''
}

// todo: revisit to see how to require identifier w/o type issue
export const clearNullUndefined = /* istanbul ignore next */ (data: TriggerConfigDTO): TriggerConfigDTO =>
  omitBy(omitBy(data, isUndefined), isNull)

export const clearRuntimeInputValue = (template: PipelineInfoConfig): PipelineInfoConfig => {
  return JSON.parse(
    JSON.stringify(template || {}).replace(/"<\+input>.?(?:allowedValues\((.*?)\)|regex\((.*?)\))?"/g, '""')
  )
}

export const getQueryParamsOnNew = (searchStr: string): TriggerTypeSourceInterface => {
  const triggerTypeParam = 'triggerType='
  const triggerType = searchStr.replace(`?${triggerTypeParam}`, '')

  if (triggerType.includes(TriggerTypes.WEBHOOK)) {
    const sourceRepoParam = '&sourceRepo='
    const sourceRepo = searchStr.substring(
      searchStr.lastIndexOf(sourceRepoParam) + sourceRepoParam.length
    ) as unknown as string
    return {
      triggerType: searchStr.substring(
        searchStr.lastIndexOf(triggerTypeParam) + triggerTypeParam.length,
        searchStr.lastIndexOf(sourceRepoParam)
      ) as unknown as NGTriggerSourceV2['type'],
      sourceRepo
    }
  } else if (triggerType.includes(TriggerTypes.ARTIFACT)) {
    const artifactTypeParam = '&artifactType='
    const artifactType = searchStr.substring(
      searchStr.lastIndexOf(artifactTypeParam) + artifactTypeParam.length
    ) as unknown as string
    return {
      triggerType: searchStr.substring(
        searchStr.lastIndexOf(triggerTypeParam) + triggerTypeParam.length,
        searchStr.lastIndexOf(artifactTypeParam)
      ) as unknown as NGTriggerSourceV2['type'],
      artifactType
    }
  } else if (triggerType.includes(TriggerTypes.MANIFEST)) {
    const manifestTypeParam = '&manifestType='
    const manifestType = searchStr.substring(
      searchStr.lastIndexOf(manifestTypeParam) + manifestTypeParam.length
    ) as unknown as string
    return {
      triggerType: searchStr.substring(
        searchStr.lastIndexOf(triggerTypeParam) + triggerTypeParam.length,
        searchStr.lastIndexOf(manifestTypeParam)
      ) as unknown as NGTriggerSourceV2['type'],
      manifestType
    }
  } else if (triggerType.includes(TriggerTypes.SCHEDULE)) {
    // if modified for other schedule types, need to account for gitsync appended url params*
    return {
      triggerType: TriggerTypes.SCHEDULE as unknown as NGTriggerSourceV2['type']
    }
  } else {
    //  unfound page
    return {
      triggerType: triggerType as unknown as NGTriggerSourceV2['type']
    }
  }
}

export const isUndefinedOrEmptyString = (str: string | undefined): boolean => isUndefined(str) || str?.trim() === ''

const isRowUnfilled = (payloadCondition: AddConditionInterface): boolean => {
  const truthyValuesLength = Object.values(payloadCondition).filter(val =>
    isUndefinedOrEmptyString(val?.trim?.())
  )?.length
  return truthyValuesLength > 0 && truthyValuesLength < 3
}

export const isRowFilled = (payloadCondition: AddConditionInterface): boolean => {
  const truthyValuesLength = Object.values(payloadCondition).filter(val => val?.trim?.())?.length
  return truthyValuesLength === 3
}

const isIdentifierIllegal = (identifier: string): boolean =>
  regexIdentifier.test(identifier) && illegalIdentifiers.includes(identifier)

const checkValidTriggerConfiguration = ({
  formikValues
}: {
  formikValues: { [key: string]: any }
  formikErrors: { [key: string]: any }
}): boolean => {
  const sourceRepo = formikValues['sourceRepo']
  const identifier = formikValues['identifier']
  const connectorURLType = formikValues.connectorRef?.connector?.spec?.type

  if (isIdentifierIllegal(identifier)) {
    return false
  }

  if (sourceRepo !== CUSTOM) {
    if (!formikValues['connectorRef'] || !formikValues['event'] || !formikValues['actions']) return false
    // onEdit case, waiting for api response
    else if (formikValues['connectorRef']?.value && !formikValues['connectorRef'].connector) return true
    else if (!connectorURLType || !!(connectorURLType === connectorUrlType.ACCOUNT && !formikValues.repoName))
      return false
  }
  return true
}

const checkValidPayloadConditions = ({ formikValues }: { formikValues: { [key: string]: any } }): boolean => {
  const payloadConditions = formikValues['payloadConditions']
  const headerConditions = formikValues['headerConditions']
  if (
    (formikValues['sourceBranchOperator'] && !formikValues['sourceBranchValue']) ||
    (!formikValues['sourceBranchOperator'] && formikValues['sourceBranchValue']?.trim()) ||
    (formikValues['targetBranchOperator'] && !formikValues['targetBranchValue']) ||
    (!formikValues['targetBranchOperator'] && formikValues['targetBranchValue']?.trim()) ||
    (formikValues['changedFilesOperator'] && !formikValues['changedFilesValue']) ||
    (!formikValues['changedFilesOperator'] && formikValues['changedFilesValue']?.trim()) ||
    (formikValues['tagConditionOperator'] && !formikValues['tagConditionValue']) ||
    (!formikValues['tagConditionOperator'] && formikValues['tagConditionValue']?.trim()) ||
    (payloadConditions?.length &&
      payloadConditions.some((payloadCondition: AddConditionInterface) => isRowUnfilled(payloadCondition)))
  ) {
    return false
  } else if (
    headerConditions?.length &&
    headerConditions.some((headerCondition: AddConditionInterface) => isRowUnfilled(headerCondition))
  ) {
    return false
  }
  return true
}

const checkValidPipelineInput = ({ formikErrors }: { formikErrors: { [key: string]: any } }): boolean => {
  if (!isEmpty(formikErrors?.pipeline) || !isEmpty(formikErrors?.stages)) {
    return false
  }
  return true
}

const checkValidEventConditionsForNewArtifact = ({
  formikValues
}: {
  formikValues: { [key: string]: any }
}): boolean => {
  const eventConditions = formikValues['eventConditions']
  if (
    (formikValues['versionOperator'] && !formikValues['versionValue']) ||
    (!formikValues['versionOperator'] && formikValues['versionValue']?.trim()) ||
    (formikValues['buildOperator'] && !formikValues['buildValue']) ||
    (!formikValues['buildOperator'] && formikValues['buildValue']?.trim()) ||
    (eventConditions?.length &&
      eventConditions.some((eventCondition: AddConditionInterface) => isRowUnfilled(eventCondition)))
  ) {
    return false
  }
  return true
}

const checkValidOverview = ({ formikValues }: { formikValues: { [key: string]: any } }): boolean =>
  isIdentifierIllegal(formikValues?.identifier) ? false : true

const checkValidSelectedArtifact = ({ formikValues }: { formikValues: { [key: string]: any } }): boolean => {
  return !isEmpty(formikValues?.selectedArtifact)
}

const checkValidArtifactTrigger = ({ formikValues }: { formikValues: { [key: string]: any } }): boolean => {
  return isIdentifierIllegal(formikValues?.identifier) ? false : true && checkValidSelectedArtifact({ formikValues })
}

const checkValidCronExpression = ({ formikValues }: { formikValues: { [key: string]: any } }): boolean =>
  isCronValid(formikValues?.expression || '')

const getPanels = ({
  triggerType,
  getString
}: {
  triggerType: NGTriggerSourceV2['type']
  getString: (key: StringKeys) => string
}): PanelInterface[] | [] => {
  if (triggerType === TriggerTypes.WEBHOOK) {
    return [
      {
        id: 'Trigger Configuration',
        tabTitle: getString('configuration'),
        requiredFields: ['name', 'identifier'], // conditional required validations checkValidTriggerConfiguration
        checkValidPanel: checkValidTriggerConfiguration
      },
      {
        id: 'Conditions',
        tabTitle: getString('conditions'),
        checkValidPanel: checkValidPayloadConditions
      },
      {
        id: 'Pipeline Input',
        tabTitle: getString('triggers.pipelineInputLabel'),
        checkValidPanel: checkValidPipelineInput
        // require all fields for input set and have preflight check handled on backend
      }
    ]
  } else if (triggerType === TriggerTypes.SCHEDULE) {
    return [
      {
        id: 'Trigger Overview',
        tabTitle: getString('overview'),
        checkValidPanel: checkValidOverview,
        requiredFields: ['name', 'identifier'] // conditional required validations checkValidTriggerConfiguration
      },
      {
        id: 'Schedule',
        tabTitle: getString('triggers.schedulePanel.title'),
        checkValidPanel: checkValidCronExpression,
        requiredFields: ['expression']
      },
      {
        id: 'Pipeline Input',
        tabTitle: getString('triggers.pipelineInputLabel'),
        checkValidPanel: checkValidPipelineInput
      }
    ]
  } else if (isArtifactOrManifestTrigger(triggerType)) {
    return [
      {
        id: 'Trigger Configuration',
        tabTitle: getString('configuration'),
        checkValidPanel: checkValidArtifactTrigger,
        requiredFields: ['name', 'identifier'] // conditional required validations checkValidTriggerConfiguration
      },
      {
        id: 'Conditions',
        tabTitle: getString('conditions'),
        checkValidPanel: checkValidEventConditionsForNewArtifact
      },
      {
        id: 'Pipeline Input',
        tabTitle: getString('triggers.pipelineInputLabel'),
        checkValidPanel: checkValidPipelineInput
      }
    ]
  }
  return []
}
export const getWizardMap = ({
  triggerType,
  getString,
  triggerName
}: {
  triggerType: NGTriggerSourceV2['type']
  triggerName?: string
  getString: UseStringsReturn['getString']
}): { wizardLabel: string; panels: PanelInterface[] } => ({
  wizardLabel: getTriggerTitle({
    triggerType,
    getString,
    triggerName
  }),
  panels: getPanels({ triggerType, getString })
})

// requiredFields and checkValidPanel in getPanels() above to render warning icons related to this schema
export const getValidationSchema = (
  triggerType: NGTriggerSourceV2['type'],
  getString: (key: StringKeys, params?: any) => string
): ObjectSchema<Record<string, any> | undefined> => {
  if (triggerType === TriggerTypes.WEBHOOK) {
    return object().shape({
      name: NameSchema({ requiredErrorMsg: getString('triggers.validation.triggerName') }),
      identifier: IdentifierSchema(),
      event: string().test(
        getString('triggers.validation.event'),
        getString('triggers.validation.event'),
        function (event) {
          return this.parent.sourceRepo === CUSTOM || event
        }
      ),
      connectorRef: object().test(
        getString('triggers.validation.connector'),
        getString('triggers.validation.connector'),
        function (connectorRef) {
          // connectorRef is an object keeping track of whether repoName should be required
          return this.parent.sourceRepo === CUSTOM || connectorRef?.value
        }
      ),
      repoName: string()
        .nullable()
        .test(
          getString('triggers.validation.repoName'),
          getString('triggers.validation.repoName'),
          function (repoName) {
            const connectorURLType = this.parent.connectorRef?.connector?.spec?.type
            return (
              !connectorURLType ||
              (connectorURLType === connectorUrlType.ACCOUNT && repoName?.trim()) ||
              (connectorURLType === connectorUrlType.REGION && repoName?.trim()) ||
              connectorURLType === connectorUrlType.REPO
            )
          }
        ),
      actions: array().test(
        getString('triggers.validation.actions'),
        getString('triggers.validation.actions'),
        function (actions) {
          return this.parent.sourceRepo === CUSTOM || !isUndefined(actions) || this.parent.event === eventTypes.PUSH
        }
      ),
      sourceBranchOperator: string().test(
        getString('triggers.validation.operator'),
        getString('triggers.validation.operator'),
        function (operator) {
          return (
            // both filled or both empty. Return false to show error
            (operator && !this.parent.sourceBranchValue) ||
            (operator && this.parent.sourceBranchValue) ||
            (!this.parent.sourceBranchValue?.trim() && !operator)
          )
        }
      ),
      sourceBranchValue: string().test(
        getString('triggers.validation.matchesValue'),
        getString('triggers.validation.matchesValue'),
        function (matchesValue) {
          return (
            (matchesValue && !this.parent.sourceBranchOperator) ||
            (matchesValue && this.parent.sourceBranchOperator) ||
            (!matchesValue?.trim() && !this.parent.sourceBranchOperator)
          )
        }
      ),
      targetBranchOperator: string().test(
        getString('triggers.validation.operator'),
        getString('triggers.validation.operator'),
        function (operator) {
          return (
            (operator && !this.parent.targetBranchValue) ||
            (operator && this.parent.targetBranchValue) ||
            (!this.parent.targetBranchValue?.trim() && !operator)
          )
        }
      ),
      targetBranchValue: string().test(
        getString('triggers.validation.matchesValue'),
        getString('triggers.validation.matchesValue'),
        function (matchesValue) {
          return (
            (matchesValue && !this.parent.targetBranchOperator) ||
            (matchesValue && this.parent.targetBranchOperator) ||
            (!matchesValue?.trim() && !this.parent.targetBranchOperator)
          )
        }
      ),
      changedFilesOperator: string().test(
        getString('triggers.validation.operator'),
        getString('triggers.validation.operator'),
        function (operator) {
          return (
            (operator && !this.parent.changedFilesValue) ||
            (operator && this.parent.changedFilesValue) ||
            (!this.parent.changedFilesValue?.trim() && !operator)
          )
        }
      ),
      changedFilesValue: string().test(
        getString('triggers.validation.matchesValue'),
        getString('triggers.validation.matchesValue'),
        function (matchesValue) {
          return (
            (matchesValue && !this.parent.changedFilesOperator) ||
            (matchesValue && this.parent.changedFilesOperator) ||
            (!matchesValue?.trim() && !this.parent.changedFilesOperator)
          )
        }
      ),
      tagConditionOperator: string().test(
        getString('triggers.validation.operator'),
        getString('triggers.validation.operator'),
        function (operator) {
          return (
            (operator && !this.parent.tagConditionValue) ||
            (operator && this.parent.tagConditionValue) ||
            (!this.parent.tagConditionValue?.trim() && !operator)
          )
        }
      ),
      tagConditionValue: string().test(
        getString('triggers.validation.matchesValue'),
        getString('triggers.validation.matchesValue'),
        function (matchesValue) {
          return (
            (matchesValue && !this.parent.tagConditionOperator) ||
            (matchesValue && this.parent.tagConditionOperator) ||
            (!matchesValue?.trim() && !this.parent.tagConditionOperator)
          )
        }
      ),
      payloadConditions: array().test(
        getString('triggers.validation.payloadConditions'),
        getString('triggers.validation.payloadConditions'),
        function (payloadConditions = []) {
          if (payloadConditions.some((payloadCondition: AddConditionInterface) => isRowUnfilled(payloadCondition))) {
            return false
          }
          return true
        }
      ),
      headerConditions: array().test(
        getString('triggers.validation.headerConditions'),
        getString('triggers.validation.headerConditions'),
        function (headerConditions = []) {
          if (headerConditions.some((headerCondition: AddConditionInterface) => isRowUnfilled(headerCondition))) {
            return false
          }
          return true
        }
      )
    })
  } else if (isArtifactOrManifestTrigger(triggerType)) {
    const artifactOrManifestText =
      triggerType === TriggerTypes.MANIFEST
        ? getString('manifestsText')
        : getString('pipeline.artifactTriggerConfigPanel.artifact')
    return object().shape({
      name: string().trim().required(getString('triggers.validation.triggerName')),
      identifier: string().when('name', {
        is: val => val?.length,
        then: string()
          .required(getString('validation.identifierRequired'))
          .matches(regexIdentifier, getString('validation.validIdRegex'))
          .notOneOf(illegalIdentifiers)
      }),
      selectedArtifact: object().test(
        getString('triggers.validation.selectedArtifact', {
          artifact: artifactOrManifestText
        }),
        getString('triggers.validation.selectedArtifact', {
          artifact: artifactOrManifestText
        }),
        function (selectedArtifact = {}) {
          if (isEmpty(selectedArtifact)) {
            return false
          }
          return true
        }
      ),
      versionOperator: string().test(
        getString('triggers.validation.operator'),
        getString('triggers.validation.operator'),
        function (operator) {
          return (
            (operator && !this.parent.versionValue) ||
            (operator && this.parent.versionValue) ||
            (!this.parent.versionValue?.trim() && !operator)
          )
        }
      ),
      versionValue: string().test(
        getString('triggers.validation.matchesValue'),
        getString('triggers.validation.matchesValue'),
        function (matchesValue) {
          return (
            (matchesValue && !this.parent.versionOperator) ||
            (matchesValue && this.parent.versionOperator) ||
            (!matchesValue?.trim() && !this.parent.versionOperator)
          )
        }
      ),
      buildOperator: string().test(
        getString('triggers.validation.operator'),
        getString('triggers.validation.operator'),
        function (operator) {
          return (
            (operator && !this.parent.buildValue) ||
            (operator && this.parent.buildValue) ||
            (!this.parent.buildValue?.trim() && !operator)
          )
        }
      ),
      buildValue: string().test(
        getString('triggers.validation.matchesValue'),
        getString('triggers.validation.matchesValue'),
        function (matchesValue) {
          return (
            (matchesValue && !this.parent.buildOperator) ||
            (matchesValue && this.parent.buildOperator) ||
            (!matchesValue?.trim() && !this.parent.buildOperator)
          )
        }
      ),
      eventConditions: array().test(
        getString('triggers.validation.eventConditions'),
        getString('triggers.validation.eventConditions'),
        function (eventConditions = []) {
          if (eventConditions.some((eventCondition: AddConditionInterface) => isRowUnfilled(eventCondition))) {
            return false
          }
          return true
        }
      )
    })
  } else {
    // Scheduled
    return object().shape({
      name: string().trim().required(getString('triggers.validation.triggerName')),
      identifier: string().when('name', {
        is: val => val?.length,
        then: string()
          .required(getString('validation.identifierRequired'))
          .matches(regexIdentifier, getString('validation.validIdRegex'))
          .notOneOf(illegalIdentifiers)
      }),
      expression: string().test(
        getString('triggers.validation.cronExpression'),
        getString('triggers.validation.cronExpression'),
        function (expression) {
          return isCronValid(expression || '')
        }
      )
    })
  }
}

export const scheduledTypes = {
  CRON: 'Cron'
}

export const isPipelineWithCiCodebase = (pipeline: any): boolean =>
  Object.keys(pipeline?.properties?.ci?.codebase || {}).includes('build')

export const ciCodebaseBuild = {
  type: 'branch',
  spec: {
    branch: '<+trigger.branch>'
  }
}

export const ciCodebaseBuildPullRequest = {
  type: 'PR',
  spec: {
    number: '<+trigger.prNumber>'
  }
}

export const ciCodebaseBuildIssueComment = {
  type: 'tag',
  spec: {
    tag: '<+trigger.tag>'
  }
}

export const getConnectorName = (connector?: ConnectorResponse): string =>
  `${
    connector?.connector?.orgIdentifier && connector?.connector?.projectIdentifier
      ? `${connector?.connector?.type}: ${connector?.connector?.name}`
      : connector?.connector?.orgIdentifier
      ? `${connector?.connector?.type}[Org]: ${connector?.connector?.name}`
      : `${connector?.connector?.type}[Account]: ${connector?.connector?.name}`
  }` || ''

export const getConnectorValue = (connector?: ConnectorResponse): string =>
  `${
    connector?.connector?.orgIdentifier && connector?.connector?.projectIdentifier
      ? connector?.connector?.identifier
      : connector?.connector?.orgIdentifier
      ? `${Scope.ORG}.${connector?.connector?.identifier}`
      : `${Scope.ACCOUNT}.${connector?.connector?.identifier}`
  }` || ''

export const mockOperators = [
  { label: '', value: '' },
  { label: 'Equals', value: 'Equals' },
  { label: 'Not Equals', value: 'NotEquals' },
  { label: 'In', value: 'In' },
  { label: 'Not In', value: 'NotIn' },
  { label: 'Starts With', value: 'StartsWith' },
  { label: 'Ends With', value: 'EndsWith' },
  { label: 'Contains', value: 'Contains' },
  { label: 'Regex', value: 'Regex' }
]

export const inNotInArr = ['In', 'NotIn']
export const inNotInPlaceholder = 'value1, regex1'

const getFilteredManifestsWithOverrides = ({
  stageObj,
  manifestType,
  stages
}: {
  stageObj: any
  manifestType: string
  stages: any
}): ManifestInterface[] => {
  const filteredManifests =
    stageObj?.stage?.spec?.serviceConfig?.serviceDefinition?.spec?.manifests?.filter(
      (manifestObj: { manifest: ManifestInterface }) => manifestObj?.manifest?.type === manifestType
    ) || []

  // filter & add in manifest overrides
  let stageOverridesManifests =
    stageObj?.stage?.spec?.serviceConfig?.stageOverrides?.manifests?.filter(
      (manifestObj: { manifest: ManifestInterface }) => manifestObj?.manifest?.type === manifestType
    ) || []

  // override can be (1) Reference with partial new values, (2) New manifest
  stageOverridesManifests = stageOverridesManifests
    .map((manifest: any) => {
      if (filteredManifests.some((fm: any) => fm.identifier === manifest.identifier)) {
        // already accounted override manifest into serviceConfig.serviceDefinition
        return null
      }
      // stage Reference will always be here for manifests within propagated stages
      const stageReference = stageObj?.stage?.spec?.serviceConfig?.useFromStage?.stage
      const matchedStage = stages?.find((stage: any) => stage.name === stageReference)
      const matchedManifests = matchedStage?.stage?.template
        ? matchedStage?.stage?.template?.templateInputs.spec?.serviceConfig?.serviceDefinition?.spec?.manifests
        : matchedStage?.stage?.spec?.serviceConfig?.serviceDefinition?.spec?.manifests

      const matchedManifest = matchedManifests?.find(
        (manifestReference: any) => manifestReference.name === manifest.name
      )
      if (matchedManifest) {
        // Found matching manifestIdentifier and need to merge
        // This will be hidden in SelectArtifactModal and shown a warning message to use unique manifestId
        return { ...matchedManifest, ...manifest }
      } else {
        return manifest
      }
    })
    .filter((x: any) => !!x)

  return [...filteredManifests, ...stageOverridesManifests]
}

const getFilteredArtifactsWithOverrides = ({
  stageObj,
  artifactType,
  stages
}: {
  stageObj: any
  artifactType: string
  stages: any
  artifactRef?: string
}): any => {
  const primaryArtifact =
    stageObj?.stage?.spec?.serviceConfig?.serviceDefinition?.spec?.artifacts?.primary?.type === artifactType
      ? stageObj?.stage?.spec?.serviceConfig?.serviceDefinition?.spec?.artifacts?.primary
      : null
  const filteredArtifacts =
    stageObj?.stage?.spec?.serviceConfig?.serviceDefinition?.spec?.artifacts?.sidecars?.filter(
      (artifactObj: { sidecar: any }) => artifactObj?.sidecar?.type === artifactType
    ) || []

  // // filter & add in manifest overrides
  let stageOverridesArtifacts =
    stageObj?.stage?.spec?.serviceConfig?.stageOverrides?.artifacts?.sidecars?.filter(
      (artifactObj: { sidecar: any }) => artifactObj?.sidecar?.type === artifactType
    ) || []
  const stageOverridesPrimaryArtifacts =
    stageObj?.stage?.spec?.serviceConfig?.stageOverrides?.artifacts?.primary?.type === artifactType
      ? stageObj?.stage?.spec?.serviceConfig?.stageOverrides?.artifacts?.primary
      : null

  // override can be (1) Reference with partial new values, (2) New manifest
  stageOverridesArtifacts = stageOverridesArtifacts
    .map((artifact: any) => {
      if (filteredArtifacts.some((fm: any) => fm.identifier === artifact.identifier)) {
        // already accounted override manifest into serviceConfig.serviceDefinition
        return null
      }
      // stage Reference will always be here for manifests within propagated stages
      const stageReference = stageObj?.stage?.spec?.serviceConfig?.useFromStage?.stage
      const matchedStage = stages?.find((stage: any) => stage.name === stageReference)
      const matchedSideCars = matchedStage?.stage?.template
        ? matchedStage?.stage?.template?.templateInputs.spec?.serviceConfig?.serviceDefinition?.spec?.artifacts
            ?.sidecars
        : matchedStage?.stage?.spec?.serviceConfig?.serviceDefinition?.spec?.artifacts?.sidecars

      const matchedArtifact = matchedSideCars?.find(
        (artifactReference: any) => artifactReference?.sidecar?.name === artifact.name
      )
      if (matchedArtifact) {
        // Found matching manifestIdentifier and need to merge
        // This will be hidden in SelectArtifactModal and shown a warning message to use unique manifestId
        return { ...matchedArtifact, ...artifact }
      } else {
        return artifact
      }
    })
    .filter((x: any) => !!x)

  return {
    primary: primaryArtifact || stageOverridesPrimaryArtifacts,
    sidecars: [...filteredArtifacts, ...stageOverridesArtifacts]
  }
}

export const parseArtifactsManifests = ({
  inputSetTemplateYamlObj,
  manifestType,
  artifactType,
  artifactRef,
  stageId,
  isManifest
}: {
  inputSetTemplateYamlObj?: {
    pipeline: PipelineInfoConfig | Record<string, never>
  }
  artifactRef?: string
  stageId?: string
  isManifest: boolean
  artifactType?: string
  manifestType?: string
}): { appliedArtifact?: artifactManifestData; data?: artifactManifestData[] } => {
  if (inputSetTemplateYamlObj?.pipeline && isManifest && manifestType) {
    let appliedArtifact
    const pipeline = inputSetTemplateYamlObj.pipeline.template
      ? (inputSetTemplateYamlObj.pipeline.template?.templateInputs as PipelineInfoConfig)
      : inputSetTemplateYamlObj.pipeline
    const stagesManifests = pipeline?.stages?.map((stageObj: any) => {
      if (stageObj.parallel) {
        return stageObj.parallel.map((parStg: any) => {
          const filteredStageObj = parStg?.stage?.template
            ? { stage: { ...parStg?.stage?.template?.templateInputs, identifier: parStg?.stage?.identifier } }
            : { ...parStg }
          const filteredManifests = getFilteredManifestsWithOverrides({
            stageObj: filteredStageObj,
            manifestType,
            stages: pipeline.stages
          })
          if (stageId && artifactRef) {
            const newAppliedArtifact = filteredManifests?.find(
              (manifestObj: any) => manifestObj?.manifest?.identifier === artifactRef
            )?.manifest
            if (newAppliedArtifact) {
              appliedArtifact = newAppliedArtifact
            }
          }
          if (filteredManifests?.length) {
            // adding all manifests to serviceDefinition for UI to render in SelectArtifactModal
            if (filteredStageObj.stage.spec.serviceConfig?.serviceDefinition?.spec?.manifests) {
              filteredStageObj.stage.spec.serviceConfig.serviceDefinition.spec.manifests = filteredManifests
            } else {
              filteredStageObj.stage.spec.serviceConfig.serviceDefinition = {
                spec: {
                  manifests: filteredManifests
                }
              }
            }
            return filteredStageObj
          }
        })
      } else {
        // shows manifests matching manifest type + manifest overrides from their references
        const filteredStageObj = stageObj?.stage?.template
          ? { stage: { ...stageObj?.stage?.template?.templateInputs, identifier: stageObj?.stage?.identifier } }
          : { ...stageObj }

        const filteredManifests = getFilteredManifestsWithOverrides({
          stageObj: filteredStageObj,
          manifestType,
          stages: pipeline.stages
        })
        if (stageId && artifactRef) {
          const newAppliedArtifact = filteredManifests?.find(
            (manifestObj: any) => manifestObj?.manifest?.identifier === artifactRef
          )?.manifest
          if (newAppliedArtifact) {
            appliedArtifact = newAppliedArtifact
          }
        }
        if (filteredManifests?.length) {
          // adding all manifests to serviceDefinition for UI to render in SelectArtifactModal
          if (filteredStageObj.stage.spec.serviceConfig?.serviceDefinition?.spec?.manifests) {
            filteredStageObj.stage.spec.serviceConfig.serviceDefinition.spec.manifests = filteredManifests
          } else {
            filteredStageObj.stage.spec.serviceConfig.serviceDefinition = {
              spec: {
                manifests: filteredManifests
              }
            }
          }
          return filteredStageObj
        }
      }
    })
    const stageManifests = flatten(stagesManifests)
    return {
      appliedArtifact,
      data: stageManifests?.filter((stage: Record<string, unknown>) => !isUndefined(stage))
    }
  } else if (inputSetTemplateYamlObj?.pipeline && artifactType) {
    const pipeline = inputSetTemplateYamlObj.pipeline.template
      ? (inputSetTemplateYamlObj.pipeline.template.templateInputs as PipelineInfoConfig)
      : inputSetTemplateYamlObj.pipeline
    let appliedArtifact: any
    const stagesManifests = pipeline.stages?.map((stageObj: any) => {
      if (stageObj.parallel) {
        return stageObj.parallel.map((parStg: any) => {
          const filteredStageObj = parStg?.stage?.template
            ? { stage: { ...parStg?.stage?.template?.templateInputs, identifier: parStg?.stage?.identifier } }
            : { ...parStg }
          const filteredArtifacts = getFilteredArtifactsWithOverrides({
            stageObj: filteredStageObj,
            artifactType,
            stages: pipeline.stages,
            artifactRef
          })
          if (stageId && artifactRef) {
            const newAppliedArtifact = filteredArtifacts?.sidecars?.find(
              (artifactObj: any) => artifactObj?.sidecar?.identifier === artifactRef
            )
            if (newAppliedArtifact) {
              appliedArtifact = newAppliedArtifact
            } else if (
              artifactRef === PRIMARY_ARTIFACT &&
              filteredArtifacts?.primary &&
              Object.entries(filteredArtifacts?.primary).length &&
              !filteredArtifacts?.primary?.identifier
            ) {
              appliedArtifact = filteredArtifacts?.primary
            }
          }
          if (filteredArtifacts?.sidecars?.length || filteredArtifacts?.primary?.type) {
            // adding all manifests to serviceDefinition for UI to render in SelectArtifactModal

            filteredStageObj.stage.spec.serviceConfig.serviceDefinition = {
              spec: {
                artifacts: filteredArtifacts
              }
            }
            return filteredStageObj
          }
        })
      } else {
        // shows manifests matching manifest type + manifest overrides from their references
        const filteredStageObj = stageObj?.stage?.template
          ? { stage: { ...stageObj?.stage?.template?.templateInputs, identifier: stageObj?.stage?.identifier } }
          : { ...stageObj }

        const filteredArtifacts = getFilteredArtifactsWithOverrides({
          stageObj: filteredStageObj,
          artifactType,
          stages: pipeline.stages
        })

        if (stageId && artifactRef && !appliedArtifact) {
          const newAppliedArtifact = filteredArtifacts?.sidecars?.find(
            (artifactObj: any) => artifactObj?.sidecar?.identifier === artifactRef
          )
          if (newAppliedArtifact) {
            appliedArtifact = newAppliedArtifact
          } else if (artifactRef === PRIMARY_ARTIFACT) {
            appliedArtifact = filteredArtifacts?.primary
          }
        }

        if (filteredArtifacts?.sidecars?.length || filteredArtifacts?.primary?.type) {
          // adding all manifests to serviceDefinition for UI to render in SelectArtifactModal
          filteredStageObj.stage.spec.serviceConfig.serviceDefinition = {
            spec: {
              artifacts: filteredArtifacts
            }
          }
          return filteredStageObj
        }
      }
    })
    const stageManifests = flatten(stagesManifests)
    return {
      appliedArtifact,
      data: stageManifests?.filter((stage: Record<string, unknown>) => !isUndefined(stage))
    }
  }
  return {}
}

export const getFilteredStage = (pipelineObj: any, stageId: string): any => {
  for (const item of pipelineObj) {
    if (Array.isArray(item.parallel)) {
      return getFilteredStage(item.parallel, stageId)
    } else if (item.stage.identifier === stageId) {
      return item
    }
  }
}

export const filterArtifact = ({
  runtimeData,
  stageId,
  artifactId,
  isManifest
}: {
  runtimeData: any
  stageId: any
  artifactId: any
  isManifest: boolean
}): any => {
  const filteredStage = getFilteredStage(runtimeData, stageId)
  //(runtimeData || []).find((item: any) => item?.stage?.identifier === stageId)
  if (isManifest) {
    return (
      filteredStage?.stage?.spec?.serviceConfig?.serviceDefinition?.spec?.manifests.find(
        (manifestObj: any) => manifestObj?.manifest?.identifier === artifactId
      ) ||
      filteredStage?.stage?.spec?.serviceConfig?.stageOverrides?.manifests.find(
        (manifestObj: any) => manifestObj?.manifest?.identifier === artifactId
      )
    )
  } else {
    if (artifactId === PRIMARY_ARTIFACT) {
      return {
        primary:
          filteredStage?.stage?.spec?.serviceConfig?.serviceDefinition?.spec?.artifacts?.primary ||
          filteredStage?.stage?.spec?.serviceConfig?.stageOverrides?.artifacts?.primary
      }
    }
    return {
      sidecars:
        filteredStage?.stage?.spec?.serviceConfig?.serviceDefinition?.spec?.artifacts?.sidecars?.filter(
          (artifactObj: any) => artifactObj?.sidecar?.identifier === artifactId
        ) ||
        filteredStage?.stage?.spec?.serviceConfig?.stageOverrides?.artifacts?.sidecars?.filter(
          (artifactObj: any) => artifactObj?.sidecar?.identifier === artifactId
        )
    }
  }
}

export const filterSideCarArtifacts = ({
  runtimeData,
  stageId,
  artifactId
}: {
  runtimeData: any
  stageId: any
  artifactId: any
}): any => {
  const filteredStage = getFilteredStage(runtimeData, stageId)
  const artifacts = filteredStage?.stage?.spec?.serviceConfig?.serviceDefinition?.spec?.artifacts

  const { sidecars, primary } = artifacts

  if (artifactId === PRIMARY_ARTIFACT) {
    return primary
  }

  return (
    sidecars?.find((artifactObj: any) => artifactObj?.sidecar?.identifier === artifactId) ||
    sidecars?.find((artifactObj: any) => artifactObj?.sidecar?.identifier === artifactId)
  )
}

// This is to filter the manifestIndex
// with the selectedArtifact's index
export const filterArtifactIndex = ({
  runtimeData,
  stageId,
  artifactId,
  isManifest
}: {
  runtimeData: any
  stageId: any
  artifactId: any
  isManifest: boolean
}): number => {
  const filteredStage = getFilteredStage(runtimeData, stageId)
  if (isManifest) {
    return filteredStage?.stage?.spec?.serviceConfig?.serviceDefinition?.spec?.manifests.findIndex(
      (manifestObj: any) => manifestObj?.manifest?.identifier === artifactId
    )
  } else {
    return (
      filteredStage?.stage?.spec?.serviceConfig?.serviceDefinition?.spec?.artifacts.sidecars?.findIndex(
        (artifactObj: any) => artifactObj?.sidecar?.identifier === artifactId
      ) ||
      filteredStage?.stage?.spec?.serviceConfig?.stageOverrides?.artifacts?.sidecars?.findIndex(
        (artifactObj: any) => artifactObj?.sidecar?.identifier === artifactId
      ) ||
      -1
    )
  }
}

export const getStageIdx = (runtimeData: any, stageId: any) => {
  return runtimeData.findIndex((item: any) => item.stage.identifier === stageId)
}

export const getTemplateObject = (manifest: any, artifacts: any) => {
  return {
    artifacts: { primary: artifacts?.primary, sidecars: artifacts?.sidecars },
    manifests: [manifest]
  }
}

export const getPathString = (runtimeData: any, stageId: any) => {
  const filteredStageIdx = getStageIdx(runtimeData, stageId)
  return `stages[${filteredStageIdx}].stage.spec.serviceConfig.serviceDefinition.spec`
}

const isRuntimeInput = (str: any): boolean => typeof str === 'string' && str?.includes('<+input>')
const getRuntimeInputLabel = ({ str, getString }: { str: any; getString?: (key: StringKeys) => string }): string =>
  isRuntimeInput(str) ? getString?.('pipeline.artifactTriggerConfigPanel.runtimeInput') : str

const getLocationAttribute = ({
  artifact,
  type
}: {
  artifact: ManifestConfigWrapper
  type: string
}): string | undefined => {
  if (type === ManifestStoreMap.S3 || type === ManifestStoreMap.Gcs) {
    return get(artifact, 'manifest.spec.store.spec.folderPath')
  } else if (type === ManifestStoreMap.Http) {
    return get(artifact, 'manifest.spec.chartName')
  } else if (type === 'Gcr') {
    return get(artifact, 'sidecar.spec.imagePath')
  }
}

const getChartVersionAttribute = ({ artifact }: { artifact: ManifestConfigWrapper }): string | undefined =>
  get(artifact, 'manifest.spec.chartVersion')

const getTag = ({ artifact }: { artifact: ManifestConfigWrapper }): string | undefined =>
  get(artifact, 'sidecar.spec.tag')

const getStoreTypeAttribute = ({ artifact }: { artifact: ManifestConfigWrapper }): string | undefined =>
  get(artifact, 'manifest.spec.store.type')

export const getDetailsFromPipeline = ({
  manifests,
  manifestIdentifier,
  manifestType,
  stageOverridesManifests
}: {
  manifests: ManifestConfigWrapper[]
  manifestIdentifier: string
  manifestType: string
  stageOverridesManifests?: any
}): artifactTableDetails => {
  const details: artifactTableDetails = {}
  if (manifestType === ManifestDataType.HelmChart) {
    const matchedManifest = (stageOverridesManifests || manifests)?.find(
      (manifestObj: any) => manifestObj?.manifest.identifier === manifestIdentifier
    )
    if (matchedManifest) {
      details.location = getLocationAttribute({
        artifact: matchedManifest,
        type: matchedManifest?.manifest?.spec?.store?.type
      })
      details.chartVersion = getChartVersionAttribute({
        artifact: matchedManifest
      })
      details.storeType = getStoreTypeAttribute({
        artifact: matchedManifest
      })
    }
  }
  return details
}

export const getArtifactDetailsFromPipeline = ({
  artifacts,
  artifactType,
  stageOverrideArtifacts
}: // stageOverridesArtifacts
{
  artifacts: { primary: any; sidecars: any[] }
  artifactType: string
  stageOverrideArtifacts?: any
}): artifactTableDetails => {
  const details: artifactTableDetails = {}
  if (
    artifactType === ENABLED_ARTIFACT_TYPES.Gcr ||
    artifactType === ENABLED_ARTIFACT_TYPES.DockerRegistry ||
    artifactType === ENABLED_ARTIFACT_TYPES.Ecr
  ) {
    const matchedManifest = (artifacts?.sidecars || stageOverrideArtifacts?.sidecars)?.find(
      (artifactObj: any) => artifactObj?.sidecar.type === artifactType
    )

    if (matchedManifest) {
      details.location = getLocationAttribute({
        artifact: matchedManifest,
        type: artifactType
      })
      details.tag = getTag({
        artifact: matchedManifest
      })
    }
  }
  return details
}

export const getConnectorNameFromPipeline = ({
  manifests,
  manifestIdentifier,
  manifestType,
  stageOverridesManifests
}: {
  manifests: ManifestConfigWrapper[]
  manifestIdentifier: string
  manifestType: string
  stageOverridesManifests?: any
}): string | undefined => {
  if (manifestType) {
    return (stageOverridesManifests || manifests)?.find(
      (manifestObj: any) => manifestObj?.manifest.identifier === manifestIdentifier
    )?.manifest?.spec?.store?.spec?.connectorRef
  }
}

export const getArtifactConnectorNameFromPipeline = ({
  artifacts,
  artifactIdentifier,
  artifactType,
  stageOverrideArtifacts
}: {
  artifacts: { primary: any; sidecars: any[] }
  artifactIdentifier: string
  artifactType: StringsMap
  stageOverrideArtifacts?: any
}): string | undefined => {
  if (artifactType) {
    return (artifacts?.sidecars || stageOverrideArtifacts?.sidecars)?.find(
      (artifactObj: any) => artifactObj?.sidecar.identifier === artifactIdentifier
    )?.sidecar?.spec?.connectorRef
  }
}

export const TriggerDefaultFieldList = {
  chartVersion: '<+trigger.manifest.version>',
  build: '<+trigger.artifact.build>'
}

export const replaceTriggerDefaultBuild = ({
  build,
  chartVersion,
  artifactPath
}: {
  build?: string
  chartVersion?: string
  artifactPath?: string
}): string => {
  if (chartVersion === '<+input>') {
    return TriggerDefaultFieldList.chartVersion
  } else if (build === '<+input>' || artifactPath === '<+input>') {
    return TriggerDefaultFieldList.build
  }
  return build || chartVersion || artifactPath || ''
}
const getManifestTableItem = ({
  stageId,
  manifest,
  artifactRepository,
  chartVersion,
  buildTag,
  location,
  isStageOverrideManifest,
  getString,
  isManifest,
  isServerlessDeploymentTypeSelected = false
}: {
  stageId: string
  manifest: any
  artifactRepository?: string
  location?: string
  chartVersion?: string // chartVersion will always be fixed concrete value if exists
  isStageOverrideManifest: boolean
  buildTag?: string
  getString?: (key: StringKeys) => string
  isManifest?: boolean
  isServerlessDeploymentTypeSelected?: boolean
}): artifactTableItem => {
  const { identifier: artifactId } = manifest
  const manifestSpecObjectValues = Object.values(manifest?.spec || {})
  const storeSpecObjectValues = Object.values(manifest?.spec?.store?.spec || {})
  const hasRuntimeInputs =
    manifestSpecObjectValues.some(val => isRuntimeInput(val)) || storeSpecObjectValues.some(val => isRuntimeInput(val))

  const disabled = () => {
    if (isManifest) {
      return (
        !manifest?.spec?.chartVersion ||
        getRuntimeInputLabel({ str: manifest?.spec?.chartVersion, getString }) !==
          getString?.('pipeline.artifactTriggerConfigPanel.runtimeInput')
      )
    } else {
      if (isServerlessDeploymentTypeSelected) {
        return (
          !manifest?.spec?.artifactPath ||
          getRuntimeInputLabel({ str: manifest?.spec?.artifactPath, getString }) !==
            getString?.('pipeline.artifactTriggerConfigPanel.runtimeInput')
        )
      }
      return (
        !manifest?.spec?.tag ||
        getRuntimeInputLabel({ str: manifest?.spec?.tag, getString }) !==
          getString?.('pipeline.artifactTriggerConfigPanel.runtimeInput')
      )
    }
  }

  return {
    artifactLabel: `${stageId}: ${artifactId || 'primary'}`, // required for sorting
    artifactId: getArtifactId(isManifest, artifactId) || '',
    stageId,
    location: getRuntimeInputLabel({ str: location, getString }),
    artifactRepository: getRuntimeInputLabel({
      str: artifactRepository || manifest?.spec?.store?.spec?.connectorRef,
      getString
    }),
    version: getRuntimeInputLabel({ str: manifest?.spec?.chartVersion, getString }) || chartVersion,
    disabled: disabled(),
    hasRuntimeInputs,
    isStageOverrideManifest,
    buildTag: getRuntimeInputLabel({ str: manifest?.spec?.tag, getString }) || buildTag
  }
}

const getManifests = (pipelineObj: any, stageId: string): any => {
  let manifestArr
  for (const item of pipelineObj) {
    if (Array.isArray(item.parallel)) {
      manifestArr = getManifests(item.parallel, stageId)
    } else if (item && item.stage && item.stage.identifier === stageId) {
      manifestArr = item?.stage?.spec?.serviceConfig?.serviceDefinition?.spec?.manifests
    }
    if (manifestArr) {
      return manifestArr
    }
  }
}

const getArtifacts = (pipelineObj: any, stageId: string): any => {
  let artifactArr
  for (const item of pipelineObj) {
    if (Array.isArray(item.parallel)) {
      artifactArr = getArtifacts(item.parallel, stageId)
    } else if (item && item.stage && item.stage.identifier === stageId) {
      artifactArr = item?.stage?.spec?.serviceConfig?.serviceDefinition?.spec?.artifacts
    }
    if (artifactArr) {
      return artifactArr
    }
  }
}

const getPipelineOverrideManifests = (pipelineObj: any, stageId: string): any => {
  let manifestArr
  for (const item of pipelineObj) {
    if (Array.isArray(item.parallel)) {
      manifestArr = getPipelineOverrideManifests(item.parallel, stageId)
    } else if (item && item.stage && item.stage.identifier === stageId) {
      manifestArr = item?.stage?.spec?.serviceConfig?.stageOverrides?.manifests
    }
    if (manifestArr) {
      return manifestArr
    }
  }
}

const getPipelineOverrideArtifacts = (pipelineObj: any, stageId: string): any => {
  let artifactArr
  for (const item of pipelineObj) {
    if (Array.isArray(item.parallel)) {
      artifactArr = getPipelineOverrideArtifacts(item.parallel, stageId)
    } else if (item && item.stage && item.stage.identifier === stageId) {
      artifactArr = item?.stage?.spec?.serviceConfig?.stageOverrides?.artifacts
    }
    if (artifactArr) {
      return artifactArr
    }
  }
}

const isServerlessDeploymentStage = (stageId: string, pipeline: PipelineInfoConfig): boolean => {
  const currentStage = getStageFromPipeline(stageId, pipeline)
    .stage as StageElementWrapper<DeploymentStageElementConfig>
  const selectedDeploymentType = getStageDeploymentType(
    pipeline,
    currentStage,
    !!currentStage?.stage?.spec?.serviceConfig?.useFromStage?.stage
  )
  return isServerlessDeploymentType(selectedDeploymentType)
}

// data is already filtered w/ correct manifest
export const getArtifactTableDataFromData = ({
  data,
  appliedArtifact,
  stageId,
  isManifest,
  getString,
  artifactType,
  pipeline
}: {
  data?: any
  appliedArtifact?: any // get from BE
  stageId?: string
  isManifest: boolean
  getString?: (key: StringKeys) => string
  artifactType?: string
  pipeline: PipelineInfoConfig | Record<string, never> | any
}): {
  appliedTableArtifact?: artifactTableItem[]
  artifactTableData?: artifactTableItem[]
  artifactData?: { sidecars?: artifactTableItem[]; primary?: artifactTableItem }
} => {
  const artifactTableData: artifactTableItem[] = []
  const artifactData: { sidecars?: artifactTableItem[]; primary?: artifactTableItem } = {}

  if (appliedArtifact && stageId && isManifest) {
    const pipelineManifests = getManifests(pipeline.stages, stageId)
    const stageOverridesManifests = getPipelineOverrideManifests(pipeline.stages, stageId)
    const { location } = getDetailsFromPipeline({
      manifests: pipelineManifests,
      manifestIdentifier: appliedArtifact.identifier,
      manifestType: appliedArtifact.type,
      stageOverridesManifests
    })

    const artifactRepository = getConnectorNameFromPipeline({
      manifests: pipelineManifests,
      manifestIdentifier: appliedArtifact.identifier,
      manifestType: appliedArtifact.type,
      stageOverridesManifests
    })

    artifactTableData.push(
      getManifestTableItem({
        stageId,
        manifest: appliedArtifact,
        artifactRepository,
        location,
        getString,
        isStageOverrideManifest: false,
        isManifest: true
      })
    )
    return { appliedTableArtifact: artifactTableData }
  } else if (isManifest) {
    data?.forEach((stageObject: any) => {
      const dataStageId = stageObject?.stage?.identifier
      // pipelineManifests used to find location from pipeline
      const pipelineManifests = getManifests(pipeline?.stages, dataStageId)
      const stageOverridesManifests = getPipelineOverrideManifests(pipeline.stages, dataStageId)
      const { manifests = [] } = stageObject?.stage?.spec?.serviceConfig?.serviceDefinition?.spec || {}
      manifests.forEach((manifestObj: any) => {
        const { location, chartVersion, storeType } = getDetailsFromPipeline({
          manifests: pipelineManifests,
          manifestIdentifier: manifestObj.manifest.identifier,
          manifestType: manifestObj.manifest.type,
          stageOverridesManifests
        })
        if (storeType && storeType === ManifestStoreMap.OciHelmChart) {
          return null
        }
        const artifactRepository = getConnectorNameFromPipeline({
          manifests: pipelineManifests,
          manifestIdentifier: manifestObj.manifest.identifier,
          manifestType: manifestObj.manifest.type,
          stageOverridesManifests
        })

        if (manifestObj?.manifest) {
          artifactTableData.push(
            getManifestTableItem({
              stageId: dataStageId,
              manifest: manifestObj.manifest,
              artifactRepository,
              location,
              chartVersion,
              getString,
              isStageOverrideManifest: !!stageOverridesManifests,
              isManifest: true
            })
          )
        }
      })
    })
    return { artifactTableData }
  } else if (appliedArtifact && stageId && !isManifest) {
    const pipelineArtifacts = getArtifacts(pipeline.stages, stageId)
    const stageOverrideArtifacts = getPipelineOverrideArtifacts(pipeline.stages, stageId)

    // To decide whether stage is serverless or not serverless below function is called
    // If stage is serverless, there is not such field as "tag" instead simialr field name called "artifactPath" is present
    // Similarly, there is not such field as "tagRefex" instead simialr field name called "artifactPathFilter" is present
    const isServerlessDeploymentTypeSelected = isServerlessDeploymentStage(stageId, pipeline)
    // End of code which figures out deployment type of the stage and decides if it is serverless / non-serverless deployment type

    if (appliedArtifact?.sidecar) {
      const { location, tag } = getArtifactDetailsFromPipeline({
        artifacts: pipelineArtifacts,
        artifactType: appliedArtifact?.sidecar.type,
        stageOverrideArtifacts
      })

      const artifactRepository = getArtifactConnectorNameFromPipeline({
        artifacts: pipelineArtifacts,
        artifactIdentifier: appliedArtifact?.sidecar.identifier,
        artifactType: appliedArtifact?.sidecar.type,
        stageOverrideArtifacts
      })

      artifactTableData.push(
        getManifestTableItem({
          stageId,
          manifest: appliedArtifact?.sidecar,
          artifactRepository,
          location,
          getString,
          buildTag: tag,
          isStageOverrideManifest: false,
          isManifest: false
        })
      )
    } else if (pipelineArtifacts?.primary) {
      const primaryArtifact =
        pipelineArtifacts?.primary?.type === appliedArtifact?.type ? pipelineArtifacts?.primary : null
      let location = primaryArtifact?.spec?.imagePath
      let tag = primaryArtifact?.spec?.tag
      if (isServerlessDeploymentTypeSelected) {
        location = primaryArtifact?.spec?.artifactDirectory
        tag = primaryArtifact?.spec?.artifactPath
      }
      const artifactRepository = primaryArtifact?.spec?.connectorRef
      artifactTableData.push(
        getManifestTableItem({
          stageId,
          manifest: appliedArtifact,
          artifactRepository,
          location,
          buildTag: tag,
          getString,
          isStageOverrideManifest: false,
          isManifest: false
        })
      )
    } else if (stageOverrideArtifacts?.primary) {
      const primaryArtifact =
        stageOverrideArtifacts?.primary?.type === appliedArtifact?.type ? stageOverrideArtifacts?.primary : null
      let location = primaryArtifact?.spec?.imagePath
      let tag = stageOverrideArtifacts?.primary?.tag
      if (isServerlessDeploymentTypeSelected) {
        location = primaryArtifact?.spec?.artifactDirectory
        tag = primaryArtifact?.spec?.artifactPath
      }
      const artifactRepository = primaryArtifact?.spec?.connectorRef
      artifactTableData.push(
        getManifestTableItem({
          stageId,
          manifest: appliedArtifact,
          artifactRepository,
          location,
          buildTag: tag,
          getString,
          isStageOverrideManifest: false,
          isManifest: false
        })
      )
    }
    return { appliedTableArtifact: artifactTableData }
  } else {
    data?.forEach((stageObject: any) => {
      const dataStageId = stageObject?.stage?.identifier
      // pipelineManifests used to find location from pipeline
      const pipelineArtifacts = getArtifacts(pipeline?.stages, dataStageId)
      const stageOverridesArtifacts = getPipelineOverrideArtifacts(pipeline.stages, dataStageId)
      const { artifacts = [] } = stageObject?.stage?.spec?.serviceConfig?.serviceDefinition?.spec || {}
      const primaryArtifact = pipelineArtifacts?.primary?.type === artifactType ? pipelineArtifacts?.primary : null
      const stageOverridePrimaryArtifact =
        stageOverridesArtifacts?.primary?.type === artifactType ? stageOverridesArtifacts?.primary : null

      // To decide whether stage is serverless or not serverless below function is called
      // If stage is serverless, there is not such field as "tag" instead simialr field name called "artifactPath" is present
      // Similarly, there is not such field as "tagRefex" instead simialr field name called "artifactPathFilter" is present
      const isServerlessDeploymentTypeSelected = isServerlessDeploymentStage(dataStageId, pipeline)
      // End of code which figures out deployment type of the stage and decides if it is serverless / non-serverless deployment type

      if (primaryArtifact) {
        const artifactObj = primaryArtifact
        let location = primaryArtifact?.spec?.imagePath
        let tag = primaryArtifact?.spec?.tag
        const artifactRepository = primaryArtifact?.spec?.connectorRef
        if (isServerlessDeploymentTypeSelected) {
          location = primaryArtifact?.spec?.artifactDirectory
          tag = primaryArtifact?.spec?.artifactPath
        }

        artifactTableData.push(
          getManifestTableItem({
            stageId: dataStageId,
            manifest: artifactObj,
            artifactRepository,
            location,
            buildTag: tag,
            getString,
            isStageOverrideManifest: false,
            isManifest,
            isServerlessDeploymentTypeSelected
          })
        )
      }
      if (stageOverridePrimaryArtifact) {
        const artifactObj = stageOverridePrimaryArtifact
        let location = stageOverridePrimaryArtifact?.spec?.imagePath
        let tag = stageOverridePrimaryArtifact?.spec?.tag
        const artifactRepository = stageOverridePrimaryArtifact?.spec?.connectorRef
        if (isServerlessDeploymentTypeSelected) {
          location = stageOverridePrimaryArtifact?.spec?.artifactDirectory
          tag = stageOverridePrimaryArtifact?.spec?.artifactPath
        }
        artifactTableData.push(
          getManifestTableItem({
            stageId: dataStageId,
            manifest: artifactObj,
            artifactRepository,
            location,
            buildTag: tag,
            getString,
            isStageOverrideManifest: false,
            isManifest,
            isServerlessDeploymentTypeSelected
          })
        )
      }
      artifacts?.sidecars?.forEach((artifactObj: any) => {
        if (artifactObj.sidecar) {
          const { tag, location } = getArtifactDetailsFromPipeline({
            artifacts: pipelineArtifacts,
            artifactType: artifactObj?.sidecar?.type,
            stageOverrideArtifacts: stageOverridesArtifacts
          })

          const artifactRepository = getArtifactConnectorNameFromPipeline({
            artifacts: pipelineArtifacts,
            artifactIdentifier: artifactObj?.sidecar?.identifier,
            artifactType: artifactObj?.sidecar?.type,
            stageOverrideArtifacts: stageOverridesArtifacts
          })

          if (artifactObj?.sidecar) {
            artifactData?.sidecars?.push(
              getManifestTableItem({
                stageId: dataStageId,
                manifest: artifactObj,
                artifactRepository,
                location,
                buildTag: tag,
                getString,
                isStageOverrideManifest: false,
                isManifest
              })
            )
            artifactTableData.push(
              getManifestTableItem({
                stageId: dataStageId,
                manifest: artifactObj?.sidecar,
                artifactRepository,
                location,
                buildTag: tag,
                getString,
                isStageOverrideManifest: false,
                isManifest
              })
            )
          }
        }
      })
    })
    return { artifactTableData, artifactData }
  }
  return {}
}

// purpose of the function is to get applied artifact
// and replace <+input> with values from selectedArtifact
export function getArtifactSpecObj({
  appliedArtifact,
  selectedArtifact,
  path = '',
  isManifest = true
}: {
  appliedArtifact: artifactManifestData
  selectedArtifact: artifactManifestData
  path: string
  isManifest?: boolean
}): any {
  let newAppliedArtifactSpecObj: any = {}
  if (isManifest) {
    const appliedArtifactSpecEntries = path
      ? Object.entries({ ...appliedArtifact })
      : Object.entries({ ...appliedArtifact?.spec })
    appliedArtifactSpecEntries.forEach((entry: [key: string, val: any]) => {
      const [key, val] = entry
      const pathArr = `.spec${path}`.split('.').filter(p => !!p)
      const pathResult = get(selectedArtifact, pathArr)

      if (val && key && pathResult?.[key]) {
        newAppliedArtifactSpecObj[key] = pathResult[key]
      } else if (val && key && selectedArtifact?.spec?.[key]) {
        newAppliedArtifactSpecObj[key] = selectedArtifact.spec[key]
      } else if (typeof val === 'object') {
        const obj = getArtifactSpecObj({
          appliedArtifact: path ? appliedArtifact[key] : appliedArtifact.spec[key],
          selectedArtifact,
          path: `${path}.${key}`
        })

        if (!isEmpty(obj)) {
          if (!path) {
            newAppliedArtifactSpecObj = { ...newAppliedArtifactSpecObj, ...obj }
          } else {
            set(newAppliedArtifactSpecObj, `${path.substring(1)}.${key}`, obj)
          }
        }
      }
    })
  } else {
    let appliedArtifactSpecEntries
    if (path) {
      appliedArtifactSpecEntries = Object.entries({ ...appliedArtifact })
    } else if (appliedArtifact?.sidecar) {
      appliedArtifactSpecEntries = Object.entries({ ...appliedArtifact?.sidecar })
    } else if (appliedArtifact) {
      appliedArtifactSpecEntries = Object.entries({ ...appliedArtifact })
    }

    appliedArtifactSpecEntries?.forEach((entry: [key: string, val: any]) => {
      const [key, val] = entry
      const pathArr = `${path}`.split('.').filter(p => !!p)
      const pathResult = get(selectedArtifact, pathArr)

      if (val && key && pathResult?.[key]) {
        newAppliedArtifactSpecObj[key] = pathResult[key]
      } else if (val && key && selectedArtifact?.[key]) {
        newAppliedArtifactSpecObj[key] = selectedArtifact?.[key]
      } else if (typeof val === 'object') {
        const obj = getArtifactSpecObj({
          appliedArtifact: path ? appliedArtifact[key] : appliedArtifact.spec[key],
          selectedArtifact,
          path: `${path}.${key}`
        })

        if (!isEmpty(obj)) {
          if (!path) {
            newAppliedArtifactSpecObj = { ...newAppliedArtifactSpecObj, ...obj }
          } else {
            set(newAppliedArtifactSpecObj, `${path.substring(1)}.${key}`, obj)
          }
        }
      }
    })
  }
  return newAppliedArtifactSpecObj
}

export function updatePipelineManifest({
  pipeline,
  stageIdentifier,
  selectedArtifact,
  newArtifact = selectedArtifact
}: {
  pipeline: any
  selectedArtifact: artifactManifestData
  stageIdentifier: string
  newArtifact: any
}): any {
  const newPipeline = cloneDeep(pipeline)
  const newPipelineObj = newPipeline.template ? newPipeline.template.templateInputs : newPipeline
  const pipelineStage = getFilteredStage(newPipelineObj?.stages, stageIdentifier)
  // const pipelineStages = newPipelineObj?.stages.find((item: any) => item.stage.identifier === stageIdentifier)
  const stage = pipelineStage?.stage?.template ? pipelineStage?.stage?.template?.templateInputs : pipelineStage?.stage
  const stageArtifacts = stage?.spec?.serviceConfig?.serviceDefinition?.spec?.manifests
  const stageArtifactIdx = stageArtifacts?.findIndex(
    (item: any) => item.manifest?.identifier === selectedArtifact?.identifier
  )

  if (stageArtifactIdx >= 0) {
    stageArtifacts[stageArtifactIdx].manifest = newArtifact
  }

  return newPipeline
}

export function updatePipelineArtifact({
  pipeline,
  stageIdentifier,
  selectedArtifact,
  newArtifact = selectedArtifact
}: {
  pipeline: any
  selectedArtifact: artifactManifestData
  stageIdentifier: string
  newArtifact: any
}): any {
  const newPipeline = cloneDeep(pipeline)
  const newPipelineObj = newPipeline.template ? newPipeline.template.templateInputs : newPipeline
  const pipelineStage = getFilteredStage(newPipelineObj?.stages, stageIdentifier)
  // const pipelineStages = newPipelineObj?.stages.find((item: any) => item.stage.identifier === stageIdentifier)
  const stage = pipelineStage?.stage?.template ? pipelineStage?.stage?.template?.templateInputs : pipelineStage?.stage
  const stageArtifacts = stage?.spec?.serviceConfig?.serviceDefinition?.spec?.artifacts
  const stageOverrideArtifacts = stage?.spec?.serviceConfig?.stageOverrides?.artifacts

  const stageArtifactIdx = stageArtifacts?.sidecars?.findIndex(
    (item: any) => item.sidecar?.identifier === selectedArtifact?.identifier
  )

  const stageOverrideArtifactIdx = stageOverrideArtifacts?.sidecars?.findIndex(
    (item: any) => item.sidecar?.identifier === selectedArtifact?.identifier
  )

  if (selectedArtifact) {
    if (stageArtifacts?.sidecars || stageArtifacts?.primary) {
      if (stageArtifactIdx >= 0) {
        const { sidecars } = stageArtifacts
        sidecars[stageArtifactIdx].sidecar = newArtifact
      } else if (stageArtifacts?.primary && !newArtifact?.identifier) {
        stageArtifacts['primary'] = newArtifact
      }
    } else if (stageOverrideArtifacts?.sidecars || stageOverrideArtifacts?.primary) {
      if (stageOverrideArtifactIdx >= 0) {
        const { sidecars } = stageOverrideArtifacts
        sidecars[stageArtifactIdx].sidecar = newArtifact
      } else if (stageOverrideArtifacts?.primary && !newArtifact?.identifier) {
        stageOverrideArtifacts['primary'] = newArtifact
      }
    }
  }
  return newPipeline
}

const getPipelineIntegrityMessage = (errorObject: { [key: string]: string }): string =>
  `${errorObject.fieldName}: ${errorObject.message}`

export const displayPipelineIntegrityResponse = (errors: {
  [key: string]: { [key: string]: string }
}): { [key: string]: string } => {
  // display backend error for validating pipeline with current pipeline
  const errs = {}
  const errorsEntries = Object.entries(errors)
  errorsEntries.forEach(entry => set(errs, entry[0], getPipelineIntegrityMessage(entry[1])))
  return errs
}

export const getOrderedPipelineVariableValues = ({
  originalPipelineVariables,
  currentPipelineVariables
}: {
  originalPipelineVariables?: NGVariable[]
  currentPipelineVariables: NGVariable[]
}): NGVariable[] => {
  if (
    originalPipelineVariables &&
    currentPipelineVariables.some(
      (variable: NGVariable, index: number) => variable.name !== originalPipelineVariables[index].name
    )
  ) {
    return originalPipelineVariables.map(
      variable =>
        currentPipelineVariables.find(currentVariable => currentVariable.name === variable.name) ||
        Object.assign(variable, { value: '' })
    )
  }
  return currentPipelineVariables
}

export const clearUndefinedArtifactId = (newPipelineObj = {}): any => {
  // temporary fix, undefined artifact id gets injected somewhere and needs to be removed for submission
  const clearedNewPipeline: any = cloneDeep(newPipelineObj)
  const clearedNewPipelineObj = clearedNewPipeline.template
    ? clearedNewPipeline.template.templateInputs
    : clearedNewPipeline

  clearedNewPipelineObj?.stages?.forEach((stage: any) => {
    const isParallel = !!stage.parallel
    if (isParallel) {
      stage.parallel.forEach((parallelStage: any) => {
        const finalStage = parallelStage?.stage?.template
          ? parallelStage?.stage?.template?.templateInputs
          : parallelStage?.stage
        const parallelStageArtifacts = finalStage?.spec?.serviceConfig?.serviceDefinition?.spec?.artifacts
        const [artifactKey, artifactValues] =
          (parallelStageArtifacts && Object.entries(parallelStageArtifacts)?.[0]) || []

        if (artifactValues && Object.keys(artifactValues)?.includes('identifier') && !artifactValues.identifier) {
          // remove undefined or null identifier
          delete parallelStageArtifacts[artifactKey].identifier
        }
      })
    } else {
      const finalStage = stage?.stage?.template ? stage?.stage?.template?.templateInputs : stage?.stage
      const stageArtifacts = finalStage?.spec?.serviceConfig?.serviceDefinition?.spec?.artifacts
      const [artifactKey, artifactValues] = (stageArtifacts && Object.entries(stageArtifacts)?.[0]) || []

      if (artifactValues && Object.keys(artifactValues)?.includes('identifier') && !artifactValues.identifier) {
        // remove undefined or null identifier
        delete stageArtifacts[artifactKey].identifier
      }
    }
  })

  return clearedNewPipeline
}

export const getModifiedTemplateValues = (
  initialValuesForEdit: FlatOnEditValuesInterface
): FlatOnEditValuesInterface => {
  const returnInitialValuesForEdit = { ...initialValuesForEdit }
  if (
    returnInitialValuesForEdit?.pipeline?.template?.templateInputs?.properties?.ci?.codebase?.repoName === '' &&
    !!returnInitialValuesForEdit.pipeline.template.templateInputs.properties.ci.codebase.connectorRef
  ) {
    // for CI Codebase, remove repoName: "" onEdit since connector is repo url type
    delete returnInitialValuesForEdit.pipeline.template.templateInputs.properties.ci.codebase.repoName
  }
  return returnInitialValuesForEdit
}

export const DEFAULT_TRIGGER_BRANCH = '<+trigger.branch>'

/**
 * Get proper branch to fetch Trigger InputSets
 * If gitAwareForTriggerEnabled is true, pipelineBranchName is used only if it's not DEFAULT_TRIGGER_BRANCH
 * Otherwise, return branch which is the active pipeline branch
 */
export function getTriggerInputSetsBranchQueryParameter({
  gitAwareForTriggerEnabled,
  pipelineBranchName = DEFAULT_TRIGGER_BRANCH,
  branch = ''
}: {
  gitAwareForTriggerEnabled?: boolean
  pipelineBranchName?: string
  branch?: string
}): string {
  return gitAwareForTriggerEnabled
    ? [
        ciCodebaseBuildIssueComment.spec.tag,
        ciCodebaseBuildPullRequest.spec.number,
        ciCodebaseBuild.spec.branch
      ].includes(pipelineBranchName)
      ? branch
      : pipelineBranchName
    : branch
}

export const getErrorMessage = (error: any): string =>
  get(error, 'data.error', get(error, 'data.message', error?.message))

export enum TriggerGitEvent {
  PULL_REQUEST = 'PullRequest',
  ISSUE_COMMENT = 'IssueComment',
  PUSH = 'Push',
  MR_COMMENT = 'MRComment',
  PR_COMMENT = 'PRComment'
}

export const TriggerGitEventTypes: Readonly<string[]> = [
  TriggerGitEvent.PULL_REQUEST,
  TriggerGitEvent.ISSUE_COMMENT,
  TriggerGitEvent.PUSH,
  TriggerGitEvent.MR_COMMENT,
  TriggerGitEvent.PR_COMMENT
]

export const isHarnessExpression = (str = ''): boolean => str.startsWith('<+') && str.endsWith('>')
