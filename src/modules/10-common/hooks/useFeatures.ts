/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useMemo } from 'react'
import { capitalize } from 'lodash-es'
import { Editions, RestrictionType } from '@common/constants/SubscriptionTypes'
import { useDeepCompareEffect } from '@common/hooks'
import { useFeaturesContext } from 'framework/featureStore/FeaturesContext'
import type { AvailabilityRestrictionDTO } from 'services/cd-ng'
import { FeatureFlag } from '@common/featureFlags'
import type {
  FeatureRequestOptions,
  FeatureRequest,
  CheckFeatureReturn,
  FeaturesRequest,
  CheckFeaturesReturn,
  ModuleType,
  RestrictionMetadataMap,
  FirstDisabledFeatureReturn
} from 'framework/featureStore/featureStoreUtil'
import type { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { useGetCommunity } from '@common/utils/utils'
import { useFeatureFlag } from './useFeatureFlag'

interface FeatureProps {
  featureRequest?: FeatureRequest
  options?: FeatureRequestOptions
}

interface FeaturesProps {
  featuresRequest?: FeaturesRequest
  options?: FeatureRequestOptions
}

function useGetFeatureEnforced(): boolean {
  const isCommunity = useGetCommunity()
  const featureEnforced = useFeatureFlag(FeatureFlag.FEATURE_ENFORCEMENT_ENABLED)
  return featureEnforced || isCommunity
}

export function useFeature(props: FeatureProps): CheckFeatureReturn {
  const isCommunity = useGetCommunity()
  const { requestFeatures, checkFeature, requestLimitFeature, checkLimitFeature, getRestrictionType } =
    useFeaturesContext()
  const { licenseInformation, CI_LICENSE_STATE, CD_LICENSE_STATE, FF_LICENSE_STATE, CCM_LICENSE_STATE } =
    useLicenseStore()

  const featureEnforced = useGetFeatureEnforced()

  const { featureRequest, options } = props
  const restrictionType = getRestrictionType({
    featureRequest,
    licenseInformation,
    licenseState: { CI_LICENSE_STATE, CD_LICENSE_STATE, FF_LICENSE_STATE, CCM_LICENSE_STATE },
    isCommunity
  })
  const isLimit = restrictionType && restrictionType !== RestrictionType.AVAILABILITY

  useDeepCompareEffect(() => {
    if (featureEnforced && featureRequest) {
      if (isLimit) {
        requestLimitFeature(featureRequest)
      } else {
        // cache enabled availability feature list in the context
        // restrictionType could be undefined, we don't do anything
        restrictionType && requestFeatures(featureRequest, options)
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureRequest, options, isLimit, featureEnforced, restrictionType])

  if (!featureEnforced || featureRequest === undefined) {
    return { enabled: true }
  }

  // rate limit feature always calls the api in real time
  return isLimit ? checkLimitFeature(featureRequest.featureName) : checkFeature(featureRequest.featureName)
}

export function useFeatures(props: FeaturesProps): CheckFeaturesReturn {
  const { requestFeatures, checkFeature, requestLimitFeature, checkLimitFeature, getRestrictionType } =
    useFeaturesContext()
  const { licenseInformation, CI_LICENSE_STATE, CD_LICENSE_STATE, FF_LICENSE_STATE, CCM_LICENSE_STATE } =
    useLicenseStore()

  const featureEnforced = useGetFeatureEnforced()

  const features = new Map<FeatureIdentifier, CheckFeatureReturn>()

  const { featuresRequest, options } = props
  const isCommunity = useGetCommunity()

  function groupFeatures(): { limitFeatures: FeatureIdentifier[]; availFeatures: FeatureIdentifier[] } {
    const accLimitFeatures: FeatureIdentifier[] = []
    const accAvailFeatures: FeatureIdentifier[] = []
    featuresRequest?.featureNames.forEach(featureName => {
      const restrictionType = getRestrictionType({
        featureRequest: { featureName },
        licenseInformation,
        licenseState: { CI_LICENSE_STATE, CD_LICENSE_STATE, FF_LICENSE_STATE, CCM_LICENSE_STATE },
        isCommunity
      })
      const isLimit = restrictionType && restrictionType !== RestrictionType.AVAILABILITY
      if (isLimit) {
        accLimitFeatures.push(featureName)
      } else {
        // restrictionType could be undefined, we don't do anything
        restrictionType && accAvailFeatures.push(featureName)
      }
    })
    return { limitFeatures: accLimitFeatures, availFeatures: accAvailFeatures }
  }
  const { limitFeatures, availFeatures } = groupFeatures()

  useDeepCompareEffect(() => {
    if (featureEnforced && featuresRequest) {
      if (limitFeatures.length > 0) {
        // every limit feature needs real time inquiry
        limitFeatures.forEach(featureName => {
          requestLimitFeature({ featureName })
        })
      }
      if (availFeatures.length > 0) {
        // cache enabled availability feature list in the context
        requestFeatures(featuresRequest, options)
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, featureEnforced, limitFeatures, availFeatures])

  if (!featureEnforced) {
    if (featuresRequest) {
      const { featureNames } = featuresRequest
      featureNames.forEach(featureName => {
        features.set(featureName, { enabled: true })
      })
    }
    return { features }
  }

  // re-order the returned features by the order they are passed in
  if (featuresRequest) {
    const { featureNames } = featuresRequest
    featureNames.forEach(featureName => {
      if (limitFeatures.includes(featureName)) {
        features.set(featureName, checkLimitFeature(featureName))
      }
      if (availFeatures.includes(featureName)) {
        features.set(featureName, checkFeature(featureName))
      }
    })
  }

  return { features }
}

export function useFeatureModule(featureName?: FeatureIdentifier): ModuleType {
  const { featureMap } = useFeaturesContext()
  return featureName && featureMap.get(featureName)?.moduleType
}

export function useGetFirstDisabledFeature(featuresRequest?: FeaturesRequest): FirstDisabledFeatureReturn {
  const { features } = useFeatures({
    featuresRequest
  })

  const keys = useMemo(() => {
    return [...features.keys()]
  }, [features])

  const firstDisabledFeatureIndex: number = useMemo(() => {
    const values = [...features.values()]
    return values.findIndex(feature => !feature.enabled)
  }, [features])

  const featureEnabled = firstDisabledFeatureIndex === -1
  const disabledFeatureName = useMemo(() => {
    return !featureEnabled ? keys[firstDisabledFeatureIndex] : undefined
  }, [featureEnabled, keys, firstDisabledFeatureIndex])

  return { featureEnabled, disabledFeatureName }
}

export function useFeatureRequiredPlans(featureName?: FeatureIdentifier): string[] {
  const { featureMap, getEdition } = useFeaturesContext()
  const { licenseInformation, CI_LICENSE_STATE, CD_LICENSE_STATE, FF_LICENSE_STATE, CCM_LICENSE_STATE } =
    useLicenseStore()
  const isCommunity = useGetCommunity()

  // for community, do not return plans
  if (isCommunity) {
    return []
  }

  const moduleType = featureName && featureMap.get(featureName)?.moduleType
  const currentEdition = getEdition({
    moduleType,
    licenseInformation,
    licenseState: { CI_LICENSE_STATE, CD_LICENSE_STATE, FF_LICENSE_STATE, CCM_LICENSE_STATE },
    isCommunity
  })
  const restrictionMetadataMap = featureName && featureMap.get(featureName)?.restrictionMetadataMap
  return getRequiredPlans(currentEdition, restrictionMetadataMap)
}

function getRequiredPlans(currentEdition?: Editions, map?: RestrictionMetadataMap): string[] {
  const editions: string[] = []
  if (!map || !currentEdition) {
    return editions
  }

  Object.entries(map).forEach(([key, value]) => {
    const edition = key as Editions
    if (lowerThanCurrentPlan(currentEdition, edition)) {
      return
    }
    const { enabled } = value as AvailabilityRestrictionDTO
    // for plans when it's AVAILABILITY feature, when enabled is true, push it into the bucket
    // for plans when it's LIMIT feature, enabled is undefined, just push it into the bucket
    if (enabled !== false) {
      editions.push(capitalize(edition.toString()))
    }
  })
  return editions
}

const orders = {
  ENTERPRISE: 0,
  TEAM: 1,
  FREE: 2,
  COMMUNITY: 2
}

function lowerThanCurrentPlan(currentEdition: Editions, edition: Editions): boolean {
  return orders[currentEdition] <= orders[edition]
}
