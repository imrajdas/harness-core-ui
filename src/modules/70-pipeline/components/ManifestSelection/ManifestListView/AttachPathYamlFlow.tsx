/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback } from 'react'
import {
  Button,
  Text,
  ButtonSize,
  ButtonVariation,
  Dialog,
  Formik,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  Icon
} from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import { Form } from 'formik'
import * as Yup from 'yup'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import { useStrings } from 'framework/strings'
import type { ConnectorConfigDTO } from 'services/cd-ng'
import { ManifestStoreMap, ManifestToPathLabelMap, ManifestToPathMap } from '../Manifesthelper'
import type { ManifestStores, PrimaryManifestType } from '../ManifestInterface'
import DragnDropPaths from '../DragnDropPaths'
import css from '../ManifestSelection.module.scss'

interface AttachPathYamlFlowType {
  renderConnectorField: JSX.Element
  manifestType: PrimaryManifestType
  manifestStore: ManifestStores
  allowableTypes: MultiTypeInputType[]
  expressions: string[]
  attachPathYaml: (formData: ConnectorConfigDTO) => void
  removeValuesYaml: (index: number) => void
  valuesPaths: string[]
  isReadonly: boolean
}

function AttachPathYamlFlow({
  renderConnectorField,
  manifestType,
  manifestStore,
  valuesPaths,
  expressions,
  allowableTypes,
  attachPathYaml,
  removeValuesYaml,
  isReadonly
}: AttachPathYamlFlowType): React.ReactElement | null {
  const { getString } = useStrings()

  const getInitialValues = useCallback(() => {
    return {
      valuesPaths:
        typeof valuesPaths === 'string'
          ? valuesPaths
          : valuesPaths?.map((path: string) => ({ path, uuid: uuid(path, nameSpace()) }))
    }
  }, [valuesPaths])

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog enforceFocus={false} isOpen={true} onClose={hideModal}>
        <Formik
          initialValues={getInitialValues()}
          formName="manifestPath"
          validationSchema={Yup.object().shape({
            valuesPaths: Yup.lazy((value): Yup.Schema<unknown> => {
              if (getMultiTypeFromValue(value as any) === MultiTypeInputType.FIXED) {
                return Yup.array().of(
                  Yup.object().shape({
                    path: Yup.string().min(1).required(getString('pipeline.manifestType.pathRequired'))
                  })
                )
              }
              return Yup.string().required(getString('pipeline.manifestType.pathRequired'))
            })
          })}
          onSubmit={formData => {
            const pathYamlData =
              typeof (formData as ConnectorConfigDTO)?.valuesPaths === 'string'
                ? (formData as ConnectorConfigDTO)?.valuesPaths
                : (formData as ConnectorConfigDTO)?.valuesPaths?.map((path: { path: string }) => path.path)
            attachPathYaml(pathYamlData)
            hideModal()
          }}
          enableReinitialize={true}
        >
          {formik => (
            <Form>
              <Layout.Vertical>
                <DragnDropPaths
                  formik={formik}
                  expressions={expressions}
                  allowableTypes={allowableTypes}
                  fieldPath="valuesPaths"
                  pathLabel={ManifestToPathLabelMap[manifestType] && getString(ManifestToPathLabelMap[manifestType])}
                  placeholder={getString('pipeline.manifestType.pathPlaceholder')}
                  defaultValue={{ path: '', uuid: uuid('', nameSpace()) }}
                />
                <Layout.Horizontal>
                  <Button
                    variation={ButtonVariation.PRIMARY}
                    type="submit"
                    text={getString('submit')}
                    rightIcon="chevron-right"
                  />
                </Layout.Horizontal>
              </Layout.Vertical>
            </Form>
          )}
        </Formik>
      </Dialog>
    ),
    [valuesPaths]
  )

  if (ManifestToPathMap[manifestType] && manifestStore !== ManifestStoreMap.Harness) {
    return (
      <section className={css.valuesList}>
        {getMultiTypeFromValue(valuesPaths) === MultiTypeInputType.FIXED ? (
          valuesPaths?.map((valuesPathValue: string, index: number) => (
            <section className={css.valuesListItem} key={`${valuesPathValue}-${index}`}>
              <div className={css.valuesPathList}>
                <Layout.Horizontal>
                  <Text inline lineClamp={1} width={25}>
                    {index + 1}.
                  </Text>
                  <Icon name="valuesFIle" inline padding={{ right: 'medium' }} size={24} />
                  <Text lineClamp={1}>{valuesPathValue}</Text>
                </Layout.Horizontal>
                {renderConnectorField}
                {!isReadonly && (
                  <span>
                    <Layout.Horizontal>
                      <Button icon="Edit" iconProps={{ size: 14 }} onClick={showModal} minimal />
                      <Button
                        iconProps={{ size: 14 }}
                        icon="main-trash"
                        onClick={() => removeValuesYaml(index)}
                        minimal
                      />
                    </Layout.Horizontal>
                  </span>
                )}
              </div>
            </section>
          ))
        ) : (
          <div className={css.valuesPathList}>
            {`${
              ManifestToPathLabelMap[manifestType] && getString(ManifestToPathLabelMap[manifestType])
            }: ${valuesPaths}`}
          </div>
        )}
        {!isReadonly && (
          <Button
            className={css.addValuesYaml}
            id="add-manifest"
            size={ButtonSize.SMALL}
            variation={ButtonVariation.LINK}
            onClick={showModal}
            text={getString('pipeline.manifestType.attachPath', {
              manifestPath: ManifestToPathMap[manifestType]
            })}
          />
        )}
      </section>
    )
  }
  return null
}

export default AttachPathYamlFlow
