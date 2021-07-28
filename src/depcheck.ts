import { colours } from "../deps.ts";

const decoder = new TextDecoder();

type Imports = Array<
  { name: string; isUsed: boolean; file: string; regex: RegExp }
>;

/**
 * Checks if a `test` or `tests` directory exists, if either exist, it will return the name
 *
 * @returns The name for the directory, eg "test" or "tests"
 */
async function getTestDirectoryName(): Promise<string | null> {
  try {
    await Deno.stat("test");
    // didn't fail, so it exists
    return "test";
  } catch (_err) {
    // doesn't exist, try "tests"
    try {
      await Deno.stat("tests");
      return "tests";
    } catch (_errr) {
      // "tests" also doesn't exist
      return null;
    }
  }
}

/**
 * @param lines - The decoded content of a file, split by new lines
 * @param fileImportsExtractedFrom - The file the lines were extracted from
 *
 * @returns The list of imports from the file
 */
function gatherImportsFromDepContent(
  lines: string[],
  fileImportsExtractedFrom: string,
): Imports {
  // deno-lint-ignore no-regex-spaces
  const namedImportRegexOnNewline = /  [a-zA-Z0-9]*[^,]/; // "  someModule," = matches "someModule". Matches the words/numbers, relies on file being formatted
  const defaultImportRegex = /export \* as [a-zA-Z0-9]*/;
  const namedRegexOnSameLine = /{ .* }/; // will return "{ a }" or "{ a, b }"

  const imports: Imports = [];

  lines.forEach((line) => {
    // Get imports
    const namedImportRegexOnNewLineMatch = line.match(
      namedImportRegexOnNewline,
    );
    if (
      namedImportRegexOnNewLineMatch && namedImportRegexOnNewLineMatch.length
    ) {
      const theImport = namedImportRegexOnNewLineMatch[0].replace("  ", "");
      imports.push({
        name: theImport,
        isUsed: false,
        file: fileImportsExtractedFrom,
        regex: new RegExp("  " + theImport),
      });
    }

    const defaultImportRegexMatch = line.match(defaultImportRegex);
    if (defaultImportRegexMatch && defaultImportRegexMatch.length) {
      const theImport = defaultImportRegexMatch[0].replace("export * as ", "");
      imports.push({
        name: theImport,
        isUsed: false,
        file: fileImportsExtractedFrom,
        regex: new RegExp("export * from " + theImport),
      });
    }

    const namedRegexOnSameLineMatch = line.match(namedRegexOnSameLine);
    if (namedRegexOnSameLineMatch && namedRegexOnSameLineMatch.length) {
      const theImports = namedRegexOnSameLineMatch[0]
        .replace("{", "")
        .replace("}", "")
        .replace(" ", "")
        .split(", ");
      theImports.forEach((theImport) => {
        theImport = theImport.replace(" ", "");
        imports.push({
          name: theImport,
          isUsed: false,
          file: fileImportsExtractedFrom,
          regex: new RegExp(theImport),
        });
      });
    }
  });
  return imports;
}

/**
 * Iterates over a directory, checking each .ts file if it contains a import
 *
 * @param dir - The directory to check
 * @param imports - List of imports to check against
 */
async function iterateOverDirectoryAndCheckIfImportsAreUsed(
  dir: string,
  imports: Imports,
): Promise<Imports> {
  for await (const dirEntry of Deno.readDir(dir)) {
    // Ignore deps.ts files
    if (
      dirEntry.name.includes(".ts") &&
      dirEntry.name.includes("deps.ts") === false
    ) {
      const fileContent = decoder.decode(
        Deno.readFileSync(dir + "/" + dirEntry.name),
      );
      imports.forEach((imp, i) => {
        if (fileContent.includes(imp.name)) {
          imports[i].isUsed = true;
        }
      });
    } else if (dirEntry.isDirectory === true) {
      await iterateOverDirectoryAndCheckIfImportsAreUsed(
        dir + "/" + dirEntry.name,
        imports,
      );
    }
  }
  return imports;
}

function getDepFileContent(filename: string): string[] {
  const data = Deno.readFileSync(filename);
  const dataStr = decoder.decode(data);
  const content = dataStr.split(
    "\n",
    // Catch for an empty deps file, eg `mainDepsContent` is [""] when an empty file
  ).filter((line) => line.trim() !== "" && line.startsWith("//"));
  return content;
}

const allImports: Imports = [];

const mainDepsContent = getDepFileContent("./deps.ts");
for (
  const mainImport of gatherImportsFromDepContent(mainDepsContent, "deps.ts")
) {
  allImports.push(mainImport);
}

// Catch for an empty deps file, eg `mainDepsContent` is [""] when an empty file
const testDirName = await getTestDirectoryName();
if (testDirName !== null) {
  const testDepsContent = getDepFileContent(`./${testDirName}/deps.ts`);
  for (
    const testImport of gatherImportsFromDepContent(
      testDepsContent,
      testDirName + "/deps.ts",
    )
  ) {
    allImports.push(testImport);
  }
}

let hasUnusedImports = false;

for (
  const imp
    of (await iterateOverDirectoryAndCheckIfImportsAreUsed(".", allImports))
) {
  if (imp.isUsed === false) {
    hasUnusedImports = true;
    console.warn(
      colours.yellow(
        `Import "${imp.name}" is unused, originating from "${imp.file}"`,
      ),
    );
  }
}

Deno.exit(hasUnusedImports === true ? 1 : 0);
