import { Text, View } from 'react-native';

import { CertificationTracker } from '../../data/lifeTrackerData';
import { ThemeColors } from '../../data/theme';

type CertificationSummaryListProps = {
  certifications: CertificationTracker[];
  colors: ThemeColors;
  selectedCertId: string;
};

export default function CertificationSummaryList({
  certifications,
  colors,
  selectedCertId,
}: CertificationSummaryListProps) {
  return (
    <>
      {certifications.map((cert) => {
        const selected = cert.id === selectedCertId;

        return (
          <View
            key={`hero-cert-${cert.id}`}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 6,
            }}
          >
            <Text
              style={{
                color: selected ? colors.heroText : colors.heroSubtext,
                fontSize: 13,
                fontWeight: selected ? '800' : '700',
                flex: 1,
                paddingRight: 12,
              }}
            >
              {cert.name}
            </Text>
            <Text
              style={{
                color: selected ? colors.heroText : colors.heroSubtext,
                fontSize: 13,
                fontWeight: selected ? '800' : '700',
              }}
            >
              {cert.chaptersCompleted}/{cert.chapterCount} Chapters
            </Text>
          </View>
        );
      })}
    </>
  );
}
