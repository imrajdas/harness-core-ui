/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'

import { MultiTypeInputType } from '@harness/uicore'
import type { ManifestConfigWrapper, ServiceSpec } from 'services/cd-ng'
import { TestWrapper } from '@common/utils/testUtils'
import { ManifestSourceBaseFactory } from '@cd/factory/ManifestSourceFactory/ManifestSourceBaseFactory'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { manifests, template, path, stageIdentifier } from './mocks'
import { KubernetesManifests } from '../../../KubernetesManifests/KubernetesManifests'

describe('K8sManifestSource tests', () => {
  const commonProps = {
    template: template as ServiceSpec,
    manifests: manifests as ManifestConfigWrapper[],
    manifestSourceBaseFactory: new ManifestSourceBaseFactory(),
    stepViewType: StepViewType.DeploymentForm,
    stageIdentifier,
    path,
    initialValues: { manifests: manifests as ManifestConfigWrapper[] },
    allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
  }
  test('Should match snapshot', () => {
    const { container } = render(
      <TestWrapper>
        <KubernetesManifests {...commonProps} readonly={false} fromTrigger={false} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
  test('renders correctly when fromTrigger and readonly is true', () => {
    const { getByText } = render(
      <TestWrapper>
        <KubernetesManifests {...commonProps} readonly={true} fromTrigger={true} />
      </TestWrapper>
    )
    expect(getByText('resourcePage.fileStore')).toBeTruthy()
  })
})
