import React from 'react';
import type { CustomPage } from '../db/types.js';

interface CustomPageViewProps {
  page: CustomPage;
  onNavigate: (page: string) => void;
}

export const CustomPageView: React.FC<CustomPageViewProps> = ({ page, onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
        <div>
          <button
            onClick={() => onNavigate('landing')}
            className="text-xs font-semibold text-amber-700 hover:underline mb-2 block"
          >
            ← Back to Home
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">{page.title}</h1>
          <p className="text-xs text-stone-400 mt-1">Last updated: {page.updatedAt}</p>
        </div>

        <div className="prose prose-stone text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
          {page.content}
        </div>
      </div>
    </div>
  );
};
