import React, { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { ScrollReveal } from './MotionCard.js';
import type { FAQ } from '../db/types.js';
import { apiRequest } from '../utils/apiClient.js';

interface FAQAccordionProps {
  faqs?: FAQ[];
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({ faqs: initialFaqs }) => {
  const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs || []);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    if (!initialFaqs || initialFaqs.length === 0) {
      apiRequest<FAQ[]>('/api/faqs')
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setFaqs(data);
          }
        })
        .catch(() => {});
    } else {
      setFaqs(initialFaqs);
    }
  }, [initialFaqs]);

  const categories = ['All', ...Array.from(new Set(faqs.map(item => item.category || 'General')))];

  const filteredItems = selectedCategory === 'All'
    ? faqs
    : faqs.filter(item => (item.category || 'General') === selectedCategory);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (faqs.length === 0) {
    return null;
  }

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <ScrollReveal>
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider border border-amber-200/60 shadow-xs">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Frequently Asked Questions
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Everything You Need to Know About Booking in Cainta
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Got questions about GCash QR downpayments, online proofing galleries, or studio schedules? We've got answers.
          </p>
        </div>

        {/* Category Filter Tabs */}
        {categories.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setOpenIndex(0);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Accordion List */}
        <div className="space-y-4">
          {filteredItems.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.id || idx}
                className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden transition-all duration-200 hover:border-amber-400"
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/50">
                      {item.category || 'General'}
                    </span>
                    <span className="font-bold text-base sm:text-lg text-stone-900">
                      {item.question}
                    </span>
                  </div>
                  <div className={`p-2 rounded-xl bg-stone-100 text-stone-600 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-amber-50 text-amber-700' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-stone-600 leading-relaxed font-normal border-t border-stone-100 bg-stone-50/50">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollReveal>
    </section>
  );
};
