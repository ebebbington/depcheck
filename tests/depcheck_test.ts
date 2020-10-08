import { Rhum } from "./deps.ts";
import { colours } from "../deps.ts"

async function resetExampleProjectDir() {
  const p = Deno.run({
    cmd: [
      "cp",
      "-r",
      "tests/example_project_baseline",
      "tests/example_project",
    ],
  });
  await p.status();
  p.close();
}

Rhum.testPlan("tests/depcheck_test.ts", () => {
  Rhum.beforeEach(async () => {
    await resetExampleProjectDir();
  });
  Rhum.testSuite("Running with no args", () => {
    Rhum.testCase(
      "Warnings about unused dependencies are correct",
      async () => {
        const p = Deno.run({
          cmd: ["deno", "run", "--allow-read=.", "../../mod.ts"],
          cwd: "./tests/example_project",
          stdout: "piped",
          stderr: "piped"
        });
        const status = await p.status();
        const output = new TextDecoder().decode(await p.output());
        const stderr = new TextDecoder().decode(await p.stderrOutput())
        p.close();
        Rhum.asserts.assertEquals(output, "")
        Rhum.asserts.assertEquals(stderr,
            colours.yellow('Import "byee" is unused, originating from "deps.ts"') + "\n" +
            colours.yellow('Import "good" is unused, originating from "deps.ts"') + "\n" +
            colours.yellow('Import "some" is unused, originating from "tests/deps.ts"') + "\n" +
            colours.yellow('Import "something" is unused, originating from "tests/deps.ts"') + "\n"
        )
      },
    );
  });

  Rhum.testSuite("Running with --clean", () => {
    Rhum.testCase("Removes the unused dependencies", async () => {
      const p = Deno.run({
        cmd: [
          "deno",
          "run",
          "--allow-read=.",
          "--allow-write=.",
          "../../mod.ts",
          "--clean",
        ],
        cwd: "./tests/example_project",
        stdout: "piped",
        stderr: "piped"
      });
      const status = await p.status();
      const output = new TextDecoder().decode(await p.output());
      const stderr = new TextDecoder().decode(await p.stderrOutput())
      p.close();
      Rhum.asserts.assertEquals(stderr,
          colours.yellow('Import "byee" is unused, originating from "deps.ts"') + "\n" +
          colours.yellow('Import "good" is unused, originating from "deps.ts"') + "\n" +
          colours.yellow('Import "some" is unused, originating from "tests/deps.ts"') + "\n" +
          colours.yellow('Import "something" is unused, originating from "tests/deps.ts"') + "\n"
      )
      Rhum.asserts.assertEquals(output, colours.green("Cleaned up all unused imports") + "\n")
    });
  });

  // Rhum.testSuite("Running with --fmt", () => {
  //   Rhum.testCase("Formats code beforehand", async () => {
  //     const p = Deno.run({
  //       cmd: [
  //         "deno",
  //         "run",
  //         "--allow-read='.'",
  //         "--allow-run",
  //         "../../mod.ts",
  //         "--fmt",
  //       ],
  //       cwd: "./tests/example_project",
  //       stdout: "piped",
  //     });
  //     const status = await p.status();
  //     const output = new TextDecoder().decode(await p.output());
  //     p.close();
  //     console.log(output); // todo assert output is the right imports
  //   });
  // });
  //
  // Rhum.testSuite("User has no dependency files", () => {
  //   Rhum.testCase("Should do nothing", async () => {
  //     const p = Deno.run({
  //       cmd: ["deno", "run", "--allow-read='.'", "../../mod.ts"],
  //       cwd: "./tests/example_project/src",
  //       stdout: "piped",
  //     });
  //     const status = await p.status();
  //     const output = new TextDecoder().decode(await p.output());
  //     p.close();
  //     console.log(output); // todo assert output is nothing
  //   });
  // });
});

Rhum.run()
