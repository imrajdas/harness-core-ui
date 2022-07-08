/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { pick } from 'lodash-es'
import { useStrings } from 'framework/strings'
import routes from '@common/RouteDefinitions'
import { StartTrialTemplate } from '@rbac/components/TrialHomePageTemplate/StartTrialTemplate'
import { useStartTrialLicense, useStartFreeLicense, ResponseModuleLicenseDTO } from 'services/cd-ng'
import useCreateConnector from '@ce/components/CreateConnector/CreateConnector'
import useCETrialModal from '@ce/modals/CETrialModal/useCETrialModal'
import { useToaster } from '@common/components'
import { handleUpdateLicenseStore, useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import type { AccountPathProps, Module } from '@common/interfaces/RouteInterfaces'
import { Editions, ModuleLicenseType } from '@common/constants/SubscriptionTypes'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { useQueryParams } from '@common/hooks'
import bgImage from './images/cehomebg.svg'

const CETrialHomePage: React.FC = () => {
  const { getString } = useStrings()

  const { accountId } = useParams<AccountPathProps>()
  const history = useHistory()
  const { licenseInformation, updateLicenseStore } = useLicenseStore()
  const { experience } = useQueryParams<{ experience?: ModuleLicenseType }>()
  const isFreeEnabled = useFeatureFlag(FeatureFlag.FREE_PLAN_ENABLED)
  const module = 'ce'
  const moduleType = 'CE'

  const { openModal } = useCreateConnector({
    onSuccess: () => {
      history.push(routes.toCEOverview({ accountId }))
    },
    onClose: () => {
      history.push(routes.toCEOverview({ accountId }))
    }
  })

  const { mutate: startTrial } = useStartTrialLicense({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { mutate: startFreePlan } = useStartFreeLicense({
    queryParams: {
      accountIdentifier: accountId,
      moduleType
    },
    requestOptions: {
      headers: {
        'content-type': 'application/json'
      }
    }
  })

  function getExperience(): ModuleLicenseType {
    if (experience) {
      return experience
    }
    return isFreeEnabled ? ModuleLicenseType.FREE : ModuleLicenseType.TRIAL
  }

  const { showModal, hideModal } = useCETrialModal({
    onContinue: () => {
      hideModal()
      openModal()
    },
    experience: getExperience()
  })

  const { showError } = useToaster()

  function startPlan(): Promise<ResponseModuleLicenseDTO> {
    return isFreeEnabled ? startFreePlan() : startTrial({ moduleType, edition: Editions.ENTERPRISE })
  }

  const handleStartTrial = async (): Promise<void> => {
    try {
      const data = await startPlan()

      const expiryTime = data?.data?.expiryTime

      const updatedLicenseInfo = data?.data && {
        ...licenseInformation?.[moduleType],
        ...pick(data?.data, ['licenseType', 'edition']),
        expiryTime
      }

      handleUpdateLicenseStore({ ...licenseInformation }, updateLicenseStore, module as Module, updatedLicenseInfo)
      showModal()
    } catch (error) {
      showError(error.data?.message)
    }
  }

  const startBtnDescription = isFreeEnabled
    ? getString('common.startFreePlan', { module: 'CCM' })
    : getString('ce.ceTrialHomePage.startTrial.startBtn.description')

  const startTrialProps = {
    description: getString('ce.homepage.slogan'),
    learnMore: {
      description: getString('ce.learnMore'),
      url: 'https://docs.harness.io/article/dvspc6ub0v-create-cost-perspectives'
    },
    startBtn: {
      description: startBtnDescription,
      onClick: handleStartTrial
    }
  }

  useEffect(() => {
    experience && showModal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experience])

  return (
    <StartTrialTemplate
      title={getString('common.purpose.ce.continuous')}
      bgImageUrl={bgImage}
      startTrialProps={startTrialProps}
      module={module}
    />
  )
}

export default CETrialHomePage
