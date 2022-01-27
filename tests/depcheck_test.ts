import { colours } from "../deps.ts";
import { assertEquals } from "./deps.ts"

async function warningsAboutUnusedFilesAreCorrect(args: string[]) {
  const { output, stderr, status } = await run(
    args,
    "./tests/example_project",
  );
  assertEquals(status.success, false);
  assertEquals(status.code, 1);
  assertEquals(output, "");
  assertEquals(
    stderr,
    colours.yellow(
      'Import "byee" is unused, originating from "deps.ts"',
    ) + "\n" +
      colours.yellow(
        'Import "good" is unused, originating from "deps.ts"',
      ) + "\n" +
      colours.yellow(
        'Import "some" is unused, originating from "tests/deps.ts"',
      ) + "\n" +
      colours.yellow(
        'Import "something" is unused, originating from "tests/deps.ts"',
      ) + "\n",
  );
}

async function run(
  cmd: string[],
  cwd: string,
): Promise<
  { output: string; stderr: string; status: { success: boolean; code: number } }
> {
  const p = Deno.run({
    cmd: cmd,
    cwd: cwd,
    stdout: "piped",
    stderr: "piped",
  });
  const status = await p.status();
  const output = new TextDecoder().decode(await p.output());
  const stderr = new TextDecoder().decode(await p.stderrOutput());
  p.close();
  return {
    output,
    stderr,
    status,
  };
}

Deno.test("Running with no args", async t => {
  await t.step('Warnings about unused dependencies are correct', async () => {
    await warningsAboutUnusedFilesAreCorrect([
      "deno",
      "run",
      "--allow-read=.",
      "../../mod.ts",
    ]);
  })
})

Deno.test("Running with args", async t => {
  await t.step('Warnings about unused dependencies are correct', async () => {
    await warningsAboutUnusedFilesAreCorrect([
      "deno",
      "run",
      "--allow-read=.",
      "../../mod.ts",
      "deps.ts",
    ]);
  })
})

Deno.test("User has no dependency files", async t => {
  await t.step('Should do nothing', async () => {
    const p = Deno.run({
      cmd: ["deno", "run", "--allow-read=.", "../../../mod.ts"],
      cwd: "./tests/example_project/src",
      stdout: "piped",
      stderr: "piped",
    });
    await p.status();
    await p.output();
    const stderr = new TextDecoder().decode(await p.stderrOutput());
    p.close();
    assertEquals(
      stderr.indexOf("No such file or directory") > -1,
      true,
    );
  })
})