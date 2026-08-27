'use client';

import * as React from 'react';
import { Upload, X, FileText, FileSpreadsheet, File, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AcceptedFileType = 'csv' | 'excel' | 'pdf' | 'image' | 'any';

export interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  progress?: number;
}

export interface FileUploadProps {
  /** File types to accept */
  accept?: AcceptedFileType[];
  /** Allow selecting multiple files */
  multiple?: boolean;
  /** Max file size in MB */
  maxSizeMB?: number;
  /** Called when files are selected and ready */
  onFilesChange?: (files: UploadedFile[]) => void;
  /** Called when upload is triggered */
  onUpload?: (files: File[]) => Promise<void>;
  className?: string;
  /** Show as a compact inline trigger instead of a drop zone */
  compact?: boolean;
  /** Label shown on the compact trigger button */
  label?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCEPT_MAP: Record<AcceptedFileType, string> = {
  csv: '.csv,text/csv',
  excel: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
  pdf: '.pdf,application/pdf',
  image: '.png,.jpg,.jpeg,.webp,image/*',
  any: '*',
};

const TYPE_LABELS: Record<AcceptedFileType, string> = {
  csv: 'CSV',
  excel: 'Excel',
  pdf: 'PDF',
  image: 'Images',
  any: 'Any file',
};

function buildAcceptString(types: AcceptedFileType[]): string {
  return types.map((t) => ACCEPT_MAP[t]).join(',');
}

function getFileIcon(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return FileSpreadsheet;
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return FileSpreadsheet;
  if (name.endsWith('.pdf')) return FileText;
  return File;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function uid(): string {
  return Math.random().toString(36).slice(2);
}

// ─── FileRow ──────────────────────────────────────────────────────────────────

function FileRow({
  entry,
  onRemove,
}: {
  entry: UploadedFile;
  onRemove: (id: string) => void;
}) {
  const Icon = getFileIcon(entry.file);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm',
        entry.status === 'error'
          ? 'border-[#f2b3b0] bg-[#fdeceb]'
          : 'border-[#e6e8eb] bg-white'
      )}
    >
      <Icon
        size={16}
        className={cn(
          'flex-shrink-0',
          entry.status === 'error' ? 'text-[#b3261e]' : 'text-[#6b7480]'
        )}
      />

      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-[#14181c]">{entry.file.name}</div>
        <div className="text-xs text-[#8a929b]">{formatSize(entry.file.size)}</div>

        {entry.status === 'uploading' && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#e6e8eb]">
            <div
              className="h-full rounded-full bg-[#2b5fa8] transition-all duration-300"
              style={{ width: `${entry.progress ?? 0}%` }}
            />
          </div>
        )}

        {entry.status === 'error' && entry.error && (
          <div className="mt-0.5 text-xs text-[#b3261e]">{entry.error}</div>
        )}
      </div>

      {entry.status === 'success' && (
        <CheckCircle size={15} className="flex-shrink-0 text-[#146b41]" />
      )}
      {entry.status === 'error' && (
        <AlertCircle size={15} className="flex-shrink-0 text-[#b3261e]" />
      )}
      {(entry.status === 'pending' || entry.status === 'error') && (
        <button
          type="button"
          onClick={() => onRemove(entry.id)}
          className="flex-shrink-0 rounded p-0.5 text-[#a2aab3] hover:bg-[#f2f4f6] hover:text-[#6b7480]"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

// ─── FileUpload ───────────────────────────────────────────────────────────────

export function FileUpload({
  accept = ['csv', 'excel'],
  multiple = false,
  maxSizeMB = 10,
  onFilesChange,
  onUpload,
  className,
  compact = false,
  label = 'Import CSV',
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const acceptString = buildAcceptString(accept);
  const typeLabels = accept.map((t) => TYPE_LABELS[t]).join(', ');
  const maxBytes = maxSizeMB * 1024 * 1024;

  // ── Validate + add files ──────────────────────────────────────────────────

  function addFiles(rawFiles: FileList | File[]) {
    const incoming = Array.from(rawFiles);

    const entries: UploadedFile[] = incoming.map((f) => {
      if (f.size > maxBytes) {
        return {
          id: uid(),
          file: f,
          status: 'error' as const,
          error: `Exceeds ${maxSizeMB} MB limit`,
        };
      }
      return { id: uid(), file: f, status: 'pending' as const };
    });

    const next = multiple ? [...files, ...entries] : entries;
    setFiles(next);
    onFilesChange?.(next);
  }

  function removeFile(id: string) {
    const next = files.filter((f) => f.id !== id);
    setFiles(next);
    onFilesChange?.(next);
  }

  // ── Upload handler ─────────────────────────────────────────────────────────

  async function handleUpload() {
    if (!onUpload) return;
    const valid = files.filter((f) => f.status === 'pending');
    if (!valid.length) return;

    setUploading(true);

    // Simulate progress for each file then hand off to onUpload
    setFiles((prev) =>
      prev.map((f) =>
        f.status === 'pending' ? { ...f, status: 'uploading', progress: 0 } : f
      )
    );

    // Fake progress ticks
    const tick = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading'
            ? { ...f, progress: Math.min((f.progress ?? 0) + 20, 90) }
            : f
        )
      );
    }, 200);

    try {
      await onUpload(valid.map((f) => f.file));
      clearInterval(tick);
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading' ? { ...f, status: 'success', progress: 100 } : f
        )
      );
    } catch (err) {
      clearInterval(tick);
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading' ? { ...f, status: 'error', error: msg } : f
        )
      );
    } finally {
      setUploading(false);
    }
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  // ── Compact mode ───────────────────────────────────────────────────────────

  if (compact) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept={acceptString}
          multiple={multiple}
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <Button
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          className={className}
        >
          <Upload size={14} />
          {label}
        </Button>
      </>
    );
  }

  // ── Full drop-zone mode ────────────────────────────────────────────────────

  const pendingCount = files.filter((f) => f.status === 'pending').length;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={acceptString}
        multiple={multiple}
        className="hidden"
        onChange={(e) => e.target.files && addFiles(e.target.files)}
      />

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragging
            ? 'border-[#2b5fa8] bg-[#eff4fb]'
            : 'border-[#d7dce1] bg-[#fafbfc] hover:border-[#a2aab3] hover:bg-white'
        )}
      >
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
            dragging ? 'bg-[#dce8f7] text-[#2b5fa8]' : 'bg-[#eef0f2] text-[#6b7480]'
          )}
        >
          <Upload size={20} />
        </div>

        <div>
          <p className="text-sm font-medium text-[#14181c]">
            {dragging ? 'Drop files here' : 'Drag & drop or click to browse'}
          </p>
          <p className="mt-1 text-xs text-[#8a929b]">
            {typeLabels} · max {maxSizeMB} MB{multiple ? ' per file' : ''}
          </p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((entry) => (
            <FileRow key={entry.id} entry={entry} onRemove={removeFile} />
          ))}
        </div>
      )}

      {/* Upload action */}
      {onUpload && pendingCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#8a929b]">
            {pendingCount} file{pendingCount > 1 ? 's' : ''} ready to upload
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : `Upload ${pendingCount > 1 ? `${pendingCount} files` : 'file'}`}
          </Button>
        </div>
      )}
    </div>
  );
}
