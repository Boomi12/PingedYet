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
  Platform
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

export default function ApplicationListScreen({ route, navigation }) {
  const { colors, isDark } = useContext(ThemeContext);

  const [allApplications, setAllApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
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

  useEffect(() => {
    if (route.params?.filter) {
      setActiveFilter(route.params.filter);
      navigation.setParams({ filter: undefined });
    }
  }, [route.params?.filter]);

  useEffect(() => {
    let result = [...allApplications];

    if (activeFilter !== 'All') {
      result = result.filter(app => app.status === activeFilter);
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        app => 
          app.companyName.toLowerCase().includes(query) || 
          app.role.toLowerCase().includes(query)
      );
    }

    setFilteredApplications(result);
  }, [allApplications, activeFilter, searchQuery]);

  const handleQuickStatusUpdate = async (id, newStatus) => {
    try {
      await applicationService.update(id, { status: newStatus });
      const updatedList = await applicationService.getAll();
      setAllApplications(updatedList || []);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update status.');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveFilter('All');
  };

  const renderFilterItem = (filterName) => {
    const isActive = activeFilter === filterName;
    return (
      <TouchableOpacity
        key={filterName}
        style={[
          styles.filterBadge,
          { backgroundColor: colors.cardBg, borderColor: colors.border },
          isActive && { borderColor: colors.cyan, backgroundColor: colors.cyan + '18' },
        ]}
        onPress={() => setActiveFilter(filterName)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.filterBadgeText,
          { color: colors.textSecondary },
          isActive && { color: colors.cyan, fontWeight: '700' }
        ]}>
          {filterName}
        </Text>
      </TouchableOpacity>
    );
  };

  const isTotalDatabaseEmpty = allApplications.length === 0;

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
        </View>

        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
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

        {/* Horizontal Filters */}
        <View style={styles.filtersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
          >
            {renderFilterItem('All')}
            {STATUS_LIST.map((status) => renderFilterItem(status))}
          </ScrollView>
        </View>

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
            renderItem={({ item }) => (
              <ApplicationCard
                application={{
                  ...item,
                  id: item.id || item._id,
                  platform: item.platform || item.platformAppliedFrom,
                }}
                onPress={() => navigation.navigate('ApplicationDetails', { id: item.id || item._id })}
                onStatusUpdate={handleQuickStatusUpdate}
                onDeleteRefresh={loadApplications}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={loadApplications}
            refreshing={isLoading}
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
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No matches found</Text>
                  <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                    No applications found for {activeFilter !== 'All' ? activeFilter : 'this search'}.
                  </Text>
                  <TouchableOpacity 
                    style={[styles.emptyButton, { backgroundColor: colors.cyan + '12', borderColor: colors.cyan + '40' }]}
                    onPress={resetFilters}
                  >
                    <Text style={{ color: colors.cyan, fontWeight: '700' }}>Clear Filters</Text>
                  </TouchableOpacity>
                </View>
              )
            }
          />
        )}
      </LinearGradient>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
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
  filtersWrapper: {
    marginVertical: 14,
  },
  filtersScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
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
});
