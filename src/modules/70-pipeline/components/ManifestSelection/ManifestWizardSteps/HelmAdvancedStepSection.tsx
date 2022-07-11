/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import {
  Layout,
  Button,
  FormInput,
  MultiTypeInputType,
  getMultiTypeFromValue,
  ButtonVariation,
  SelectOption
} from '@wings-software/uicore'
import cx from 'classnames'

import { v4 as nameSpace, v5 as uuid } from 'uuid'
import { FieldArray, FormikValues } from 'formik'

import { String, useStrings } from 'framework/strings'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { FormMultiTypeCheckboxField } from '@common/components'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'

import { useHelmCmdFlags } from 'services/cd-ng'
import { useDeepCompareEffect } from '@common/hooks'
import { MonacoTextField } from '@common/components/MonacoTextField/MonacoTextField'
import type { CommandFlags, HelmOCIVersionOptions, HelmVersionOptions } from '../ManifestInterface'

import helmcss from './HelmWithGIT/HelmWithGIT.module.scss'
import css from './ManifestWizardSteps.module.scss'
interface HelmAdvancedStepProps {
  expressions: string[]
  allowableTypes: MultiTypeInputType[]
  formik: FormikValues
  isReadonly?: boolean
  deploymentType: string
  helmVersion: HelmVersionOptions | HelmOCIVersionOptions
  helmStore: string
}

function HelmAdvancedStepSection({
  formik,
  expressions,
  allowableTypes,
  isReadonly,
  deploymentType,
  helmVersion,
  helmStore
}: HelmAdvancedStepProps): React.ReactElement {
  const { getString } = useStrings()
  const defaultValueToReset = [{ commandType: '', flag: '', id: uuid('', nameSpace()) }]
  const [commandFlagOptions, setCommandFlagOptions] = useState<Record<string, SelectOption[]>>({ V2: [], V3: [] })

  const { data: commandFlags, refetch: refetchCommandFlags } = useHelmCmdFlags({
    queryParams: {
      serviceSpecType: deploymentType as string,
      version: helmVersion,
      storeType: helmStore
    },
    lazy: true
  })

  useEffect(() => {
    if (!commandFlagOptions[helmVersion]?.length) {
      refetchCommandFlags()
    }
  }, [helmVersion])

  useDeepCompareEffect(() => {
    const commandFlagSelectOption = {
      ...commandFlagOptions,
      [helmVersion]: commandFlags?.data?.map(commandFlag => ({ label: commandFlag, value: commandFlag }))
    }
    setCommandFlagOptions(commandFlagSelectOption as Record<string, SelectOption[]>)
  }, [commandFlags?.data])

  const commandFlagLabel = (): React.ReactElement => {
    return (
      <Layout.Horizontal flex spacing="small">
        <String tagName="div" stringID="pipeline.manifestType.helmCommandFlagLabel" />
      </Layout.Horizontal>
    )
  }

  return (
    <div className={helmcss.helmAdvancedSteps}>
      <Layout.Horizontal width={'90%'} flex={{ justifyContent: 'flex-start', alignItems: 'center' }}>
        <FormMultiTypeCheckboxField
          name="skipResourceVersioning"
          label={getString('skipResourceVersion')}
          className={cx(helmcss.checkbox, helmcss.halfWidth)}
          multiTypeTextbox={{ expressions, allowableTypes }}
        />
        {getMultiTypeFromValue(formik.values?.skipResourceVersioning) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            value={(formik.values?.skipResourceVersioning || '') as string}
            type="String"
            variableName="skipResourceVersioning"
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            onChange={value => formik.setFieldValue('skipResourceVersioning', value)}
            style={{ alignSelf: 'center', marginTop: 11 }}
            className={cx(css.addmarginTop)}
            isReadonly={isReadonly}
          />
        )}
      </Layout.Horizontal>
      {commandFlagOptions[helmVersion]?.length > 0 && (
        <div className={helmcss.commandFlags}>
          <MultiTypeFieldSelector
            defaultValueToReset={defaultValueToReset}
            name={'commandFlags'}
            label={commandFlagLabel()}
            disableTypeSelection
          >
            <FieldArray
              name="commandFlags"
              render={({ push, remove }) => (
                <Layout.Vertical>
                  {formik.values?.commandFlags?.map((commandFlag: CommandFlags, index: number) => (
                    <Layout.Horizontal key={commandFlag.id} margin={{ top: 'medium' }}>
                      <div
                        className={cx(helmcss.commandType, {
                          [helmcss.commandFlagType]: index !== 0
                        })}
                      >
                        <FormInput.Select
                          name={`commandFlags[${index}].commandType`}
                          label={index === 0 ? getString('pipeline.fieldLabels.commandType') : ''}
                          items={commandFlagOptions[helmVersion]}
                          placeholder={getString('pipeline.fieldPlaceholders.commandType')}
                        />
                      </div>
                      <div
                        className={cx({
                          [helmcss.helmCommandFlags]: index !== 0
                        })}
                      >
                        <Layout.Horizontal flex={{ justifyContent: 'flex-start' }}>
                          <MultiTypeFieldSelector
                            name={`commandFlags[${index}].flag`}
                            label={index === 0 ? getString('flag') : ''}
                            allowedTypes={allowableTypes}
                            style={{ width: 450 }}
                            skipRenderValueInExpressionLabel
                            expressionRender={() => (
                              <MonacoTextField
                                name={`commandFlags[${index}].flag`}
                                expressions={expressions}
                                height={80}
                                fullScreenAllowed
                                fullScreenTitle={getString('flag')}
                              />
                            )}
                          >
                            <MonacoTextField
                              name={`commandFlags[${index}].flag`}
                              expressions={expressions}
                              height={80}
                              fullScreenAllowed
                              fullScreenTitle={getString('flag')}
                            />
                          </MultiTypeFieldSelector>

                          {index !== 0 && (
                            <Button
                              minimal
                              icon="main-trash"
                              className={cx({
                                [helmcss.delBtn]: index === 0
                              })}
                              onClick={() => remove(index)}
                            />
                          )}
                        </Layout.Horizontal>
                      </div>
                    </Layout.Horizontal>
                  ))}
                  {!!(formik.values?.commandFlags?.length < commandFlagOptions[helmVersion].length) && (
                    <span>
                      <Button
                        minimal
                        text={getString('add')}
                        variation={ButtonVariation.PRIMARY}
                        onClick={() => push({ commandType: '', flag: '', id: uuid('', nameSpace()) })}
                      />
                    </span>
                  )}
                </Layout.Vertical>
              )}
            />
          </MultiTypeFieldSelector>
        </div>
      )}
    </div>
  )
}

export default HelmAdvancedStepSection
