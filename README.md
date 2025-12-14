HomeMap

Purpose

HomeMap is the canonical entry-point repository for the Quantum918 ecosystem. Its sole responsibility is to discover, explain, and demonstrate the contents of a local filesystem in a deterministic, verifiable, and machine-consumable way.

HomeMap answers a single question:

> “What is on this system, what does it do, and how is it used?”



It is designed to be the first repository a human or an intelligence system runs when encountering a new environment.


---

What HomeMap Does (Precisely)

HomeMap performs an end-to-end pipeline over a local directory (default: $HOME):

1. Discovers files recursively


2. Classifies each file by language and role


3. Explains what the file is and how it is used


4. Demonstrates the file safely when possible


5. Indexes all results into a single knowledge artifact



No conceptual analysis. No simulated output. Every step operates on real files.


---

Core Guarantees

Local-first (no cloud dependency)

Deterministic output for identical inputs

Read-only by default

Safe execution (no uncontrolled runtime)

Machine-readable index


HomeMap never mutates source files.


---

Directory Structure

HomeMap/
├── bin/            # Entry scripts and CLI wrappers
├── js/             # Browser-side visualizers (optional)
├── css/            # UI styling
├── data/           # Generated indexes and caches
├── docs/           # Architecture notes and specs
├── README.md       # This file


---

How HomeMap Works

1. File Discovery

HomeMap walks the configured root directory and records metadata for each file:

Absolute path

Size

Modified time

Extension

Basic type


Ignored paths include:

.git/

node_modules/

cache directories



---

2. Classification

Each file is classified along two axes:

Language (python, javascript, shell, json, binary, text, etc.)

Role (executable, library, configuration, dataset, artifact)


Classification is rule-based and reproducible.


---

3. Explanation

For each file, HomeMap derives:

What the file is

What problem it solves

How it is typically invoked or consumed

What other files it depends on


This is derived using:

Static analysis (AST parsing where applicable)

Import/include tracing

Shebang and header inspection



---

4. Demonstration

If a file is runnable or previewable, HomeMap attempts a safe demonstration:

Examples:

Python script → --help or dry run

Shell script → usage inspection

Web asset → local preview

Notebook → structural summary


No destructive execution is permitted.


---

5. Knowledge Index

All results are written to a
