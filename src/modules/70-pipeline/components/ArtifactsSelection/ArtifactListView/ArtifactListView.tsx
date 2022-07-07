/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback } from 'react'
import {
  Layout,
  Text,
  Icon,
  getMultiTypeFromValue,
  MultiTypeInputType,
  Button,
  ButtonSize,
  ButtonVariation,
  Container
} from '@wings-software/uicore'
import cx from 'classnames'
import { Color, FontVariation } from '@harness/design-system'
import { defaultTo } from 'lodash-es'
import { useStrings } from 'framework/strings'
import { getConnectorNameFromValue, getStatus } from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilderUtil'
import type { PrimaryArtifact, SidecarArtifact, SidecarArtifactWrapper } from 'services/cd-ng'
import {
  ArtifactIconByType,
  ArtifactTitleIdByType,
  ENABLED_ARTIFACT_TYPES,
  ModalViewFor
} from '@pipeline/components/ArtifactsSelection/ArtifactHelper'
import type { ArtifactListViewProps, ArtifactType } from '../ArtifactInterface'
import { showConnectorStep } from '../ArtifactUtils'
import css from '../ArtifactsSelection.module.scss'

const getArtifactLocation = (artifact: PrimaryArtifact | SidecarArtifact): string => {
  if (artifact.type === 'AmazonS3') {
    return artifact.spec.filePath ?? artifact.spec.filePathRegex
  }
  return (
    artifact.spec.imagePath ??
    artifact.spec.artifactPath ??
    artifact.spec.artifactPathFilter ??
    artifact.spec.repository
  )
}

function ArtifactRepositoryTooltip({
  artifactType,
  artifactConnectorName,
  artifactConnectorRef
}: {
  artifactType: ArtifactType
  artifactConnectorName?: string
  artifactConnectorRef: string
}): React.ReactElement | null {
  if (artifactType === ENABLED_ARTIFACT_TYPES.CustomArtifact) {
    return null
  }
  return (
    <Container className={css.borderRadius} padding="medium">
      <div>
        <Text font="small" color={Color.GREY_100}>
          {artifactConnectorName}
        </Text>
        <Text font="small" color={Color.GREY_300}>
          {artifactConnectorRef}
        </Text>
      </div>
    </Container>
  )
}

