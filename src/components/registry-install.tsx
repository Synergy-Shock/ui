const baseUrl =
  import.meta.env.PUBLIC_REGISTRY_URL ?? "http://localhost:4321"

export function RegistryInstall({ name }: { name: string }) {
  const url = `${baseUrl}/r/${name}.json`
  return (
    <pre>
      <code>{`pnpm dlx shadcn@latest add ${url}`}</code>
    </pre>
  )
}
