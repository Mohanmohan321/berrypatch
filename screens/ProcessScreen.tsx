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
  Dimensions,
} from 'react-native';
import { useWindowDimensions } from 'react-native';

const PAGE_H = Dimensions.get('window').height;
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
const ScrollHint = ({ text, color = 'rgba(26,34,51,0.85)' }: { text?: string; color?: string }) => {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[sty.scrollHint, { bottom: bottom + 16, pointerEvents: 'none' as any }]}>
      {text ? (
        <Text style={{ fontSize: 12, color, letterSpacing: 2.5, textTransform: 'uppercase', fontFamily: SANS, fontWeight: '700' }}>
          {text}
        </Text>
      ) : null}
      <Text style={{ fontSize: 32, color, lineHeight: 30, fontWeight: '900' }}>⌄</Text>
    </View>
  );
};

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

/* ── PDF.js single-page HTML — one page, fit-to-screen, zoomable ──── */
const buildPageHtml = (pdfUri: string, pageNumber: number) => `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=5.0,user-scalable=yes">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"><\/script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;overflow:hidden;background:#f0f0f0}
    #wrap{width:100%;height:100%;overflow:hidden;touch-action:none;
          display:flex;justify-content:center;align-items:center;}
    #cw{display:inline-block;transform-origin:center center;}
    canvas{display:block;box-shadow:0 2px 10px rgba(0,0,0,0.18);}
    #msg{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
         font:14px sans-serif;color:#777;}
  </style>
</head>
<body>
  <div id="wrap"><span id="msg">Loading…</span><div id="cw"></div></div>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    var cw=document.getElementById('cw'), wrap=document.getElementById('wrap');
    var sc=1,tx=0,ty=0,pinchSc=1,pinchTx=0,pinchTy=0,pinchD=0,pinchRx=0,pinchRy=0;
    function apply(){cw.style.transform='translate('+tx+'px,'+ty+'px) scale('+sc+')';}
    function pdist(t){var dx=t[0].clientX-t[1].clientX,dy=t[0].clientY-t[1].clientY;return Math.sqrt(dx*dx+dy*dy);}
    (async function(){
      try{
        var buf  = await fetch('${pdfUri}').then(function(r){return r.arrayBuffer();});
        var doc  = await pdfjsLib.getDocument({data:buf}).promise;
        var page = await doc.getPage(${pageNumber});
        var dpr  = window.devicePixelRatio||1;
        var W    = wrap.clientWidth||window.innerWidth;
        var H    = wrap.clientHeight||window.innerHeight;
        var vp1  = page.getViewport({scale:1});
        var psc  = Math.min(W*0.94/vp1.width, H*0.94/vp1.height);
        var vp   = page.getViewport({scale:psc*dpr});
        var c    = document.createElement('canvas');
        c.width=vp.width; c.height=vp.height;
        c.style.width=(vp.width/dpr)+'px'; c.style.height=(vp.height/dpr)+'px';
        await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;
        cw.appendChild(c);
        document.getElementById('msg').style.display='none';
      }catch(e){document.getElementById('msg').textContent='Could not load PDF';}
    })();
    wrap.addEventListener('touchstart',function(e){
      if(e.touches.length===2){
        var r=wrap.getBoundingClientRect();
        pinchD=pdist(e.touches);pinchSc=sc;pinchTx=tx;pinchTy=ty;
        pinchRx=(e.touches[0].clientX+e.touches[1].clientX)/2-r.left-r.width/2;
        pinchRy=(e.touches[0].clientY+e.touches[1].clientY)/2-r.top-r.height/2;
      }
    },{passive:true});
    wrap.addEventListener('touchmove',function(e){
      if(e.touches.length===2){
        e.preventDefault();
        var s=Math.min(Math.max(pinchSc*(pdist(e.touches)/pinchD),1),5);
        if(s<=1){tx=0;ty=0;sc=1;apply();return;}
        tx=pinchRx-s*(pinchRx-pinchTx)/pinchSc;
        ty=pinchRy-s*(pinchRy-pinchTy)/pinchSc;
        sc=s;apply();
      }
    },{passive:false});
    wrap.addEventListener('touchend',function(e){},{passive:true});
    wrap.addEventListener('wheel',function(e){
      if(e.ctrlKey||e.metaKey){
        e.preventDefault();
        var r=wrap.getBoundingClientRect();
        var rx=e.clientX-r.left-r.width/2,ry=e.clientY-r.top-r.height/2;
        var s=Math.min(Math.max(sc*(1-e.deltaY*0.005),1),5);
        if(s<=1){tx=0;ty=0;sc=1;apply();return;}
        tx=rx-s*(rx-tx)/sc;ty=ry-s*(ry-ty)/sc;sc=s;apply();
      }
    },{passive:false});
    wrap.addEventListener('dblclick',function(){sc=1;tx=0;ty=0;apply();});
  <\/script>
</body>
</html>`;

