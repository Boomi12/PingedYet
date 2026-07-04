import React, { useState, useCallback, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { STATUSES, STATUS_LIST } from '../constants/statuses';
import { applicationService } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import ApplicationCard from '../components/ApplicationCard';
import CursorSparkles from '../components/CursorSparkles';
import BackgroundBubbles from '../components/BackgroundBubbles';
import DraggableRow from '../components/DraggableRow';

export default function ApplicationListScreen({ route, navigation }) {
  const { colors, isDark } = useContext(ThemeContext);

  const initialFilters = {
    status: 'All',
    workMode: 'All',
    stipend: 'All',
    location: '',
    duration: ''
  };

  const [allApplications, setAllApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Applied filters and temp filters inside modal
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  const [tempFilters, setTempFilters] = useState(initialFilters);
  
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const loadApplications = async () => {
    try {
      setIsError(false);
      setIsLoading(true);
      const list = await applicationService.getAll();
      setAllApplications(list || []);
    } catch (error) {
      console.error('[ApplicationListScreen] Failed to load:', error.message);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadApplications();
    }, [])
  );

  // Hook up external route parameter to active filters (e.g. from Dashboard click)
  useEffect(() => {
    if (route.params?.filter) {
      setActiveFilters(prev => ({ ...prev, status: route.params.filter }));
      navigation.setParams({ filter: undefined });
    }
  }, [route.params?.filter]);

  // Combined Filters Logic
  useEffect(() => {
    // Disable reorder mode if any filter becomes active
    const hasActiveFilters = activeFilters.status !== 'All' || 
                             activeFilters.workMode !== 'All' || 
                             activeFilters.stipend !== 'All' || 
                             activeFilters.location.trim() !== '' || 
                             activeFilters.duration.trim() !== '' || 
                             searchQuery.trim() !== '';
    if (hasActiveFilters) {
      setIsReorderMode(false);
    }

    let result = [...allApplications];

    // 1. Status Filter
    if (activeFilters.status !== 'All') {
      result = result.filter(app => app.status === activeFilters.status);
    }

    // 2. Work Mode Filter
    if (activeFilters.workMode !== 'All') {
      result = result.filter(app => app.workMode === activeFilters.workMode);
    }

    // 3. Stipend Filter
    if (activeFilters.stipend !== 'All') {
      result = result.filter(app => {
        const amount = app.stipendAmount;
        if (activeFilters.stipend === 'No stipend entered') {
          return amount === undefined || amount === null || amount === '';
        }
        if (amount === undefined || amount === null || amount === '') return false;
        
        const num = Number(amount);
        if (isNaN(num)) return false;

        switch (activeFilters.stipend) {
          case 'Below 5,000':
            return num < 5000;
          case '5,000 - 10,000':
            return num >= 5000 && num <= 10000;
          case '10,000 - 20,000':
            return num >= 10000 && num <= 20000;
          case 'Above 20,000':
            return num > 20000;
          default:
            return true;
        }
      });
    }

    // 4. Work Location Filter
    if (activeFilters.location.trim() !== '') {
      const locQuery = activeFilters.location.toLowerCase().trim();
      result = result.filter(app => app.workLocation && app.workLocation.toLowerCase().includes(locQuery));
    }

    // 5. Duration Filter
    if (activeFilters.duration.trim() !== '') {
      const durQuery = activeFilters.duration.toLowerCase().trim();
      result = result.filter(app => app.duration && app.duration.toLowerCase().includes(durQuery));
    }

    // 6. Search Bar query matching (Company and Role)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        app => 
          app.companyName.toLowerCase().includes(query) || 
          app.role.toLowerCase().includes(query)
      );
    }

    setFilteredApplications(result);
  }, [allApplications, activeFilters, searchQuery]);

  const handleQuickStatusUpdate = async (id, newStatus) => {
    try {
      await applicationService.update(id, { status: newStatus });
      const updatedList = await applicationService.getAll();
      setAllApplications(updatedList || []);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update status.');
    }
  };

  const openFilterModal = () => {
    setTempFilters(activeFilters);
    setIsFilterModalVisible(true);
  };

  const applyFilters = () => {
    setActiveFilters(tempFilters);
    setIsFilterModalVisible(false);
  };

  const clearFilters = () => {
    setActiveFilters(initialFilters);
    setTempFilters(initialFilters);
    setSearchQuery('');
  };

  const removeSpecificFilter = (key) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: key === 'status' || key === 'workMode' || key === 'stipend' ? 'All' : ''
    }));
  };

  const handleDragEnd = async (fromIndex, toIndex) => {
    setIsDragging(false);
    if (fromIndex === toIndex) return;

    // Swap elements in local state
    const updated = [...filteredApplications];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    
    setFilteredApplications(updated);
    setAllApplications(updated);

    try {
      const ids = updated.map(app => app._id || app.id);
      await applicationService.reorder(ids);
      console.log('[Reorder] Database order updated successfully.');
    } catch (error) {
      console.error('[Reorder] Failed to save order:', error.message);
      Alert.alert('Reorder Failed', 'Could not save the new order. Please try again.');
      loadApplications();
    }
  };

  const isTotalDatabaseEmpty = allApplications.length === 0;

  const getActiveChips = () => {
    const chips = [];
    if (activeFilters.status !== 'All') {
      chips.push({ key: 'status', label: activeFilters.status });
    }
    if (activeFilters.workMode !== 'All') {
      chips.push({ key: 'workMode', label: activeFilters.workMode });
    }
    if (activeFilters.stipend !== 'All') {
      chips.push({ key: 'stipend', label: activeFilters.stipend });
    }
    if (activeFilters.location.trim() !== '') {
      chips.push({ key: 'location', label: `Loc: ${activeFilters.location}` });
    }
    if (activeFilters.duration.trim() !== '') {
      chips.push({ key: 'duration', label: `Dur: ${activeFilters.duration}` });
    }
    return chips;
  };

  const activeChips = getActiveChips();
  const isAnyFilterActive = activeChips.length > 0 || searchQuery.trim() !== '';

  return (
    <SafeAreaView style={styles.safeContainer}>
      <CursorSparkles />
      
      <LinearGradient 
        colors={colors.bgGradient} 
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <BackgroundBubbles />
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.titleText, { color: colors.textPrimary }]}>Applications</Text>
          {!isAnyFilterActive && allApplications.length > 1 && (
            <TouchableOpacity 
              style={[
                styles.reorderToggleBtn, 
                { 
                  borderColor: isReorderMode ? colors.cyan : colors.border,
                  backgroundColor: isReorderMode ? colors.cyan + '12' : 'transparent'
                }
              ]}
              onPress={() => setIsReorderMode(!isReorderMode)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={isReorderMode ? "check-circle" : "swap-vertical"} 
                size={16} 
                color={isReorderMode ? colors.cyan : colors.textPrimary} 
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.reorderToggleText, { color: isReorderMode ? colors.cyan : colors.textPrimary }]}>
                {isReorderMode ? "Done" : "Reorder"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search & Filter Button Row */}
        <View style={styles.searchRow}>
          <View style={[styles.searchContainer, { backgroundColor: colors.cardBg, borderColor: colors.border, flex: 1 }]}>
            <MaterialCommunityIcons name="magnify" size={22} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              placeholder="Search company or role..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              keyboardAppearance="dark"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[
              styles.filterIconButton, 
              { 
                backgroundColor: colors.cardBg, 
                borderColor: activeChips.length > 0 ? colors.cyan : colors.border 
              }
            ]}
            onPress={openFilterModal}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name="filter-variant" 
              size={22} 
              color={activeChips.length > 0 ? colors.cyan : colors.textPrimary} 
            />
            {activeChips.length > 0 && (
              <View style={[styles.filterActiveDot, { backgroundColor: colors.cyan }]} />
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filter Chips Scroll */}
        {activeChips.length > 0 && (
          <View style={styles.chipsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScrollContent}
            >
              {activeChips.map((chip) => (
                <View 
                  key={chip.key} 
                  style={[
                    styles.filterChip, 
                    { backgroundColor: colors.cyan + '12', borderColor: colors.cyan + '40' }
                  ]}
                >
                  <Text style={[styles.filterChipText, { color: colors.cyan }]}>{chip.label}</Text>
                  <TouchableOpacity onPress={() => removeSpecificFilter(chip.key)} style={styles.chipRemoveBtn}>
                    <MaterialCommunityIcons name="close" size={12} color={colors.cyan} />
                  </TouchableOpacity>
                </View>
              ))}
              
              <TouchableOpacity onPress={clearFilters} style={styles.clearChipsLink}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>Clear All</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Loader & Lists */}
        {isLoading && allApplications.length === 0 ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={colors.cyan} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading applications...</Text>
          </View>
        ) : isError ? (
          <View style={styles.centeredState}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              Could not connect to the server. Please check if the backend is running.
            </Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.cardBg, borderColor: colors.border }]} onPress={loadApplications}>
              <Text style={{ color: colors.cyan, fontWeight: '700' }}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredApplications}
            keyExtractor={(item) => item.id || item._id}
            scrollEnabled={!isDragging}
            renderItem={({ item, index }) => (
              <DraggableRow
                isReorderMode={isReorderMode}
                index={index}
                totalItems={filteredApplications.length}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                colors={colors}
              >
                <ApplicationCard
                  application={{
                    ...item,
                    id: item.id || item._id,
                    platform: item.platform || item.platformAppliedFrom,
                  }}
                  onPress={() => !isReorderMode && navigation.navigate('ApplicationDetails', { id: item.id || item._id })}
                  onStatusUpdate={handleQuickStatusUpdate}
                  onDeleteRefresh={loadApplications}
                />
              </DraggableRow>
            )}
            contentContainerStyle={[styles.listContent, activeChips.length > 0 && { paddingTop: 8 }]}
            showsVerticalScrollIndicator={false}
            onRefresh={isReorderMode ? null : loadApplications}
            refreshing={isReorderMode ? false : isLoading}
            ListEmptyComponent={
              isTotalDatabaseEmpty ? (
                <View style={[styles.emptyContainer, { backgroundColor: colors.cardBg, borderColor: colors.border, shadowColor: colors.shadow }]}>
                  <MaterialCommunityIcons name="orbit" size={54} color={colors.textMuted} style={styles.emptyIcon} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No applications yet.</Text>
                  <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                    Add your first application.
                  </Text>
                  <TouchableOpacity 
                    style={[styles.emptyButton, { backgroundColor: colors.cyan + '12', borderColor: colors.cyan + '40' }]}
                    onPress={() => navigation.navigate('Add Application')}
                  >
                    <Text style={{ color: colors.cyan, fontWeight: '700' }}>Add Application</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.emptyContainer, { backgroundColor: colors.cardBg, borderColor: colors.border, shadowColor: colors.shadow }]}>
                  <MaterialCommunityIcons name="filter-remove-outline" size={54} color={colors.textMuted} style={styles.emptyIcon} />
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No applications match your filters.</Text>
                  <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                    Try changing or clearing filters.
                  </Text>
                  <TouchableOpacity 
                    style={[styles.emptyButton, { backgroundColor: colors.cyan + '12', borderColor: colors.cyan + '40' }]}
                    onPress={clearFilters}
                  >
                    <Text style={{ color: colors.cyan, fontWeight: '700' }}>Clear Filters</Text>
                  </TouchableOpacity>
                </View>
              )
            }
          />
        )}
      </LinearGradient>

      {/* Filter Modal Panel */}
      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Filter Applications</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Filter Form */}
            <ScrollView contentContainerStyle={styles.filterModalScroll} showsVerticalScrollIndicator={false}>
              
              {/* Status Section */}
              <Text style={[styles.filterSectionLabel, { color: colors.textSecondary }]}>Status</Text>
              <View style={styles.filterOptionsGrid}>
                {['All', ...STATUS_LIST].map(s => {
                  const isSelected = tempFilters.status === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.filterGridBtn,
                        { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF' },
                        isSelected && { borderColor: colors.cyan, backgroundColor: colors.cyan + '18' }
                      ]}
                      onPress={() => setTempFilters(prev => ({ ...prev, status: s }))}
                    >
                      <Text style={[styles.filterGridBtnText, { color: isSelected ? colors.cyan : colors.textSecondary }]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Work Mode Section */}
              <Text style={[styles.filterSectionLabel, { color: colors.textSecondary }]}>Work Mode</Text>
              <View style={styles.filterOptionsGrid}>
                {['All', 'Work From Home', 'In-Office', 'Hybrid'].map(m => {
                  const isSelected = tempFilters.workMode === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.filterGridBtn,
                        { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF' },
                        isSelected && { borderColor: colors.cyan, backgroundColor: colors.cyan + '18' }
                      ]}
                      onPress={() => setTempFilters(prev => ({ ...prev, workMode: m }))}
                    >
                      <Text style={[styles.filterGridBtnText, { color: isSelected ? colors.cyan : colors.textSecondary }]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Stipend Section */}
              <Text style={[styles.filterSectionLabel, { color: colors.textSecondary }]}>Stipend / Salary / Fee</Text>
              <View style={styles.filterOptionsVertical}>
                {['All', 'No stipend entered', 'Below 5,000', '5,000 - 10,000', '10,000 - 20,000', 'Above 20,000'].map(st => {
                  const isSelected = tempFilters.stipend === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.filterVerticalBtn,
                        { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF' },
                        isSelected && { borderColor: colors.cyan, backgroundColor: colors.cyan + '18' }
                      ]}
                      onPress={() => setTempFilters(prev => ({ ...prev, stipend: st }))}
                    >
                      <Text style={[styles.filterVerticalBtnText, { color: isSelected ? colors.cyan : colors.textSecondary }]}>
                        {st}
                      </Text>
                      {isSelected && <MaterialCommunityIcons name="check" size={16} color={colors.cyan} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Location Section */}
              <Text style={[styles.filterSectionLabel, { color: colors.textSecondary }]}>Work Location</Text>
              <TextInput
                style={[
                  styles.filterInput, 
                  { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF' }
                ]}
                placeholder="e.g. Bengaluru, Remote"
                placeholderTextColor={colors.textMuted}
                value={tempFilters.location}
                onChangeText={val => setTempFilters(prev => ({ ...prev, location: val }))}
                keyboardAppearance="dark"
              />

              {/* Duration Section */}
              <Text style={[styles.filterSectionLabel, { color: colors.textSecondary }]}>Duration</Text>
              <TextInput
                style={[
                  styles.filterInput, 
                  { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF' }
                ]}
                placeholder="e.g. 3 months, Full-time"
                placeholderTextColor={colors.textMuted}
                value={tempFilters.duration}
                onChangeText={val => setTempFilters(prev => ({ ...prev, duration: val }))}
                keyboardAppearance="dark"
              />

              <View style={{ height: 30 }} />
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={[styles.filterActionsRow, { borderTopColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.filterActionBtn, { borderColor: colors.border }]} 
                onPress={() => setTempFilters(initialFilters)}
              >
                <Text style={[styles.filterActionBtnText, { color: colors.textSecondary }]}>Clear Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterActionBtn, { borderColor: colors.border }]} 
                onPress={() => setIsFilterModalVisible(false)}
              >
                <Text style={[styles.filterActionBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.filterApplyBtnContainer} 
                onPress={applyFilters}
              >
                <LinearGradient
                  colors={[colors.cyan, colors.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.filterApplyBtn}
                >
                  <Text style={styles.filterApplyBtnText}>Apply Filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    gap: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  filterIconButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipsWrapper: {
    marginTop: 12,
    marginBottom: 4,
  },
  chipsScrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.2,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipRemoveBtn: {
    padding: 2,
  },
  clearChipsLink: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 110,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyContainer: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyButton: {
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  // Modal Overlay and Layout
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 8, 13, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    paddingBottom: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '850',
    letterSpacing: 0.5,
  },
  filterModalScroll: {
    padding: 20,
  },
  filterSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 8,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  filterGridBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterGridBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterOptionsVertical: {
    gap: 8,
    marginBottom: 20,
  },
  filterVerticalBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterVerticalBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  filterActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    gap: 10,
  },
  filterActionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  filterApplyBtnContainer: {
    flex: 1.2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  filterApplyBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterApplyBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  reorderToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reorderToggleText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
