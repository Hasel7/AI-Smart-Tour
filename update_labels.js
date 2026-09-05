import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const translations = {
  en: { essential_phrases: 'Essential Phrases', etiquette: 'Etiquette', local_survival_guide: 'Local Survival Guide' },
  es: { essential_phrases: 'Frases Esenciales', etiquette: 'Etiqueta', local_survival_guide: 'Guía de Supervivencia Local' },
  fr: { essential_phrases: 'Phrases Essentielles', etiquette: 'Étiquette', local_survival_guide: 'Guide de Survie Local' },
  de: { essential_phrases: 'Wichtige Phrasen', etiquette: 'Etikette', local_survival_guide: 'Lokaler Reiseführer' },
  it: { essential_phrases: 'Frasi Essenziali', etiquette: 'Etichetta', local_survival_guide: 'Guida Locale di Sopravvivenza' },
  pt: { essential_phrases: 'Frases Essenciais', etiquette: 'Etiqueta', local_survival_guide: 'Guia Local de Sobrevivência' },
  jp: { essential_phrases: '必須フレーズ', etiquette: 'エチケット', local_survival_guide: 'ローカルサバイバルガイド' }
};

const localesDir = path.join(__dirname, 'client', 'src', 'locales');
fs.readdirSync(localesDir).forEach(folder => {
  const filePath = path.join(localesDir, folder, 'translation.json');
  if (!fs.existsSync(filePath) || !translations[folder]) return;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!data.survival) data.survival = {};
  Object.assign(data.survival, translations[folder]);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Patched labels: ' + folder);
});

console.log('Done!');
