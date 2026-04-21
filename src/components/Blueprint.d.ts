export interface IBlueprintConnection {
  fromNode: string
  fromPort: string
  toNode: string
  toPort: string
}

export interface IBlueprintProps {
  /**
   * Wire connections between card ports.
   */
  connections?: IBlueprintConnection[]
}
