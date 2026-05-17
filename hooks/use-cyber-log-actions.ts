import { useState } from 'react';

import {
  CertificationTracker,
  ChapterPracticeScore,
  StudyLogEntry,
  formatDateKey,
  getTodayDateKey,
} from '../data/lifeTrackerData';

function parsePositiveNumber(value: string) {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseScore(value: string) {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
}

type UseCyberLogActionsArgs = {
  selectedCert: CertificationTracker;
  setCertifications: React.Dispatch<React.SetStateAction<CertificationTracker[]>>;
  setChapterPracticeScores: React.Dispatch<React.SetStateAction<ChapterPracticeScore[]>>;
  setStudyLogs: React.Dispatch<React.SetStateAction<StudyLogEntry[]>>;
  triggerHaptic: () => Promise<void>;
};

export function useCyberLogActions({
  selectedCert,
  setCertifications,
  setChapterPracticeScores,
  setStudyLogs,
  triggerHaptic,
}: UseCyberLogActionsArgs) {
  const [draftChapters, setDraftChapters] = useState('');
  const [draftStudyNote, setDraftStudyNote] = useState('');
  const [draftScoreChapter, setDraftScoreChapter] = useState('');
  const [draftScoreValue, setDraftScoreValue] = useState('');
  const [draftScoreNote, setDraftScoreNote] = useState('');

  const addStudySession = async () => {
    const chapters = parsePositiveNumber(draftChapters);
    if (!chapters) {
      return;
    }

    await triggerHaptic();
    const todayKey = getTodayDateKey();
    const nextEntry: StudyLogEntry = {
      id: `${selectedCert.id}-${todayKey}-${Date.now()}`,
      certId: selectedCert.id,
      dateKey: todayKey,
      label: formatDateKey(todayKey),
      chapters,
      note: draftStudyNote.trim() || undefined,
    };

    setCertifications((current) =>
      current.map((cert) =>
        cert.id === selectedCert.id
          ? {
              ...cert,
              chaptersCompleted: Math.min(cert.chapterCount, cert.chaptersCompleted + chapters),
            }
          : cert
      )
    );
    setStudyLogs((current) => [nextEntry, ...current]);

    setDraftChapters('');
    setDraftStudyNote('');
  };

  const addPracticeScore = async () => {
    const chapterNumber = parsePositiveNumber(draftScoreChapter);
    const score = parseScore(draftScoreValue);

    if (chapterNumber === null || score === null) {
      return;
    }

    await triggerHaptic();
    const todayKey = getTodayDateKey();
    const nextEntry: ChapterPracticeScore = {
      id: `${selectedCert.id}-score-${todayKey}-${Date.now()}`,
      certId: selectedCert.id,
      chapterNumber,
      score,
      dateKey: todayKey,
      label: formatDateKey(todayKey),
      note: draftScoreNote.trim() || undefined,
    };

    setChapterPracticeScores((current) => [nextEntry, ...current]);

    setDraftScoreChapter('');
    setDraftScoreValue('');
    setDraftScoreNote('');
  };

  return {
    addPracticeScore,
    addStudySession,
    draftChapters,
    draftScoreChapter,
    draftScoreNote,
    draftScoreValue,
    draftStudyNote,
    setDraftChapters,
    setDraftScoreChapter,
    setDraftScoreNote,
    setDraftScoreValue,
    setDraftStudyNote,
  };
}
