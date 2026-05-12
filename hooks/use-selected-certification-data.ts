import { useEffect, useMemo, useState } from 'react';

import {
  CertificationTracker,
  ChapterPracticeScore,
  StudyLogEntry,
  getDateRangePacePct,
} from '../data/lifeTrackerData';

type UseSelectedCertificationDataArgs = {
  certifications: CertificationTracker[];
  chapterPracticeScores: ChapterPracticeScore[];
  studyLogs: StudyLogEntry[];
};

export function useSelectedCertificationData({
  certifications,
  chapterPracticeScores,
  studyLogs,
}: UseSelectedCertificationDataArgs) {
  const [selectedCertId, setSelectedCertId] = useState(certifications[0]?.id ?? '');

  useEffect(() => {
    setSelectedCertId((current) =>
      certifications.some((cert) => cert.id === current) ? current : (certifications[0]?.id ?? '')
    );
  }, [certifications]);

  const selectedCert = useMemo(
    () => certifications.find((cert) => cert.id === selectedCertId) ?? certifications[0],
    [certifications, selectedCertId]
  );
  const certLogs = useMemo(
    () =>
      selectedCert
        ? studyLogs
            .filter((entry) => entry.certId === selectedCert.id)
            .sort((left, right) => right.dateKey.localeCompare(left.dateKey))
            .slice(0, 8)
        : [],
    [selectedCert, studyLogs]
  );
  const certScores = useMemo(
    () =>
      selectedCert
        ? chapterPracticeScores
            .filter((entry) => entry.certId === selectedCert.id)
            .sort((left, right) => {
              if (right.chapterNumber !== left.chapterNumber) {
                return right.chapterNumber - left.chapterNumber;
              }

              return right.dateKey.localeCompare(left.dateKey);
            })
            .slice(0, 12)
        : [],
    [chapterPracticeScores, selectedCert]
  );
  const averageScore = useMemo(
    () => (certScores.length > 0 ? certScores.reduce((total, entry) => total + entry.score, 0) / certScores.length : null),
    [certScores]
  );
  const progressPct =
    selectedCert && selectedCert.chapterCount > 0
      ? (selectedCert.chaptersCompleted / selectedCert.chapterCount) * 100
      : 0;
  const progressPacePct =
    selectedCert?.startDate && selectedCert.examDate
      ? getDateRangePacePct(selectedCert.startDate, selectedCert.examDate)
      : null;

  return {
    averageScore,
    certLogs,
    certScores,
    progressPacePct,
    progressPct,
    selectedCert,
    selectedCertId,
    setSelectedCertId,
  };
}
