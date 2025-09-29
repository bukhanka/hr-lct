"use client";

import React, { useState, useCallback } from "react";
import { Upload, Download, File, X, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { FileUploadPayload, FileUploadSubmission } from "@/lib/mission-types";

interface Mission {
  id: string;
  name: string;
  description?: string;
  experienceReward: number;
  manaReward: number;
  confirmationType: string;
}

interface FileUploadExecutorProps {
  mission: Mission;
  payload: FileUploadPayload;
  onSubmit: (submission: FileUploadSubmission) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

interface UploadedFile {
  id: string;
  file: File;
  url: string;
  uploadedAt: string;
}

export function FileUploadExecutor({ mission, payload, onSubmit, onCancel, isSubmitting = false }: FileUploadExecutorProps) {
  // Create default payload if missing
  const safePayload = payload || {
    type: 'UPLOAD_FILE' as const,
    allowedFormats: ['pdf', 'docx'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    requiredFiles: 1
  };
  
  // FileUploadExecutor doesn't require specific validation as basic config is sufficient

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > safePayload.maxFileSize) {
      const maxMB = Math.round(safePayload.maxFileSize / (1024 * 1024));
      return `Файл слишком большой. Максимальный размер: ${maxMB} МБ`;
    }

    // Check file format
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !safePayload.allowedFormats.includes(extension)) {
      return `Неподдерживаемый формат. Разрешены: ${safePayload.allowedFormats.join(', ')}`;
    }

    return null;
  };

  const simulateUpload = async (file: File): Promise<string> => {
    // Simulate file upload delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // In real implementation, this would upload to your server/cloud storage
    // For now, create a mock URL
    return `https://files.example.com/${Date.now()}-${file.name}`;
  };

  const handleFileUpload = async (files: FileList) => {
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    // Check total file count
    const totalFiles = uploadedFiles.length + validFiles.length;
    if (totalFiles > safePayload.requiredFiles) {
      newErrors.push(`Максимум ${safePayload.requiredFiles} файлов разрешено`);
      return;
    }

    setErrors(newErrors);

    // Upload valid files
    for (const file of validFiles) {
      try {
        const url = await simulateUpload(file);
        const uploadedFile: UploadedFile = {
          id: `file_${Date.now()}_${Math.random()}`,
          file,
          url,
          uploadedAt: new Date().toISOString()
        };
        
        setUploadedFiles(prev => [...prev, uploadedFile]);
      } catch (error) {
        setErrors(prev => [...prev, `Ошибка загрузки ${file.name}`]);
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setErrors([]);
  };

  const canSubmit = () => {
    return uploadedFiles.length >= safePayload.requiredFiles && uploadedFiles.length <= safePayload.requiredFiles;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    const submission: FileUploadSubmission = {
      files: uploadedFiles.map(file => ({
        fileName: file.file.name,
        fileUrl: file.url,
        uploadedAt: file.uploadedAt,
        fileSize: file.file.size
      }))
    };

    await onSubmit(submission);
    setIsCompleted(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Байт';
    const k = 1024;
    const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isAutoSubmission = mission.confirmationType === 'AUTO';

  if (isCompleted && isAutoSubmission) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Файлы загружены!</h1>
            <p className="text-green-400">
              Успешно загружено {uploadedFiles.length} файлов
            </p>
            <p className="text-indigo-100/70">
              Ваши файлы приняты и миссия завершена автоматически.
            </p>
          </div>

          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30 p-6">
            <div className="flex items-center justify-center gap-2 text-indigo-200 mb-2">
              <Zap size={16} />
              <span className="font-medium">Награда получена</span>
            </div>
            <div className="text-2xl font-bold text-white">
              +{mission.experienceReward} XP • +{mission.manaReward} маны
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8 space-y-4">
        <h1 className="text-2xl font-bold text-white">{mission.name}</h1>
        {mission.description && (
          <p className="text-indigo-100/70 max-w-2xl mx-auto">{mission.description}</p>
        )}
      </div>

      {/* Template Download */}
      {safePayload.templateFileUrl && (
        <div className="bg-indigo-500/10 rounded-xl border border-indigo-500/30 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Download size={20} className="text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium mb-1">Шаблон для заполнения</h3>
              <p className="text-indigo-200/70 text-sm">
                Скачайте и заполните шаблон, затем загрузите готовый файл
              </p>
            </div>
            <a
              href={safePayload.templateFileUrl}
              download
              className="px-4 py-2 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition inline-flex items-center gap-2"
            >
              <Download size={16} />
              Скачать
            </a>
          </div>
        </div>
      )}

      {/* Instructions */}
      {safePayload.instructions && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
          <h3 className="text-white font-medium mb-3">Инструкции</h3>
          <p className="text-indigo-100/70 whitespace-pre-line">{safePayload.instructions}</p>
        </div>
      )}

      {/* File Requirements */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
        <h3 className="text-white font-medium mb-4">Требования к файлам</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-indigo-200/70">Количество файлов:</span>
            <div className="text-white font-medium">{safePayload.requiredFiles}</div>
          </div>
          <div>
            <span className="text-indigo-200/70">Максимальный размер:</span>
            <div className="text-white font-medium">{formatFileSize(safePayload.maxFileSize)}</div>
          </div>
          <div>
            <span className="text-indigo-200/70">Форматы:</span>
            <div className="text-white font-medium">{safePayload.allowedFormats.join(', ').toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${
          isDragging
            ? 'border-indigo-400 bg-indigo-500/10'
            : uploadedFiles.length >= safePayload.requiredFiles
            ? 'border-green-500/50 bg-green-500/10'
            : 'border-white/20 bg-white/5 hover:border-indigo-400/50 hover:bg-indigo-500/5'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center space-y-4">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
            uploadedFiles.length >= safePayload.requiredFiles
              ? 'bg-green-500/20 text-green-400'
              : 'bg-indigo-500/20 text-indigo-400'
          }`}>
            {uploadedFiles.length >= safePayload.requiredFiles ? (
              <CheckCircle size={24} />
            ) : (
              <Upload size={24} />
            )}
          </div>
          
          <div>
            <p className="text-white font-medium mb-2">
              {uploadedFiles.length >= safePayload.requiredFiles
                ? 'Все файлы загружены!'
                : 'Перетащите файлы сюда или нажмите для выбора'
              }
            </p>
            <p className="text-indigo-100/50 text-sm">
              Загружено: {uploadedFiles.length} / {safePayload.requiredFiles}
            </p>
          </div>

          <input
            type="file"
            multiple={safePayload.requiredFiles > 1}
            accept={safePayload.allowedFormats.map(f => `.${f}`).join(',')}
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={uploadedFiles.length >= safePayload.requiredFiles}
          />
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8 space-y-3">
          <h3 className="text-white font-medium">Загруженные файлы</h3>
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <File size={16} className="text-indigo-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{file.file.name}</p>
                <p className="text-indigo-100/50 text-sm">
                  {formatFileSize(file.file.size)} • Загружен {new Date(file.uploadedAt).toLocaleTimeString()}
                </p>
              </div>
              
              <button
                onClick={() => removeFile(file.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-8 space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-4 mt-8">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl border border-white/10 text-indigo-100/80 hover:border-white/30 hover:text-white transition"
          >
            Отмена
          </button>
        )}
        
        <button
          onClick={handleSubmit}
          disabled={!canSubmit() || isSubmitting}
          className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          <Upload size={16} />
          {isSubmitting 
            ? 'Отправка...'
            : mission.confirmationType === 'AUTO' 
            ? 'Завершить миссию'
            : 'Отправить на проверку'
          }
        </button>
      </div>
    </div>
  );
}
