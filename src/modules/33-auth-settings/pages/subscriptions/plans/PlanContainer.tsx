/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { pick } from 'lodash-es'
import { Layout, PageSpinner, PageError } from '@wings-software/uicore'
import { useToaster } from '@common/components'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { Category, TrialActions, PlanActions } from '@common/constants/TrackingConstants'
import { useLicenseStore, handleUpdateLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { useStrings } from 'framework/strings'
import {
  useStartTrialLicense,
  StartTrialDTO,
  useGetLicensesAndSummary,
  useStartFreeLicense,
  ResponseModuleLicenseDTO,
  useGetEditionActions,
  useExtendTrialLicense
} from 'services/cd-ng'
import { useContactSalesMktoModal } from '@common/modals/ContactSales/useContactSalesMktoModal'
import routes from '@common/RouteDefinitions'
import type { Module } from '@common/interfaces/RouteInterfaces'
import { setUpCI, StartFreeLicenseAndSetupProjectCallback } from '@common/utils/GetStartedWithCIUtil'
import { useHostedBuilds } from '@common/hooks/useHostedBuild'
import { ModuleName, Module as ModuleType } from 'framework/types/ModuleName'
import { ModuleLicenseType, Editions, SubscriptionTabNames } from '@common/constants/SubscriptionTypes'
import type { FetchPlansQuery } from 'services/common/services'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useSubscribeModal } from '@auth-settings/modals/Subscription/useSubscriptionModal'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import type { TimeType } from '@common/constants/SubscriptionTypes'
import { getBtnProps } from './planUtils'
import type { PlanData, PlanProp } from './planUtils'
import Plan from './Plan'

type plansType = 'ciSaasPlans' | 'ffPlans' | 'cdPlans' | 'ccPlans'
interface PlanProps {
  plans: NonNullable<FetchPlansQuery['pricing']>[plansType]
  moduleName: ModuleName
  timeType: TimeType
}

export interface BtnProps {
  buttonText?: string
  btnLoading: boolean
  onClick?: () => void
  order: number
  isContactSales?: boolean
  isContactSupport?: boolean
  planDisabledStr?: string
}
export interface PlanCalculatedProps {
  btnProps: BtnProps[]
  currentPlanProps: {
    isCurrentPlan?: boolean
    isTrial?: boolean
    isPaid?: boolean
  }
}

