// src/screens/HistoryScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, Platform, StatusBar, TouchableOpacity, LayoutAnimation, UIManager } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { getHistory } from '../services/storageService';
import colors from '../constants/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const RATING_ICONS = { easy: 'smile', good: 'thumbs-up', hard: 'frown' };
const RATING_COLORS = { easy: '#10B981', good: colors.primary, hard: '#EF4444' };
const RATING_BG = { easy: '#ECFDF5', good: '#EFF6FF', hard: '#FEF2F2' };

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    const data = await getHistory();
    const sortedData = (data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
    setHistory(sortedData);
  };

  const formatDate = (isoDate) => {
    if (!isoDate || isNaN(new Date(isoDate).getTime())) {
      return "Дата не вказана";
    }
    const date = new Date(isoDate);
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' });
  };

  const toggleExpand = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === index ? null : index);
  };

  const renderItem = ({ item, index }) => {
    const ratingIcon = RATING_ICONS[item.rating] || 'activity';
    const ratingColor = RATING_COLORS[item.rating] || '#94A3B8';
    const ratingBg = RATING_BG[item.rating] || '#F1F5F9';
    const isExpanded = expandedId === index;

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => toggleExpand(index)} style={styles.card}>
        <View style={styles.cardHeader}>
           <View style={styles.dateBadge}>
             <Feather name="calendar" size={14} color="#64748B" />
             <Text style={styles.dateText}>{formatDate(item.date)}</Text>
           </View>
        </View>
        
        <Text style={styles.workoutTitle}>{item.title || "Тренування"}</Text>
        
        <View style={styles.statsRow}>
            <View style={styles.statItem}>
                <Feather name="clock" size={18} color="#64748B" style={{marginRight: 8}}/>
                <Text style={styles.statValue}>{item.duration || "0:00"} хв</Text>
            </View>
            <View style={styles.statDivider}/>
            <View style={styles.statItem}>
                <Feather name="check-circle" size={18} color="#64748B" style={{marginRight: 8}}/>
                <Text style={styles.statValue}>{item.completedCount || 0}/{item.totalCount || 0} вправ</Text>
            </View>
        </View>

        {isExpanded ? (
          <View style={styles.expandedContent}>
             <Text style={styles.expandedTitle}>Виконані вправи</Text>
             
             {item.exercises && item.exercises.map((ex, i) => (
                <View key={i} style={styles.exerciseItemModern}>
                   <View style={styles.exerciseNumberBox}>
                      <Text style={styles.exerciseNumber}>{i + 1}</Text>
                   </View>
                   <View style={styles.exerciseDetailsBox}>
                       <Text style={styles.exNameModern}>{ex.name}</Text>
                       <View style={styles.exBadgesRow}>
                           <View style={styles.exBadge}>
                               <Feather name="layers" size={12} color="#64748B" />
                               <Text style={styles.exBadgeText}>{ex.sets} підх.</Text>
                           </View>
                           <View style={styles.exBadge}>
                               <Feather name="repeat" size={12} color="#64748B" />
                               <Text style={styles.exBadgeText}>{ex.reps} повт.</Text>
                           </View>
                       </View>
                   </View>
                </View>
             ))}
             
             <View style={styles.collapseHintModern}>
                <Feather name="chevron-up" size={18} color="#94A3B8" />
                <Text style={styles.collapseHintTextModern}>ЗГОРНУТИ ДЕТАЛІ</Text>
             </View>
          </View>
        ) : (
          item.exercises && item.exercises.length > 0 ? (
            <View style={styles.exercisePreview}>
                <View style={styles.previewHeaderRow}>
                   <Text style={styles.previewLabel}>Вправи (натисни, щоб розгорнути):</Text>
                   <Feather name="chevron-down" size={16} color="#94A3B8" />
                </View>
                <Text style={styles.previewText} numberOfLines={2}>
                    {item.exercises.map(e => e.name).join('  •  ')}
                </Text>
            </View>
          ) : null
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Історія тренувань</Text>
        <View style={{width: 48}}/>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
             <View style={styles.emptyIconBox}>
                <Feather name="clipboard" size={48} color={colors.primary} />
             </View>
             <Text style={styles.emptyTitle}>Історія порожня</Text>
             <Text style={styles.emptyText}>Заверши своє перше тренування, щоб ШІ зберіг його тут.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 20 : 40, paddingBottom: 15 },
  backBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  
  listContent: { padding: 24, paddingBottom: 50 },
  
  card: { backgroundColor: '#fff', borderRadius: 32, padding: 24, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 16 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  dateText: { fontSize: 13, fontWeight: '700', color: '#64748B', marginLeft: 6 },
  
  workoutTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 16, letterSpacing: -0.5 },
  
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  statItem: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  statValue: { fontSize: 15, fontWeight: '800', color: '#334155' },
  statDivider: { width: 1, height: 24, backgroundColor: '#E2E8F0' },
  
  exercisePreview: { marginTop: 5 },
  previewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  previewLabel: { fontSize: 13, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  previewText: { fontSize: 15, color: '#475569', fontWeight: '500', lineHeight: 24 },
  
  // НОВІ СТИЛІ РОЗГОРНУТОЇ КАРТКИ
  expandedContent: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 20 },
  expandedTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  exerciseItemModern: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  exerciseNumberBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1, borderColor: '#F1F5F9' },
  exerciseNumber: { fontSize: 15, fontWeight: '900', color: colors.primary },
  exerciseDetailsBox: { flex: 1 },
  exNameModern: { fontSize: 16, fontWeight: '800', color: '#334155', marginBottom: 6 },
  
  exBadgesRow: { flexDirection: 'row', gap: 8 },
  exBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  exBadgeText: { fontSize: 13, fontWeight: '700', color: '#64748B', marginLeft: 6 },
  
  collapseHintModern: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, paddingVertical: 12, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  collapseHintTextModern: { fontSize: 13, fontWeight: '800', color: '#94A3B8', marginLeft: 8, letterSpacing: 0.5 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 12, letterSpacing: -0.5 },
  emptyText: { fontSize: 16, color: '#64748B', textAlign: 'center', maxWidth: '80%', lineHeight: 24, fontWeight: '500' }
});