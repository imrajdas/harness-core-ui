/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import BaseContinousVerification from './components/BaseContinousVerification/BaseContinousVerification'
import type { ContinousVerificationWidgetSectionsProps } from './types'
import SelectVerificationType from './components/SelectVerificationType/SelectVerificationType'
import SelectMonitoredServiceType from './components/SelectMonitoredServiceType/SelectMonitoredServiceType'
import { MONITORED_SERVICE_TYPE } from './components/SelectMonitoredServiceType/SelectMonitoredServiceType.constants'
import ConfiguredMonitoredService from './components/ConfiguredMonitoredService/ConfiguredMonitoredService'
import MonitoredService from './components/MonitoredService/MonitoredService'

export function ContinousVerificationWidgetSections({
  formik,
  isNewStep,
  stepViewType,
  allowableTypes
}: ContinousVerificationWidgetSectionsProps): JSX.Element {
  const { CVNG_TEMPLATE_VERIFY_STEP } = useFeatureFlags()

  const renderMonitoredService = (): JSX.Element => {
    if (formik?.values?.spec?.monitoredService?.type === MONITORED_SERVICE_TYPE.CONFIGURED) {
      return <ConfiguredMonitoredService allowableTypes={allowableTypes} formik={formik} />
    } else if (
      formik?.values?.spec?.monitoredService?.type === MONITORED_SERVICE_TYPE.DEFAULT &&
      stepViewType !== 'Template'
    ) {
      return <MonitoredService formik={formik} />
    } else {
      return <></>
    }
  }

  return (
    <>
      <BaseContinousVerification
        formik={formik}
        isNewStep={isNewStep}
        stepViewType={stepViewType}
        allowableTypes={allowableTypes}
      />
      <SelectVerificationType formik={formik} allowableTypes={allowableTypes} />
      {CVNG_TEMPLATE_VERIFY_STEP && <SelectMonitoredServiceType formik={formik} allowableTypes={allowableTypes} />}
      {CVNG_TEMPLATE_VERIFY_STEP ? renderMonitoredService() : <MonitoredService formik={formik} />}
    </>
  )
}
