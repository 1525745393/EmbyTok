import React, { useState, useCallback } from 'react';
import { FavoriteCollection, EmbyItem } from '../types';
import { MediaClient } from '../services/MediaClient';
import { X, Plus, Trash2, Edit, Heart, Play, Folder, MoreVertical } from 'lucide-react';
import { useTranslation } from '../src/hooks';

interface FavoritesManagerProps {
  collections: FavoriteCollection[];
  client: MediaClient | null;
  items: Map<string, EmbyItem>;
  onSelectVideo: (item: EmbyItem) => void;
  onCreateCollection: (name: string) => void;
  onDeleteCollection: (collectionId: string) => void;
  onRenameCollection: (collectionId: string, newName: string) => void;
  onAddToCollection: (itemId: string, collectionId: string) => void;
  onRemoveFromCollection: (itemId: string, collectionId: string) => void;
  onClose: () => void;
}

const FavoritesManager: React.FC<FavoritesManagerProps> = ({
  collections,
  client,
  items,
  onSelectVideo,
  onCreateCollection,
  onDeleteCollection,
  onRenameCollection,
  onAddToCollection,
  onRemoveFromCollection,
  onClose,
}) => {
  const { t } = useTranslation();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [renameCollectionName, setRenameCollectionName] = useState('');

  const allFavorites = collections.flatMap((c) => c.itemIds);
  const uniqueFavorites = [...new Set(allFavorites)];

  const currentCollection = selectedCollectionId
    ? collections.find((c) => c.id === selectedCollectionId)
    : null;

  const displayItems = currentCollection ? currentCollection.itemIds : uniqueFavorites;

  const handleCreateCollection = useCallback(() => {
    if (newCollectionName.trim()) {
      onCreateCollection(newCollectionName.trim());
      setNewCollectionName('');
      setShowCreateModal(false);
    }
  }, [newCollectionName, onCreateCollection]);

  const handleRenameCollection = useCallback(() => {
    if (showRenameModal && renameCollectionName.trim()) {
      onRenameCollection(showRenameModal, renameCollectionName.trim());
      setRenameCollectionName('');
      setShowRenameModal(null);
    }
  }, [showRenameModal, renameCollectionName, onRenameCollection]);

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <h2 className="text-xl font-bold text-white">{t.favorites?.title || '收藏'}</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          <span>{t.favorites?.createCollection || '创建合集'}</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r border-zinc-800 overflow-y-auto">
          <div className="p-4">
            <button
              onClick={() => setSelectedCollectionId(null)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                !selectedCollectionId
                  ? 'bg-indigo-600/20 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Heart size={20} className={!selectedCollectionId ? 'text-indigo-500' : ''} />
              <span>{t.favorites?.all || '全部收藏'}</span>
              <span className="ml-auto text-zinc-500">{uniqueFavorites.length}</span>
            </button>

            <div className="mt-2 space-y-1">
              {collections.map((collection) => (
                <div key={collection.id} className="relative group">
                  <button
                    onClick={() => setSelectedCollectionId(collection.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      selectedCollectionId === collection.id
                        ? 'bg-indigo-600/20 text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <Folder
                      size={20}
                      className={selectedCollectionId === collection.id ? 'text-indigo-500' : ''}
                    />
                    <span className="truncate">{collection.name}</span>
                    <span className="ml-auto text-zinc-500">{collection.itemIds.length}</span>
                  </button>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameCollectionName(collection.name);
                          setShowRenameModal(collection.id);
                        }}
                        className="p-1 text-zinc-500 hover:text-white transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      {collection.id !== 'default' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(collection.id);
                          }}
                          className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {displayItems.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Heart className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-white text-lg font-medium mb-2">
                  {t.favorites?.noFavorites || '暂无收藏'}
                </h3>
                <p className="text-zinc-500">收藏的视频将显示在这里</p>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {displayItems.map((itemId) => {
                  const item = items.get(itemId);
                  if (!item) return null;

                  const imageUrl = client?.getImageUrl(
                    item.Id,
                    item.ImageTags?.Primary || '',
                    'Primary'
                  );

                  return (
                    <div
                      key={itemId}
                      className="bg-zinc-900 rounded-xl overflow-hidden group hover:bg-zinc-800 transition-colors"
                    >
                      <div
                        className="relative aspect-video cursor-pointer"
                        onClick={() => onSelectVideo(item)}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.Name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <Play className="w-10 h-10 text-zinc-700" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="text-white font-medium text-sm truncate">{item.Name}</h3>
                        {currentCollection && (
                          <button
                            onClick={() => onRemoveFromCollection(itemId, currentCollection.id)}
                            className="mt-2 text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            <span>{t.favorites?.removeFromCollection || '从合集移除'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-60">
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-white text-xl font-bold mb-4">
              {t.favorites?.createCollection || '创建合集'}
            </h3>
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder={t.favorites?.collectionName || '合集名称'}
              className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-indigo-500 outline-none mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateCollection();
                if (e.key === 'Escape') setShowCreateModal(false);
              }}
            />
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                {t.favorites?.cancel || '取消'}
              </button>
              <button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.favorites?.create || '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRenameModal && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-60">
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-white text-xl font-bold mb-4">{t.favorites?.rename || '重命名'}</h3>
            <input
              type="text"
              value={renameCollectionName}
              onChange={(e) => setRenameCollectionName(e.target.value)}
              placeholder={t.favorites?.collectionName || '合集名称'}
              className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-indigo-500 outline-none mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameCollection();
                if (e.key === 'Escape') setShowRenameModal(null);
              }}
            />
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowRenameModal(null)}
                className="px-6 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                {t.favorites?.cancel || '取消'}
              </button>
              <button
                onClick={handleRenameCollection}
                disabled={!renameCollectionName.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.favorites?.rename || '重命名'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-60">
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-white text-xl font-bold mb-4">
              {t.favorites?.deleteCollection || '删除合集'}
            </h3>
            <p className="text-zinc-400 mb-6">
              {t.favorites?.deleteConfirm || '确定要删除这个合集吗？合集中的视频不会被删除。'}
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-6 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                {t.favorites?.cancel || '取消'}
              </button>
              <button
                onClick={() => {
                  onDeleteCollection(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t.favorites?.delete || '删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(FavoritesManager);
