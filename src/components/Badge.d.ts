// FIXME replace the variant with the existing variants
enum EBadgeVariant {
  Grey = 'grey',
  Blue = 'blue',
  Orange = 'orange',
  Green = 'green',
  Red = 'red',
  Purple = 'purple',
  Primary = 'primary',
}

enum EBadgeSize {
  Small = 'sm',
  Medium = 'md',
}

interface IBadgeProps {
  variant?: EBadgeVariant
  size?: EBadgeSize
  dot?: boolean
}

export { EBadgeVariant, EBadgeSize, IBadgeProps }
