import React, { useState, ChangeEvent, DragEvent, FormEvent } from "react";
import { Order } from "../types";
import { X, Upload, Check, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import GlowButton from "./GlowButton";

interface QRCheckoutModalProps {
  order: Order | null;
  onClose: () => void;
  onSubmitPayment: (minecraftUsername: string, screenshotBase64: string, notes: string) => Promise<void>;
}

export default function QRCheckoutModal({ order, onClose, onSubmitPayment }: QRCheckoutModalProps) {
  const [minecraftUsername, setMinecraftUsername] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  if (!order) return null;

  // Read file base64
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setError("Screenshot must be smaller than 8MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setError("Screenshot must be smaller than 8MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!minecraftUsername.trim()) {
      setError("Please specify your Minecraft in-game username.");
      return;
    }
    if (!screenshot) {
      setError("Please upload your UPI transaction confirmation screenshot.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmitPayment(minecraftUsername.trim(), screenshot, notes);
      setSubmitting(false);
    } catch (err: any) {
      setError(err?.message || "Failed to submit payment screenshot. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-slate-900/90 border border-purple-500/20 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.25)] p-6 z-10 text-slate-100 overflow-hidden"
      >
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full" />

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Order Portal</span>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
            Secure QR Payment & Checkout
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Complete your purchase securely. Scan the QR code below using any UPI App (GPay, PhonePe, Paytm, AmazonPay, or BHIM).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Payment Instructions & QR */}
          <div className="flex flex-col items-center p-4 bg-black/40 border border-white/5 rounded-xl text-center relative overflow-hidden">
            <span className="absolute top-2 right-2 text-[9px] font-bold text-emerald-400 border border-emerald-400/20 bg-emerald-500/5 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
              LIVE UPI SCANNER
            </span>
            
            <p className="text-xs text-slate-300 font-bold mb-3 mt-4">
              Scan & Pay Exact Amount: <span className="text-purple-400 font-extrabold text-sm">₹{order.totalPrice}</span>
            </p>

            {/* Custom stylized UPI QR Code illustration */}
            <div className="relative p-3 bg-white rounded-xl shadow-lg border border-purple-500/20 group hover:shadow-cyan-500/20 transition-all duration-300">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=minerift@upi%26pn=MineRift%2520Server%26am=1.00%26cu=INR%26tn=Order_"
                alt="Payment QR Code"
                className="w-40 h-40 object-contain rounded-md"
              />
              <div className="absolute inset-0 border-2 border-dashed border-purple-500/40 rounded-xl pointer-events-none group-hover:border-cyan-500/40 transition-colors" />
            </div>

            <div className="mt-4 text-left w-full space-y-1.5 text-[11px] text-slate-400 border-t border-white/5 pt-3">
              <p className="flex justify-between">
                <span>UPI ID:</span>
                <span className="font-mono text-slate-200 select-all">minerift@upi</span>
              </p>
              <p className="flex justify-between">
                <span>Account Name:</span>
                <span className="text-slate-200">MineRift Cloud Server</span>
              </p>
              <p className="flex justify-between">
                <span>Transaction Ref:</span>
                <span className="font-mono text-slate-300">{order.id}</span>
              </p>
            </div>
            
            <p className="text-[10px] text-slate-500 italic mt-3 leading-tight">
              * Ranks & coins will be auto-dispatched into the server as soon as the screenshot is approved.
            </p>
          </div>

          {/* Column 2: Upload fields & Credentials */}
          <div className="flex flex-col gap-4">
            {/* Minecraft Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Minecraft IGN (In-Game Name) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Steve_PvP"
                required
                value={minecraftUsername}
                onChange={(e) => setMinecraftUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Enter your exact username. Capitalization counts.
              </p>
            </div>

            {/* Screenshot Upload Drag & Drop */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Upload Payment Receipt Screenshot <span className="text-rose-500">*</span>
              </label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  dragActive ? "border-purple-500 bg-purple-500/5" : "border-white/10 hover:border-purple-500/30 bg-black/20"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {screenshot ? (
                  <div className="flex flex-col items-center text-center">
                    <Check className="w-8 h-8 text-emerald-400 mb-2" />
                    <p className="text-xs text-slate-300 font-medium">Screenshot Selected</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[180px] mt-0.5">Success! Ready to submit.</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setScreenshot(null); }}
                      className="mt-2 text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Remove & Upload New
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <Upload className="w-8 h-8 text-slate-500 mb-2 group-hover:text-purple-400 transition-colors" />
                    <p className="text-xs text-slate-300 font-medium">Drag & Drop receipt or <span className="text-purple-400 underline">Browse</span></p>
                    <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, or WEBP up to 8MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Optional Notes
              </label>
              <textarea
                placeholder="Mention special request or discount coupon applied..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Actions */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              
              <GlowButton
                type="submit"
                disabled={submitting}
                variant="primary"
                glowColor="purple"
                className="!text-xs font-bold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Confirm Payment
                  </>
                )}
              </GlowButton>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
