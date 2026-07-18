import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TUTORIAL_DATA } from '../../constants';
import { Colors } from '../../constants/Colors';
import { useTheme, type ThemeColors } from '../../theme';
import EkoButton from '../../components/common/EkoButton';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/useTranslation';

const { width, height } = Dimensions.get('window');

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const tutorialIcons = ['stethoscope', 'calendar-check-o', 'heartbeat'];

export default function TutorialScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { completeOnboarding } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const goToLogin = () => {
    completeOnboarding();
    navigation.replace('Login');
  };

  const goNext = () => {
    if (currentIndex < TUTORIAL_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      goToLogin();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  };

  const skip = () => goToLogin();

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  });

  const renderItem = ({ item, index }: { item: typeof TUTORIAL_DATA[0]; index: number }) => (
    <View style={[styles.slide, { backgroundColor: item.color }]}>
      <LinearGradient
        colors={[item.color, Colors.bgLight]}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.iconWrapper}>
        <View style={styles.iconCircle}>
          <FontAwesome
            name={(tutorialIcons[index] || 'star') as any}
            size={80}
            color={Colors.primary}
          />
        </View>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{t(`tutorial.slide${index + 1}Title`)}</Text>
        <Text style={styles.subtitle}>{t(`tutorial.slide${index + 1}Subtitle`)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <TouchableOpacity style={styles.skipBtn} onPress={skip} accessibilityRole="button" accessibilityLabel={t('tutorial.skip')}>
        <Text style={styles.skipText}>{t('tutorial.skip')}</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={TUTORIAL_DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        scrollEnabled
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {TUTORIAL_DATA.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.navButtons}>
          {currentIndex > 0 ? (
            <TouchableOpacity style={styles.prevBtn} onPress={goPrev} accessibilityRole="button" accessibilityLabel={t('tutorial.previous')}>
              <FontAwesome name="chevron-left" size={16} color={Colors.primary} />
              <Text style={styles.prevText}>{t('tutorial.previous')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.prevBtn} />
          )}

          <EkoButton
            title={currentIndex === TUTORIAL_DATA.length - 1 ? t('tutorial.getStarted') : t('tutorial.next')}
            onPress={goNext}
            style={styles.nextBtn}
          />
        </View>
      </View>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  skipBtn: {
    position: 'absolute',
    top: 52,
    right: 24,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  slide: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  iconWrapper: {
    marginBottom: 48,
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  textBlock: {
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 180,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.bgGray,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 100,
  },
  prevText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  nextBtn: {
    flex: 1,
    marginLeft: 12,
  },
});
