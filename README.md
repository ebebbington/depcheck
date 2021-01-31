<p align="center">
  <img height="200" src="./logo.png" alt="depcheck logo">
  <h1 align="center">depcheck</h1>
</p>
<p align="center">Check for unused dependencies</p>
<p align="center">
  <a href="https://github.com/ebebbington/depcheck/releases">
    <img src="https://img.shields.io/github/release/ebebbington/depcheck.svg?color=bright_green&label=latest">
  </a>
  <a href="https://github.com/ebebbington/depcheck/actions">
    <img src="https://img.shields.io/github/workflow/status/ebebbington/depcheck/master?label=tests">
  </a>
  <a href="https://github.com/ebebbington/depcheck/actions">
    <img src="https://img.shields.io/github/workflow/status/ebebbington/depcheck/CodeQL?label=CodeQL">
  </a>
  <a href="https://sonarcloud.io/dashboard?id=ebebbington_depcheck">
    <img src="https://sonarcloud.io/api/project_badges/measure?project=ebebbington_depcheck&metric=alert_status">
  </a>
</p>

---

**depcheck**, inspired by NPM's `depcheck`.

## Table of Contents

- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

```
$ deno run --allow-read='.' https://deno.land/x/depcheck@v1.0.1/mod.ts
```

## Documentation

**depcheck** checks for any unused dependencies in your project. It will pull
dependencies used in `deps.ts` and `tests/deps.ts` or `test/deps.ts`, and check
if each one is used within your project.

You can also pass a `--clean` flag, that will remove these unused
`export`/`import` statements from your `deps.ts` files.

Your project must be formatted before hand, and depcheck can do this for you, if
you pass `--fmt` as a flag.

### Check For Unused Dependencies

```
$ deno run --allow-read='.' https://deno.land/x/depcheck/mod.ts
```

### Check, and Remove Those Unused Dependencies

```
$ deno run --allow-read='.' --allow-write='.' https://deno.land/x/depcheck/mod.ts --clean
```

### Format Your Code Before Checking

```
$ deno run --allow-read='.' --allow-run https://deno.land/x/depcheck/mod.ts --fmt
or
$ deno run --allow-read='.' --allow-run https://deno.land/x/depcheck/mod.ts --fmt --clean
```

## Contributing

Contributors are welcomed!

Please read through our [contributing guidelines](./.github/CONTRIBUTING.md).
Included are directions for opening issues, coding standards, and notes on
development.

## License

By contributing your code, you agree to license your contribution under the
[MIT License](./LICENSE).
