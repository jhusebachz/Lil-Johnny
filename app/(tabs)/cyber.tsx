import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import CertificationSummaryList from '../../components/cyber/CertificationSummaryList';
import ProgressBar from '../../components/ProgressBar';
import SectionCard from '../../components/SectionCard';
import StatRow from '../../components/StatRow';
import AppScreenShell from '../../components/ui/AppScreenShell';
import { usePreferenceSettings, useThemeSettings } from '../../context/AppSettingsContext';
import { useLifeTrackerData } from '../../context/LifeTrackerContext';
import {
  ChapterPracticeScore,
  formatDateKey,
  getTodayDateKey,
  StudyLogEntry,
} from '../../data/lifeTrackerData';
import { getThemeColors } from '../../data/theme';
import { useSelectedCertificationData } from '../../hooks/use-selected-certification-data';
import { useTimedRefresh } from '../../hooks/use-timed-refresh';

function parsePositiveNumber(value: string) {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseScore(value: string) {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
}

export default function Cyber() {
  const { theme } = useThemeSettings();
  const { triggerHaptic } = usePreferenceSettings();
  const colors = getThemeColors(theme);
  const { lifeData, setLifeData } = useLifeTrackerData();
  const [draftChapters, setDraftChapters] = useState('');
  const [draftStudyNote, setDraftStudyNote] = useState('');
  const [draftScoreChapter, setDraftScoreChapter] = useState('');
  const [draftScoreValue, setDraftScoreValue] = useState('');
  const [draftScoreNote, setDraftScoreNote] = useState('');
  const { refreshing, triggerRefresh } = useTimedRefresh();
  const certifications = lifeData.certifications;
  const {
    averageScore,
    certLogs,
    certScores,
    progressPacePct,
    progressPct,
    selectedCert,
    selectedCertId,
    setSelectedCertId,
  } = useSelectedCertificationData({
    certifications,
    chapterPracticeScores: lifeData.chapterPracticeScores,
    studyLogs: lifeData.studyLogs,
  });

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

    setLifeData((current) => ({
      ...current,
      certifications: current.certifications.map((cert) =>
        cert.id === selectedCert.id
          ? {
              ...cert,
              chaptersCompleted: Math.min(cert.chapterCount, cert.chaptersCompleted + chapters),
            }
          : cert
      ),
      studyLogs: [nextEntry, ...current.studyLogs],
    }));

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

    setLifeData((current) => ({
      ...current,
      chapterPracticeScores: [nextEntry, ...current.chapterPracticeScores],
    }));

    setDraftScoreChapter('');
    setDraftScoreValue('');
    setDraftScoreNote('');
  };

  return (
    <AppScreenShell
      colors={colors}
      refreshing={refreshing}
      onRefresh={triggerRefresh}
      hero={
        <View
          style={{
            backgroundColor: colors.hero,
            borderRadius: 16,
            padding: 20,
            minHeight: 148,
            justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          <Text style={{ color: colors.heroText, fontSize: 28, fontWeight: '800', marginBottom: 10 }}>Cyber</Text>
          <CertificationSummaryList certifications={certifications} colors={colors} selectedCertId={selectedCertId} />
        </View>
      }
    >

        <SectionCard title="Certifications" emoji={'🧠'} colors={colors}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {lifeData.certifications.map((cert) => {
              const selected = cert.id === selectedCertId;

              return (
                <Pressable
                  key={cert.id}
                  onPress={async () => {
                    await triggerHaptic();
                    setSelectedCertId(cert.id);
                  }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    backgroundColor: selected ? colors.accent : colors.card,
                    borderWidth: 1,
                    borderColor: selected ? colors.accent : colors.cardBorder,
                    marginRight: 10,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: selected ? 'white' : colors.text, fontSize: 14, fontWeight: '700' }}>
                    {cert.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard title="Certification Progress" emoji={'🛡'} colors={colors}>
          <View
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              backgroundColor: colors.inputBackground,
              padding: 14,
            }}
          >
            <Text style={{ fontSize: 18, color: colors.text, fontWeight: '800', marginBottom: 6, textAlign: 'center' }}>
              {selectedCert.name}
            </Text>
            <StatRow
              label="Chapters complete"
              value={`${selectedCert.chaptersCompleted} / ${selectedCert.chapterCount}`}
              colors={colors}
            />
            {selectedCert.studyGuide ? <StatRow label="Study guide" value={selectedCert.studyGuide} colors={colors} /> : null}
            {selectedCert.startDate ? <StatRow label="Start target" value={selectedCert.startDate} colors={colors} /> : null}
            {selectedCert.examDate ? <StatRow label="Exam target" value={selectedCert.examDate} colors={colors} /> : null}
            <ProgressBar
              pct={progressPct}
              markerPct={progressPacePct ?? undefined}
              color={colors.accent}
              colors={colors}
              height={10}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 11, color: colors.subtext }}>Actual {progressPct.toFixed(1)}%</Text>
              <Text style={{ fontSize: 11, color: colors.subtext }}>
                {progressPacePct !== null ? `Pace ${progressPacePct.toFixed(1)}%` : 'No pace line'}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.text, fontWeight: '700', textAlign: 'center' }}>
              Practice score average:{' '}
              <Text style={{ color: colors.subtext, fontWeight: '400' }}>
                {averageScore !== null ? `${averageScore.toFixed(1)}%` : 'No scores logged yet'}
              </Text>
            </Text>
          </View>
        </SectionCard>

        <SectionCard title="Log Chapter Progress" emoji={'✍'} colors={colors}>
          <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Selected tracker</Text>
          <Text style={{ fontSize: 16, color: colors.text, fontWeight: '800', marginBottom: 12 }}>{selectedCert.name}</Text>

          <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Chapters covered</Text>
          <TextInput
            value={draftChapters}
            onChangeText={setDraftChapters}
            keyboardType="decimal-pad"
            placeholder="1"
            placeholderTextColor={colors.subtext}
            style={{
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 15,
              color: colors.text,
              backgroundColor: colors.inputBackground,
              marginBottom: 12,
            }}
          />

          <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Note</Text>
          <TextInput
            value={draftStudyNote}
            onChangeText={setDraftStudyNote}
            placeholder="Which chapters or topics did you cover?"
            placeholderTextColor={colors.subtext}
            style={{
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 15,
              color: colors.text,
              backgroundColor: colors.inputBackground,
              marginBottom: 14,
            }}
          />

          <Pressable
            onPress={() => {
              void addStudySession();
            }}
            style={{
              borderRadius: 12,
              backgroundColor: colors.accent,
              paddingVertical: 12,
              paddingHorizontal: 14,
            }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '800' }}>Log chapter progress</Text>
          </Pressable>
        </SectionCard>

        <SectionCard title="Practice Exam Scores" emoji={'📊'} colors={colors}>
          <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Chapter number</Text>
          <TextInput
            value={draftScoreChapter}
            onChangeText={setDraftScoreChapter}
            keyboardType="number-pad"
            placeholder="3"
            placeholderTextColor={colors.subtext}
            style={{
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 15,
              color: colors.text,
              backgroundColor: colors.inputBackground,
              marginBottom: 12,
            }}
          />

          <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Score (%)</Text>
          <TextInput
            value={draftScoreValue}
            onChangeText={setDraftScoreValue}
            keyboardType="decimal-pad"
            placeholder="82"
            placeholderTextColor={colors.subtext}
            style={{
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 15,
              color: colors.text,
              backgroundColor: colors.inputBackground,
              marginBottom: 12,
            }}
          />

          <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Note</Text>
          <TextInput
            value={draftScoreNote}
            onChangeText={setDraftScoreNote}
            placeholder="Weak spots, retake notes, etc."
            placeholderTextColor={colors.subtext}
            style={{
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 15,
              color: colors.text,
              backgroundColor: colors.inputBackground,
              marginBottom: 14,
            }}
          />

          <Pressable
            onPress={() => {
              void addPracticeScore();
            }}
            style={{
              borderRadius: 12,
              backgroundColor: colors.accent,
              paddingVertical: 12,
              paddingHorizontal: 14,
              marginBottom: 14,
            }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '800' }}>Log practice score</Text>
          </Pressable>

          {certScores.length > 0 ? (
            certScores.map((entry) => (
              <View
                key={entry.id}
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.inputBackground,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 2 }}>
                  Chapter {entry.chapterNumber}
                </Text>
                <Text style={{ color: colors.subtext, fontSize: 13 }}>{entry.score.toFixed(0)}% - {entry.label}</Text>
                {entry.note ? <Text style={{ color: colors.subtext, fontSize: 13, marginTop: 4 }}>{entry.note}</Text> : null}
              </View>
            ))
          ) : (
            <Text style={{ color: colors.subtext, fontSize: 13 }}>
              No end-of-chapter practice scores logged yet for this certification.
            </Text>
          )}
        </SectionCard>

        <SectionCard title="Recent Study Sessions" emoji={'📘'} colors={colors}>
          {certLogs.length > 0 ? (
            certLogs.map((entry) => (
              <View
                key={entry.id}
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.inputBackground,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 2 }}>{entry.label}</Text>
                <Text style={{ color: colors.subtext, fontSize: 13 }}>
                  {entry.chapters} chapter{entry.chapters === 1 ? '' : 's'}
                </Text>
                {entry.note ? <Text style={{ color: colors.subtext, fontSize: 13, marginTop: 4 }}>{entry.note}</Text> : null}
              </View>
            ))
          ) : (
            <Text style={{ color: colors.subtext, fontSize: 13 }}>
              No chapter progress logged yet for this certification.
            </Text>
          )}
        </SectionCard>
    </AppScreenShell>
  );
}
