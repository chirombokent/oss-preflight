interface ModeCard {
  title: string;
  label: string;
  description: string;
  output: string;
}

interface StepCard {
  title: string;
  detail: string;
}

const WEB_MODES: ModeCard[] = [
  {
    title: 'Idea recommend',
    label: 'Web + CLI',
    description: 'Paste a product idea. OSS Preflight parses the domain, discovers candidate packages, scores them, and shows the Evidence Passport.',
    output: 'Top recommendations with source-labeled facts, interpretations, warnings, and scaffold availability.',
  },
  {
    title: 'Repository audit',
    label: 'Web + CLI',
    description: 'Paste a public GitHub repository URL or run audit from the CLI. OSS Preflight extracts dependencies and ranks risk.',
    output: 'Dependency summary, evidence gaps, audit report, and workflow trace.',
  },
  {
    title: 'Scaffold download',
    label: 'Web',
    description: 'Use Download starter on a supported recommendation. The hosted app creates the zip in memory without writing server files.',
    output: 'Starter zip or adoption pack with README, smoke test, and adoption report.',
  },
  {
    title: 'Bob workflow',
    label: 'Bob IDE',
    description: 'Use Bob custom modes and the oss-preflight-advisor skill to run the same recommendation and evidence workflow from the IDE.',
    output: 'A guided Bob task that can recommend, review evidence, and ask before writing scaffold output.',
  },
];

const BOB_WORKFLOW: ModeCard[] = [
  {
    title: 'Start advisor',
    label: 'Bob IDE',
    description: 'Open the OSS Preflight repository in Bob IDE, switch to Advanced mode, and invoke the oss-preflight-advisor skill.',
    output: 'Bob enters the product workflow instead of a generic coding conversation.',
  },
  {
    title: 'Send idea or repo',
    label: 'Input',
    description: 'Give Bob a product idea for recommendations, or a public GitHub URL for dependency audit.',
    output: 'Bob chooses recommend or audit and runs the matching OSS Preflight CLI workflow.',
  },
  {
    title: 'Review evidence',
    label: 'Passport',
    description: 'Ask Bob to summarize the Evidence Passport, separate facts from interpretations, and call out evidence gaps.',
    output: 'A grounded recommendation that does not hide nulls, stale data, or assumptions.',
  },
  {
    title: 'Approve scaffolding',
    label: 'Write gate',
    description: 'If you want starter files, Bob asks before writing and keeps output under .oss-preflight/ or oss-preflight-output/.',
    output: 'A starter package or adoption pack that Bob can inspect before you copy anything into a real project.',
  },
  {
    title: 'Use in target project',
    label: 'Import',
    description: 'Open the generated output folder in Bob, or add it beside your target workspace, then ask Bob to review the adoption report.',
    output: 'Bob can adapt the starter to the target codebase after you approve the integration scope.',
  },
];

const BOB_WORKFLOW_STEPS: StepCard[] = [
  {
    title: 'Open OSS Preflight in Bob',
    detail: 'Download or clone the OSS Preflight repository, then open that folder as the Bob IDE workspace root so .bob/skills/oss-preflight-advisor is available.',
  },
  {
    title: 'Build the CLI once',
    detail: 'Run corepack enable, pnpm install, and pnpm build. Bob uses the built CLI for recommend, audit, scaffold, and run workflows.',
  },
  {
    title: 'Trigger the advisor',
    detail: 'In Advanced mode, ask Bob to use oss-preflight-advisor. Give it an idea like a Discord summarizer or a public GitHub repo URL.',
  },
  {
    title: 'Inspect the result',
    detail: 'Have Bob explain the top recommendation, the Evidence Passport facts, the interpretation, and any missing evidence before you accept it.',
  },
  {
    title: 'Approve output',
    detail: 'When Bob offers scaffolding, approve the output directory explicitly. Use .oss-preflight/ for internal runs or oss-preflight-output/ for handoff artifacts.',
  },
  {
    title: 'Import into a project',
    detail: 'Open the generated folder in Bob or place it beside your target repo. Ask Bob to read ADOPTION_REPORT.md and propose a scoped integration plan.',
  },
  {
    title: 'Run project adaptation',
    detail: 'Switch Bob to Code or Reviewer only after the OSS Preflight recommendation is accepted and the target write paths are clear.',
  },
  {
    title: 'Export the Bob run',
    detail: 'For demo or audit evidence, export the task history and consumption screenshot into bob_sessions/ and update bob_sessions/build-report.md.',
  },
];

const cliCommands = [
  'corepack enable',
  'pnpm install',
  'pnpm build',
  'node packages/cli/dist/index.js recommend --idea "Discord bot that summarizes channel activity" --json --save',
  'node packages/cli/dist/index.js scaffold --recommendation .oss-preflight/recommendations/latest.json --rank 1 --out .oss-preflight/runs/discord-bot',
  'node packages/cli/dist/index.js audit --repo https://github.com/vitest-dev/vitest --json',
  'node packages/cli/dist/index.js run --idea "Discord bot that summarizes channel activity" --out demo-output',
];

const bobPrompt = `Use oss-preflight-advisor for this idea:

Discord bot that summarizes channel activity.

Show the top recommendation, the Evidence Passport facts, and any evidence gaps.
Ask before writing files. If I approve scaffolding, write only under .oss-preflight/
or oss-preflight-output/.`;

