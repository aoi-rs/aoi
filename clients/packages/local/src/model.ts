import { type AnnotationsMap, flow, makeObservable, observable } from 'mobx'
import { MODEL_REGISTRY, type ModelMetadata } from '@/decorators'
import type { TransactionService } from '@/transactions'

export interface FieldMetadata {
  name: string
  mutable: boolean
}

export interface ModelConstructor {
  mclass: string
}

export abstract class Model {
  static mclass: string
  readonly id!: string

  private state: Record<string, unknown>
  private transactions: TransactionService

  constructor(
    source: Record<string, unknown>,
    transactions: TransactionService,
  ) {
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
    this.transactions = transactions

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

  diff() {
    const meta = this.meta()
    const current = this as Record<string, unknown>

    let deltas: Record<
      string,
      {
        from: unknown
        to: unknown
      }
    > | null = null

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
    const deltas = this.diff()

    if (!deltas) {
      return
    }

    yield this.transactions.add({
      action: 'set',
      model_class: this.mclass(),
      model_id: this.id,
      data: deltas,
    })

    for (const field in deltas) {
      this.state[field] = deltas[field].to
    }
  }
}
