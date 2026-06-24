import {
  FRAGMENT_TITLE_PROMPT,
  RESPONSE_PROMPT,
  SANDPACK_SYSTEM_PROMPT,
} from "./prompts-sandpack";
import { completeChat, hasAIKey } from "./ai-provider";
import { FileCollection } from "@/types";

type GenerateResult = {
  files: FileCollection;
  summary: string;
};

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : text.trim();
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
    throw new Error("AI returned invalid JSON");
  }
}

async function complete(
  system: string,
  user: string,
  maxTokens?: number,
): Promise<string> {
  return completeChat({ system, user, maxTokens });
}

function demoFiles(prompt: string): GenerateResult {
  const title = prompt.slice(0, 40) || "My App";
  return {
    summary: `Built a demo app for: ${title}`,
    files: {
      "/public/index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-white">
  <div id="root"></div>
</body>
</html>`,
      "/index.js": `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(<App />);`,
      "/App.js": `import React, { useState } from "react";

export default function App() {
  const [items, setItems] = useState([
    { id: 1, title: "Welcome to your app", done: false },
    { id: 2, title: "Add your OpenAI key for full AI generation", done: false },
    { id: 3, title: "Iterate with chat to refine", done: false },
  ]);
  const [text, setText] = useState("");

  const add = () => {
    if (!text.trim()) return;
    setItems((prev) => [...prev, { id: Date.now(), title: text, done: false }]);
    setText("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-orange-950">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✨</span>
          <h1 className="text-xl font-semibold">${title.replace(/"/g, "")}</h1>
        </div>
        <span className="text-xs text-orange-300 bg-orange-500/10 px-3 py-1 rounded-full">Demo mode</span>
      </header>
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <p className="text-zinc-400">Your prompt: <span className="text-white">${prompt.slice(0, 120).replace(/"/g, "'")}${prompt.length > 120 ? "…" : ""}</span></p>
        <div className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a task…" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500" />
          <button onClick={add} className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-lg font-medium">Add</button>
        </div>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-3">
              <button onClick={() => setItems((p) => p.map((i) => i.id === item.id ? { ...i, done: !i.done } : i))}
                className={\`w-5 h-5 rounded border \${item.done ? "bg-orange-500 border-orange-500" : "border-zinc-500"}\`} />
              <span className={item.done ? "line-through text-zinc-500" : ""}>{item.title}</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}`,
    },
  };
}

function ensureScaffold(files: FileCollection): FileCollection {
  const out = { ...files };
  if (!out["/public/index.html"]) {
    out["/public/index.html"] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body><div id="root"></div></body>
</html>`;
  }
  if (!out["/index.js"]) {
    out["/index.js"] = `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
createRoot(document.getElementById("root")).render(<App />);`;
  }
  if (!out["/App.js"] && !out["/src/App.js"]) {
    out["/App.js"] = `export default function App() {
  return <div className="p-8 text-center"><h1 className="text-2xl font-bold">Hello</h1></div>;
}`;
  }
  return out;
}

export async function generateAppFiles({
  prompt,
  existingFiles,
  history,
}: {
  prompt: string;
  existingFiles?: FileCollection;
  history?: { role: string; content: string }[];
}): Promise<GenerateResult> {
  const hasKey = hasAIKey();

  if (!hasKey) {
    return demoFiles(prompt);
  }

  const context = [
    history?.length
      ? `Conversation:\n${history.map((m) => `${m.role}: ${m.content}`).join("\n")}`
      : "",
    existingFiles && Object.keys(existingFiles).length
      ? `Existing files:\n${JSON.stringify(existingFiles, null, 0).slice(0, 12000)}`
      : "",
    `User request: ${prompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const raw = await complete(SANDPACK_SYSTEM_PROMPT, context, 12000);
  const parsed = extractJson(raw) as {
    files?: FileCollection;
    summary?: string;
  };

  const files = ensureScaffold(parsed.files ?? {});
  return {
    files,
    summary: parsed.summary ?? "Built your application.",
  };
}

export async function generateTitle(summary: string): Promise<string> {
  try {
    const title = await complete(FRAGMENT_TITLE_PROMPT, summary, 50);
    return title.trim().split("\n")[0].slice(0, 40) || "New App";
  } catch {
    return "New App";
  }
}

export async function generateResponse(summary: string): Promise<string> {
  try {
    return (await complete(RESPONSE_PROMPT, summary, 200)).trim();
  } catch {
    return "Here's what I built for you — check the preview!";
  }
}
