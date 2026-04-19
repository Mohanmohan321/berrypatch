import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAGE_H = Dimensions.get('window').height;
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

/* ── Assets ──────────────────────────────────────────────────────── */
const logo          = require('../assets/logo.png');
const heroImg       = require('../assets/real-farm.jpg');
const heroImg2      = require('../assets/real-farm2.jpg');
const berriesImg    = require('../assets/real-berries.jpg');
const whatsappIcon  = require('../assets/whatsapp-icon.jpg');
const instagramIcon = require('../assets/instagram-icon.jpg');

/* ── Berry colour palette ────────────────────────────────────────── */
const C = {
  red:    '#d32e25',
  green:  '#739657',
  dark:   '#1E1A2E',
  muted:  '#6B6868',
  amber:  '#C18C5D',
  border: 'rgba(217,58,76,0.20)',
  bg:     'rgba(217,58,76,0.06)',
};

const SERIF = Platform.OS === 'ios' ? 'Georgia'  : 'serif';
const SANS  = Platform.OS === 'ios' ? 'System'   : 'sans-serif';

/* ── Scroll hint ─────────────────────────────────────────────────── */
const ScrollHint = ({ text, color = 'rgba(26,34,51,0.85)' }: { text?: string; color?: string }) => {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[sty.scrollHint, { bottom: bottom + 16, pointerEvents: 'none' as any }]}>
      {text ? (
        <Text style={{ fontSize: 10, color, letterSpacing: 2, textTransform: 'uppercase', fontFamily: SANS }}>
          {text}
        </Text>
      ) : null}
      <Text style={{ fontSize: 22, color, lineHeight: 22 }}>⌄</Text>
    </View>
  );
};

