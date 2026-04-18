import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';


/* ── Grey-blue palette ───────────────────────────────────────────── */
const B = {
  primary: '#435677',
  light:   '#7A95B5',
  amber:   '#C18C5D',
  dark:    '#1A2233',
  muted:   '#6B7585',
  border:  'rgba(67,86,119,0.22)',
  bg:      'rgba(67,86,119,0.07)',
};

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const SANS  = Platform.OS === 'ios' ? 'System'  : 'sans-serif';

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

/* ── Data ────────────────────────────────────────────────────────── */
const steps = [
  { emoji: '🌱', accent: B.primary, label: 'Organically Grown',  desc: "Camarosa variety cultivated in Kodaikanal's cool climate with zero synthetic inputs." },
  { emoji: '✋', accent: '#739657', label: 'Hand-Harvested',      desc: 'Each berry is hand picked — never machine-harvested.' },
  { emoji: '📦', accent: B.primary, label: 'Inspected & Sorted',  desc: 'Every batch is visually inspected and sorted for size, colour, and quality.' },
  { emoji: '🚚', accent: '#739657', label: 'Delivered in 24 hrs', desc: 'Packed in food-grade boxes and dispatched the same day — farm fresh at your door.' },
];

const labResults = [
  { label: 'Pesticide Residue', note: 'Below limit of quantification', highlight: '"Effectively zero"' },
  { label: 'LCMS-MS Panel',     note: '70plus Compounds Tested',       highlight: 'None Detected - All Clear' },
  { label: 'GCMS-MS Panel',     note: '60plus Compounds Tested',       highlight: 'None Detected - All Clear' },
  { label: 'Test Method',       note: 'ICAR-IIHR accredited protocol', highlight: null },
];

const promise = [
  { emoji: '🌱',  image: null,                                        stat: 'Organically\nGrown', label: 'No Chemicals',  desc: 'No pesticides, herbicides, or synthetic fertilisers.' },
  { emoji: null,  image: require('../assets/ICAR.png') as number,     stat: 'ICAR',               label: 'Certified',     desc: 'Farming practices validated by ICAR-recommended guidelines.' },
  { emoji: '🍃',  image: null,                                        stat: '24 hr',              label: 'Farm to Table', desc: 'Shortest possible supply chain — no middlemen.' },
];

/* ── Back button ─────────────────────────────────────────────────── */
const BackBtn = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={{ flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: B.border,
      borderRadius: 99, paddingVertical: 4, paddingHorizontal: 18, alignSelf: 'flex-start' }}
  >
    <Text style={{ fontSize: 15 }}>←</Text>
    <Text style={{ fontSize: 13, color: B.primary, fontWeight: '700', fontFamily: SANS }}>
      Back
    </Text>
  </TouchableOpacity>
);

/* ── PDF.js single-page HTML builder ─────────────────────────────── */
const buildPdfHtml = (pdfUri: string, pageNumber: number) => `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport"
        content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"><\/script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;overflow:hidden;background:#f0f0f0}
    #wrap{
      width:100%;height:100%;
      overflow:hidden;
      touch-action:none;
      display:flex;justify-content:center;align-items:center;
    }
    #cw{
      display:inline-block;
      transform-origin:center center;
      transition:transform 0.05s linear;
    }
    canvas{display:block;box-shadow:0 2px 10px rgba(0,0,0,0.18);}
    #msg{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
         font:14px sans-serif;color:#777;}
  </style>
</head>
<body>
  <div id="wrap">
    <span id="msg">Loading…</span>
    <div id="cw"><canvas id="c"></canvas></div>
  </div>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    fetch('${pdfUri}')
      .then(function(r){ return r.arrayBuffer(); })
      .then(function(buf){ return pdfjsLib.getDocument({data:buf}).promise; })
      .then(function(doc){ return doc.getPage(${pageNumber}); })
      .then(function(page){
        var wrap = document.getElementById('wrap');
        var dpr  = window.devicePixelRatio || 1;
        var w    = wrap.clientWidth || window.innerWidth;
        var vp1  = page.getViewport({scale:1});
        var scale = w / vp1.width;
        var vp   = page.getViewport({scale: scale * dpr});
        var canvas = document.getElementById('c');
        canvas.width  = vp.width;
        canvas.height = vp.height;
        canvas.style.width  = (vp.width  / dpr) + 'px';
        canvas.style.height = (vp.height / dpr) + 'px';
        document.getElementById('msg').style.display = 'none';
        return page.render({canvasContext: canvas.getContext('2d'), viewport: vp}).promise;
      })
      .catch(function(){ document.getElementById('msg').textContent = 'Could not load PDF'; });

    var cw = document.getElementById('cw');
    var wrap = document.getElementById('wrap');
    var lastScale = 1, currentScale = 1, startDist = 0;

    function dist(t){
      var dx = t[0].clientX - t[1].clientX;
      var dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx*dx + dy*dy);
    }

    wrap.addEventListener('touchstart', function(e){
      if(e.touches.length === 2){ startDist = dist(e.touches); }
    }, {passive:true});

    wrap.addEventListener('touchmove', function(e){
      if(e.touches.length === 2){
        e.preventDefault();
        var s = lastScale * (dist(e.touches) / startDist);
        currentScale = Math.min(Math.max(s, 1), 5);
        cw.style.transform = 'scale(' + currentScale + ')';
      }
    }, {passive:false});

    wrap.addEventListener('touchend', function(e){
      if(e.touches.length < 2){ lastScale = currentScale; }
    }, {passive:true});

    wrap.addEventListener('wheel', function(e){
      if(e.ctrlKey){
        e.preventDefault();
        currentScale = Math.min(Math.max(currentScale - e.deltaY * 0.005, 1), 5);
        lastScale = currentScale;
        cw.style.transform = 'scale(' + currentScale + ')';
      }
    }, {passive:false});
  <\/script>
</body>
</html>`;

