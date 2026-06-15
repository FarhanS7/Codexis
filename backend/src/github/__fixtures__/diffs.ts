// Five fixture strings representing each DiffChangeType.
// Based on real git diff output — these edge cases are commonly encountered in PRs.

export const MODIFIED_FILE_DIFF = `diff --git a/src/auth.ts b/src/auth.ts
index abc123..def456 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -10,7 +10,9 @@
 import { Injectable } from '@nestjs/common'
-import { OldService } from './old'
+import { NewService } from './new'
+import { AnotherService } from './another'
 
 export class AuthService {}`;

export const NEW_FILE_DIFF = `diff --git a/src/new-feature.ts b/src/new-feature.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/new-feature.ts
@@ -0,0 +1,3 @@
+export function newFeature() {
+  return 'hello';
+}`;

export const DELETED_FILE_DIFF = `diff --git a/src/old-file.ts b/src/old-file.ts
deleted file mode 100644
index abc123..0000000
--- a/src/old-file.ts
+++ /dev/null
@@ -1,3 +0,0 @@
-export function oldFeature() {
-  return 'bye';
-}`;

export const RENAMED_FILE_DIFF = `diff --git a/src/auth.ts b/src/authentication.ts
similarity index 95%
rename from src/auth.ts
rename to src/authentication.ts
index abc123..def456 100644
--- a/src/auth.ts
+++ b/src/authentication.ts
@@ -1,3 +1,3 @@
-export class Auth {
+export class Authentication {
   // same
 }`;

export const BINARY_FILE_DIFF = `diff --git a/assets/logo.png b/assets/logo.png
index abc123..def456 100644
Binary files a/assets/logo.png and b/assets/logo.png differ`;

// Multi-hunk diff for testing the two-pointer reconstruction across hunk boundaries
export const MULTI_HUNK_DIFF = `diff --git a/src/service.ts b/src/service.ts
index abc123..def456 100644
--- a/src/service.ts
+++ b/src/service.ts
@@ -1,5 +1,5 @@
 import { A } from './a'
-import { B } from './b'
+import { B2 } from './b2'
 import { C } from './c'
 import { D } from './d'
 import { E } from './e'
@@ -10,4 +10,4 @@
 export class Service {
-  private b: B;
+  private b: B2;
   constructor() {}
 }`;

/**
 * Generate a synthetic large diff for performance testing.
 * Produces a diff with `lineCount` changed lines in a single hunk.
 */
export function generateLargeDiff(lineCount: number): string {
  const header = `diff --git a/src/large.ts b/src/large.ts
index abc123..def456 100644
--- a/src/large.ts
+++ b/src/large.ts
@@ -1,${lineCount} +1,${lineCount} @@`;

  const lines: string[] = [header];
  for (let i = 0; i < lineCount; i++) {
    // Alternate deleted and added lines to maximize state machine transitions
    lines.push(`-const old${i} = ${i};`);
    lines.push(`+const new${i} = ${i + 1};`);
  }

  return lines.join('\n');
}
