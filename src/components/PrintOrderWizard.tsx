import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Studio, PrintProduct, User, PrintOrder } from '../db/types.js';
import { apiRequest } from '../utils/apiClient.js';
import { playCameraShutter } from '../utils/soundEffects.js';

interface PrintOrderWizardProps {
  isOpen: boolean;
  onClose: () => void;
  studio: Studio;
  products: PrintProduct[];
  currentUser: User | null;
  onOrderComplete: (order: PrintOrder, paymentMethod: string) => void;
  onRequireLogin: () => void;
}

export const PrintOrderWizard: React.FC<PrintOrderWizardProps> = ({
  isOpen,
  onClose,
  studio,
  products,
  currentUser,
  onOrderComplete,
  onRequireLogin
}) => {
  const [step, setStep] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState(currentUser?.address || 'Cainta, Rizal');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'cash' | 'bank_transfer'>('gcash');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<PrintOrder | null>(null);

  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];
  const totalAmount = (selectedProduct?.price || 0) * quantity;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitOrder = async () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    if (!uploadedPhoto) {
      setErrorMsg('Please upload a photo for printing');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      playCameraShutter();
      const payload = {
        studioId: studio.id,
        productId: selectedProduct.id,
        quantity,
        uploadedPhoto,
        paymentMethod,
        shippingAddress,
        notes
      };

      const order = await apiRequest<PrintOrder>('/api/print-orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setCompletedOrder(order);
      setStep(5);
      onOrderComplete(order, paymentMethod);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place print order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 animate-scaleUp">
        {/* Header */}
        <div className="bg-[#2c2a29] text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base leading-tight">Order Fine-Art Prints & Keepsakes</h3>
            <p className="text-xs text-amber-400">Fulfilled by {studio.name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-stone-100 px-6 py-2 border-b border-stone-200 flex justify-between text-xs text-stone-600 font-medium">
          <span className={step === 1 ? 'font-bold text-amber-700' : ''}>1. Product</span>
          <span className={step === 2 ? 'font-bold text-amber-700' : ''}>2. Upload Photo</span>
          <span className={step === 3 ? 'font-bold text-amber-700' : ''}>3. 3D Mockup</span>
          <span className={step === 4 ? 'font-bold text-amber-700' : ''}>4. Payment</span>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: PRODUCT */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="font-bold text-stone-900 text-sm">Choose Print Medium & Dimensions</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedProductId === p.id
                        ? 'border-amber-600 bg-amber-50/50 shadow-md'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <img src={p.image} alt={p.name} className="w-full h-28 object-cover rounded-xl mb-2" />
                    <div className="flex justify-between items-start">
                      <h5 className="font-bold text-xs text-stone-900 leading-tight">{p.name}</h5>
                      <span className="text-xs font-bold text-amber-600">₱{p.price.toLocaleString()}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-stone-500 flex justify-between">
                      <span>Size: {p.size}</span>
                      <span>Turnaround: ~{p.estimatedHours}h</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="text-xs font-semibold text-stone-700">Quantity:</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-xs p-1.5 border border-stone-300 rounded-lg text-center font-bold"
                />
              </div>
            </div>
          )}

          {/* STEP 2: UPLOAD PHOTO */}
          {step === 2 && (
            <div className="space-y-4 text-center">
              <h4 className="font-bold text-stone-900 text-sm">Upload High-Resolution Photo</h4>
              <p className="text-xs text-stone-500">Supported formats: JPEG, PNG, WEBP (Minimum recommended 300 DPI)</p>

              <div className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl p-6 bg-stone-50 transition-colors flex flex-col items-center justify-center cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {uploadedPhoto ? (
                  <div className="space-y-2">
                    <img
                      src={uploadedPhoto}
                      alt="Upload Preview"
                      className="max-h-48 mx-auto rounded-xl object-contain shadow-md"
                    />
                    <p className="text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Photo loaded! Click to change.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-stone-800">Click or Drag & Drop Photo Here</p>
                    <p className="text-[11px] text-stone-400">Archival studio calibration will be applied</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: 3D MOCKUP PREVIEW */}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <h4 className="font-bold text-stone-900 text-sm">3D Physical Wall Mockup Preview</h4>
              <p className="text-xs text-stone-500">Perspective rendering of your {selectedProduct.name}</p>

              {/* 3D Frame Presentation */}
              <div className="py-6 flex items-center justify-center bg-stone-100 rounded-2xl overflow-hidden">
                <div
                  style={{
                    perspective: '1000px'
                  }}
                >
                  <div
                    style={{
                      transform: 'rotateY(-12deg) rotateX(6deg)',
                      boxShadow: '16px 24px 40px rgba(0,0,0,0.3), -4px -4px 10px rgba(255,255,255,0.7)',
                      borderRadius: '8px',
                      background: '#1c1917',
                      padding: '14px'
                    }}
                    className="transition-transform duration-500 hover:scale-105"
                  >
                    <div className="bg-white p-2 rounded shadow-inner">
                      <img
                        src={uploadedPhoto || selectedProduct.image}
                        alt="3D Mockup"
                        className="w-64 h-48 object-cover rounded"
                      />
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono mt-2 tracking-widest uppercase text-center">
                      {selectedProduct.size} • {studio.name}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PAYMENT & SHIPPING */}
          {step === 4 && (
            <div className="space-y-4">
              <h4 className="font-bold text-stone-900 text-sm">Delivery Address & Payment</h4>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Cainta Shipping Address / Pickup</label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  placeholder="Street, Barangay, Cainta, Rizal or 'Studio Pickup'"
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Special Instructions</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Matte finish, gift wrapping, high contrast"
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Order total */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-stone-600 block">{selectedProduct.name} (x{quantity})</span>
                  <span className="text-stone-400 text-[11px]">Turnaround: ~{selectedProduct.estimatedHours} hours</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 uppercase font-medium">Total</span>
                  <div className="text-base font-bold text-amber-600">₱{totalAmount.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SUCCESS */}
          {step === 5 && completedOrder && (
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-stone-900">Print Order Placed!</h4>
              <p className="text-xs text-stone-600">
                Order ID: <strong>{completedOrder.id}</strong>. The studio is preparing your prints.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 5 && (
          <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="text-xs font-bold text-stone-600 px-3 py-2"
              >
                Back
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 2 && !uploadedPhoto) {
                    setErrorMsg('Please select or upload a photo');
                    return;
                  }
                  setErrorMsg(null);
                  setStep(step + 1);
                }}
                className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl shadow-sm"
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitOrder}
                className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white px-6 py-2.5 rounded-xl shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Placing Order...' : 'Place Print Order'}
              </button>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 text-center">
            <button
              onClick={onClose}
              className="text-xs font-bold text-stone-700 px-6 py-2 rounded-xl border border-stone-300"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
