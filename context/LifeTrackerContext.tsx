import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  CertificationTracker,
  ChapterPracticeScore,
  DiyTask,
  LifeTrackerData,
  LoopRunEntry,
  StudyLogEntry,
  WeightEntry,
  YearGoal,
  defaultLifeTrackerData,
  mergeLifeTrackerData,
  readPersistedLifeTrackerData,
  writePersistedLifeTrackerData,
} from '../data/lifeTrackerData';

type LifeTrackerContextValue = {
  hydrated: boolean;
  lifeData: LifeTrackerData;
  setLifeData: React.Dispatch<React.SetStateAction<LifeTrackerData>>;
};

type LifeTrackerHydrationContextValue = {
  hydrated: boolean;
};

type LifeTrackerCyberContextValue = LifeTrackerHydrationContextValue & {
  certifications: CertificationTracker[];
  chapterPracticeScores: ChapterPracticeScore[];
  setCertifications: React.Dispatch<React.SetStateAction<CertificationTracker[]>>;
  setChapterPracticeScores: React.Dispatch<React.SetStateAction<ChapterPracticeScore[]>>;
  setStudyLogs: React.Dispatch<React.SetStateAction<StudyLogEntry[]>>;
  studyLogs: StudyLogEntry[];
};

type LifeTrackerGoalsContextValue = LifeTrackerHydrationContextValue & {
  goals2026: YearGoal[];
  setGoals2026: React.Dispatch<React.SetStateAction<YearGoal[]>>;
};

type LifeTrackerHealthContextValue = LifeTrackerHydrationContextValue & {
  loopRuns: LoopRunEntry[];
  setLoopRuns: React.Dispatch<React.SetStateAction<LoopRunEntry[]>>;
  setWeightEntries: React.Dispatch<React.SetStateAction<WeightEntry[]>>;
  weightEntries: WeightEntry[];
};

type LifeTrackerHobbiesContextValue = LifeTrackerHydrationContextValue & {
  diyTasks: DiyTask[];
  setDiyTasks: React.Dispatch<React.SetStateAction<DiyTask[]>>;
};

const LifeTrackerContext = createContext<LifeTrackerContextValue | undefined>(undefined);
const LifeTrackerHydrationContext = createContext<LifeTrackerHydrationContextValue | undefined>(undefined);
const LifeTrackerCyberContext = createContext<LifeTrackerCyberContextValue | undefined>(undefined);
const LifeTrackerGoalsContext = createContext<LifeTrackerGoalsContextValue | undefined>(undefined);
const LifeTrackerHealthContext = createContext<LifeTrackerHealthContextValue | undefined>(undefined);
const LifeTrackerHobbiesContext = createContext<LifeTrackerHobbiesContextValue | undefined>(undefined);

function resolveStateUpdate<T>(updater: React.SetStateAction<T>, current: T) {
  return typeof updater === 'function' ? (updater as (value: T) => T)(current) : updater;
}

function useRequiredContext<T>(context: React.Context<T | undefined>, errorMessage: string) {
  const value = useContext(context);

  if (!value) {
    throw new Error(errorMessage);
  }

  return value;
}