/* ── PDF.js all-pages HTML — both pages stacked, fit-to-screen, zoomable ── */
const buildAllPagesHtml = (pdfUri: string) => `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=5.0,user-scalable=yes">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"><\/script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;overflow:hidden;background:#f0f0f0}
    #wrap{
      width:100%;height:100%;
      overflow:hidden;touch-action:none;
      display:flex;justify-content:center;align-items:center;
    }
    #cw{
      display:flex;flex-direction:column;align-items:center;gap:6px;
      transform-origin:center center;
    }
    canvas{display:block;box-shadow:0 2px 10px rgba(0,0,0,0.18);}
    #msg{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
         font:14px sans-serif;color:#777;}
  </style>
</head>
<body>
  <div id="wrap"><span id="msg">Loading…</span><div id="cw"></div></div>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    var cw=document.getElementById('cw'), wrap=document.getElementById('wrap');
    var sc=1,baseScale=1,tx=0,ty=0,pinchSc=1,pinchTx=0,pinchTy=0,pinchD=0,pinchRx=0,pinchRy=0;
    function apply(){cw.style.transform='translate('+tx+'px,'+ty+'px) scale('+sc+')';}
    function pdist(t){var dx=t[0].clientX-t[1].clientX,dy=t[0].clientY-t[1].clientY;return Math.sqrt(dx*dx+dy*dy);}
    (async function(){
      try{
        var buf = await fetch('${pdfUri}').then(function(r){return r.arrayBuffer();});
        var doc = await pdfjsLib.getDocument({data:buf}).promise;
        var dpr = window.devicePixelRatio||1;
        var W   = wrap.clientWidth||window.innerWidth;
        var H   = wrap.clientHeight||window.innerHeight;
        var pageW = W * 0.88;
        var totalH = 0;
        for(var i=1;i<=doc.numPages;i++){
          var page = await doc.getPage(i);
          var vp1  = page.getViewport({scale:1});
          var psc  = pageW/vp1.width;
          var vp   = page.getViewport({scale:psc*dpr});
          var c    = document.createElement('canvas');
          c.width=vp.width; c.height=vp.height;
          c.style.width=(vp.width/dpr)+'px'; c.style.height=(vp.height/dpr)+'px';
          await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;
          cw.appendChild(c);
          totalH += vp.height/dpr;
        }
        totalH += (doc.numPages-1)*6;
        if(totalH > H*0.93){
          baseScale=(H*0.93)/totalH;
          sc=baseScale; tx=0; ty=0; apply();
        }
        document.getElementById('msg').style.display='none';
      }catch(e){document.getElementById('msg').textContent='Could not load PDF';}
    })();
    wrap.addEventListener('touchstart',function(e){
      if(e.touches.length===2){
        var r=wrap.getBoundingClientRect();
        pinchD=pdist(e.touches);pinchSc=sc;pinchTx=tx;pinchTy=ty;
        pinchRx=(e.touches[0].clientX+e.touches[1].clientX)/2-r.left-r.width/2;
        pinchRy=(e.touches[0].clientY+e.touches[1].clientY)/2-r.top-r.height/2;
      }
    },{passive:true});
    wrap.addEventListener('touchmove',function(e){
      if(e.touches.length===2){
        e.preventDefault();
        var s=Math.min(Math.max(pinchSc*(pdist(e.touches)/pinchD),baseScale),baseScale*5);
        if(s<=baseScale){tx=0;ty=0;sc=baseScale;apply();return;}
        tx=pinchRx-s*(pinchRx-pinchTx)/pinchSc;
        ty=pinchRy-s*(pinchRy-pinchTy)/pinchSc;
        sc=s;apply();
      }
    },{passive:false});
    wrap.addEventListener('touchend',function(e){},{passive:true});
    wrap.addEventListener('wheel',function(e){
      if(e.ctrlKey||e.metaKey){
        e.preventDefault();
        var r=wrap.getBoundingClientRect();
        var rx=e.clientX-r.left-r.width/2,ry=e.clientY-r.top-r.height/2;
        var s=Math.min(Math.max(sc*(1-e.deltaY*0.005),baseScale),baseScale*5);
        if(s<=baseScale){tx=0;ty=0;sc=baseScale;apply();return;}
        tx=rx-s*(rx-tx)/sc;ty=ry-s*(ry-ty)/sc;sc=s;apply();
      }
    },{passive:false});
    wrap.addEventListener('dblclick',function(){sc=baseScale;tx=0;ty=0;apply();});
  <\/script>
</body>
</html>`;

