'use client';

import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, AlertCircle, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPT_STRING = 'image/jpeg,image/png,image/webp';

export interface PendingImage {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  url?: string;
  error?: string;
}

export interface ImageUploadHandle {
  uploadPending: () => Promise<boolean>;
  hasPending: () => boolean;
}

export interface ImageUploadProps {
  existingImages?: string[];
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
  folder?: string;
  single?: boolean;
  label?: string;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    const ext = file.type.split('/')[1]?.toUpperCase() || file.type;
    return `Invalid file type "${ext}". Accepted: PNG, JPEG, WEBP.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `File too large (${mb} MB). Maximum size is 5 MB.`;
  }
  return null;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const ImageUpload = forwardRef<ImageUploadHandle, ImageUploadProps>(function ImageUpload(
  {
    existingImages = [],
    onImagesChange,
    maxImages = 5,
    folder = 'shopmyuniform/products',
    single = false,
    label = 'Product Images',
  },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<PendingImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const totalSlots = single ? 1 : maxImages;
  const remainingSlots = totalSlots - existingImages.length - files.length;

  const uploadAll = useCallback(async (): Promise<boolean> => {
    setFiles((current) => {
      const pending = current.filter((f) => f.status === 'pending');
      if (pending.length === 0) return current;

      setUploading(true);
      setGlobalError('');

      // Mark all pending as uploading
      const updated = current.map((f) =>
        f.status === 'pending' ? { ...f, status: 'uploading' as const } : f
      );

      // Perform uploads asynchronously
      (async () => {
        try {
          const dataUrls: string[] = [];
          for (const f of pending) {
            const dataUrl = await readFileAsDataUrl(f.file);
            dataUrls.push(dataUrl);
          }

          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: dataUrls, folder }),
          });

          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Upload failed');

          const uploadedUrls: string[] = json.data.map(
            (item: { secure_url: string }) => item.secure_url
          );

          setFiles((prev) => {
            const final = prev.map((f) => {
              if (f.status === 'uploading') {
                const idx = pending.findIndex((p) => p.id === f.id);
                return { ...f, status: 'done' as const, url: uploadedUrls[idx] };
              }
              return f;
            });

            // Collect all done URLs and notify parent
            const doneUrls = final.filter((f) => f.status === 'done' && f.url).map((f) => f.url!);
            // We need to call onImagesChange but can't here in setState
            // Use a microtask instead
            queueMicrotask(() => {
              onImagesChange([...existingImages, ...doneUrls]);
            });

            return final;
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Upload failed';
          setGlobalError(message);
          setFiles((prev) =>
            prev.map((f) =>
              f.status === 'uploading' ? { ...f, status: 'error' as const, error: message } : f
            )
          );
        } finally {
          setUploading(false);
        }
      })();

      return updated;
    });

    // Wait for uploading to finish
    return new Promise<boolean>((resolve) => {
      const check = () => {
        setFiles((current) => {
          const hasUploading = current.some((f) => f.status === 'uploading');
          const hasError = current.some((f) => f.status === 'error');
          if (hasUploading) {
            requestAnimationFrame(check);
            return current;
          }
          resolve(!hasError);
          return current;
        });
      };
      requestAnimationFrame(check);
    });
  }, [existingImages, onImagesChange, folder]);

  useImperativeHandle(ref, () => ({
    uploadPending: uploadAll,
    hasPending: () => files.some((f) => f.status === 'pending'),
  }));

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setGlobalError('');
      const selected = Array.from(e.target.files || []);
      if (selected.length === 0) return;

      if (selected.length > remainingSlots) {
        setGlobalError(
          `Cannot add ${selected.length} image${selected.length > 1 ? 's' : ''}. Only ${remainingSlots} slot${remainingSlots !== 1 ? 's' : ''} remaining.`
        );
        if (inputRef.current) inputRef.current.value = '';
        return;
      }

      const newFiles: PendingImage[] = [];
      for (const file of selected) {
        const error = validateFile(file);
        if (error) {
          setGlobalError(error);
          continue;
        }
        const preview = await readFileAsDataUrl(file);
        newFiles.push({
          id: generateId(),
          file,
          preview,
          status: 'pending',
        });
      }

      if (newFiles.length > 0) {
        setFiles((prev) => {
          const updated = [...prev, ...newFiles];
          return single ? updated.slice(-1) : updated;
        });
      }

      if (inputRef.current) inputRef.current.value = '';
    },
    [remainingSlots, single]
  );

  const removePendingFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const removeExistingImage = useCallback(
    (url: string) => {
      onImagesChange(existingImages.filter((u) => u !== url));
    },
    [existingImages, onImagesChange]
  );

  const pendingCount = files.filter((f) => f.status === 'pending').length;

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>

      {/* Existing uploaded images */}
      {existingImages.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {existingImages.map((url, idx) => (
            <div
              key={`existing-${idx}`}
              className="relative group h-28 w-28 rounded-xl border border-border/40 overflow-hidden bg-muted shadow-premium-sm"
            >
              <img src={url} alt={`Image ${idx + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeExistingImage(url)}
                className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[8px] font-bold text-white uppercase">
                Saved
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending / uploading files */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {files.map((f) => (
            <div
              key={f.id}
              className={cn(
                'relative group h-28 w-28 rounded-xl border overflow-hidden bg-muted shadow-premium-sm',
                f.status === 'error'
                  ? 'border-destructive/60'
                  : f.status === 'done'
                    ? 'border-emerald-500/40'
                    : 'border-border/40'
              )}
            >
              <img src={f.preview} alt="Preview" className="h-full w-full object-cover" />

              {f.status === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
              {f.status === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-destructive/70">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              )}
              {f.status === 'done' && (
                <div className="absolute bottom-1 left-1 rounded bg-emerald-500/80 px-1.5 py-0.5 text-[8px] font-bold text-white uppercase">
                  Uploaded
                </div>
              )}

              {(f.status === 'pending' || f.status === 'error') && (
                <button
                  type="button"
                  onClick={() => removePendingFile(f.id)}
                  className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add image dropzone */}
      {remainingSlots > 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-border/60 bg-muted/20 p-6 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 transition-all hover:border-primary/50 hover:bg-muted/40 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed',
            single && existingImages.length > 0 && 'hidden'
          )}
        >
          <ImageIcon className="h-5 w-5" />
          {single ? 'Choose Image' : `Add Image (${remainingSlots} remaining)`}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_STRING}
        multiple={!single}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Inline upload trigger */}
      {pendingCount > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            await uploadAll();
          }}
          disabled={uploading}
          className="gap-2 text-xs font-bold uppercase tracking-wider"
        >
          {uploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" />
              Upload {pendingCount} Image{pendingCount !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      )}

      {/* Global error */}
      {globalError && (
        <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-[10px] font-bold uppercase tracking-wider text-destructive border border-destructive/20 leading-relaxed">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {globalError}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/70 font-semibold">
        Accepted: PNG, JPEG, WEBP. Max 5 MB per image.
        {single ? '' : ` Max ${maxImages} images.`}
      </p>
    </div>
  );
});
