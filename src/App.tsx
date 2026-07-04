import { useEffect, useRef, useState } from 'react';
import sampleDsn from './sample/exemple.dsn?raw';
import FileDropzone, { type LoadedFile } from './components/FileDropzone';
import Dashboard from './components/Dashboard';
import { parseDsn } from './dsn/parser';
import type { ParsedFile } from './dsn/model';
import { analyze, type Analysis } from './dsn/analyze';
import { NORME, normeChargee } from './dsn/norme';

/** Laisse le navigateur peindre entre deux etapes (barre de progression fluide). */
const nextFrame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

export default function App() {
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [warnings, setWarnings] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState('');
  const runId = useRef(0);

  // Analyse asynchrone des fichiers, avec progression (une etape par fichier
  // + une etape de consolidation), pour ne pas figer l'UI sans retour visuel.
  useEffect(() => {
    if (files.length === 0) {
      setAnalysis(null);
      setWarnings(0);
      setAnalyzing(false);
      setProgress(0);
      return;
    }

    const id = ++runId.current;
    let cancelled = false;

    (async () => {
      setAnalyzing(true);
      setProgress(0);
      setCurrent('');
      await nextFrame(); // laisse la barre s'afficher a 0%

      const steps = files.length + 1; // fichiers + consolidation
      const parsed: ParsedFile[] = [];
      let warn = 0;
      for (let i = 0; i < files.length; i++) {
        if (cancelled) return;
        setCurrent(files[i].name);
        const p = parseDsn(files[i].text, files[i].name);
        warn += p.warnings.length;
        parsed.push(p);
        setProgress(Math.round(((i + 1) / steps) * 100));
        await nextFrame();
      }

      if (cancelled) return;
      setCurrent('Consolidation…');
      const result = analyze(parsed);
      setProgress(100);
      await nextFrame();

      if (cancelled || id !== runId.current) return;
      setAnalysis(result);
      setWarnings(warn);
      setAnalyzing(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [files]);

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

  const loadSample = () => addFiles([{ name: 'exemple.dsn', text: sampleDsn }]);
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
          {hasData && <FileDropzone compact onLoad={addFiles} onLoadSample={loadSample} />}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {!hasData ? (
          <div className="mx-auto max-w-2xl py-10">
            <FileDropzone onLoad={addFiles} onLoadSample={loadSample} />
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
              {!analyzing && warnings > 0 && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700">
                  {warnings} ligne(s) ignoree(s)
                </span>
              )}
            </div>

            {analyzing ? (
              <ProgressBar progress={progress} current={current} />
            ) : (
              analysis && <Dashboard analysis={analysis} />
            )}
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

function ProgressBar({ progress, current }: { progress: number; current: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">Analyse en cours…</span>
        <span className="tabular-nums text-slate-500">{progress}%</span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {current && <p className="mt-2 truncate text-xs text-slate-400">{current}</p>}
    </div>
  );
}
