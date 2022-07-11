/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { RiskValues } from '@cv/utils/CommonUtils'

export const mockedHealthSourcesData = {
  data: {
    resource: [
      {
        identifier: 'GCO_Health_source',
        name: 'GCO Health source',
        type: 'STACKDRIVER_LOG',
        verificationType: 'LOG'
      },
      {
        identifier: 'Appd_Health_source',
        name: 'Appd Health source',
        type: 'APP_DYNAMICS'
      },
      {
        identifier: 'service_prod/custommetric',
        name: 'custommetric',
        type: 'CUSTOM_HEALTH_METRIC',
        verificationType: 'LOG'
      }
    ]
  }
}

export const healthSourceMock = {
  metaData: {},
  resource: [
    {
      identifier: 'GCO_Health_source',
      name: 'GCO Health source',
      type: 'STACKDRIVER_LOG'
    },
    {
      identifier: 'Appd_Health_source',
      name: 'Appd Health source',
      type: 'APP_DYNAMICS'
    },
    {
      identifier: 'service_prod/custommetric',
      name: 'custommetric',
      type: 'CUSTOM_HEALTH_METRIC',
      verificationType: 'LOG'
    }
  ],
  responseMessages: []
}

export const mockedClustersData = {
  metaData: {},
  resource: [
    {
      text: 'verification-svc',
      risk: RiskValues.HEALTHY,
      x: 0,
      y: 0,
      tag: 'KNOWN'
    }
  ],
  responseMessages: []
}