function ArtifactListView({
  accountId,
  fetchedConnectorResponse,
  primaryArtifact,
  sideCarArtifact,
  isReadonly,
  editArtifact,
  removePrimary,
  removeSidecar,
  addNewArtifact,
  isAdditionAllowed
}: ArtifactListViewProps): React.ReactElement {
  const { getString } = useStrings()
  const { color: primaryConnectorColor } = getStatus(
    primaryArtifact?.spec?.connectorRef,
    fetchedConnectorResponse,
    accountId
  )
  const primaryConnectorName = getConnectorNameFromValue(primaryArtifact?.spec?.connectorRef, fetchedConnectorResponse)

  const getPrimaryArtifactRepository = useCallback(
    (artifactType: ArtifactType): string => {
      if (artifactType === ENABLED_ARTIFACT_TYPES.CustomArtifact) {
        return getString('common.repo_provider.customLabel')
      }
      return defaultTo(primaryConnectorName, primaryArtifact?.spec?.connectorRef)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [primaryArtifact?.spec?.connectorRef, primaryConnectorName]
  )

  return (
    <Layout.Vertical style={{ width: '100%' }}>
      <Layout.Vertical spacing="small" style={{ flexShrink: 'initial' }}>
        {!!(sideCarArtifact?.length || primaryArtifact?.type) && (
          <div className={cx(css.artifactList, css.listHeader)}>
            <span></span>
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>
              {getString('pipeline.artifactsSelection.artifactType')}
            </Text>
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('artifactRepository')}</Text>
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('location')}</Text>
            <span></span>
          </div>
        )}

        <Layout.Vertical style={{ flexShrink: 'initial' }}>
          <section>
            {primaryArtifact && (
              <section className={cx(css.artifactList, css.rowItem)} key={'Dockerhub'}>
                <div>
                  <Text width={200} className={css.type} color={Color.BLACK} lineClamp={1}>
                    {getString('primary')}
                  </Text>
                </div>
                <div>{getString(ArtifactTitleIdByType[primaryArtifact?.type])}</div>
                <div className={css.connectorNameField}>
                  <Icon padding={{ right: 'small' }} name={ArtifactIconByType[primaryArtifact.type]} size={18} />
                  <Text
                    tooltip={
                      <ArtifactRepositoryTooltip
                        artifactConnectorName={primaryConnectorName}
                        artifactConnectorRef={primaryArtifact.spec?.connectorRef}
                        artifactType={primaryArtifact.type}
                      />
                    }
                    tooltipProps={{ isDark: true }}
                    alwaysShowTooltip={showConnectorStep(primaryArtifact.type)}
                    className={css.connectorName}
                    lineClamp={1}
                  >
                    {getPrimaryArtifactRepository(primaryArtifact.type)}
                  </Text>

                  {getMultiTypeFromValue(primaryArtifact.spec?.connectorRef) === MultiTypeInputType.FIXED && (
                    <Icon name="full-circle" size={8} color={primaryConnectorColor} />
                  )}
                </div>
                <div>
                  <Text lineClamp={1} color={Color.GREY_500}>
                    {getArtifactLocation(primaryArtifact)}
                  </Text>
                </div>
                {!isReadonly && (
                  <Layout.Horizontal>
                    <Button
                      icon="Edit"
                      minimal
                      iconProps={{ size: 18 }}
                      onClick={() => editArtifact(ModalViewFor.PRIMARY, primaryArtifact.type)}
                    />
                    <Button iconProps={{ size: 18 }} minimal icon="main-trash" onClick={removePrimary} />
                  </Layout.Horizontal>
                )}
              </section>
            )}
          </section>
          {sideCarArtifact && sideCarArtifact?.length > 0 && (
            <section>
              {sideCarArtifact?.map((data: SidecarArtifactWrapper, index: number) => {
                const { sidecar } = data
                const { color: sideCarConnectionColor } = getStatus(
                  sidecar?.spec?.connectorRef,
                  fetchedConnectorResponse,
                  accountId
                )
                const sidecarConnectorName = getConnectorNameFromValue(
                  sidecar?.spec?.connectorRef,
                  fetchedConnectorResponse
                )

                const getSidecarArtifactRepository = (artifactType: ArtifactType): string => {
                  if (artifactType === ENABLED_ARTIFACT_TYPES.CustomArtifact) {
                    return getString('common.repo_provider.customLabel')
                  }
                  return sidecarConnectorName ?? sidecar?.spec?.connectorRef
                }

                return (
                  <section className={cx(css.artifactList, css.rowItem)} key={`${sidecar?.identifier}-${index}`}>
                    <div>
                      <Text width={200} className={css.type} color={Color.BLACK} lineClamp={1}>
                        {getString('sidecar')}
                        <Text lineClamp={1} className={css.artifactId}>
                          ({getString('common.ID')}: {sidecar?.identifier})
                        </Text>
                      </Text>
                    </div>
                    <div>{getString(ArtifactTitleIdByType[sidecar?.type as ArtifactType])}</div>
                    <div className={css.connectorNameField}>
                      <Icon
                        padding={{ right: 'small' }}
                        name={ArtifactIconByType[sidecar?.type as ArtifactType]}
                        size={18}
                      />
                      <Text
                        className={css.connectorName}
                        lineClamp={1}
                        tooltip={
                          <ArtifactRepositoryTooltip
                            artifactConnectorName={sidecarConnectorName}
                            artifactConnectorRef={sidecar?.spec?.connectorRef}
                            artifactType={sidecar?.type as ArtifactType}
                          />
                        }
                        tooltipProps={{ isDark: true }}
                        alwaysShowTooltip={showConnectorStep(sidecar?.type as ArtifactType)}
                      >
                        {getSidecarArtifactRepository(sidecar?.type as ArtifactType)}
                      </Text>
                      {getMultiTypeFromValue(sidecar?.spec?.connectorRef) === MultiTypeInputType.FIXED && (
                        <Icon name="full-circle" size={8} color={sideCarConnectionColor} />
                      )}
                    </div>
                    <div>
                      <Text lineClamp={1} style={{ color: Color.GREY_500 }}>
                        {getArtifactLocation(sidecar as SidecarArtifact)}
                      </Text>
                    </div>
                    {!isReadonly && (
                      <span>
                        <Layout.Horizontal>
                          <Button
                            icon="Edit"
                            minimal
                            iconProps={{ size: 18 }}
                            onClick={() => {
                              editArtifact(ModalViewFor.SIDECAR, sidecar?.type as ArtifactType, index)
                            }}
                          />
                          <Button
                            iconProps={{ size: 18 }}
                            icon="main-trash"
                            minimal
                            onClick={() => removeSidecar(index)}
                          />
                        </Layout.Horizontal>
                      </span>
                    )}
                  </section>
                )
              })}
            </section>
          )}
        </Layout.Vertical>
      </Layout.Vertical>

      <Layout.Vertical spacing={'medium'} flex={{ alignItems: 'flex-start' }}>
        {!primaryArtifact && isAdditionAllowed && (
          <Button
            className={css.addArtifact}
            id="add-artifact"
            size={ButtonSize.SMALL}
            variation={ButtonVariation.LINK}
            onClick={() => addNewArtifact(ModalViewFor.PRIMARY)}
            text={getString('pipelineSteps.serviceTab.artifactList.addPrimary')}
          />
        )}
        {isAdditionAllowed && (
          <Button
            className={css.addArtifact}
            id="add-artifact"
            size={ButtonSize.SMALL}
            variation={ButtonVariation.LINK}
            onClick={() => addNewArtifact(ModalViewFor.SIDECAR)}
            text={getString('pipelineSteps.serviceTab.artifactList.addSidecar')}
          />
        )}
      </Layout.Vertical>
    </Layout.Vertical>
  )
}

export default ArtifactListView
