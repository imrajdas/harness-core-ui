/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { pick } from 'lodash-es'
import { PageError, PageSpinner } from '@wings-software/uicore'
import { HomePageTemplate } from '@projects-orgs/pages/HomePageTemplate/HomePageTemplate'
import { useStrings } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useLicenseStore, handleUpdateLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { TrialInProgressTemplate } from '@rbac/components/TrialHomePageTemplate/TrialInProgressTemplate'
import { ModuleName } from 'framework/types/ModuleName'
import type { AccountPathProps, Module } from '@common/interfaces/RouteInterfaces'
import { useProjectModal } from '@projects-orgs/modals/ProjectModal/useProjectModal'
import type { Project, GetLicensesAndSummaryQueryParams } from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import { useQueryParams } from '@common/hooks'
import { useGetLicensesAndSummary, useGetProjectList } from 'services/cd-ng'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { ModuleLicenseType } from '@common/constants/SubscriptionTypes'
import { getTrialModalProps, openModal } from '@pipeline/components/TrialModalTemplate/trialModalUtils'
import type { UseTrialModalProps } from '@pipeline/components/TrialModalTemplate/trialModalUtils'
import type { StringsMap } from 'stringTypes'
import { useGetPipelines } from '@pipeline/hooks/useGetPipelines'

interface HomePageModuleProps {
  moduleName: ModuleName
  bgImageURL: string
  useTrialModal: (props: UseTrialModalProps) => {
    openTrialModal: () => void
    closeTrialModal: () => void
  }
}

interface StringByModuleProps {
  title: string
  subTitle: string
  documentText: string
  documentURL: string
}

function getStringByModuleProps(module: ModuleName): StringByModuleProps {
  let title = '',
    subTitle = '',
    documentText = '',
    documentURL = ''
  switch (module) {
    case ModuleName.CI: {
      title = 'ci.continuous'
      subTitle = 'ci.dashboard.subHeading'
      documentText = 'ci.learnMore'
      documentURL = 'https://docs.harness.io/category/zgffarnh1m-ci-category'
      break
    }
    case ModuleName.CD: {
      title = 'cd.continuous'
      subTitle = 'cd.dashboard.subHeading'
      documentText = 'cd.learnMore'
      documentURL = 'https://docs.harness.io/article/knunou9j30-kubernetes-cd-quickstart'
      break
    }
  }

  return {
    title,
    subTitle,
    documentText,
    documentURL
  }
}

