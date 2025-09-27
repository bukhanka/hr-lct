"use client";

import React, { useState } from "react";
import { Send, CheckCircle, FileText, Link as LinkIcon, Upload, Zap } from "lucide-react";
import { CustomSubmission } from "@/lib/mission-types";

interface Mission {
  id: string;
  name: string;
  description?: string;
  experienceReward: number;
  manaReward: number;
  confirmationType: string;
}

interface CustomExecutorProps {
  mission: Mission;
  onSubmit: (submission: CustomSubmission) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function CustomExecutor({ mission, onSubmit, onCancel, isSubmitting = false }: CustomExecutorProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submissionType, setSubmissionType] = useState<'text' | 'file' | 'link'>('text');
  const [isCompleted, setIsCompleted] = useState(false);

  const handleFileUpload = (files: FileList) => {
    const fileArray = Array.from(files);
    setAttachments(prev => [...prev, ...fileArray]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const canSubmit = () => {
    if (submissionType === 'text' || submissionType === 'link') {
      return content.trim().length > 0;
    }
    return attachments.length > 0 || content.trim().length > 0;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    // In a real implementation, files would be uploaded to server/cloud storage
    const mockFileUploads = attachments.map(file => ({
      fileName: file.name,
      fileUrl: `https://files.example.com/${Date.now()}-${file.name}`
    }));

    const submission: CustomSubmission = {
      content,
      attachments: mockFileUploads,
      submittedAt: new Date().toISOString()
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

  const requiresManualReview = mission.confirmationType === 'MANUAL_REVIEW';

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">
              {requiresManualReview ? 'Отправлено на проверку!' : 'Задание выполнено!'}
            </h1>
            <p className="text-green-400">
              Ваш ответ успешно сохранен
            </p>
            <p className="text-indigo-100/70">
              {requiresManualReview 
                ? 'Модератор проверит ваше задание в ближайшее время. Результат будет отправлен в уведомления.'
                : 'Спасибо за выполнение задания!'
              }
            </p>
          </div>

          {!requiresManualReview && (
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30 p-6">
              <div className="flex items-center justify-center gap-2 text-indigo-200 mb-2">
                <Zap size={16} />
                <span className="font-medium">Награда получена</span>
              </div>
              <div className="text-2xl font-bold text-white">
                +{mission.experienceReward} XP • +{mission.manaReward} маны
              </div>
            </div>
          )}
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
          <p className="text-indigo-100/70 max-w-2xl mx-auto whitespace-pre-line">
            {mission.description}
          </p>
        )}
        
        {requiresManualReview && (
          <div className="bg-yellow-500/10 rounded-xl border border-yellow-500/30 p-4 max-w-lg mx-auto">
            <div className="flex items-center gap-3 text-sm text-yellow-200">
              <CheckCircle size={16} />
              <span>Задание требует ручной проверки модератором</span>
            </div>
          </div>
        )}
      </div>

      {/* Submission Type Selector */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
        <h3 className="text-white font-medium mb-4">Как вы хотите ответить?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setSubmissionType('text')}
            className={`p-4 rounded-xl border transition-all ${
              submissionType === 'text'
                ? 'border-indigo-500 bg-indigo-500/20 text-white'
                : 'border-white/10 bg-white/5 text-indigo-100/70 hover:border-white/30 hover:text-white'
            }`}
          >
            <FileText size={20} className="mx-auto mb-2" />
            <div className="text-sm font-medium">Текстовый ответ</div>
            <div className="text-xs mt-1 opacity-70">Написать описание или эссе</div>
          </button>
          
          <button
            onClick={() => setSubmissionType('link')}
            className={`p-4 rounded-xl border transition-all ${
              submissionType === 'link'
                ? 'border-indigo-500 bg-indigo-500/20 text-white'
                : 'border-white/10 bg-white/5 text-indigo-100/70 hover:border-white/30 hover:text-white'
            }`}
          >
            <LinkIcon size={20} className="mx-auto mb-2" />
            <div className="text-sm font-medium">Ссылка</div>
            <div className="text-xs mt-1 opacity-70">Прикрепить ссылку на работу</div>
          </button>
          
          <button
            onClick={() => setSubmissionType('file')}
            className={`p-4 rounded-xl border transition-all ${
              submissionType === 'file'
                ? 'border-indigo-500 bg-indigo-500/20 text-white'
                : 'border-white/10 bg-white/5 text-indigo-100/70 hover:border-white/30 hover:text-white'
            }`}
          >
            <Upload size={20} className="mx-auto mb-2" />
            <div className="text-sm font-medium">Файлы</div>
            <div className="text-xs mt-1 opacity-70">Загрузить документы/изображения</div>
          </button>
        </div>
      </div>

      {/* Content Input */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
        {submissionType === 'text' && (
          <div className="space-y-4">
            <h3 className="text-white font-medium">Ваш ответ</h3>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Опишите детально, как вы выполнили задание. Включите все важные детали, выводы и результаты..."
              rows={12}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none resize-none"
            />
            <div className="text-sm text-indigo-100/50 text-right">
              Символов: {content.length}
            </div>
          </div>
        )}

        {submissionType === 'link' && (
          <div className="space-y-4">
            <h3 className="text-white font-medium">Ссылка на вашу работу</h3>
            <input
              type="url"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="https://drive.google.com/... или https://github.com/..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none"
            />
            <textarea
              value={content.includes('http') ? '' : content}
              onChange={(e) => {
                if (!content.includes('http')) {
                  setContent(e.target.value);
                }
              }}
              placeholder="Дополнительные комментарии к ссылке (необязательно)..."
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none resize-none"
            />
          </div>
        )}

        {submissionType === 'file' && (
          <div className="space-y-4">
            <h3 className="text-white font-medium">Загрузка файлов</h3>
            
            {/* File upload area */}
            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-indigo-400/50 hover:bg-indigo-500/5 transition-colors">
              <Upload size={32} className="mx-auto mb-4 text-indigo-400" />
              <p className="text-white mb-2">Перетащите файлы сюда или нажмите для выбора</p>
              <p className="text-indigo-100/50 text-sm mb-4">
                Поддерживаются: изображения, документы, архивы (макс. 10 МБ на файл)
              </p>
              <input
                type="file"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.zip,.rar"
              />
            </div>

            {/* Uploaded files */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-white font-medium">Загруженные файлы:</h4>
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-indigo-400">📄</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{file.name}</p>
                      <p className="text-indigo-100/50 text-xs">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Additional comments */}
            <div>
              <label className="text-white font-medium block mb-2">Комментарии к файлам (необязательно)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Расскажите о загруженных файлах, что в них содержится..."
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
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
          <Send size={16} />
          {isSubmitting 
            ? 'Отправка...'
            : requiresManualReview
            ? 'Отправить на проверку'
            : 'Завершить миссию'
          }
        </button>
      </div>
    </div>
  );
}
