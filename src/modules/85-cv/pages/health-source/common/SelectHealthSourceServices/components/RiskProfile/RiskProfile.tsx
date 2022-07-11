/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo } from 'react'
import { Classes } from '@blueprintjs/core'
import { Container, FormInput, Label, SelectOption, Text } from '@wings-software/uicore'
import { useToaster } from '@common/exports'
import { useStrings } from 'framework/strings'
import type { useGetMetricPacks, useGetLabelNames } from 'services/cv'
import { ServiceInstanceLabel } from '@cv/pages/health-source/common/ServiceInstanceLabel/ServiceInstanceLabel'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import { getRiskCategoryOptions } from './RiskProfile.utils'
import { FieldNames } from './RiskProfile.constant'
import css from './RiskProfile.module.scss'

interface RiskProfileProps {
  metricPackResponse: ReturnType<typeof useGetMetricPacks>
  labelNamesResponse?: ReturnType<typeof useGetLabelNames>
  continuousVerificationEnabled?: boolean
  serviceInstance?: string
  riskCategory?: string
  isTemplate?: boolean
  expressions?: string[]
}

export function RiskProfile(props: RiskProfileProps): JSX.Element {
  const {
    metricPackResponse,
    labelNamesResponse,
    continuousVerificationEnabled,
    serviceInstance,
    riskCategory,
    isTemplate,
    expressions
  } = props
  const { error, loading, data } = metricPackResponse
  const { getString } = useStrings()
  const { showError, clear } = useToaster()
  const metricPackOptions = useMemo(() => getRiskCategoryOptions(data?.resource), [data])
  useEffect(() => {
    if (error) {
      clear()
      showError(getErrorMessage(error), 7000)
    }
  })

  const transformedLabelNames: SelectOption[] = useMemo(
    () => labelNamesResponse?.data?.data?.map(label => ({ label, value: label })) || [],
    [labelNamesResponse]
  )

  let metricPackContent: React.ReactNode = <Container />
  if (loading) {
    metricPackContent = (
      <Container>
        <Text tooltipProps={{ dataTooltipId: 'riskProfileBaselineDeviation' }} className={css.groupLabel}>
          {getString('cv.monitoringSources.baselineDeviation')}
        </Text>
        {[1, 2, 3, 4].map(val => (
          <Container
            key={val}
            width={150}
            height={15}
            style={{ marginBottom: 'var(--spacing-small)' }}
            className={Classes.SKELETON}
          />
        ))}
      </Container>
    )
  } else if (metricPackOptions?.length) {
    metricPackContent = (
      <FormInput.RadioGroup
        label={getString('cv.monitoringSources.riskCategoryLabel')}
        name={FieldNames.RISK_CATEGORY}
        items={metricPackOptions}
        key={riskCategory}
      />
    )
  }

  return (
    <Container className={css.main}>
      {metricPackContent}
      <Container className={css.checkBoxGroup}>
        <Text className={css.groupLabel}>{getString('cv.monitoringSources.baselineDeviation')}</Text>
        <FormInput.CheckBox
          label={getString('cv.monitoringSources.higherCounts')}
          name={FieldNames.HIGHER_BASELINE_DEVIATION}
        />
        <FormInput.CheckBox
          label={getString('cv.monitoringSources.lowerCounts')}
          name={FieldNames.LOWER_BASELINE_DEVIATION}
        />
      </Container>
      {continuousVerificationEnabled ? (
        isTemplate ? (
          <>
            <Label>
              <ServiceInstanceLabel />
            </Label>
            <FormInput.MultiTypeInput
              label=""
              name={FieldNames.SERVICE_INSTANCE}
              selectItems={transformedLabelNames}
              multiTypeInputProps={{
                expressions,
                value: serviceInstance ? { label: serviceInstance, value: serviceInstance } : undefined
              }}
            />
          </>
        ) : (
          <FormInput.Select
            name={FieldNames.SERVICE_INSTANCE}
            label={<ServiceInstanceLabel />}
            items={transformedLabelNames}
            value={serviceInstance ? { label: serviceInstance, value: serviceInstance } : undefined}
          />
        )
      ) : null}
    </Container>
  )
}
