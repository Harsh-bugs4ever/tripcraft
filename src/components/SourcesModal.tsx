import React, { useRef, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import type { Source } from "../types/trip";
export function SourcesModal({
  sources,
  onClose,
}: {
  sources: Source[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      className="m-auto p-0 border-0 rounded-2xl bg-[#f6f8f0] w-[min(550px,94vw)] backdrop:bg-black/40 text-[var(--text)]"
    >
      <div className="p-5 flex justify-between border-b">
        <div>
          <h2 className="font-semibold">Behind your recommendations</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Sources show what was retrieved, not a guarantee.
          </p>
        </div>
        <button aria-label="Close sources" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <div className="p-5 max-h-[65vh] overflow-auto space-y-4">
        {sources.length ? (
          sources.map((s) => (
            <article
              className="border rounded-xl p-4 text-xs space-y-2"
              key={s.id}
            >
              <strong>{s.title || s.provider}</strong>
              <p>
                {s.provider} · Checked{" "}
                {new Date(s.retrievedAt).toLocaleString()}
              </p>
              <a
                className="underline flex gap-2"
                href={s.url}
                target="_blank"
                rel="noreferrer"
              >
                Open source <ExternalLink size={13} />
              </a>
            </article>
          ))
        ) : (
          <p className="text-sm">
            This demo uses illustrative fixtures. No live place facts have been
            verified. Use Directions to check a venue before visiting.
          </p>
        )}
      </div>
    </dialog>
  );
}
