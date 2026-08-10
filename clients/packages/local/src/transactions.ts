import type { Database } from '@/database'
import { MODEL_REGISTRY } from './decorators'

export type Transaction =
  | {
      action: 'add'
      id: number
      model_class: string
      model_id: null
      data: Record<string, unknown>
      created: string
    }
  | {
      action: 'set'
      id: number
      model_class: string
      model_id: string
      data: Record<
        string,
        {
          from: unknown
          to: unknown
        }
      >
      created: string
    }
  | {
      action: 'del'
      id: number
      model_class: string
      model_id: string
      created: string
    }

type TransactionSchedule = Transaction extends infer T
  ? T extends { action: 'add' }
    ? Omit<T, 'id' | 'model_id' | 'created'>
    : Omit<T, 'id' | 'created'>
  : never

interface TransactionMeta {
  id: number
  created: string
}

class TransactionAfterDeleteError extends Error {
  constructor() {
    super('[aoi.rs] cannot mutate a deleted model')
  }
}

export class TransactionService {
  private db: Database
  private executor: TransactionExecutor

  private readiness: Promise<void>

  private recovered: Transaction[]
  private scheduled: Set<number>

  constructor(db: Database, executor: TransactionExecutor) {
    this.db = db
    this.executor = executor

    this.recovered = []
    this.scheduled = new Set()

    this.readiness = this.db._transactions.all().then((transactions) => {
      this.recovered = transactions
      this.scheduled = new Set(transactions.map((t) => t.id))

      if (this.scheduled.size > 0) {
        void this.flush()
      }
    })
  }

  private async flush() {
    for (const id of this.scheduled) {
      navigator.locks.request(`transaction:${id}`, async () => {
        const data = (await this.db._transactions.get(id)) as Transaction

        await this.executor.execute(data)

        await this.db._transactions.delete(id)
        this.scheduled.delete(id)
      })
    }
  }

  async list(): Promise<ReadonlyArray<Transaction>> {
    await this.readiness
    return this.recovered
  }

  async add(
    transaction: Extract<TransactionSchedule, { action: 'add' }>,
  ): Promise<TransactionMeta>

  async add(
    transaction: Exclude<TransactionSchedule, { action: 'add' }>,
  ): Promise<null>

  /**
   * Adds a transaction to the schedule.
   *
   * @param transaction - The transaction to schedule.
   *
   * @returns A promise that resolves to the ID of the transaction that was
   * added or modified in the schedule, or `null` if the transaction was coalesced and removed.
   *
   * @throws {TransactionAfterDeleteError} If an attempt is made to add or modify a transaction
   * for a model that has already been scheduled for deletion.
   */
  async add<T extends TransactionSchedule>(
    transaction: T,
  ): Promise<TransactionMeta | null> {
    const meta = await this._add(transaction)
    await this.flush()

    return meta
  }

  private async _add<T extends TransactionSchedule>(
    transaction: T,
  ): Promise<TransactionMeta | null> {
    if (transaction.action === 'add') {
      const created = new Date().toJSON()

      const id = await this.db._transactions.add({
        ...transaction,
        model_id: null,
        created,
      })

      return { id, created }
    }

    const coalescible = await this.db._transactions
      .where({
        model_class: transaction.model_class,
        model_id: transaction.model_id,
      })
      .first()

    if (!coalescible) {
      const created = new Date().toJSON()
      const id = await this.db._transactions.add({ ...transaction, created })

      return { id, created }
    }

    if (coalescible.action === 'del') {
      throw new TransactionAfterDeleteError()
    }

    return await navigator.locks.request(
      `transaction:${coalescible.id}`,
      async () => {
        if (coalescible.action === 'add' && transaction.action === 'del') {
          await this.db._transactions.delete(coalescible.id)
          return null
        }

        const created = new Date().toJSON()
        const result = this.coalesce(coalescible, { ...transaction, created })

        if (result.id) {
          await this.db._transactions.set(result)
          return null
        }

        const id = await this.db._transactions.add(result)
        return { id, created }
      },
    )
  }

  private coalesce(
    l: Exclude<Transaction, { action: 'del' }>,
    r: Exclude<TransactionSchedule, { action: 'add' }> & { created: string },
  ): Transaction & { id?: number } {
    if (r.action === 'set') {
      switch (l.action) {
        case 'add': {
          const data = { ...l.data }

          for (const field in r.data) {
            data[field] = r.data[field].to
          }

          return { ...l, data } as Extract<Transaction, { action: 'add' }>
        }
        case 'set': {
          const data = { ...l.data }

          for (const field in r.data) {
            if (field in l.data) {
              data[field] = {
                from: l.data[field].from,
                to: r.data[field].to,
              }
            } else {
              data[field] = r.data[field]
            }
          }

          return { ...l, data } as Extract<Transaction, { action: 'set' }>
        }
      }
    }

    return r as Extract<Transaction, { action: 'del' }>
  }
}

export class TransactionExecutor {
  constructor(private baseURL: string) {}

  async execute(transaction: Transaction) {
    const metadata = MODEL_REGISTRY[transaction.model_class]

    if (!metadata) {
      throw new Error(`unknown model ${transaction.model_class}`)
    }

    switch (transaction.action) {
      case 'set': {
        if (!metadata.routes.PATCH) {
          throw new Error(
            `missed PATCH route for model '${transaction.model_class}'`,
          )
        }

        const route = this.route(
          metadata.routes.PATCH.replace(
            '{id}',
            encodeURIComponent(transaction.model_id),
          ),
        )

        const content: Record<string, unknown> = {}

        for (const field in transaction.data) {
          content[field] = transaction.data[field].to
        }

        const response = await fetch(route, {
          method: 'PATCH',
          body: JSON.stringify(content),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('failed to execute transaction')
        }

        break
      }

      case 'del': {
        if (!metadata.routes.DELETE) {
          throw new Error(
            `missed DELETE route for model '${transaction.model_class}'`,
          )
        }

        const route = this.route(
          metadata.routes.DELETE.replace(
            '{id}',
            encodeURIComponent(transaction.model_id),
          ),
        )

        const response = await fetch(route, {
          method: 'DELETE',
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('failed to execute transaction')
        }

        break
      }

      case 'add': {
        if (!metadata.routes.POST) {
          throw new Error(
            `missed PATCH route for model '${transaction.model_class}'`,
          )
        }

        const route = this.route(metadata.routes.POST)

        const response = await fetch(route, {
          method: 'POST',
          body: JSON.stringify(transaction.data),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('failed to execute transaction')
        }

        break
      }
    }
  }

  private route(s: string): URL {
    return new URL(s, this.baseURL)
  }
}
