/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_PAGE_SIZE = 10

interface GetItemsWithOffset {
  offset?: number
  limit?: number
}

interface InfiniteScrollProps {
  // getItems is a function promise that will resolve to an array of items to be displayed
  getItems: (options: GetItemsWithOffset) => Promise<any>

  /*
  ref of the element which when visible in the DOM shall trigger the next call
  to bring the next set of data. Check the usage in TemplateActivityLog
  */
  loadMoreRef: MutableRefObject<Element | null>

  // limit prop for defining the size of pagination, default is DEFAULT_PAGE_SIZE
  limit?: number

  // search term prop to get results with the search term as substring
  searchTerm?: string
}

interface InfiniteScrollReturnProps {
  fetching: boolean
  error: string
  items: any
  hasMore: MutableRefObject<boolean>
  offsetToFetch: MutableRefObject<number>
  loadItems: () => void
  attachRefToLastElement: (index: number) => boolean
}

/*
Hook for infinite scroll

It will only work with NG APIs that support pagination and resolve with this format
{ content: [], empty: false, pageIndex: 1, pageItemCount: 3, pageSize: 10, totalItems: 13, totalPages: 2 }

What will this hook manage?
 - Items that are visible on the view. Can be used with any list of items that are resulted from paginated API calls

loadItems
 - Fetch data based on a given offset and limit and/or a search term
 - Function that accepts a page number/offset/searchTerm variable. It will call the underlying API function with the offset/searchTerm variable
*/
export const useInfiniteScroll = (props: InfiniteScrollProps): InfiniteScrollReturnProps => {
  const { getItems, limit = DEFAULT_PAGE_SIZE, searchTerm } = props
  const [items, setItems] = useState<any>([])
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState('')
  const hasMore = useRef(false)

  const initialPageLoaded = useRef(false)
  const offsetToFetch = useRef(0)

  const loadItems = () => {
    setFetching(true)

    getItems({
      offset: offsetToFetch.current,
      limit
    })
      .then(response => {
        if (response.data) {
          setFetching(false)

          // If the cuurent fetch count exceeds totalItems, set hasMore as false
          const canFetchMore =
            response.data.totalItems > response.data.pageIndex * response.data.pageSize + response.data.pageItemCount
          hasMore.current = canFetchMore

          const responseContent = response.data.content
          setItems((prevItems: any) => {
            if (offsetToFetch.current === 0) {
              return responseContent ? [...responseContent] : []
            } else {
              return [...prevItems, ...responseContent]
            }
          })
          setError('')
        } else {
          setError(response.message)
        }
      })
      .catch(err => {
        setFetching(false)
        setError(err)
        setItems([])
      })
  }

  /*
  returns true if index is the last element of the list
  this is done so that the last element can be noticed by the IntersectionObserver
  */
  const attachRefToLastElement = useCallback(
    (index: number) => {
      return index === items.length - 1 && hasMore.current && !fetching
    },
    [fetching, hasMore.current]
  )

  /*
  call loadItems() and fetch the next batch of data if the target is now visible in viewport
  hasMore is true
  fetching is false

  Example - the last element of the list. We identify the last element by applying ref in the above callback
  */
  const loadMoreCallback = useCallback(
    entries => {
      const target = entries[0]
      if (target.isIntersecting && hasMore.current && !fetching) {
        offsetToFetch.current += 1
        loadItems()
      }
    },
    [fetching, hasMore.current, loadItems]
  )

  // Set the intersection observer
  useEffect(() => {
    // Default options for the IO
    // 0.25 threshold means call the callback function when 25% of the target is visible in the DOM
    const options = {
      threshold: 0.25
    }

    const observer = new IntersectionObserver(loadMoreCallback, options)

    // loadMoreRef is the target element received from props
    if (props.loadMoreRef && props.loadMoreRef.current) {
      observer.observe(props.loadMoreRef.current)
    }

    return () => {
      props.loadMoreRef?.current && observer.unobserve(props.loadMoreRef?.current)
    }
  }, [props.loadMoreRef, loadMoreCallback])

  // Just to ensure we don't end up fetching multiple times in the initial load
  useEffect(() => {
    if (initialPageLoaded.current) {
      return
    }

    loadItems()
    initialPageLoaded.current = true
  }, [])

  useEffect(() => {
    if (initialPageLoaded.current) {
      offsetToFetch.current = 0
      loadItems()
    }
  }, [searchTerm])

  return {
    fetching,
    error,
    items,
    hasMore,
    loadItems,
    attachRefToLastElement,
    offsetToFetch
  }
}
