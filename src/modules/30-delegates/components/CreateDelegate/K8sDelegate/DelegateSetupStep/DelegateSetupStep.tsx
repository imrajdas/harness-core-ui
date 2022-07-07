/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import set from 'lodash-es/set'
import {
  Layout,
  Formik,
  Button,
  FormikForm,
  FormInput,
  Container,
  CardSelect,
  Text,
  StepProps,
  SelectOption,
  Tag
} from '@wings-software/uicore'
import * as Yup from 'yup'
import type { FormikProps, FormikHelpers } from 'formik'
import {
  DelegateSizeDetails,
  useGetDelegateSizes,
  useValidateKubernetesYaml,
  DelegateSetupDetails,
  DelegateTokenDetails
} from 'services/portal'

import { useListDelegateProfilesNg, useGetDelegateTokens, GetDelegateTokensQueryParams } from 'services/cd-ng'
import { useStrings } from 'framework/strings'

import type { DelegateProfile } from '@delegates/DelegateInterface'

import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import {
  AddDescriptionAndKVTagsWithIdentifier,
  FormikForAddDescriptionandKVTags
} from '@common/components/AddDescriptionAndTags/AddDescriptionAndTags'

import { DelegateSize, isHelmDelegateEnabled } from '@delegates/constants'
import { useCreateTokenModal } from '@delegates/components/DelegateTokens/modals/useCreateTokenModal'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { Category, DelegateActions } from '@common/constants/TrackingConstants'
import SelectDelegateType, { FormikForSelectDelegateType } from './components/SelectDelegateType'
import DelegateSizes from '../../components/DelegateSizes/DelegateSizes'
import { DelegateType } from './DelegateSetupStep.types'

import css from './DelegateSetupStep.module.scss'

interface DelegateSetupStepProps {
  onBack?: any
}

export interface K8sDelegateWizardData {
  generatedYaml?: string
  delegateYaml?: DelegateSetupDetails
  name: string
  replicas?: number
}

enum k8sPermissionType {
  CLUSTER_ADMIN = 'CLUSTER_ADMIN',
  CLUSTER_VIEWER = 'CLUSTER_VIEWER',
  NAMESPACE_ADMIN = 'NAMESPACE_ADMIN'
}

//this regex is retrieved from kubernetes
const delegateNameRegex = /^[a-z]([-a-z0-9]*[a-z])?(\.[a-z0-9]([-a-z0-9]*[a-z])?)*$/g

const formatProfileList = (data: any): Array<SelectOption> => {
  const profiles: Array<DelegateProfile> = data?.resource?.response

  const options: Array<SelectOption> = profiles
    ? profiles.map((item: DelegateProfile) => {
        return { label: item.name || '', value: item.uuid || '' }
      })
    : []
  return options
}

const formatTokenOptions = (data: any): Array<SelectOption> => {
  const profiles: Array<DelegateTokenDetails> = data?.resource

  return profiles
    ? profiles.map((item: DelegateTokenDetails) => {
        return { label: item.name || '', value: item.name || '' }
      })
    : []
}

const getDefaultDelegateConfiguration = (data: any) => {
  const configurations: DelegateProfile[] = data?.resource?.response
  return configurations ? configurations.find((item: DelegateProfile) => item.primary) : null
}

const getProfile = (data: any, configId: any) => {
  const configs: DelegateProfile[] = data?.resource?.response
  const selProfile = configs ? configs.find(item => item.uuid == configId) : null
  return selProfile?.selectors
}

