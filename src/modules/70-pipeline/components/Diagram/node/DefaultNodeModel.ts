/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { CSSProperties } from 'react'
import { map } from 'lodash-es'
import { NodeModel, NodeModelGenerics, PortModelAlignment } from '@projectstorm/react-diagrams-core'
import type { BasePositionModelOptions, DeserializeEvent } from '@projectstorm/react-canvas-core'
import type { IconName } from '@wings-software/uicore'
import type { IconProps } from '@harness/icons'
import { DefaultPortModel } from '../port/DefaultPortModel'
import { DiagramType } from '../Constants'
import type { DefaultLinkModel } from '../link/DefaultLinkModel'

export interface DefaultNodeModelOptions extends BasePositionModelOptions {
  name: string
  customNodeStyle?: CSSProperties
  nodeClassName?: string
  width?: number
  height?: number
  identifier?: string
  icon?: IconName
  allowAdd?: boolean
  draggable?: boolean
  iconStyle?: CSSProperties
  iconProps?: Omit<IconProps, 'name'>
  canDelete?: boolean
  isInComplete?: boolean
  skipCondition?: string
  conditionalExecutionEnabled?: boolean
  loopingStrategyEnabled?: boolean
  isTemplate?: boolean
  secondaryIcon?: IconName | null
  secondaryIconProps?: Omit<IconProps, 'name'>
  secondaryIconStyle?: CSSProperties
  showPorts?: boolean
  hideInPort?: boolean
  hideOutPort?: boolean
  tertiaryIcon?: IconName
  tertiaryIconProps?: Omit<IconProps, 'name'>
  tertiaryIconStyle?: CSSProperties
  iconSize?: number
  defaultSelected?: boolean
  allowDropOnLink?: boolean
  allowDropOnNode?: boolean
  disableClick?: boolean
}

export interface DefaultNodeModelGenerics extends NodeModelGenerics {
  OPTIONS: DefaultNodeModelOptions
}

export class DefaultNodeModel<G extends DefaultNodeModelGenerics = DefaultNodeModelGenerics> extends NodeModel<G> {
  protected portsIn: DefaultPortModel[]
  protected portsOut: DefaultPortModel[]

  constructor(name: string, color: string, icon: IconName)
  constructor(options?: DefaultNodeModelOptions)
  constructor(options: any = {}) {
    if (typeof options === 'string') {
      options = {
        name: options
      }
    }
    super({
      type: DiagramType.Default,
      name: 'Untitled',
      icon: 'add',
      nodeClassName: '',
      allowAdd: false,
      iconProps: {},
      iconStyle: {},
      draggable: false,
      canDelete: true,
      secondaryIcon: 'command-echo',
      customNodeStyle: {},
      showPorts: true,
      width: 64,
      height: 64,
      allowDropOnLink: true,
      allowDropOnNode: true,
      ...options
    })
    this.portsOut = []
    this.portsIn = []
  }

  doClone(lookupTable: any, clone: any): void {
    clone.portsIn = []
    clone.portsOut = []
    super.doClone(lookupTable, clone)
  }

  removePort(port: DefaultPortModel): void {
    super.removePort(port)
    if (port.getOptions().in) {
      this.portsIn.splice(this.portsIn.indexOf(port), 1)
    } else {
      this.portsOut.splice(this.portsOut.indexOf(port), 1)
    }
  }

  addPort<T extends DefaultPortModel>(port: T): T {
    super.addPort(port)
    if (port.getOptions().in) {
      if (this.portsIn.indexOf(port) === -1) {
        this.portsIn.push(port)
      }
    } else {
      if (this.portsOut.indexOf(port) === -1) {
        this.portsOut.push(port)
      }
    }
    return port
  }

  addInPort(label: string, after = true): DefaultPortModel {
    const port = new DefaultPortModel({
      in: true,
      name: label,
      label: label,
      alignment: PortModelAlignment.LEFT
    })
    if (!after) {
      this.portsIn.splice(0, 0, port)
    }
    return this.addPort(port)
  }

  getIdentifier(): string {
    return this.options.identifier || ''
  }

  addOutPort(label: string, after = true): DefaultPortModel {
    const port = new DefaultPortModel({
      in: false,
      name: label,
      label: label,
      alignment: PortModelAlignment.RIGHT
    })
    if (!after) {
      this.portsOut.splice(0, 0, port)
    }
    return this.addPort(port)
  }

  setOptions(options: DefaultNodeModelOptions): void {
    this.options = options
  }

  deserialize(event: DeserializeEvent<this>): void {
    super.deserialize(event)
    this.options.name = event.data.name
    this.options.width = event.data.width
    this.options.height = event.data.height
    this.options.identifier = event.data.identifier
    this.options.customNodeStyle = { ...event.data.customNodeStyle }
    this.options.icon = event.data.icon
    this.options.allowAdd = event.data.allowAdd
    this.options.canDelete = event.data.canDelete
    this.options.draggable = event.data.draggable
    this.options.iconProps = { ...event.data.iconProps }
    this.options.isInComplete = event.data.isInComplete
    this.options.secondaryIcon = event.data.secondaryIcon
    this.options.secondaryIconProps = { ...event.data.secondaryIconProps }
    this.options.secondaryIconStyle = { ...event.data.secondaryIconStyle }
    this.options.tertiaryIcon = event.data.tertiaryIcon
    this.options.tertiaryIconProps = { ...event.data.tertiaryIconProps }
    this.options.tertiaryIconStyle = { ...event.data.tertiaryIconStyle }
    this.portsIn = map(event.data.portsInOrder, id => {
      return this.getPortFromID(id)
    }) as DefaultPortModel[]
    this.portsOut = map(event.data.portsOutOrder, id => {
      return this.getPortFromID(id)
    }) as DefaultPortModel[]
  }

  serialize(): any {
    return {
      ...super.serialize(),
      name: this.options.name,
      width: this.options.width,
      height: this.options.height,
      identifier: this.options.identifier,
      customNodeStyle: { ...this.options.customNodeStyle },
      icon: this.options.icon,
      allowAdd: this.options.allowAdd,
      canDelete: this.options.canDelete,
      draggable: this.options.draggable,
      isInComplete: this.options.isInComplete,
      iconProps: { ...this.options.iconProps },
      secondaryIcon: this.options.secondaryIcon,
      secondaryIconProps: { ...this.options.secondaryIconProps },
      secondaryIconStyle: { ...this.options.secondaryIconStyle },
      portsInOrder: map(this.portsIn, port => {
        return port.getID()
      }),
      portsOutOrder: map(this.portsOut, port => {
        return port.getID()
      })
    }
  }

  getInPorts(): DefaultPortModel[] {
    return this.portsIn
  }

  getOutPorts(): DefaultPortModel[] {
    return this.portsOut
  }
}

export interface DefaultNodeEvent {
  entity: DefaultNodeModel
  isSelected: boolean
  callback: () => void
  target: HTMLElement
  firing: boolean
  stopPropagation: () => void
}

export interface DefaultLinkEvent {
  entity: DefaultLinkModel
  isSelected: boolean
  callback: () => void
  firing: boolean
  stopPropagation: () => void
}
