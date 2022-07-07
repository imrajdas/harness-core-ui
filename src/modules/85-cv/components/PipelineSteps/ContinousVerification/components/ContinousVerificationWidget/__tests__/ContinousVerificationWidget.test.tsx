/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { validateMonitoredService } from '../ContinousVerificationWidget.utils'
import {
  expectedErrorsForEmptyTemplateInputs,
  mockedTemplateInputs,
  mockedTemplateInputsToValidate
} from './ContinousVerificationWidget.mock'

describe('Unit tests for ContinousVerificationWidget Utils', () => {
  const type = 'Default'
  const stepViewType = StepViewType.Edit
  const monitoredServiceRef = ''
  const errors = {}
  const healthSources: any = []
  const getString = (key: string): string => key
  const monitoredServiceTemplateRef = ''
  const templateInputsToValidate = {}
  const templateInputs = {}

  test('if validateMonitoredService function validates the default monitored service correctly when no monitored service is present', async () => {
    const expectedErrors = {
      spec: {
        monitoredServiceRef: 'Monitored service is required'
      }
    }
    expect(
      validateMonitoredService(
        type,
        stepViewType,
        monitoredServiceRef,
        errors,
        healthSources,
        getString,
        monitoredServiceTemplateRef,
        templateInputsToValidate,
        templateInputs
      )
    ).toEqual(expectedErrors)
  })

  test('if validateMonitoredService function validates the default monitored service correctly when monitored service is present and health source is not present', async () => {
    const newMonitoredServiceRef = 'splunk_prod'
    const expectedErrors = {
      spec: {
        healthSources: 'connectors.cdng.validations.healthSourceRequired'
      }
    }
    expect(
      validateMonitoredService(
        type,
        stepViewType,
        newMonitoredServiceRef,
        errors,
        healthSources,
        getString,
        monitoredServiceTemplateRef,
        templateInputsToValidate,
        templateInputs
      )
    ).toEqual(expectedErrors)
  })

  test('if validateMonitoredService function validates the configured monitored service correctly when no monitored service is present', async () => {
    const newType = 'Configured'
    const expectedErrors = {
      spec: {
        monitoredService: {
          spec: {
            monitoredServiceRef: 'Monitored service is required'
          }
        }
      }
    }
    expect(
      validateMonitoredService(
        newType,
        stepViewType,
        monitoredServiceRef,
        errors,
        healthSources,
        getString,
        monitoredServiceTemplateRef,
        templateInputsToValidate,
        templateInputs
      )
    ).toEqual(expectedErrors)
  })

  test('if validateMonitoredService function validates the configured monitored service correctly when monitored service is present and health source is not present', async () => {
    const newMonitoredServiceRef = 'splunk_prod'
    const expectedErrors = {
      spec: {
        healthSources: 'connectors.cdng.validations.healthSourceRequired'
      }
    }
    expect(
      validateMonitoredService(
        type,
        stepViewType,
        newMonitoredServiceRef,
        errors,
        healthSources,
        getString,
        monitoredServiceTemplateRef,
        templateInputsToValidate,
        templateInputs
      )
    ).toEqual(expectedErrors)
  })

  test('if validateMonitoredService function validates the templatised monitored service correctly when template is not selected', async () => {
    const templateType = 'Template'
    const expectedErrors = {
      spec: {
        monitoredService: {
          type: 'Template Selection is required.'
        }
      }
    }
    expect(
      validateMonitoredService(
        templateType,
        stepViewType,
        monitoredServiceRef,
        errors,
        healthSources,
        getString,
        monitoredServiceTemplateRef,
        templateInputsToValidate,
        templateInputs
      )
    ).toEqual(expectedErrors)
  })

  test('if validateMonitoredService function validates the templatised monitored service correctly templateInputs are empty', async () => {
    const templateType = 'Template'
    expect(
      validateMonitoredService(
        templateType,
        stepViewType,
        monitoredServiceRef,
        errors,
        healthSources,
        getString,
        monitoredServiceTemplateRef,
        mockedTemplateInputsToValidate,
        mockedTemplateInputs
      )
    ).toEqual(expectedErrorsForEmptyTemplateInputs)
  })
})
