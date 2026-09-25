import React, { useState } from 'react';
import { Star, MessageSquare, Send, CheckCircle2, ExternalLink, ShieldAlert, Upload } from 'lucide-react';
import type { PhotoProofing, User } from '../db/types.js';
import { apiRequest } from '../utils/apiClient.js';

interface ClientGalleryProps {
  proofing: PhotoProofing;
  currentUser: User | null;
  isStudioOwner: boolean;
  onUpdate: (updated: PhotoProofing) => void;
}

export const ClientGallery: React.FC<ClientGalleryProps> = ({
  proofing,
  currentUser,
  isStudioOwner,
  onUpdate
}) => {
  const [photos, setPhotos] = useState(proofing.photos);
  const [watermarkText, setWatermarkText] = useState(proofing.watermarkText);
  const [watermarkPos, setWatermarkPos] = useState(proofing.watermarkPosition);
  const [watermarkOpacity, setWatermarkOpacity] = useState(proofing.watermarkOpacity);
  const [finalDriveLink, setFinalDriveLink] = useState(proofing.finalDriveLink || '');

  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Toggle favorite photo (Customer)
  const toggleStar = (photoId: string) => {
    setPhotos(prev =>
      prev.map(p => (p.id === photoId ? { ...p, isStarred: !p.isStarred } : p))
    );
  };

  const updateFeedback = (photoId: string, feedback: string) => {
    setPhotos(prev =>
      prev.map(p => (p.id === photoId ? { ...p, clientFeedback: feedback } : p))
    );
  };

  // Submit selections to studio
  const handleSubmitSelections = async () => {
    setIsSaving(true);
    try {
      await apiRequest(`/api/photo-proofing/${proofing.id}/photos`, {
        method: 'PUT',
        body: JSON.stringify({
          photos,
          status: 'selections_submitted'
        })
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
      onUpdate({ ...proofing, photos, status: 'selections_submitted' });
    } catch (err) {
      alert('Failed to submit selections');
    } finally {
      setIsSaving(false);
    }
  };

  // Deliver final photos (Studio)
  const handleDeliverPhotos = async () => {
    if (!finalDriveLink) return;
    setIsSaving(true);
    try {
      await apiRequest(`/api/photo-proofing/${proofing.id}/deliver`, {
        method: 'PUT',
        body: JSON.stringify({ finalDriveLink })
      });
      onUpdate({ ...proofing, finalDriveLink, status: 'delivered' });
    } catch (err) {
      alert('Failed to deliver final link');
    } finally {
      setIsSaving(false);
    }
  };

  // Upload proof photo
  const handleAddProofPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const newPhoto = {
        id: `ph_${Date.now()}`,
        url: dataUrl,
        isStarred: false,
        clientFeedback: '',
        originalName: file.name
      };
      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);
      await apiRequest(`/api/photo-proofing/${proofing.id}/photos`, {
        method: 'PUT',
        body: JSON.stringify({ photos: updatedPhotos })
      });
      onUpdate({ ...proofing, photos: updatedPhotos });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Status */}
      <div className="bg-stone-900 text-white p-6 rounded-3xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">Proofing Gallery & Retouch Selections</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-600 text-white">
              {proofing.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Star your favorite shots and leave detailed retouch notes. Only watermarked previews are shown until final release.
          </p>
        </div>

        {proofing.finalDriveLink && (
          <a
            href={proofing.finalDriveLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md self-start md:self-auto"
          >
            <ExternalLink className="w-4 h-4" /> Download High-Res Drive Files
          </a>
        )}
      </div>

      {/* Studio Admin Tools */}
      {isStudioOwner && (
        <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" /> Studio Controls & Watermarking
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700">Watermark Text</label>
              <input
                type="text"
                value={watermarkText}
                onChange={e => setWatermarkText(e.target.value)}
                className="w-full text-xs p-2 border border-stone-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700">Watermark Position</label>
              <select
                value={watermarkPos}
                onChange={e => setWatermarkPos(e.target.value as any)}
                className="w-full text-xs p-2 border border-stone-300 rounded-lg bg-white"
              >
                <option value="repeat_diagonal">Repeat Diagonal (Anti-Piracy)</option>
                <option value="center">Center Stamp</option>
                <option value="bottom_right">Bottom Right Corner</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700">Opacity ({watermarkOpacity})</label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={watermarkOpacity}
                onChange={e => setWatermarkOpacity(parseFloat(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-amber-200 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-amber-600" /> Add Proof Photo
              <input type="file" accept="image/*" onChange={handleAddProofPhoto} className="hidden" />
            </label>

            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="Google Drive Final Folder URL..."
                value={finalDriveLink}
                onChange={e => setFinalDriveLink(e.target.value)}
                className="text-xs p-1.5 border border-stone-300 rounded-lg w-64 bg-white"
              />
              <button
                onClick={handleDeliverPhotos}
                className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500"
              >
                Deliver Final Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proofing Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {photos.map(photo => (
          <div
            key={photo.id}
            className={`relative bg-white rounded-2xl overflow-hidden border-2 transition-shadow hover:shadow-lg ${
              photo.isStarred ? 'border-amber-500 shadow-md' : 'border-stone-200'
            }`}
          >
            {/* Watermarked photo presentation */}
            <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden select-none">
              <img
                src={photo.url}
                alt="Proof item"
                className="w-full h-full object-cover pointer-events-none"
                onContextMenu={e => e.preventDefault()}
              />

              {/* Watermark overlay */}
              {watermarkPos === 'repeat_diagonal' && (
                <div
                  className="absolute inset-0 pointer-events-none flex flex-wrap items-center justify-center gap-8 overflow-hidden transform -rotate-12 select-none"
                  style={{ opacity: watermarkOpacity }}
                >
                  {Array.from({ length: 9 }).map((_, i) => (
                    <span
                      key={i}
                      className="text-xs sm:text-sm font-black tracking-widest text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase whitespace-nowrap"
                    >
                      {watermarkText}
                    </span>
                  ))}
                </div>
              )}

              {watermarkPos === 'center' && (
                <div
                  className="absolute inset-0 pointer-events-none flex items-center justify-center select-none"
                  style={{ opacity: watermarkOpacity }}
                >
                  <span className="text-base font-black tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase">
                    {watermarkText}
                  </span>
                </div>
              )}

              {watermarkPos === 'bottom_right' && (
                <div
                  className="absolute bottom-2 right-2 pointer-events-none select-none"
                  style={{ opacity: watermarkOpacity }}
                >
                  <span className="text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">
                    {watermarkText}
                  </span>
                </div>
              )}

              {/* Star Button */}
              <button
                type="button"
                onClick={() => toggleStar(photo.id)}
                className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-transform active:scale-90 ${
                  photo.isStarred
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-black/40 text-white hover:bg-black/60'
                }`}
                title={photo.isStarred ? 'Starred for final retouch' : 'Click to star'}
              >
                <Star className={`w-4 h-4 ${photo.isStarred ? 'fill-white' : ''}`} />
              </button>
            </div>

            {/* Retouch Notes per photo */}
            <div className="p-3 bg-white space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span className="font-mono text-[10px] truncate max-w-[150px]">
                  {photo.originalName || photo.id}
                </span>
                {photo.isStarred && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    Selected
                  </span>
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Retouch note (e.g. soften skin, remove glare)..."
                  value={photo.clientFeedback || ''}
                  onChange={e => updateFeedback(photo.id, e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-stone-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-md flex items-center justify-between">
        <div className="text-xs text-stone-600">
          <strong className="text-stone-900">{photos.filter(p => p.isStarred).length}</strong> photos starred for final retouching
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSubmitSelections}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-colors"
        >
          <Send className="w-4 h-4" />
          {isSaving ? 'Submitting...' : 'Submit Selections to Studio'}
        </button>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Your photo selections and retouch notes have been submitted to the studio.
        </div>
      )}
    </div>
  );
};
