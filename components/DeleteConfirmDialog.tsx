import React, { useCallback } from 'react';
import { Translations } from '../src/locales';
import { Trash2 } from 'lucide-react';

type DeleteConfirmTranslations = Translations['videoCard'];

interface DeleteConfirmDialogProps {
  show: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  t: DeleteConfirmTranslations;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = React.memo(
  ({ show, onCancel, onConfirm, t }) => {
    const handleCancel = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onCancel();
      },
      [onCancel]
    );

    const handleConfirm = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onConfirm();
      },
      [onConfirm]
    );

    if (!show) return null;

    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50">
        <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
          <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-500" />
            {t.deleteVideo}
          </h3>
          <p className="text-zinc-300 mb-6">
            {t.deleteWarning}
            <br />
            <br />
            {t.deleteConfirm}
          </p>
          <div className="flex gap-4 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {t.confirmDelete}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

DeleteConfirmDialog.displayName = 'DeleteConfirmDialog';

export default DeleteConfirmDialog;
