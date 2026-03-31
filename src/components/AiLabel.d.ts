enum EAiLabelVariant {
  Default = 'default',
  Inline = 'inline',
}

// #region EAiLabelSize
enum EAiLabelSize {
  Small = 'sm',
  Medium = 'md',
  Large = 'lg',
}
// #endregion EAiLabelSize

interface IAiLabelProps {
  variant?: EAiLabelVariant
  size?: EAiLabelSize
}

export { EAiLabelVariant, EAiLabelSize, IAiLabelProps }
