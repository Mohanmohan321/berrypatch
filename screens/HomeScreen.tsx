import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Platform,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

/* ── Assets ──────────────────────────────────────────────────────── */
const logo = require('../assets/logo.png');
const heroImg    = require('../assets/real-farm.jpg');
const heroImg2   = require('../assets/real-farm2.jpg');
const berriesImg = require('../assets/real-berries.jpg');
const whatsappIcon = require('../assets/whatsapp-icon.jpg');
const instagramIcon = require('../assets/instagram-icon.jpg');


const TOTAL_CARDS = 3;

/* ── Berry colour palette (same as web) ─────────────────────────── */
const C = {
  red:   '#d32e25',
  green: '#739657',
  dark:  '#1E1A2E',
  muted: '#6B6868',
  amber: '#C18C5D',
  border:'rgba(217,58,76,0.20)',
  bg:    'rgba(217,58,76,0.06)',
};

/* ── Font helpers (Georgia on iOS = same as web) ────────────────── */
const SERIF  = Platform.OS === 'ios' ? 'Georgia'        : 'serif';
const SANS   = Platform.OS === 'ios' ? 'System'         : 'sans-serif';

/* ── Scroll hint ─────────────────────────────────────────────────── */
const ScrollHint = ({ text, color = 'rgba(26,34,51,0.85)' }: { text?: string; color?: string }) => (
  <View style={[sty.scrollHint, { pointerEvents: 'none' as any }]}>
    {text ? (
      <Text style={{ fontSize: 10, color, letterSpacing: 2, textTransform: 'uppercase', fontFamily: SANS }}>
        {text}
      </Text>
    ) : null}
    <Text style={{ fontSize: 22, color, lineHeight: 22 }}>⌄</Text>
  </View>
);

