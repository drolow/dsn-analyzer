import { useMemo, useState } from 'react';
import sampleDsn from './sample/exemple.dsn?raw';
import FileDropzone, { type LoadedFile } from './components/FileDropzone';
import Dashboard from './components/Dashboard';
import { parseFiles } from './dsn/parser';
import { analyze } from './dsn/analyze';
import { NORME, normeChargee } from './dsn/norme';

export default function App() {
  const [files, setFiles] = useState<LoadedFile[]>([]);

  const parsed = useMemo(() => parseFiles(files), [files]);
  const analysis = useMemo(() => analyze(parsed), [parsed]);
  const totalWarnings = parsed.reduce((s, p) => s + p.warnings.length, 0);

  function addFiles(newOnes: LoadedFile[]) {
    setFiles((prev) => {
      const byName = new Map(prev.map((f) => [f.name, f]));
      for (const f of newOnes) byName.set(f.name, f);
      return [...byName.values()];
    });
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  const hasData = files.length > 0;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Analyseur DSN</h1>
            <p className="text-sm text-slate-500">
              Lecture et synthese de fichiers DSN — 100% en local, aucune donnee transmise.
            </p>
          </div>
          {hasData && (
            <FileDropzone compact onLoad={addFiles} onLoadSample={() => addFiles([{ name: 'exemple.dsn', text: sampleDsn }])} />
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {!hasData ? (
          <div className="mx-auto max-w-2xl py-10">
            <FileDropzone
              onLoad={addFiles}
              onLoadSample={() => addFiles([{ name: 'exemple.dsn', text: sampleDsn }])}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {files.map((f) => (
                <span
                  key={f.name}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600"
                >
                  📄 {f.name}
                  <button
                    onClick={() => removeFile(f.name)}
                    className="text-slate-400 hover:text-red-500"
                    aria-label={`Retirer ${f.name}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
              {totalWarnings > 0 && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700">
                  {totalWarnings} ligne(s) ignoree(s)
                </span>
              )}
            </div>

            <Dashboard analysis={analysis} />
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-400">
        Analyseur DSN — traitement local dans le navigateur. Norme DSN phase 3.
        {' · '}
        {normeChargee() ? (
          <span className="text-emerald-600">
            Nomenclatures officielles chargees{NORME.version ? ` (${NORME.version})` : ''}
          </span>
        ) : (
          <span>Nomenclatures integrees par defaut</span>
        )}
      </footer>
    </div>
  );
}
