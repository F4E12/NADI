import { normaliseSymptoms, type SymptomExtractor } from "./extractor";

const TRIGGERS: Record<string, string[]> = {
  "Sesak napas": ["sesak", "susah bernapas", "sulit bernapas", "napas berat"],
  "Nyeri dada": ["nyeri dada", "sakit dada", "dada sakit", "nyeri di dada"],
  "Keringat dingin": ["keringat dingin"],
  Dehidrasi: ["dehidrasi", "kekurangan cairan"],
  "Diare berat": ["diare", "mencret", "berak cair", "buang air terus"],
  Kejang: ["kejang"],
  "Penurunan kesadaran": ["pingsan", "tidak sadar", "tak sadarkan", "hilang kesadaran"],
  "Perdarahan hebat": ["perdarahan", "pendarahan", "berdarah banyak"],
  "Demam tinggi": ["demam", "panas tinggi", "meriang", "badan panas"],
  "Muntah berulang": ["muntah", "muntah-muntah"],
  Pusing: ["pusing", "kepala berputar", "kliyengan"],
  Lemas: ["lemas", "lemah", "letih", "loyo"],
  "Nyeri perut": ["nyeri perut", "sakit perut", "perut sakit", "mulas"],
  "Luka terbuka": ["luka", "robek", "sayatan", "tergores"],
  Batuk: ["batuk"],
  Pilek: ["pilek", "hidung meler", "ingusan", "hidung tersumbat"],
  "Sakit tenggorokan": ["tenggorokan", "sakit menelan", "nyeri menelan"],
  "Sakit kepala ringan": ["sakit kepala", "pening", "nyeri kepala"],
  "Ruam kulit": ["ruam", "gatal", "bentol", "bintik merah"],
  "Nafsu makan menurun": ["nafsu makan", "tidak mau makan", "tidak nafsu", "susah makan"],
};

export const keywordExtractor: SymptomExtractor = {
  name: "Pencocokan kata kunci (bukan model)",
  isModel: false,
  isAvailable: async () => true,
  extract: async (freeText) => {
    const text = freeText.toLowerCase();
    const hits: string[] = [];
    for (const [label, triggers] of Object.entries(TRIGGERS)) {
      if (triggers.some((t) => text.includes(t))) hits.push(label);
    }
    return normaliseSymptoms(hits);
  },
};
