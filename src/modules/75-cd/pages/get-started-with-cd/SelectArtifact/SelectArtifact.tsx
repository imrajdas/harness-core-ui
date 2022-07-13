/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useRef, useState } from 'react'
import {
  Text,
  FontVariation,
  Layout,
  CardSelect,
  Icon,
  Container,
  Formik,
  FormikForm as Form,
  Accordion,
  FormError,
  useToaster,
  PageSpinner
} from '@harness/uicore'
import type { FormikContextType, FormikProps } from 'formik'
// import cx from 'classnames'
import { cloneDeep, defaultTo, get, isEmpty, omit, set } from 'lodash-es'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import produce from 'immer'
import { useParams } from 'react-router-dom'
import * as Yup from 'yup'
import { useStrings } from 'framework/strings'
import { ManifestConfigWrapper, NGServiceConfig, useUpdateServiceV2 } from 'services/cd-ng'
import { GitRepoName, ManifestDataType } from '@pipeline/components/ManifestSelection/Manifesthelper'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import type { ManifestTypes } from '@pipeline/components/ManifestSelection/ManifestInterface'
import { TestStatus } from '@common/components/TestConnectionWidget/TestConnectionWidget'
import type { SelectGitProviderRef } from './SelectGitProvider'
import { ArtifactProviders, ArtifactType, Hosting } from '../DeployProvisioningWizard/Constants'

import { SelectGitProvider } from './SelectGitProvider'
import { SelectRepository, SelectRepositoryRef } from './SelectRepository'
import { ProvideManifest, ProvideManifestRef } from './ProvideManifest'
import { useCDOnboardingContext } from '../CDOnboardingStore'
import css from '../DeployProvisioningWizard/DeployProvisioningWizard.module.scss'
import type { K8sValuesManifestDataType, ManifestTypes } from '@pipeline/components/ManifestSelection/ManifestInterface'
import { TestStatus } from '@common/components/TestConnectionWidget/TestConnectionWidget'

export interface SelectArtifactRef {
  submitForm?: FormikProps<SelectArtifactInterface>['submitForm']
  getErrors?: () => FormikProps<SelectArtifactInterface>['errors']
  resetForm?: FormikProps<SelectArtifactInterface>['resetForm']
}
export interface SelectArtifactInterface {
  artifactType?: ArtifactType
  identifier?: string
  branch?: string | undefined
  commitId?: string | undefined
  gitFetchType?: 'Branch' | 'Commit'
  paths?: string[] | any
  valuesPaths?: string[] | any
}

interface SelectArtifactProps {
  disableNextBtn: () => void
  enableNextBtn: () => void
  onSuccess?: () => void
}

export type SelectArtifactForwardRef =
  | ((instance: SelectArtifactRef | null) => void)
  | React.MutableRefObject<SelectArtifactRef | null>
  | null

