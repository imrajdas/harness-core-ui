/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, MultiTypeInputType } from '@harness/uicore'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { useStrings } from 'framework/strings'
import { ShellScriptMonacoField } from '@common/components/ShellScriptMonaco/ShellScriptMonaco'

export default function CVMultiTypeQuery({
  name,
  disableFetchButton,
  expressions,
  fetchRecords,
  allowedTypes
}: {
  name: string
  disableFetchButton?: boolean
  expressions: string[]
  allowedTypes?: MultiTypeInputType[]
  fetchRecords?: () => void
}): JSX.Element {
  const { getString } = useStrings()

  return (
    <MultiTypeFieldSelector
      name={name}
      label={getString('cv.query')}
      defaultValueToReset=""
      skipRenderValueInExpressionLabel
      allowedTypes={
        allowedTypes || [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
      }
      expressionRender={() => {
        return (
          <>
            <ShellScriptMonacoField
              name={name}
              scriptType={'Bash'}
              expressions={expressions}
              editorOptions={{ lineNumbers: 'off' }}
            />
          </>
        )
      }}
    >
      <ShellScriptMonacoField name={name} scriptType={'Bash'} editorOptions={{ lineNumbers: 'off' }} />
      <Button
        intent="primary"
        text={getString('cv.monitoringSources.gcoLogs.fetchRecords')}
        onClick={async () => {
          fetchRecords?.()
        }}
        disabled={disableFetchButton}
      />
    </MultiTypeFieldSelector>
  )
}