/* ── Image carousel ──────────────────────────────────────────────── */
const ImageCarousel = ({ containerWidth }: { containerWidth: number }) => {
  const images = [heroImg, heroImg2, berriesImg];
  const [active, setActive] = React.useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const imgW = containerWidth;

  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(images.length - 1, i));
    setActive(next);
    scrollRef.current?.scrollTo({ x: next * imgW, animated: true });
  };

  const syncDot = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / imgW);
    setActive(idx);
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        disableIntervalMomentum={true}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
        directionalLockEnabled={true}
        onScroll={syncDot}
        onScrollEndDrag={syncDot}
        onMomentumScrollEnd={syncDot}
        style={{ borderRadius: 16, height: 260 }}
        contentContainerStyle={{ width: imgW * images.length }}
      >
        {images.map((src, i) => (
          <Image key={i} source={src} style={{ width: imgW, height: 260, borderRadius: 16 }} resizeMode="cover" />
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 8 }}>
        {images.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => goTo(i)}
            style={{
              width: active === i ? 20 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: active === i ? C.green : 'rgba(0,105,9,0.25)',
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
  const { width: SCREEN_W } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);
  const currentPage = useRef(0);
  const isScrollingRef = useRef(false);
  const [webPage, setWebPage] = React.useState(0);
  const setWebPageRef = useRef(setWebPage);

  const colW  = Math.min(SCREEN_W, 480);
  const innerW = colW - 48;

  /* ── Track true viewport height (mobile browser chrome aware) ─── */
  const [vh, setVh] = React.useState(
    Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerHeight : PAGE_H
  );
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const update = () => {
      const h = (window as any).visualViewport?.height ?? window.innerHeight;
      setVh(h);
    };
    const vp = (window as any).visualViewport;
    if (vp) { vp.addEventListener('resize', update); return () => vp.removeEventListener('resize', update); }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const cardH = Platform.OS === 'web' ? vh : PAGE_H;

  /* ── Auto-scroll card 1 → card 2 after 1.5 s ─────────────────── */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Platform.OS === 'web') {
        currentPage.current = 1;
        setWebPageRef.current(1);
        return;
      }
      flatRef.current?.scrollToIndex({ index: 1, animated: true });
      currentPage.current = 1;
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  /* ── One-page-per-scroll on web ─────────────────────────────── */
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const TOTAL = 4;

    let wheelAcc = 0;
    let wheelTimer: any = null;

    const goPage = (next: number) => {
      const p = Math.max(0, Math.min(TOTAL - 1, next));
      if (p === currentPage.current || isScrollingRef.current) return;
      isScrollingRef.current = true;
      currentPage.current = p;
      setWebPageRef.current(p);
      setTimeout(() => {
        isScrollingRef.current = false;
        wheelAcc = 0; // flush any residual momentum that built up during the lock
      }, 900);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isScrollingRef.current) return;
      wheelAcc += e.deltaY;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => { wheelAcc = 0; }, 80);
      if (Math.abs(wheelAcc) >= 50) {
        const dir = wheelAcc > 0 ? 1 : -1;
        wheelAcc = 0;
        clearTimeout(wheelTimer);
        goPage(currentPage.current + dir);
      }
    };

    let ty = 0;
    const handleTouchStart = (e: TouchEvent) => { ty = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      const dy = ty - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 60) return;
      goPage(currentPage.current + (dy > 0 ? 1 : -1));
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  /* ── Render each card lazily ─────────────────────────────────── */
  const renderCard = useCallback(({ item: idx }: { item: number }) => {
    /* ── CARD 1 ─ Logo ─────────────────────────────────────────── */
    if (idx === 0) return (
      <View style={[sty.card, { height: cardH, justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 32, paddingTop: insets.top }]}>
        <Image source={logo} style={{ width: Math.min(colW * 0.98, colW - 8), height: 360 }} resizeMode="contain" />
        <ScrollHint text="Scroll Down" color="rgba(26,34,51,0.85)" />
      </View>
    );

    /* ── CARD 2 ─ Our Strawberries ─────────────────────────────── */
    if (idx === 1) return (
      <View style={[sty.card, { height: cardH }]}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 72, justifyContent: 'center' }}>
          <Text style={{ textAlign: 'center', marginBottom: 6, fontSize: 22,
            color: '#C0152A', letterSpacing: 3.1, textTransform: 'uppercase',
            fontWeight: '700', fontFamily: SERIF }}>
            Strawberries
          </Text>
          <Text style={{ textAlign: 'center', marginBottom: 12, fontSize: 20,
            fontWeight: '700', color: '#3a4f73', fontFamily: SERIF }}>
            Our Story
          </Text>
          <View style={{ marginBottom: 12, paddingVertical: 10, paddingHorizontal: 14,
            borderLeftWidth: 3, borderLeftColor: C.amber,
            backgroundColor: 'rgba(193,140,93,0.05)', borderRadius: 10 }}>
            <Text style={{ fontStyle: 'italic', fontWeight: '600', color: C.dark,
              lineHeight: 22, fontSize: 15, fontFamily: SANS }}>
              In the quiet hills of Kodaikanal, The Berry Patch began with a simple idea — to grow strawberries the right way.
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: C.muted, lineHeight: 22, marginBottom: 8, fontFamily: SANS }}>
            We work with local farmers — no shortcuts, no chemicals. Grown organically in Kodaikanal's cool hills, just as nature intended.
          </Text>
          <Text style={{ fontSize: 14, color: C.muted, lineHeight: 22, marginBottom: 10, fontFamily: SANS }}>
            We chose the{' '}
            <Text style={{ color: C.dark, fontWeight: '700' }}>Camarosa variety</Text>
            {' '}— handpicked and lab-tested by{' '}
            <Text style={{ color: C.green, fontWeight: '700' }}>ICAR-IIHR Bangalore</Text>
            {' '}with zero pesticide residue across 130+ compounds.
          </Text>
          <ImageCarousel containerWidth={innerW} />
          <TouchableOpacity
            onPress={() => navigation.navigate('Process')}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 8, width: '100%', marginTop: 12, backgroundColor: C.green,
              borderRadius: 14, paddingVertical: 14,
              shadowColor: C.green, shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.38, shadowRadius: 10, elevation: 6 }}
            activeOpacity={0.88}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700', letterSpacing: 0.6, fontFamily: SANS }}>
              OUR PROCESS
            </Text>
            <Text style={{ color: 'white', fontSize: 17 }}>→</Text>
          </TouchableOpacity>
        </View>
        <ScrollHint />
      </View>
    );

    /* ── CARD 3 ─ Strawberry Preserve ──────────────────────────── */
    if (idx === 2) return (
      <View style={[sty.card, { height: cardH, alignItems: 'center', paddingHorizontal: 32 }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingTop: insets.top }}>
          <View style={{ backgroundColor: C.red, borderRadius: 99, paddingHorizontal: 24, paddingVertical: 10,
            shadowColor: C.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 8, elevation: 5 }}>
            <Text style={{ fontSize: 24, color: '#fff', letterSpacing: 3.5, textTransform: 'uppercase', fontWeight: '800', fontFamily: SANS }}>
              Coming Soon
            </Text>
          </View>
          <Text style={{ textAlign: 'center', fontSize: 48, fontWeight: '900', color: C.dark, lineHeight: 56, fontFamily: SERIF }}>
            Strawberry{'\n'}Preserve
          </Text>
          <Text style={{ textAlign: 'center', maxWidth: 300, fontSize: 16, color: C.muted, lineHeight: 26, fontFamily: SANS }}>
            Small-batch, handmade preserves from our organic harvest. No preservatives. Pure fruit.
          </Text>
        </View>
        <ScrollHint />
      </View>
    );

    /* ── CARD 4 ─ Contact ───────────────────────────────────────── */
    return (
      <View style={[sty.card, { height: cardH }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          contentContainerStyle={{ paddingHorizontal: 22, paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24, flexGrow: 1, justifyContent: 'center' }}
        >
          <Text style={{ textAlign: 'center', fontSize: 30, fontWeight: '800',
            color: '#3a4f73', letterSpacing: 2.5, textTransform: 'uppercase',
            fontFamily: SERIF, marginBottom: 4 }}>
            Get In Touch
          </Text>
          <Text style={{ textAlign: 'center', fontSize: 16, color: C.muted, fontFamily: SANS, marginBottom: 22, lineHeight: 24 }}>
            Order fresh strawberries or just say hello.
          </Text>
          {([
            { href: 'https://wa.me/919176540077', icon: whatsappIcon, label: 'WhatsApp',
              sub: 'Chat with us to place an order', shadowColor: 'rgba(37,211,102,0.22)', accent: '#25D366', iconSize: 56 },
            { href: 'https://www.instagram.com/theberrypatch.organic?igsh=MTNocDgzdzF5ZWJnaA==', icon: instagramIcon, label: 'Instagram',
              sub: 'Follow our farm journey & updates', shadowColor: 'rgba(193,50,50,0.18)', accent: C.red, iconSize: 76 },
          ] as const).map(({ href, icon, label, sub, shadowColor, accent, iconSize }) => (
            <TouchableOpacity
              key={label}
              onPress={() => Linking.openURL(href)}
              activeOpacity={0.88}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 20,
                padding: 26, backgroundColor: 'white', marginBottom: 18,
                borderWidth: 1, borderColor: 'rgba(220,215,208,0.8)', borderRadius: 24,
                shadowColor, shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.28, shadowRadius: 14, elevation: 6 }}
            >
              <View style={{ width: 76, height: 76, justifyContent: 'center', alignItems: 'center' }}>
                <Image source={icon} style={{ width: iconSize, height: iconSize, borderRadius: iconSize / 2 }} resizeMode="cover" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: C.dark, fontFamily: SERIF, marginBottom: 5 }}>{label}</Text>
                <Text style={{ fontSize: 16, color: C.muted, fontFamily: SANS, lineHeight: 22 }}>{sub}</Text>
              </View>
              <Text style={{ fontSize: 26, color: accent }}>→</Text>
            </TouchableOpacity>
          ))}
          <View style={{ alignItems: 'center' }}>
            <Image source={logo} style={{ width: colW - 16, height: 280 }} resizeMode="contain" />
          </View>
          <Text style={{ textAlign: 'center', fontSize: 12, color: C.muted, opacity: 0.5,
            letterSpacing: 3.5, textTransform: 'uppercase', fontFamily: SANS, marginBottom: 8 }}>
            © The Berry Patch • Kodaikanal
          </Text>
        </ScrollView>
      </View>
    );
  }, [insets, colW, innerW, navigation, cardH]);

  /* ── Web: reels-style CSS transform slide ───────────────────── */
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', overflow: 'hidden' as any }}>
        <View style={{ width: colW, flex: 1, overflow: 'hidden' as any }}>
          <View style={{
            transform: [{ translateY: -webPage * vh }],
            transitionProperty: 'transform',
            transitionDuration: '420ms',
            transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          } as any}>
            {[0, 1, 2, 3].map((idx) => renderCard({ item: idx }))}
          </View>
        </View>
      </View>
    );
  }

  /* ── Native: FlatList with snapToInterval ───────────────────── */
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center' }}>
      <View style={{ width: colW, flex: 1, position: 'relative' }}>
        <FlatList
          ref={flatRef}
          data={[0, 1, 2, 3]}
          keyExtractor={(item) => String(item)}
          renderItem={renderCard}
          pagingEnabled={true}
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          bounces={false}
          overScrollMode="never"
          getItemLayout={(_, index) => ({ length: PAGE_H, offset: PAGE_H * index, index })}
          removeClippedSubviews={false}
          maxToRenderPerBatch={2}
          windowSize={3}
          initialNumToRender={2}
          onMomentumScrollEnd={(e) => {
            currentPage.current = Math.round(e.nativeEvent.contentOffset.y / PAGE_H);
          }}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const sty = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  scrollHint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 2,
  },
});
