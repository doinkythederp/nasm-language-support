# NASM Language Support

Language features for [NASM Assembly](https://nasm.us/).

## Features

This extension provides syntax highlighting and diagnostics for assembly files (`.asm`, `.nasm`, `.s`). Your system's `nasm` executable is used to detect compile-time errors and warnings such as invalid syntax or likely incorrect code.

This extension *does* provide:

- Syntax highlighting & language configuration
- Code validation on save

This extension *does not* provide:

- Autocomplete or Intellisense

![Demo featuring syntax highlighting and error detection](images/demo.png)
Shown above: NASM Language Support + [Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens), Theme: [Github Dark Default](https://marketplace.visualstudio.com/items?itemName=GitHub.github-vscode-theme)

## Requirements

While syntax highlighting can always be used, you must have a `nasm` binary referenced in your `PATH` environment variable to view code diagnostics.

### Getting a NASM binary on Unix-like systems

Your operating system might have a `nasm` package.

For example:

- macOS ([Homebrew](https://brew.sh/)): `brew install nasm`
- Arch Linux: `pacman -S nasm`
- Debian/Ubuntu: `apt-get install nasm`
- Fedora/RPM-based: `dnf install nasm`, `yum install nasm`

### Downloading a NASM binary

You can also download NASM from their [website](https://nasm.us/). Find a link to the latest version and download the executable for your platform. Then, add it to a folder that's referenced in your PATH, such as `/usr/local/bin`.

## Extension Setting

This extension contributes the following settings:

- `nasm.validate`: If enabled, NASM Language Support will validate your assembly files. This is dependent on you having a `nasm` executable in your `PATH`.
- `nasm.outputFormat`: Changes the executable output format to assemble for. This is neccesary to provide correct errors based on your build target.
- `nasm.reportWarnings`: If disabled, warnings will be supressed.
- `nasm.extraFlags`: Extra flags (for example, `-w+all`) that will be appended when running `nasm` when validating assembly files
