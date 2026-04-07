import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { ExerciseLog, WorkoutExercise } from '../../data/gymData';
import { ThemeColors } from '../../data/theme';

type ExerciseLogModalProps = {
  activeExercise: WorkoutExercise | null;
  colors: ThemeColors;
  draftLog: ExerciseLog;
  todayLabel: string;
  onClose: () => void;
  onDraftLogChange: (updates: Partial<ExerciseLog>) => void;
  onSave: () => void;
};

export default function ExerciseLogModal({
  activeExercise,
  colors,
  draftLog,
  todayLabel,
  onClose,
  onDraftLogChange,
  onSave,
}: ExerciseLogModalProps) {
  return (
    <Modal visible={activeExercise !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        <Pressable
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
          }}
        />
        {activeExercise ? (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 18,
                padding: 18,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.subtext, textTransform: 'uppercase', marginBottom: 6 }}>Exercise Log</Text>
              <Text style={{ fontSize: 22, color: colors.text, fontWeight: '800', marginBottom: 6 }}>{activeExercise.name}</Text>
              <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 14 }}>{todayLabel}</Text>

              <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Sets</Text>
              <TextInput
                value={draftLog.sets}
                onChangeText={(text) => onDraftLogChange({ sets: text })}
                keyboardType="number-pad"
                placeholder="4"
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

              <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Reps</Text>
              <TextInput
                value={draftLog.reps}
                onChangeText={(text) => onDraftLogChange({ reps: text })}
                keyboardType="number-pad"
                placeholder="8"
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

              <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Weight</Text>
              <TextInput
                value={draftLog.weight}
                onChangeText={(text) => onDraftLogChange({ weight: text })}
                keyboardType="decimal-pad"
                placeholder="185"
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
                  marginBottom: 16,
                }}
              />

              <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Notes</Text>
              <TextInput
                value={draftLog.note ?? ''}
                onChangeText={(text) => onDraftLogChange({ note: text })}
                placeholder="How did it feel today?"
                placeholderTextColor={colors.subtext}
                multiline
                style={{
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 15,
                  color: colors.text,
                  backgroundColor: colors.inputBackground,
                  marginBottom: 16,
                  minHeight: 76,
                  textAlignVertical: 'top',
                }}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={onClose}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: colors.inputBackground,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '800' }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={onSave}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: colors.accent,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '800' }}>Save</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        ) : null}
      </View>
    </Modal>
  );
}
