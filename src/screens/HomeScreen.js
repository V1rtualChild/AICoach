// src/screens/HomeScreen.js
import React, { useState, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, 
  ScrollView, StatusBar, Modal, TextInput, KeyboardAvoidingView, Platform, LayoutAnimation, UIManager, Dimensions 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons'; 
import colors from '../constants/colors';
import { 
  getUserProfile, saveUserProfile, getHistory, getDailyNutrition, addFoodLog, 
  getActiveWorkout, saveActiveWorkout, clearActiveWorkout,
  getWeeklyProgress, startNewWeek, saveMeasurement,
  clearAllData
} from '../services/storageService';
import { generatePlan, analyzeFood } from '../services/aiService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// ULTRA-MODERN PROGRESS BAR
const ProgressBar = ({ label, current, target, color, unit = 'г' }) => {
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressLabels}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValues}>{current} / {target}{unit}</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const RATING_UA = { easy: '🙂 Легко', good: '😎 Норм', hard: '🥵 Важко' };

export default function HomeScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [targets, setTargets] = useState({ calories: 0, protein: 0, fats: 0, carbs: 0 });
  const [consumed, setConsumed] = useState({ calories: 0, protein: 0, fats: 0, carbs: 0, history: [] });
  const [loadingWorkout, setLoadingWorkout] = useState(false);
  
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [foodInput, setFoodInput] = useState('');
  const [analyzingFood, setAnalyzingFood] = useState(false);
  
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportStep, setReportStep] = useState('main'); 
  const [reportText, setReportText] = useState('');
  const [reportWeight, setReportWeight] = useState('');
  const [weekRatings, setWeekRatings] = useState([]); 
  const [submittingReport, setSubmittingReport] = useState(false);

  const [neck, setNeck] = useState('');
  const [chest, setChest] = useState('');
  const [biceps, setBiceps] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [thigh, setThigh] = useState('');
  const [calves, setCalves] = useState('');

  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [weekData, setWeekData] = useState({ weekNumber: 1, sessionsDone: 0, sessionsTarget: 3 });

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    const userData = await getUserProfile();
    if (!userData) { navigation.navigate('Setup'); return; }
    setProfile(userData);
    calculateTargets(userData);
    setConsumed(await getDailyNutrition());
    setActivePlan(await getActiveWorkout());
    setWeekData(await getWeeklyProgress());
  };

  const calculateTargets = (user) => {
    const weight = parseFloat(user.weight); const height = parseFloat(user.height); const age = parseFloat(user.age);
    let bmr = (user.gender === 'male') ? 10 * weight + 6.25 * height - 5 * age + 5 : 10 * weight + 6.25 * height - 5 * age - 161;
    let am = (user.jobType === 'active' || user.workoutTime) ? 1.55 : 1.2; if (user.location === 'gym') am += 0.1;
    let tdee = bmr * am; if (user.goal === 'muscle') tdee += 400; else if (user.goal === 'weight_loss') tdee -= 400;
    const calories = Math.round(tdee);
    let pR = user.goal === 'muscle' ? 0.25 : 0.4; let fR = user.goal === 'muscle' ? 0.25 : 0.3; let cR = user.goal === 'muscle' ? 0.5 : 0.3;
    setTargets({ calories, protein: Math.round((calories * pR) / 4), fats: Math.round((calories * fR) / 9), carbs: Math.round((calories * cR) / 4) });
  };

  const handleAddFood = async () => {
    if (!foodInput.trim()) return;
    setAnalyzingFood(true);
    try {
      const analysis = await analyzeFood(foodInput);
      if (!analysis) { Alert.alert("Помилка", "ШІ не зміг проаналізувати страву."); return; }
      if (analysis.calories === 0) {
        Alert.alert("Хмм 🤔", "Це не схоже на калорійну їжу.");
        setFoodInput(''); setFoodModalVisible(false); return;
      }
      const updatedLog = await addFoodLog(analysis);
      setConsumed(updatedLog); setFoodInput(''); setFoodModalVisible(false); setHistoryExpanded(true);
    } catch (error) { Alert.alert("Помилка", "Щось пішло не так."); } finally { setAnalyzingFood(false); }
  };

  const handleGenerateWorkout = async () => {
    if (activePlan) { navigation.navigate('Workout', { plan: activePlan }); return; }
    setLoadingWorkout(true);
    try {
      const history = await getHistory();
      const aiResponse = await generatePlan(profile, history, weekData);
      await saveActiveWorkout(aiResponse);
      setActivePlan(aiResponse);
      navigation.navigate('Workout', { plan: aiResponse });
    } catch (error) { Alert.alert("Помилка", "Не вдалося згенерувати план."); } 
    finally { setLoadingWorkout(false); }
  };

  const handleRegenerate = () => {
    Alert.alert("Замінити тренування?", "ШІ згенерує нові вправи на сьогодні.", [
      { text: "Скасувати", style: "cancel" },
      { text: "Замінити", style: "destructive", onPress: async () => { await clearActiveWorkout(); setActivePlan(null); handleGenerateWorkout(); } }
    ]);
  };

  const handleOpenReport = async () => {
    const fullHistory = await getHistory();
    const recentWorkouts = fullHistory.slice(0, weekData.sessionsTarget || 3);
    const recentRatings = recentWorkouts.map(w => w.rating);
    
    setWeekRatings(recentRatings);
    setReportWeight(profile.weight ? profile.weight.toString() : ''); 
    setReportStep('main'); 
    setReportModalVisible(true);
  };

  const handleSubmitReport = async () => {
    if (!reportWeight || !reportWeight.trim()) {
        Alert.alert("Увага", "Вкажіть актуальну вагу для розрахунку прогресу.");
        return;
    }
    setSubmittingReport(true);
    try {
        const fullHistory = await getHistory();
        
        const measurementsArray = [];
        if (neck) measurementsArray.push(`Шия: ${neck}см`);
        if (chest) measurementsArray.push(`Груди: ${chest}см`);
        if (biceps) measurementsArray.push(`Біцепс: ${biceps}см`);
        if (waist) measurementsArray.push(`Талія: ${waist}см`);
        if (hips) measurementsArray.push(`Стегна: ${hips}см`);
        if (thigh) measurementsArray.push(`Нога: ${thigh}см`);
        if (calves) measurementsArray.push(`Ікри: ${calves}см`);
        
        const measurementsString = measurementsArray.length > 0 ? measurementsArray.join(', ') : "Не вказано";

        const reportData = {
            feedback: reportText.trim() ? reportText : "Без коментарів.",
            weight: reportWeight,
            measurements: measurementsString,
            recentRatings: weekRatings.length > 0 ? weekRatings : ["good"]
        };

        const newProfile = { ...profile, weight: reportWeight };
        await saveUserProfile(newProfile);
        setProfile(newProfile);

        const hasMeasurements = measurementsArray.length > 0;
        if (hasMeasurements || reportWeight) {
            await saveMeasurement({ weight: reportWeight, neck, chest, biceps, waist, hips, thigh, calves });
        }

        const aiResponse = await generatePlan(newProfile, fullHistory, weekData, reportData);
        if (!aiResponse) throw new Error("AI Plan Error");

        await startNewWeek();
        await saveActiveWorkout(aiResponse);
        
        setReportModalVisible(false);
        setReportText(''); setNeck(''); setChest(''); setBiceps(''); setWaist(''); setHips(''); setThigh(''); setCalves('');
        loadData(); 
        
        Alert.alert("Звіт прийнято! 🚀", "ШІ згенерував новий план на наступний тиждень.");
    } catch (error) {
        Alert.alert("Помилка", "ШІ перевантажений. Спробуй ще раз.");
    } finally {
        setSubmittingReport(false);
    }
  };

  const handleResetData = () => {
    Alert.alert("Скинути всі дані?", "Уся історія та профіль будуть видалені. Дія незворотна.", [
        { text: "Скасувати", style: "cancel" },
        { text: "Видалити", style: "destructive", onPress: async () => { await clearAllData(); setProfile(null); navigation.navigate('Setup'); } }
    ]);
  };

  const toggleHistory = () => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setHistoryExpanded(!historyExpanded); };

  if (!profile) return null;
  const isWeekComplete = weekData.sessionsDone >= weekData.sessionsTarget;
  const hasAnyMeasurement = neck || chest || biceps || waist || hips || thigh || calves;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* HEADER MODERN */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Привіт, чемпіоне.</Text>
          <Text style={styles.dateText}>Сьогодні чудовий день для прогресу.</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Setup')}>
          <Feather name="sliders" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HERO WORKOUT CARD (ULTRA MODERN) */}
        {isWeekComplete ? (
          <TouchableOpacity style={[styles.heroCard, {backgroundColor: '#10B981'}]} onPress={handleOpenReport} activeOpacity={0.95}>
             <View style={styles.heroContent}>
               <Feather name="check-circle" size={32} color="rgba(255,255,255,0.9)" style={{marginBottom: 10}} />
               <Text style={styles.heroTitle}>Тиждень {weekData.weekNumber} завершено!</Text>
               <Text style={styles.heroSubtitle}>Час здати звіт та отримати новий план.</Text>
             </View>
             <View style={styles.heroActionBtn}>
               <Text style={[styles.heroActionText, {color: '#10B981'}]}>ЗДАТИ ЗВІТ</Text>
               <Feather name="arrow-right" size={20} color="#10B981" style={{marginLeft: 5}} />
             </View>
          </TouchableOpacity>
        ) : (
          loadingWorkout ? (
            <View style={styles.loadingCardModern}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingTextModern}>ШІ аналізує твій стан...</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.heroCard} onPress={handleGenerateWorkout} activeOpacity={0.95}>
                <View style={styles.heroTopRow}>
                   <View style={styles.heroBadge}>
                     <Feather name="activity" size={14} color="#fff" />
                     <Text style={styles.heroBadgeText}>Тренування {weekData.sessionsDone + 1}/{weekData.sessionsTarget}</Text>
                   </View>
                   {activePlan && <Feather name="play-circle" size={28} color="rgba(255,255,255,0.8)" />}
                </View>

                <Text style={styles.heroTitleLarge}>{activePlan ? activePlan.workout?.title : 'Час ставати кращим.'}</Text>
                <Text style={styles.heroSubtitle}>{activePlan ? 'Натисни, щоб продовжити виконання.' : 'ШІ готовий створити твоє ідеальне тренування на сьогодні.'}</Text>
                
                <View style={styles.heroActionBtn}>
                  <Text style={styles.heroActionText}>{activePlan ? 'ПРОДОВЖИТИ' : 'СТАРТ'}</Text>
                  <Feather name="arrow-right" size={20} color={colors.primary} style={{marginLeft: 5}} />
                </View>
            </TouchableOpacity>
          )
        )}
         {activePlan && !isWeekComplete && !loadingWorkout && (
            <TouchableOpacity style={styles.regenBtnModern} onPress={handleRegenerate}>
                <Feather name="refresh-cw" size={14} color="#94A3B8" />
                <Text style={styles.regenTextModern}>Згенерувати інший варіант</Text>
            </TouchableOpacity>
         )}

        {/* NUTRITION DASHBOARD */}
        <Text style={styles.sectionTitleModern}>Харчування сьогодні</Text>
        <View style={styles.nutritionCardModern}>
          
          <View style={styles.nutritionTopRow}>
             <View>
                <Text style={styles.caloriesBigLabel}>Залишок</Text>
                <Text style={styles.caloriesBigValue}>{Math.max(targets.calories - consumed.calories, 0)} <Text style={styles.calUnit}>ккал</Text></Text>
             </View>
             <TouchableOpacity onPress={() => setFoodModalVisible(true)} style={styles.addFoodBtnModern}>
                <Feather name="plus" size={24} color="#fff" />
             </TouchableOpacity>
          </View>

          <View style={styles.macrosGridModern}>
             <ProgressBar label="Білки" current={consumed.protein} target={targets.protein} color="#F43F5E" />
             <ProgressBar label="Жири" current={consumed.fats} target={targets.fats} color="#F59E0B" />
             <ProgressBar label="Вугл." current={consumed.carbs} target={targets.carbs} color="#10B981" />
          </View>

          {consumed.history && consumed.history.length > 0 && (
            <View style={styles.historyContainerModern}>
              <TouchableOpacity style={styles.historyHeaderBtnModern} onPress={toggleHistory} activeOpacity={0.7}>
                <Text style={styles.historyTitleModern}>Історія прийомів їжі ({consumed.history.length})</Text>
                <Feather name={historyExpanded ? "chevron-up" : "chevron-down"} size={18} color="#94A3B8" />
              </TouchableOpacity>
              {historyExpanded && (
                <View style={styles.historyListModern}>
                  {consumed.history.map((item, index) => (
                    <View key={index} style={styles.historyItemModern}>
                      <Text style={styles.foodNameModern} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.foodCalModern}>{item.calories} ккал</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* PROGRESS WIDGETS */}
        <Text style={styles.sectionTitleModern}>Твій прогрес</Text>
        <View style={styles.widgetRow}>
          <TouchableOpacity style={styles.widgetCard} onPress={() => navigation.navigate('Progress')} activeOpacity={0.85}>
            <View style={[styles.widgetIconBox, {backgroundColor: '#E0F2FE'}]}>
              <Feather name="bar-chart-2" size={28} color="#0EA5E9" />
            </View>
            <Text style={styles.widgetTitle}>Заміри тіла</Text>
            <Text style={styles.widgetSubtitle}>Динаміка ваги та об'ємів</Text>
            <Feather name="chevron-right" size={20} color="#CBD5E1" style={styles.widgetArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.widgetCard} onPress={() => navigation.navigate('History')} activeOpacity={0.85}>
            <View style={[styles.widgetIconBox, {backgroundColor: '#F3E8FF'}]}>
              <Feather name="clock" size={28} color="#A855F7" />
            </View>
            <Text style={styles.widgetTitle}>Історія</Text>
            <Text style={styles.widgetSubtitle}>Архів усіх тренувань</Text>
            <Feather name="chevron-right" size={20} color="#CBD5E1" style={styles.widgetArrow} />
          </TouchableOpacity>
        </View>

        {/* TEST RESET */}
        <TouchableOpacity style={styles.resetDataBtnModern} onPress={handleResetData}>
          <Feather name="trash-2" size={16} color="#EF4444" style={{marginRight: 8}} />
          <Text style={styles.resetDataTextModern}>Скинути всі дані (Тест)</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* MODALS (UNCHANGED LOGIC, MODERN STYLE) */}
      <Modal animationType="fade" transparent={true} visible={foodModalVisible} onRequestClose={() => setFoodModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlayCenterModern}>
          <View style={styles.modalFloatingCardModern}>
            <View style={styles.modalHeaderRowModern}>
               <Text style={styles.modalTitleModern}>Додати їжу</Text>
               <TouchableOpacity onPress={() => setFoodModalVisible(false)} style={styles.closeIconBtnModern}>
                 <Feather name="x" size={22} color="#64748B" />
               </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitleModern}>Напиши, що ти з'їв, а ШІ порахує все інше.</Text>
            
            <TextInput 
              style={styles.foodInputModern} 
              placeholder="Напр: Гречка з курячим філе і салат..." 
              placeholderTextColor="#94A3B8"
              value={foodInput} 
              onChangeText={setFoodInput} 
              autoFocus 
              multiline 
            />
            
            {analyzingFood ? (
              <View style={styles.analyzingBoxModern}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.analyzingTextModern}>Аналізую...</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.analyzeBtnModern} onPress={handleAddFood}>
                <Text style={styles.analyzeBtnTextModern}>ЗБЕРЕГТИ ЗАПИС</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={reportModalVisible} onRequestClose={() => setReportModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlayCenterModern}>
          <View style={[styles.modalFloatingCardModern, {maxHeight: '92%'}]}>
            {reportStep === 'main' ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
                <View style={styles.modalHeaderRowModern}>
                  <Text style={styles.modalTitleModern}>Звіт: Тиждень {weekData.weekNumber}</Text>
                  <TouchableOpacity onPress={() => setReportModalVisible(false)} style={styles.closeIconBtnModern}>
                    <Feather name="x" size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.ratingsDisplayBoxModern}>
                  <Text style={styles.ratingsLabelModern}>Твої оцінки за тиждень:</Text>
                  <View style={styles.ratingsRowModern}>
                    {weekRatings.length > 0 ? weekRatings.map((rate, i) => (
                      <Text key={i} style={styles.ratingBadgeModern}>{RATING_UA[rate] || rate}</Text>
                    )) : <Text style={{color: '#94A3B8'}}>Дані відсутні</Text>}
                  </View>
                </View>

                <Text style={styles.labelModern}>⚖️ Актуальна вага (кг)*</Text>
                <TextInput style={styles.inputModern} keyboardType="numeric" value={reportWeight} onChangeText={setReportWeight} placeholder="0.0" placeholderTextColor="#CBD5E1" />

                <Text style={styles.labelModern}>📏 Заміри тіла (необов'язково)</Text>
                <TouchableOpacity 
                  style={[styles.measurementsToggleBtnModern, hasAnyMeasurement && styles.measurementsToggleBtnActiveModern]} 
                  onPress={() => setReportStep('measurements')}
                >
                  <Feather name={hasAnyMeasurement ? "check" : "plus"} size={20} color={hasAnyMeasurement ? '#10B981' : colors.primary} style={{marginRight: 10}} />
                  <Text style={[styles.measurementsToggleTextModern, hasAnyMeasurement && {color: '#10B981'}]}>
                    {hasAnyMeasurement ? "Заміри внесено (Редагувати)" : "Додати заміри"}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.labelModern}>💬 Відгук тренеру</Text>
                <TextInput 
                  style={[styles.inputModern, {height: 100, textAlignVertical: 'top'}]} 
                  placeholder="Що було важко? Що сподобалось? Це допоможе ШІ адаптувати план..." 
                  placeholderTextColor="#94A3B8" 
                  multiline 
                  value={reportText} 
                  onChangeText={setReportText} 
                />

                {submittingReport ? (
                    <View style={styles.analyzingBoxModern}>
                      <ActivityIndicator color={colors.primary} size="small" />
                      <Text style={styles.analyzingTextModern}>ШІ створює новий план...</Text>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.analyzeBtnModern} onPress={handleSubmitReport}>
                      <Text style={styles.analyzeBtnTextModern}>ВІДПРАВИТИ ЗВІТ</Text>
                    </TouchableOpacity>
                )}
              </ScrollView>
            ) : (
               <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
                <View style={styles.modalHeaderRowModern}>
                   <TouchableOpacity onPress={() => setReportStep('main')} style={{marginRight: 15}}>
                      <Feather name="arrow-left" size={26} color={colors.primary} />
                   </TouchableOpacity>
                   <Text style={[styles.modalTitleModern, {flex: 1}]}>Заміри (см)</Text>
                </View>

                <Text style={styles.measureGroupTitle}>ВЕРХ</Text>
                <View style={styles.measureRowModern}><View style={{flex:1}}><Text style={styles.measureLabelModern}>Шия</Text><TextInput style={styles.measureInputModern} keyboardType="numeric" value={neck} onChangeText={setNeck} /></View><View style={{width:15}}/><View style={{flex:1}}><Text style={styles.measureLabelModern}>Груди</Text><TextInput style={styles.measureInputModern} keyboardType="numeric" value={chest} onChangeText={setChest} /></View></View>
                <View style={styles.measureRowModern}><View style={{flex:1}}><Text style={styles.measureLabelModern}>Біцепс</Text><TextInput style={styles.measureInputModern} keyboardType="numeric" value={biceps} onChangeText={setBiceps} /></View><View style={{width:15}}/><View style={{flex:1}}/></View>

                <Text style={styles.measureGroupTitle}>СЕРЕДИНА</Text>
                <View style={styles.measureRowModern}><View style={{flex:1}}><Text style={styles.measureLabelModern}>Талія</Text><TextInput style={styles.measureInputModern} keyboardType="numeric" value={waist} onChangeText={setWaist} /></View><View style={{width:15}}/><View style={{flex:1}}><Text style={styles.measureLabelModern}>Стегна</Text><TextInput style={styles.measureInputModern} keyboardType="numeric" value={hips} onChangeText={setHips} /></View></View>

                <Text style={styles.measureGroupTitle}>НИЗ</Text>
                <View style={styles.measureRowModern}><View style={{flex:1}}><Text style={styles.measureLabelModern}>Стегно</Text><TextInput style={styles.measureInputModern} keyboardType="numeric" value={thigh} onChangeText={setThigh} /></View><View style={{width:15}}/><View style={{flex:1}}><Text style={styles.measureLabelModern}>Ікри</Text><TextInput style={styles.measureInputModern} keyboardType="numeric" value={calves} onChangeText={setCalves} /></View></View>

                <TouchableOpacity style={styles.analyzeBtnModern} onPress={() => setReportStep('main')}>
                   <Text style={styles.analyzeBtnTextModern}>ГОТОВО</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // GLOBAL
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 65 : 50, paddingBottom: 25 },
  greeting: { fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  dateText: { color: '#64748B', fontSize: 15, fontWeight: '500', marginTop: 4 },
  settingsBtn: { width: 48, height: 48, backgroundColor: '#fff', borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 50 },
  sectionTitleModern: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 35, marginBottom: 15, letterSpacing: -0.5 },

  // HERO CARD (ULTRA MODERN)
  heroCard: { backgroundColor: colors.primary, borderRadius: 32, padding: 28, shadowColor: colors.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12, minHeight: 220, justifyContent: 'space-between' },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  heroBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 6 },
  heroTitleLarge: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 20, lineHeight: 38, letterSpacing: -1 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '500', marginTop: 8, maxWidth: '90%' },
  heroActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, marginTop: 25 },
  heroActionText: { color: colors.primary, fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  heroContent: { flex: 1 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '900' },
  
  loadingCardModern: { backgroundColor: '#fff', borderRadius: 32, padding: 40, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, minHeight: 220, justifyContent: 'center' },
  loadingTextModern: { marginTop: 20, color: '#64748B', fontWeight: '600', fontSize: 16 },
  regenBtnModern: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15, padding: 10 },
  regenTextModern: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginLeft: 8 },

  // NUTRITION MODERN
  nutritionCardModern: { backgroundColor: '#fff', borderRadius: 32, padding: 28, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
  nutritionTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
  caloriesBigLabel: { fontSize: 15, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },
  caloriesBigValue: { fontSize: 42, fontWeight: '900', color: '#0F172A', marginTop: 4 },
  calUnit: { fontSize: 20, fontWeight: '600', color: '#94A3B8' },
  addFoodBtnModern: { width: 56, height: 56, backgroundColor: colors.primary, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOpacity: 0.4, shadowOffset: {width:0, height:6}, shadowRadius: 10, elevation: 6 },
  macrosGridModern: { gap: 20 },
  
  // Progress Bars Modern
  progressBlock: { marginBottom: 5 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 15, fontWeight: '700', color: '#334155' },
  progressValues: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  progressBarBg: { height: 14, backgroundColor: '#F1F5F9', borderRadius: 7, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 7 },

  historyContainerModern: { marginTop: 30, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  historyHeaderBtnModern: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  historyTitleModern: { fontSize: 14, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  historyListModern: { marginTop: 15, gap: 12 },
  historyItemModern: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  foodNameModern: { fontSize: 16, color: '#334155', fontWeight: '600', flex: 1, marginRight: 10 },
  foodCalModern: { fontSize: 16, fontWeight: '800', color: colors.primary },

  // WIDGETS ROW
  widgetRow: { flexDirection: 'row', gap: 16 },
  widgetCard: { flex: 1, backgroundColor: '#fff', padding: 24, borderRadius: 28, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 3, position: 'relative' },
  widgetIconBox: { width: 52, height: 52, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  widgetTitle: { fontWeight: '800', color: '#0F172A', fontSize: 17, marginBottom: 6 },
  widgetSubtitle: { color: '#64748B', fontSize: 13, fontWeight: '500', lineHeight: 18 },
  widgetArrow: { position: 'absolute', bottom: 24, right: 24 },

  resetDataBtnModern: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 50, padding: 15, backgroundColor: '#FEF2F2', borderRadius: 20 },
  resetDataTextModern: { color: '#EF4444', fontSize: 14, fontWeight: '700' },

  // MODALS MODERN
  modalOverlayCenterModern: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.6)' },
  modalFloatingCardModern: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, paddingBottom: 40, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalHeaderRowModern: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitleModern: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  modalSubtitleModern: { fontSize: 15, color: '#64748B', marginBottom: 25, lineHeight: 22, fontWeight: '500' },
  closeIconBtnModern: { width: 40, height: 40, backgroundColor: '#F1F5F9', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  
  foodInputModern: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 18, borderRadius: 20, fontSize: 17, height: 120, textAlignVertical: 'top', marginBottom: 25, color: '#0F172A', fontWeight: '600' },
  analyzeBtnModern: { backgroundColor: colors.primary, padding: 20, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: colors.primary, shadowOpacity: 0.3, shadowOffset: {width:0, height:4}, elevation: 5 },
  analyzeBtnTextModern: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  analyzingBoxModern: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15 },
  analyzingTextModern: { marginLeft: 12, color: colors.primary, fontWeight: '700', fontSize: 15 },

  // REPORT MODAL STYLES
  ratingsDisplayBoxModern: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, marginBottom: 25 },
  ratingsLabelModern: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 12 },
  ratingsRowModern: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ratingBadgeModern: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, fontSize: 14, fontWeight: '700', color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0' },
  labelModern: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 10, marginTop: 15 },
  inputModern: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 18, borderRadius: 20, fontSize: 17, color: '#0F172A', fontWeight: '600', marginBottom: 15 },
  measurementsToggleBtnModern: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 18, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  measurementsToggleBtnActiveModern: { backgroundColor: '#ECFDF5', borderColor: '#10B981', borderStyle: 'solid' },
  measurementsToggleTextModern: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  
  measureGroupTitle: { fontSize: 13, fontWeight: '800', color: '#94A3B8', marginTop: 15, marginBottom: 12, letterSpacing: 1 },
  measureRowModern: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  measureLabelModern: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 8 },
  measureInputModern: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 16, borderRadius: 16, fontSize: 17, textAlign: 'center', color: '#0F172A', fontWeight: '700' },
});