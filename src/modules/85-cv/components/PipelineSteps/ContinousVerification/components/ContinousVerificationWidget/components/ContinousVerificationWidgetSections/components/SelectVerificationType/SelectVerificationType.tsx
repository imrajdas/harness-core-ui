/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { FormInput, MultiTypeInputType, SelectOption } from '@wings-software/uicore'
import cx from 'classnames'
import type { FormikProps } from 'formik'
import { useStrings } from 'framework/strings'
import Card from '@cv/components/Card/Card'
import type { ContinousVerificationData } from '@cv/components/PipelineSteps/ContinousVerification/types'
import { continousVerificationTypes } from './constants'
import ConfigureFields from '../ConfigureFields/ConfigureFields'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
interface SelectVerificationTypeProps {
  formik: FormikProps<ContinousVerificationData>
  allowableTypes: MultiTypeInputType[]
}

export default function SelectVerificationType(props: SelectVerificationTypeProps): React.ReactElement {
  const { formik, allowableTypes } = props
  const { getString } = useStrings()
  return (
    <Card>
      <>
        <div className={cx(stepCss.formGroup)}>
          <FormInput.Select
            name="spec.type"
            label={getString('connectors.cdng.continousVerificationType')}
            items={continousVerificationTypes as SelectOption[]}
          />
        </div>
        {formik?.values?.spec?.type ? <ConfigureFields formik={formik} allowableTypes={allowableTypes} /> : null}
      </>
    </Card>
  )
}
