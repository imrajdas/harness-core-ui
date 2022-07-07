/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { FilterDataInterface, FilterInterface } from '@common/components/Filter/Constants'
import type { EmbeddedUserDetailsDTO, FilesFilterProperties, FilterDTO } from 'services/cd-ng'
import { StringUtils } from '@common/exports'

export type FileStoreFilterFormType = Omit<FilesFilterProperties, 'createdBy' | 'referencedBy'> & {
  createdBy?: string
  referencedBy?: string
  referenceName?: string
}

export const createRequestBodyPayload = ({
  isUpdate,
  data,
  projectIdentifier,
  orgIdentifier,
  createdByList
}: {
  isUpdate: boolean
  data: FilterDataInterface<FileStoreFilterFormType, FilterInterface>
  projectIdentifier?: string | undefined
  orgIdentifier?: string | undefined
  createdByList: EmbeddedUserDetailsDTO[]
}): FilterDTO => {
  const {
    metadata: { name: _name, filterVisibility, identifier },
    formValues
  } = data

  const createdBy = createdByList.find(user => formValues.createdBy === user.email)

  return {
    name: _name,
    identifier: isUpdate ? identifier : StringUtils.getIdentifierFromName(_name),
    projectIdentifier,
    orgIdentifier,
    filterVisibility: filterVisibility,
    filterProperties: {
      createdBy: createdBy,
      ...(formValues.referencedBy && formValues.referenceName
        ? {
            referencedBy: {
              type: formValues.referencedBy,
              name: formValues.referenceName
            }
          }
        : {}),
      fileUsage: formValues.fileUsage,
      tags: formValues.tags,
      filterType: 'FileStore'
    } as FilesFilterProperties
  }
}
