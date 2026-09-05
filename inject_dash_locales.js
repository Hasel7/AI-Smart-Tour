const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'client/src/locales');
const languages = ['en', 'es', 'fr', 'pt', 'de', 'it', 'jp'];

const injectedData = {
  en: {
    saved: {
      your_collection: "Your Collection",
      loading: "Loading your favorites..."
    }
  },
  es: {
    saved: {
      your_collection: "Tu Colección",
      loading: "Cargando tus favoritos..."
    }
  },
  fr: {
    saved: {
      your_collection: "Votre Collection",
      loading: "Chargement de vos favoris..."
    }
  },
  pt: {
    saved: {
      your_collection: "Sua Coleção",
      loading: "Carregando seus favoritos..."
    }
  },
  de: {
    saved: {
      your_collection: "Deine Sammlung",
      loading: "Lade deine Favoriten..."
    }
  },
  it: {
    saved: {
      your_collection: "La Tua Collezione",
      loading: "Caricamento preferiti..."
    }
  },
  jp: {
    saved: {
      your_collection: "あなたのコレクション",
      loading: "お気に入りを読み込み中..."
    }
  }
};

languages.forEach(lang => {
  const filePath = path.join(localesDir, lang, 'translation.json');
  if (fs.existsSync(filePath)) {
    const rawData = fs.readFileSync(filePath);
    let jsonData = JSON.parse(rawData);
    
    // Check if saved exists
    if (!jsonData.saved) jsonData.saved = {};
    
    jsonData.saved = { ...jsonData.saved, ...injectedData[lang].saved };
    
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
    console.log(`Updated ${lang} saved places completely.`);
  }
});