export function LifeTrackerProvider({ children }: { children: React.ReactNode }) {
  const [lifeData, setLifeData] = useState<LifeTrackerData>(defaultLifeTrackerData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      const persisted = await readPersistedLifeTrackerData().catch(() => null);

      if (!mounted) {
        return;
      }

      setLifeData(mergeLifeTrackerData(persisted));
      setHydrated(true);
    };

    void hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void writePersistedLifeTrackerData(lifeData);
  }, [hydrated, lifeData]);

  const setCertifications = useCallback<React.Dispatch<React.SetStateAction<CertificationTracker[]>>>((updater) => {
    setLifeData((current) => ({
      ...current,
      certifications: resolveStateUpdate(updater, current.certifications),
    }));
  }, []);

  const setStudyLogs = useCallback<React.Dispatch<React.SetStateAction<StudyLogEntry[]>>>((updater) => {
    setLifeData((current) => ({
      ...current,
      studyLogs: resolveStateUpdate(updater, current.studyLogs),
    }));
  }, []);

  const setChapterPracticeScores = useCallback<React.Dispatch<React.SetStateAction<ChapterPracticeScore[]>>>((updater) => {
    setLifeData((current) => ({
      ...current,
      chapterPracticeScores: resolveStateUpdate(updater, current.chapterPracticeScores),
    }));
  }, []);

  const setGoals2026 = useCallback<React.Dispatch<React.SetStateAction<YearGoal[]>>>((updater) => {
    setLifeData((current) => ({
      ...current,
      goals2026: resolveStateUpdate(updater, current.goals2026),
    }));
  }, []);

  const setWeightEntries = useCallback<React.Dispatch<React.SetStateAction<WeightEntry[]>>>((updater) => {
    setLifeData((current) => ({
      ...current,
      weightEntries: resolveStateUpdate(updater, current.weightEntries),
    }));
  }, []);

  const setLoopRuns = useCallback<React.Dispatch<React.SetStateAction<LoopRunEntry[]>>>((updater) => {
    setLifeData((current) => ({
      ...current,
      loopRuns: resolveStateUpdate(updater, current.loopRuns),
    }));
  }, []);

  const setDiyTasks = useCallback<React.Dispatch<React.SetStateAction<DiyTask[]>>>((updater) => {
    setLifeData((current) => ({
      ...current,
      diyTasks: resolveStateUpdate(updater, current.diyTasks),
    }));
  }, []);

  const hydrationValue = useMemo(
    () => ({
      hydrated,
    }),
    [hydrated]
  );

  const lifeTrackerValue = useMemo(
    () => ({
      hydrated,
      lifeData,
      setLifeData,
    }),
    [hydrated, lifeData]
  );

  const cyberValue = useMemo(
    () => ({
      hydrated,
      certifications: lifeData.certifications,
      chapterPracticeScores: lifeData.chapterPracticeScores,
      setCertifications,
      setChapterPracticeScores,
      setStudyLogs,
      studyLogs: lifeData.studyLogs,
    }),
    [hydrated, lifeData.certifications, lifeData.chapterPracticeScores, lifeData.studyLogs, setCertifications, setChapterPracticeScores, setStudyLogs]
  );

  const goalsValue = useMemo(
    () => ({
      hydrated,
      goals2026: lifeData.goals2026,
      setGoals2026,
    }),
    [hydrated, lifeData.goals2026, setGoals2026]
  );

  const healthValue = useMemo(
    () => ({
      hydrated,
      loopRuns: lifeData.loopRuns,
      setLoopRuns,
      setWeightEntries,
      weightEntries: lifeData.weightEntries,
    }),
    [hydrated, lifeData.loopRuns, lifeData.weightEntries, setLoopRuns, setWeightEntries]
  );

  const hobbiesValue = useMemo(
    () => ({
      hydrated,
      diyTasks: lifeData.diyTasks,
      setDiyTasks,
    }),
    [hydrated, lifeData.diyTasks, setDiyTasks]
  );

  return (
    <LifeTrackerContext.Provider value={lifeTrackerValue}>
      <LifeTrackerHydrationContext.Provider value={hydrationValue}>
        <LifeTrackerCyberContext.Provider value={cyberValue}>
          <LifeTrackerGoalsContext.Provider value={goalsValue}>
            <LifeTrackerHealthContext.Provider value={healthValue}>
              <LifeTrackerHobbiesContext.Provider value={hobbiesValue}>{children}</LifeTrackerHobbiesContext.Provider>
            </LifeTrackerHealthContext.Provider>
          </LifeTrackerGoalsContext.Provider>
        </LifeTrackerCyberContext.Provider>
      </LifeTrackerHydrationContext.Provider>
    </LifeTrackerContext.Provider>
  );
}

export function useLifeTrackerData() {
  return useRequiredContext(LifeTrackerContext, 'useLifeTrackerData must be used within a LifeTrackerProvider.');
}

export function useLifeTrackerHydration() {
  return useRequiredContext(
    LifeTrackerHydrationContext,
    'useLifeTrackerHydration must be used within a LifeTrackerProvider.'
  );
}

export function useLifeTrackerCyberData() {
  return useRequiredContext(
    LifeTrackerCyberContext,
    'useLifeTrackerCyberData must be used within a LifeTrackerProvider.'
  );
}

export function useLifeTrackerGoalsData() {
  return useRequiredContext(
    LifeTrackerGoalsContext,
    'useLifeTrackerGoalsData must be used within a LifeTrackerProvider.'
  );
}

export function useLifeTrackerHealthData() {
  return useRequiredContext(
    LifeTrackerHealthContext,
    'useLifeTrackerHealthData must be used within a LifeTrackerProvider.'
  );
}

export function useLifeTrackerHobbiesData() {
  return useRequiredContext(
    LifeTrackerHobbiesContext,
    'useLifeTrackerHobbiesData must be used within a LifeTrackerProvider.'
  );
}