/* ── PDF card (web) — Blob URL preserves origin so fetch() works ─── */
const PdfCardWeb = ({ pdfUri }: { pdfUri: string | null }) => {
  const [blobSrc, setBlobSrc] = React.useState('');
  React.useEffect(() => {
    if (!pdfUri) return;
    const blob = new Blob([buildAllPagesHtml(pdfUri)], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    setBlobSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [pdfUri]);

  if (!blobSrc) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
      <Text style={{ fontSize: 32 }}>🧪</Text>
      <Text style={{ fontSize: 14, color: B.muted, fontFamily: SANS }}>Loading…</Text>
    </View>
  );
  return (
    <View style={{ flex: 1, overflow: 'hidden' as any }}>
      {React.createElement('iframe', {
        src: blobSrc,
        title: 'Lab Report',
        style: { width: '100%', height: '100%', border: 'none', display: 'block' },
      })}
    </View>
  );
};

/* ── PDF card ────────────────────────────────────────────────────── */
const PdfCard = ({ pdfUri }: { pdfUri: string | null }) => {
  if (Platform.OS === 'web') return <PdfCardWeb pdfUri={pdfUri} />;
  if (!pdfUri) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
      <Text style={{ fontSize: 32 }}>🧪</Text>
      <Text style={{ fontSize: 14, color: B.muted, fontFamily: SANS }}>Loading…</Text>
    </View>
  );
  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: buildAllPagesHtml(pdfUri) }}
      style={{ flex: 1 }}
      scrollEnabled={false}
      pinchGestureEnabled={true}
      scalesPageToFit={false}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      nestedScrollEnabled={false}
      javaScriptEnabled={true}
      allowFileAccess={true}
      allowUniversalAccessFromFileURLs={true}
    />
  );
};

/* ── Single-page PDF card (web) ──────────────────────────────────── */
const PdfPageCardWeb = ({ pdfUri, pageNumber }: { pdfUri: string | null; pageNumber: number }) => {
  const [iframeSrc, setIframeSrc] = React.useState('');

  React.useEffect(() => {
    if (!pdfUri) return;
    let pdfBlobUrl = '';
    let htmlBlobUrl = '';
    let cancelled = false;

    fetch(pdfUri)
      .then(r => r.blob())
      .then(pdfBlob => {
        if (cancelled) return;
        pdfBlobUrl = URL.createObjectURL(pdfBlob);
        const html = buildPageHtml(pdfBlobUrl, pageNumber);
        const htmlBlob = new Blob([html], { type: 'text/html' });
        htmlBlobUrl = URL.createObjectURL(htmlBlob);
        setIframeSrc(htmlBlobUrl);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      if (htmlBlobUrl) URL.revokeObjectURL(htmlBlobUrl);
    };
  }, [pdfUri, pageNumber]);

  if (!iframeSrc) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
      <Text style={{ fontSize: 32 }}>🧪</Text>
      <Text style={{ fontSize: 14, color: B.muted, fontFamily: SANS }}>Loading…</Text>
    </View>
  );
  return (
    <View style={{ flex: 1, overflow: 'hidden' as any }}>
      {React.createElement('iframe', {
        src: iframeSrc,
        title: `Lab Report Page ${pageNumber}`,
        style: { width: '100%', height: '100%', border: 'none', display: 'block' },
      })}
    </View>
  );
};

/* ── Single-page PDF card ─────────────────────────────────────────── */
const PdfPageCard = ({ pdfUri, pageNumber }: { pdfUri: string | null; pageNumber: number }) => {
  if (Platform.OS === 'web') return <PdfPageCardWeb pdfUri={pdfUri} pageNumber={pageNumber} />;
  if (!pdfUri) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
      <Text style={{ fontSize: 32 }}>🧪</Text>
      <Text style={{ fontSize: 14, color: B.muted, fontFamily: SANS }}>Loading…</Text>
    </View>
  );
  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: buildPageHtml(pdfUri, pageNumber) }}
      style={{ flex: 1 }}
      scrollEnabled={false}
      pinchGestureEnabled={true}
      scalesPageToFit={false}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      javaScriptEnabled={true}
      allowFileAccess={true}
      allowUniversalAccessFromFileURLs={true}
    />
  );
};

