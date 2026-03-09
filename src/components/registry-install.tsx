import { useState } from "react"
import { cn } from "@/lib/utils"

const baseUrl =
  import.meta.env.PUBLIC_REGISTRY_URL ?? "http://localhost:4321"

export function RegistryInstall({ name }: { name: string }) {
  const url = `${baseUrl}/r/${name}.json`
  const [activeTab, setActiveTab] = useState<"pnpm" | "npm" | "yarn" | "bun">("pnpm")

  const commands = {
    pnpm: `pnpm dlx shadcn@latest add ${url}`,
    npm: `npx shadcn@latest add ${url}`,
    yarn: `npx shadcn@latest add ${url}`,
    bun: `bunx --bun shadcn@latest add ${url}`,
  }

  return (
    <div className="not-content relative mt-4 mb-6 rounded-lg border bg-zinc-950 text-zinc-50 flex flex-col font-mono shadow-sm">
      <div className="flex items-center border-b border-zinc-800 bg-zinc-900/50 rounded-t-lg">
        <div className="flex text-sm text-zinc-400">
          {(["pnpm", "npm", "yarn", "bun"] as const).map((manager) => (
            <button
              key={manager}
              onClick={() => setActiveTab(manager)}
              className={cn(
                "hover:text-zinc-50 transition-colors cursor-pointer px-4 py-2 border-b-2",
                activeTab === manager ? "text-zinc-50 font-semibold border-primary bg-zinc-900" : "border-transparent"
              )}
            >
              {manager}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 py-4 overflow-x-auto bg-zinc-950 rounded-b-lg">
        <code className="text-sm text-zinc-200 block whitespace-nowrap">
          {commands[activeTab]}
        </code>
      </div>
    </div>
  )
}
