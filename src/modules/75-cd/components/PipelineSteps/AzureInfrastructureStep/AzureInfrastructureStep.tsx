/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import {
  Text,
  Layout,
  FormInput,
  SelectOption,
  Formik,
  FormikForm,
  IconName,
  Icon,
  getMultiTypeFromValue,
  MultiTypeInputType,
  Accordion
} from '@wings-software/uicore'
import { FormikProps, FormikErrors, yupToFormErrors } from 'formik'
import cx from 'classnames'
import { useParams } from 'react-router-dom'
import { debounce, noop, get, defaultTo, set, isEmpty, isEqual } from 'lodash-es'
import * as Yup from 'yup'
import { parse } from 'yaml'
import { CompletionItemKind } from 'vscode-languageserver-types'
import { StepViewType, StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import {
  AzureSubscriptionDTO,
  getAzureClustersPromise,
  getAzureResourceGroupsBySubscriptionPromise,
  getAzureSubscriptionsPromise,
  getConnectorListV2Promise,
  K8sAzureInfrastructure,
  useGetAzureClusters,
  useGetAzureResourceGroupsBySubscription,
  useGetAzureSubscriptions
} from 'services/cd-ng'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { Connectors } from '@connectors/constants'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { getConnectorName, getConnectorValue } from '@pipeline/components/PipelineSteps/Steps/StepsHelper'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'

import {
  ConnectorReferenceDTO,
  FormMultiTypeConnectorField
} from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { getIconByType } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { useStrings } from 'framework/strings'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import { Scope } from '@common/interfaces/SecretsInterface'
import { getNameSpaceSchema, getReleaseNameSchema } from '../PipelineStepsUtil'
import {
  AzureInfrastructureSpecEditableProps,
  AzureInfrastructureTemplate,
  getValue,
  getValidationSchema,
  subscriptionLabel,
  clusterLabel,
  resourceGroupLabel
} from './AzureInfrastructureInterface'
import css from './AzureInfrastructureSpec.module.scss'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

const logger = loggerFor(ModuleName.CD)

const yamlErrorMessage = 'cd.parsingYamlError'

const errorMessage = 'data.message'

interface AzureInfrastructureUI extends Omit<K8sAzureInfrastructure, 'subscriptionId' | 'cluster' | 'resourceGroup'> {
  subscriptionId?: any
  cluster?: any
  resourceGroup?: any
}

const AzureInfrastructureSpecInputForm: React.FC<AzureInfrastructureSpecEditableProps & { path: string }> = ({
  template,
  initialValues,
  readonly = false,
  path,
  onUpdate,
  allowableTypes,
  allValues
}) => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const [subscriptions, setSubscriptions] = useState<SelectOption[]>([])
  const [resourceGroups, setResourceGroups] = useState<SelectOption[]>([])
  const [clusters, setClusters] = useState<SelectOption[]>([])
  const [connector, setConnector] = useState<string | undefined>(
    defaultTo(initialValues.connectorRef, allValues?.connectorRef)
  )
  const [subscriptionId, setSubscriptionId] = useState<string | undefined>(
    defaultTo(initialValues.subscriptionId, allValues?.subscriptionId)
  )

  const [resourceGroupValue, setResourceGroupValue] = useState<string | undefined>(
    defaultTo(initialValues.resourceGroup, allValues?.resourceGroup)
  )
  const [clusterValue, setClusterValue] = useState<string | undefined>(
    defaultTo(initialValues.cluster, allValues?.cluster)
  )
  const { expressions } = useVariablesExpression()

  const { getString } = useStrings()

  const queryParams = {
    connectorRef: connector as string,
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier
  }

  const resetForm = (parent: string): void => {
    switch (parent) {
      case 'connectorRef':
        set(initialValues, 'subscriptionId', '')
        set(initialValues, 'resourceGroup', '')
        set(initialValues, 'cluster', '')
        onUpdate?.(initialValues)
        break
      case 'subscriptionId':
        set(initialValues, 'resourceGroup', '')
        set(initialValues, 'cluster', '')
        onUpdate?.(initialValues)
        break
      case 'resourceGroup':
        set(initialValues, 'cluster', '')
        onUpdate?.(initialValues)
        break
    }
  }

  const {
    data: subscriptionsData,
    loading: loadingSubscriptions,
    refetch: refetchSubscriptions,
    error: subscriptionsError
  } = useGetAzureSubscriptions({
    queryParams: {
      connectorRef: connector as string,
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    lazy: true
  })

  useEffect(() => {
    setSubscriptions(
      defaultTo(subscriptionsData?.data?.subscriptions, []).reduce(
        (subscriptionValues: SelectOption[], subscription: AzureSubscriptionDTO) => {
          subscriptionValues.push({
            label: `${subscription.subscriptionName}: ${subscription.subscriptionId}`,
            value: subscription.subscriptionId
          })
          return subscriptionValues
        },
        []
      )
    )
  }, [subscriptionsData])

  const {
    data: resourceGroupData,
    refetch: refetchResourceGroups,
    loading: loadingResourceGroups,
    error: resourceGroupsError
  } = useGetAzureResourceGroupsBySubscription({
    queryParams: {
      connectorRef: connector as string,
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    subscriptionId: subscriptionId as string,
    lazy: true
  })

  useEffect(() => {
    const options =
      resourceGroupData?.data?.resourceGroups?.map(rg => ({ label: rg.resourceGroup, value: rg.resourceGroup })) ||
      /* istanbul ignore next */ []
    setResourceGroups(options)
  }, [resourceGroupData])

  const {
    data: clustersData,
    refetch: refetchClusters,
    loading: loadingClusters,
    error: clustersError
  } = useGetAzureClusters({
    queryParams: {
      connectorRef: connector as string,
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    subscriptionId: subscriptionId as string,
    resourceGroup: defaultTo(initialValues.resourceGroup, allValues?.resourceGroup) as string,
    lazy: true
  })

  useEffect(() => {
    const options =
      clustersData?.data?.clusters?.map(cl => ({ label: cl.cluster, value: cl.cluster })) ||
      /* istanbul ignore next */ []
    setClusters(options)
  }, [clustersData])

  useEffect(() => {
    if (connector && getMultiTypeFromValue(connector) === MultiTypeInputType.FIXED) {
      refetchSubscriptions({
        queryParams
      })
    }
    if (
      connector &&
      getMultiTypeFromValue(connector) === MultiTypeInputType.FIXED &&
      subscriptionId &&
      getMultiTypeFromValue(subscriptionId) === MultiTypeInputType.FIXED
    ) {
      refetchResourceGroups({
        queryParams,
        pathParams: {
          subscriptionId: subscriptionId
        }
      })
      /* istanbul ignore else */
    }
    if (
      connector &&
      getMultiTypeFromValue(connector) === MultiTypeInputType.FIXED &&
      subscriptionId &&
      getMultiTypeFromValue(subscriptionId) === MultiTypeInputType.FIXED &&
      resourceGroupValue &&
      getMultiTypeFromValue(resourceGroupValue) === MultiTypeInputType.FIXED
    ) {
      refetchClusters({
        queryParams,
        pathParams: {
          subscriptionId: subscriptionId as string,
          resourceGroup: resourceGroupValue as string
        }
      })

      /* istanbul ignore else */
    }
  }, [])

  useEffect(() => {
    resetForm('connectorRef')
  }, [connector])
  useEffect(() => {
    resetForm('subscriptionId')
  }, [subscriptionId])
  useEffect(() => {
    resetForm('resourceGroup')
  }, [resourceGroupValue])

  useEffect(() => {
    if (connector && !initialValues.connectorRef) {
      set(initialValues, 'connectorRef', connector)
    }
    if (subscriptionId && !initialValues.subscriptionId) {
      set(initialValues, 'subscriptionId', subscriptionId)
    }
    if (resourceGroupValue && !initialValues.resourceGroup) {
      set(initialValues, 'resourceGroup', resourceGroupValue)
    }
    if (clusterValue && !initialValues.cluster) {
      set(initialValues, 'cluster', clusterValue)
    }
    onUpdate?.(initialValues)
  }, [])

  return (
    <Layout.Vertical spacing="small">
      {getMultiTypeFromValue(template?.connectorRef) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md, css.inputWrapper)}>
          <FormMultiTypeConnectorField
            accountIdentifier={accountId}
            projectIdentifier={projectIdentifier}
            orgIdentifier={orgIdentifier}
            name={`${path}.connectorRef`}
            tooltipProps={{
              dataTooltipId: 'azureInfraConnector'
            }}
            label={getString('connector')}
            enableConfigureOptions={false}
            placeholder={getString('connectors.selectConnector')}
            disabled={readonly}
            multiTypeProps={{ allowableTypes, expressions }}
            type={Connectors.AZURE}
            setRefValue
            onChange={
              /* istanbul ignore next */ (selected, _typeValue, type) => {
                const item = selected as unknown as { record?: ConnectorReferenceDTO; scope: Scope }
                if (type === MultiTypeInputType.FIXED) {
                  const connectorRef =
                    item.scope === Scope.ORG || item.scope === Scope.ACCOUNT
                      ? `${item.scope}.${item?.record?.identifier}`
                      : item.record?.identifier
                  if (!isEqual(connectorRef, connector)) {
                    setConnector(connectorRef)
                  }
                } else if (type === MultiTypeInputType.EXPRESSION) {
                  setConnector(selected?.toString())
                }
                setSubscriptions([])
                setResourceGroups([])
                setClusters([])
              }
            }
            gitScope={{ repo: defaultTo(repoIdentifier, ''), branch, getDefaultFromOtherRepo: true }}
          />
        </div>
      )}
      {getMultiTypeFromValue(template?.subscriptionId) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md, css.inputWrapper)}>
          <FormInput.MultiTypeInput
            name={`${path}.subscriptionId`}
            tooltipProps={{
              dataTooltipId: 'azureInfraSubscription'
            }}
            disabled={readonly}
            placeholder={
              loadingSubscriptions
                ? /* istanbul ignore next */ getString('loading')
                : getString('cd.steps.azureInfraStep.subscriptionPlaceholder')
            }
            useValue
            selectItems={subscriptions}
            label={getString(subscriptionLabel)}
            multiTypeInputProps={{
              onChange: /* istanbul ignore next */ (value, _typeValue, type) => {
                if (value && type === MultiTypeInputType.FIXED) {
                  if (!isEqual(getValue(value), subscriptionId)) {
                    setSubscriptionId(getValue(value))
                  }
                } else if (type === MultiTypeInputType.EXPRESSION) {
                  setSubscriptionId(value?.toString())
                }
                setResourceGroups([])
                setClusters([])
              },
              onFocus: () => {
                if (connector) {
                  refetchSubscriptions({
                    queryParams: {
                      accountIdentifier: accountId,
                      projectIdentifier,
                      orgIdentifier,
                      connectorRef: connector
                    }
                  })
                }
              },
              selectProps: {
                items: subscriptions,
                allowCreatingNewItems: true,
                addClearBtn: !(loadingSubscriptions || readonly),
                noResults: (
                  <Text padding={'small'}>
                    {loadingSubscriptions
                      ? getString('loading')
                      : defaultTo(
                          get(subscriptionsError, errorMessage, subscriptionsError?.message),
                          getString('pipeline.ACR.subscriptionError')
                        )}
                  </Text>
                )
              },
              expressions,
              allowableTypes
            }}
          />
        </div>
      )}
      {getMultiTypeFromValue(template?.resourceGroup) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md, css.inputWrapper)}>
          <FormInput.MultiTypeInput
            name={`${path}.resourceGroup`}
            tooltipProps={{
              dataTooltipId: 'azureInfraResourceGroup'
            }}
            disabled={readonly}
            placeholder={
              loadingResourceGroups
                ? /* istanbul ignore next */ getString('loading')
                : getString('cd.steps.azureInfraStep.resourceGroupPlaceholder')
            }
            useValue
            selectItems={resourceGroups}
            label={getString(resourceGroupLabel)}
            multiTypeInputProps={{
              onChange: /* istanbul ignore next */ (value, _typeValue, type) => {
                if (value && type === MultiTypeInputType.FIXED) {
                  setResourceGroupValue(getValue(value))
                } else if (type === MultiTypeInputType.EXPRESSION) {
                  setResourceGroupValue(value?.toString())
                }
                setClusters([])
              },
              onFocus: () => {
                if (connector && subscriptionId) {
                  refetchResourceGroups({
                    queryParams: {
                      accountIdentifier: accountId,
                      projectIdentifier,
                      orgIdentifier,
                      connectorRef: connector as string
                    },
                    pathParams: {
                      subscriptionId: subscriptionId
                    }
                  })
                }
              },
              selectProps: {
                items: resourceGroups,
                allowCreatingNewItems: true,
                addClearBtn: !(loadingResourceGroups || readonly),
                noResults: loadingResourceGroups ? (
                  getString('loading')
                ) : (
                  <Text padding={'small'}>
                    {defaultTo(
                      get(resourceGroupsError, errorMessage, resourceGroupsError?.message),
                      getString('cd.steps.azureInfraStep.resourceGroupError')
                    )}
                  </Text>
                )
              },
              expressions,
              allowableTypes
            }}
          />
        </div>
      )}
      {getMultiTypeFromValue(template?.cluster) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md, css.inputWrapper)}>
          <FormInput.MultiTypeInput
            name={`${path}.cluster`}
            tooltipProps={{
              dataTooltipId: 'azureInfraCluster'
            }}
            disabled={readonly}
            placeholder={
              loadingClusters
                ? /* istanbul ignore next */ getString('loading')
                : getString('cd.steps.common.selectOrEnterClusterPlaceholder')
            }
            useValue
            selectItems={clusters}
            label={getString(clusterLabel)}
            multiTypeInputProps={{
              onChange: /* istanbul ignore next */ (value, _typeValue, type) => {
                if (value && type === MultiTypeInputType.FIXED) {
                  setClusterValue(getValue(value))
                } else if (type === MultiTypeInputType.EXPRESSION) {
                  setClusterValue(value?.toString())
                }
              },
              onFocus: () => {
                if (connector && subscriptionId && resourceGroupValue) {
                  refetchClusters({
                    queryParams: {
                      accountIdentifier: accountId,
                      projectIdentifier,
                      orgIdentifier,
                      connectorRef: connector as string
                    },
                    pathParams: {
                      subscriptionId: subscriptionId,
                      resourceGroup: resourceGroupValue
                    }
                  })
                }
              },
              selectProps: {
                items: clusters,
                allowCreatingNewItems: true,
                addClearBtn: !(loadingClusters || readonly),
                noResults: loadingClusters ? (
                  getString('loading')
                ) : (
                  <Text padding={'small'}>
                    {defaultTo(
                      get(clustersError, errorMessage, clustersError?.message),
                      getString('cd.steps.azureInfraStep.clusterError')
                    )}
                  </Text>
                )
              },
              expressions,
              allowableTypes
            }}
          />
        </div>
      )}
      {getMultiTypeFromValue(template?.namespace) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormInput.MultiTextInput
            name={`${path}.namespace`}
            tooltipProps={{
              dataTooltipId: 'azureInfraNamespace'
            }}
            label={getString('common.namespace')}
            disabled={readonly}
            multiTextInputProps={{
              allowableTypes,
              expressions
            }}
            placeholder={getString('pipeline.infraSpecifications.namespacePlaceholder')}
          />
        </div>
      )}
      {getMultiTypeFromValue(template?.releaseName) === MultiTypeInputType.RUNTIME && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormInput.MultiTextInput
            name={`${path}.releaseName`}
            tooltipProps={{
              dataTooltipId: 'azureInfraReleaseName'
            }}
            multiTextInputProps={{
              allowableTypes,
              expressions
            }}
            label={getString('common.releaseName')}
            disabled={readonly}
            placeholder={getString('cd.steps.common.releaseNamePlaceholder')}
          />
        </div>
      )}
    </Layout.Vertical>
  )
}

