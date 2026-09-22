import { useState, useEffect, useCallback, useRef } from "react";

export const ADRENALIN_ESIK = 2;
export const TR_HARF = "a-zA-ZçğıöşüÇĞIİÖŞÜı";
const TR_HARF_TEK = new RegExp(`^[${TR_HARF}]$`);
const TR_HARF_DISI = new RegExp(`[^${TR_HARF}]`, "g");

const getGunlukSeed = () => {
  const bugun = new Date();
  return (
    bugun.getFullYear() * 10000 + (bugun.getMonth() + 1) * 100 + bugun.getDate()
  );
};

const rastgeleSeedIle = (seed) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const soruDosyasi = () => `${import.meta.env.BASE_URL}questions.json`;

export const useWordiGame = () => {
  const [tumSorular, setTumSorular] = useState([]);
  const [verilerYuklendi, setVerilerYuklendi] = useState(false);
  const [veriHatasi, setVeriHatasi] = useState(false);
  const [ekranDurumu, setEkranDurumu] = useState("menu");
  const [oyunModu, setOyunModu] = useState("gunluk");

  const [oyunSorulari, setOyunSorulari] = useState([]);
  const [mevcutSoruIndeks, setMevcutSoruIndeks] = useState(0);
  const [toplamPuan, setToplamPuan] = useState(0);

  const [sure, setSureState] = useState(240);
  const sureRef = useRef(240);

  const aktifSoru = oyunSorulari[mevcutSoruIndeks] || { cevap: "", ipucu: "" };
  const kelime = aktifSoru.cevap || "";
  const ipucu = aktifSoru.ipucu || "";

  const [alinanHarfler, setAlinanHarfler] = useState([]);
  const [yazilanKelime, setYazilanKelime] = useState("");
  const [masaPuani, setMasaPuani] = useState(0);
  const [soruDurumu, setSoruDurumu] = useState(null);

  const [cevapModu, setCevapModu] = useState(false);
  const [cevapSuresi, setCevapSuresi] = useState(10);

  const [kombo, setKombo] = useState(0);
  const [istatistik, setIstatistik] = useState({
    maxKombo: 0,
    ipucuKullanimi: 0,
    enHizliSaniye: 999,
  });
  const [dogruCevapSayisi, setDogruCevapSayisi] = useState(0);

  const soruBaslangicZamaniRef = useRef(Date.now());
  const isCheckingRef = useRef(false);
  const cooldownRef = useRef(false);
  const timerlerRef = useRef([]);
  const cevapModuRef = useRef(false);
  const soruDurumuRef = useRef(null);
  const ekranDurumuRef = useRef("menu");
  const wordiGecmisiRef = useRef(false);
  const sonSorularRef = useRef([]);
  const cevapKontrolEtRef = useRef(() => {});
  const yuklemeAbortRef = useRef(null);

  cevapModuRef.current = cevapModu;
  soruDurumuRef.current = soruDurumu;
  ekranDurumuRef.current = ekranDurumu;

  const [easterEggAktif, setEasterEggAktif] = useState(false);
  const [easterEggBulundu, setEasterEggBulundu] = useState(false);

  const titret = useCallback((pattern) => {
    if (typeof navigator !== "undefined" && navigator.vibrate)
      navigator.vibrate(pattern);
  }, []);

  const timerleriTemizle = useCallback(() => {
    timerlerRef.current.forEach(clearTimeout);
    timerlerRef.current = [];
  }, []);

  const zamanla = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timerlerRef.current.push(id);
    return id;
  }, []);

  const sorulariYukle = useCallback(() => {
    yuklemeAbortRef.current?.abort();
    const ac = new AbortController();
    yuklemeAbortRef.current = ac;
    setVeriHatasi(false);
    setVerilerYuklendi(false);
    fetch(soruDosyasi(), { signal: ac.signal })
      .then((res) => {
        if (!res.ok) throw new Error("yukleme");
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("format");
        }
        setTumSorular(data);
        setVerilerYuklendi(true);
        setVeriHatasi(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error(err);
        setVeriHatasi(true);
        setVerilerYuklendi(false);
      });
  }, []);

  useEffect(() => {
    sorulariYukle();
    return () => yuklemeAbortRef.current?.abort();
  }, [sorulariYukle]);

  const rastgeleSoruSec = useCallback(() => {
    if (!tumSorular.length) return null;
    const son = sonSorularRef.current;
    const havuz = tumSorular.filter((s) => !son.includes(s));
    const kaynak = havuz.length ? havuz : tumSorular;
    const secilen = kaynak[Math.floor(Math.random() * kaynak.length)];
    sonSorularRef.current = [...son, secilen].slice(-12);
    return secilen;
  }, [tumSorular]);

  useEffect(() => {
    if (kelime && ekranDurumu === "oyun") {
      setYazilanKelime("");
      setAlinanHarfler([]);
      setMasaPuani(kelime.length * 100);
      setSoruDurumu(null);
      setCevapModu(false);
      setCevapSuresi(10);
      isCheckingRef.current = false;
      soruBaslangicZamaniRef.current = Date.now();

      cooldownRef.current = true;
      zamanla(() => {
        cooldownRef.current = false;
      }, 400);
    }
  }, [kelime, mevcutSoruIndeks, ekranDurumu, zamanla]);

  useEffect(() => {
    if (ekranDurumu !== "oyun") return undefined;
    const zamanlayici = setInterval(() => {
      if (cevapModuRef.current || soruDurumuRef.current) return;
      if (sureRef.current <= 1) {
        clearInterval(zamanlayici);
        setSoruDurumu("zamanDoldu");
        sureRef.current = 0;
        setSureState(0);
        zamanla(() => setEkranDurumu("bitti"), 2000);
      } else {
        sureRef.current -= 1;
        setSureState(sureRef.current);
      }
    }, 1000);
    return () => clearInterval(zamanlayici);
  }, [ekranDurumu, zamanla]);

  const menuyeDon = useCallback(
    (kaynak = "ui") => {
      timerleriTemizle();
      cooldownRef.current = false;
      isCheckingRef.current = false;
      setEasterEggAktif(false);
      setEkranDurumu("menu");
      sureRef.current = 0;
      setSureState(0);
      setSoruDurumu(null);
      setCevapModu(false);
      if (kaynak === "ui" && wordiGecmisiRef.current) {
        wordiGecmisiRef.current = false;
        window.history.back();
      } else {
        wordiGecmisiRef.current = false;
      }
    },
    [timerleriTemizle],
  );

  useEffect(() => {
    const onPop = () => {
      wordiGecmisiRef.current = false;
      if (ekranDurumuRef.current !== "menu") menuyeDon("pop");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [menuyeDon]);

  const oyunuSifirla = useCallback(() => {
    timerleriTemizle();
    setToplamPuan(0);
    setMevcutSoruIndeks(0);
    setKombo(0);
    setDogruCevapSayisi(0);
    setIstatistik({ maxKombo: 0, ipucuKullanimi: 0, enHizliSaniye: 999 });
    setEasterEggBulundu(false);
    setEasterEggAktif(false);
    isCheckingRef.current = false;
    cooldownRef.current = false;
  }, [timerleriTemizle]);

  const oyunGecmisiAc = () => {
    if (!wordiGecmisiRef.current) {
      window.history.pushState({ wordi: true }, "");
      wordiGecmisiRef.current = true;
    }
  };

  const gunlukOyunBaslat = useCallback(() => {
    if (!tumSorular.length) return;
    const secilenSorular = [];
    let seed = getGunlukSeed();
    [4, 4, 5, 5, 6, 6, 7, 8, 9, 10].forEach((harfSayisi) => {
      const uygunSorular = tumSorular.filter(
        (s) => s.cevap.length === harfSayisi && !secilenSorular.includes(s),
      );
      if (uygunSorular.length > 0) {
        seed++;
        secilenSorular.push(
          uygunSorular[Math.floor(rastgeleSeedIle(seed) * uygunSorular.length)],
        );
      }
    });
    if (!secilenSorular.length) return;
    setOyunModu("gunluk");
    setOyunSorulari(secilenSorular);
    oyunuSifirla();
    sureRef.current = 240;
    setSureState(240);
    oyunGecmisiAc();
    setEkranDurumu("oyun");
  }, [tumSorular, oyunuSifirla]);

  const serbestOyunBaslat = useCallback(
    (dakika) => {
      sonSorularRef.current = [];
      const rastgeleIlkSoru = rastgeleSoruSec();
      if (!rastgeleIlkSoru) return;
      setOyunModu("serbest");
      setOyunSorulari([rastgeleIlkSoru]);
      oyunuSifirla();
      sureRef.current = dakika * 60;
      setSureState(dakika * 60);
      oyunGecmisiAc();
      setEkranDurumu("oyun");
    },
    [rastgeleSoruSec, oyunuSifirla],
  );

  const cevaplamaModunaGec = useCallback(() => {
    if (soruDurumu || isCheckingRef.current || cooldownRef.current || cevapModu)
      return;
    titret([20, 20]);
    setCevapModu(true);
  }, [soruDurumu, cevapModu, titret]);

  const cevapKontrolEt = useCallback(
    (verilenCevap, iflasSebebi = null) => {
      if (soruDurumu || isCheckingRef.current) return;
      isCheckingRef.current = true;

      if (!iflasSebebi && verilenCevap === kelime) {
        setSoruDurumu("dogru");
        titret([30, 50, 30]);
        setDogruCevapSayisi((prev) => prev + 1);

        const saniye = (Date.now() - soruBaslangicZamaniRef.current) / 1000;
        let kazanilan = masaPuani;
        if (kombo >= ADRENALIN_ESIK) kazanilan = Math.floor(masaPuani * 1.5);

        setToplamPuan((prev) => prev + kazanilan);
        const yeniKombo = kombo + 1;
        setKombo(yeniKombo);
        setIstatistik((prev) => ({
          ...prev,
          maxKombo: Math.max(prev.maxKombo, yeniKombo),
          enHizliSaniye: Math.min(prev.enHizliSaniye, saniye),
        }));
      } else {
        setSoruDurumu("yanlis");
        titret([50, 50, 50, 50, 50]);

        if (iflasSebebi !== "ipucu") {
          setToplamPuan((prev) => prev - masaPuani);
        }

        setMasaPuani(0);
        setAlinanHarfler(kelime.split("").map((_, i) => i));
        setKombo(0);
      }

      zamanla(() => {
        if (sureRef.current <= 0 || ekranDurumuRef.current !== "oyun") return;
        if (oyunModu === "gunluk") {
          setMevcutSoruIndeks((prev) => {
            if (prev < oyunSorulari.length - 1) return prev + 1;
            setEkranDurumu("bitti");
            return prev;
          });
        } else {
          const yeniRastgeleSoru = rastgeleSoruSec();
          if (!yeniRastgeleSoru) {
            setEkranDurumu("bitti");
            return;
          }
          setOyunSorulari((prev) => [...prev, yeniRastgeleSoru]);
          setMevcutSoruIndeks((prev) => prev + 1);
        }
      }, 1800);
    },
    [
      kelime,
      masaPuani,
      soruDurumu,
      oyunModu,
      oyunSorulari.length,
      kombo,
      titret,
      zamanla,
      rastgeleSoruSec,
    ],
  );

  cevapKontrolEtRef.current = cevapKontrolEt;

  useEffect(() => {
    if (ekranDurumu !== "oyun" || !cevapModu || soruDurumu) return undefined;
    const cevapZamanlayici = setInterval(() => {
      setCevapSuresi((prev) => {
        if (prev <= 1) {
          clearInterval(cevapZamanlayici);
          cevapKontrolEtRef.current("", "zaman");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cevapZamanlayici);
  }, [ekranDurumu, cevapModu, soruDurumu]);

  const harfAl = useCallback(() => {
    if (
      cevapModu ||
      masaPuani <= 0 ||
      alinanHarfler.length === kelime.length ||
      soruDurumu ||
      isCheckingRef.current ||
      cooldownRef.current
    )
      return;

    titret(10);
    const kapaliKutular = [];
    for (let i = 0; i < kelime.length; i++) {
      if (!alinanHarfler.includes(i)) kapaliKutular.push(i);
    }

    setIstatistik((prev) => ({
      ...prev,
      ipucuKullanimi: prev.ipucuKullanimi + 1,
    }));

    if (kapaliKutular.length === 1) {
      setToplamPuan((prev) => prev - 100);
      setMasaPuani(0);
      setAlinanHarfler((prev) => [...prev, kapaliKutular[0]]);
      cevapKontrolEt("", "ipucu");
      return;
    }

    const rastgeleIndeks =
      kapaliKutular[Math.floor(Math.random() * kapaliKutular.length)];

    setToplamPuan((prev) => prev - 100);
    setMasaPuani((prev) => prev - 100);
    setAlinanHarfler((prev) => [...prev, rastgeleIndeks]);
    setKombo(0);
  }, [
    alinanHarfler,
    kelime,
    masaPuani,
    soruDurumu,
    cevapModu,
    titret,
    cevapKontrolEt,
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        ekranDurumu !== "oyun" ||
        soruDurumu ||
        isCheckingRef.current ||
        !kelime ||
        easterEggAktif ||
        cooldownRef.current
      )
        return;

      if (!cevapModu) {
        if (e.key === " ") {
          e.preventDefault();
          harfAl();
        } else if (e.key === "Enter") {
          e.preventDefault();
          cevaplamaModunaGec();
        }
        return;
      }

      const gizliInput = document.getElementById("gizli-input");
      if (gizliInput && document.activeElement !== gizliInput) {
        if (e.key === "Backspace") {
          setYazilanKelime((prev) => prev.slice(0, -1));
        } else if (TR_HARF_TEK.test(e.key)) {
          setYazilanKelime((prev) => {
            if (prev.length < kelime.length)
              return prev + e.key.toLocaleUpperCase("tr-TR");
            return prev;
          });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    ekranDurumu,
    soruDurumu,
    kelime,
    harfAl,
    easterEggAktif,
    cevapModu,
    cevaplamaModunaGec,
  ]);

  useEffect(() => {
    if (
      !kelime ||
      soruDurumu ||
      isCheckingRef.current ||
      easterEggAktif ||
      !cevapModu
    )
      return;

    let guncelCevap = "";
    let yazIndeks = 0;
    let kutularTamamenDolu = true;

    for (let i = 0; i < kelime.length; i++) {
      if (alinanHarfler.includes(i)) {
        guncelCevap += kelime[i];
      } else {
        if (yazIndeks < yazilanKelime.length) {
          guncelCevap += yazilanKelime[yazIndeks];
          yazIndeks++;
        } else {
          kutularTamamenDolu = false;
          break;
        }
      }
    }

    if (kutularTamamenDolu) {
      if (
        yazilanKelime === "VEDAT" &&
        kelime.length === 5 &&
        !easterEggBulundu
      ) {
        setEasterEggBulundu(true);
        setEasterEggAktif(true);
        setToplamPuan((p) => p + 1000);
        titret([100, 50, 100, 50, 200]);
        zamanla(() => {
          setEasterEggAktif(false);
          setYazilanKelime("");
        }, 3500);
        return;
      }
      cevapKontrolEt(guncelCevap, null);
    }
  }, [
    yazilanKelime,
    alinanHarfler,
    kelime,
    soruDurumu,
    easterEggAktif,
    easterEggBulundu,
    cevapModu,
    cevapKontrolEt,
    titret,
    zamanla,
  ]);

  const inputDegisti = useCallback(
    (yeniMetin) => {
      if (
        soruDurumu ||
        isCheckingRef.current ||
        easterEggAktif ||
        cooldownRef.current ||
        !cevapModu
      )
        return;
      const sadeceHarfler = yeniMetin.replace(TR_HARF_DISI, "");
      const temizMetin = sadeceHarfler
        .toLocaleUpperCase("tr-TR")
        .slice(0, kelime.length);
      setYazilanKelime(temizMetin);
    },
    [kelime?.length, soruDurumu, easterEggAktif, cevapModu],
  );

  return {
    verilerYuklendi,
    veriHatasi,
    sorulariYukle,
    ekranDurumu,
    oyunModu,
    aktifSoru: { kelime, ipucu },
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
  };
};
