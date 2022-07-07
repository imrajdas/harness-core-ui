/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@harness/uicore'
import { Scope } from '@common/interfaces/SecretsInterface'
import { ModuleName } from 'framework/types/ModuleName'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { Editions } from '@common/constants/SubscriptionTypes'

interface SetPageNumberProps {
  setPage: (value: React.SetStateAction<number>) => void
  pageItemsCount?: number
  page: number
}

export const getModuleIcon = (module: ModuleName): IconName => {
  switch (module) {
    case ModuleName.CD:
      return 'cd-main'
    case ModuleName.CV:
      return 'cv-main'
    case ModuleName.CI:
      return 'ci-main'
    case ModuleName.CE:
      return 'ce-main'
    case ModuleName.CF:
      return 'cf-main'
    case ModuleName.STO:
      return 'sto-color-filled'
  }
  return 'nav-project'
}

export const getReference = (scope?: Scope, identifier?: string): string | undefined => {
  switch (scope) {
    case Scope.PROJECT:
      return identifier
    case Scope.ORG:
      return `org.${identifier}`
    case Scope.ACCOUNT:
      return `account.${identifier}`
  }
}

export const setPageNumber = ({ setPage, pageItemsCount, page }: SetPageNumberProps): void => {
  if (pageItemsCount === 0 && page > 0) {
    setPage(page - 1)
  }
}

export const formatCount = (num: number): string => {
  const min = 1e3
  if (num >= min) {
    const units = ['k', 'M', 'B', 'T']
    const order = Math.floor(Math.log(num) / Math.log(1000))
    const finalNum = Math.round(num / 1000 ** order)
    if (finalNum === min && order < units.length) {
      return 1 + units[order]
    }
    return finalNum + units[order - 1]
  }
  return num.toLocaleString()
}

export function useGetCommunity(): boolean {
  const { licenseInformation } = useLicenseStore()
  return licenseInformation?.['CD']?.edition === Editions.COMMUNITY
}

export const isOnPrem = (): boolean => window.deploymentType === 'ON_PREM'

export const focusOnNode = (node: HTMLElement): void => {
  const oldTabIndex = node.tabIndex
  node.tabIndex = -1
  node.focus()
  node.tabIndex = oldTabIndex
}

const HOTJAR_SUPPRESSION_ATTR = 'data-hj-suppress'

// Utility to add `data-hj-suppress` into a collection of elements to
// suppress data from HotJar recording
// @see https://bit.ly/3rCgpOY
export const suppressHotJarRecording = (elements: Element[] | null | undefined): void => {
  if (window.hj) {
    elements?.forEach?.((e: Element) => {
      if (!e.hasAttribute(HOTJAR_SUPPRESSION_ATTR)) {
        e.setAttribute(HOTJAR_SUPPRESSION_ATTR, 'true')
      }
    })
  }
}

// Utility to generate { 'data-hj-suppress': true } attribute if HotJar is available
export const addHotJarSuppressionAttribute = (): { [HOTJAR_SUPPRESSION_ATTR]: boolean } | undefined =>
  window.hj ? { [HOTJAR_SUPPRESSION_ATTR]: true } : undefined

// Utility to check if environment is a PR environment
export const isPR = (): boolean => {
  return location.hostname === 'pr.harness.io'
}

// Utility to check if environment is a local develop environment
export const isLocalHost = (): boolean => {
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1'
}
