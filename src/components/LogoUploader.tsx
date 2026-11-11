'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
} from 'lucide-react';

interface LogoUploaderProps {
  value: string;
  onChange: (dataUrlOrUrl: string) => void;
}

export function LogoUploader({ value, onChange }: LogoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, SVG, or WebP).');
      return;
    }

    setFileName(file.name);
    const sizeInKb = (file.size / 1024).toFixed(1);
    setFileSize(`${sizeInKb} KB`);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = () => {
    onChange('');
    setFileName('');
    setFileSize('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Business Logo
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] font-medium text-blue-600 hover:underline flex items-center gap-1"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? 'Use file uploader' : 'Paste image URL instead'}</span>
        </button>
      </div>

      {showUrlInput ? (
        <div className="space-y-1.5">
          <input
            type="url"
            placeholder="https://yourdomain.com/logo.png"
            value={value.startsWith('data:') ? '' : value}
            onChange={(e) => {
              onChange(e.target.value);
              setFileName('Web Image Link');
              setFileSize('External URL');
            }}
            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <p className="text-[11px] text-slate-400">
            Paste a public direct link to your PNG, SVG, or JPEG image.
          </p>
        </div>
      ) : (
        <>
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-500/10 scale-[1.01]'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />

            <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-2xs">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-sm text-slate-700 font-medium">
              Drag & Drop your logo here or{' '}
              <span className="text-blue-600 underline font-semibold hover:text-blue-700">
                browse files
              </span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports PNG, SVG, JPEG, or WebP (transparent background recommended)
            </p>
          </div>
        </>
      )}

      {/* Uploaded File Card (matches uploaded files list from reference) */}
      {value && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Active Logo
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-12 h-12 rounded-lg border border-slate-100 bg-slate-50 p-1 flex items-center justify-center flex-shrink-0">
                <img
                  src={value}
                  alt="Logo Preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {fileName || 'business-logo.png'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {fileSize || 'Image ready'} • Displayed on quotes, invoices & portal
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0 pl-3">
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ready</span>
              </div>

              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Remove logo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

