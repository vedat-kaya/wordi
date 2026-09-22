import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ADRENALIN_ESIK, useWordiGame } from "./hooks/useWordiGame";

function App() {
  const {
    verilerYuklendi,
    veriHatasi,
    sorulariYukle,
    ekranDurumu,
    oyunModu,
    aktifSoru,
    mevcutSoruIndeks,
    toplamPuan,
    sure,
    masaPuani,
    soruDurumu,
    oyunSorulari,
    alinanHarfler,
    yazilanKelime,
    inputDegisti,
    harfAl,
    gunlukOyunBaslat,
    serbestOyunBaslat,
    menuyeDon,
    kombo,
    istatistik,
    dogruCevapSayisi,
    easterEggAktif,
    cevapModu,
    cevapSuresi,
    cevaplamaModunaGec,
  } = useWordiGame();

  const { kelime, ipucu } = aktifSoru;
  const tahtaRef = useRef(null);
  const gizliInputRef = useRef(null);
  const cursorRef = useRef(null);
  const kopyaTimerRef = useRef(null);
  const oncekiMasaPuani = useRef(masaPuani);
  const [gosterilenPuan, setGosterilenPuan] = useState(0);
  const [kopyalandi, setKopyalandi] = useState(false);
  const [kopyaHatasi, setKopyaHatasi] = useState(false);
  const [inceImlec, setInceImlec] = useState(false);
  const [dokunmatik, setDokunmatik] = useState(false);
  const [klavye, setKlavye] = useState({
    yukseklik: 0,
    gorunurYukseklik: 0,
    ust: 0,
  });
  const cikisIsteniyor = useRef(false);

  const cevapInputunuOdakla = () => {
    gizliInputRef.current?.focus({ preventScroll: true });
  };

  const cikisYap = () => {
    cikisIsteniyor.current = true;
    gizliInputRef.current?.blur();
    menuyeDon();
  };

  useEffect(() => {
    const ince = window.matchMedia("(pointer: fine) and (min-width: 768px)");
    const kaba = window.matchMedia("(hover: none) and (pointer: coarse)");
    const sync = () => {
      setInceImlec(ince.matches);
      setDokunmatik(kaba.matches);
    };
    sync();
    ince.addEventListener("change", sync);
    kaba.addEventListener("change", sync);
    return () => {
      ince.removeEventListener("change", sync);
      kaba.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (ekranDurumu !== "oyun") {
      setKlavye({ yukseklik: 0, gorunurYukseklik: 0, ust: 0 });
      return undefined;
    }
    cikisIsteniyor.current = false;
    const vv = window.visualViewport;
    const sync = () => {
      const layoutH = window.innerHeight;
      const h = vv?.height ?? layoutH;
      const ust = vv?.offsetTop ?? 0;
      setKlavye({
        yukseklik: Math.max(0, layoutH - h - ust),
        gorunurYukseklik: h,
        ust,
      });
    };
    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [ekranDurumu]);

  useEffect(() => {
    if (ekranDurumu !== "oyun") return undefined;
    const html = document.documentElement;
    const body = document.body;
    const onceki = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyWidth: body.style.width,
      bodyTop: body.style.top,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (dokunmatik) {
      body.style.position = "fixed";
      body.style.width = "100%";
      body.style.top = "0";
    }
    return () => {
      html.style.overflow = onceki.htmlOverflow;
      body.style.overflow = onceki.bodyOverflow;
      body.style.position = onceki.bodyPosition;
      body.style.width = onceki.bodyWidth;
      body.style.top = onceki.bodyTop;
    };
  }, [ekranDurumu, dokunmatik]);

  useEffect(() => {
    if (!inceImlec) return undefined;
    const cursor = cursorRef.current;
    if (!cursor) return undefined;
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });

    const onMouseMove = (e) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: "power2.out",
      });
    };
    const onMouseDown = () => gsap.to(cursor, { scale: 0.5, duration: 0.1 });
    const onMouseUp = () =>
      gsap.to(cursor, { scale: 1, duration: 0.2, ease: "back.out(2)" });

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [inceImlec]);

  useEffect(() => {
    if (ekranDurumu !== "oyun") return undefined;
    const a1 = gsap.to(".aurora-1", {
      x: 150,
      y: 100,
      duration: 12,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    const a2 = gsap.to(".aurora-2", {
      x: -150,
      y: -100,
      duration: 15,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    return () => {
      a1.kill();
      a2.kill();
    };
  }, [ekranDurumu]);

  useEffect(() => {
    if (masaPuani < oncekiMasaPuani.current && tahtaRef.current) {
      gsap.fromTo(
        ".masa-puani-anim",
        { color: "#f43f5e", scale: 1.4 },
        { color: "#ffffff", scale: 1, duration: 0.4, ease: "power2.out" },
      );
    }
    oncekiMasaPuani.current = masaPuani;
  }, [masaPuani]);

  const goruntulenenHarfler = Array(kelime?.length || 0).fill("");
  let yazilanIndeks = 0;
  let aktifKutuIndeksi = -1;

  if (kelime) {
    for (let i = 0; i < kelime.length; i++) {
      if (alinanHarfler.includes(i)) {
        goruntulenenHarfler[i] = kelime[i];
      } else {
        if (yazilanIndeks < yazilanKelime.length) {
          goruntulenenHarfler[i] = yazilanKelime[yazilanIndeks];
          yazilanIndeks++;
        } else if (aktifKutuIndeksi === -1 && !soruDurumu && cevapModu) {
          aktifKutuIndeksi = i;
        }
      }
    }
  }

  const harfSayisi = goruntulenenHarfler.length || 1;
  const tahtaStili = {
    display: "grid",
    gridTemplateColumns: `repeat(${harfSayisi}, minmax(0, 1fr))`,
    gap: harfSayisi >= 9 ? "0.22rem" : harfSayisi >= 7 ? "0.4rem" : "0.55rem",
    width: "100%",
    maxWidth: `min(100%, ${harfSayisi * 5.25}rem)`,
  };
  const kutuBoyu = {
    width: "100%",
    minWidth: 0,
    aspectRatio: "3 / 4",
    height: "auto",
  };
  const klavyeAcik = dokunmatik && klavye.yukseklik > 80;

  useEffect(() => {
    if (
      ekranDurumu === "oyun" &&
      cevapModu &&
      gizliInputRef.current &&
      !soruDurumu &&
      !easterEggAktif &&
      dokunmatik
    ) {
      cevapInputunuOdakla();
    } else if (gizliInputRef.current && !cevapModu) {
      gizliInputRef.current.blur();
    }
  }, [ekranDurumu, cevapModu, soruDurumu, easterEggAktif, dokunmatik]);

  useEffect(() => {
    if (soruDurumu === "yanlis" && tahtaRef.current) {
      gsap.fromTo(
        tahtaRef.current,
        { x: -15 },
        { x: 15, duration: 0.05, yoyo: true, repeat: 5, clearProps: "x" },
      );
    } else if (soruDurumu === "dogru" && tahtaRef.current) {
      const kutular = tahtaRef.current.children;
      gsap.fromTo(
        kutular,
        { y: -15, scale: 1.1, borderColor: "rgba(16,185,129,1)" },
        {
          y: 0,
          scale: 1,
          borderColor: "rgba(255,255,255,0.1)",
          duration: 0.6,
          stagger: 0.05,
          ease: "elastic.out(1, 0.4)",
        },
      );
    } else if (soruDurumu === "zamanDoldu") {
      gsap.fromTo(
        ".sure-bitti-yazi",
        { scale: 0.3, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.5)" },
      );
    }
  }, [soruDurumu]);

  useEffect(() => {
    if (ekranDurumu === "bitti") {
      gsap.fromTo(
        ".bitti-anim",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: "power3.out" },
      );
      const obje = { puan: 0 };
      gsap.to(obje, {
        puan: toplamPuan,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => setGosterilenPuan(Math.floor(obje.puan)),
      });
    }
  }, [ekranDurumu, toplamPuan]);

  useEffect(
    () => () => {
      if (kopyaTimerRef.current) clearTimeout(kopyaTimerRef.current);
    },
    [],
  );

  const sonucuKopyala = async () => {
    const derece = dereceHesapla();
    const metin = `Wordi 2.0 Operasyonu 🚀\nDerece: ${derece.harf}\nPuan: ${toplamPuan}\n🔥 Max Kombo: ${istatistik.maxKombo}\n💡 İpucu: ${istatistik.ipucuKullanimi}\n⚡ En Hızlı: ${istatistik.enHizliSaniye === 999 ? "-" : istatistik.enHizliSaniye.toFixed(1)}s\n\nhttps://vedatkaya.com`;
    let oldu = false;
    try {
      await navigator.clipboard.writeText(metin);
      oldu = true;
    } catch {
      try {
        const alan = document.createElement("textarea");
        alan.value = metin;
        alan.setAttribute("readonly", "");
        alan.style.position = "fixed";
        alan.style.left = "-9999px";
        document.body.appendChild(alan);
        alan.select();
        oldu = document.execCommand("copy");
        document.body.removeChild(alan);
      } catch {
        oldu = false;
      }
    }
    setKopyalandi(oldu);
    setKopyaHatasi(!oldu);
    if (kopyaTimerRef.current) clearTimeout(kopyaTimerRef.current);
    kopyaTimerRef.current = setTimeout(() => {
      setKopyalandi(false);
      setKopyaHatasi(false);
    }, 2000);
  };

  const tahtayaTikla = () => {
    if (!soruDurumu && cevapModu && dokunmatik && !easterEggAktif) {
      cevapInputunuOdakla();
    }
  };

  const dereceHesapla = () => {
    if (toplamPuan >= 5000)
      return {
        harf: "S",
        renk: "text-yellow-400",
        yazi: "KUSURSUZ ZEKÂ",
      };
    if (toplamPuan >= 3000)
      return {
        harf: "A",
        renk: "text-emerald-400",
        yazi: "MÜKEMMEL",
      };
    if (toplamPuan >= 1500)
      return {
        harf: "B",
        renk: "text-cyan-400",
        yazi: "İYİ İŞ!",
      };
    return {
      harf: "C",
      renk: "text-rose-400",
      yazi: "DAHA İYİ OLABİLİRDİ",
    };
  };

  const adrenalinAktif = kombo >= ADRENALIN_ESIK;
  const modlarHazir = verilerYuklendi && !veriHatasi;

  let icerik = null;

  if (ekranDurumu === "menu") {
    icerik = (
      <div className="wordi-ekran flex flex-col items-center justify-center p-4 sm:p-6 bg-[#050505] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-cyan-900/20 rounded-full blur-[150px] pointer-events-none"></div>

        <div className="z-10 w-full max-w-3xl text-center">
          <a
            href="https://vedatkaya.com/"
            className="inline-block mb-10 text-[10px] tracking-[0.35em] uppercase text-neutral-500 hover:text-white transition-colors"
          >
            Vedat Kaya
          </a>
          <h1 className="text-7xl sm:text-9xl font-black tracking-tighter text-white mb-2 drop-shadow-2xl">
            WORDI<span className="text-cyan-500">.</span>
          </h1>
          <p className="text-neutral-500 tracking-[0.5em] text-xs sm:text-sm font-medium uppercase mb-20">
            Premium Edition
          </p>

          <div className="flex flex-col gap-6 w-full max-w-xl mx-auto">
            {veriHatasi && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-5 rounded-3xl text-sm">
                Sorular yüklenemedi. Bağlantını kontrol edip tekrar dene.
                <button
                  type="button"
                  onClick={sorulariYukle}
                  className="mt-4 w-full py-3 rounded-2xl font-bold bg-rose-500/20 hover:bg-rose-500/30 text-white"
                >
                  TEKRAR DENE
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={gunlukOyunBaslat}
              disabled={!modlarHazir}
              className="w-full py-6 text-xl sm:text-2xl rounded-3xl font-black bg-white text-black hover:bg-neutral-200 transition-all active:scale-95 shadow-[0_10px_40px_rgba(255,255,255,0.1)] disabled:opacity-50"
            >
              {veriHatasi
                ? "YÜKLENEMEDİ"
                : verilerYuklendi
                  ? "GÜNLÜK MÜCADELE"
                  : "YÜKLENİYOR..."}
            </button>
            <div className="text-left mt-8 bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
              <span className="block text-xs tracking-widest text-neutral-500 mb-4 uppercase text-center">
                Serbest Mod
              </span>
              <div className="grid grid-cols-3 gap-4">
                {[4, 5, 10].map((dk) => (
                  <button
                    type="button"
                    key={dk}
                    onClick={() => serbestOyunBaslat(dk)}
                    disabled={!modlarHazir}
                    className="py-4 rounded-2xl border border-white/10 font-bold bg-transparent hover:border-cyan-500/50 hover:bg-cyan-500/10 text-white transition-all active:scale-95 disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-transparent"
                  >
                    {dk} DK
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (ekranDurumu === "bitti") {
    const derece = dereceHesapla();

    let ekstraMesaj = null;
    let ekstraMesajStili = "";
    if (
      dogruCevapSayisi === oyunSorulari.length &&
      istatistik.ipucuKullanimi === 0 &&
      oyunModu === "gunluk" &&
      oyunSorulari.length > 0
    ) {
      ekstraMesaj = "KUSURSUZ OYUN!";
      ekstraMesajStili =
        "text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]";
    } else if (dogruCevapSayisi === 0) {
      ekstraMesaj = "HİÇBİRİNİ BİLEMEDİN!";
      ekstraMesajStili =
        "text-rose-600 drop-shadow-[0_0_20px_rgba(225,29,72,0.8)]";
    }

    icerik = (
      <div className="wordi-ekran flex flex-col items-center justify-center p-4 sm:p-6 bg-[#050505] relative overflow-hidden">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1/2 blur-[150px] opacity-10 pointer-events-none ${derece.renk.replace("text-", "bg-")}`}
        ></div>

        <div className="z-10 w-full max-w-4xl text-center">
          <div className="bitti-anim text-xs tracking-[0.5em] text-neutral-500 mb-6 uppercase">
            Simülasyon Sona Erdi
          </div>

          {ekstraMesaj && (
            <div
              className={`bitti-anim text-2xl sm:text-4xl font-black uppercase mb-6 animate-pulse ${ekstraMesajStili}`}
            >
              {ekstraMesaj}
            </div>
          )}

          <h2 className="bitti-anim text-4xl sm:text-6xl font-black tracking-tighter text-white mb-16 uppercase">
            {oyunModu === "gunluk" ? "GÜNLÜK ÖZET" : "SÜRE DOLDU"}
          </h2>

          <div className="bitti-anim flex flex-col sm:flex-row items-center justify-center gap-12 mb-16 bg-white/5 p-8 rounded-[3rem] border border-white/5 backdrop-blur-xl">
            <div className="text-center sm:text-right">
              <div className="text-sm text-neutral-500 tracking-widest uppercase mb-2">
                Derece
              </div>
              <div
                className={`text-8xl sm:text-9xl font-black ${derece.renk} drop-shadow-2xl`}
              >
                {derece.harf}
              </div>
            </div>
            <div className="hidden sm:block w-px h-32 bg-white/10"></div>
            <div className="text-center sm:text-left">
              <div className="text-sm text-neutral-500 tracking-widest uppercase mb-2">
                Final Puanı
              </div>
              <div
                className={`text-6xl sm:text-8xl font-black ${gosterilenPuan < 0 ? "text-rose-500" : "text-white"}`}
              >
                {gosterilenPuan}
              </div>
              <div
                className={`text-sm tracking-widest mt-2 uppercase ${derece.renk}`}
              >
                {derece.yazi}
              </div>
            </div>
          </div>

          <div className="bitti-anim grid grid-cols-3 gap-4 mb-16 max-w-2xl mx-auto">
            <div className="bg-white/5 p-4 rounded-2xl">
              <div className="text-[10px] text-neutral-500 uppercase tracking-widest">
                Max Kombo
              </div>
              <div className="text-2xl font-bold text-purple-400">
                x{istatistik.maxKombo}
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl">
              <div className="text-[10px] text-neutral-500 uppercase tracking-widest">
                İpuçları
              </div>
              <div className="text-2xl font-bold text-cyan-400">
                {istatistik.ipucuKullanimi}
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl">
              <div className="text-[10px] text-neutral-500 uppercase tracking-widest">
                En Hızlı
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {istatistik.enHizliSaniye === 999
                  ? "-"
                  : istatistik.enHizliSaniye.toFixed(1)}
                s
              </div>
            </div>
          </div>

          <div className="bitti-anim flex justify-center gap-6 max-w-xl mx-auto">
            <button
              type="button"
              onClick={sonucuKopyala}
              className="flex-1 py-5 text-sm rounded-2xl border border-cyan-500/30 font-bold bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all active:scale-95"
            >
              {kopyaHatasi
                ? "KOPYALANAMADI"
                : kopyalandi
                  ? "KOPYALANDI!"
                  : "SONUCU PAYLAŞ"}
            </button>
            <button
              type="button"
              onClick={() => menuyeDon()}
              className="px-10 py-5 text-sm rounded-2xl font-bold bg-white text-black hover:bg-neutral-200 transition-all active:scale-95"
            >
              MENÜ
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    icerik = (
      <div
        className="wordi-ekran flex flex-col justify-between p-4 sm:p-12 overflow-hidden relative bg-gradient-to-br from-[#0f172a] via-[#09090b] to-[#1e1b4b]"
        onClick={tahtayaTikla}
        style={
          dokunmatik && klavye.gorunurYukseklik
            ? {
                position: "fixed",
                top: klavye.ust,
                left: 0,
                right: 0,
                height: klavye.gorunurYukseklik,
                minHeight: 0,
              }
            : undefined
        }
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="aurora-1 absolute top-0 left-0 w-[40rem] h-[40rem] bg-cyan-600/10 rounded-full blur-[120px] mix-blend-screen"></div>
          <div className="aurora-2 absolute bottom-0 right-0 w-[50rem] h-[50rem] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen"></div>
          {adrenalinAktif && (
            <div className="absolute inset-0 bg-purple-900/20 blur-[150px] animate-pulse"></div>
          )}
        </div>

        {!cevapModu && (
          <div className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 flex-col gap-4 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl z-20">
            <h3 className="text-cyan-400 font-bold tracking-widest text-[10px] uppercase mb-1">
              Aksiyonlar
            </h3>
            <div className="text-xs text-neutral-300 flex flex-col gap-4 font-medium tracking-wide">
              <div className="flex items-center gap-3">
                <kbd className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg text-white font-mono shadow-sm">
                  SPACE
                </kbd>
                <span>İpucu Al (-100 Puan)</span>
              </div>
              <div className="flex items-center gap-3">
                <kbd className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg text-white font-mono shadow-sm">
                  ENTER
                </kbd>
                <span className="text-emerald-400">Cevaplama Moduna Geç</span>
              </div>
            </div>
            <p className="text-[11px] text-white font-black mt-2 uppercase tracking-widest border-t border-white/10 pt-4 leading-relaxed">
              * Cevap moduna geçmeden
              <br />
              klavye kilitlidir.
            </p>
          </div>
        )}

        <header className="w-full flex justify-between items-start z-10 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cikisYap();
            }}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm font-bold tracking-widest text-neutral-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-3 uppercase backdrop-blur-md"
          >
            <span className="text-lg">←</span> ÇIKIŞ YAP
          </button>

          <div className="flex gap-8 sm:gap-16 text-right bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-[10px] tracking-widest text-neutral-400 uppercase mb-1">
                Puan
              </span>
              <span
                className={`text-2xl sm:text-4xl font-black ${toplamPuan < 0 ? "text-rose-400" : "text-white"}`}
              >
                {toplamPuan}
              </span>
            </div>
            <div className="w-px bg-white/10"></div>
            <div className="flex flex-col w-20">
              <span className="text-[10px] tracking-widest text-neutral-400 uppercase mb-1">
                Süre
              </span>
              <span
                className={`text-2xl sm:text-4xl font-mono font-black ${sure <= 30 ? "text-rose-400 animate-pulse" : "text-cyan-400"}`}
              >
                {Math.floor(sure / 60)}:{(sure % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>
        </header>

        <main
          className={`z-10 w-full flex flex-col items-center justify-center flex-1 relative min-h-0 ${klavyeAcik ? "my-2" : "my-6 sm:my-10"}`}
        >
          {easterEggAktif && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-emerald-950/90 backdrop-blur-2xl flex-col overflow-hidden rounded-3xl">
              <h2 className="text-5xl sm:text-8xl font-black text-emerald-400 tracking-widest drop-shadow-[0_0_50px_rgba(16,185,129,0.8)] z-10 animate-pulse text-center">
                SYSTEM OVERRIDE
                <br />
                <span className="text-white text-3xl mt-4 block">
                  VEDAT PROTOKOLÜ AKTİF
                </span>
              </h2>
            </div>
          )}

          {soruDurumu === "zamanDoldu" && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-2xl flex-col rounded-3xl">
              <h2 className="sure-bitti-yazi text-6xl sm:text-9xl font-black text-rose-500 tracking-tighter drop-shadow-[0_0_50px_rgba(225,29,72,0.6)] uppercase">
                SÜRE BİTTİ
              </h2>
            </div>
          )}

          {cevapModu && !soruDurumu && (
            <div
              className={`left-1/2 -translate-x-1/2 flex flex-col items-center animate-pulse ${klavyeAcik ? "relative mb-3" : "absolute -top-16 sm:-top-24"}`}
            >
              <div
                className={`text-5xl sm:text-7xl font-black ${cevapSuresi <= 3 ? "text-rose-500" : "text-emerald-400"} drop-shadow-2xl`}
              >
                {cevapSuresi}
              </div>
              <div className="text-[10px] tracking-widest uppercase text-white/50 mt-1">
                Saniye Kaldı
              </div>
            </div>
          )}

          <div
            className={`text-center w-full max-w-5xl relative ${klavyeAcik ? "mb-4" : "mb-8 sm:mb-20"}`}
          >
            {adrenalinAktif && !klavyeAcik && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-xs font-black text-purple-300 tracking-[0.4em] animate-pulse uppercase backdrop-blur-md">
                ADRENALİN X1.5
              </div>
            )}
            <div className="inline-block px-5 py-2 rounded-full border border-white/10 bg-white/5 text-cyan-300 font-bold tracking-widest text-[10px] sm:text-xs mb-8 uppercase backdrop-blur-md shadow-lg">
              Soru {mevcutSoruIndeks + 1} // {kelime?.length} Harf
            </div>
            <h2
              className={`font-medium tracking-wide leading-tight text-white drop-shadow-2xl px-4 ${klavyeAcik ? "text-lg sm:text-3xl" : "text-2xl sm:text-4xl md:text-5xl lg:text-6xl"}`}
            >
              "{ipucu}"
            </h2>
          </div>

          <div className="relative w-full flex justify-center">
            <div
              ref={tahtaRef}
              className="w-full"
              style={tahtaStili}
            >
            {goruntulenenHarfler.map((harf, index) => {
              let kutuRengi =
                "bg-white/5 border border-white/10 backdrop-blur-md";
              let yaziRengi = "text-white";
              let animasyonClass = "";

              if (soruDurumu === "dogru") {
                kutuRengi = adrenalinAktif
                  ? "bg-purple-500/20 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                  : "bg-emerald-500/20 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]";
                yaziRengi = adrenalinAktif
                  ? "text-purple-300"
                  : "text-emerald-300";
              } else if (soruDurumu === "yanlis") {
                kutuRengi =
                  "bg-rose-500/20 border-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.3)]";
                yaziRengi = "text-rose-300";
              } else if (alinanHarfler.includes(index)) {
                kutuRengi =
                  "bg-cyan-500/20 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]";
                yaziRengi = "text-cyan-300";
              } else if (index === aktifKutuIndeksi && cevapModu) {
                kutuRengi = `bg-white/10 border border-white/30 ${adrenalinAktif ? "shadow-[0_0_30px_rgba(168,85,247,0.2)]" : "shadow-[0_0_30px_rgba(255,255,255,0.1)]"}`;
                animasyonClass = "animate-pulse transform scale-105";
              }

              return (
                <div
                  key={index}
                  style={kutuBoyu}
                  className={`min-w-0 rounded-2xl flex items-center justify-center transition-all duration-300 ${kutuRengi} ${animasyonClass}`}
                >
                  <span
                    className={`font-black leading-none ${yaziRengi} ${harfSayisi >= 9 ? "text-lg sm:text-4xl md:text-5xl" : "text-2xl sm:text-4xl md:text-5xl lg:text-6xl"}`}
                  >
                    {harf}
                  </span>
                </div>
              );
            })}
            </div>
            <input
              id="gizli-input"
              ref={gizliInputRef}
              type="text"
              value={yazilanKelime}
              onChange={(e) => inputDegisti(e.target.value)}
              onBlur={() => {
                if (
                  cikisIsteniyor.current ||
                  !cevapModu ||
                  soruDurumu ||
                  !dokunmatik ||
                  easterEggAktif
                )
                  return;
                cevapInputunuOdakla();
              }}
              className={
                cevapModu && dokunmatik && !soruDurumu
                  ? "wordi-cevap-input"
                  : "absolute opacity-0 pointer-events-none w-px h-px overflow-hidden"
              }
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              autoCapitalize="characters"
              enterKeyHint="done"
              lang="tr"
              inputMode="text"
              aria-label="Cevap"
              tabIndex={cevapModu ? 0 : -1}
            />
          </div>

          {!cevapModu && (
            <div className="w-full flex justify-center lg:hidden mb-4 z-10">
              <div className="bg-white/10 text-white border border-white/30 px-5 py-2.5 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-lg backdrop-blur-md mt-8">
                * Cevap moduna geçmeden klavye kilitlidir
              </div>
            </div>
          )}
        </main>

        {!klavyeAcik && (
        <footer className="w-full flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 sm:gap-6 z-10 shrink-0">
          <div className="flex flex-col bg-white/5 border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-md w-full sm:w-auto text-center sm:text-left">
            <span className="text-[10px] tracking-widest text-neutral-400 uppercase mb-1">
              Masa Ödülü
            </span>
            <span className="masa-puani-anim text-3xl sm:text-5xl font-black text-white">
              {adrenalinAktif ? Math.floor(masaPuani * 1.5) : masaPuani}
            </span>
          </div>

          {!cevapModu ? (
            <div className="flex gap-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  harfAl();
                }}
                disabled={
                  masaPuani <= 0 ||
                  alinanHarfler.length === kelime?.length ||
                  soruDurumu
                }
                className="flex-1 sm:flex-none px-4 sm:px-8 py-4 sm:py-6 rounded-2xl font-black bg-white/10 text-white border border-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-30 disabled:active:scale-100 transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-xs sm:text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
              >
                İPUCU AL{" "}
                <span className="opacity-40 font-mono text-[10px] sm:text-xs font-normal border border-white/20 px-2 py-0.5 rounded">
                  [SPACE]
                </span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cevaplamaModunaGec();
                  cevapInputunuOdakla();
                }}
                disabled={soruDurumu}
                className="flex-1 sm:flex-none px-4 sm:px-10 py-4 sm:py-6 rounded-2xl font-black bg-emerald-500 text-black hover:bg-emerald-400 active:scale-95 disabled:opacity-30 disabled:active:scale-100 transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-xs sm:text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
              >
                CEVAPLA{" "}
                <span className="opacity-60 font-mono text-[10px] sm:text-xs font-normal border border-black/20 px-2 py-0.5 rounded">
                  [ENTER]
                </span>
              </button>
            </div>
          ) : (
            <div className="w-full sm:w-auto bg-rose-500/10 border border-rose-500/30 px-8 py-5 rounded-2xl flex items-center justify-center animate-pulse">
              <span className="text-rose-400 font-bold tracking-widest text-sm uppercase">
                Klavye Aktif - Yazmaya Başlayın
              </span>
            </div>
          )}
        </footer>
        )}
      </div>
    );
  }

  return (
    <div
      className={`wordi-root ${inceImlec ? "wordi-custom-cursor" : ""}`}
    >
      {inceImlec && (
        <div
          ref={cursorRef}
          className="wordi-cursor fixed top-0 left-0 w-3 h-3 bg-cyan-400 rounded-full pointer-events-none z-[100] shadow-[0_0_15px_rgba(34,211,238,0.8)]"
        />
      )}
      {icerik}
    </div>
  );
}

export default App;
