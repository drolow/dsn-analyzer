import { useCallback, useRef, useState } from 'react';

export interface LoadedFile {
  name: string;
  text: string;
}

interface Props {
  onLoad: (files: LoadedFile[]) => void;
  onLoadSample: () => void;
  compact?: boolean;
}

/** Zone de depot de fichiers DSN (drag & drop + selection). 100% local. */
export default function FileDropzone({ onLoad, onLoadSample, compact }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = await Promise.all(
        Array.from(fileList).map(
          (f) =>
            new Promise<LoadedFile>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve({ name: f.name, text: String(reader.result ?? '') });
              reader.onerror = () => reject(reader.error);
              reader.readAsText(f);
            }),
        ),
      );
      onLoad(files);
    },
    [onLoad],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void readFiles(e.dataTransfer.files);
      }}
      className={[
        'rounded-xl border-2 border-dashed transition-colors text-center',
        compact ? 'p-4' : 'p-10',
        dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-white',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".dsn,.txt,text/plain"
        className="hidden"
        onChange={(e) => void readFiles(e.target.files)}
      />
      {!compact && (
        <div className="mb-3 text-4xl" aria-hidden>
          📄
        </div>
      )}
      <p className="font-medium text-slate-700">
        Glissez vos fichiers DSN ici{compact ? '' : ', ou'}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Choisir des fichiers
        </button>
        <button
          type="button"
          onClick={onLoadSample}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Charger un exemple
        </button>
      </div>
      {!compact && (
        <p className="mt-4 text-xs text-slate-400">
          Vos fichiers ne quittent jamais votre navigateur : tout est analyse en local.
        </p>
      )}
    </div>
  );
}