/* ═══════════════════════════════════════════════════════════════════ */

type Props = NativeStackScreenProps<RootStackParamList, 'Process'>;

export default function ProcessScreen({ navigation }: Props) {
  const { width: SCREEN_W } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);
  const currentPage = useRef(0);
  const isScrollingRef = useRef(false);
  const [webPage, setWebPage] = useState(0);
  const setWebPageRef = useRef(setWebPage);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  const colW = Math.min(SCREEN_W, 480);

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

  useEffect(() => {
    Asset.loadAsync(require('../assets/lab-report.pdf')).then(([asset]) => {
      setPdfUri(asset.localUri ?? asset.uri ?? null);
    }).catch(() => {});
  }, []);

  /* ── One-page-per-scroll on web ─────────────────────────────── */
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const TOTAL = 5;

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

  const goBackToStory = () => navigation.navigate('Home', { goToCard: 1 });

  const renderCard = useCallback(({ item: idx }: { item: number }) => {

    /* ── CARD 1 ─ From Farm to Table ──────────────────────────────── */
    if (idx === 0) return (
      <View style={[sty.card, { height: cardH, justifyContent: 'center' }]}>
        <View style={{ paddingHorizontal: 20,
          paddingTop: insets.top + 16, paddingBottom: insets.bottom + 72,
          alignItems: 'center' }}>
          <View style={{ width: '100%', alignItems: 'flex-start', marginBottom: 20 }}>
            <BackBtn onPress={goBackToStory} />
          </View>

          <Text style={{ textAlign: 'center', marginBottom: 10, fontSize: 18,
            color: '#C0152A', letterSpacing: 5, textTransform: 'uppercase',
            fontFamily: SERIF, fontWeight: '600' }}>
            Behind the scenes
          </Text>
          <Text style={{ textAlign: 'center', marginBottom: 10, fontSize: 20,
            fontWeight: '800', color: B.dark, lineHeight: 34, fontFamily: SERIF }}>
            From Farm to Table
          </Text>

          <View style={{ width: '100%', alignItems: 'center' }}>
            {steps.map(({ emoji, accent, label, desc }) => (
              <View key={label} style={{ alignItems: 'center', width: '100%', padding: 4 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20,
                  backgroundColor: accent, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18 }}>{emoji}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: B.dark,
                  marginTop: 6, marginBottom: 0, textAlign: 'center', fontFamily: SERIF }}>
                  {label}
                </Text>
                <Text style={{ fontSize: 13, color: B.muted, lineHeight: 20,
                  textAlign: 'center', fontFamily: SANS, maxWidth: 300 }}>
                  {desc}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <ScrollHint text="Scroll Down" color="rgba(26,34,51,0.85)" />
      </View>
    );

    /* ── CARD 2 ─ Lab Report Summary ──────────────────────────────── */
    if (idx === 1) return (
      <View style={[sty.card, { height: cardH }]}>
        <View style={{ flex: 1, paddingHorizontal: 24,
          paddingTop: insets.top + 48, paddingBottom: insets.bottom + 72 }}>

          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22,
              backgroundColor: B.bg, justifyContent: 'center', alignItems: 'center',
              marginBottom: 8 }}>
              <Text style={{ fontSize: 20 }}>🧪</Text>
            </View>
            <Text style={{ fontSize: 13, color: B.primary, fontWeight: '700',
              letterSpacing: 5.1, textTransform: 'uppercase', fontFamily: SANS }}>
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
                      textTransform: 'uppercase', fontFamily: SANS }}>
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
      <View style={[sty.card, { height: cardH }]}>
        <View style={{ flex: 1, paddingHorizontal: 20,
          paddingTop: insets.top + 20, paddingBottom: insets.bottom + 72 }}>

          <View style={{ alignItems: 'center', marginBottom: 12, gap: 2 }}>
            <Text style={{ fontSize: 13, color: '#C0152A', fontWeight: '700',
              letterSpacing: 3.5, textTransform: 'uppercase', fontFamily: SANS }}>
              Page 1 of 2
            </Text>
            <Text style={{ fontSize: 12, color: B.muted, fontFamily: SANS }}>
              FSRL2026-40 · Pinch or Ctrl+scroll to zoom
            </Text>
          </View>

          <View style={{ height: cardH * 0.65, borderWidth: 1.5, borderColor: B.border,
            borderRadius: 16, overflow: 'hidden',
            shadowColor: B.primary, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.14, shadowRadius: 10, elevation: 4 }}>
            <PdfPageCard pageNumber={1} pdfUri={pdfUri} />
          </View>

          <Text style={{ marginTop: 8, textAlign: 'center', fontSize: 12,
            color: B.muted, opacity: 0.7, fontFamily: SANS }}>
            TC-16406 Accredited · Analysed 08 Apr 2026
          </Text>
        </View>
        <ScrollHint />
      </View>
    );

    /* ── CARD 4 ─ Lab PDF Page 2 ──────────────────────────────────── */
    if (idx === 3) return (
      <View style={[sty.card, { height: cardH }]}>
        <View style={{ flex: 1, paddingHorizontal: 20,
          paddingTop: insets.top + 20, paddingBottom: insets.bottom + 72 }}>

          <View style={{ alignItems: 'center', marginBottom: 12, gap: 2 }}>
            <Text style={{ fontSize: 13, color: '#C0152A', fontWeight: '700',
              letterSpacing: 3.5, textTransform: 'uppercase', fontFamily: SANS }}>
              Page 2 of 2
            </Text>
            <Text style={{ fontSize: 12, color: B.muted, fontFamily: SANS }}>
              FSRL2026-40 · Pinch or Ctrl+scroll to zoom
            </Text>
          </View>

          <View style={{ height: cardH * 0.65, borderWidth: 1.5, borderColor: 'rgba(193,140,93,0.22)',
            borderRadius: 16, overflow: 'hidden',
            shadowColor: B.amber, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 }}>
            <PdfPageCard pageNumber={2} pdfUri={pdfUri} />
          </View>

          <Text style={{ marginTop: 8, textAlign: 'center', fontSize: 12,
            color: B.muted, opacity: 0.7, fontFamily: SANS }}>
            TC-16406 Accredited · Report issued 13 Apr 2026
          </Text>
        </View>
        <ScrollHint />
      </View>
    );

    /* ── CARD 5 ─ Our Commitment ──────────────────────────────────── */
    return (
      <View style={[sty.card, { height: cardH, paddingHorizontal: 24,
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
              <View style={{ alignItems: 'center', flexShrink: 0, width: 84 }}>
                {image
                  ? <Image source={image} style={{ width: 40, height: 40, marginBottom: 4 }} resizeMode="contain" />
                  : <Text style={{ fontSize: 28, marginBottom: 4 }}>{emoji}</Text>
                }
                <Text style={{ fontSize: 15, color: B.dark, fontWeight: '800',
                  textAlign: 'center', fontFamily: SANS }}>{stat}</Text>
                <Text style={{ fontSize: 10, color: B.primary, textTransform: 'uppercase',
                  letterSpacing: 1.5, textAlign: 'center', marginTop: 2,
                  fontFamily: SANS }}>{label}</Text>
              </View>
              <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: B.border }} />
              <Text style={{ flex: 1, fontSize: 14, color: B.dark, lineHeight: 22,
                fontFamily: SANS }}>{desc}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={goBackToStory}
          activeOpacity={0.88}
          style={{ alignItems: 'center', justifyContent: 'center',
            width: '100%', marginTop: 24, backgroundColor: '#739657',
            borderRadius: 14, paddingVertical: 16,
            shadowColor: B.primary, shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.38, shadowRadius: 10, elevation: 6 }}
        >
          <Text style={{ color: 'white', fontSize: 16, textTransform: 'uppercase', fontWeight: '700',
            letterSpacing: 0.6, fontFamily: SANS }}>
            ← Back to Strawberries
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [insets, pdfUri, goBackToStory, cardH]);

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
            {[0, 1, 2, 3, 4].map((idx) => renderCard({ item: idx }))}
          </View>
        </View>
      </View>
    );
  }

  /* ── Native: FlatList with snapToInterval ───────────────────── */
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center' }}>
      <View style={{ width: colW, flex: 1 }}>
        <FlatList
          ref={flatRef}
          data={[0, 1, 2, 3, 4]}
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
          initialNumToRender={1}
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
