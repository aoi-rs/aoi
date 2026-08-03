export async function* readNDJSON<T>(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<T> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()

  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')

    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line.length > 0) yield JSON.parse(line)
    }
  }

  if (buffer.length > 0) {
    yield JSON.parse(buffer)
  }
}