const DelegateSetup: React.FC<StepProps<K8sDelegateWizardData> & DelegateSetupStepProps> = props => {
  let initialValues
  if (props?.prevStepData?.delegateYaml) {
    const tags = {}
    props?.prevStepData?.delegateYaml?.tags?.forEach(tag => set(tags, tag, ''))
    initialValues = {
      ...props?.prevStepData?.delegateYaml,
      tags
    }
  } else {
    initialValues = {
      name: '',
      identifier: '',
      description: '',
      delegateType: '',
      size: DelegateSize.LAPTOP,
      sesssionIdentifier: '',
      tokenName: '',
      k8sConfigDetails: {
        k8sPermissionType: k8sPermissionType.CLUSTER_ADMIN,
        namespace: ''
      }
    }
  }

  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const { getString } = useStrings()
  const IS_HELM_DELEGATE_ENABLED: boolean = isHelmDelegateEnabled()

  const { mutate: createKubernetesYaml } = useValidateKubernetesYaml({
    queryParams: { accountId, projectId: projectIdentifier, orgId: orgIdentifier }
  })

  const { data: delegateSizes } = useGetDelegateSizes({
    queryParams: { accountId, orgId: orgIdentifier, projectId: projectIdentifier }
  })

  const { data } = useListDelegateProfilesNg({
    queryParams: { accountId, orgId: orgIdentifier, projectId: projectIdentifier }
  })
  const defaultProfile = getDefaultDelegateConfiguration(data)
  const profileOptions: SelectOption[] = formatProfileList(data)

  const { data: tokensResponse, refetch: getTokens } = useGetDelegateTokens({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      status: 'ACTIVE'
    } as GetDelegateTokensQueryParams
  })

  const defaultToken = tokensResponse?.resource?.[0]

  const { openCreateTokenModal } = useCreateTokenModal({ onSuccess: getTokens })

  React.useEffect(() => {
    if (defaultProfile) {
      formData.delegateConfigurationId = defaultProfile?.uuid
      setInitValues({ ...formData })
    }
  }, [defaultProfile])

  React.useEffect(() => {
    if (defaultToken) {
      formData.tokenName = defaultToken?.name
      setInitValues({ ...formData })
    }
  }, [defaultToken])

  const delegateSizeMappings: DelegateSizeDetails[] | undefined = delegateSizes?.resource

  const [formData, setInitValues] = React.useState<DelegateSetupDetails>(initialValues as DelegateSetupDetails)

  const [selectedPermission, setSelectedPermission] = React.useState<k8sPermissionType>(
    k8sPermissionType[initialValues?.k8sConfigDetails?.k8sPermissionType || k8sPermissionType.CLUSTER_ADMIN]
  )
  const { trackEvent } = useTelemetry()

  const onSubmit = async (values: DelegateSetupDetails, formikActions: FormikHelpers<DelegateSetupDetails>) => {
    const createParams = { ...values }
    if (createParams.tags) {
      const tagsArray = Object.keys(values.tags || {})
      set(createParams, 'tags', tagsArray)
    }
    if (projectIdentifier) {
      set(createParams, 'projectIdentifier', projectIdentifier)
    }
    if (orgIdentifier) {
      set(createParams, 'orgIdentifier', orgIdentifier)
    }

    if (createParams.delegateType) {
      set(createParams, 'delegateType', values.delegateType)
    } else {
      set(createParams, 'delegateType', DelegateType.KUBERNETES)
    }

    trackEvent(DelegateActions.SetupDelegate, {
      category: Category.DELEGATE,
      data: createParams
    })

    try {
      const response = await createKubernetesYaml({
        ...createParams,
        k8sConfigDetails: {
          k8sPermissionType: selectedPermission,
          namespace: selectedPermission === k8sPermissionType.NAMESPACE_ADMIN ? values?.k8sConfigDetails?.namespace : ''
        }
      })
      if ((response as any)?.responseMessages.length) {
        const err = (response as any)?.responseMessages?.[0]?.message
        formikActions.setFieldError('name', err)
      } else {
        const delegateYaml = response.resource
        if (delegateSizeMappings) {
          const delegateSize: DelegateSizeDetails =
            delegateSizeMappings.find((item: DelegateSizeDetails) => item.size === values.size) ||
            delegateSizeMappings[0]
          if (delegateSize) {
            const stepPrevData = {
              delegateYaml,
              name: values.name,
              replicas: delegateSize?.replicas
            }
            props?.nextStep?.(stepPrevData)
          }
        }
      }
    } catch (e) {
      formikActions.setFieldError('name', getString('delegates.delegateNameNotUnique'))
    }
  }

  const delegateTokenOptions = useMemo(() => formatTokenOptions(tokensResponse), [tokensResponse])

  return (
    <Layout.Vertical padding="xxlarge">
      <Container padding="small">
        <Formik
          initialValues={formData}
          onSubmit={(values, formikActions) => {
            setInitValues(values)
            onSubmit(values, formikActions)
          }}
          formName="delegateSetupStepForm"
          validationSchema={Yup.object().shape({
            name: Yup.string()
              .trim()
              .required(getString('delegate.delegateNameRequired'))
              .max(63)
              .matches(delegateNameRegex, getString('delegates.delegateNameRegexIssue')),
            size: Yup.string().trim().required(getString('delegate.delegateSizeRequired')),
            k8sConfigDetails: Yup.object().shape({
              k8sPermissionType: Yup.string().trim().required(getString('delegates.permissionRequired')),
              namespace:
                selectedPermission === k8sPermissionType.NAMESPACE_ADMIN
                  ? Yup.string().trim().required(getString('delegates.delegateNamespaceRequired'))
                  : Yup.string().trim()
            }),
            tokenName: Yup.string().trim().required(),
            delegateType: IS_HELM_DELEGATE_ENABLED
              ? Yup.string().required(getString('delegates.delegateCreation.installerSelectionRequired'))
              : Yup.string().trim()
          })}
        >
          {(formikProps: FormikProps<DelegateSetupDetails>) => {
            const selectors: any = getProfile(data, formikProps.values.delegateConfigurationId)
            return (
              <FormikForm>
                <Container className={css.delegateForm}>
                  <Layout.Horizontal className={css.baseContainer}>
                    <Layout.Vertical className={css.leftPanel}>
                      <div className={css.formGroup}>
                        <AddDescriptionAndKVTagsWithIdentifier
                          formikProps={formikProps as unknown as FormikProps<FormikForAddDescriptionandKVTags>}
                          tagsProps={{
                            addOnBlur: true
                          }}
                          identifierProps={{
                            inputLabel: getString('delegate.delegateName')
                          }}
                        />
                      </div>
                      {delegateSizeMappings && (
                        <DelegateSizes
                          onSizeSelect={(size: string) => {
                            formikProps.setFieldValue('size', size)
                          }}
                        />
                      )}
                      {IS_HELM_DELEGATE_ENABLED && (
                        <SelectDelegateType
                          formikProps={formikProps as unknown as FormikProps<FormikForSelectDelegateType>}
                        />
                      )}
                      {profileOptions?.length > 0 && (
                        <div className={`${css.formGroup} ${css.profileSelect}`}>
                          <FormInput.Select
                            items={profileOptions}
                            label={getString('delegate.delegateConfigurations')}
                            name={'delegateConfigurationId'}
                          />
                        </div>
                      )}

                      {formikProps.values.delegateConfigurationId && selectors && (
                        <Container className={css.profileSelectors}>
                          <Text>{getString('delegate.tagsFromDelegateConfig')}</Text>
                          <div className={css.profileSelectorsItemsContainer}>
                            {selectors.map((item: string) => (
                              <Tag key={item}>{item}</Tag>
                            ))}
                          </div>
                        </Container>
                      )}
                      <Layout.Horizontal className={css.tokensSelectContainer} spacing="small">
                        <FormInput.Select
                          items={delegateTokenOptions}
                          label={getString('delegates.tokens.delegateTokens')}
                          name="tokenName"
                        />
                        <Button
                          minimal
                          icon="plus"
                          onClick={e => {
                            e.preventDefault()
                            openCreateTokenModal()
                            trackEvent(DelegateActions.LoadCreateTokenModal, {
                              category: Category.DELEGATE
                            })
                          }}
                          text={getString('add')}
                        />
                      </Layout.Horizontal>
                    </Layout.Vertical>
                    <Layout.Vertical className={css.rightPanel}>
                      <div className={css.permissionsTitle}>{getString('delegates.delegatePermissions.title')}</div>
                      <CardSelect
                        cardClassName={css.permissionSelect}
                        cornerSelected={true}
                        selected={selectedPermission}
                        onChange={selected => {
                          setSelectedPermission(selected)
                          formikProps.validateForm()
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                        data={[
                          k8sPermissionType.CLUSTER_ADMIN,
                          k8sPermissionType.CLUSTER_VIEWER,
                          k8sPermissionType.NAMESPACE_ADMIN
                        ]}
                        renderItem={item => {
                          let title
                          let subtitle
                          if (item === k8sPermissionType.CLUSTER_ADMIN) {
                            title = getString('delegates.delegatePermissions.clusterWriteTitle')
                            subtitle = getString('delegates.delegatePermissions.clusterWriteContent')
                          } else if (item === k8sPermissionType.CLUSTER_VIEWER) {
                            title = getString('delegates.delegatePermissions.clusterReadTitle')
                            subtitle = getString('delegates.delegatePermissions.clusterReadContent')
                          } else if (item === k8sPermissionType.NAMESPACE_ADMIN) {
                            title = getString('delegates.delegatePermissions.specificNamespaceTitle')
                            subtitle = getString('delegates.delegatePermissions.specificNamespaceContent')
                          }
                          return (
                            <Container>
                              <div className={css.permissionSelectTitle}>{title}</div>
                              <Text className={css.permissionSelectDetails}>{subtitle}</Text>
                              {item === k8sPermissionType.NAMESPACE_ADMIN && (
                                <div className={css.namespace}>
                                  <FormInput.Text
                                    label={getString('common.namespace')}
                                    name="k8sConfigDetails.namespace"
                                  />
                                </div>
                              )}
                            </Container>
                          )
                        }}
                      />
                    </Layout.Vertical>
                  </Layout.Horizontal>
                </Container>
                <Layout.Horizontal>
                  <Button
                    id="delegateSetupBackBtn"
                    className={`${css.backBtn} ${css.footerBtn}`}
                    text={getString('back')}
                    onClick={() => {
                      props.onBack()
                      trackEvent(DelegateActions.SetupDelegateBack, {
                        category: Category.DELEGATE,
                        data: formikProps.values
                      })
                    }}
                    icon="chevron-left"
                    margin={{ right: 'small' }}
                  />
                  <Button
                    type="submit"
                    className={`${css.submitBtn} ${css.footerBtn}`}
                    text={getString('continue')}
                    intent="primary"
                    rightIcon="chevron-right"
                  />
                </Layout.Horizontal>
              </FormikForm>
            )
          }}
        </Formik>
      </Container>
    </Layout.Vertical>
  )
}

export default DelegateSetup
