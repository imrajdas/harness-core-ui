/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Layout, PageError, PageSpinner } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import { ModuleName } from 'framework/types/ModuleName'
import { FetchPlansQuery, useFetchPlansQuery } from 'services/common/services'
import { useGetCommunity } from '@common/utils/utils'
import { Editions } from '@common/constants/SubscriptionTypes'
import Plans from './Plans'
import CommunityPlans from './CommunityPlans'

interface SubscriptionPlansProps {
  module: ModuleName
}

interface PlanTabsProps {
  module: ModuleName
  plans?: FetchPlansQuery['pricing']
}

const PlanTabs: React.FC<PlanTabsProps> = ({ module, plans }) => {
  const getPlanByModule = (): React.ReactElement => {
    switch (module) {
      case ModuleName.CI:
        return (
          <Plans
            module={module}
            plans={plans?.ciSaasPlans}
            featureCaption={plans?.ciSaasFeatureCaption}
            featureGroup={plans?.ciSaasFeatureGroup}
          />
        )
      case ModuleName.CF:
        return (
          <Plans
            module={module}
            plans={plans?.ffPlans}
            featureCaption={plans?.ffFeatureCaption}
            featureGroup={plans?.ffFeatureGroup}
          />
        )
      case ModuleName.CD:
        return (
          <Plans
            module={module}
            plans={plans?.cdPlans?.filter(plan => plan?.title?.toUpperCase() !== Editions.COMMUNITY)}
            featureCaption={plans?.cdFeatureCaption?.filter(
              caption => caption?.title?.toUpperCase() !== Editions.COMMUNITY
            )}
            featureGroup={plans?.cdFeatureGroup}
          />
        )
      case ModuleName.CE:
        return (
          <Plans
            module={module}
            plans={plans?.ccPlans}
            featureCaption={plans?.ccFeatureCaption}
            featureGroup={plans?.ccFeatureGroup}
          />
        )
    }
    return <></>
  }

  return getPlanByModule()
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ module }) => {
  const [result, executeQuery] = useFetchPlansQuery()
  const { data, fetching, error } = result
  const { getString } = useStrings()
  if (useGetCommunity()) {
    return <CommunityPlans />
  }

  if (fetching) {
    return <PageSpinner />
  }

  if (error) {
    return (
      <PageError
        message={error.message || getString('somethingWentWrong')}
        onClick={() =>
          executeQuery({
            requestPolicy: 'cache-and-network'
          })
        }
      />
    )
  }

  return (
    <Layout.Vertical width={'90%'}>
      <PlanTabs module={module} plans={data?.pricing} />
    </Layout.Vertical>
  )
}

export default SubscriptionPlans
