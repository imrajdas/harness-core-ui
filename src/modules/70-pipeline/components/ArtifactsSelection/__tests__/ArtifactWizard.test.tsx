/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import userEvent from '@testing-library/user-event'
import { findAllByText, findByText, fireEvent, queryByAttribute, render } from '@testing-library/react'
import { MultiTypeInputType } from '@wings-software/uicore'
import { TestWrapper, findDialogContainer } from '@common/utils/testUtils'
import { ServiceDeploymentType } from '@pipeline/utils/stageHelpers'
import ArtifactWizard from '../ArtifactWizard/ArtifactWizard'
import type { ArtifactType, InitialArtifactDataType, TagTypes } from '../ArtifactInterface'
import { DockerRegistryArtifact } from '../ArtifactRepository/ArtifactLastSteps/DockerRegistryArtifact/DockerRegistryArtifact'
import connectorsData from './connectors_mock.json'
import { GCRImagePath } from '../ArtifactRepository/ArtifactLastSteps/GCRImagePath/GCRImagePath'
import { AmazonS3 } from '../ArtifactRepository/ArtifactLastSteps/AmazonS3Artifact/AmazonS3'

const fetchConnectors = (): Promise<unknown> => Promise.resolve(connectorsData)

jest.mock('services/cd-ng', () => ({
  useGetConnector: () => {
    return {
      data: fetchConnectors,
      refetch: jest.fn()
    }
  },
  useGetBuildDetailsForDocker: jest.fn().mockImplementation(() => {
    return { data: { buildDetailsList: [] }, refetch: jest.fn(), error: null, loading: false }
  }),
  useGetBuildDetailsForGcr: jest.fn().mockImplementation(() => {
    return { data: { buildDetailsList: [] }, refetch: jest.fn(), error: null, loading: false }
  })
}))

const laststepProps = {
  name: 'Artifact Location',
  expressions: [''],
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  context: 1,
  initialValues: {
    identifier: 'id',
    imagePath: '',
    tag: '',
    tagType: 'value' as TagTypes,
    tagRegex: ''
  },
  handleSubmit: jest.fn(),
  artifactIdentifiers: [],
  selectedArtifact: 'DockerRegistry' as ArtifactType,
  selectedDeploymentType: ServiceDeploymentType.Kubernetes
}

const AmazsonS3LastStepProps = {
  name: 'Artifact Location',
  expressions: [''],
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  context: 1,
  initialValues: {
    identifier: '',
    bucketName: '',
    tagType: 'value' as TagTypes,
    filePath: ''
  },
  handleSubmit: jest.fn(),
  artifactIdentifiers: [],
  selectedArtifact: 'AmazonS3' as ArtifactType
}

