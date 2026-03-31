interface IComponentContent {
  component: string
  props?: Record<string, any>
  maxLength?: number
  children?: string | number | Array<IComponentContent>
}

interface IContentRendererProps {
  children: IComponentContent | Array<IComponentContent>
}

export type { IContentRendererProps, IComponentContent }
