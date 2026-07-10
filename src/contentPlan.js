export const channels = ["tiktok", "instagram_reels", "youtube_shorts"];

export const persona = {
  name: "Pegi",
  voice: "hangat, rakyat, sedikit jenaka, Bahasa Indonesia natural",
  audience: "Indonesia umum, 16+, pengguna transportasi online dan calon driver",
  cta: "Download Pegilagi"
};

export const pillars = [
  {
    id: "uangmu-ke-mana",
    title: "Uangmu Ke Mana?",
    weight: 20,
    stage: "awareness",
    hookType: "transparency",
    emotionalLever: "fairness",
    template: ({ fare, driverTake }) => [
      `Pernah mikir uang ongkos kamu larinya ke mana?`,
      `Di Pegilagi, kalau perjalananmu ${fare}, 100% tarif perjalanan masuk ke driver: ${driverTake}.`,
      `Buat kamu tetap hemat. Buat ojol, hasil kerja terasa utuh.`,
      `Pilih yang murah, pilih yang adil. Download Pegilagi.`
    ]
  },
  {
    id: "ojol-dapat-100",
    title: "Ojol Dapat 100%",
    weight: 15,
    stage: "proof",
    hookType: "driver-pov",
    emotionalLever: "empathy",
    template: ({ fare }) => [
      `Buat sebagian orang, satu order cuma angka kecil.`,
      `Buat driver, ${fare} bisa jadi bensin, makan siang, atau bekal pulang.`,
      `Pegilagi dibuat supaya tarif perjalanan masuk 100% untuk driver.`,
      `Naik lebih hemat, bantu ojol lebih kuat. Download Pegilagi.`
    ]
  },
  {
    id: "lebih-murah-tanpa-jahat",
    title: "Lebih Murah Tanpa Jahat",
    weight: 20,
    stage: "download",
    hookType: "price",
    emotionalLever: "smart-saving",
    template: ({ saving }) => [
      `Murah itu enak. Tapi murah yang adil itu lebih enak.`,
      `Pegilagi dibuat agar pengguna bisa lebih hemat sampai estimasi ${saving} per minggu.`,
      `Bedanya, tarif perjalanan tetap 100% untuk driver.`,
      `Kalau bisa hemat tanpa mengorbankan ojol, kenapa tidak? Download Pegilagi.`
    ]
  },
  {
    id: "mitos-ojol-murah",
    title: "Mitos Ojol Murah",
    weight: 10,
    stage: "proof",
    hookType: "myth",
    emotionalLever: "curiosity",
    template: () => [
      `Mitos: ojek online murah pasti bikin driver tekor.`,
      `Faktanya, masalahnya bukan cuma harga. Masalahnya potongan.`,
      `Pegilagi mengambil posisi sederhana: tarif perjalanan 100% untuk driver.`,
      `Lebih transparan untuk kamu, lebih lega untuk ojol. Download Pegilagi.`
    ]
  },
  {
    id: "tantangan-7-hari",
    title: "Tantangan 7 Hari Naik Pegilagi",
    weight: 10,
    stage: "download",
    hookType: "challenge",
    emotionalLever: "gamification",
    template: ({ saving, driverTake }) => [
      `Coba tantangan 7 hari naik Pegilagi.`,
      `Catat berapa kamu hemat. Catat juga berapa yang masuk utuh ke driver.`,
      `Target minggu ini: hemat ${saving}, bantu driver terima 100% tarif perjalanan, mulai dari contoh ${driverTake}.`,
      `Mulai dari perjalanan berikutnya. Download Pegilagi.`
    ]
  },
  {
    id: "cerita-jalanan-indonesia",
    title: "Cerita Jalanan Indonesia",
    weight: 10,
    stage: "awareness",
    hookType: "slice-of-life",
    emotionalLever: "familiarity",
    template: () => [
      `Hujan turun, jalan padat, order kecil tetap diambil.`,
      `Di balik jaket ojol, ada orang yang sedang ngejar cukup untuk hari ini.`,
      `Pegilagi ingin perjalanan murah tetap punya rasa hormat: 100% tarif perjalanan untuk driver.`,
      `Karena kota bergerak bukan cuma oleh aplikasi, tapi oleh orangnya. Download Pegilagi.`
    ]
  },
  {
    id: "gerakan-pilih-adil",
    title: "Gerakan Pilih Adil",
    weight: 15,
    stage: "awareness",
    hookType: "manifesto",
    emotionalLever: "moral-identity",
    template: () => [
      `Ini bukan soal melawan siapa-siapa.`,
      `Ini soal memilih layanan yang hemat untuk penumpang dan 100% tarif perjalanan untuk driver.`,
      `Pegilagi berdiri di tengah: murah, transparan, dan pro orang kerja.`,
      `Kalau kamu setuju, mulai dari satu perjalanan. Download Pegilagi.`
    ]
  }
];

export const safetyRules = {
  bannedTerms: ["gojek lebih buruk", "grab lebih buruk", "anak-anak", "di bawah 16"],
  requiredClaims: ["100% untuk driver", "Download Pegilagi"],
  claimNote: "Gunakan klaim tegas tapi aman: 100% tarif perjalanan untuk driver; dibuat agar pengguna bisa lebih hemat."
};
