import React, { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faSpinner } from '@fortawesome/free-solid-svg-icons';
import FormField from '../../ui/FormField';
import HelpTip from './HelpTip';
import { uploadApi } from '../../../services/apiService';
import { useAdminNotify } from '../../../hooks/useAdminNotify';

export default function ImageUploadField({
  label = 'Photo',
  name,
  value = '',
  onChange,
  folder = 'news',
  required = false,
  help,
  example,
  onFileSelect,
  autoUpload = false,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const { notifyError } = useAdminNotify('upload');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onFileSelect?.(file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange?.({ preview: ev.target.result, url: value });
    };
    reader.readAsDataURL(file);

    if (autoUpload) {
      setUploading(true);
      try {
        const result = await uploadApi.uploadImage(folder, file);
        onChange?.({ preview: result.url, url: result.url, file: null });
      } catch (err) {
        notifyError(err, 'Impossible d\'envoyer la photo. Vérifiez le format (JPG, PNG) et réessayez.');
      } finally {
        setUploading(false);
      }
    } else {
      onChange?.({ preview: URL.createObjectURL(file), url: value, file });
    }
  };

  const preview = value || '';

  return (
    <FormField label={label} name={name} required={required} optionalLabel={!required ? 'Facultatif' : undefined}>
      <div className="image-upload-field">
        <button
          type="button"
          className="image-upload-field__btn"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin /> Envoi en cours…
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faImage} /> Choisir une photo
            </>
          )}
        </button>
        <input
          ref={inputRef}
          id={name}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="visually-hidden"
          onChange={handleFile}
        />
        <HelpTip
          text={help || 'Formats acceptés : JPG, PNG. Taille conseillée : moins de 2 Mo.'}
          example={example}
        />
        {preview ? (
          <div className="image-upload-field__preview">
            <img src={preview} alt="Aperçu de la photo sélectionnée" />
          </div>
        ) : null}
      </div>
    </FormField>
  );
}
