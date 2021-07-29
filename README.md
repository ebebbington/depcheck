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
$ deno run --allow-read='.' https://deno.land/x/depcheck@v2.1.0/mod.ts
```

You can even use this as a step in your CI, as if unused dependencies are found,
the process will fail.

## Documentation

**depcheck** checks for any unused dependencies in your project. It will pull
dependencies used in `deps.ts` and `tests/deps.ts`/`test/deps.ts` (if either
exist), and check if each one is used within your project, returning a response
of if any dependencies are unused.

Alternatively, you can pass in an argument to explicitely tell depcheck to check
that file. Depcheck will still try check a tests `deps.ts` automatically:

```
$ deno run --allow-read ='.' https://deno.land/x/depcheck/v2.0.0/mod.ts deps.js
```

## License

By contributing your code, you agree to license your contribution under the
[MIT License](./LICENSE).