function ModeGrid({ modes }: { modes: ModeCard[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {modes.map((mode) => (
        <article
          key={mode.title}
          className="surface-card rounded-lg border border-[#DCE3ED] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-[#17191F] dark:text-white">{mode.title}</h3>
            <span className="shrink-0 rounded-md bg-[#F0F6FB] px-2 py-1 text-xs font-semibold text-[#173B57] dark:bg-[#132634] dark:text-[#9ADFF2]">
              {mode.label}
            </span>
          </div>
          <p className="text-sm leading-6 text-[#5D6678] dark:text-[#C3CAD7]">{mode.description}</p>
          <p className="mt-4 border-t border-[#E8EDF4] pt-3 text-sm font-medium leading-6 text-[#303541] dark:border-white/10 dark:text-[#E7ECF5]">
            {mode.output}
          </p>
        </article>
      ))}
    </div>
  );
}

function StepList({ steps }: { steps: StepCard[] }) {
  return (
    <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="surface-card flex gap-4 rounded-lg border border-[#DCE3ED] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#17191F] text-sm font-semibold text-white dark:bg-white dark:text-[#17191F]">
            {index + 1}
          </span>
          <span>
            <span className="block text-sm font-semibold text-[#17191F] dark:text-white">{step.title}</span>
            <span className="mt-1 block text-sm leading-6 text-[#5D6678] dark:text-[#C3CAD7]">{step.detail}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function CommandBlock({ title, commands }: { title: string; commands: string[] }) {
  return (
    <div className="rounded-lg border border-[#263142] bg-[#111318] p-5 text-white shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-[#B7C8D9]">PowerShell</span>
      </div>
      <pre className="overflow-x-auto text-sm leading-7 text-[#D7E2EF]">
        <code>{commands.join('\n')}</code>
      </pre>
    </div>
  );
}

export function UsageGuide() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#17191F] dark:bg-[#111318] dark:text-white">
      <section className="border-b border-[#DCE3ED] bg-white px-6 py-10 dark:border-white/10 dark:bg-[#111318]">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-normal text-[#4F7CAC] dark:text-[#9ADFF2]">
              Operator guide
            </p>
            <h1 className="text-3xl font-semibold tracking-normal text-[#17191F] dark:text-white md:text-4xl">
              Use OSS Preflight from the web app, CLI, or Bob IDE
            </h1>
            <p className="mt-4 text-base leading-7 text-[#5D6678] dark:text-[#C3CAD7]">
              OSS Preflight combines deterministic evidence collection with a Bob-native workflow. Use the web app for demos,
              the CLI for repeatable automation, and Bob IDE for guided planning, implementation, review, and approval-gated scaffolding.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-[#17191F] dark:text-white">Product Modes</h2>
              <p className="mt-2 text-sm leading-6 text-[#5D6678] dark:text-[#C3CAD7]">
                The same core workflow is exposed through web, CLI, and Bob surfaces.
              </p>
            </div>
          </div>
          <ModeGrid modes={WEB_MODES} />
        </div>
      </section>

      <section className="border-y border-[#DCE3ED] bg-[#EEF4FA] px-6 py-10 dark:border-white/10 dark:bg-[#151A21]">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <h2 className="text-2xl font-semibold text-[#17191F] dark:text-white">CLI Quickstart</h2>
            <p className="mt-3 text-sm leading-6 text-[#5D6678] dark:text-[#C3CAD7]">
              Build once, then run recommend, scaffold, audit, or the combined run command. The CLI writes machine-readable
              outputs under .oss-preflight/ or a directory you choose.
            </p>
            <div className="mt-5 rounded-lg border border-[#C9D3E2] bg-white p-4 text-sm leading-6 text-[#303541] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#D7DDEA]">
              Use Keyword mode for deterministic offline-safe demos. Set provider env vars only when you want network AI parsing.
            </div>
          </div>
          <CommandBlock title="Run from the repository root" commands={cliCommands} />
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-[#17191F] dark:text-white">OSS Preflight In Bob IDE</h2>
            <p className="mt-2 text-sm leading-6 text-[#5D6678] dark:text-[#C3CAD7]">
              This is the Bob runtime path for the product itself: invoke the advisor, run recommendation or audit, review evidence, then approve any writes.
            </p>
          </div>
          <ModeGrid modes={BOB_WORKFLOW} />
        </div>
      </section>

      <section className="border-y border-[#DCE3ED] bg-white px-6 py-10 dark:border-white/10 dark:bg-[#111318]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-[#17191F] dark:text-white">Run The Workflow In Bob IDE</h2>
            <p className="mt-2 text-sm leading-6 text-[#5D6678] dark:text-[#C3CAD7]">
              These are the practical steps for using OSS Preflight inside Bob, then importing the generated output into a target project.
            </p>
          </div>
          <StepList steps={BOB_WORKFLOW_STEPS} />
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-2xl font-semibold text-[#17191F] dark:text-white">Example Bob IDE Prompt</h2>
            <p className="mt-3 text-sm leading-6 text-[#5D6678] dark:text-[#C3CAD7]">
              Run this in Advanced mode when the oss-preflight-advisor skill is available. It keeps the workflow approval-gated
              and limits writes to OSS Preflight output folders.
            </p>
            <div className="mt-5 grid gap-3 text-sm leading-6 text-[#303541] dark:text-[#D7DDEA]">
              <div className="rounded-lg border border-[#DCE3ED] bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
                Bob workflow path: trigger oss-preflight-advisor, provide an idea or repo, review the Evidence Passport, then approve scaffolding.
              </div>
              <div className="rounded-lg border border-[#DCE3ED] bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
                Import path: generate into .oss-preflight/ or oss-preflight-output, open that output in Bob, and ask for an adoption plan against your target repo.
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[#263142] bg-[#111318] p-5 text-white shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Advanced mode prompt</h3>
              <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-[#B7C8D9]">Bob IDE</span>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-7 text-[#D7E2EF]">
              <code>{bobPrompt}</code>
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}