describe('Artifact WizardStep tests', () => {
  test(`renders without crashing`, () => {
    const { container } = render(
      <TestWrapper>
        <ArtifactWizard
          handleViewChange={jest.fn()}
          artifactInitialValue={{} as InitialArtifactDataType}
          types={[]}
          expressions={[]}
          isReadonly={false}
          showConnectorStep={true}
          labels={{
            firstStepName: 'first step',
            secondStepName: 'second step'
          }}
          selectedArtifact={'DockerRegistry'}
          changeArtifactType={jest.fn()}
          newConnectorView={false}
          iconsProps={{ name: 'info' }}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          lastSteps={<DockerRegistryArtifact {...laststepProps} key={'key'} />}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test(`renders correctly with connector Data`, () => {
    const initialValues = {
      connectorId: 'connectorId'
    }
    const { container } = render(
      <TestWrapper>
        <ArtifactWizard
          handleViewChange={jest.fn()}
          artifactInitialValue={initialValues as InitialArtifactDataType}
          types={[]}
          expressions={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          showConnectorStep={true}
          isReadonly={false}
          labels={{
            firstStepName: 'first step',
            secondStepName: 'second step'
          }}
          selectedArtifact={'DockerRegistry'}
          changeArtifactType={jest.fn()}
          newConnectorView={false}
          iconsProps={{ name: 'info' }}
          lastSteps={<DockerRegistryArtifact {...laststepProps} key={'key'} />}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test(`renders correctly with differnet artifact types`, () => {
    const initialValues = {
      connectorId: 'connectorId'
    }
    const { container } = render(
      <TestWrapper>
        <ArtifactWizard
          handleViewChange={jest.fn()}
          artifactInitialValue={initialValues as InitialArtifactDataType}
          types={['DockerRegistry', 'Gcr', 'Ecr']}
          expressions={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          showConnectorStep={true}
          isReadonly={false}
          labels={{
            firstStepName: 'first step',
            secondStepName: 'second step'
          }}
          selectedArtifact={'Gcr'}
          changeArtifactType={jest.fn()}
          newConnectorView={false}
          iconsProps={{ name: 'info' }}
          lastSteps={<DockerRegistryArtifact {...laststepProps} key={'key'} />}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test(`new connector view works correctly`, async () => {
    const initialValues = {
      connectorId: 'connectorId'
    }
    const { container } = render(
      <TestWrapper>
        <ArtifactWizard
          handleViewChange={jest.fn()}
          artifactInitialValue={initialValues as InitialArtifactDataType}
          types={['DockerRegistry', 'Gcr', 'Ecr']}
          expressions={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          showConnectorStep={true}
          isReadonly={false}
          labels={{
            firstStepName: 'first step',
            secondStepName: 'second step'
          }}
          selectedArtifact={'DockerRegistry'}
          changeArtifactType={jest.fn()}
          newConnectorView={true}
          iconsProps={{ name: 'info' }}
          lastSteps={<GCRImagePath {...laststepProps} key={'key'} />}
        />
      </TestWrapper>
    )
    const artifactLabel = await findByText(container, 'connectors.artifactRepository')
    expect(artifactLabel).toBeDefined()
    const DockerArtifactType = await findAllByText(container, 'dockerRegistry')
    expect(DockerArtifactType).toBeDefined()

    const changeText = await findByText(container, 'Change')
    fireEvent.click(changeText)

    const GCRArtifactType = await findByText(container, 'connectors.GCR.name')
    expect(GCRArtifactType).toBeDefined()
    fireEvent.click(GCRArtifactType)

    const continueButton = await findByText(container, 'continue')
    expect(continueButton).toBeDefined()
    fireEvent.click(continueButton)

    const artifactRepoLabel = await findByText(container, 'Docker Registry connector')
    expect(artifactRepoLabel).toBeDefined()
    const newConnectorLabel = await findByText(container, 'newLabel Docker Registry connector')
    expect(newConnectorLabel).toBeDefined()

    fireEvent.click(newConnectorLabel)
    const gcrHostname = await findByText(container, 'connectors.GCR.registryHostname')
    expect(gcrHostname).toBeDefined()
    fireEvent.click(gcrHostname)

    expect(container).toMatchSnapshot()
  })

  test(`new connector view works correctly in select dialog`, async () => {
    const initialValues = {
      connectorId: 'connectorId'
    }
    const { container } = render(
      <TestWrapper>
        <ArtifactWizard
          handleViewChange={jest.fn()}
          artifactInitialValue={initialValues as InitialArtifactDataType}
          types={['DockerRegistry', 'Gcr', 'Ecr']}
          expressions={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          showConnectorStep={true}
          isReadonly={false}
          labels={{
            firstStepName: 'first step',
            secondStepName: 'second step'
          }}
          selectedArtifact={'DockerRegistry'}
          changeArtifactType={jest.fn()}
          newConnectorView={true}
          iconsProps={{ name: 'info' }}
          lastSteps={<DockerRegistryArtifact {...laststepProps} key={'key'} />}
        />
      </TestWrapper>
    )
    const artifactLabel = await findByText(container, 'connectors.artifactRepository')
    expect(artifactLabel).toBeDefined()
    const DockerArtifactType = await findAllByText(container, 'dockerRegistry')
    expect(DockerArtifactType).toBeDefined()

    const changeText = await findByText(container, 'Change')
    fireEvent.click(changeText)

    const GCRArtifactType = await findByText(container, 'connectors.GCR.name')
    expect(GCRArtifactType).toBeDefined()
    fireEvent.click(GCRArtifactType)

    const continueButton = await findByText(container, 'continue')
    expect(continueButton).toBeDefined()
    fireEvent.click(continueButton)

    const artifactRepoLabel = await findByText(container, 'Docker Registry connector')
    expect(artifactRepoLabel).toBeDefined()
    expect(container).toMatchSnapshot()

    const newConnectorLabel = await findByText(container, 'select Docker Registry connector')
    expect(newConnectorLabel).toBeDefined()
    fireEvent.click(newConnectorLabel)
    const connectorDialog = findDialogContainer()
    expect(connectorDialog).toBeTruthy()

    if (connectorDialog) {
      const nextStepButton = await findByText(connectorDialog, '+ newLabel Docker Registry connector')
      expect(nextStepButton).toBeDefined()
    }
  })

  test(`last step data without initial values`, async () => {
    const initialValues = {
      connectorId: 'connectorId'
    }

    const { container } = render(
      <TestWrapper>
        <ArtifactWizard
          handleViewChange={jest.fn()}
          artifactInitialValue={initialValues as InitialArtifactDataType}
          types={['DockerRegistry', 'Gcr', 'Ecr']}
          expressions={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          showConnectorStep={true}
          isReadonly={false}
          labels={{
            firstStepName: 'first step',
            secondStepName: 'second step'
          }}
          selectedArtifact={'DockerRegistry'}
          changeArtifactType={jest.fn()}
          newConnectorView={true}
          iconsProps={{ name: 'info' }}
          lastSteps={<DockerRegistryArtifact {...laststepProps} key={'key'} />}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test(`select AmazonS3 artifact type and validate last step`, async () => {
    const initialValues = {
      connectorId: 'AWSX',
      submittedArtifact: 'AmazonS3'
    }
    const { container } = render(
      <TestWrapper>
        <ArtifactWizard
          handleViewChange={jest.fn()}
          artifactInitialValue={initialValues as InitialArtifactDataType}
          types={['ArtifactoryRegistry', 'Ecr', 'AmazonS3']}
          expressions={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          showConnectorStep={true}
          isReadonly={false}
          labels={{
            firstStepName: 'first step',
            secondStepName: 'second step'
          }}
          selectedArtifact={'AmazonS3'}
          changeArtifactType={jest.fn()}
          newConnectorView={true}
          iconsProps={{ name: 'info' }}
          lastSteps={<AmazonS3 {...AmazsonS3LastStepProps} key={'key'} />}
        />
      </TestWrapper>
    )

    // First step
    const artifactLabel = await findByText(container, 'connectors.artifactRepository')
    expect(artifactLabel).toBeDefined()
    const AmazonS3ArtifactType = await findAllByText(container, 'pipeline.artifactsSelection.amazonS3Title')
    expect(AmazonS3ArtifactType).toHaveLength(2)
    const changeText = await findByText(container, 'Change')
    fireEvent.click(changeText)
    const ArtifactoryArtifactType = await findAllByText(container, 'connectors.artifactory.artifactoryLabel')
    expect(ArtifactoryArtifactType).toBeDefined()
    const ECRArtifactType = await findByText(container, 'connectors.ECR.name')
    expect(ECRArtifactType).toBeDefined()
    const continueButton = await findByText(container, 'continue')
    expect(continueButton).toBeDefined()
    userEvent.click(continueButton)
    // Second step
    const artifactConnectorLabel = await findByText(container, 'AWS connector')
    expect(artifactConnectorLabel).toBeDefined()
    const secondStepContinueButton = await findByText(container, 'continue')
    expect(secondStepContinueButton).toBeDefined()
    fireEvent.click(secondStepContinueButton)
    // Last step
    const bucketNameInput = queryByAttribute('name', container, 'bucketName')
    expect(bucketNameInput).toBeDefined()
    const filePathInput = queryByAttribute('name', container, 'filePath')
    expect(filePathInput).toBeDefined()
  })
})