/* ── Image carousel ──────────────────────────────────────────────── */
const ImageCarousel = ({ containerWidth }: { containerWidth: number }) => {
  const images = [heroImg, heroImg2, berriesImg];
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const imgW = containerWidth;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / imgW);
    if (idx !== activeRef.current) {
      activeRef.current = idx;
      setActive(idx);
    }
  };

  const goTo = (i: number) => {
    activeRef.current = i;
    setActive(i);
    scrollRef.current?.scrollTo({ x: i * imgW, animated: true });
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={onScroll}
        onScrollEndDrag={onScroll}
        style={{ borderRadius: 16, height: 260 }}
        contentContainerStyle={{ width: imgW * images.length }}
      >
        {images.map((src, i) => (
          <Image
            key={i}
            source={src}
            style={{ width: imgW, height: 260, borderRadius: 16 }}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      {/* Dot indicators */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 8 }}>
        {images.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => goTo(i)}
            style={{
              width: active === i ? 20 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: active === i ? C.green : 'rgba(0, 105, 9, 0.25)',
            }}
          />
        ))}
      </View>
    </View>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { height: SCREEN_H, width: SCREEN_W } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [activeCard, setActiveCard] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const isAnimating = useRef(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => setIsLoading(false));
    }, 3400);
    return () => clearTimeout(fadeTimer);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const scrollTimer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: SCREEN_H, animated: true });
      setActiveCard(1);
    }, 1500);
    return () => clearTimeout(scrollTimer);
  }, [isLoading, SCREEN_H]);

  // Width of content column (mirror web's maxWidth: 480)
  const colW = Math.min(SCREEN_W, 480);
  // Inner padding left/right matches px-6 (24px each side)
  const innerW = colW - 48;

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_CARDS - 1, index));
    if (clamped === activeCard || isAnimating.current) return;
    isAnimating.current = true;
    scrollRef.current?.scrollTo({ y: clamped * SCREEN_H, animated: true });
    setActiveCard(clamped);
    setTimeout(() => { isAnimating.current = false; }, 600);
  }, [activeCard, SCREEN_H]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / SCREEN_H);
    setActiveCard(idx);
  };

  if (isLoading) {
    return (
      <Animated.View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', opacity: splashOpacity }}>
        <Image source={logo} style={{ width: 260, height: 260 }} resizeMode="contain" />
      </Animated.View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center' }}>
      <View style={{ width: colW, flex: 1, position: 'relative' }}>

        <ScrollView
          ref={scrollRef}
          pagingEnabled
          disableIntervalMomentum={true}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          decelerationRate="normal"
          onMomentumScrollEnd={onScrollEnd}
          style={{ flex: 1 }}
        >
          {/* ══ CARD 1 ─ Logo ══════════════════════════════════════ */}
          <View style={[sty.card, { height: SCREEN_H, justifyContent: 'center', alignItems: 'center',
            paddingHorizontal: 32, paddingTop: insets.top }]}>
            <Image
              source={logo}
              style={{ width: Math.min(colW * 0.98, colW - 8), height: 360 }}
              resizeMode="contain"
            />
            <ScrollHint text="Scroll Down" color="rgba(26,34,51,0.85)" />
          </View>

          {/* ══ CARD 2 ─ Our Strawberries ══════════════════════════ */}
          <View style={[sty.card, { height: SCREEN_H }]}>
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: insets.top + 12, paddingBottom: 24, justifyContent: 'center' }}>

              {/* Eyebrow */}
              <Text style={{ textAlign: 'center', marginBottom: 6, fontSize: 22,
                color: '#C0152A', letterSpacing: 3.1, textTransform: 'uppercase',
                fontWeight: '700', fontFamily: SANS }}>
                Strawberries
              </Text>

              {/* Heading */}
              <Text style={{ textAlign: 'center', marginBottom: 12, fontSize: 20,
                fontWeight: '700', color: '#3a4f73', fontFamily: SERIF }}>
                Our Story
              </Text>

              {/* Pull quote */}
              <View style={{ marginBottom: 12, paddingVertical: 10, paddingRight: 14,
                paddingLeft: 14, borderLeftWidth: 3, borderLeftColor: C.amber,
                backgroundColor: 'rgba(193,140,93,0.05)', borderRadius: 10,
                borderTopRightRadius: 10, borderBottomRightRadius: 10 }}>
                <Text style={{ fontStyle: 'italic', fontWeight: '600', color: C.dark,
                  lineHeight: 22, fontSize: 15, fontFamily: SANS }}>
                  In the quiet hills of Kodaikanal, The Berry Patch began with a simple
                  idea — to grow strawberries the right way.
                </Text>
              </View>

              {/* Body */}
              <Text style={{ fontSize: 14, color: C.muted, lineHeight: 22,
                marginBottom: 8, fontFamily: SANS }}>
                We work with local farmers — no shortcuts, no chemicals. Grown organically
                in Kodaikanal's cool hills, just as nature intended.
              </Text>
              <Text style={{ fontSize: 14, color: C.muted, lineHeight: 22,
                marginBottom: 10, fontFamily: SANS }}>
                We chose the{' '}
                <Text style={{ color: C.dark, fontWeight: '700' }}>Camarosa variety</Text>
                {' '}— handpicked and lab-tested by{' '}
                <Text style={{ color: C.green, fontWeight: '700' }}>ICAR-IIHR Bangalore</Text>
                {' '}with zero pesticide residue across 130+ compounds.
              </Text>

              {/* Carousel */}
              <ImageCarousel containerWidth={innerW} />

              {/* CTA: Our Process */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Process')}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 8, width: '100%', marginTop: 12, backgroundColor: C.green,
                  borderRadius: 14, paddingVertical: 14,
                  shadowColor: C.green, shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.38, shadowRadius: 10, elevation: 6 }}
                activeOpacity={0.88}
              >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700',
                  letterSpacing: 0.6, fontFamily: SANS }}>
                  OUR PROCESS
                </Text>
                <Text style={{ color: 'white', fontSize: 17 }}>→</Text>
              </TouchableOpacity>
            </View>
            <ScrollHint />
          </View>

          {/* ══ CARD 3 ─ Strawberry Preserve ══════════════════════ */}
          <View style={[sty.card, { height: SCREEN_H, alignItems: 'center',
            paddingHorizontal: 32 }]}>

            {/* All content in one centred block */}
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10,
              paddingTop: insets.top }}>
              <View style={{ backgroundColor: C.red, borderRadius: 99,
                paddingHorizontal: 24, paddingVertical: 10,
                shadowColor: C.red, shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.45, shadowRadius: 8, elevation: 5 }}>
                <Text style={{ fontSize: 24, color: '#fff', letterSpacing: 3.5,
                  textTransform: 'uppercase', fontWeight: '800', fontFamily: SANS }}>
                  Coming Soon
                </Text>
              </View>
              <Text style={{ textAlign: 'center', fontSize: 48, fontWeight: '900',
                color: C.dark, lineHeight: 56, fontFamily: SERIF }}>
                Strawberry{'\n'}Preserve
              </Text>
              <Text style={{ textAlign: 'center', maxWidth: 300, fontSize: 16,
                color: C.muted, lineHeight: 26, fontFamily: SANS }}>
                Small-batch, handmade preserves from our organic harvest.
                No preservatives. Pure fruit.
              </Text>
            </View>

            <ScrollHint />
          </View>

          {/* ══ CARD 4 ─ Contact ════════════════════════════════════ */}
          <View style={[sty.card, { height: SCREEN_H }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 22,
                paddingTop: insets.top , paddingBottom: insets.bottom ,
                flexGrow: 1, justifyContent: 'center' }}
            >
              {/* Page title */}
              <Text style={{ textAlign: 'center', fontSize: 30, fontWeight: '800',
                color: '#3a4f73', letterSpacing: 2.5, textTransform: 'uppercase',
                fontFamily: SERIF, marginBottom: 4 }}>
                Get In Touch
              </Text>
              <Text style={{ textAlign: 'center', fontSize: 16, color: C.muted,
                fontFamily: SANS, marginBottom: 22, lineHeight: 24 }}>
                Order fresh strawberries or just say hello.
              </Text>

              {/* Social cards */}
              {([
                { href: 'https://wa.me/919176540077',         icon: whatsappIcon,  label: 'WhatsApp',
                  sub: 'Chat with us to place an order', shadowColor: 'rgba(37,211,102,0.22)',
                  accent: '#25D366', iconSize: 56 },
                { href: 'https://www.instagram.com/theberrypatch.organic?igsh=MTNocDgzdzF5ZWJnaA==', icon: instagramIcon, label: 'Instagram',
                  sub: 'Follow our farm journey & updates', shadowColor: 'rgba(193,50,50,0.18)',
                  accent: C.red, iconSize: 76 },
              ] as const).map(({ href, icon, label, sub, shadowColor, accent, iconSize }) => (
                <TouchableOpacity
                  key={label}
                  onPress={() => Linking.openURL(href)}
                  activeOpacity={0.88}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 20,
                    padding: 26, backgroundColor: 'white', marginBottom: 18,
                    borderWidth: 1, borderColor: 'rgba(220,215,208,0.8)',
                    borderRadius: 24,
                    shadowColor, shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.28, shadowRadius: 14, elevation: 6 }}
                >
                  <View style={{ width: 76, height: 76, justifyContent: 'center', alignItems: 'center' }}>
                    <Image source={icon}
                      style={{ width: iconSize, height: iconSize, borderRadius: iconSize / 2 }}
                      resizeMode="cover" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: C.dark,
                      fontFamily: SERIF, marginBottom: 5 }}>{label}</Text>
                    <Text style={{ fontSize: 16, color: C.muted,
                      fontFamily: SANS, lineHeight: 22 }}>{sub}</Text>
                  </View>
                  <Text style={{ fontSize: 26, color: accent }}>→</Text>
                </TouchableOpacity>
              ))}

              {/* Logo at bottom */}
              <View style={{ alignItems: 'center' }}>
                <Image source={logo} style={{ width: colW - 16, height: 280 }} resizeMode="contain" />
              </View>

              {/* Copyright */}
              <Text style={{ textAlign: 'center', fontSize: 12,
                color: C.muted, opacity: 0.5, letterSpacing: 3.5,
                textTransform: 'uppercase', fontFamily: SANS, marginBottom: 8 }}>
                © The Berry Patch • Kodaikanal
              </Text>
            </ScrollView>
          </View>
        </ScrollView>

      </View>
    </View>
  );
}

/* ── Dot Navigation ──────────────────────────────────────────────── */
const DotNav = ({
  total, active, color, inactiveColor, onPress, screenH,
}: {
  total: number; active: number; color: string; inactiveColor: string;
  onPress: (i: number) => void; screenH: number;
}) => {
  // Each dot: 10px or 26px height + 10px gap. Total ≈ (total * 10) + ((total-1) * 10) + 16 extra
  const dotTotalH = total * 10 + (total - 1) * 10;
  const topOffset = (screenH - dotTotalH) / 2;

  return (
    <View style={{
      position: 'absolute', right: 12, top: topOffset,
      gap: 10, zIndex: 9999,
    }}>
      {Array.from({ length: total }).map((_, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onPress(i)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            width: 10,
            height: active === i ? 26 : 10,
            borderRadius: 5,
            backgroundColor: active === i ? color : inactiveColor,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.12,
            shadowRadius: 2,
            elevation: 1,
          }}
        />
      ))}
    </View>
  );
};

const sty = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  scrollHint: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 2,
  },
});