function HomePageByModule({ moduleName, bgImageURL, useTrialModal }: HomePageModuleProps): React.ReactElement {
  const { getString } = useStrings()
  const { NG_LICENSES_ENABLED } = useFeatureFlags()

  const { accountId } = useParams<AccountPathProps>()

  const { currentUserInfo, selectedProject } = useAppStore()
  const { licenseInformation, updateLicenseStore } = useLicenseStore()
  const module = moduleName.toLowerCase() as Module

  const { accounts } = currentUserInfo
  const createdFromNG = accounts?.find(account => account.uuid === accountId)?.createdFromNG
  const {
    data: licenseData,
    error: licenseErr,
    refetch: refetchLicense,
    loading: gettingLicense
  } = useGetLicensesAndSummary({
    queryParams: { moduleType: moduleName as GetLicensesAndSummaryQueryParams['moduleType'] },
    accountIdentifier: accountId
  })
  const { experience, modal } = useQueryParams<{ experience?: ModuleLicenseType; modal?: ModuleLicenseType }>()

  const expiryTime = licenseData?.data?.maxExpiryTime
  const updatedLicenseInfo = licenseData?.data && {
    ...licenseInformation?.[moduleName],
    ...pick(licenseData?.data, ['licenseType', 'edition']),
    expiryTime
  }

  const {
    data: pipelineData,
    loading: gettingPipelines,
    refetch: refetchPipeline,
    error: pipelineError
  } = useGetPipelines({
    accountIdentifier: accountId,
    projectIdentifier: selectedProject?.identifier || '',
    orgIdentifier: selectedProject?.orgIdentifier || '',
    module,
    lazy: true,
    size: 1
  })

  useEffect(() => {
    if (selectedProject) {
      refetchPipeline()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject])

  // get project lists via accountId
  const {
    data: projectListData,
    loading: gettingProjects,
    error: projectsErr,
    refetch: refetchProject
  } = useGetProjectList({
    queryParams: {
      accountIdentifier: accountId,
      pageSize: 1
    }
  })
  const projectsExist = !!projectListData?.data?.content?.length
  const pipelinesExist = !!pipelineData?.data?.content?.length

  useEffect(() => {
    handleUpdateLicenseStore({ ...licenseInformation }, updateLicenseStore, module, updatedLicenseInfo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licenseData])

  useEffect(() => {
    refetchLicense()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experience])

  const pushToPipelineStudio = (pipelineId: string, projectData?: Project, search?: string): void => {
    if (projectData) {
      const pathname = routes.toPipelineStudio({
        orgIdentifier: projectData.orgIdentifier || '',
        projectIdentifier: projectData.identifier,
        pipelineIdentifier: pipelineId,
        accountId,
        module
      })
      history.push({
        pathname,
        search
      })
    }
  }

  const { openProjectModal, closeProjectModal } = useProjectModal({
    onWizardComplete: (projectData?: Project) => {
      closeProjectModal()
      pushToPipelineStudio('-1', projectData, `?modal=${experience}`)
    }
  })

  const modalProps = getTrialModalProps({ selectedProject, openProjectModal, pushToPipelineStudio })
  const { openTrialModal } = useTrialModal({ ...modalProps })

  const trialInProgressProps = {
    description: getString('common.trialInProgressDescription'),
    startBtn: {
      description: getString('createProject'),
      onClick: openProjectModal
    }
  }

  const history = useHistory()

  useEffect(
    () => {
      openModal({
        modal,
        gettingProjects,
        gettingPipelines,
        selectedProject,
        pipelinesExist,
        projectsExist,
        openProjectModal,
        openTrialModal,
        pushToPipelineStudio
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modal, selectedProject, gettingProjects, gettingPipelines, pipelinesExist, projectsExist]
  )

  if (gettingLicense || gettingProjects || gettingPipelines) {
    return <PageSpinner />
  }

  if (licenseErr) {
    return <PageError message={licenseErr.message} onClick={() => refetchLicense()} />
  }

  if (projectsErr) {
    return <PageError message={projectsErr.message} onClick={() => refetchProject()} />
  }

  if (pipelineError) {
    return <PageError message={pipelineError.message} onClick={() => refetchPipeline()} />
  }

  const showTrialPages = createdFromNG || NG_LICENSES_ENABLED

  const { title, subTitle, documentText, documentURL } = getStringByModuleProps(moduleName)

  if (showTrialPages && licenseData?.status === 'SUCCESS' && !licenseData.data) {
    history.push(
      routes.toModuleTrialHome({
        accountId,
        module
      })
    )
  }

  if (showTrialPages && experience === ModuleLicenseType.TRIAL) {
    return (
      <TrialInProgressTemplate
        title={getString(title as keyof StringsMap)}
        bgImageUrl={bgImageURL}
        trialInProgressProps={trialInProgressProps}
      />
    )
  }

  const projectCreateSuccessHandler = (project?: Project): void => {
    if (experience) {
      pushToPipelineStudio('-1', project, `?modal=${experience}`)
      return
    }
    if (project) {
      history.push(
        routes.toProjectOverview({
          projectIdentifier: project.identifier,
          orgIdentifier: project.orgIdentifier || '',
          accountId,
          module
        })
      )
    }
  }

  // by default will return Home Page
  return (
    <HomePageTemplate
      title={getString(title as keyof StringsMap)}
      bgImageUrl={bgImageURL}
      projectCreateSuccessHandler={projectCreateSuccessHandler}
      subTitle={getString(subTitle as keyof StringsMap)}
      documentText={getString(documentText as keyof StringsMap)}
      documentURL={documentURL}
    />
  )
}

export default HomePageByModule
