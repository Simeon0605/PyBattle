"use client";

import dynamic from "next/dynamic";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export function CodeEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="max-w-full overflow-hidden border border-ink">
      <Monaco
        height="420px"
        language="python"
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "var(--font-space-mono), ui-monospace, monospace",
          scrollBeyondLastLine: false,
          padding: { top: 12 },
          automaticLayout: true,
        }}
      />
    </div>
  );
}
