// Primitive JSON values
type TJsonPrimitive = string | number | boolean | null

// Recursive JSON values
type TJsonValue = TJsonPrimitive | IJsonObject | TJsonArray
interface IJsonObject {
  [key: string]: TJsonValue
}
type TJsonArray = TJsonValue[]

// Runtime-friendly node kind enum for component consumers
enum EJsonNodeKind {
  Object = 'object',
  Array = 'array',
  Primitive = 'primitive',
}

interface IJsonTreeProps {
  title?: string | null
  modelValue?: TJsonValue
  root?: boolean
  editable?: boolean
  startCollapsed?: boolean
}

export {
  TJsonPrimitive,
  TJsonValue,
  IJsonObject,
  TJsonArray,
  EJsonNodeKind,
  IJsonTreeProps,
}
