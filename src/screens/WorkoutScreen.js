// src/screens/WorkoutScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, 
  SafeAreaView, Platform, StatusBar, Vibration, Linking 
} from 'react-native';
import { Feather } from '@expo/vector-icons'; 
import colors from '../constants/colors';
import { saveToHistory, clearActiveWorkout, incrementWeeklyProgress } from '../services/storageService'; 

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function WorkoutScreen({ route, navigation }) {
  const { plan } = route.params || {}; 
  const workout = plan?.workout || {};
  const nutrition = plan?.nutrition || {};
  
  const [modalVisible, setModalVisible] = useState(false);
  const [seconds, setSeconds] = useState(0); 
  const [isPaused, setIsPaused] = useState(false);
  const [completedExercises, setCompletedExercises] = useState([]); 

  useEffect(() => {
    let interval = null;
    if (!isPaused) {
      interval = setInterval(() => { setSeconds(s => s + 1); }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused]);

  const toggleExercise = (index) => {
    Vibration.vibrate(50);
    setCompletedExercises(prev => {
      if (prev.includes(index)) return prev.filter(i => i !== index);
      else return [...prev, index];
    });
  };

  const totalExercises = workout.exercises ? workout.exercises.length : 1;
  const isAllDone = completedExercises.length === totalExercises;

  const checkCompletion = () => {
    if (!isAllDone) {
      Alert.alert("Ще не все! 🛑", `Залишилось вправ: ${totalExercises - completedExercises.length}. Виконай план до кінця.`);
      return;
    }
    setModalVisible(true); 
  };

  const handleFinish = async (rating) => {
    setModalVisible(false);
    
    // 👇 Ось тут ми додали date: new Date().toISOString()
    await saveToHistory({
      date: new Date().toISOString(), 
      title: workout.title || "Тренування", 
      rating: rating, 
      duration: formatTime(seconds),
      completedCount: completedExercises.length, 
      totalCount: totalExercises, 
      exercises: workout.exercises 
    });
    
    await clearActiveWorkout();
    await incrementWeeklyProgress(); 
    Alert.alert("Тренування завершено! 🦾", `Дані збережено.`, [{ text: "На головну", onPress: () => navigation.navigate('Home') }]);
  };

  const openYouTube = (searchQuery, fallbackName) => {
    const query = searchQuery || `${fallbackName} техніка виконання`;
    Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`).catch(err => console.error("Error", err));
  };

  const progress = completedExercises.length / totalExercises;
  const mealToDisplay = nutrition.meal_example || "Збалансований прийом їжі.";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.timerBlock}>
            <Feather name="clock" size={16} color="#64748B" style={{marginRight: 8}} />
            <Text style={styles.timerValue}>{formatTime(seconds)}</Text>
        </View>
        <View style={{width: 44}} /> 
      </View>
      <View style={styles.progressSection}>
        <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: isAllDone ? '#10B981' : colors.primary }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{workout.title || "Тренування"}</Text>
          <View style={styles.badgesRow}>
            <View style={styles.badge}><Text style={styles.badgeText}>{workout.difficulty || "Середньо"}</Text></View>
            {workout.location_note && (
              <View style={styles.locationBadge}>
                <Feather name="map-pin" size={14} color="#64748B" style={{marginRight: 4}} />
                <Text style={styles.locationNote} numberOfLines={1} ellipsizeMode="tail">{workout.location_note}</Text>
              </View>
            )}
          </View>
        </View>

        {workout.warmup && (
          <View style={styles.warmupBox}>
             <View style={styles.warmupHeader}>
                <Feather name="zap" size={20} color={colors.primary} style={{marginRight: 10}} />
                <Text style={styles.warmupTitle}>Розминка</Text>
             </View>
             <Text style={styles.warmupText}>{workout.warmup}</Text>
          </View>
        )}

        {/* 👇 Оновлений заголовок з підказкою для користувача */}
        <View style={styles.exercisesHeaderRow}>
  <Text style={styles.sectionTitleRow}>Вправи ({totalExercises})</Text>
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 2 }}>
    <Text style={[styles.hintText, { paddingBottom: 0 }]}>Відмічай виконані</Text>
    <Feather name="check-circle" size={14} color="#64748B" style={{ marginLeft: 6 }} />
  </View>
</View>
        
        {workout.exercises && workout.exercises.map((exercise, index) => {
          const isDone = completedExercises.includes(index);
          return (
            <TouchableOpacity key={index} activeOpacity={0.9} onPress={() => toggleExercise(index)} style={[styles.card, isDone && styles.cardDone]}>
              <View style={styles.cardHeader}>
                <View style={[styles.checkBox, isDone ? styles.checkBoxDone : styles.checkBoxEmpty]}>
                  {isDone ? <Feather name="check" size={20} color="#fff" /> : <Text style={styles.numberText}>{index + 1}</Text>}
                </View>
                <Text style={[styles.exerciseName, isDone && styles.textDone]}>{exercise.name}</Text>
              </View>
              
              <View style={styles.statsRow}>
                <View style={[styles.statBadge, isDone && {backgroundColor: '#fff'}]}>
                  <Feather name="layers" size={16} color={isDone ? '#94A3B8' : colors.primary} />
                  <Text style={[styles.statItem, isDone && styles.textDoneGray]}> {exercise.sets} підходів</Text>
                </View>
                <View style={[styles.statBadge, isDone && {backgroundColor: '#fff'}]}>
                  <Feather name="repeat" size={16} color={isDone ? '#94A3B8' : colors.primary} />
                  <Text style={[styles.statItem, isDone && styles.textDoneGray]}> {exercise.reps} повторень</Text>
                </View>
              </View>
              
              {exercise.tips && !isDone && (
                <View style={styles.tipsContainer}>
                  <View style={styles.tipsHeader}>
                    <Feather name="info" size={16} color={colors.primary} style={{marginRight: 6}}/>
                    <Text style={styles.tipsTitle}>Техніка:</Text>
                  </View>
                  <Text style={styles.tipsText}>{exercise.tips}</Text>
                  <TouchableOpacity style={styles.youtubeBtn} onPress={() => openYouTube(exercise.youtube_search, exercise.name)}>
                    <Feather name="play-circle" size={20} color="#fff" />
                    <Text style={styles.youtubeBtnText}>ВІДЕО ТЕХНІКИ</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.sectionTitle, {marginTop: 25}]}>Після тренування</Text>
        <View style={styles.nutritionCardNew}>
          <View style={styles.nutritionHeaderNew}>
            <View style={styles.nutritionIconBox}><Feather name="coffee" size={24} color="#10B981"/></View>
            <Text style={styles.nutritionLabel}>Рекомендована страва</Text>
          </View>
          <Text style={styles.mealTextNew}>{mealToDisplay}</Text>
          {nutrition.advice && (
            <View style={styles.adviceBox}>
              <Feather name="zap" size={16} color="#D97706" style={{marginRight: 8}} />
              <Text style={styles.adviceText}>{nutrition.advice}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={[styles.finishButton, !isAllDone && styles.finishButtonDisabled]} onPress={checkCompletion}>
          <Text style={[styles.finishButtonText, !isAllDone && {color: '#94A3B8'}]}>{isAllDone ? "ЗАВЕРШИТИ ТРЕНУВАННЯ" : `ЗАЛИШИЛОСЬ ВПРАВ: ${totalExercises - completedExercises.length}`}</Text>
          {isAllDone && <Feather name="flag" size={20} color="#fff" style={{marginLeft: 10}} />}
        </TouchableOpacity>
      </ScrollView>

      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Як все пройшло?</Text>
            <View style={styles.ratingContainer}>
  <TouchableOpacity style={[styles.rateButton, {backgroundColor: '#10B981'}]} onPress={() => handleFinish('easy')}>
    <Feather name="smile" size={32} color="#fff" />
    <Text style={styles.rateText}>Легко</Text>
  </TouchableOpacity>
  
  <TouchableOpacity style={[styles.rateButton, {backgroundColor: colors.primary}]} onPress={() => handleFinish('good')}>
    <Feather name="thumbs-up" size={32} color="#fff" />
    <Text style={styles.rateText}>Норм</Text>
  </TouchableOpacity>
  
  <TouchableOpacity style={[styles.rateButton, {backgroundColor: '#EF4444'}]} onPress={() => handleFinish('hard')}>
    <Feather name="frown" size={32} color="#fff" />
    <Text style={styles.rateText}>Важко</Text>
  </TouchableOpacity>
</View>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{padding: 10}}><Text style={styles.cancelText}>Скасувати</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 20 : 40, paddingBottom: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2 },
  timerBlock: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2 },
  timerValue: { fontSize: 18, fontWeight: '800', color: '#0F172A', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  progressSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 15 },
  progressBarContainer: { flex: 1, height: 10, backgroundColor: '#E2E8F0', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },
  progressText: { marginLeft: 15, fontWeight: '800', color: colors.primary, fontSize: 14 },
  container: { padding: 24, paddingBottom: 50 },
  header: { marginBottom: 25 },
  title: { fontSize: 32, fontWeight: '900', color: '#0F172A', marginBottom: 10, letterSpacing: -1 },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  badge: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginBottom: 5 },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
  locationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginBottom: 5, flexShrink: 1 },
  locationNote: { color: '#64748B', fontWeight: '700', fontSize: 13, flexShrink: 1 },
  warmupBox: { backgroundColor: '#F0F9FF', padding: 24, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: '#BAE6FD' },
  warmupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  warmupTitle: { fontWeight: '800', color: '#0284C7', fontSize: 16, textTransform: 'uppercase' },
  warmupText: { color: '#334155', lineHeight: 24, fontSize: 15, fontWeight: '500' },
  
  // Нові стилі для підказки
  exercisesHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15, marginTop: 10 },
  sectionTitleRow: { fontSize: 20, fontWeight: '900', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 },
  hintText: { fontSize: 13, color: '#64748B', fontWeight: '700', paddingBottom: 2 },
  
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  card: { backgroundColor: '#fff', padding: 24, borderRadius: 28, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  cardDone: { backgroundColor: '#ECFDF5', shadowOpacity: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 }, 
  checkBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 2 },
  checkBoxEmpty: { borderColor: colors.primary, backgroundColor: 'transparent' }, 
  checkBoxDone: { borderColor: '#10B981', backgroundColor: '#10B981' }, 
  numberText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  exerciseName: { fontSize: 18, fontWeight: '800', color: '#0F172A', flex: 1, flexWrap: 'wrap' }, 
  textDone: { color: '#10B981', textDecorationLine: 'line-through', opacity: 0.6 }, 
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 5, flexWrap: 'wrap' },
  statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginBottom: 5 },
  statItem: { fontSize: 14, fontWeight: '700', color: '#334155' },
  textDoneGray: { color: '#94A3B8' },
  tipsContainer: { marginTop: 18, backgroundColor: '#F8FAFC', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tipsTitle: { fontSize: 14, fontWeight: '800', color: colors.primary },
  tipsText: { fontSize: 15, color: '#475569', lineHeight: 24, marginBottom: 18, fontWeight: '500' },
  youtubeBtn: { backgroundColor: '#EF4444', paddingVertical: 14, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: "#EF4444", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, elevation: 4 },
  youtubeBtnText: { color: '#fff', fontWeight: '800', fontSize: 14, marginLeft: 8, letterSpacing: 0.5 },

  nutritionCardNew: { backgroundColor: '#fff', padding: 24, borderRadius: 28, marginTop: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  nutritionHeaderNew: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  nutritionIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  nutritionLabel: { fontSize: 14, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, flexShrink: 1 },
  mealTextNew: { fontSize: 17, fontWeight: '700', color: '#0F172A', lineHeight: 26, marginBottom: 16 },
  adviceBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, alignSelf: 'flex-start' },
  adviceText: { fontSize: 14, color: '#D97706', fontWeight: '700', flexShrink: 1 },
  
  finishButton: { flexDirection:'row', backgroundColor: colors.primary, padding: 22, borderRadius: 24, alignItems: 'center', justifyContent:'center', marginTop: 40, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, elevation: 8 },
  finishButtonDisabled: { backgroundColor: '#E2E8F0', shadowOpacity: 0, elevation: 0 }, 
  finishButtonText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 0.5, textAlign: 'center', flexShrink: 1 },
  
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.7)' },
  modalView: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, paddingBottom: 50, alignItems: 'center' },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 25, color: '#0F172A' },
  ratingContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30, gap: 12 },
  rateButton: { flex: 1, paddingVertical: 20, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity: 0.1, elevation: 4 },
  rateText: { color: 'white', fontWeight: '800', fontSize: 15, marginTop: 8 },
  cancelText: { color: '#94A3B8', fontSize: 16, fontWeight: '700' }
});