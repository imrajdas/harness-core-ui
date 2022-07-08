/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FormEvent } from 'react'
import { PopoverPosition, Radio, RadioGroup } from '@blueprintjs/core'
import { Icon, Layout, Text } from '@wings-software/uicore'
import cx from 'classnames'
import { useStrings } from 'framework/strings'
import css from './RunPipelineForm.module.scss'

interface SelectExistingInputsOrProvideNewProps {
  existingProvide: string
  onExistingProvideRadioChange: (e: FormEvent<HTMLInputElement>) => void
}

function SelectExistingInputsOrProvideNew({
  existingProvide,
  onExistingProvideRadioChange
}: SelectExistingInputsOrProvideNewProps): React.ReactElement {
  const { getString } = useStrings()
  return (
    <div>
      <Layout.Horizontal className={css.runModalSubHeading} id="use-input-set">
        <RadioGroup
          name="existingProvideRadio"
          label={getString('pipeline.pipelineInputPanel.selectedExisitingOrProvide')}
          inline
          selectedValue={existingProvide}
          onChange={onExistingProvideRadioChange}
        >
          <Radio
            label={getString('pipeline.pipelineInputPanel.provide')}
            value="provide"
            className={cx(css.valueProviderRadio, existingProvide === 'provide' ? css.selectedValueProvider : '')}
          />
          <Radio
            label={getString('pipeline.pipelineInputPanel.existing')}
            value="existing"
            className={cx(css.valueProviderRadio, existingProvide === 'existing' ? css.selectedValueProvider : '')}
          />
        </RadioGroup>
        <span className={css.helpSection}>
          <Icon name="question" className={css.helpIcon} intent="primary" />
          <Text
            data-testid="input-set-description-tooltip"
            tooltipProps={{
              position: PopoverPosition.BOTTOM
            }}
            tooltip={
              <Text padding="medium" width={400}>
                {getString('pipeline.inputSets.aboutInputSets')}
                <a
                  href="https://docs.harness.io/article/3fqwa8et3d-input-sets"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {getString('learnMore')}
                </a>
              </Text>
            }
          >
            {getString('pipeline.pipelineInputPanel.whatAreInputsets')}
          </Text>
        </span>
      </Layout.Horizontal>
    </div>
  )
}

export default SelectExistingInputsOrProvideNew
