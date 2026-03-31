enum ELabelSize {
  Small = 'sm',
  Medium = 'md',
}

interface ILabelProps {
  htmlFor?: string
  required?: boolean
  disabled?: boolean
  // Visual size of the label text
  size?: ELabelSize
}

export { ELabelSize, ILabelProps }