const PlanContainer: React.FC<PlanProps> = ({ plans, timeType, moduleName }) => {
  const { getRBACErrorMessage } = useRBACError()
  const { showError } = useToaster()
  const { trackEvent } = useTelemetry()
  const { getString } = useStrings()
  const history = useHistory()
  const moduleType = moduleName as StartTrialDTO['moduleType']
  const module = moduleName.toLowerCase() as Module
  const { enabledHostedBuildsForFreeUsers } = useHostedBuilds()
  const [settingUpCI, setSettingUpCI] = useState<boolean>(false)
  const { accountId } = useParams<{
    accountId: string
  }>()
  const { mutate: startTrial, loading: startingTrial } = useStartTrialLicense({
    queryParams: {
      accountIdentifier: accountId
    }
  })
  const { mutate: startFreePlan, loading: startingFreePlan } = useStartFreeLicense({
    queryParams: {
      accountIdentifier: accountId,
      moduleType: moduleType
    },
    requestOptions: {
      headers: {
        'content-type': 'application/json'
      }
    }
  })
  const { licenseInformation, updateLicenseStore } = useLicenseStore()

  const {
    data: actions,
    loading: gettingActions,
    error: actionErrs,
    refetch: refetchActions
  } = useGetEditionActions({
    queryParams: {
      accountIdentifier: accountId,
      moduleType: moduleType
    }
  })

  const { openMarketoContactSales, loading: loadingContactSales } = useContactSalesMktoModal({})

  const { mutate: extendTrial, loading: extendingTrial } = useExtendTrialLicense({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  function handleManageSubscription(): void {
    history.push(routes.toSubscriptions({ accountId, moduleCard: module, tab: 'OVERVIEW' }))
  }

  function startPlanByEdition(edition: Editions): Promise<ResponseModuleLicenseDTO> {
    switch (edition) {
      case Editions.FREE: {
        trackEvent(PlanActions.StartFreeClick, { category: Category.SIGNUP, module, plan: edition })
        return startFreePlan()
      }
      case Editions.ENTERPRISE:
      case Editions.TEAM:
      default: {
        trackEvent(TrialActions.StartTrialClick, { category: Category.SIGNUP, module, plan: edition })
        return startTrial({ moduleType, edition })
      }
    }
  }

  async function handleStartPlan(edition: Editions): Promise<void> {
    try {
      const planData = await startPlanByEdition(edition)

      handleUpdateLicenseStore({ ...licenseInformation }, updateLicenseStore, module, planData?.data)

      let search
      if (planData?.data?.licenseType === ModuleLicenseType.TRIAL) {
        search = `?experience=${ModuleLicenseType.TRIAL}&&modal=${ModuleLicenseType.TRIAL}`
      }

      if (edition === Editions.FREE) {
        search = `?experience=${ModuleLicenseType.FREE}&&modal=${ModuleLicenseType.FREE}`
      }

      if (moduleName === ModuleName.CE) {
        history.push({
          pathname: routes.toModuleTrialHome({ accountId, module }),
          search
        })
        return
      }

      history.push({
        pathname: routes.toModuleHome({ accountId, module }),
        search
      })
    } catch (ex) {
      showError(ex.data?.message)
    }
  }

  const {
    data,
    error,
    refetch,
    loading: gettingLicense
  } = useGetLicensesAndSummary({
    queryParams: { moduleType },
    accountIdentifier: accountId
  })

  const licenseData = data?.data

  const updatedLicenseInfo = licenseData && {
    ...licenseInformation?.[moduleType],
    ...pick(licenseData, ['licenseType', 'edition']),
    expiryTime: licenseData.maxExpiryTime
  }

  const { openSubscribeModal } = useSubscribeModal({
    // refresh to fetch new license after subscribe
    onClose: () => {
      history.push(routes.toSubscriptions({ accountId, moduleCard: module, tab: SubscriptionTabNames.PLANS }))
    }
  })
  const isSelfService = licenseInformation?.[moduleType]?.selfService === true
  const isSelfServiceEnabled = useFeatureFlag(FeatureFlag.SELF_SERVICE_ENABLED) && isSelfService

  useEffect(() => {
    handleUpdateLicenseStore({ ...licenseInformation }, updateLicenseStore, module, updatedLicenseInfo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licenseData])

  function getPlanCalculatedProps(plan: PlanProp): PlanCalculatedProps {
    let isCurrentPlan, isTrial, isPaid
    const planEdition = plan?.title && (plan?.title?.toUpperCase() as Editions)
    if (licenseData?.edition === planEdition) {
      isCurrentPlan = true
    }

    switch (licenseData?.licenseType) {
      case ModuleLicenseType.PAID:
        isPaid = true
        break
      case ModuleLicenseType.TRIAL:
        isTrial = true
        break
    }
    const btnLoading = extendingTrial || startingTrial || startingFreePlan || settingUpCI

    const handleExtendTrial = async (edition: Editions): Promise<void> => {
      try {
        const extendTrialData = await extendTrial({
          moduleType,
          edition
        })
        handleUpdateLicenseStore({ ...licenseInformation }, updateLicenseStore, module, extendTrialData?.data)
      } catch (err) {
        showError(getRBACErrorMessage(err))
      }
    }

    const btnProps = getBtnProps({
      plan,
      getString,
      handleStartPlan: (edition: Editions) => {
        if (moduleName === ModuleName.CI && enabledHostedBuildsForFreeUsers) {
          setSettingUpCI(true)
          setUpCI({
            accountId,
            edition,
            onSetUpSuccessCallback: ({ orgId, projectId }: StartFreeLicenseAndSetupProjectCallback) => {
              setSettingUpCI(false)

              trackEvent(edition === Editions.FREE ? PlanActions.StartFreeClick : TrialActions.StartTrialClick, {
                category: Category.SIGNUP,
                module,
                plan: edition
              })

              history.push(
                routes.toGetStartedWithCI({
                  accountId,
                  module: 'ci',
                  orgIdentifier: orgId,
                  projectIdentifier: projectId
                })
              )
            },
            licenseInformation,
            updateLicenseStore
          })
        } else {
          handleStartPlan(edition)
        }
      },
      handleContactSales: openMarketoContactSales,
      handleExtendTrial,
      handleManageSubscription,
      handleUpgrade: () =>
        openSubscribeModal({
          _module: moduleName.toLowerCase() as ModuleType,
          _time: timeType,
          _plan: planEdition || Editions.FREE
        }),
      btnLoading,
      actions: actions?.data,
      isSelfServiceEnabled
    })

    return {
      currentPlanProps: {
        isCurrentPlan,
        isTrial,
        isPaid
      },
      btnProps
    }
  }

  const calculatedPlans: PlanData[] = []

  plans?.map((plan: PlanProp) => {
    const calculatedProps = getPlanCalculatedProps(plan)
    const { btnProps, currentPlanProps } = calculatedProps
    calculatedPlans.push({ planProps: plan, btnProps, currentPlanProps })
  })

  if (gettingLicense || gettingActions || loadingContactSales) {
    return <PageSpinner />
  }

  if (error) {
    return <PageError message={(error.data as Error)?.message} onClick={() => refetch()} />
  }

  if (actionErrs) {
    return <PageError message={(actionErrs.data as Error)?.message} onClick={() => refetchActions()} />
  }

  return (
    <Layout.Horizontal spacing="large">
      {calculatedPlans?.map((plan: PlanData) => (
        <Plan key={plan.planProps?.title} plan={plan} timeType={timeType} module={moduleName} />
      ))}
    </Layout.Horizontal>
  )
}

export default PlanContainer
