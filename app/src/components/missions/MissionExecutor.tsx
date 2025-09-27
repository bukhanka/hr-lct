"use client";

import React, { useState } from "react";
import { 
  MissionPayload,
  QuizPayload, 
  VideoPayload, 
  FileUploadPayload, 
  FormPayload,
  OfflineEventPayload,
  OnlineEventPayload,
  MissionSubmission
} from "@/lib/mission-types";
import { QuizExecutor } from "./QuizExecutor";
import { VideoExecutor } from "./VideoExecutor";
import { FileUploadExecutor } from "./FileUploadExecutor";
import { FormExecutor } from "./FormExecutor";
import { EventExecutor } from "./EventExecutor";
import { CustomExecutor } from "./CustomExecutor";

interface Mission {
  id: string;
  name: string;
  description?: string;
  missionType: string;
  experienceReward: number;
  manaReward: number;
  confirmationType: string;
  payload?: MissionPayload | null;
}

interface MissionExecutorProps {
  mission: Mission;
  onSubmit: (submission: MissionSubmission) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function MissionExecutor({ mission, onSubmit, onCancel, isSubmitting = false }: MissionExecutorProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleSubmit = async (submission: MissionSubmission) => {
    try {
      setIsCompleting(true);
      await onSubmit(submission);
    } catch (error) {
      console.error('Error submitting mission:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const renderMissionExecutor = () => {
    const { payload, missionType } = mission;

    switch (missionType) {
      case 'COMPLETE_QUIZ':
        return (
          <QuizExecutor 
            mission={mission}
            payload={payload as QuizPayload}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            isSubmitting={isCompleting}
          />
        );
      
      case 'WATCH_VIDEO':
        return (
          <VideoExecutor 
            mission={mission}
            payload={payload as VideoPayload}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            isSubmitting={isCompleting}
          />
        );
      
      case 'UPLOAD_FILE':
        return (
          <FileUploadExecutor 
            mission={mission}
            payload={payload as FileUploadPayload}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            isSubmitting={isCompleting}
          />
        );
      
      case 'SUBMIT_FORM':
        return (
          <FormExecutor 
            mission={mission}
            payload={payload as FormPayload}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            isSubmitting={isCompleting}
          />
        );
      
      case 'ATTEND_OFFLINE':
      case 'ATTEND_ONLINE':
        return (
          <EventExecutor 
            mission={mission}
            payload={payload as OfflineEventPayload | OnlineEventPayload}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            isSubmitting={isCompleting}
          />
        );
      
      case 'CUSTOM':
      case 'EXTERNAL_ACTION':
      default:
        return (
          <CustomExecutor 
            mission={mission}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            isSubmitting={isCompleting}
          />
        );
    }
  };

  return (
    <div className="relative">
      {renderMissionExecutor()}
    </div>
  );
}