/* ── PDF card ────────────────────────────────────────────────────── */
const PdfCard = ({ pageNumber, pdfUri }: { pageNumber: number; pdfUri: string | null }) => {
  if (!pdfUri) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 32 }}>🧪</Text>
        <Text style={{ fontSize: 14, color: B.muted, fontFamily: SANS }}>Loading…</Text>
      </View>
    );
  }

  const html = buildPdfHtml(pdfUri, pageNumber);

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, overflow: 'hidden' as any }}>
        {React.createElement('iframe', {
          srcDoc: html,
          title: `Lab Report Page ${pageNumber}`,
          style: { width: '100%', height: '100%', border: 'none', display: 'block' },
        })}
      </View>
    );
  }

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      style={{ flex: 1 }}
      scrollEnabled={true}
      pinchGestureEnabled={true}
      scalesPageToFit={false}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      nestedScrollEnabled={true}
      javaScriptEnabled={true}
      allowFileAccess={true}
      allowUniversalAccessFromFileURLs={true}
    />
  );
};

/* ═══════════════════════════════════════════════════════════════════ */

type Props = NativeStackScreenProps<RootStackParamList, 'Process'>;

export default function ProcessScreen({ navigation }: Props) {
  const { height: SCREEN_H, width: SCREEN_W } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);
  const currentPage = useRef(0);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  const colW = Math.min(SCREEN_W, 480);

  useEffect(() => {
    Asset.loadAsync(require('../assets/lab-report.pdf')).then(([asset]) => {
      setPdfUri(asset.localUri ?? null);
    }).catch(() => {});
  }, []);

  const goBackToStory = () => navigation.goBack();

  const renderCard = useCallback(({ item: idx }: { item: number }) => {

    /* ── CARD 1 ─ From Farm to Table ──────────────────────────────── */
    if (idx === 0) return (
      <View style={[sty.card, { height: SCREEN_H }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20,
            paddingTop: insets.top + 16, paddingBottom: insets.bottom,
            alignItems: 'center' }}
        >
          <View style={{ width: '100%', alignItems: 'flex-start', marginBottom: 28 }}>
            <BackBtn onPress={goBackToStory} />
          </View>

          <Text style={{ textAlign: 'center', marginBottom: 14, fontSize: 18,
            color: '#C0152A', letterSpacing: 5, textTransform: 'uppercase',
            fontFamily: SERIF, fontWeight: '600' }}>
            Behind the scenes
          </Text>
          <Text style={{ textAlign: 'center', marginBottom: 14, fontSize: 20,
            fontWeight: '800', color: B.dark, lineHeight: 34, fontFamily: SERIF }}>
            From Farm to Table
          </Text>

          <View style={{ width: '100%', alignItems: 'center' }}>
            {steps.map(({ emoji, accent, label, desc }) => (
              <View key={label} style={{ alignItems: 'center', width: '100%', padding: 5 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22,
                  backgroundColor: accent, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{emoji}</Text>
                </View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: B.dark,
                  marginTop: 10, marginBottom: 0, textAlign: 'center', fontFamily: SERIF }}>
                  {label}
                </Text>
                <Text style={{ fontSize: 14, color: B.muted, lineHeight: 22,
                  textAlign: 'center', fontFamily: SANS, maxWidth: 300 }}>
                  {desc}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <ScrollHint text="Scroll Down" color="rgba(26,34,51,0.85)" />
      </View>
    );

    /* ── CARD 2 ─ Lab Report Summary ──────────────────────────────── */
    if (idx === 1) return (
      <View style={[sty.card, { height: SCREEN_H }]}>
        <View style={{ flex: 1, paddingHorizontal: 24,
          paddingTop: insets.top + 48, paddingBottom: 40 }}>

          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22,
              backgroundColor: B.bg, justifyContent: 'center', alignItems: 'center',
              marginBottom: 8 }}>
              <Text style={{ fontSize: 20 }}>🧪</Text>
            </View>
            <Text style={{ fontSize: 13, color: B.primary, fontWeight: '700',
              letterSpacing: 5.1, textTransform: 'uppercase', fontFamily: SERIF }}>
              Lab Certified
            </Text>
          </View>

          <Text style={{ textAlign: 'center', fontSize: 24, fontWeight: '700',
            color: B.dark, marginBottom: 6, fontFamily: SERIF }}>Lab Report</Text>
          <Text style={{ textAlign: 'center', fontSize: 14, color: '#555550',
            fontWeight: '600', marginBottom: 4, fontFamily: SANS }}>
            Report No: <Text style={{ textDecorationLine: 'underline' }}>FSRL2026 - 40</Text> · 13 Apr 2026
          </Text>
          <Text style={{ textAlign: 'center', fontSize: 14, color: B.muted,
            marginBottom: 24, fontFamily: SANS }}>
            Sample: Strawberry (1 kg) · Analysed 08 - 11 Apr 2026
          </Text>

          <View style={{ flex: 1, justifyContent: 'center', gap: 12 }}>
            {labResults.map(({ label, note, highlight }) => (
              <View key={label}
                style={{ flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10,
                  backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: B.border,
                  borderRadius: 18 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ alignSelf: 'center', borderBottomWidth: 2, borderBottomColor: B.dark, marginBottom: 6 }}>
                    <Text style={{ fontSize: 15, textAlign: 'center', letterSpacing: 1.9, fontWeight: '600', color: B.dark,
                      textTransform: 'uppercase', fontFamily: SERIF }}>
                      {label}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 15, textAlign: 'center', fontWeight: '400', color: B.dark,
                    fontFamily: SANS }}>{note}</Text>
                  {highlight ? (
                    <View style={{ alignSelf: 'center', backgroundColor: '#739657', borderRadius: 4,
                      paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 }}>
                      <Text style={{ fontSize: 12, textAlign: 'center', fontWeight: '700', color: '#FFFFFF',
                        fontFamily: SANS, textTransform: 'uppercase', letterSpacing: 1 }}>{highlight}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center',
            gap: 12, paddingHorizontal: 16, paddingVertical: 14,
            borderWidth: 1.5, borderColor: B.border, borderRadius: 16 }}>
            <Text style={{ fontSize: 22 }}>🧪</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: B.primary, fontWeight: '700',
                fontFamily: SERIF }}>
                Food Safety Referral Laboratory
              </Text>
              <Text style={{ fontSize: 13, color: B.muted, fontFamily: SANS }}>
                ICAR-IIHR, Bangalore · TC-16406 Accredited
              </Text>
            </View>
          </View>
        </View>
        <ScrollHint />
      </View>
    );

    /* ── CARD 3 ─ Lab PDF Page 1 ──────────────────────────────────── */
    if (idx === 2) return (
      <View style={[sty.card, { height: SCREEN_H }]}>
        <View style={{ flex: 1, paddingHorizontal: 20,
          paddingTop: insets.top + 44, paddingBottom: 48 }}>

          <View style={{ alignItems: 'center', marginBottom: 16, gap: 4 }}>
            <Text style={{ fontSize: 13, color: '#C0152A', fontWeight: '700',
              letterSpacing: 3.5, textTransform: 'uppercase', fontFamily: SANS }}>
              Page 1 of 2
            </Text>
            <Text style={{ fontSize: 13, color: B.muted, fontFamily: SANS }}>
              FSRL2026-40
            </Text>
          </View>

          <View style={{ flex: 1, borderWidth: 1.5, borderColor: B.border,
            borderRadius: 16, overflow: 'hidden',
            shadowColor: B.primary, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.14, shadowRadius: 10, elevation: 4 }}>
            <PdfCard pageNumber={1} pdfUri={pdfUri} />
          </View>

          <Text style={{ marginTop: 10, textAlign: 'center', fontSize: 13,
            color: B.muted, opacity: 0.7, fontFamily: SANS }}>
            TC-16406 Accredited · Analysed 08–11 Apr 2026
          </Text>
        </View>
        <ScrollHint />
      </View>
    );

    /* ── CARD 4 ─ Lab PDF Page 2 ──────────────────────────────────── */
    if (idx === 3) return (
      <View style={[sty.card, { height: SCREEN_H }]}>
        <View style={{ flex: 1, paddingHorizontal: 20,
          paddingTop: insets.top + 44, paddingBottom: 48 }}>

          <View style={{ alignItems: 'center', marginBottom: 16, gap: 4 }}>
            <Text style={{ fontSize: 13, color: '#C0152A', fontWeight: '700',
              letterSpacing: 3.5, textTransform: 'uppercase', fontFamily: SANS }}>
              Page 2 of 2
            </Text>
            <Text style={{ fontSize: 13, color: B.muted, fontFamily: SANS }}>
              FSRL2026-40
            </Text>
          </View>

          <View style={{ flex: 1, borderWidth: 1.5,
            borderColor: 'rgba(193,140,93,0.22)', borderRadius: 16, overflow: 'hidden',
            shadowColor: B.amber, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 }}>
            <PdfCard pageNumber={2} pdfUri={pdfUri} />
          </View>

          <Text style={{ marginTop: 10, textAlign: 'center', fontSize: 13,
            color: B.muted, opacity: 0.7, fontFamily: SANS }}>
            TC-16406 Accredited · Report issued 13 Apr 2026
          </Text>
        </View>
        <ScrollHint />
      </View>
    );

    /* ── CARD 5 ─ Our Commitment ──────────────────────────────────── */
    return (
      <View style={[sty.card, { height: SCREEN_H, paddingHorizontal: 24,
        paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }]}>

        <Text style={{ textAlign: 'center', marginBottom: 6, fontSize: 22,
          color: '#C0152A', letterSpacing: 5.1, textTransform: 'uppercase',
          fontFamily: SERIF, fontWeight: '600' }}>
          Our Promise
        </Text>
        <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: '700',
          color: B.dark, marginBottom: 10, fontFamily: SERIF }}>
          Our Commitment
        </Text>

        <Text style={{ textAlign: 'center', fontSize: 16, color: '#108333',
          lineHeight: 24, marginBottom: 28, fontFamily: SANS }}>
          Every strawberry reflects a commitment to clean and healthy food for our valuable families.
        </Text>

        <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
          {promise.map(({ emoji, image, stat, label, desc }) => (
            <View key={label}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 16,
                paddingHorizontal: 20, paddingVertical: 18,
                backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: B.border,
                borderRadius: 20,
                shadowColor: B.primary, shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12, shadowRadius: 9, elevation: 3 }}>
              <View style={{ alignItems: 'center', flexShrink: 0, width: 60 }}>
                {image
                  ? <Image source={image} style={{ width: 40, height: 40, marginBottom: 4 }} resizeMode="contain" />
                  : <Text style={{ fontSize: 28, marginBottom: 4 }}>{emoji}</Text>
                }
                <Text style={{ fontSize: 16, color: B.dark, fontWeight: '800',
                  textAlign: 'center', fontFamily: SANS }}>{stat}</Text>
                <Text style={{ fontSize: 10, color: B.muted, textTransform: 'uppercase',
                  letterSpacing: 1.5, textAlign: 'center', marginTop: 2,
                  fontFamily: SANS }}>{label}</Text>
              </View>
              <View style={{ width: 1, height: 48, backgroundColor: B.border }} />
              <Text style={{ flex: 1, fontSize: 15, color: B.dark, lineHeight: 22,
                fontFamily: SANS }}>{desc}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={goBackToStory}
          activeOpacity={0.88}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 8, width: '100%', marginTop: 24, backgroundColor: '#739657',
            borderRadius: 14, paddingVertical: 16,
            shadowColor: B.primary, shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.38, shadowRadius: 10, elevation: 6 }}
        >
          <Text style={{ color: 'white', fontSize: 18 }}>←</Text>
          <Text style={{ color: 'white', fontSize: 16, textTransform: 'uppercase', fontWeight: '700',
            letterSpacing: 0.6, fontFamily: SANS }}>
            Back to Strawberrys
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [SCREEN_H, insets, pdfUri, goBackToStory]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center' }}>
      <View style={{ width: colW, flex: 1 }}>
        <FlatList
          ref={flatRef}
          data={[0, 1, 2, 3, 4]}
          keyExtractor={(item) => String(item)}
          renderItem={renderCard}
          snapToInterval={SCREEN_H}
          snapToAlignment="start"
          disableIntervalMomentum={true}
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          bounces={false}
          overScrollMode="never"
          getItemLayout={(_, index) => ({ length: SCREEN_H, offset: SCREEN_H * index, index })}
          removeClippedSubviews={true}
          maxToRenderPerBatch={1}
          windowSize={3}
          initialNumToRender={1}
          onMomentumScrollEnd={(e) => {
            currentPage.current = Math.round(e.nativeEvent.contentOffset.y / SCREEN_H);
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
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 2,
  },
});
