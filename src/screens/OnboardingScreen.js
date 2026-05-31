// src/screens/OnboardingScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { generatePlan } from '../services/aiService';
import { getHistory } from '../services/storageService';
import colors from '../constants/colors';

export default function OnboardingScreen({ navigation }) {
  // Основні параметри
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState(''); // Нове
  
  // Вибіркові параметри
  const [gender, setGender] = useState('male'); // male/female
  const [goal, setGoal] = useState('muscle'); 
  const [location, setLocation] = useState('gym'); // gym/home
  const [activity, setActivity] = useState('sedentary'); // sedentary/active
  const [diet, setDiet] = useState('none'); // none/vegan/keto

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!age || !weight || !height) {
      Alert.alert("Увага", "Будь ласка, заповніть вік, вагу та ріст.");
      return;
    }

    setLoading(true);
    try {
      const history = await getHistory();
      const lastWorkout = history.length > 0 ? history[0] : null;

      const userData = {
        age, weight, height, gender, goal, location, activity, diet
      };

      const aiResponse = await generatePlan(userData, lastWorkout);
      navigation.navigate('Workout', { plan: aiResponse });

    } catch (error) {
      Alert.alert("Помилка", "Щось пішло не так. Спробуйте пізніше.");
    } finally {
      setLoading(false);
    }
  };

  // Компонент для вибору (щоб не дублювати код)
  const OptionSelector = ({ label, options, current, onSelect }) => (
    <View style={styles.optionBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((opt) => (
          <TouchableOpacity 
            key={opt.value}
            style={[styles.optionBtn, current === opt.value && styles.optionBtnActive]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={[styles.optionText, current === opt.value && styles.optionTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.headerBlock}>
        <Text style={styles.title}>AI COACH</Text>
        <Text style={styles.subtitle}>Повна персоналізація</Text>
      </View>

      <View style={styles.card}>
        {/* РЯДОК 1: Вік, Вага, Ріст */}
        <View style={styles.rowInputs}>
          <View style={styles.inputWrap}>
            <Text style={styles.miniLabel}>Вік</Text>
            <TextInput style={styles.input} placeholder="25" keyboardType="numeric" value={age} onChangeText={setAge} />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.miniLabel}>Вага (кг)</Text>
            <TextInput style={styles.input} placeholder="70" keyboardType="numeric" value={weight} onChangeText={setWeight} />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.miniLabel}>Ріст (см)</Text>
            <TextInput style={styles.input} placeholder="175" keyboardType="numeric" value={height} onChangeText={setHeight} />
          </View>
        </View>

        {/* Стать */}
        <OptionSelector 
          label="Стать" 
          current={gender} 
          onSelect={setGender}
          options={[{label: 'Чоловік 👨', value: 'male'}, {label: 'Жінка 👩', value: 'female'}]}
        />

        {/* Ціль */}
        <OptionSelector 
          label="Ціль" 
          current={goal} 
          onSelect={setGoal}
          options={[{label: 'Набір маси 💪', value: 'muscle'}, {label: 'Схуднення 🏃‍♂️', value: 'weight_loss'}]}
        />

        {/* Де тренуємось */}
        <OptionSelector 
          label="Місце тренувань" 
          current={location} 
          onSelect={setLocation}
          options={[{label: 'В залі 🏋️‍♀️', value: 'gym'}, {label: 'Вдома 🏠', value: 'home'}]}
        />

        {/* Активність */}
        <OptionSelector 
          label="Спосіб життя" 
          current={activity} 
          onSelect={setActivity}
          options={[{label: 'Сидячий 💻', value: 'sedentary'}, {label: 'Активний ⚡', value: 'active'}]}
        />
        
         {/* Харчування */}
        <OptionSelector 
          label="Харчування" 
          current={diet} 
          onSelect={setDiet}
          options={[{label: 'Все 🥩', value: 'none'}, {label: 'Веган 🥗', value: 'vegan'}]}
        />

      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>ШІ аналізує твій профіль...</Text>
        </View>
      ) : (
        <View>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>СТВОРИТИ ПЛАН</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.historyButton} onPress={() => navigation.navigate('History')}>
            <Text style={styles.historyButtonText}>📜 Історія</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: colors.background, paddingBottom: 50 },
  headerBlock: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: colors.primary },
  subtitle: { fontSize: 14, color: colors.textMain, opacity: 0.7 },
  
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 20, elevation: 3, marginBottom: 20 },
  
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  inputWrap: { width: '30%' },
  miniLabel: { fontSize: 12, fontWeight: 'bold', color: colors.primary, marginBottom: 5 },
  input: { backgroundColor: '#F0F2F5', padding: 10, borderRadius: 10, textAlign: 'center', fontSize: 16 },

  optionBlock: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: 'bold', color: colors.primary, marginBottom: 8 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  optionBtn: { flex: 0.48, padding: 10, backgroundColor: '#F0F2F5', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E4E5EA' },
  optionBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  optionText: { fontSize: 13, fontWeight: '600', color: colors.textMain },
  optionTextActive: { color: '#fff' },

  submitButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 10 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  historyButton: { alignItems: 'center', padding: 10 },
  historyButtonText: { color: colors.primary, fontWeight: 'bold' },
  loaderContainer: { alignItems: 'center', marginTop: 20 },
  loaderText: { marginTop: 10, color: colors.textMain }
});