/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import type { FormikHelpers } from 'formik'
import { cloneDeep, get, isEqual } from 'lodash-es'
import {
  Button,
  ButtonVariation,
  Container,
  FlexExpander,
  Formik,
  FormikForm,
  Layout,
  PageError,
  Tab,
  Tabs,
  Text
} from '@wings-software/uicore'
import * as yup from 'yup'
import {
  Clause,
  Feature,
  FeatureState,
  GitDetails,
  GitSyncErrorResponse,
  PatchFeatureQueryParams,
  Serve,
  ServingRule,
  TargetMap,
  usePatchFeature,
  VariationMap
} from 'services/cf'
import { useStrings } from 'framework/strings'
import { extraOperatorReference } from '@cf/constants'
import { useToaster } from '@common/exports'
import { useQueryParams } from '@common/hooks'
import { useEnvironmentSelectV2 } from '@cf/hooks/useEnvironmentSelectV2'
import { useGovernance } from '@cf/hooks/useGovernance'
import { FFDetailPageTab, getErrorMessage } from '@cf/utils/CFUtils'
import routes from '@common/RouteDefinitions'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import type { FeatureFlagPathProps, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { AUTO_COMMIT_MESSAGES } from '@cf/constants/GitSyncConstants'
import { GIT_SYNC_ERROR_CODE, UseGitSync } from '@cf/hooks/useGitSync'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import TargetingRulesTab from '@cf/pages/feature-flags-detail/targeting-rules-tab/TargetingRulesTab'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import FlagPipelineTab from '@cf/pages/feature-flags-detail/flag-pipeline-tab/FlagPipelineTab'
import TabTargeting from '../EditFlagTabs/TabTargeting'
import TabActivity from '../EditFlagTabs/TabActivity'
import { CFEnvironmentSelect } from '../CFEnvironmentSelect/CFEnvironmentSelect'
import patch, { ClauseData, getDiff } from '../../utils/instructions'
import { MetricsView } from './views/MetricsView'
import { NoEnvironment } from '../NoEnvironment/NoEnvironment'
import SaveFlagToGitSubFormModal from '../SaveFlagToGitSubFormModal/SaveFlagToGitSubFormModal'
import css from './FlagActivation.module.scss'

// Show loading and wait 3s when the first environment is created before reloading
// current detail page. See https://harness.atlassian.net/browse/FFM-565
const WAIT_TIME_FOR_NEWLY_CREATED_ENVIRONMENT = 3000

interface FlagActivationProps {
  projectIdentifier: string
  flagData: Feature
  gitSync: UseGitSync
  refetchFlag: () => Promise<unknown>
  refetchFlagLoading: boolean
}

export interface FlagActivationFormValues {
  [key: string]: unknown
  state: string
  offVariation: string
  defaultServe: Serve
  customRules: ServingRule[]
  variationMap: VariationMap[]
  gitDetails: GitDetails
  autoCommit: boolean
}

const fromVariationMapToObj = (variationMap: VariationMap[]) =>
  variationMap.reduce((acc: any, vm: VariationMap) => {
    if (acc[vm.variation]) {
      acc[vm.variation].targets = acc[vm.variation].targets.concat(vm.targets || [])
      acc[vm.variation].targetSegments = acc[vm.variation].targetSegments.concat(vm.targetSegments || [])
    } else {
      acc[vm.variation] = { targets: vm.targets, targetSegments: vm.targetSegments }
    }
    return acc
  }, {})

const FlagActivation: React.FC<FlagActivationProps> = props => {
  const { flagData, projectIdentifier, refetchFlag, refetchFlagLoading, gitSync } = props
  const { showError } = useToaster()
  const [editing, setEditing] = useState(false)
  const { orgIdentifier, accountId: accountIdentifier } = useParams<Record<string, string>>()
  const { activeEnvironment: environmentIdentifier, withActiveEnvironment } = useActiveEnvironment()
  const { mutate: patchFeature } = usePatchFeature({
    identifier: flagData.identifier as string,
    queryParams: {
      projectIdentifier,
      environmentIdentifier,
      accountIdentifier,
      orgIdentifier
    } as PatchFeatureQueryParams
  })
  const {
    EnvironmentSelect,
    loading: envsLoading,
    error: envsError,
    refetch: refetchEnvironments,
    environments
  } = useEnvironmentSelectV2({
    selectedEnvironmentIdentifier: environmentIdentifier
  })
  const { handleError: handleGovernanceError, isGovernanceError } = useGovernance()

  const { FFM_1513, FFM_2134_FF_PIPELINES_TRIGGER } = useFeatureFlags()

  const { gitSyncValidationSchema, gitSyncInitialValues } =
    gitSync?.getGitSyncFormMeta(AUTO_COMMIT_MESSAGES.UPDATED_FLAG_RULES) || {}

  const initialValues = useMemo(
    () =>
      cloneDeep({
        state: flagData.envProperties?.state as string,
        onVariation: flagData.envProperties?.defaultServe.variation
          ? flagData.envProperties?.defaultServe.variation
          : flagData.defaultOnVariation,
        offVariation: flagData.envProperties?.offVariation as string,
        defaultServe: flagData.envProperties?.defaultServe as Serve,
        customRules: flagData.envProperties?.rules ?? [],
        variationMap: cloneDeep(
          // filter out variations with no targets. UI needs reworked to suit the use case: https://harness.atlassian.net/browse/FFM-1267
          flagData.envProperties?.variationMap?.filter(variationMapItem => !!variationMapItem?.targets?.length) ?? []
        ),
        flagName: flagData.name,
        flagIdentifier: flagData.identifier,
        gitDetails: gitSyncInitialValues.gitDetails,
        autoCommit: gitSyncInitialValues.autoCommit
      }),
    [gitSyncInitialValues.gitDetails, gitSyncInitialValues.autoCommit]
  )

  const noEnvironmentExists = !envsLoading && !envsError && environments?.length === 0

  const onCancelEditHandler = (): void => {
    setEditing(false)
    patch.feature.reset()
  }

  const [isGitSyncOpenModal, setIsGitSyncModalOpen] = useState(false)

  const onSaveChanges = useCallback(
    (values: FlagActivationFormValues, formikActions: FormikHelpers<FlagActivationFormValues>): void => {
      // handle flag state changed - e.g. toggled from off to on
      if (values.state !== initialValues.state) {
        patch.feature.addInstruction(patch.creators.setFeatureFlagState(values?.state as FeatureState))
      }
      // handle flag off variation changed
      if (!isEqual(values.offVariation, initialValues.offVariation)) {
        patch.feature.addInstruction(patch.creators.updateOffVariation(values.offVariation as string))
      }
      // handle flag default on variation changed
      if (!isEqual(values.onVariation, initialValues.onVariation)) {
        patch.feature.addInstruction(patch.creators.updateDefaultServeByVariation(values.onVariation as string))
      }
      // handle custom rules changed (does not include target variations)
      if (!isEqual(values.customRules, initialValues.customRules)) {
        const toClauseData = (c: Clause): ClauseData => {
          if (c.op === extraOperatorReference.customRules.matchSegment.value) {
            return {
              op: c.op,
              values: c.values
            }
          } else {
            return {
              attribute: c.attribute as string,
              op: c.op,
              values: c.values
            }
          }
        }

        // handle removed custom rules
        patch.feature.addAllInstructions(
          initialValues.customRules
            .filter(rule => !values.customRules.find(r => r.ruleId === rule.ruleId))
            .map(r => patch.creators.removeRule(r.ruleId as string))
        )

        const newRuleIds: string[] = []
        values.customRules = values.customRules.map(rule => {
          if (!rule.ruleId) {
            const newId = uuid()
            newRuleIds.push(newId)
            rule.ruleId = newId
          }
          return rule
        })
        const isNewRule = (id: string): boolean => newRuleIds.includes(id)

        // handle newly added custom rules
        patch.feature.addAllInstructions(
          values.customRules
            .filter(rule => isNewRule(rule.ruleId as string))
            .map(rule =>
              patch.creators.addRule({
                uuid: rule.ruleId,
                priority: rule.priority,
                serve: rule.serve,
                clauses: rule.clauses.map(toClauseData)
              })
            )
        )

        // handle updates to existing rules
        values.customRules
          .filter(rule => !isNewRule(rule.ruleId as string))
          .map(rule => [initialValues.customRules.find(r => r.ruleId === rule.ruleId), rule])
          .filter(([initial, current]) => !isEqual(initial, current))
          .forEach(([initial, current]) => {
            // handle clause added to existing rule
            current?.clauses
              .filter(c => !c.id)
              .forEach(c =>
                patch.feature.addInstruction(patch.creators.addClause(current.ruleId as string, toClauseData(c)))
              )

            // handle clause removed from existing rule
            initial?.clauses
              .filter(c => !current?.clauses.find(cl => cl.id === c.id))
              .forEach(c =>
                patch.feature.addInstruction(patch.creators.removeClause(initial.ruleId as string, c.id as string))
              )

            // handle clause changed on existing rule
            initial?.clauses
              .reduce((acc: any, prev) => {
                const currentValue = current?.clauses.find(c => c.id === prev.id)
                if (currentValue && !isEqual(prev, currentValue)) {
                  return [...acc, [prev, currentValue]]
                }
                return acc
              }, [])
              .forEach(([c, updated]: [Clause, Clause]) =>
                patch.feature.addInstruction(
                  patch.creators.updateClause(initial.ruleId as string, c.id as string, toClauseData(updated))
                )
              )

            // handle update to existing rule serve value (true/false)
            if (current?.serve?.variation && !isEqual(initial?.serve?.variation, current?.serve?.variation)) {
              patch.feature.addInstruction(
                patch.creators.updateRuleVariation(current?.ruleId as string, current.serve.variation)
              )
            }

            if (current?.serve?.distribution && !isEqual(initial?.serve?.distribution, current.serve.distribution)) {
              patch.feature.addInstruction(
                patch.creators.updateRuleVariation(current?.ruleId as string, current.serve.distribution)
              )
            }
          })
      }

      // TODO: this whole complication needs to be refactored
      const normalize = (variationMap: VariationMap[]) =>
        (variationMap || []).map(item => {
          if (item.targets?.length) {
            item.targets = item.targets?.map(target => target?.identifier || target) as unknown as TargetMap[]
          }
          return item
        })
      const normalizedInitialVariationMap = normalize(initialValues.variationMap)
      const normalizedVariationMap = normalize(values.variationMap)

      // handle target variations updated
      if (!isEqual(normalizedVariationMap, normalizedInitialVariationMap)) {
        const initial = fromVariationMapToObj(normalizedInitialVariationMap)
        const updated = fromVariationMapToObj(normalizedVariationMap)

        const variations = Array.from(new Set(Object.keys(initial).concat(Object.keys(updated))))
        variations.forEach((variation: string) => {
          const [added, removed] = getDiff<string, string>(
            initial[variation]?.targets || [],
            updated[variation]?.targets || []
          )
          // handle newly added target variations
          if (added.length > 0) {
            patch.feature.addInstruction(patch.creators.addTargetsToVariationTargetMap(variation, added))
          }
          // handle removed target variations
          if (removed.length > 0) {
            patch.feature.addInstruction(patch.creators.removeTargetsToVariationTargetMap(variation, removed))
          }
        })
      }

      const prevOrder = initialValues.customRules.map(x => x.ruleId)
      const newOrder = values.customRules.map(x => x.ruleId)
      // handle reordered custom rules
      if (!isEqual(prevOrder, newOrder)) {
        patch.feature.addInstruction(patch.creators.reorderRules(newOrder as string[]))
      }

      patch.feature
        .onPatchAvailable(data => {
          patchFeature(
            gitSync?.isGitSyncEnabled
              ? {
                  ...data,
                  gitDetails: values.gitDetails
                }
              : data
          )
            .then(async response => {
              if (isGovernanceError(response)) {
                handleGovernanceError(response)
              }

              if (!gitSync?.isAutoCommitEnabled && values.autoCommit) {
                await gitSync?.handleAutoCommit(values.autoCommit)
              }

              setEditing(false)
              return refetchFlag()
            })
            .then(() => {
              formikActions.resetForm()
            })
            .catch(err => {
              if (err.status === GIT_SYNC_ERROR_CODE) {
                gitSync.handleError(err.data as GitSyncErrorResponse)
              } else {
                if (isGovernanceError(err?.data)) {
                  handleGovernanceError(err.data)
                } else {
                  showError(get(err, 'data.message', err?.message), 0)
                }
              }
            })
            .finally(() => {
              patch.feature.reset()
            })
        })
        .onEmptyPatch(() => setEditing(false))
    },
    [initialValues, patchFeature, showError]
  )

  type RuleErrors = { [K: number]: { [P: number]: 'required' } }
  const validateRules = (rules: ServingRule[]): [RuleErrors, boolean] => {
    const errors: RuleErrors = {}
    let valid = true
    rules.forEach((rule: ServingRule, ruleIdx: number) => {
      rule.clauses.map((clause: Clause, clauseIdx: number) => {
        if (clause.values.length === 0) {
          if (!errors[ruleIdx]) {
            errors[ruleIdx] = {}
          }
          errors[ruleIdx][clauseIdx] = 'required'
          valid = false
        }
      })
    })
    return [errors, valid]
  }

  type VariationMapErrors = { [K: number]: { variation?: 'required'; targets?: 'required' } }
  const validateVariationMap = (variationMap: VariationMap[]): [VariationMapErrors, boolean] => {
    let valid = true
    const errors = variationMap.reduce((acc: VariationMapErrors, next: VariationMap, idx: number) => {
      if (!next.variation.length) {
        valid = false
        acc[idx] = {
          variation: 'required'
        }
      }
      if (!next.targets?.length) {
        valid = false
        acc[idx] = {
          ...(acc[idx] || {}),
          targets: 'required'
        }
      }
      return acc
    }, {})
    return [errors, valid]
  }

  type FormErrors = {
    rules?: RuleErrors
    variationMap?: VariationMapErrors
  }
  const validateForm = (values: FlagActivationFormValues): FormErrors => {
    const errors: FormErrors = {}

    const [rules, validRules] = validateRules(values.customRules)
    if (!validRules) {
      errors.rules = rules
    }

    const [variationMap, validVariationMap] = validateVariationMap(values.variationMap)
    if (!validVariationMap) {
      errors.variationMap = variationMap
    }

    return errors
  }
  const { tab = FFDetailPageTab.TARGETING } = useQueryParams<{ tab?: string }>()
  const [activeTabId, setActiveTabId] = useState(tab)
  const [newEnvironmentCreateLoading, setNewEnvironmentCreateLoading] = useState(false)
  const { getString } = useStrings()
  const history = useHistory()
  const pathParams = useParams<ProjectPathProps & FeatureFlagPathProps>()

  useEffect(() => {
    if (tab !== activeTabId) {
      history.replace(withActiveEnvironment(routes.toCFFeatureFlagsDetail(pathParams) + `?tab=${activeTabId}`))
    }
  }, [activeTabId, history, pathParams, tab, withActiveEnvironment])

  if (envsError) {
    return <PageError message={getErrorMessage(envsError)} onClick={() => refetchEnvironments()} />
  }

  if (envsLoading || newEnvironmentCreateLoading || (refetchFlagLoading && !FFM_1513)) {
    return <ContainerSpinner height="100%" flex={{ justifyContent: 'center', alignItems: 'center' }} />
  }

  if (noEnvironmentExists) {
    return (
      <Container style={{ height: '100%', display: 'grid', alignItems: 'center' }}>
        <NoEnvironment
          style={{ marginTop: '-100px' }}
          onCreated={response => {
            history.replace(
              withActiveEnvironment(
                routes.toCFFeatureFlagsDetail({
                  orgIdentifier,
                  projectIdentifier: flagData.project,
                  featureFlagIdentifier: flagData.identifier,
                  accountId: accountIdentifier
                }),
                response?.data?.identifier
              )
            )

            // See https://harness.atlassian.net/browse/FFM-565
            setNewEnvironmentCreateLoading(true)
            setTimeout(() => {
              setNewEnvironmentCreateLoading(false)
              refetchEnvironments()
            }, WAIT_TIME_FOR_NEWLY_CREATED_ENVIRONMENT)
          }}
        />
      </Container>
    )
  }

  return (
    <Formik<FlagActivationFormValues>
      enableReinitialize={true}
      validateOnChange={false}
      validateOnBlur={false}
      formName="flagActivation"
      initialValues={initialValues}
      validate={validateForm}
      validationSchema={yup.object().shape({
        gitDetails: gitSyncValidationSchema
      })}
      onSubmit={onSaveChanges}
    >
      {formikProps => {
        return (
          <FormikForm>
            <Container className={css.formContainer} height={FFM_1513 ? undefined : '100vh'}>
              <Layout.Horizontal className={css.environmentHeaderContainer} flex={{ alignItems: 'center' }}>
                <FlexExpander />
                <CFEnvironmentSelect component={<EnvironmentSelect />} />
              </Layout.Horizontal>
              <Container data-is-new-targetting-rules={FFM_1513} className={css.tabContainer}>
                {flagData && (
                  <>
                    <Tabs
                      id="editFlag"
                      defaultSelectedTabId={activeTabId}
                      onChange={(tabId: string) => setActiveTabId(tabId)}
                    >
                      <Tab
                        id={FFDetailPageTab.TARGETING}
                        title={<Text className={css.tabTitle}>{getString('cf.featureFlags.targeting')}</Text>}
                        panel={
                          <>
                            {FFM_1513 ? (
                              <TargetingRulesTab
                                featureFlagData={flagData}
                                refetchFlag={refetchFlag}
                                refetchFlagLoading={refetchFlagLoading}
                              />
                            ) : (
                              <TabTargeting
                                formikProps={formikProps}
                                editing={editing}
                                projectIdentifier={projectIdentifier}
                                environmentIdentifier={environmentIdentifier}
                                setEditing={setEditing}
                                feature={flagData}
                                orgIdentifier={orgIdentifier}
                                accountIdentifier={accountIdentifier}
                              />
                            )}
                          </>
                        }
                      />

                      {FFM_2134_FF_PIPELINES_TRIGGER && (
                        <Tab
                          id={FFDetailPageTab.FLAG_PIPELINE}
                          title={
                            <Text className={css.tabTitle}>{getString('cf.featureFlags.flagPipeline.title')}</Text>
                          }
                          panel={<FlagPipelineTab flagIdentifier={flagData.identifier} />}
                          panelClassName={css.flagPipelinePanel}
                        />
                      )}

                      <Tab
                        id={FFDetailPageTab.METRICS}
                        title={<Text className={css.tabTitle}>{getString('cf.featureFlags.metrics.title')}</Text>}
                        panel={<MetricsView flagData={flagData} />}
                      />

                      <Tab
                        id={FFDetailPageTab.ACTIVITY}
                        title={<Text className={css.tabTitle}>{getString('cf.featureFlags.activity')}</Text>}
                        panel={<TabActivity flagData={flagData} />}
                      />
                    </Tabs>
                  </>
                )}
              </Container>
              {(editing || formikProps.values.state !== flagData.envProperties?.state) &&
                activeTabId === FFDetailPageTab.TARGETING && (
                  <Layout.Horizontal className={css.actionButtons} padding="medium" spacing="small">
                    <Button
                      type="submit"
                      intent="primary"
                      text={getString('save')}
                      variation={ButtonVariation.PRIMARY}
                      onClick={event => {
                        if (gitSync?.isGitSyncEnabled && !gitSync?.isAutoCommitEnabled) {
                          event.preventDefault()
                          setIsGitSyncModalOpen(true)
                        }
                      }}
                    />
                    <Button
                      minimal
                      text={getString('cancel')}
                      variation={ButtonVariation.SECONDARY}
                      onClick={(e: MouseEvent) => {
                        e.preventDefault()
                        onCancelEditHandler()
                        formikProps.handleReset()
                      }}
                    />
                  </Layout.Horizontal>
                )}
            </Container>
            {isGitSyncOpenModal && (
              <SaveFlagToGitSubFormModal
                title={getString('cf.gitSync.saveFlagToGit', {
                  flagName: flagData.name
                })}
                onSubmit={formikProps.submitForm}
                onClose={() => setIsGitSyncModalOpen(false)}
              />
            )}
          </FormikForm>
        )
      }}
    </Formik>
  )
}

export default FlagActivation
