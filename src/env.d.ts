interface ImportMetaEnv extends Readonly<Record<string, string>> {}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
