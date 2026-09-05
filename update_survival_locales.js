import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Manually specify the exact set of phrases
const phraseMeanings = [
  "Welcome",
  "How are you?",
  "Thank you",
  "Please",
  "How much?",
  "Good morning / How are you?",
  "What's happening?",
  "I am fine",
  "No problem",
  "Hello",
  "Speak English?",
  "Good morning",
  "Excuse me",
  "Where is the bathroom?",
  "The bill, please",
  "Do you speak English?",
  "Delicious",
  "Hello / Goodbye",
  "Very delicious",
  "Thanks / Goodbye",
  "Friend",
  "Great / Awesome",
  "Excuse me / Apologies",
  "Thank you (Male/Female)",
  "How are you? / All good?",
  "How are you? (Informal)",
  "Thank you (Yoruba)",
  "Thank you (Igbo)",
  "Hello (Hausa)",
  "I am fine / I am here"
];

// 2. Generate generic translations for each language
const getTranslations = (lang) => {
  const dict = {};
  
  const translations = {
    'es': { 'welcome': 'Bienvenido', 'how are you?': '¿Cómo estás?', 'thank you': 'Gracias', 'please': 'Por favor', 'how much?': '¿Cuánto cuesta?', 'good morning': 'Buenos días', 'hello': 'Hola', 'excuse me': 'Perdón', 'where is the bathroom?': '¿Dónde está el baño?', 'delicious': 'Delicioso', 'friend': 'Amigo', 'the bill, please': 'La cuenta, por favor' },
    'fr': { 'welcome': 'Bienvenue', 'how are you?': 'Comment ça va ?', 'thank you': 'Merci', 'please': "S'il vous plaît", 'how much?': "Combien ça coûte ?", 'good morning': 'Bonjour', 'hello': 'Bonjour', 'excuse me': 'Excusez-moi', 'where is the bathroom?': 'Où sont les toilettes ?', 'delicious': 'Délicieux', 'friend': 'Ami', 'the bill, please': "L'addition, s'il vous plaît" },
    'de': { 'welcome': 'Willkommen', 'how are you?': 'Wie geht es dir?', 'thank you': 'Danke', 'please': 'Bitte', 'how much?': 'Wie viel?', 'good morning': 'Guten Morgen', 'hello': 'Hallo', 'excuse me': 'Entschuldigung', 'where is the bathroom?': 'Wo ist die Toilette?', 'delicious': 'Lecker', 'friend': 'Freund', 'the bill, please': 'Die Rechnung, bitte' },
    'it': { 'welcome': 'Benvenuto', 'how are you?': 'Come stai?', 'thank you': 'Grazie', 'please': 'Per favore', 'how much?': 'Quanto costa?', 'good morning': 'Buongiorno', 'hello': 'Ciao', 'excuse me': 'Mi scusi', 'where is the bathroom?': "Dov'è il bagno?", 'delicious': 'Delizioso', 'friend': 'Amico', 'the bill, please': 'Il conto, per favore' },
    'pt': { 'welcome': 'Bem-vindo', 'how are you?': 'Como vai?', 'thank you': 'Obrigado(a)', 'please': 'Por favor', 'how much?': 'Quanto custa?', 'good morning': 'Bom dia', 'hello': 'Olá', 'excuse me': 'Com licença', 'where is the bathroom?': 'Onde fica o banheiro?', 'delicious': 'Delicioso', 'friend': 'Amigo', 'the bill, please': 'A conta, por favor' },
    'jp': { 'welcome': 'ようこそ', 'how are you?': 'お元気ですか？', 'thank you': 'ありがとう', 'please': 'お願いします', 'how much?': 'いくらですか？', 'good morning': 'おはようございます', 'hello': 'こんにちは', 'excuse me': 'すみません', 'where is the bathroom?': 'トイレはどこですか？', 'delicious': '美味しい', 'friend': '友達', 'the bill, please': 'お会計をお願いします' }
  };

  const fallbacks = translations[lang] || {};

  phraseMeanings.forEach(m => {
    const key = m.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Fuzzy matching for complex strings
    let tText = m;
    for (const [base, target] of Object.entries(fallbacks)) {
      if (m.toLowerCase().includes(base)) {
        tText = target;
        break;
      }
    }
    dict[key] = tText;
  });
  
  return dict;
};

const localesDir = path.join(__dirname, 'client', 'src', 'locales');
const folders = fs.readdirSync(localesDir);

folders.forEach(folder => {
  const filePath = path.join(localesDir, folder, 'translation.json');
  if (!fs.existsSync(filePath)) return;
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.survival) data.survival = {};
    
    const translatedDict = getTranslations(folder);
    
    if (folder === 'en') {
      phraseMeanings.forEach(m => {
        data.survival[m.toLowerCase().replace(/[^a-z0-9]/g, '_')] = m;
      });
    } else {
      phraseMeanings.forEach(m => {
        const key = m.toLowerCase().replace(/[^a-z0-9]/g, '_');
        data.survival[key] = translatedDict[key];
      });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Successfully patched survival phrases into ${folder}/translation.json`);
  } catch (err) {
    console.error(`Failed to patch ${folder}:`, err.message);
  }
});
