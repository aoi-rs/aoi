export function route(base: string, path: string) {
    return new URL(path, base)
}