const AzureInfrastructureSpecEditable: React.FC<AzureInfrastructureSpecEditableProps> = ({
  initialValues,
  onUpdate,
  readonly,
  allowableTypes
}): JSX.Element => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const [subscriptions, setSubscriptions] = React.useState<SelectOption[]>([])
  const [clusters, setClusters] = React.useState<SelectOption[]>([])
  const [resourceGroups, setResourceGroups] = React.useState<SelectOption[]>([])
  const delayedOnUpdate = React.useRef(debounce(onUpdate || noop, 300)).current
  const { expressions } = useVariablesExpression()
  const { getString } = useStrings()

  const formikRef = React.useRef<FormikProps<AzureInfrastructureUI> | null>(null)

  const {
    data: subscriptionsData,
    loading: loadingSubscriptions,
    refetch: refetchSubscriptions,
    error: subscriptionsError
  } = useGetAzureSubscriptions({
    queryParams: {
      connectorRef: initialValues?.connectorRef,
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    lazy: true
  })

  React.useEffect(() => {
    const subscriptionValues = [] as SelectOption[]
    defaultTo(subscriptionsData?.data?.subscriptions, []).map(sub =>
      subscriptionValues.push({ label: `${sub.subscriptionName}: ${sub.subscriptionId}`, value: sub.subscriptionId })
    )

    setSubscriptions(subscriptionValues as SelectOption[])
  }, [subscriptionsData])

  useEffect(() => {
    formikRef?.current?.setFieldValue('subscriptionId', getSubscription(initialValues))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions])

  React.useEffect(() => {
    if (initialValues.connectorRef && getMultiTypeFromValue(initialValues.connectorRef) === MultiTypeInputType.FIXED) {
      refetchSubscriptions({
        queryParams: {
          accountIdentifier: accountId,
          projectIdentifier,
          orgIdentifier,
          connectorRef: initialValues.connectorRef
        }
      })
    }
    if (
      initialValues.connectorRef &&
      getMultiTypeFromValue(initialValues.connectorRef) === MultiTypeInputType.FIXED &&
      initialValues.subscriptionId &&
      getMultiTypeFromValue(initialValues.subscriptionId) === MultiTypeInputType.FIXED
    ) {
      refetchResourceGroups({
        queryParams: {
          accountIdentifier: accountId,
          projectIdentifier,
          orgIdentifier,
          connectorRef: initialValues.connectorRef
        },
        pathParams: {
          subscriptionId: initialValues.subscriptionId
        }
      })
    }
    if (
      initialValues.connectorRef &&
      getMultiTypeFromValue(initialValues.connectorRef) === MultiTypeInputType.FIXED &&
      initialValues.subscriptionId &&
      getMultiTypeFromValue(initialValues.subscriptionId) === MultiTypeInputType.FIXED &&
      initialValues.resourceGroup &&
      getMultiTypeFromValue(initialValues.resourceGroup) === MultiTypeInputType.FIXED
    ) {
      refetchClusters({
        queryParams: {
          connectorRef: initialValues?.connectorRef,
          accountIdentifier: accountId,
          orgIdentifier,
          projectIdentifier
        },
        pathParams: {
          subscriptionId: initialValues?.subscriptionId,
          resourceGroup: initialValues?.resourceGroup
        }
      })
    }
  }, [])

  const {
    data: resourceGroupData,
    refetch: refetchResourceGroups,
    loading: loadingResourceGroups,
    error: resourceGroupsError
  } = useGetAzureResourceGroupsBySubscription({
    queryParams: {
      connectorRef: initialValues?.connectorRef,
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    subscriptionId: initialValues?.subscriptionId,
    lazy: true
  })

  React.useEffect(() => {
    const options =
      resourceGroupData?.data?.resourceGroups?.map(rg => ({ label: rg.resourceGroup, value: rg.resourceGroup })) ||
      /* istanbul ignore next */ []
    setResourceGroups(options)
  }, [resourceGroupData])

  const {
    data: clustersData,
    refetch: refetchClusters,
    loading: loadingClusters,
    error: clustersError
  } = useGetAzureClusters({
    queryParams: {
      connectorRef: initialValues?.connectorRef,
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    subscriptionId: initialValues?.subscriptionId,
    resourceGroup: initialValues?.resourceGroup,
    lazy: true
  })

  React.useEffect(() => {
    const options =
      clustersData?.data?.clusters?.map(cl => ({ label: cl.cluster, value: cl.cluster })) ||
      /* istanbul ignore next */ []
    setClusters(options)
  }, [clustersData])

  const getSubscription = (values: AzureInfrastructureUI): SelectOption | undefined => {
    const value = values.subscriptionId ? values.subscriptionId : formikRef?.current?.values?.subscriptionId?.value

    if (getMultiTypeFromValue(value) === MultiTypeInputType.FIXED) {
      return (
        subscriptions.find(subscription => subscription.value === value) || {
          label: value,
          value: value
        }
      )
    }

    return values?.subscriptionId
  }

  const getInitialValues = (): AzureInfrastructureUI => {
    const currentValues: AzureInfrastructureUI = {
      ...initialValues
    }

    /* istanbul ignore else */
    if (initialValues) {
      currentValues.subscriptionId = getSubscription(initialValues)

      if (getMultiTypeFromValue(initialValues?.cluster) === MultiTypeInputType.FIXED) {
        currentValues.cluster = { label: initialValues.cluster, value: initialValues.cluster }
      }

      if (getMultiTypeFromValue(initialValues?.resourceGroup) === MultiTypeInputType.FIXED) {
        currentValues.resourceGroup = { label: initialValues.resourceGroup, value: initialValues.resourceGroup }
      }
    }

    return currentValues
  }

  const { subscribeForm, unSubscribeForm } = React.useContext(StageErrorContext)

  React.useEffect(() => {
    subscribeForm({
      tab: DeployTabs.INFRASTRUCTURE,
      form: formikRef as React.MutableRefObject<FormikProps<unknown> | null>
    })
    return () =>
      unSubscribeForm({
        tab: DeployTabs.INFRASTRUCTURE,
        form: formikRef as React.MutableRefObject<FormikProps<unknown> | null>
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <Layout.Vertical spacing="medium">
      <Formik<AzureInfrastructureUI>
        formName="azureInfra"
        initialValues={getInitialValues()}
        validate={value => {
          const data: Partial<K8sAzureInfrastructure> = {
            namespace: value.namespace === '' ? /* istanbul ignore next */ undefined : value.namespace,
            releaseName: value.releaseName === '' ? /* istanbul ignore next */ undefined : value.releaseName,
            connectorRef: undefined,
            subscriptionId:
              getValue(value.subscriptionId) === ''
                ? /* istanbul ignore next */ undefined
                : getValue(value.subscriptionId),
            resourceGroup:
              getValue(value.resourceGroup) === ''
                ? /* istanbul ignore next */ undefined
                : getValue(value.resourceGroup),
            cluster: getValue(value.cluster) === '' ? /* istanbul ignore next */ undefined : getValue(value.cluster),
            allowSimultaneousDeployments: value.allowSimultaneousDeployments
          }
          /* istanbul ignore else */ if (value.connectorRef) {
            data.connectorRef = value.connectorRef?.value || /* istanbul ignore next */ value.connectorRef
          }

          delayedOnUpdate(data)
        }}
        validationSchema={getValidationSchema(getString)}
        onSubmit={noop}
      >
        {formik => {
          window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: DeployTabs.INFRASTRUCTURE }))
          formikRef.current = formik
          return (
            <FormikForm>
              <Layout.Horizontal className={css.formRow} spacing="medium">
                <FormMultiTypeConnectorField
                  name="connectorRef"
                  label={getString('connector')}
                  placeholder={getString('connectors.selectConnector')}
                  disabled={readonly}
                  accountIdentifier={accountId}
                  multiTypeProps={{ expressions, allowableTypes }}
                  projectIdentifier={projectIdentifier}
                  orgIdentifier={orgIdentifier}
                  width={450}
                  connectorLabelClass={css.connectorRef}
                  enableConfigureOptions={false}
                  style={{ marginBottom: 'var(--spacing-large)' }}
                  type={Connectors.AZURE}
                  onChange={
                    /* istanbul ignore next */ (value: any, _valueType, type) => {
                      /* istanbul ignore next */
                      if (type === MultiTypeInputType.FIXED && value.record) {
                        getMultiTypeFromValue(getValue(formik?.values?.subscriptionId)) === MultiTypeInputType.FIXED &&
                          formik.setFieldValue('subscriptionId', '')
                        getMultiTypeFromValue(getValue(formik?.values?.resourceGroup)) === MultiTypeInputType.FIXED &&
                          formik.setFieldValue('resourceGroup', '')
                        getMultiTypeFromValue(getValue(formik?.values?.cluster)) === MultiTypeInputType.FIXED &&
                          formik.setFieldValue('cluster', '')
                      }
                      setSubscriptions([])
                      setResourceGroups([])
                      setClusters([])
                    }
                  }
                  gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
                />
                {getMultiTypeFromValue(formik.values.connectorRef) === MultiTypeInputType.RUNTIME && !readonly && (
                  <ConfigureOptions
                    value={formik.values.connectorRef as string}
                    type={
                      <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }}>
                        <Icon name={getIconByType(Connectors.AZURE)}></Icon>
                        <Text>{getString('common.azureConnector')}</Text>
                      </Layout.Horizontal>
                    }
                    variableName="connectorRef"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={
                      /* istanbul ignore next */ value => {
                        formik.setFieldValue('connectorRef', value)
                      }
                    }
                    isReadonly={readonly}
                    className={css.marginTop}
                  />
                )}
              </Layout.Horizontal>
              <Layout.Horizontal className={css.formRow} spacing="medium">
                <FormInput.MultiTypeInput
                  name="subscriptionId"
                  className={css.inputWidth}
                  selectItems={subscriptions}
                  disabled={readonly}
                  placeholder={
                    loadingSubscriptions
                      ? /* istanbul ignore next */ getString('loading')
                      : getString('cd.steps.azureInfraStep.subscriptionPlaceholder')
                  }
                  multiTypeInputProps={{
                    onChange: /* istanbul ignore next */ (value, _typeValue, type) => {
                      if (value && type === MultiTypeInputType.FIXED) {
                        getMultiTypeFromValue(getValue(formik?.values?.resourceGroup)) === MultiTypeInputType.FIXED &&
                          formik.setFieldValue('resourceGroup', '')
                        getMultiTypeFromValue(getValue(formik?.values?.cluster)) === MultiTypeInputType.FIXED &&
                          formik.setFieldValue('cluster', '')
                      }
                      setResourceGroups([])
                      setClusters([])
                    },
                    onFocus: () => {
                      refetchSubscriptions({
                        queryParams: {
                          accountIdentifier: accountId,
                          projectIdentifier,
                          orgIdentifier,
                          connectorRef: getValue(formik.values?.connectorRef)
                        }
                      })
                    },
                    expressions,
                    disabled: readonly,
                    selectProps: {
                      items: subscriptions,
                      allowCreatingNewItems: true,
                      addClearBtn: !(loadingSubscriptions || readonly),
                      noResults: (
                        <Text padding={'small'}>
                          {loadingSubscriptions
                            ? getString('loading')
                            : get(subscriptionsError, errorMessage, null) ||
                              getString('pipeline.ACR.subscriptionError')}
                        </Text>
                      )
                    },
                    allowableTypes
                  }}
                  label={getString(subscriptionLabel)}
                />
                {getMultiTypeFromValue(getValue(formik.values.subscriptionId)) === MultiTypeInputType.RUNTIME &&
                  !readonly && (
                    <ConfigureOptions
                      value={!loadingSubscriptions && formik.values.subscriptionId}
                      type="String"
                      variableName="subscriptionId"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={
                        /* istanbul ignore next */ value => {
                          formik.setFieldValue('subscriptionId', value)
                        }
                      }
                      isReadonly={readonly}
                      className={css.marginTop}
                    />
                  )}
              </Layout.Horizontal>
              <Layout.Horizontal className={css.formRow} spacing="medium">
                <FormInput.MultiTypeInput
                  name="resourceGroup"
                  className={css.inputWidth}
                  selectItems={resourceGroups}
                  disabled={readonly}
                  placeholder={
                    loadingResourceGroups
                      ? /* istanbul ignore next */ getString('loading')
                      : getString('cd.steps.azureInfraStep.resourceGroupPlaceholder')
                  }
                  multiTypeInputProps={{
                    onChange: /* istanbul ignore next */ (value, _typeValue, type) => {
                      if (value && type === MultiTypeInputType.FIXED) {
                        getMultiTypeFromValue(getValue(formik?.values?.cluster)) === MultiTypeInputType.FIXED &&
                          formik.setFieldValue('cluster', '')
                      }
                      setClusters([])
                    },
                    onFocus: () => {
                      refetchResourceGroups({
                        queryParams: {
                          accountIdentifier: accountId,
                          projectIdentifier,
                          orgIdentifier,
                          connectorRef: getValue(formik.values?.connectorRef)
                        },
                        pathParams: {
                          subscriptionId: getValue(formik.values?.subscriptionId)
                        }
                      })
                    },
                    expressions,
                    disabled: readonly,
                    selectProps: {
                      items: resourceGroups,
                      allowCreatingNewItems: true,
                      addClearBtn: !(loadingResourceGroups || readonly),
                      noResults: (
                        <Text padding={'small'}>
                          {loadingResourceGroups
                            ? getString('loading')
                            : get(resourceGroupsError, errorMessage, null) ||
                              getString('cd.steps.azureInfraStep.resourceGroupError')}
                        </Text>
                      )
                    },
                    allowableTypes
                  }}
                  label={getString(resourceGroupLabel)}
                />
                {getMultiTypeFromValue(getValue(formik.values.resourceGroup)) === MultiTypeInputType.RUNTIME &&
                  !readonly && (
                    <ConfigureOptions
                      value={!loadingResourceGroups && formik.values.resourceGroup}
                      type="String"
                      variableName="resourceGroup"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={
                        /* istanbul ignore next */ value => {
                          formik.setFieldValue('resourceGroup', value)
                        }
                      }
                      isReadonly={readonly}
                      className={css.marginTop}
                    />
                  )}
              </Layout.Horizontal>
              <Layout.Horizontal className={css.formRow} spacing="medium">
                <FormInput.MultiTypeInput
                  name="cluster"
                  className={css.inputWidth}
                  selectItems={clusters}
                  disabled={readonly}
                  placeholder={
                    loadingClusters
                      ? /* istanbul ignore next */ getString('loading')
                      : getString('cd.steps.common.selectOrEnterClusterPlaceholder')
                  }
                  multiTypeInputProps={{
                    onFocus: () => {
                      refetchClusters({
                        queryParams: {
                          accountIdentifier: accountId,
                          projectIdentifier,
                          orgIdentifier,
                          connectorRef: getValue(formik.values?.connectorRef)
                        },
                        pathParams: {
                          subscriptionId: getValue(formik.values?.subscriptionId),
                          resourceGroup: getValue(formik.values?.resourceGroup)
                        }
                      })
                    },
                    onChange: value => {
                      /* istanbul ignore next */
                      formik.setFieldValue('cluster', value)
                    },
                    expressions,
                    disabled: readonly,
                    selectProps: {
                      items: clusters,
                      allowCreatingNewItems: true,
                      addClearBtn: !(loadingClusters || readonly),
                      noResults: (
                        <Text padding={'small'}>
                          {loadingClusters
                            ? getString('loading')
                            : get(clustersError, errorMessage, null) ||
                              getString('cd.steps.azureInfraStep.clusterError')}
                        </Text>
                      )
                    },
                    allowableTypes
                  }}
                  label={getString(clusterLabel)}
                />
                {getMultiTypeFromValue(getValue(formik.values.cluster)) === MultiTypeInputType.RUNTIME && !readonly && (
                  <ConfigureOptions
                    value={!loadingClusters && formik.values.cluster}
                    type="String"
                    variableName="cluster"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={
                      /* istanbul ignore next */ value => {
                        formik.setFieldValue('cluster', value)
                      }
                    }
                    isReadonly={readonly}
                    className={css.marginTop}
                  />
                )}
              </Layout.Horizontal>
              <Layout.Horizontal className={css.formRow} spacing="medium">
                <FormInput.MultiTextInput
                  name="namespace"
                  className={css.inputWidth}
                  label={getString('common.namespace')}
                  placeholder={getString('pipeline.infraSpecifications.namespacePlaceholder')}
                  multiTextInputProps={{ expressions, textProps: { disabled: readonly }, allowableTypes }}
                  disabled={readonly}
                />
                {getMultiTypeFromValue(formik.values.namespace) === MultiTypeInputType.RUNTIME && !readonly && (
                  <ConfigureOptions
                    value={formik.values.namespace as string}
                    type="String"
                    variableName="namespace"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={value => {
                      /* istanbul ignore next */
                      formik.setFieldValue('namespace', value)
                    }}
                    isReadonly={readonly}
                    className={css.marginTop}
                  />
                )}
              </Layout.Horizontal>
              <Accordion
                panelClassName={css.accordionPanel}
                detailsClassName={css.accordionDetails}
                activeId={!isEmpty(formik.errors.releaseName) ? /* istanbul ignore next */ 'advanced' : ''}
              >
                <Accordion.Panel
                  id="advanced"
                  addDomId={true}
                  summary={getString('common.advanced')}
                  details={
                    <Layout.Horizontal className={css.formRow} spacing="medium">
                      <FormInput.MultiTextInput
                        name="releaseName"
                        className={css.inputWidth}
                        label={getString('common.releaseName')}
                        placeholder={getString('cd.steps.common.releaseNamePlaceholder')}
                        multiTextInputProps={{ expressions, textProps: { disabled: readonly }, allowableTypes }}
                        disabled={readonly}
                      />
                      {getMultiTypeFromValue(formik.values.releaseName) === MultiTypeInputType.RUNTIME && !readonly && (
                        <ConfigureOptions
                          value={formik.values.releaseName as string}
                          type="String"
                          variableName="releaseName"
                          showRequiredField={false}
                          showDefaultField={false}
                          showAdvanced={true}
                          onChange={value => {
                            /* istanbul ignore next */
                            formik.setFieldValue('releaseName', value)
                          }}
                          isReadonly={readonly}
                          className={css.marginTop}
                        />
                      )}
                    </Layout.Horizontal>
                  }
                />
              </Accordion>
              <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }} className={css.lastRow}>
                <FormInput.CheckBox
                  className={css.simultaneousDeployment}
                  tooltipProps={{
                    dataTooltipId: 'azureAllowSimultaneousDeployments'
                  }}
                  name={'allowSimultaneousDeployments'}
                  label={getString('cd.allowSimultaneousDeployments')}
                  disabled={readonly}
                />
              </Layout.Horizontal>
            </FormikForm>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

const AzureInfrastructureSpecVariablesForm: React.FC<AzureInfrastructureSpecEditableProps> = ({
  metadataMap,
  variablesData,
  initialValues
}) => {
  const infraVariables = variablesData?.infrastructureDefinition?.spec
  return infraVariables ? (
    /* istanbul ignore next */ <VariablesListTable
      data={infraVariables}
      originalData={initialValues?.infrastructureDefinition?.spec || initialValues}
      metadataMap={metadataMap}
    />
  ) : null
}

interface AzureInfrastructureSpecStep extends K8sAzureInfrastructure {
  name?: string
  identifier?: string
}

const AzureConnectorRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.connectorRef$/
const AzureSubscriptionRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.subscriptionId$/
const AzureResourceGroupRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.resourceGroup$/
const AzureClusterRegex = /^.+infrastructure\.infrastructureDefinition\.spec\.cluster$/
const AzureType = 'KubernetesAzure'

export class AzureInfrastructureSpec extends PipelineStep<AzureInfrastructureSpecStep> {
  lastFetched: number
  protected type = StepType.KubernetesAzure
  protected defaultValues: K8sAzureInfrastructure = {
    connectorRef: '',
    subscriptionId: '',
    cluster: '',
    resourceGroup: '',
    namespace: '',
    releaseName: ''
  }

  protected stepIcon: IconName = 'microsoft-azure'
  protected stepName = 'Specify your Azure Connector'
  protected stepPaletteVisible = false
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()

  constructor() {
    super()
    this.lastFetched = new Date().getTime()
    this.invocationMap.set(AzureConnectorRegex, this.getConnectorsListForYaml.bind(this))
    this.invocationMap.set(AzureSubscriptionRegex, this.getSubscriptionListForYaml.bind(this))
    this.invocationMap.set(AzureResourceGroupRegex, this.getClusterListForYaml.bind(this))
    this.invocationMap.set(AzureClusterRegex, this.getClusterListForYaml.bind(this))

    this._hasStepVariables = true
  }

  protected getConnectorsListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err: any) {
      /* istanbul ignore next */ logger.error(yamlErrorMessage, err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    /* istanbul ignore else */
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.connectorRef', ''))
      if (obj?.type === AzureType) {
        return getConnectorListV2Promise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            includeAllConnectorsAvailableAtScope: true
          },
          body: { types: [Connectors.AZURE], filterType: 'Connector' }
        }).then(
          response =>
            response?.data?.content?.map(connector => ({
              label: getConnectorName(connector),
              insertText: getConnectorValue(connector),
              kind: CompletionItemKind.Field
            })) || /* istanbul ignore next */ []
        )
      }
    }

    return Promise.resolve([])
  }

  protected getSubscriptionListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err: any) {
      /* istanbul ignore next */ logger.error(yamlErrorMessage, err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    /* istanbul ignore else */
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.subscriptionId', ''))
      if (
        obj?.type === AzureType &&
        obj?.spec?.connectorRef &&
        getMultiTypeFromValue(obj.spec?.connectorRef) === MultiTypeInputType.FIXED
      ) {
        return getAzureSubscriptionsPromise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            connectorRef: obj.spec?.connectorRef
          }
        }).then(response => {
          const values: CompletionItemInterface[] = []
          defaultTo(response?.data?.subscriptions, []).map(sub =>
            values.push({ label: sub.subscriptionId, insertText: sub.subscriptionId, kind: CompletionItemKind.Field })
          )
          return values
        })
      }
    }

    return Promise.resolve([])
  }

  protected getResourceGroupListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err: any) {
      /* istanbul ignore next */ logger.error(yamlErrorMessage, err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    // /* istanbul ignore else */
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.resourceGroup', ''))
      if (
        obj?.type === AzureType &&
        obj?.spec?.connectorRef &&
        getMultiTypeFromValue(obj.spec?.connectorRef) === MultiTypeInputType.FIXED &&
        obj?.spec?.subscriptionId &&
        getMultiTypeFromValue(obj.spec?.subscriptionId) === MultiTypeInputType.FIXED
      ) {
        return getAzureResourceGroupsBySubscriptionPromise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            connectorRef: obj.spec?.connectorRef
          },
          subscriptionId: obj.spec?.subscriptionId
        }).then(
          response =>
            response?.data?.resourceGroups?.map(rg => ({
              label: rg.resourceGroup,
              insertText: rg.resourceGroup,
              kind: CompletionItemKind.Field
            })) || /* istanbul ignore next */ []
        )
      }
    }

    return Promise.resolve([])
  }

  protected getClusterListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err: any) {
      /* istanbul ignore next */ logger.error(yamlErrorMessage, err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    // /* istanbul ignore else */
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.cluster', ''))
      if (
        obj?.type === AzureType &&
        obj?.spec?.connectorRef &&
        getMultiTypeFromValue(obj.spec?.connectorRef) === MultiTypeInputType.FIXED &&
        obj?.spec?.subscriptionId &&
        getMultiTypeFromValue(obj.spec?.subscriptionId) === MultiTypeInputType.FIXED &&
        obj?.spec?.resourceGroup &&
        getMultiTypeFromValue(obj.spec?.resourceGroup) === MultiTypeInputType.FIXED
      ) {
        return getAzureClustersPromise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            connectorRef: obj.spec?.connectorRef
          },
          subscriptionId: obj.spec?.subscriptionId,
          resourceGroup: obj.spec?.resourceGroup
        }).then(
          response =>
            response?.data?.clusters?.map(cl => ({
              label: cl.cluster,
              insertText: cl.cluster,
              kind: CompletionItemKind.Field
            })) || /* istanbul ignore next */ []
        )
      }
    }

    return Promise.resolve([])
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<K8sAzureInfrastructure>): FormikErrors<K8sAzureInfrastructure> {
    const errors: Partial<AzureInfrastructureTemplate> = {}
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    if (
      isEmpty(data.connectorRef) &&
      isRequired &&
      getMultiTypeFromValue(template?.connectorRef) === MultiTypeInputType.RUNTIME
    ) {
      errors.connectorRef = getString?.('common.validation.fieldIsRequired', { name: getString('connector') })
    }
    if (
      isEmpty(data.subscriptionId) &&
      isRequired &&
      getMultiTypeFromValue(template?.subscriptionId) === MultiTypeInputType.RUNTIME
    ) {
      errors.subscriptionId = getString?.('common.validation.fieldIsRequired', { name: getString(subscriptionLabel) })
    }
    if (
      isEmpty(data.resourceGroup) &&
      isRequired &&
      getMultiTypeFromValue(template?.resourceGroup) === MultiTypeInputType.RUNTIME
    ) {
      errors.resourceGroup = getString?.('common.validation.fieldIsRequired', { name: getString(resourceGroupLabel) })
    }
    if (
      isEmpty(data.cluster) &&
      isRequired &&
      getMultiTypeFromValue(template?.cluster) === MultiTypeInputType.RUNTIME
    ) {
      errors.cluster = getString?.('common.validation.fieldIsRequired', { name: getString(clusterLabel) })
    }
    /* istanbul ignore else */ if (
      getString &&
      getMultiTypeFromValue(template?.namespace) === MultiTypeInputType.RUNTIME
    ) {
      const namespace = Yup.object().shape({
        namespace: getNameSpaceSchema(getString, isRequired)
      })

      try {
        namespace.validateSync(data)
      } catch (e) {
        /* istanbul ignore else */
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    }
    /* istanbul ignore else */ if (
      getString &&
      getMultiTypeFromValue(template?.releaseName) === MultiTypeInputType.RUNTIME
    ) {
      const releaseName = Yup.object().shape({
        releaseName: getReleaseNameSchema(getString, isRequired)
      })

      try {
        releaseName.validateSync(data)
      } catch (e) {
        /* istanbul ignore else */
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    }
    return errors
  }

  renderStep(props: StepProps<K8sAzureInfrastructure>): JSX.Element {
    const { initialValues, onUpdate, stepViewType, inputSetData, customStepProps, readonly, allowableTypes } = props
    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <AzureInfrastructureSpecInputForm
          {...(customStepProps as AzureInfrastructureSpecEditableProps)}
          initialValues={initialValues}
          onUpdate={onUpdate}
          stepViewType={stepViewType}
          readonly={inputSetData?.readonly}
          template={inputSetData?.template}
          allValues={inputSetData?.allValues}
          path={inputSetData?.path || ''}
          allowableTypes={allowableTypes}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <AzureInfrastructureSpecVariablesForm
          onUpdate={onUpdate}
          stepViewType={stepViewType}
          template={inputSetData?.template}
          {...(customStepProps as AzureInfrastructureSpecEditableProps)}
          initialValues={initialValues}
        />
      )
    }

    return (
      <AzureInfrastructureSpecEditable
        onUpdate={onUpdate}
        readonly={readonly}
        stepViewType={stepViewType}
        {...(customStepProps as AzureInfrastructureSpecEditableProps)}
        initialValues={initialValues}
        allowableTypes={allowableTypes}
      />
    )
  }
}
