'use client'

import {
  type Dispatch,
  type SetStateAction,
  type SubmitEvent,
  useRef,
  useState,
} from 'react'
import { Logomark } from '@/components/brand/logomark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { service } from '@/utils/client'
import { CONFIG } from '@/utils/config'

enum State {
  DEFAULT,
  EMAIL,
  EMAIL_SENT,
}

interface StateProps {
  onStateChange: Dispatch<SetStateAction<State>>
}

export default function Login() {
  const [state, setState] = useState<State>(State.DEFAULT)
  const [email, setEmail] = useState<string | null>(null)

  const states = {
    [State.DEFAULT]: <Start onStateChange={setState} />,
    [State.EMAIL]: (
      <EmailForm onStateChange={setState} onEmailChange={setEmail} />
    ),
    [State.EMAIL_SENT]: (
      <EmailSent onStateChange={setState} email={email as string} />
    ),
  }

  const content = states[state]

  return (
    <div className="min-h-screen flex pt-12 pb-12 bg-background text-foreground">
      <div className="flex flex-col mt-36 w-full h-fit items-center gap-8 animate-in delay-200 duration-300 fade-in-0 fill-mode-both slide-in-from-top-[0.625rem]">
        <Logomark className="size-12" />

        <div
          className="animate-in duration-200 ease-in-out fade-in-0 fill-mode-backwards zoom-in-98"
          key={state}
        >
          {content}
        </div>
      </div>
    </div>
  )
}

function Start({ onStateChange }: StateProps) {
  return (
    <div className="flex w-72 flex-col gap-6">
      <h1 className="self-center text-center text-lg font-medium">
        Log in to your account
      </h1>

      <div className="flex flex-col gap-4">
        <Button>Continue with Google</Button>

        <Button variant="secondary" onClick={() => onStateChange(State.EMAIL)}>
          Continue with email
        </Button>
      </div>
    </div>
  )
}

function EmailForm({
  onStateChange,
  onEmailChange,
}: StateProps & { onEmailChange: Dispatch<SetStateAction<string | null>> }) {
  const field = useRef<HTMLInputElement>(null)

  const [processing, setProcessing] = useState(false)

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const email = field.current?.value

    if (!email) {
      return
    }

    setProcessing(true)

    const { error } = await service.POST('/v1/login_tokens/request', {
      body: { email },
    })

    setProcessing(false)

    if (error) {
      // TODO: show error toast or something
      return
    }

    onEmailChange(email)
    onStateChange(State.EMAIL_SENT)
  }

  return (
    <div className="flex w-72 flex-col gap-6">
      <h1 className="self-center text-center text-lg font-medium">
        Enter your email address
      </h1>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input ref={field} placeholder="alice@example.com" />

        <Button type="submit" variant="secondary" disabled={processing}>
          Continue with email
        </Button>

        <button
          type="button"
          className="hover:underline-offset-3 hover:underline text-sm"
          onClick={() => onStateChange(State.DEFAULT)}
        >
          Back to login
        </button>
      </form>
    </div>
  )
}

const AUTHENTICATE_URL = new URL('/v1/login_tokens/check', CONFIG.API_BASE_URL)

function EmailSent({ onStateChange, email }: StateProps & { email: string }) {
  const [method, setMethod] = useState<'default' | 'manual'>('default')
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')

  const searchParams = new URLSearchParams({ email })

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(false)
    event.currentTarget.submit()
  }

  return (
    <div className="flex w-2xs flex-col gap-10">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-center text-lg font-medium">Check your inbox</h1>

        <p className="text-center text-sm font-[450] text-[oklch(0.6663_0.0032_264.54)]">
          We&apos;ve sent you a temporary login link. Please check your inbox at{' '}
          <span className="text-foreground">{email}</span>.
        </p>
      </div>

      <div
        className="animate-in duration-200 ease-in-out fade-in-0 fill-mode-backwards zoom-in-98"
        key={method}
      >
        {method === 'default' && (
          <div className="flex flex-col gap-4">
            <Button variant="secondary" onClick={() => setMethod('manual')}>
              Enter code manually
            </Button>

            <button
              type="button"
              className="hover:underline-offset-3 hover:underline text-sm"
              onClick={() => onStateChange(State.DEFAULT)}
            >
              Back to login
            </button>
          </div>
        )}

        {method === 'manual' && (
          <div className="flex flex-col gap-4">
            <form
              action={AUTHENTICATE_URL + '?' + searchParams.toString()}
              method="POST"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              <InputOTP
                name="token"
                maxLength={6}
                inputMode="text"
                pattern="^[a-zA-Z0-9]+$"
                autoComplete="one-time-code"
                value={code}
                onChange={(value) => setCode(value.toUpperCase())}
                autoFocus
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot
                      // biome-ignore lint/suspicious/noArrayIndexKey: This list is static
                      key={index}
                      index={index}
                      className="size-12 text-xl"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              <Button
                type="submit"
                disabled={loading}
                onClick={() => setMethod('manual')}
              >
                Continue with login code
              </Button>
            </form>

            <button
              type="button"
              className="hover:underline-offset-3 hover:underline text-sm"
              onClick={() => onStateChange(State.DEFAULT)}
            >
              Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
