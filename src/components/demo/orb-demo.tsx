import { useState } from "react"
import { Orb, type AgentState } from "../ui/orb"

export function OrbDemo() {
  return (
    <div style={{ width: "100%", maxWidth: 300, height: 300, margin: "0 auto" }}>
      <Orb />
    </div>
  )
}

export function OrbColorsDemo() {
  const presets: { label: string; colors: [string, string] }[] = [
    { label: "Ocean", colors: ["#0077B6", "#00B4D8"] },
    { label: "Sunset", colors: ["#FF6B6B", "#FFA07A"] },
    { label: "Forest", colors: ["#2D6A4F", "#95D5B2"] },
    { label: "Purple", colors: ["#7B2FBE", "#E0AAFF"] },
  ]
  const [active, setActive] = useState(0)

  return (
    <div>
      <div style={{ width: "100%", maxWidth: 300, height: 300, margin: "0 auto" }}>
        <Orb colors={presets[active].colors} seed={42} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
        {presets.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setActive(i)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid",
              borderColor: active === i ? "var(--sl-color-accent)" : "var(--sl-color-gray-5)",
              background: active === i ? "var(--sl-color-accent-low)" : "transparent",
              color: "var(--sl-color-white)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function OrbAgentStateDemo() {
  const [state, setState] = useState<AgentState>(null)
  const states: { label: string; value: AgentState }[] = [
    { label: "Idle", value: null },
    { label: "Thinking", value: "thinking" },
    { label: "Listening", value: "listening" },
    { label: "Talking", value: "talking" },
  ]

  return (
    <div>
      <div style={{ width: "100%", maxWidth: 300, height: 300, margin: "0 auto" }}>
        <Orb agentState={state} seed={42} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
        {states.map((s) => (
          <button
            key={s.label}
            onClick={() => setState(s.value)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid",
              borderColor: state === s.value ? "var(--sl-color-accent)" : "var(--sl-color-gray-5)",
              background: state === s.value ? "var(--sl-color-accent-low)" : "transparent",
              color: "var(--sl-color-white)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function OrbVolumeDemo() {
  const [input, setInput] = useState(0)
  const [output, setOutput] = useState(0.3)

  return (
    <div>
      <div style={{ width: "100%", maxWidth: 300, height: 300, margin: "0 auto" }}>
        <Orb volumeMode="manual" manualInput={input} manualOutput={output} seed={42} />
      </div>
      <div style={{ maxWidth: 300, margin: "16px auto 0" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--sl-color-white)" }}>
          Input: {input.toFixed(2)}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={input}
            onChange={(e) => setInput(Number(e.target.value))}
            style={{ flex: 1 }}
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginTop: 8, color: "var(--sl-color-white)" }}>
          Output: {output.toFixed(2)}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={output}
            onChange={(e) => setOutput(Number(e.target.value))}
            style={{ flex: 1 }}
          />
        </label>
      </div>
    </div>
  )
}
