import { Rhum } from "./deps.ts";
import { colours } from "../deps.ts";

function resetExampleProjectDir() {
  Deno.copyFileSync(
    "./tests/example_project_baseline/deps.ts",
    "tests/example_project/deps.ts",
  );
  Deno.copyFileSync(
    "./tests/example_project_baseline/tests/deps.ts",
    "tests/example_project/tests/deps.ts",
  );
}

async function run(
  cmd: string[],
  cwd: string,
): Promise<{ output: string; stderr: string }> {
  const p = Deno.run({
    cmd: cmd,
    cwd: cwd,
    stdout: "piped",
    stderr: "piped",
  });
  await p.status();
  const output = new TextDecoder().decode(await p.output());
  const stderr = new TextDecoder().decode(await p.stderrOutput());
  p.close();
  return {
    output,
    stderr,
  };
}

Rhum.testPlan("tests/depcheck_test.ts", () => {
  Rhum.afterEach(() => {
    resetExampleProjectDir();
  });
  Rhum.testSuite("Running with no args", () => {
    Rhum.testCase(
      "Warnings about unused dependencies are correct",
      async () => {
        const { output, stderr } = await run(
          ["deno", "run", "--allow-read=.", "../../mod.ts"],
          "./tests/example_project",
        );
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

  Rhum.testSuite("Running with --clean", () => {
    Rhum.testCase("Removes the unused dependencies", async () => {
      const { output, stderr } = await run([
        "deno",
        "run",
        "--allow-read=.",
        "--allow-write=.",
        "../../mod.ts",
        "--clean",
      ], "./tests/example_project");
      Rhum.asserts.assertEquals(
        stderr,
        colours.yellow('Import "byee" is unused, originating from "deps.ts"') +
          "\n" +
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
      Rhum.asserts.assertEquals(
        output,
        colours.green("Cleaned up all unused imports") + "\n",
      );
      const mainDepsFileContent = new TextDecoder().decode(
        await Deno.readFile("./tests/example_project/deps.ts"),
      );
      Rhum.asserts.assertEquals(
        mainDepsFileContent,
        'export { heloo } from "hh";\n\n',
      );
      const testDepsFileContent = new TextDecoder().decode(
        await Deno.readFile("./tests/example_project/tests/deps.ts"),
      );
      Rhum.asserts.assertEquals(
        testDepsFileContent,
        'export { a, b } from "ffdd";' + "\n\n" +
          'export * as anotherThing from "abc";\n',
      );
    });
  });

  Rhum.testSuite("Running with --fmt", () => {
    Rhum.testCase("Formats code beforehand", async () => {
      const p = Deno.run({
        cmd: [
          "deno",
          "run",
          "--allow-read=.",
          "--allow-run",
          "../../mod.ts",
          "--fmt",
        ],
        cwd: "./tests/example_project",
        stdout: "piped",
        stderr: "piped",
      });
      await p.status();
      const output = new TextDecoder().decode(await p.output());
      const stderr = new TextDecoder().decode(await p.stderrOutput());
      p.close();
      Rhum.asserts.assertEquals(
        stderr,
        "Checked 5 files" + "\n" +
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
      Rhum.asserts.assertEquals(output, "");
    });
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
