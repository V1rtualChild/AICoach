// src/screens/ProgressScreen.js
import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  SafeAreaView, Platform, StatusBar, ActivityIndicator 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { getLatestMeasurement, getUserProfile } from '../services/storageService';
import colors from '../constants/colors';

export default function ProgressScreen({ navigation }) {
  const [currentData, setCurrentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userHeight, setUserHeight] = useState(175);
  const [startProfile, setStartProfile] = useState(null);

  // Оновлюємо дані щоразу, коли користувач відкриває екран
  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [])
  );

  const loadProgress = async () => {
    setLoading(true);
    try {
      // 1. Отримуємо початкові дані з профілю
      const profile = await getUserProfile();
      if (profile) {
        setStartProfile(profile);
        setUserHeight(profile.height || 175);
      }

      // 2. Отримуємо найсвіжіші заміри зі звіту
      const latest = await getLatestMeasurement();
      setCurrentData(latest);

    } catch (error) {
      console.error("Помилка завантаження прогресу:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = (weight) => {
    if (!weight || !userHeight) return { value: 0, label: '—', color: '#94A3B8' };
    const h = userHeight / 100;
    const bmi = (weight / (h * h)).toFixed(1);
    if (bmi < 18.5) return { value: bmi, label: 'Дефіцит', color: '#0EA5E9' };
    if (bmi < 25) return { value: bmi, label: 'Норма', color: '#10B981' };
    return { value: bmi, label: 'Надмірна', color: '#EF4444' };
  };

  // Функція для розрахунку та відображення різниці (+/-)
  const renderDiff = (current, start, unit = 'см') => {
    if (!current || !start) return null;
    const diff = (parseFloat(current) - parseFloat(start)).toFixed(1);
    if (diff == 0) return null;
    
    const isIncrease = diff > 0;
    // Для ваги при схудненні мінус — це добре (зелений), для м'язів плюс — добре.
    // Тут зробимо універсально: помаранчевий для росту, зелений для спадання.
    const color = isIncrease ? '#F59E0B' : '#10B981'; 
    
    return (
      <View style={[styles.diffBadge, { backgroundColor: color + '15' }]}>
        <Feather name={isIncrease ? "arrow-up-right" : "arrow-down-right"} size={10} color={color} />
        <Text style={[styles.diffText, { color: color }]}>
          {isIncrease ? '+' : ''}{diff} {unit}
        </Text>
      </View>
    );
  };

  const bmi = calculateBMI(currentData?.weight);

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const StatRow = ({ label, icon, value, startValue, isLast }) => (
    <View style={[styles.statRow, !isLast && styles.borderBottom]}>
      <View style={styles.statInfo}>
        <View style={styles.iconBox}>
          <Feather name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <View style={styles.valueContainer}>
        <View style={styles.mainValueBox}>
            <Text style={styles.statValue}>{value || '—'}</Text>
            <Text style={styles.unitText}>см</Text>
        </View>
        {renderDiff(value, startValue)}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Аналітика прогресу</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ГОЛОВНИЙ ВІДЖЕТ ВАГИ */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Поточна вага</Text>
              <View style={styles.weightRow}>
                <Text style={styles.weightValue}>{currentData?.weight || startProfile?.weight || '—'}</Text>
                <Text style={styles.weightUnit}>кг</Text>
              </View>
            </View>
            <View style={[styles.bmiCircle, { borderColor: bmi.color }]}>
              <Text style={[styles.bmiVal, { color: bmi.color }]}>{bmi.value}</Text>
              <Text style={styles.bmiLab}>ІМТ</Text>
            </View>
          </View>

          {startProfile?.weight && currentData?.weight && (
            <View style={styles.totalProgressRow}>
              <View style={styles.totalProgressInfo}>
                <Feather 
                  name={currentData.weight - startProfile.weight > 0 ? "trending-up" : "trending-down"} 
                  size={20} 
                  color={currentData.weight - startProfile.weight > 0 ? "#F59E0B" : "#10B981"} 
                />
                <Text style={styles.totalProgressText}>Динаміка ваги</Text>
              </View>
              {renderDiff(currentData.weight, startProfile.weight, 'кг')}
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Об'єми тіла</Text>

        <View style={styles.statsCard}>
          <StatRow label="Шия" icon="user" value={currentData?.neck} />
          <StatRow label="Груди" icon="shield" value={currentData?.chest} />
          <StatRow label="Біцепс" icon="zap" value={currentData?.biceps} />
          <StatRow label="Талія" icon="minimize-2" value={currentData?.waist} />
          <StatRow label="Сідниці" icon="layers" value={currentData?.hips} />
          <StatRow label="Стегно" icon="maximize-2" value={currentData?.thigh} />
          <StatRow label="Ікри" icon="chevrons-down" value={currentData?.calves} isLast />
        </View>

        <View style={styles.infoBox}>
          <Feather name="refresh-cw" size={18} color="#1E40AF" />
          <Text style={styles.infoText}>
            Тут відображаються дані з твого останнього звіту. Порівняння йде з показниками при реєстрації.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },

  heroCard: { backgroundColor: '#fff', borderRadius: 32, padding: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, marginBottom: 30 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { fontSize: 13, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  weightRow: { flexDirection: 'row', alignItems: 'baseline' },
  weightValue: { fontSize: 48, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  weightUnit: { fontSize: 20, fontWeight: '800', color: '#94A3B8', marginLeft: 5 },
  
  bmiCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  bmiVal: { fontSize: 18, fontWeight: '900' },
  bmiLab: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },

  totalProgressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  totalProgressInfo: { flexDirection: 'row', alignItems: 'center' },
  totalProgressText: { marginLeft: 10, fontSize: 15, color: '#64748B', fontWeight: '700' },

  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 15, letterSpacing: -0.5 },
  statsCard: { backgroundColor: '#fff', borderRadius: 28, paddingHorizontal: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  statInfo: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  statLabel: { fontSize: 16, fontWeight: '700', color: '#334155' },
  valueContainer: { alignItems: 'flex-end' },
  mainValueBox: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  unitText: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginLeft: 3 },
  
  diffBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  diffText: { fontSize: 12, fontWeight: '900', marginLeft: 3 },

  infoBox: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 20, borderRadius: 24, marginTop: 25, alignItems: 'center', borderWidth: 1, borderColor: '#DBEAFE' },
  infoText: { flex: 1, marginLeft: 15, fontSize: 13, color: '#1E40AF', lineHeight: 18, fontWeight: '600' }
});