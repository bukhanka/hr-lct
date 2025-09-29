"use client";

import React, { useState } from "react";
import { Send, CheckCircle, Zap } from "lucide-react";
import { FormPayload, FormSubmission } from "@/lib/mission-types";

interface Mission {
  id: string;
  name: string;
  description?: string;
  experienceReward: number;
  manaReward: number;
}

interface FormExecutorProps {
  mission: Mission;
  payload: FormPayload;
  onSubmit: (submission: FormSubmission) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function FormExecutor({ mission, payload, onSubmit, onCancel, isSubmitting = false }: FormExecutorProps) {
  const [responses, setResponses] = useState<Record<string, string | string[]>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  // Create default payload if missing
  const safePayload = payload || {
    type: 'SUBMIT_FORM' as const,
    title: 'Заполните форму',
    fields: []
  };
  
  // Show error if no fields configured
  if (safePayload.fields.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-red-400">Ошибка: не настроены поля формы</p>
        <p className="text-sm text-indigo-100/60 mt-2">
          Миссия создана некорректно. Обратитесь к архитектору для добавления полей формы.
        </p>
        {onCancel && (
          <button 
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            Закрыть
          </button>
        )}
      </div>
    );
  }

  const handleFieldChange = (fieldId: string, value: string | string[]) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    const currentValues = (responses[fieldId] as string[]) || [];
    const newValues = checked
      ? [...currentValues, option]
      : currentValues.filter(v => v !== option);
    
    setResponses(prev => ({ ...prev, [fieldId]: newValues }));
  };

  const isFieldValid = (field: any) => {
    if (!field.required) return true;
    
    const value = responses[field.id];
    
    if (field.type === 'checkbox') {
      return Array.isArray(value) && value.length > 0;
    }
    
    return value && (typeof value === 'string' ? value.trim().length > 0 : Array.isArray(value) && value.length > 0);
  };

  const canSubmit = () => {
    return safePayload.fields.every(field => isFieldValid(field));
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    const submission: FormSubmission = {
      responses: safePayload.fields.map(field => ({
        fieldId: field.id,
        value: responses[field.id] || (field.type === 'checkbox' ? [] : '')
      })),
      submittedAt: new Date().toISOString()
    };

    await onSubmit(submission);
    setIsCompleted(true);
  };

  const renderField = (field: any) => {
    const value = responses[field.id];
    const isInvalid = !isFieldValid(field);

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <input
            type={field.type}
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full rounded-xl border px-4 py-3 text-white placeholder:text-indigo-100/40 focus:outline-none transition ${
              isInvalid && field.required
                ? 'border-red-500/50 bg-red-500/10 focus:border-red-400'
                : 'border-white/10 bg-white/5 focus:border-indigo-400'
            }`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full rounded-xl border px-4 py-3 text-white placeholder:text-indigo-100/40 focus:outline-none transition ${
              isInvalid && field.required
                ? 'border-red-500/50 bg-red-500/10 focus:border-red-400'
                : 'border-white/10 bg-white/5 focus:border-indigo-400'
            }`}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={`w-full rounded-xl border px-4 py-3 text-white focus:outline-none transition ${
              isInvalid && field.required
                ? 'border-red-500/50 bg-red-500/10 focus:border-red-400'
                : 'border-white/10 bg-white/5 focus:border-indigo-400'
            }`}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`w-full rounded-xl border px-4 py-3 text-white placeholder:text-indigo-100/40 focus:outline-none resize-none transition ${
              isInvalid && field.required
                ? 'border-red-500/50 bg-red-500/10 focus:border-red-400'
                : 'border-white/10 bg-white/5 focus:border-indigo-400'
            }`}
          />
        );

      case 'select':
        return (
          <select
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={`w-full rounded-xl border px-4 py-3 text-white focus:outline-none transition ${
              isInvalid && field.required
                ? 'border-red-500/50 bg-red-500/10 focus:border-red-400'
                : 'border-white/10 bg-white/5 focus:border-indigo-400'
            }`}
          >
            <option value="" className="bg-slate-900">Выберите вариант...</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option} className="bg-slate-900">
                {option}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {field.options?.map((option: string) => (
              <label key={option} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-white">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {field.options?.map((option: string) => (
              <label key={option} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => handleCheckboxChange(field.id, option, e.target.checked)}
                  className="rounded text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-white">{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Форма отправлена!</h1>
            <p className="text-green-400">
              Ваши ответы успешно сохранены
            </p>
            <p className="text-indigo-100/70">
              Спасибо за участие! Ваша обратная связь очень важна для нас.
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
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8 space-y-4">
        <h1 className="text-2xl font-bold text-white">{mission.name}</h1>
        {mission.description && (
          <p className="text-indigo-100/70">{mission.description}</p>
        )}
      </div>

      {/* Form */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-white">{safePayload.title}</h2>
            {safePayload.description && (
              <p className="text-indigo-100/70">{safePayload.description}</p>
            )}
          </div>

          <div className="space-y-6">
            {safePayload.fields.map((field, index) => (
              <div key={field.id} className="space-y-2">
                <label className="block">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-white font-medium">{field.label}</span>
                    {field.required && (
                      <span className="text-red-400 text-sm">*</span>
                    )}
                  </div>
                  {renderField(field)}
                </label>
                
                {!isFieldValid(field) && field.required && (
                  <p className="text-red-400 text-sm mt-1">
                    Это поле обязательно для заполнения
                  </p>
                )}
                
                {field.validation?.minLength && field.type === 'text' && (
                  <p className="text-indigo-100/50 text-sm">
                    Минимум {field.validation.minLength} символов
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Form validation summary */}
          {safePayload.fields.some(field => field.required) && (
            <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
              <p className="text-indigo-200 text-sm">
                * — обязательные поля
              </p>
              <p className="text-indigo-100/70 text-sm mt-1">
                Заполнены: {safePayload.fields.filter(field => isFieldValid(field)).length} / {safePayload.fields.filter(field => field.required).length} обязательных полей
              </p>
            </div>
          )}
        </div>
      </div>

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
          <Send size={16} />
          {isSubmitting ? 'Отправка...' : safePayload.submitButtonText || 'Отправить форму'}
        </button>
      </div>
    </div>
  );
}
