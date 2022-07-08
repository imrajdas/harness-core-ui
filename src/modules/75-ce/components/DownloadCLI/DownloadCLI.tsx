/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { isEmpty as _isEmpty } from 'lodash-es'
import { Button, Layout, Select, SelectOption, Text } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import css from './DownloadCLI.module.scss'

enum OS {
  Mac = 'Mac',
  Windows = 'Windows',
  Linux = 'Linux',
  Darwin = 'darwin'
}

enum Arch {
  AMD64 = 'amd64',
  ARM64 = 'arm64',
  A386 = 386
}

const dropdownOptions: SelectOption[] = [
  {
    label: `${OS.Mac} (${Arch.AMD64})`,
    value: `${OS.Darwin}-${Arch.AMD64}`
  },
  {
    label: `${OS.Mac} (${Arch.ARM64})`,
    value: `${OS.Darwin}-${Arch.ARM64}`
  },
  {
    label: `${OS.Linux} (${Arch.AMD64})`,
    value: `${OS.Linux.toLowerCase()}-${Arch.AMD64}`
  },
  {
    label: `${OS.Linux} (${Arch.ARM64})`,
    value: `${OS.Linux.toLowerCase()}-${Arch.ARM64}`
  },
  {
    label: `${OS.Linux} (${Arch.A386})`,
    value: `${OS.Linux.toLowerCase()}-${Arch.A386}`
  },
  {
    label: `${OS.Windows} (${Arch.A386})`,
    value: `${OS.Windows.toLowerCase()}-${Arch.A386}`
  },
  {
    label: `${OS.Windows} (${Arch.AMD64})`,
    value: `${OS.Windows.toLowerCase()}-${Arch.AMD64}`
  }
]

const DownloadCLI: React.FC = () => {
  const { getString } = useStrings()
  const { accountId } = useParams<{ accountId: string }>()
  const [assetLink, setAssetLink] = React.useState<SelectOption | null>(null)

  React.useEffect(() => {
    const defaultOs = navigator.appVersion.includes(OS.Mac.valueOf())
      ? OS.Mac
      : navigator.appVersion.includes(OS.Windows.valueOf())
      ? OS.Windows
      : navigator.appVersion.includes(OS.Linux.valueOf())
      ? OS.Linux
      : null

    if (defaultOs) {
      setAssetLink(dropdownOptions.find(item => item.label.includes(defaultOs)) as SelectOption)
    }
  }, [])

  const downloadAsset = async () => {
    const [platform, arch] = ((assetLink?.value || '') as string).split('-')
    const linkEl: HTMLAnchorElement = document.createElement('a')
    linkEl.href = `${window.location.origin}/gateway/lw/api/internal/downloads/harness_cli?platform=${platform}&arch=${arch}&accountIdentifier=${accountId}`
    linkEl.click()
  }

  const handleOsSelectChange = (option: SelectOption) => {
    setAssetLink(option)
  }
  return (
    <div>
      <Text className={css.text}>
        {getString('ce.co.sshSetup')}
        <span>
          <a
            href=" https://docs.harness.io/article/7025n9ml7z-create-autostopping-rules-aws#setup_access_using_ssh_rdp"
            target="_blank"
          >
            Read More
          </a>
        </span>
      </Text>
      <Layout.Horizontal className={css.downloadCliContainer}>
        <div className={css.selectContainer}>
          <Select items={dropdownOptions} onChange={handleOsSelectChange} value={assetLink} name={'sshOs'} />
        </div>
        <Button className={css.downloadBtn} onClick={downloadAsset} disabled={_isEmpty(assetLink)}>
          {'Download CLI'}
        </Button>
      </Layout.Horizontal>
    </div>
  )
}

export default DownloadCLI
