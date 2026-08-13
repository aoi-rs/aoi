import { type AnnotationsMap, flow, makeObservable, observable } from 'mobx'
import { MODEL_REGISTRY, type ModelMetadata } from '@/decorators'
import type { TransactionScheduler } from '@/transactions'

export interface FieldMetadata {
  name: string
  mutable: boolean
}

export interface ModelConstructor {
  mclass: string
  runtime: ModelRuntime
}

export interface ModelDiff {
  [k: string]: {
    from: unknown
    to: unknown
  }
}

export abstract class Model {
  static mclass: string
  static runtime: ModelRuntime

  readonly id!: string
  private state: Record<string, unknown>

  constructor(source: Record<string, unknown>) {
    const meta = this.meta()
    const self = this as Record<string, unknown>

    const annotations: AnnotationsMap<this, never> = { commit: flow }

    for (const field of meta.fields) {
      self[field.name] = source[field.name]

      if (field.mutable) {
        // @ts-expect-error: field.name cannot be inferred as a valid attribute
        annotations[field.name as unknown] = observable
      }
    }

    this.state = { ...source }

    makeObservable(this, annotations)
  }

  mclass(): string {
    const ctor = this.constructor as unknown as ModelConstructor
    return ctor.mclass
  }

  meta(): ModelMetadata {
    const mclass = this.mclass()
    return MODEL_REGISTRY[mclass]
  }

  diff(): ModelDiff | null {
    const meta = this.meta()
    const current = this as Record<string, unknown>

    let deltas: ModelDiff | null = null

    for (const field of meta.fields) {
      if (!field.mutable) {
        continue
      }

      const from = this.state[field.name]
      const to = current[field.name]

      if (from !== to) {
        if (deltas) {
          deltas[field.name] = { from, to }
        } else {
          deltas = { [field.name]: { from, to } }
        }
      }
    }

    return deltas
  }

  *commit() {
    const diff = this.diff()

    if (!diff) {
      return
    }

    yield Model.runtime.commit(this, diff)

    for (const field in diff) {
      this.state[field] = diff[field].to
    }
  }
}

export class ModelRuntime {
  constructor(private transactions: TransactionScheduler) {}

  commit(model: Model, diff: ModelDiff) {
    return this.transactions.schedule({
      action: 'set',
      data: diff,
      model_class: model.mclass(),
      model_id: model.id,
    })
  }
}
