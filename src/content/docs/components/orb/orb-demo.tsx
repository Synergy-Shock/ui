import { useState, useEffect } from "react";
import { Orb, type AgentState } from "@/registry/new-york/orb/orb";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";

const states: { label: string; value: AgentState }[] = [
  { label: "Idle", value: "idle" },
  { label: "Thinking", value: "thinking" },
  { label: "Listening", value: "listening" },
  { label: "Talking", value: "talking" },
];

const logoColors = ["#b63fa6", "#ffb84b", "#4975d6", "#79b853"];

export function OrbDemo() {
  const [state, setState] = useState<AgentState>("idle");

  return (
    <div className="not-content">
      <div className="grid grid-cols-2 gap-4 mx-auto" style={{ maxWidth: 320 }}>
        {logoColors.map((color, i) => (
          <div
            key={color}
            style={{ width: "100%", aspectRatio: "1", maxWidth: 150 }}
          >
            <Orb
              agentState={state}
              colors={i % 2 ? [color, "#1A1A2E"] : [color, "#F5F5F5"]}
            />
          </div>
        ))}
      </div>
      <div className="pt-10 flex justify-center">
        <ButtonGroup className="rounded-lg">
          {states.map((s) => (
            <Button
              key={s.label}
              className="cursor-pointer"
              variant={state === s.value ? "default" : "outline"}
              onClick={() => setState(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </ButtonGroup>
      </div>
    </div>
  );
}
