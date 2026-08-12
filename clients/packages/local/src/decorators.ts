import type { FieldMetadata, Model, ModelConstructor } from '@/model'

interface RouteMetadata {
  POST?: string
  PATCH?: string
  DELETE?: string
}

export interface ModelMetadata {
  fields: FieldMetadata[]
  routes: RouteMetadata
}

export const MODEL_REGISTRY: Record<string, ModelMetadata> = {}

export function model(mclass: string, routes: RouteMetadata = {}) {
  return (ctor: ModelConstructor, context: ClassDecoratorContext) => {
    const fields = (context.metadata.fields ?? []) as FieldMetadata[]

    MODEL_REGISTRY[mclass] = { fields, routes }
    ctor.mclass = mclass
  }
}

interface FieldParams {
  mutable?: boolean
}

const BASE_FIELD_METADATA: FieldMetadata[] = [{ name: 'id', mutable: false }]

export function field(params: FieldParams = {}) {
  return (_: undefined, context: ClassFieldDecoratorContext) => {
    if (!context.metadata.fields) {
      context.metadata.fields = [...BASE_FIELD_METADATA]
    }

    const fields = context.metadata.fields as FieldMetadata[]

    fields.push({
      name: context.name as string,
      mutable: params.mutable ?? false,
    })

    return function f(this: Model) {
      // @ts-expect-error: because models set declared fields at runtime
      return this[context.name]
    }
  }
}
