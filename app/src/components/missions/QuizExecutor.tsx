"use client";

import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, AlertCircle, Play, Zap } from "lucide-react";
import { QuizPayload, QuizSubmission } from "@/lib/mission-types";

interface Mission {
  id: string;
  name: string;
  description?: string;
  experienceReward: number;
  manaReward: number;
}

interface QuizExecutorProps {
  mission: Mission;
  payload: QuizPayload;
  onSubmit: (submission: QuizSubmission) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function QuizExecutor({ mission, payload, onSubmit, onCancel, isSubmitting = false }: QuizExecutorProps) {
  // Create default payload if missing
  const safePayload = payload || {
    type: 'COMPLETE_QUIZ' as const,
    passingScore: 70,
    questions: []
  };
  
  // Show error if no questions configured
  if (safePayload.questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-red-400">Ошибка: не настроены вопросы для теста</p>
        <p className="text-sm text-indigo-100/60 mt-2">
          Миссия создана некорректно. Обратитесь к архитектору для добавления вопросов.
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

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const currentQuestion = safePayload.questions[currentQuestionIndex];
  const totalQuestions = safePayload.questions.length;

  // Timer setup
  useEffect(() => {
    if (!isStarted || !safePayload.timeLimit) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, safePayload.timeLimit]);

  const startQuiz = () => {
    setIsStarted(true);
    setStartTime(new Date());
    if (safePayload.timeLimit) {
      setTimeLeft(safePayload.timeLimit * 60); // Convert minutes to seconds
    }
  };

  const handleTimeUp = () => {
    calculateAndSubmitResults();
  };

  const handleAnswerChange = (questionId: string, answerId: string, checked: boolean) => {
    const question = safePayload.questions.find(q => q.id === questionId);
    if (!question) return;

    setAnswers(prev => {
      const current = prev[questionId] || [];
      
      if (question.type === 'single') {
        return { ...prev, [questionId]: checked ? [answerId] : [] };
      } else {
        return {
          ...prev,
          [questionId]: checked 
            ? [...current, answerId]
            : current.filter(id => id !== answerId)
        };
      }
    });
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setTextAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const isQuestionAnswered = (questionId: string) => {
    const question = safePayload.questions.find(q => q.id === questionId);
    if (!question) return false;

    if (question.type === 'text') {
      return textAnswers[questionId]?.trim().length > 0;
    }
    
    return (answers[questionId] || []).length > 0;
  };

  const canProceed = () => {
    if (!currentQuestion.required) return true;
    return isQuestionAnswered(currentQuestion.id);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      calculateAndSubmitResults();
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    
    safePayload.questions.forEach(question => {
      if (question.type === 'text') {
        // For text questions, we consider them correct if answered (actual grading would be manual)
        if (textAnswers[question.id]?.trim()) {
          correctAnswers++;
        }
      } else {
        const userAnswers = answers[question.id] || [];
        const correctAnswerIds = question.correctAnswerIds || [];
        
        // Check if user answers exactly match correct answers
        const isCorrect = userAnswers.length === correctAnswerIds.length &&
          userAnswers.every(id => correctAnswerIds.includes(id));
        
        if (isCorrect) {
          correctAnswers++;
        }
      }
    });

    return Math.round((correctAnswers / totalQuestions) * 100);
  };

  const calculateAndSubmitResults = async () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setShowResults(true);

    const endTime = new Date();
    const timeSpent = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0;

    const submission: QuizSubmission = {
      answers: safePayload.questions.map(question => ({
        questionId: question.id,
        answerIds: answers[question.id] || [],
        textAnswer: textAnswers[question.id]
      })),
      score: finalScore,
      completedAt: endTime.toISOString(),
      timeSpent
    };

    await onSubmit(submission);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Play size={32} className="text-indigo-400" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">{mission.name}</h1>
            {mission.description && (
              <p className="text-indigo-100/70">{mission.description}</p>
            )}
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Информация о тесте</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-indigo-100/70">
                <span className="block">Вопросов:</span>
                <span className="text-white font-medium">{totalQuestions}</span>
              </div>
              <div className="text-indigo-100/70">
                <span className="block">Проходной балл:</span>
                <span className="text-white font-medium">{safePayload.passingScore}%</span>
              </div>
              {safePayload.timeLimit && (
                <div className="text-indigo-100/70">
                  <span className="block">Время:</span>
                  <span className="text-white font-medium">{safePayload.timeLimit} мин</span>
                </div>
              )}
              <div className="text-indigo-100/70">
                <span className="block">Награда:</span>
                <span className="text-white font-medium">{mission.experienceReward} XP + {mission.manaReward} маны</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-6 py-3 rounded-xl border border-white/10 text-indigo-100/80 hover:border-white/30 hover:text-white transition"
              >
                Отмена
              </button>
            )}
            <button
              onClick={startQuiz}
              className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition inline-flex items-center gap-2"
            >
              <Play size={16} />
              Начать тест
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const passed = score >= safePayload.passingScore;
    
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
            passed ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            {passed ? (
              <CheckCircle size={32} className="text-green-400" />
            ) : (
              <AlertCircle size={32} className="text-red-400" />
            )}
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">
              {passed ? 'Тест пройден!' : 'Тест не пройден'}
            </h1>
            <p className={`text-lg ${passed ? 'text-green-400' : 'text-red-400'}`}>
              Ваш результат: {score}%
            </p>
            <p className="text-indigo-100/70">
              {passed 
                ? `Поздравляем! Вы набрали ${score}% и прошли тест (требовалось ${safePayload.passingScore}%)`
                : `К сожалению, вы набрали ${score}%, а для прохождения требовалось ${safePayload.passingScore}%`
              }
            </p>
          </div>

          {passed && (
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

          {!passed && safePayload.allowRetries && (
            <button
              onClick={() => {
                setShowResults(false);
                setIsStarted(false);
                setCurrentQuestionIndex(0);
                setAnswers({});
                setTextAnswers({});
                setScore(0);
              }}
              className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition"
            >
              Попробовать еще раз
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="text-sm text-indigo-100/70">
            Вопрос {currentQuestionIndex + 1} из {totalQuestions}
          </div>
          <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
        
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
            timeLeft < 60 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-indigo-200'
          }`}>
            <Clock size={16} />
            <span className="font-medium">{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-8 mb-8">
        <h2 className="text-xl font-semibold text-white mb-6">
          {currentQuestion.text}
          {currentQuestion.required && (
            <span className="text-red-400 ml-1">*</span>
          )}
        </h2>

        {/* Answer options */}
        {currentQuestion.type === 'text' ? (
          <textarea
            value={textAnswers[currentQuestion.id] || ''}
            onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
            placeholder="Введите ваш ответ..."
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none resize-none"
          />
        ) : (
          <div className="space-y-3">
            {currentQuestion.answers?.map((answer) => (
              <label 
                key={answer.id}
                className="flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition"
              >
                <input
                  type={currentQuestion.type === 'single' ? 'radio' : 'checkbox'}
                  name={currentQuestion.id}
                  checked={(answers[currentQuestion.id] || []).includes(answer.id)}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, answer.id, e.target.checked)}
                  className="mt-1 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-white">{answer.text}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-3 rounded-xl border border-white/10 text-indigo-100/80 hover:border-white/30 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Назад
        </button>

        <div className="flex items-center gap-2 text-sm text-indigo-100/70">
          {safePayload.questions.map((_, index) => (
            <div 
              key={index}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                index === currentQuestionIndex
                  ? 'bg-indigo-500 text-white'
                  : isQuestionAnswered(safePayload.questions[index].id)
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/10 text-indigo-100/40'
              }`}
            >
              {index + 1}
            </div>
          ))}
        </div>

        <button
          onClick={nextQuestion}
          disabled={!canProceed() || isSubmitting}
          className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting 
            ? 'Отправка...'
            : currentQuestionIndex === totalQuestions - 1 
            ? 'Завершить тест' 
            : 'Далее'
          }
        </button>
      </div>
    </div>
  );
}
