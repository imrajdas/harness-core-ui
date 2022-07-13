import type { FontSize, FontProps } from '@harness/design-system'
import type { IconName } from '@harness/icons'

export interface UserHintProps {
  userMessage: string
  iconName?: IconName
  iconColor?: string
  color?: string
  font?: FontSize | FontProps
  dataTestId?: string
}
