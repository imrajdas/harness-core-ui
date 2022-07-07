/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { NoDataCard, PageError } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import noDataImage from '@cv/assets/noData.svg'
import { useGetChangeEventDetail } from 'services/cv'
import { PageSpinner } from '@common/components'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import { ChangeSourceTypes } from '@cv/pages/ChangeSource/ChangeSourceDrawer/ChangeSourceDrawer.constants'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import PagerDutyEventCard from './components/EventCards/PagerDutyEventCard/PagerDutyEventCard'
import HarnessNextGenEventCard from './components/EventCards/HarnessNextGenEventCard/HarnessNextGenEventCard'
import HarnessCDEventCard from './components/EventCards/HarnessCDEventCard/HarnessCDEventCard'
import K8sChangeEventCard from './components/EventCards/K8sChangeEventCard/K8sChangeEventCard'

export default function ChangeEventCard({ activityId }: { activityId: string }): JSX.Element {
  const { getString } = useStrings()
  const { orgIdentifier, projectIdentifier, accountId } = useParams<ProjectPathProps>()
  const { data, loading, error, refetch } = useGetChangeEventDetail({
    orgIdentifier,
    projectIdentifier,
    accountIdentifier: accountId,
    activityId
  })

  const { type } = data?.resource || {}
  if (loading) {
    return <PageSpinner />
  } else if (error) {
    return <PageError message={getErrorMessage(error)} onClick={() => refetch()} />
  } else if (data?.resource) {
    switch (type) {
      case ChangeSourceTypes.PagerDuty:
        return <PagerDutyEventCard data={data?.resource} />
      case ChangeSourceTypes.HarnessCD:
        return <HarnessCDEventCard data={data?.resource} />
      case ChangeSourceTypes.HarnessCDNextGen:
        return <HarnessNextGenEventCard data={data?.resource} />
      case ChangeSourceTypes.K8sCluster:
        return <K8sChangeEventCard data={data?.resource} />
      default:
        return <NoDataCard message={getString('cv.changeSource.noDataAvaiableForCard')} image={noDataImage} />
    }
  } else {
    return <NoDataCard message={getString('cv.changeSource.noDataAvaiableForCard')} image={noDataImage} />
  }
}
