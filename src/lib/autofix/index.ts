export type FailureKind =
  | "artifact_generation"
  | "artifact_editor"
  | "connector_load"
  | "export"
  | "embed"
  | "api"
  | "app_build"
  | "app_runtime"
  | "generic";

export type AutofixContext = {
  kind: FailureKind;
  operation: string;
  projectId?: string;
  artifactId?: string;
  error: unknown;
  attempt?: number;
};

export type AutofixResult<T> =
  | { ok: true; value: T; attempts: number; recovered: boolean }
  | { ok: false; userMessage: string; attempts: number; lastError: unknown };

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 800;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function classifyError(error: unknown): FailureKind {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (msg.includes("sandpack") || msg.includes("bundler") || msg.includes("syntax")) return "app_runtime";
  if (msg.includes("export") || msg.includes("pdf") || msg.includes("docx")) return "export";
  if (msg.includes("embed") || msg.includes("iframe") || msg.includes("connector")) return "connector_load";
  if (msg.includes("oauth") || msg.includes("token") || msg.includes("unauthorized")) return "connector_load";
  if (msg.includes("artifact") || msg.includes("document") || msg.includes("diagram")) return "artifact_generation";
  if (msg.includes("generate") || msg.includes("build")) return "app_build";
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("trpc")) return "api";
  return "generic";
}

export function friendlyMessage(kind: FailureKind, recovered: boolean): string {
  if (recovered) {
    return "We hit a snag but fixed it automatically — you're good to continue.";
  }
  const map: Record<FailureKind, string> = {
    artifact_generation: "We couldn't generate that file. Try again — Saffron will retry automatically.",
    artifact_editor: "The editor had trouble loading. We've reset the view — your content is preserved.",
    connector_load: "Couldn't open the connected app. Check your connection or keep editing in Saffron.",
    export: "Export didn't complete. Retrying with a simpler format…",
    embed: "The embedded view couldn't load. You can expand to the full app or edit natively.",
    api: "Connection hiccup — we're retrying.",
    app_build: "App build hit an issue. Saffron is attempting to fix the code automatically.",
    app_runtime: "The preview had an error. Saffron can try to repair it.",
    generic: "Something went wrong. Saffron is trying to recover.",
  };
  return map[kind];
}

/** Run an operation with safe retries and user-friendly failure messages. */
export async function withAutofix<T>(
  ctx: Omit<AutofixContext, "error" | "attempt">,
  fn: (attempt: number) => Promise<T>,
): Promise<AutofixResult<T>> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const value = await fn(attempt);
      return {
        ok: true,
        value,
        attempts: attempt,
        recovered: attempt > 1,
      };
    } catch (error) {
      lastError = error;
      console.error(`[autofix] ${ctx.operation} attempt ${attempt}:`, error);
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  const kind = ctx.kind ?? classifyError(lastError);
  return {
    ok: false,
    userMessage: friendlyMessage(kind, false),
    attempts: MAX_ATTEMPTS,
    lastError,
  };
}

export function logAutofixDiagnostic(ctx: AutofixContext) {
  console.error("[autofix:diagnostic]", {
    kind: ctx.kind,
    operation: ctx.operation,
    projectId: ctx.projectId,
    artifactId: ctx.artifactId,
    attempt: ctx.attempt,
    error: ctx.error instanceof Error ? ctx.error.message : String(ctx.error),
  });
}
