/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { isEmpty } from 'lodash-es'
import { Card, Text, FormInput, MultiTypeInputType } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import NoResultsView from '@templates-library/pages/TemplatesPage/views/NoResultsView/NoResultsView'
import { spacingMedium } from '../../MonitoredServiceInputSetsTemplate.constants'
import css from '../../MonitoredServiceInputSetsTemplate.module.scss'

interface MonitoredServiceInputsetVariablesInterface {
  monitoredServiceVariables: any
}

export default function MonitoredServiceInputsetVariables({
  monitoredServiceVariables
}: MonitoredServiceInputsetVariablesInterface): JSX.Element {
  const { getString } = useStrings()

  let content = <></>
  if (!isEmpty(monitoredServiceVariables)) {
    content = monitoredServiceVariables?.map((variable: any, index: number) => {
      return (
        <FormInput.MultiTextInput
          key={variable?.name}
          name={`variables.${index}.value`}
          label={variable?.name}
          multiTextInputProps={{ allowableTypes: [MultiTypeInputType.FIXED] }}
        />
      )
    })
  } else {
    content = <NoResultsView text={'No Runtime inputs variables available'} minimal={true} />
  }

  return (
    <Card className={css.cardStyle}>
      <Text font={'normal'} style={{ paddingBottom: spacingMedium }}>
        {getString('common.variables')}
      </Text>
      {content}
    </Card>
  )
}
