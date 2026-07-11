import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const SPECIALTIES = ['Primary Care', 'Eye Doctor', 'OBGYN', 'Cardiology', 'Dermatology', 'Neurology'];
const AVAILABILITY = ['Any Time', 'Morning', 'Afternoon', 'Evening'];
const VISIT_TYPES = ['Video Visit', 'Clinic Visit', 'Home Visit'];
const INSURANCE = ['All', 'Blue Cross', 'Aetna', 'Cigna', 'UnitedHealth'];

export default function FilterScreen({ navigation }: Props) {
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState('Any Time');
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [selectedInsurance, setSelectedInsurance] = useState('All');
  const [minRating, setMinRating] = useState(0);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const ChipBtn = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <EkoHeader title="Filter" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Specialty">
          <View style={styles.chipRow}>
            {SPECIALTIES.map((s) => (
              <ChipBtn key={s} label={s} active={selectedSpecialties.includes(s)} onPress={() => toggle(selectedSpecialties, setSelectedSpecialties, s)} />
            ))}
          </View>
        </Section>

        <Section title="Availability">
          <View style={styles.chipRow}>
            {AVAILABILITY.map((a) => (
              <ChipBtn key={a} label={a} active={selectedAvailability === a} onPress={() => setSelectedAvailability(a)} />
            ))}
          </View>
        </Section>

        <Section title="Visit Type">
          <View style={styles.chipRow}>
            {VISIT_TYPES.map((v) => (
              <ChipBtn key={v} label={v} active={selectedType.includes(v)} onPress={() => toggle(selectedType, setSelectedType, v)} />
            ))}
          </View>
        </Section>

        <Section title="Insurance">
          <View style={styles.chipRow}>
            {INSURANCE.map((ins) => (
              <ChipBtn key={ins} label={ins} active={selectedInsurance === ins} onPress={() => setSelectedInsurance(ins)} />
            ))}
          </View>
        </Section>

        <Section title="Minimum Rating">
          <View style={styles.ratingRow}>
            {[0, 3, 3.5, 4, 4.5, 5].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.ratingBtn, minRating === r && styles.ratingBtnActive]}
                onPress={() => setMinRating(r)}
              >
                <Text style={[styles.ratingText, minRating === r && styles.ratingTextActive]}>
                  {r === 0 ? 'Any' : `${r}+`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <View style={styles.actions}>
          <EkoButton
            title="Reset"
            variant="outline"
            onPress={() => {
              setSelectedSpecialties([]);
              setSelectedAvailability('Any Time');
              setSelectedType([]);
              setSelectedInsurance('All');
              setMinRating(0);
            }}
            style={styles.resetBtn}
          />
          <EkoButton title="Apply Filters" variant="accent" onPress={() => navigation.goBack()} style={styles.applyBtn} />
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  content: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.white },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMedium, fontWeight: '500' },
  chipTextActive: { color: Colors.white },
  ratingRow: { flexDirection: 'row', gap: 8 },
  ratingBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.white },
  ratingBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  ratingText: { fontSize: 13, color: Colors.textMedium, fontWeight: '600' },
  ratingTextActive: { color: Colors.white },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  resetBtn: { flex: 1 },
  applyBtn: { flex: 2 },
});
