// src/screens/SetupScreen.js
import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Switch, StatusBar, KeyboardAvoidingView, Platform, 
  ScrollView, SafeAreaView 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { saveUserProfile } from '../services/storageService';
import colors from '../constants/colors';

export default function SetupScreen({ navigation }) {
  const [step, setStep] = useState(1);
  
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [goal, setGoal] = useState('muscle');
  const [location, setLocation] = useState('home'); 
  const [hasEquipment, setHasEquipment] = useState(false);
  const [equipmentList, setEquipmentList] = useState(''); 
  const [workoutTime, setWorkoutTime] = useState('evening'); 
  const [jobType, setJobType] = useState('sedentary'); 
  const [dietType, setDietType] = useState('none');
  const [foodExclusions, setFoodExclusions] = useState(''); 
  const [injuries, setInjuries] = useState(''); 

  const handleNext = () => {
    if (step === 1 && (!age || !height)) return alert("Вкажіть вік та ріст");
    if (step === 2 && (!weight || !targetWeight)) return alert("Вкажіть вагу");
    if (step < 4) setStep(step + 1);
    else finishSetup();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  const finishSetup = async () => {
    const profileData = { age, weight, targetWeight, height, gender, goal, location, hasEquipment, equipmentList, workoutTime, jobType, dietType, foodExclusions, injuries };
    await saveUserProfile(profileData);
    setStep(5);
  };

  const navigateHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const renderProgressBar = () => {
    if (step === 5) return null;
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.stepWrapper}>
            <View style={[styles.stepCircle, step >= i ? styles.stepActive : styles.stepInactive]}>
              {step > i ? <Feather name="check" size={16} color="#fff" /> : <Text style={[styles.stepText, step >= i ? {color: '#fff'} : {color: '#94A3B8'}]}>{i}</Text>}
            </View>
            {i < 4 && <View style={[styles.stepLine, step > i ? {backgroundColor: colors.primary} : {backgroundColor: '#E2E8F0'}]} />}
          </View>
        ))}
      </View>
    );
  };

  // STEP 1
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Профіль</Text>
      <Text style={styles.subtitle}>Базові дані для розрахунків.</Text>

      <View style={styles.selectorRow}>
        <TouchableOpacity onPress={() => setGender('male')} style={[styles.cardSelect, gender === 'male' && styles.selectedCard]}>
           <Feather name="user" size={32} color={gender === 'male' ? '#fff' : colors.primary} />
           <Text style={[styles.selectText, gender === 'male' && styles.textWhite]}>Чоловік</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setGender('female')} style={[styles.cardSelect, gender === 'female' && styles.selectedCard]}>
           <Feather name="users" size={32} color={gender === 'female' ? '#fff' : colors.primary} />
           <Text style={[styles.selectText, gender === 'female' && styles.textWhite]}>Жінка</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <View style={{flex:1}}>
           <Text style={styles.label}>Вік</Text>
           <TextInput style={styles.inputModern} placeholder="25" keyboardType="numeric" value={age} onChangeText={setAge} textAlign="center" placeholderTextColor="#CBD5E1"/>
        </View>
        <View style={{width: 20}}/>
        <View style={{flex:1}}>
           <Text style={styles.label}>Ріст (см)</Text>
           <TextInput style={styles.inputModern} placeholder="175" keyboardType="numeric" value={height} onChangeText={setHeight} textAlign="center" placeholderTextColor="#CBD5E1"/>
        </View>
      </View>
    </View>
  );

  // STEP 2
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Вага та Ціль</Text>
      <Text style={styles.subtitle}>Визначимо вектор руху.</Text>

      <View style={styles.weightRow}>
        <View style={styles.weightCard}>
           <Text style={styles.weightLabel}>Зараз</Text>
           <View style={{flexDirection:'row', alignItems:'baseline'}}>
             <TextInput style={styles.weightInput} placeholder="70" keyboardType="numeric" value={weight} onChangeText={setWeight} textAlign="center" placeholderTextColor="#CBD5E1"/>
             <Text style={styles.kgText}>кг</Text>
           </View>
        </View>
        <View style={[styles.weightCard, styles.targetWeightCard]}>
           <Text style={[styles.weightLabel, {color: '#0EA5E9'}]}>Ціль 🎯</Text>
           <View style={{flexDirection:'row', alignItems:'baseline'}}>
             <TextInput style={[styles.weightInput, {color: '#0EA5E9'}]} placeholder="80" keyboardType="numeric" value={targetWeight} onChangeText={setTargetWeight} textAlign="center" placeholderTextColor="#99ccee"/>
             <Text style={[styles.kgText, {color: '#0EA5E9'}]}>кг</Text>
           </View>
        </View>
      </View>

      <Text style={styles.sectionHeader}>ГОЛОВНА МЕТА</Text>
      <View style={{gap: 15}}>
        <TouchableOpacity onPress={() => setGoal('muscle')} style={[styles.goalCard, goal === 'muscle' && styles.selectedGoalCard]}>
           <View style={[styles.iconBox, goal === 'muscle' && {backgroundColor: 'rgba(255,255,255,0.2)'}]}>
             <Feather name="trending-up" size={24} color={goal === 'muscle' ? '#fff' : colors.primary} />
           </View>
           <View style={{flex: 1}}>
             <Text style={[styles.goalTitle, goal === 'muscle' && styles.textWhite]}>Набір маси</Text>
             <Text style={[styles.goalDesc, goal === 'muscle' && styles.textWhiteOpaque]}>Сила та об'єм м'язів</Text>
           </View>
           {goal === 'muscle' && <Feather name="check-circle" size={24} color="#fff" />}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setGoal('weight_loss')} style={[styles.goalCard, goal === 'weight_loss' && styles.selectedGoalCard]}>
           <View style={[styles.iconBox, goal === 'weight_loss' && {backgroundColor: 'rgba(255,255,255,0.2)'}]}>
             <Feather name="trending-down" size={24} color={goal === 'weight_loss' ? '#fff' : colors.primary} />
           </View>
           <View style={{flex: 1}}>
             <Text style={[styles.goalTitle, goal === 'weight_loss' && styles.textWhite]}>Схуднення</Text>
             <Text style={[styles.goalDesc, goal === 'weight_loss' && styles.textWhiteOpaque]}>Спалювання жиру, рельєф</Text>
           </View>
            {goal === 'weight_loss' && <Feather name="check-circle" size={24} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );

  // STEP 3
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Умови</Text>
      <Text style={styles.subtitle}>Де і як будемо тренуватись?</Text>

      <View style={styles.selectorRow}>
        <TouchableOpacity onPress={() => setLocation('home')} style={[styles.cardSelect, location === 'home' && styles.selectedCard]}>
           <Feather name="home" size={32} color={location === 'home' ? '#fff' : colors.primary} />
           <Text style={[styles.selectText, location === 'home' && styles.textWhite]}>Вдома</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setLocation('gym')} style={[styles.cardSelect, location === 'gym' && styles.selectedCard]}>
           <Feather name="layers" size={32} color={location === 'gym' ? '#fff' : colors.primary} />
           <Text style={[styles.selectText, location === 'gym' && styles.textWhite]}>Зал</Text>
        </TouchableOpacity>
      </View>

      {location === 'home' && (
        <View style={styles.equipBlock}>
           <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
             <Text style={styles.labelNoMargin}>🏡 Є інвентар вдома?</Text>
             <Switch value={hasEquipment} onValueChange={setHasEquipment} trackColor={{false: '#E2E8F0', true: colors.primary}} thumbColor={"#fff"} ios_backgroundColor="#E2E8F0"/>
           </View>
           {hasEquipment && (
             <TextInput style={styles.inputModernFull} placeholder="Гантелі, резинки, турнік..." value={equipmentList} onChangeText={setEquipmentList} placeholderTextColor="#94A3B8"/>
           )}
        </View>
      )}

      <Text style={styles.sectionHeader}>АКТИВНІСТЬ ПРОТЯГОМ ДНЯ</Text>
      <View style={styles.rowPills}>
         <TouchableOpacity onPress={() => setJobType('sedentary')} style={[styles.pill, jobType === 'sedentary' && styles.selectedPill]}>
           <Feather name="monitor" size={18} color={jobType === 'sedentary' ? '#fff' : '#64748B'} style={{marginRight:8}}/>
           <Text style={[styles.pillText, jobType === 'sedentary' && styles.textWhite]}>Сидяча</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => setJobType('active')} style={[styles.pill, jobType === 'active' && styles.selectedPill]}>
           <Feather name="briefcase" size={18} color={jobType === 'active' ? '#fff' : '#64748B'} style={{marginRight:8}}/>
           <Text style={[styles.pillText, jobType === 'active' && styles.textWhite]}>Активна</Text>
         </TouchableOpacity>
      </View>
    </View>
  );

  // STEP 4
  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Здоров'я</Text>
      <Text style={styles.subtitle}>Фінальні деталі для безпеки.</Text>

      <Text style={styles.sectionHeader}>ТИП ХАРЧУВАННЯ</Text>
      <View style={styles.rowPills}>
         <TouchableOpacity onPress={() => setDietType('none')} style={[styles.pill, dietType === 'none' && styles.selectedPill]}>
            <Feather name="coffee" size={18} color={dietType === 'none' ? '#fff' : '#64748B'} style={{marginRight:8}}/>
           <Text style={[styles.pillText, dietType === 'none' && styles.textWhite]}>Всеїдний</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => setDietType('vegan')} style={[styles.pill, dietType === 'vegan' && styles.selectedPill]}>
            <Feather name="sun" size={18} color={dietType === 'vegan' ? '#fff' : '#64748B'} style={{marginRight:8}}/>
           <Text style={[styles.pillText, dietType === 'vegan' && styles.textWhite]}>Веган</Text>
         </TouchableOpacity>
      </View>

      <Text style={styles.label}>Алергії / Не люблю (для ШІ)</Text>
      <TextInput style={styles.inputModernFull} placeholder="Риба, мед, цибуля..." value={foodExclusions} onChangeText={setFoodExclusions} placeholderTextColor="#94A3B8" />

      <Text style={[styles.label, {color: '#EF4444', marginTop: 25}]}>Травми / Обмеження 🚑</Text>
      <TextInput 
        style={[styles.inputModernFull, {borderColor: '#FECACA', backgroundColor: '#FEF2F2', color: '#EF4444'}]} 
        placeholder="Біль у колінах, спина..." 
        value={injuries} 
        onChangeText={setInjuries}
        placeholderTextColor="#FCA5A5"
      />
    </View>
  );

  // SUCCESS STEP
  const renderSuccess = () => (
    <View style={[styles.stepContent, {justifyContent:'center', alignItems:'center', flex: 1, paddingBottom: 80}]}>
      <View style={{width: 120, height: 120, backgroundColor: '#ECFDF5', borderRadius: 60, justifyContent:'center', alignItems:'center', marginBottom: 30}}>
        <Feather name="check" size={60} color="#10B981" />
      </View>
      <Text style={styles.titleLarge}>Готово!</Text>
      <Text style={styles.subtitleLarge}>
        Штучний інтелект проаналізував твої дані і готовий створити персональний план.
      </Text>
      
      <TouchableOpacity style={styles.mainButton} onPress={navigateHome}>
        <Text style={styles.mainButtonText}>ПОЧАТИ ТРАНСФОРМАЦІЮ</Text>
        <Feather name="arrow-right" size={20} color="#fff" style={{marginLeft: 10}}/>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#F8FAFC'}}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC"/>
      <View style={{paddingTop: 20}}>{renderProgressBar()}</View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={{flexGrow: 1, paddingBottom: 40}} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
           {step === 1 && renderStep1()}
           {step === 2 && renderStep2()}
           {step === 3 && renderStep3()}
           {step === 4 && renderStep4()}
           {step === 5 && renderSuccess()}
        </ScrollView>
      </KeyboardAvoidingView>
      {step < 5 && (
        <View style={styles.footer}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                <Feather name="arrow-left" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
               <Text style={styles.nextText}>{step === 4 ? 'ЗАВЕРШИТИ' : 'ДАЛІ'}</Text>
               <Feather name={step === 4 ? "check" : "arrow-right"} size={20} color="#fff" style={{marginLeft: 8}} />
            </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  progressContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 30, paddingHorizontal: 40 },
  stepWrapper: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  stepActive: { backgroundColor: colors.primary },
  stepText: { fontSize: 14, fontWeight: '700' },
  stepLine: { width: 40, height: 4, marginHorizontal: -2, zIndex: 1, borderRadius: 2 },

  stepContent: { paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginBottom: 8, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 35, fontWeight: '500' },
  titleLarge: { fontSize: 40, fontWeight: '900', color: '#0F172A', marginBottom: 15 },
  subtitleLarge: { fontSize: 18, color: '#64748B', textAlign: 'center', lineHeight: 26, paddingHorizontal: 20 },

  label: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 10, marginTop: 15 },
  labelNoMargin: { fontSize: 16, fontWeight: '700', color: '#334155' },
  sectionHeader: { fontSize: 14, fontWeight: '800', color: '#94A3B8', marginBottom: 15, marginTop: 35, letterSpacing: 1 },

  selectorRow: { flexDirection: 'row', gap: 16, marginBottom: 25 },
  cardSelect: { flex: 1, aspectRatio: 1, backgroundColor: '#fff', borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 2, borderColor: 'transparent' },
  selectedCard: { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.2 },
  selectText: { marginTop: 15, fontWeight: '700', color: '#0F172A', fontSize: 16 },
  textWhite: { color: '#fff' }, textWhiteOpaque: { color: 'rgba(255,255,255,0.8)' },

  inputGroup: { flexDirection: 'row', gap: 0 },
  inputModern: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 18, borderRadius: 20, fontSize: 24, fontWeight:'800', color: '#0F172A', textAlign: 'center', shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity: 0.03, elevation: 1 },
  inputModernFull: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', padding: 18, borderRadius: 20, fontSize: 16, color: '#0F172A', fontWeight: '600' },

  weightRow: { flexDirection: 'row', gap: 16 },
  weightCard: { flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 20, alignItems: 'center', shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  targetWeightCard: { backgroundColor: '#F0F9FF', borderColor: '#0EA5E9', borderWidth: 1 },
  weightLabel: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginBottom: 5, textTransform: 'uppercase' },
  weightInput: { fontSize: 36, fontWeight: '900', color: '#0F172A', paddingVertical: 5, textAlign: 'center', minWidth: 70 },
  kgText: { fontSize: 18, fontWeight: '700', color: '#94A3B8', marginLeft: 8 },

  goalCard: { flexDirection: 'row', padding: 24, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 2, borderColor: 'transparent' },
  selectedGoalCard: { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.2 },
  iconBox: { width: 52, height: 52, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  goalTitle: { fontWeight: '800', fontSize: 18, color: '#0F172A', marginBottom: 4 },
  goalDesc: { color: '#64748B', fontSize: 14, fontWeight: '500' },

  equipBlock: { backgroundColor: '#fff', padding: 24, borderRadius: 24, marginBottom: 15, marginTop: 25, shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity: 0.03, elevation: 2 },
  rowPills: { flexDirection: 'row', gap: 12 },
  pill: { flex: 1, flexDirection:'row', paddingVertical: 18, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent:'center', shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0' },
  selectedPill: { backgroundColor: colors.primary, borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.2 },
  pillText: { fontWeight: '700', color: '#64748B', fontSize: 15 },

  footer: { flexDirection: 'row', padding: 24, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  backBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  nextBtn: { flex: 1, flexDirection: 'row', height: 60, backgroundColor: colors.primary, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOpacity: 0.3, shadowOffset: {width:0, height:4}, elevation: 6 },
  nextText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  mainButton: { flexDirection:'row', backgroundColor: colors.accent, paddingHorizontal: 40, paddingVertical: 22, borderRadius: 30, marginTop: 40, shadowColor: colors.accent, shadowOpacity: 0.4, shadowOffset: {width: 0, height: 8}, elevation: 8, alignItems:'center' },
  mainButtonText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 1 }
});