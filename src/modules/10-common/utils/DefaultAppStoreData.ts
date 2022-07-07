/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { AppStoreContextProps } from 'framework/AppStore/AppStoreContext'
import type { Project } from 'services/cd-ng'
import { Editions } from '@common/constants/SubscriptionTypes'

export const project: Project = {
  orgIdentifier: 'testOrg',
  identifier: 'test',
  name: 'test',
  color: '#e6b800',
  modules: ['CD', 'CV'],
  description: 'test',
  tags: { tag1: '', tag2: 'tag3' }
}

export const defaultAppStoreValues: Omit<AppStoreContextProps, 'updateAppStore'> = {
  selectedProject: {
    orgIdentifier: 'testOrg',
    identifier: 'test',
    name: 'test',
    color: '#e6b800',
    modules: ['CD', 'CV', 'CI', 'CE', 'CF'],
    description: 'test',
    tags: { tag1: '', tag2: 'tag3' }
  },
  selectedOrg: {
    identifier: 'testOrg',
    name: 'test Org',
    description: 'test',
    tags: { tag1: '', tag2: 'tag3' }
  },
  featureFlags: {
    CDNG_ENABLED: true,
    CVNG_ENABLED: true,
    CING_ENABLED: true,
    CENG_ENABLED: true,
    CFNG_ENABLED: true
  },
  currentUserInfo: {
    uuid: 'dummyId',
    name: 'dummyname',
    email: 'dummy@harness.io',
    admin: false,
    twoFactorAuthenticationEnabled: false,
    emailVerified: false
  }
}

export const communityLicenseStoreValues = {
  licenseInformation: {
    CD: {
      edition: Editions.COMMUNITY
    }
  }
}
