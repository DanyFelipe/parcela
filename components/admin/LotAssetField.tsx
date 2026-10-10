'use client';

import { useId, useState } from 'react';

import { uploadLotAsset } from '@/app/admin/actions';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_ASSET_BYTES,
  type AssetKind,
} from '@/lib/admin/asset-constraints';

interface LotAssetFieldProps {
  label: string;
  kind: AssetKind;
  error?: string;
  onChange: (assetPath: string | null) => void;
  onPendingChange: (pending: boolean) => void;
}

const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(',');

export function LotAssetField({
  label,
  kind,
  error,
  onChange,
  onPendingChange,
}: LotAssetFieldProps) {
  const inputId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadError(null);

    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setUploadError('Solo se permiten imágenes JPG, PNG o WebP.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_ASSET_BYTES) {
      setUploadError('La imagen debe pesar hasta 4 MB.');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('kind', kind);
    formData.append('file', file);

    setIsUploading(true);
    onPendingChange(true);

    try {
      const result = await uploadLotAsset(formData);

      if (result.success) {
        onChange(result.path);
        setUploadedFileName(file.name);
      } else {
        setUploadError(result.message);
      }
    } catch {
      setUploadError('No se pudo subir el archivo. Intentá nuevamente.');
    } finally {
      event.target.value = '';
      setIsUploading(false);
      onPendingChange(false);
    }
  }

  function handleRemove() {
    onChange(null);
    setUploadedFileName(null);
    setUploadError(null);
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        disabled={isUploading}
        onChange={handleFileChange}
        className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium disabled:opacity-50"
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {isUploading && 'Subiendo archivo...'}
        {!isUploading && uploadedFileName && `Archivo listo: ${uploadedFileName}`}
        {!isUploading && !uploadedFileName && 'JPG, PNG o WebP de hasta 4 MB.'}
      </p>
      {uploadedFileName && (
        <button
          type="button"
          onClick={handleRemove}
          className="text-xs text-destructive underline-offset-4 hover:underline"
        >
          Quitar archivo
        </button>
      )}
      {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