const SelectArtifactRef = (props: SelectArtifactProps, forwardRef: SelectArtifactForwardRef): React.ReactElement => {
  const { getString } = useStrings()
  const { disableNextBtn, enableNextBtn } = props
  const {
    state: { service: serviceData },
    saveServiceData
  } = useCDOnboardingContext()

  const [artifactType, setArtifactType] = useState<ArtifactType | undefined>(
    ArtifactProviders.find((item: ArtifactType) => item.value === serviceData?.data?.artifactType)
  )
  const formikRef = useRef<FormikContextType<SelectArtifactInterface>>()
  const [disableBtn, setDisableBtn] = useState<boolean>(false)
  const selectGitProviderRef = React.useRef<SelectGitProviderRef | null>(null)
  const selectRepositoryRef = React.useRef<SelectRepositoryRef | null>(null)
  const provideManifestRef = React.useRef<ProvideManifestRef | null>(null)

  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

  const { mutate: updateService, loading } = useUpdateServiceV2({
    queryParams: {
      accountIdentifier: accountId
    },
    requestOptions: {
      headers: {
        'content-type': 'application/yaml'
      }
    }
  })

  useEffect(() => {
    const gitValues = selectGitProviderRef?.current?.values
    const repoValues = selectRepositoryRef?.current?.repository
    const manifestValues = provideManifestRef?.current?.values

    const updatedContextService = produce(serviceData as NGServiceConfig, draft => {
      set(draft, 'data.gitValues', gitValues)
      set(draft, 'data.manifestValues', manifestValues)
      set(draft, 'data.repoValues', repoValues)
    })
    saveServiceData({ service: updatedContextService })
    if (formikRef.current?.values) {
      if (!forwardRef) {
        return
      }
      if (typeof forwardRef === 'function') {
        return
      }

      if (formikRef.current.values) {
        forwardRef.current = {
          submitForm: formikRef?.current?.submitForm
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formikRef?.current?.values,
    formikRef?.current?.setFieldTouched,
    selectGitProviderRef?.current?.values,
    selectRepositoryRef?.current?.repository,
    provideManifestRef?.current?.values
  ])

  const openSelectRepoAccordion = (): boolean | undefined => {
    const { validate } = selectGitProviderRef.current || {}
    if (validate?.() && selectGitProviderRef.current?.testConnectionStatus === TestStatus.SUCCESS) {
      return true
    } else {
      disableNextBtn()
      return false
    }
  }

  const openProvideManifestAccordion = React.useCallback((): boolean | undefined => {
    if (selectRepositoryRef.current?.repository?.name) {
      return true
    } else {
      disableNextBtn()
      return false
    }
  }, [selectRepositoryRef?.current?.repository])

  const validateProvideManifestDetails = React.useCallback((): boolean => {
    if (isEmpty(formikRef?.current?.errors)) {
      openSelectRepoAccordion() && openProvideManifestAccordion() && enableNextBtn()
      return true
    } else {
      disableNextBtn()
      return false
    }
  }, [])

  const { showError, showSuccess } = useToaster()
  const handleSubmit = async (values: SelectArtifactInterface): Promise<SelectArtifactInterface> => {
    const gitValues = selectGitProviderRef?.current?.values
    const repoValues = selectRepositoryRef?.current?.repository
    const manifestValues = provideManifestRef?.current?.values
    try {
      // provideManifestRef?.current?.submitForm?.().then(async (manifestObj: any) => {
      const getManifestDetails = (): ManifestConfigWrapper => {
        const { branch, commitId, gitFetchType, identifier, paths, valuesPaths } = formikRef?.current?.values || {}

        const selectedManifest = ManifestDataType.K8sManifest as ManifestTypes

        const manifestObj: ManifestConfigWrapper = {
          manifest: {
            identifier: defaultTo(identifier, ''),
            type: selectedManifest, // fixed for initial designs
            spec: {
              store: {
                spec: {
                  gitFetchType: gitFetchType,
                  paths: typeof paths === 'string' ? paths : paths?.map((path: { path: string }) => path.path)
                }
              },
              valuesPaths:
                typeof valuesPaths === 'string' ? valuesPaths : valuesPaths?.map((path: { path: string }) => path.path)
            }
          }
        }
        if (manifestObj?.manifest?.spec?.store) {
          if (gitFetchType === 'Branch') {
            set(manifestObj, 'manifest.spec.store.spec.branch', branch)
          } else if (gitFetchType === 'Commit') {
            set(manifestObj, 'manifest.spec.store.spec.commitId', commitId)
          }
        }

        if (selectedManifest === ManifestDataType.K8sManifest) {
          set(manifestObj, 'manifest.spec.skipResourceVersioning', false)
        }
        if (connectionType === GitRepoName.Account) {
          set(manifestObj, 'manifest.spec.store.spec.repoName', repoValues?.name)
        }

        set(manifestObj, 'manifest.spec.store.type', gitValues?.gitProvider?.type)
        set(manifestObj, 'manifest.spec.store.spec.connectorRef', gitValues?.gitProvider?.type)
        return manifestObj
      }

      const connectionType = GitRepoName.Account
      // setting default value

      const updatedContextService = produce(serviceData as NGServiceConfig, draft => {
        set(draft, 'serviceDefinition.spec.manifests[0]', getManifestDetails())
        set(draft, 'data.artifactType', values?.artifactType)
        set(draft, 'data.gitValues', gitValues)
        set(draft, 'data.manifestValues', manifestValues)
        set(draft, 'data.repoValues', repoValues)
      })
      saveServiceData({ service: updatedContextService })

      const serviceBody = { service: { ...omit(cloneDeep(updatedContextService), 'data') } }
      const body = {
        ...omit(cloneDeep(serviceBody.service), 'serviceDefinition', 'gitOpsEnabled'),
        projectIdentifier,
        orgIdentifier,
        yaml: yamlStringify({ ...serviceBody })
      }

      const response = await updateService(body)
      if (response.status === 'SUCCESS') {
        saveServiceData({ serviceResponse: response })
      } else {
        throw response
      }
      showSuccess('Service updated successfully')
      props?.onSuccess?.()
      return Promise.resolve(values)
      // })
    } catch (e: any) {
      showError(e?.data?.message || e?.message || getString('commonError'))
      return Promise.resolve({} as SelectArtifactInterface)
    }
  }

  const isActiveAccordion: boolean = artifactType ? true : false

  const getInitialValues = React.useCallback((): SelectArtifactInterface => {
    const initialValues = get(serviceData, 'serviceDefinition.spec.manifests[0].manifest', {})
    const specValues = get(initialValues, 'spec.store.spec', null)

    if (specValues) {
      return {
        ...specValues,
        identifier: initialValues.identifier,
        skipResourceVersioning: initialValues?.spec?.skipResourceVersioning,
        paths:
          typeof specValues.paths === 'string'
            ? specValues.paths
            : specValues.paths?.map((path: string) => ({ path, uuid: uuid(path, nameSpace()) })),
        valuesPaths:
          typeof initialValues?.spec?.valuesPaths === 'string'
            ? initialValues?.spec?.valuesPaths
            : initialValues?.spec?.valuesPaths?.map((path: string) => ({ path, uuid: uuid(path, nameSpace()) })),
        artifactType: get(serviceData, 'data.artifactType') || undefined
      }
    }
    return {
      identifier: '',
      gitFetchType: 'Branch',
      branch: undefined,
      commitId: undefined,
      paths: [{ path: '', uuid: uuid('', nameSpace()) }],
      valuesPaths: [],
      artifactType: get(serviceData, 'data.artifactType') || undefined
      // skipResourceVersioning: false,
    }
  }, [])

  const validationSchema = Yup.object().shape({
    artifactType: Yup.string().required(getString('validation.nameRequired')),
    identifier: Yup.string().required('Required'),

    branch: Yup.string().when('gitFetchType', {
      is: 'Branch',
      then: Yup.string().trim().required(getString('validation.branchName'))
    }),
    commitId: Yup.string().when('gitFetchType', {
      is: 'Commit',
      then: Yup.string().trim().required(getString('validation.commitId'))
    }),
    paths: Yup.lazy((_value): Yup.Schema<unknown> => {
      return Yup.string().required(getString('pipeline.manifestType.pathRequired'))
    })
    // valuesPaths: Yup.lazy((_value): Yup.Schema<unknown> => {
    //   return Yup.string().required(getString('pipeline.manifestType.pathRequired'))
    // })
  })
  if (loading) {
    return <PageSpinner />
  }

  return (
    <Layout.Vertical width="80%">
      <Text font={{ variation: FontVariation.H4 }}>{getString('cd.getStartedWithCD.artifactLocation')}</Text>
      <Formik<SelectArtifactInterface>
        formName="cdRepo"
        initialValues={getInitialValues()}
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
      >
        {formikProps => {
          formikRef.current = formikProps
          return (
            <Form>
              <Container padding={{ top: 'xxlarge', bottom: 'xxxlarge' }}>
                {props.disableNextBtn()}
                <CardSelect
                  cornerSelected={true}
                  data={ArtifactProviders}
                  cardClassName={css.artifactTypeCard}
                  renderItem={(item: ArtifactType) => (
                    <>
                      <Layout.Vertical height="100%" flex={{ justifyContent: 'space-between' }}>
                        <Layout.Vertical spacing="medium">
                          <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} spacing="small">
                            <Icon name={item.icon} size={20} />
                            <Text font={{ variation: FontVariation.H5 }}>{getString(item.label)}</Text>
                          </Layout.Horizontal>
                          <Text font={{ variation: FontVariation.SMALL }}>{getString(item.details)}</Text>
                        </Layout.Vertical>
                      </Layout.Vertical>
                    </>
                  )}
                  selected={artifactType}
                  onChange={(item: ArtifactType) => {
                    formikProps.setFieldValue('artifactType', item.value)
                    setArtifactType(item)
                  }}
                />
                {formikProps.touched.artifactType && !formikProps.values.artifactType ? (
                  <FormError
                    name={'artifactType'}
                    errorMessage={getString('cd.getStarted.plsChoose', {
                      field: `your ${getString('pipeline.artifactsSelection.artifactType')}`
                    })}
                  />
                ) : null}
              </Container>

              <div className={css.repoborderBottom} />

              {isActiveAccordion ? (
                <Accordion
                  className={css.accordion}
                  activeId={
                    isActiveAccordion
                      ? 'codeRepo'
                      : openSelectRepoAccordion()
                      ? 'selectYourRepo'
                      : openProvideManifestAccordion()
                      ? 'provideManifest'
                      : ''
                  }
                >
                  <Accordion.Panel
                    id="codeRepo"
                    summary={
                      <Layout.Horizontal flex={{ alignItems: 'center' }}>
                        <Text font={{ variation: FontVariation.H5 }}>{getString('cd.getStartedWithCD.codeRepos')}</Text>
                        {openSelectRepoAccordion() ? (
                          <Icon name="success-tick" size={20} className={css.accordionStatus} />
                        ) : selectGitProviderRef?.current?.showValidationErrors ? (
                          <Icon name="danger-icon" size={20} className={css.accordionStatus} />
                        ) : null}
                      </Layout.Horizontal>
                    }
                    details={
                      <SelectGitProvider
                        ref={selectGitProviderRef}
                        gitValues={get(serviceData, 'data.gitValues', {})}
                        disableNextBtn={() => setDisableBtn(true)}
                        enableNextBtn={() => setDisableBtn(false)}
                        selectedHosting={Hosting.SaaS}
                      ></SelectGitProvider>
                    }
                  />
                  <Accordion.Panel
                    id="selectYourRepo"
                    summary={
                      <Layout.Horizontal flex={{ alignItems: 'center' }}>
                        <Text font={{ variation: FontVariation.H5 }}>{getString('cd.selectYourRepo')}</Text>
                        {openProvideManifestAccordion() ? (
                          <Icon name="success-tick" size={20} className={css.accordionStatus} />
                        ) : !selectRepositoryRef?.current?.repository?.name ? (
                          <Icon name="danger-icon" size={20} className={css.accordionStatus} />
                        ) : null}
                      </Layout.Horizontal>
                    }
                    details={
                      <SelectRepository
                        ref={selectRepositoryRef}
                        selectedRepository={get(serviceData, 'data.repoValues')}
                        validatedConnectorRef={
                          get(serviceData, 'data.gitValues.gitProvider.type') ||
                          selectGitProviderRef.current?.values?.gitProvider?.type
                        }
                        disableNextBtn={() => setDisableBtn(true)}
                        enableNextBtn={() => setDisableBtn(false)}
                      ></SelectRepository>
                    }
                  />
                  <Accordion.Panel
                    id="provideManifest"
                    summary={
                      <Layout.Horizontal flex={{ alignItems: 'center' }}>
                        <Text font={{ variation: FontVariation.H5 }}>
                          {getString('cd.getStartedWithCD.provideManifest')}
                        </Text>
                        {validateProvideManifestDetails() ? (
                          <Icon name="success-tick" size={20} className={css.accordionStatus} />
                        ) : (
                          <Icon name="danger-icon" size={20} className={css.accordionStatus} />
                        )}
                      </Layout.Horizontal>
                    }
                    details={
                      <ProvideManifest
                        ref={provideManifestRef}
                        // onSuccess={getManifestDetails}
                        formikProps={formikProps}
                        initialValues={get(serviceData, 'serviceDefinition.spec.manifests[0].manifest', {})}
                        disableNextBtn={() => setDisableBtn(true)}
                        enableNextBtn={() => setDisableBtn(disableBtn)}
                      />
                    }
                  />
                </Accordion>
              ) : null}
            </Form>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export const SelectArtifact = React.forwardRef(SelectArtifactRef)
