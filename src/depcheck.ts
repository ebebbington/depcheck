import { colours } from "../deps.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

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
  } catch (err) {
    // doesn't exist, try "tests"
    try {
      await Deno.stat("tests");
      return "tests";
    } catch (err) {
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
    // skip empty lines
    if (line === "") {
      return;
    }

    // Get imports
    const namedImportRegexOnNewLineMatch = line.match(
      namedImportRegexOnNewline,
    );
    if (
      namedImportRegexOnNewLineMatch && namedImportRegexOnNewLineMatch.length
    ) {
      const theImport = namedImportRegexOnNewLineMatch[0].replace("  ", "");
      // BUT check if they we already have it, eg a user exports it twice
      if (imports.filter((imp) => imp.name === theImport).length >= 1) {
        console.warn(colours.red(`${theImport} is used more than once`));
      } else {
        imports.push({
          name: theImport,
          isUsed: false,
          file: fileImportsExtractedFrom,
          regex: new RegExp("  " + theImport),
        });
      }
    }

    const defaultImportRegexMatch = line.match(defaultImportRegex);
    if (defaultImportRegexMatch && defaultImportRegexMatch.length) {
      const theImport = defaultImportRegexMatch[0].replace("export * as ", "");
      if (imports.filter((imp) => imp.name === theImport).length >= 1) {
        console.warn(colours.red(`${theImport} is used more than once`));
      } else {
        imports.push({
          name: theImport,
          isUsed: false,
          file: fileImportsExtractedFrom,
          regex: new RegExp("export * from " + theImport),
        });
      }
    }

    const namedRegexOnSameLineMatch = line.match(namedRegexOnSameLine);
    if (namedRegexOnSameLineMatch && namedRegexOnSameLineMatch.length) {
      const theImports = namedRegexOnSameLineMatch[0]
        .replace("{", "")
        .replace("}", "")
        .replace(" ", "")
        .split(", ");
      theImports.forEach((theImport) => {
        if (imports.filter((imp) => imp.name === theImport).length >= 1) {
          console.warn(colours.red(`${theImport} is used more than once`));
        } else {
          theImport = theImport.replace(" ", "");
          imports.push({
            name: theImport,
            isUsed: false,
            file: fileImportsExtractedFrom,
            regex: new RegExp(theImport),
          });
        }
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
    if (
      dirEntry.name.indexOf(".ts") > 0 && dirEntry.name.indexOf("deps.ts") < 0
    ) {
      const fileContent = decoder.decode(
        Deno.readFileSync(dir + "/" + dirEntry.name),
      );
      imports.forEach((imp, i) => {
        if (fileContent.indexOf(imp.name) > 0) {
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

const args = Deno.args;

if (args.indexOf("--fmt") >= 0) {
  const p = Deno.run({
    cmd: ["deno", "fmt"],
  });
  await p.status();
  p.close();
}

let allImports: Imports = [];

// Catch for an empty deps file, eg `mainDepsContent` is [""] when an empty file
const mainDepsContent = decoder.decode(Deno.readFileSync("./deps.ts")).split(
  "\n",
);
if ((mainDepsContent.length === 1 && mainDepsContent[0] === "") !== true) { // not empty
  // construct the imports
  const mainImports: Imports = gatherImportsFromDepContent(
    mainDepsContent,
    "deps.ts",
  );
  mainImports.forEach((mainImport) => {
    allImports.push(mainImport);
  });
}

// Catch for an empty deps file, eg `mainDepsContent` is [""] when an empty file
const testDirName = await getTestDirectoryName();
const testDepsContent = decoder.decode(
  await Deno.readFile(`./${testDirName}/deps.ts`),
).split("\n");
if (
  (testDepsContent.length === 1 && testDepsContent[0] === "") !== true &&
  testDirName
) {
  // construct the imports
  const testImports: Imports = gatherImportsFromDepContent(
    testDepsContent,
    testDirName + "/deps.ts",
  );
  testImports.forEach((testImport) => {
    allImports.push(testImport);
  });
}

allImports = await iterateOverDirectoryAndCheckIfImportsAreUsed(
  ".",
  allImports,
);

// check for any unused imports
allImports.forEach((imp) => {
  if (imp.isUsed === false) {
    console.warn(
      colours.yellow(
        `Import "${imp.name}" is unused, originating from "${imp.file}"`,
      ),
    );
  }
});

// And if --clean is passed in, remove these unused imports from the files
if (args[0] === "--clean") {
  allImports.forEach((imp) => {
    if (imp.isUsed === false) {
      const fileContent = decoder.decode(Deno.readFileSync(imp.file)).split("\n");
      fileContent.forEach((line, i) => {
        if (line.match(imp.regex)) {
          fileContent.splice(i, 1);
        }
      });
      // cleanup empty lines at top of file
      while (true) {
        if (fileContent[0] === "") {
          fileContent.splice(0, 1);
        } else {
          break;
        }
      }
      Deno.writeFileSync(imp.file, encoder.encode(fileContent.join("\n")));
    }
  });
  console.info(colours.green("Cleaned up all unused imports"));
}
