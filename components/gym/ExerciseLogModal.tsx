import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ExerciseDraftSet, ExerciseLog, WorkoutExercise } from '../../data/gymData';
import { ThemeColors } from '../../data/theme';

type ExerciseLogModalProps = {
  activeExercise: WorkoutExercise | null;
  colors: ThemeColors;
  draftLog: ExerciseLog;
  todayLabel: string;
  onAddSet: () => void;
  onClose: () => void;
  onDraftLogChange: (updates: Partial<ExerciseLog>) => void;
  onDraftSetChange: (setId: string, field: keyof Pick<ExerciseDraftSet, 'reps' | 'weight'>, value: string) => void;
  onRemoveSet: (setId: string) => void;
  onSave: () => void;
};

export default function ExerciseLogModal({
  activeExercise,
  colors,
  draftLog,
  todayLabel,
  onAddSet,
  onClose,
  onDraftLogChange,
  onDraftSetChange,
  onRemoveSet,
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
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 560 }}
                contentContainerStyle={{ paddingBottom: 4 }}
              >
                <Text style={{ fontSize: 12, color: colors.subtext, textTransform: 'uppercase', marginBottom: 6 }}>
                  Exercise Log
                </Text>
                <Text style={{ fontSize: 22, color: colors.text, fontWeight: '800', marginBottom: 6 }}>
                  {activeExercise.name}
                </Text>
                <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 14 }}>{todayLabel}</Text>

                {draftLog.setEntries.map((setEntry, index) => (
                  <View
                    key={setEntry.id}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      borderRadius: 14,
                      backgroundColor: colors.inputBackground,
                      padding: 12,
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 10,
                      }}
                    >
                      <Text style={{ fontSize: 14, color: colors.text, fontWeight: '800' }}>Set {index + 1}</Text>
                      <Pressable
                        onPress={() => onRemoveSet(setEntry.id)}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderRadius: 10,
                          backgroundColor: colors.card,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                        }}
                      >
                        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>Remove</Text>
                      </Pressable>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Reps</Text>
                        <TextInput
                          value={setEntry.reps}
                          onChangeText={(text) => onDraftSetChange(setEntry.id, 'reps', text)}
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
                            backgroundColor: colors.card,
                          }}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Weight</Text>
                        <TextInput
                          value={setEntry.weight}
                          onChangeText={(text) => onDraftSetChange(setEntry.id, 'weight', text)}
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
                            backgroundColor: colors.card,
                          }}
                        />
                      </View>
                    </View>
                  </View>
                ))}

                <Pressable
                  onPress={onAddSet}
                  style={{
                    borderRadius: 12,
                    backgroundColor: colors.inputBackground,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '800' }}>Add another set</Text>
                </Pressable>

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
                    <Text style={{ color: 'white', fontWeight: '800' }}>Save Sets</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        ) : null}
      </View>
    </Modal>
  );
}
