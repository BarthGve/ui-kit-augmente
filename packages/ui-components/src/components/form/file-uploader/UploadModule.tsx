import { useRef, useState } from "react";
import { useCunningham } from ":/components/provider";
import { FileUploader, FileUploaderProps } from "./FileUploader";
import { UploadFile } from "./types";
import { formatBytes, isAccepted } from "./utils";

export type UploadContext = {
  /** Reports the progress of the upload, from 0 to 100. */
  onProgress: (percent: number) => void;
  /** Aborted when the file is cancelled or removed while uploading. */
  signal: AbortSignal;
};

export type UploadModuleProps = Omit<
  FileUploaderProps,
  "files" | "onAddFiles" | "onRemoveFile" | "onCancelFile" | "onRetryFile"
> & {
  /**
   * Uploads one file. The module makes no network call itself: resolve when
   * the upload is done, reject when it fails.
   */
  upload: (file: File, context: UploadContext) => Promise<void>;
  /** Called with the tracked files each time one changes. */
  onFilesChange?: (files: UploadFile[]) => void;
};

/**
 * Upload module: `FileUploader` plus the state of each file. Chosen or dropped
 * files are checked against `maxSize` and `accept`, then uploaded through the
 * caller's `upload` function, with progress, cancel and retry. Progress and
 * results are announced in a live region.
 */
export const UploadModule = ({
  upload,
  onFilesChange,
  accept,
  maxSize,
  multiple = false,
  ...props
}: UploadModuleProps) => {
  const { t } = useCunningham();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const filesRef = useRef<UploadFile[]>([]);
  const controllers = useRef(new Map<string, AbortController>());

  const commit = (next: UploadFile[]) => {
    filesRef.current = next;
    setFiles(next);
    onFilesChange?.(next);
  };
  const patch = (id: string, changes: Partial<UploadFile>) => {
    // A file that left the list (cancelled, removed) stays out.
    if (!filesRef.current.some((f) => f.id === id)) {
      return;
    }
    commit(
      filesRef.current.map((f) => (f.id === id ? { ...f, ...changes } : f)),
    );
  };
  const stop = (id: string) => {
    controllers.current.get(id)?.abort();
    controllers.current.delete(id);
  };

  const start = (file: UploadFile) => {
    const name = file.originalFile.name;
    const controller = new AbortController();
    controllers.current.set(file.id, controller);
    patch(file.id, {
      status: "uploading",
      progress: 0,
      error: undefined,
      errorDetails: undefined,
      retryable: true,
    });
    setAnnouncement(t("components.upload.announce_uploading", { name }));
    upload(file.originalFile, {
      signal: controller.signal,
      onProgress: (percent) => patch(file.id, { progress: percent }),
    }).then(
      () => {
        if (controller.signal.aborted) return;
        controllers.current.delete(file.id);
        patch(file.id, { status: "done", progress: 100 });
        setAnnouncement(t("components.upload.announce_done", { name }));
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        controllers.current.delete(file.id);
        patch(file.id, {
          status: "error",
          retryable: true,
          errorDetails: error instanceof Error ? error.message : undefined,
        });
        setAnnouncement(t("components.upload.announce_failed", { name }));
      },
    );
  };

  const rejection = (file: File) => {
    if (maxSize !== undefined && file.size > maxSize) {
      return t("components.upload.too_large", { size: formatBytes(maxSize) });
    }
    if (!isAccepted(file, accept)) {
      return t("components.upload.type_not_accepted");
    }
    return undefined;
  };

  const onAddFiles = (next: UploadFile[]) => {
    const known = new Set(filesRef.current.map((f) => f.id));
    const kept = next.filter((f) => known.has(f.id));
    // Single mode replaces the file: whatever left the list is stopped.
    filesRef.current
      .filter((f) => !next.some((n) => n.id === f.id))
      .forEach((f) => stop(f.id));
    const added = next.filter((f) => !known.has(f.id));
    const checked = added.map((f) => ({
      file: f,
      reason: rejection(f.originalFile),
    }));
    commit([
      ...kept.map(
        (f) => filesRef.current.find((c) => c.id === f.id) as UploadFile,
      ),
      ...checked.map(({ file, reason }) =>
        reason
          ? {
              ...file,
              status: "error" as const,
              error: reason,
              retryable: false,
            }
          : file,
      ),
    ]);
    checked.forEach(({ file, reason }) => {
      if (reason) {
        setAnnouncement(
          t("components.upload.announce_rejected", {
            name: file.originalFile.name,
            reason,
          }),
        );
      } else {
        start(file);
      }
    });
  };

  const remove = (file: UploadFile) => {
    stop(file.id);
    commit(filesRef.current.filter((f) => f.id !== file.id));
  };

  return (
    <>
      <FileUploader
        {...props}
        accept={accept}
        maxSize={maxSize}
        multiple={multiple}
        files={files}
        onAddFiles={onAddFiles}
        onRemoveFile={remove}
        onCancelFile={(file) => {
          remove(file);
          setAnnouncement(
            t("components.upload.announce_cancelled", {
              name: file.originalFile.name,
            }),
          );
        }}
        onRetryFile={start}
      />
      <div role="status" aria-live="polite" className="c__offscreen">
        {announcement}
      </div>
    </>
  );
};
