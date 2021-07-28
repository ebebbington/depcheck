import { Rhum } from "./deps.ts";
import { colours } from "../deps.ts";

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

Rhum.testPlan("tests/depcheck_test.ts", () => {
  Rhum.testSuite("Running with no args", () => {
    Rhum.testCase(
      "Warnings about unused dependencies are correct",
      async () => {
        const { output, stderr, status } = await run(
          ["deno", "run", "--allow-read=.", "../../mod.ts"],
          "./tests/example_project",
        );
        Rhum.asserts.assertEquals(status.success, false);
        Rhum.asserts.assertEquals(status.code, 1);
        Rhum.asserts.assertEquals(output, "");
        Rhum.asserts.assertEquals(
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
      },
    );
  });

  Rhum.testSuite("User has no dependency files", () => {
    Rhum.testCase("Should do nothing", async () => {
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
      Rhum.asserts.assertEquals(
        stderr.indexOf("No such file or directory") > -1,
        true,
      );
    });
  });
});

Rhum.run();
