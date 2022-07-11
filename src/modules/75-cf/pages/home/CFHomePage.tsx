/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { pick } from 'lodash-es'
import { PageError } from '@wings-software/uicore'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { useStrings } from 'framework/strings'
import { HomePageTemplate } from '@projects-orgs/pages/HomePageTemplate/HomePageTemplate'
import { TrialInProgressTemplate } from '@rbac/components/TrialHomePageTemplate/TrialInProgressTemplate'
import { ModuleName } from 'framework/types/ModuleName'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useLicenseStore, handleUpdateLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { useProjectModal } from '@projects-orgs/modals/ProjectModal/useProjectModal'
import type { Project } from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import type { AccountPathProps, Module } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import { useGetLicensesAndSummary, useGetProjectList } from 'services/cd-ng'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { ModuleLicenseType } from '@common/constants/SubscriptionTypes'
import { useFFTrialModal } from '@cf/modals/FFTrial/useFFTrialModal'
import { TrialType } from '@pipeline/components/TrialModalTemplate/trialModalUtils'
import { useGetProjectCreateSuccessHandler, useGetSignUpHandler } from './cfHomeUtils'
import bgImageURL from './ff.svg'

import css from './CFHomePage.module.scss'

const CFHomePage: React.FC = () => {
  const { getString } = useStrings()
  const { accountId: accountIdentifier } = useParams<AccountPathProps>()
  const { currentUserInfo, selectedProject } = useAppStore()
  const { NG_LICENSES_ENABLED } = useFeatureFlags()
  const { licenseInformation, updateLicenseStore } = useLicenseStore()
  const moduleType = ModuleName.CF
  const module = moduleType.toLowerCase() as Module

  const { accounts } = currentUserInfo
  const createdFromNG = accounts?.find(account => account.uuid === accountIdentifier)?.createdFromNG

  const {
    data: licenseData,
    error: licenseError,
    refetch: refetchLicense,
    loading: gettingLicense
  } = useGetLicensesAndSummary({
    queryParams: { moduleType },
    accountIdentifier
  })

  // get project lists via accountId
  const {
    data: projectListData,
    loading: gettingProjects,
    error: projectsErr,
    refetch: refetchProject
  } = useGetProjectList({
    queryParams: {
      accountIdentifier,
      pageSize: 1
    }
  })
  const projectsExist = !!projectListData?.data?.content?.length

  const { openProjectModal, closeProjectModal } = useProjectModal({
    onWizardComplete: (projectData?: Project) => {
      closeProjectModal()
      if (projectData) {
        history.push({
          pathname: routes.toCFOnboarding({
            orgIdentifier: projectData?.orgIdentifier || '',
            projectIdentifier: projectData.identifier,
            accountId: accountIdentifier
          })
        })
      }
    }
  })

  const trialInProgressProps = {
    description: getString('common.trialInProgressDescription'),
    startBtn: {
      description: getString('createProject'),
      onClick: openProjectModal
    }
  }

  const { experience, modal } = useQueryParams<{ experience?: ModuleLicenseType; modal?: ModuleLicenseType }>()

  const history = useHistory()

  const expiryTime = licenseData?.data?.maxExpiryTime
  const updatedLicenseInfo = licenseData?.data && {
    ...licenseInformation?.[moduleType],
    ...pick(licenseData?.data, ['licenseType', 'edition']),
    expiryTime
  }

  const { openTrialModal } = useFFTrialModal({
    actionProps: {
      onCreateProject: openProjectModal
    },
    trialType: TrialType.CREATE_OR_SELECT_PROJECT
  })

  const signUpHandler = useGetSignUpHandler({ gettingProjects, projectsExist, openProjectModal, openTrialModal })

  useEffect(() => {
    signUpHandler()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal, gettingProjects, selectedProject, projectsExist])

  useEffect(() => {
    handleUpdateLicenseStore({ ...licenseInformation }, updateLicenseStore, module, updatedLicenseInfo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licenseData])

  useEffect(() => {
    refetchLicense()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experience])

  const projectCreateSuccessHandler = useGetProjectCreateSuccessHandler()

  if (gettingLicense || gettingProjects) {
    return <ContainerSpinner className={css.homepageSpinner} />
  }

  if (licenseError) {
    return <PageError message={licenseError.message} onClick={() => refetchLicense()} />
  }

  if (projectsErr) {
    return <PageError message={projectsErr.message} onClick={() => refetchProject()} />
  }

  const showTrialPages = createdFromNG || NG_LICENSES_ENABLED

  if (showTrialPages && licenseData?.status === 'SUCCESS' && !licenseData.data) {
    history.push(
      routes.toModuleTrialHome({
        accountId: accountIdentifier,
        module
      })
    )
  }

  if (showTrialPages && experience === ModuleLicenseType.TRIAL) {
    return (
      <TrialInProgressTemplate
        title={getString('cf.continuous')}
        bgImageUrl={bgImageURL}
        trialInProgressProps={trialInProgressProps}
      />
    )
  }

  if (selectedProject && !experience) {
    history.push(
      routes.toCFFeatureFlags({
        projectIdentifier: selectedProject.identifier,
        orgIdentifier: selectedProject.orgIdentifier || '',
        accountId: accountIdentifier
      })
    )
  }

  // by default will return Home Page
  return (
    <HomePageTemplate
      title={getString('cf.continuous')}
      bgImageUrl={bgImageURL}
      projectCreateSuccessHandler={projectCreateSuccessHandler}
      subTitle={getString('cf.homepage.slogan')}
      documentText={getString('cf.homepage.learnMore')}
      documentURL="https://docs.harness.io/article/0a2u2ppp8s-getting-started-with-continuous-features"
    />
  )
}

export default CFHomePage
