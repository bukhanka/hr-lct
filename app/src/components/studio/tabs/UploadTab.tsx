"use client";

import React, { useState, useCallback } from "react";
import { Upload, File, CheckCircle2, XCircle, Loader2, Image, Music } from "lucide-react";
import clsx from "clsx";

interface UploadTabProps {
  campaignId: string;
}

interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = {
  image: ["image/jpeg", "image/png", "image/svg+xml"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg"],
};

export function UploadTab({ campaignId }: UploadTabProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return "Файл слишком большой (макс. 10 МБ)";
    }
    
    const isImage = ALLOWED_TYPES.image.includes(file.type);
    const isAudio = ALLOWED_TYPES.audio.includes(file.type);
    
    if (!isImage && !isAudio) {
      return "Неподдерживаемый формат";
    }
    
    return null;
  };

  const addFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadFile[] = Array.from(fileList).map(file => {
      const error = validateFile(file);
      const preview = file.type.startsWith("image/") 
        ? URL.createObjectURL(file) 
        : undefined;
      
      return {
        id: `${Date.now()}_${file.name}`,
        file,
        preview,
        status: error ? "error" : "pending",
        progress: 0,
        error,
      };
    });
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  }, [addFiles]);

  const uploadFile = async (uploadFile: UploadFile) => {
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id ? { ...f, status: "uploading" } : f
    ));

    try {
      const formData = new FormData();
      formData.append("file", uploadFile.file);
      formData.append("campaignId", campaignId);
      formData.append("type", uploadFile.file.type.startsWith("image/") ? "image" : "audio");

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, progress: i } : f
        ));
      }

      const response = await fetch(`/api/campaigns/${campaignId}/assets/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Ошибка загрузки");
      }

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: "success", progress: 100 } : f
      ));
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: "error", error: error instanceof Error ? error.message : "Ошибка загрузки" } 
          : f
      ));
    }
  };

  const handleUploadAll = () => {
    files
      .filter(f => f.status === "pending")
      .forEach(file => uploadFile(file));
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const pendingCount = files.filter(f => f.status === "pending").length;

  return (
    <div className="flex h-full flex-col p-8">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={clsx(
          "relative overflow-hidden rounded-2xl border-2 border-dashed transition",
          isDragging
            ? "border-indigo-400 bg-indigo-500/10"
            : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
        )}
      >
        <label className="flex cursor-pointer flex-col items-center gap-4 px-6 py-12">
          <div className={clsx(
            "rounded-full p-4 transition",
            isDragging ? "bg-indigo-500/20" : "bg-white/5"
          )}>
            <Upload size={32} className="text-indigo-300" />
          </div>
          
          <div className="text-center">
            <p className="text-lg font-semibold text-white">
              {isDragging ? "Отпустите файлы сюда" : "Перетащите файлы сюда"}
            </p>
            <p className="mt-1 text-sm text-indigo-200/60">
              или{" "}
              <span className="text-indigo-300 underline">выберите с компьютера</span>
            </p>
          </div>

          <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-indigo-200/50">
            <div className="flex items-center gap-1">
              <Image size={14} />
              <span>JPG, PNG, SVG</span>
            </div>
            <div className="flex items-center gap-1">
              <Music size={14} />
              <span>MP3, WAV, OGG</span>
            </div>
            <div>· Макс 10 МБ</div>
          </div>

          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.svg,.mp3,.wav,.ogg"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="custom-scroll mt-6 flex-1 overflow-y-auto pr-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Файлы ({files.length})
            </h3>
            {pendingCount > 0 && (
              <button
                onClick={handleUploadAll}
                className="rounded-lg bg-indigo-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
              >
                Загрузить все ({pendingCount})
              </button>
            )}
          </div>

          <div className="space-y-3">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Preview */}
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/5">
                    {fileItem.preview ? (
                      <img src={fileItem.preview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Music size={20} className="text-indigo-300/60" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {fileItem.file.name}
                    </p>
                    <p className="text-xs text-indigo-200/60">
                      {formatFileSize(fileItem.file.size)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-3">
                    {fileItem.status === "pending" && (
                      <button
                        onClick={() => uploadFile(fileItem)}
                        className="rounded-lg bg-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-200 transition hover:bg-indigo-500/30"
                      >
                        Загрузить
                      </button>
                    )}
                    {fileItem.status === "uploading" && (
                      <div className="flex items-center gap-2 text-xs text-indigo-300">
                        <Loader2 size={16} className="animate-spin" />
                        {fileItem.progress}%
                      </div>
                    )}
                    {fileItem.status === "success" && (
                      <CheckCircle2 size={20} className="text-green-400" />
                    )}
                    {fileItem.status === "error" && (
                      <div className="flex items-center gap-2">
                        <XCircle size={20} className="text-red-400" />
                        <span className="text-xs text-red-300">{fileItem.error}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="text-indigo-200/60 transition hover:text-red-400"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {fileItem.status === "uploading" && (
                  <div className="h-1 bg-white/5">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${fileItem.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
