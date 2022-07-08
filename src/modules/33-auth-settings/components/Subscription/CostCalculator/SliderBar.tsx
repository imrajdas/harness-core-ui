/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Slider } from '@blueprintjs/core'
import { DropDown, Layout, TextInput, SelectOption } from '@harness/uicore'
import css from './CostCalculator.module.scss'

interface SliderWrapperProps {
  min: number
  max: number
  stepSize: number
  labelStepSize: number
  value: number
  onChange: (value: number) => void
}
const SliderWrapper: React.FC<SliderWrapperProps> = ({ min, max, stepSize, labelStepSize, value, onChange }) => {
  return (
    <Slider
      className={css.slider}
      min={min}
      max={max}
      stepSize={stepSize}
      value={value}
      onChange={onChange}
      labelStepSize={labelStepSize}
    />
  )
}

interface SliderBarProps {
  min: number
  max: number
  stepSize: number
  labelStepSize: number
  list?: number[]
  value: number
  setValue: (value: number) => void
  unit?: string
}

const SliderBar: React.FC<SliderBarProps> = ({ min, max, stepSize, labelStepSize, list, value, setValue, unit }) => {
  const dropdownList = React.useMemo(() => {
    return (
      list?.reduce((accumulator: SelectOption[], current) => {
        accumulator.push({
          label: `${current.toString()}${unit}`,
          value: current + ''
        } as SelectOption)
        return accumulator
      }, []) || []
    )
  }, [list, unit])

  return (
    <Layout.Horizontal spacing={'large'}>
      <SliderWrapper
        min={min}
        max={max}
        stepSize={stepSize}
        value={value}
        onChange={newValue => {
          setValue(newValue)
        }}
        labelStepSize={labelStepSize}
      />
      {list ? (
        <DropDown
          buttonTestId="slider-dropdown"
          filterable={false}
          width={70}
          items={dropdownList}
          value={value.toString()}
          onChange={selected => setValue(Number(selected.value))}
          placeholder={`  ${unit}`}
          className={css.dropdown}
        />
      ) : (
        <TextInput
          data-testid="slider-input"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(Number(e.target.value))}
          value={value.toString()}
          className={css.textInput}
        />
      )}
    </Layout.Horizontal>
  )
}

export default SliderBar
