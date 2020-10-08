import {Rhum} from "./deps.ts";

Rhum.testPlan("tests/depcheck_test.ts", () => {
  Rhum.testSuite("Running with no args", () => {
    Rhum.testCase("Warnings about unused dependencies are correct", () => {

    })
    Rhum.testCase("Permissions work correctly", () => {

    })
  })
  Rhum.testSuite("Running with --clean", () => {
    Rhum.testCase("Removes the unused dependencies", () => {

    })
    Rhum.testCase("Permissions work correctly", () => {

    })
  })
  Rhum.testSuite("Running with --fmt", () => {
    Rhum.testCase("Formats code beforehand", () => {
      const p = Deno.runn({
        cmd: ["deno", "run", "-A"]
      })
    })
    Rhum.testCase("Permissions work correctly", () => {

    })
  })
})