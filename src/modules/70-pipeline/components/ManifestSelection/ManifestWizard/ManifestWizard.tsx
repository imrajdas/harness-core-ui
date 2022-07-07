/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Text, Icon, StepWizard, StepProps, MultiTypeInputType } from '@wings-software/uicore'
import type { IconProps } from '@harness/icons'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import type { ConnectorConfigDTO } from 'services/cd-ng'
import type { ConnectorRefLabelType } from '@pipeline/components/ArtifactsSelection/ArtifactInterface'
import { ManifestRepoTypes } from '../ManifestWizardSteps/ManifestRepoTypes'
import ManifestStore from '../ManifestWizardSteps/ManifestStore'
import { isServerlessManifestType, manifestTypeLabels } from '../Manifesthelper'
import type { ManifestStepInitData, ManifestStores, ManifestTypes } from '../ManifestInterface'
import css from './ManifestWizard.module.scss'

interface StepChangeData<SharedObject> {
  prevStep?: number
  nextStep?: number
  prevStepData: SharedObject
}

interface ManifestWizardStepsProps<T, U> {
  handleConnectorViewChange: (isConnectorView: boolean) => void
  initialValues: ManifestStepInitData
  selectedManifest: ManifestTypes | null
  labels: ConnectorRefLabelType
  newConnectorView: boolean
  expressions: string[]
  allowableTypes: MultiTypeInputType[]
  newConnectorSteps?: any
  lastSteps: Array<React.ReactElement<StepProps<ConnectorConfigDTO>>> | null
  iconsProps: IconProps
  isReadonly: boolean
  handleStoreChange: (store?: T) => void
  manifestStoreTypes: ManifestStores[]
  changeManifestType: (data: U | null) => void
  types: ManifestTypes[]
}

export function ManifestWizard<T, U>({
  handleConnectorViewChange,
  handleStoreChange,
  initialValues,
  types,
  expressions,
  allowableTypes,
  manifestStoreTypes,
  labels,
  selectedManifest,
  newConnectorView,
  newConnectorSteps,
  lastSteps,
  changeManifestType,
  iconsProps,
  isReadonly
}: ManifestWizardStepsProps<T, U>): React.ReactElement {
  const { getString } = useStrings()
  const onStepChange = (arg: StepChangeData<any>): void => {
    if (arg?.prevStep && arg?.nextStep && arg.prevStep > arg.nextStep && arg.nextStep <= 2) {
      handleConnectorViewChange(false)
      handleStoreChange()
    }
  }
  /* istanbul ignore next */
  const changeManifestTypeRef = (arg: ManifestTypes | null): void => {
    changeManifestType?.(arg as unknown as U)
  }
  /* istanbul ignore next */
  const handleStoreChangeRef = (arg: ManifestStores): void => {
    handleStoreChange?.(arg as unknown as T)
  }

  const renderSubtitle = (): JSX.Element => {
    const stringId = selectedManifest && getString(manifestTypeLabels[selectedManifest])
    if (selectedManifest) {
      return (
        <div className={css.subtitle} style={{ display: 'flex' }}>
          <Icon {...iconsProps} size={26} />
          <Text
            style={{ alignSelf: 'center', marginLeft: 'var(--spacing-small)', wordBreak: 'normal' }}
            color={Color.WHITE}
          >
            {stringId}
          </Text>
        </div>
      )
    }
    return <></>
  }

  return (
    <StepWizard
      className={css.manifestWizard}
      subtitle={renderSubtitle()}
      onStepChange={onStepChange}
      initialStep={isServerlessManifestType(selectedManifest) ? 2 : undefined}
    >
      <ManifestRepoTypes
        manifestTypes={types}
        name={getString('pipeline.manifestType.manifestRepoType')}
        stepName={labels.firstStepName}
        selectedManifest={selectedManifest}
        changeManifestType={changeManifestTypeRef}
        initialValues={initialValues}
      />
      <ManifestStore
        name={getString('pipeline.manifestType.manifestSource')}
        stepName={labels.secondStepName}
        expressions={expressions}
        allowableTypes={allowableTypes}
        isReadonly={isReadonly}
        manifestStoreTypes={manifestStoreTypes}
        handleConnectorViewChange={() => handleConnectorViewChange(true)}
        handleStoreChange={handleStoreChangeRef}
        initialValues={initialValues}
      />
      {newConnectorView ? newConnectorSteps : null}

      {lastSteps?.length ? lastSteps?.map(step => step) : null}
    </StepWizard>
  )
}
