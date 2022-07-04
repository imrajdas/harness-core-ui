import React from 'react'
import { Color, Container, FontVariation, Text } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import css from './PermissionError.module.scss'

interface ErrorProps {
  imgSrc: string
  errorMsg: React.ReactElement | string
  errorDesc?: string
  wrapperClassname?: string
}

const HandleError: React.FC<ErrorProps> = ({
  imgSrc,
  errorMsg,
  errorDesc,
  wrapperClassname = css.noResultsContainer
}) => {
  const { getString } = useStrings()
  return (
    <Container className={wrapperClassname}>
      <img src={imgSrc} />
      <Text
        font={{ variation: FontVariation.BODY2_SEMI }}
        color={Color.GREY_1000}
        style={{ marginTop: 'var(--spacing-xlarge)' }}
      >
        {errorMsg}
      </Text>
      <Text font={{ variation: FontVariation.SMALL }} color={Color.GREY_500}>
        {errorDesc || getString('ce.permissionError')}
      </Text>
    </Container>
  )
}

export default HandleError
