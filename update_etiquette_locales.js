import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapping from the key suffix (first 30 chars of lowercase english) to each language's proper translation
// Key is derived from: "etiquette_" + text.toLowerCase().replace(/[^a-z0-9]/g,'_').substring(0,30).replace(/_+/g,'_').replace(/_$/,'')
const properTranslations = {
  es: {
    etiquette_tipping_is_typically_5_10_br: "La propina es del 5-10%. Lleva efectivo en cafeterías pequeñas.",
    etiquette_always_wait_for_the_pedestrian: "Siempre espera el semáforo verde peatonal (Ampelmännchen) antes de cruzar.",
    etiquette_sunday_is_a_day_of_rest_ruhet: "El domingo es día de descanso (Ruhetag); la mayoría de las tiendas estarán cerradas.",
    etiquette_always_make_direct_eye_contact: "Haz contacto visual directo al brindar y decir 'Prost' con tus copas.",
    etiquette_service_is_included_service_c: "El servicio está incluido (service compris), pero dejar monedas es apreciado.",
    etiquette_always_distinctly_say_bonjour: "Siempre di claramente 'Bonjour' al entrar en una tienda o saludar al personal.",
    etiquette_avoid_raising_your_voice_in_pu: "Evita alzar la voz en el transporte público, cafés y restaurantes.",
    etiquette_tipping_is_generally_not_pract: "La propina generalmente no se practica y puede considerarse maleducado.",
    etiquette_bowing_is_the_standard_greetin: "Inclinarse es el saludo estándar; los apretones de manos son mucho menos comunes.",
    etiquette_always_remove_your_shoes_when: "Siempre quítate los zapatos al entrar en hogares, ryokans y espacios tradicionales.",
    etiquette_it_is_considered_highly_impoli: "Comer o beber mientras caminas por la calle se considera muy maleducado.",
    etiquette_a_service_charge_coperto_is: "Un cargo por servicio (coperto) generalmente se añade automáticamente a la cuenta.",
    etiquette_greetings_often_involve_a_kiss: "Los saludos a menudo implican un beso en ambas mejillas. Siempre empieza por la derecha.",
    etiquette_avoid_ordering_a_cappuccino_af: "Evita pedir un capuchino después de las 11 AM; se considera estrictamente una bebida de desayuno.",
    etiquette_dress_conservatively_when_visi: "Vístete de forma conservadora al visitar iglesias — hombros y rodillas cubiertos.",
    etiquette_lunch_is_typically_very_late: "El almuerzo suele ser muy tarde (2-4 PM) y la cena después de las 9 PM.",
    etiquette_tipping_5_10_is_customary_acr: "La propina del 5-10% es habitual en restaurantes y cafés, aunque no obligatoria.",
    etiquette_because_of_the_afternoon_siest: "Por la siesta (2-5 PM), muchas tiendas pequeñas cierran temporalmente.",
    etiquette_always_greet_elders_with_high: "Saluda siempre a los mayores con gran respeto, a menudo con una ligera reverencia.",
    etiquette_haggling_is_completely_expecte: "El regateo está completamente aceptado y es habitual en los mercados al aire libre.",
    etiquette_when_eating_local_traditional: "Al comer comidas tradicionales locales como 'swallow', usa solo la mano derecha.",
    etiquette_never_use_your_left_hand_to_gi: "Nunca uses la mano izquierda para dar o recibir objetos de otra persona.",
    etiquette_queueing_standing_in_line_is: "Hacer cola es un pilar cultural absoluto. Nunca te cueles en la fila.",
    etiquette_tipping_10_15_in_restaurants: "La propina del 10-15% en restaurantes es estándar salvo que indique 'servicio incluido'.",
    etiquette_when_using_escalators_especia: "En las escaleras mecánicas (especialmente en el Metro de Londres), permanece a la derecha.",
    etiquette_a_standard_10_service_charge: "Un cargo de servicio del 10% casi siempre está incluido en tu cuenta.",
    etiquette_brazilians_are_very_warm_and_o: "Los brasileños son muy cálidos y frecuentemente saludan con un abrazo o un beso en la mejilla.",
    etiquette_always_use_a_napkin_to_hold_fi: "Usa siempre una servilleta para sostener bocadillos o pizza — no comas con las manos directamente."
  },
  fr: {
    etiquette_tipping_is_typically_5_10_br: "Le pourboire est généralement de 5 à 10 %. Pensez à avoir du liquide dans les petits cafés.",
    etiquette_always_wait_for_the_pedestrian: "Attendez toujours le feu piéton vert (Ampelmännchen) avant de traverser la rue.",
    etiquette_sunday_is_a_day_of_rest_ruhet: "Le dimanche est un jour de repos (Ruhetag) ; la plupart des magasins et épiceries seront fermés.",
    etiquette_always_make_direct_eye_contact: "Faites toujours un contact visuel direct en trinquant et en disant 'Prost'.",
    etiquette_service_is_included_service_c: "Le service est inclus (service compris), mais laisser de la monnaie est apprécié.",
    etiquette_always_distinctly_say_bonjour: "Dites toujours clairement 'Bonjour' en entrant dans un magasin ou en saluant le personnel.",
    etiquette_avoid_raising_your_voice_in_pu: "Évitez d'élever la voix dans les transports en commun, les cafés et les restaurants.",
    etiquette_tipping_is_generally_not_pract: "Le pourboire n'est généralement pas d'usage et peut être perçu comme impoli.",
    etiquette_bowing_is_the_standard_greetin: "La révérence est la salutation standard ; les poignées de main sont beaucoup moins courantes.",
    etiquette_always_remove_your_shoes_when: "Retirez toujours vos chaussures en entrant dans des maisons, ryokans et espaces traditionnels.",
    etiquette_it_is_considered_highly_impoli: "Manger ou boire en marchant dans la rue est considéré très impoli.",
    etiquette_a_service_charge_coperto_is: "Des frais de service (coperto) sont généralement ajoutés automatiquement à la facture.",
    etiquette_greetings_often_involve_a_kiss: "Les salutations impliquent souvent une bise sur les deux joues. Commencez toujours par la droite.",
    etiquette_avoid_ordering_a_cappuccino_af: "Évitez de commander un cappuccino après 11 h ; c'est strictement une boisson du matin.",
    etiquette_dress_conservatively_when_visi: "Habillez-vous de façon conservatrice dans les églises — épaules et genoux couverts.",
    etiquette_lunch_is_typically_very_late: "Le déjeuner est généralement très tardif (14 h – 16 h) et le dîner souvent après 21 h.",
    etiquette_tipping_5_10_is_customary_acr: "Un pourboire de 5 à 10 % est courant dans les restaurants et cafés, sans être obligatoire.",
    etiquette_because_of_the_afternoon_siest: "En raison de la sieste (14 h – 17 h), de nombreuses petites boutiques ferment temporairement.",
    etiquette_always_greet_elders_with_high: "Saluez toujours les aînés avec grand respect, souvent accompagné d'une légère inclinaison.",
    etiquette_haggling_is_completely_expecte: "Le marchandage est tout à fait attendu et encouragé dans tous les marchés en plein air.",
    etiquette_when_eating_local_traditional: "En mangeant des plats traditionnels locaux comme le 'swallow', utilisez uniquement la main droite.",
    etiquette_never_use_your_left_hand_to_gi: "N'utilisez jamais la main gauche pour donner ou recevoir des objets à quelqu'un.",
    etiquette_queueing_standing_in_line_is: "Faire la queue est un pilier culturel absolu. Ne doublez jamais la file d'attente.",
    etiquette_tipping_10_15_in_restaurants: "Un pourboire de 10 à 15 % est très courant sauf si 'service compris' est indiqué.",
    etiquette_when_using_escalators_especia: "Dans les escaliers mécaniques (surtout dans le Tube de Londres), restez à droite.",
    etiquette_a_standard_10_service_charge: "Des frais de service de 10 % sont presque toujours inclus dans votre addition.",
    etiquette_brazilians_are_very_warm_and_o: "Les Brésiliens sont très chaleureux et saluent souvent avec une accolade ou une bise.",
    etiquette_always_use_a_napkin_to_hold_fi: "Utilisez toujours une serviette pour tenir les sandwichs ou pizzas — ne mangez pas à mains nues."
  },
  de: {
    etiquette_tipping_is_typically_5_10_br: "Trinkgeld beträgt in der Regel 5–10 %. Bring Bargeld für kleinere Cafés.",
    etiquette_always_wait_for_the_pedestrian: "Warte immer auf die grüne Fußgängerampel (Ampelmännchen), bevor du die Straße überquerst.",
    etiquette_sunday_is_a_day_of_rest_ruhet: "Sonntag ist ein Ruhetag; die meisten Geschäfte und Supermärkte sind komplett geschlossen.",
    etiquette_always_make_direct_eye_contact: "Achte beim Anstoßen und beim Sagen von 'Prost' auf direkten Augenkontakt.",
    etiquette_service_is_included_service_c: "Der Service ist enthalten (service compris), aber kleine Trinkgelder sind willkommen.",
    etiquette_always_distinctly_say_bonjour: "Sag immer deutlich 'Bonjour', wenn du ein Geschäft betrittst oder Personal begrüßt.",
    etiquette_avoid_raising_your_voice_in_pu: "Vermeide es, die Stimme in öffentlichen Verkehrsmitteln, Cafés und Restaurants zu erheben.",
    etiquette_tipping_is_generally_not_pract: "Trinkgeld ist generell nicht üblich und kann als unhöflich betrachtet werden.",
    etiquette_bowing_is_the_standard_greetin: "Verbeugen ist die Standardbegrüßung; Handschläge sind viel weniger verbreitet.",
    etiquette_always_remove_your_shoes_when: "Zieh immer die Schuhe aus, wenn du Häuser, Ryokans und traditionelle Räume betrittst.",
    etiquette_it_is_considered_highly_impoli: "Essen oder Trinken beim Gehen auf der Straße gilt als sehr unhöflich.",
    etiquette_a_service_charge_coperto_is: "Ein Serviceentgelt (Coperto) wird normalerweise automatisch auf die Rechnung gesetzt.",
    etiquette_greetings_often_involve_a_kiss: "Begrüßungen beinhalten oft einen Wangenkuss auf beiden Seiten. Beginne immer rechts.",
    etiquette_avoid_ordering_a_cappuccino_af: "Bestelle nach 11 Uhr keinen Cappuccino — er gilt streng als Morgengetränk.",
    etiquette_dress_conservatively_when_visi: "Kleide dich konservativ beim Besuch von Kirchen — Schultern und Knie müssen bedeckt sein.",
    etiquette_lunch_is_typically_very_late: "Das Mittagessen ist typischerweise sehr spät (14–16 Uhr) und das Abendessen oft nach 21 Uhr.",
    etiquette_tipping_5_10_is_customary_acr: "5–10 % Trinkgeld ist in Restaurants und Cafés üblich, aber nicht zwingend.",
    etiquette_because_of_the_afternoon_siest: "Wegen der Nachmittagssiesta (14–17 Uhr) schließen viele kleine Geschäfte vorübergehend.",
    etiquette_always_greet_elders_with_high: "Begrüße Ältere immer mit großem Respekt, oft mit einer leichten Verbeugung.",
    etiquette_haggling_is_completely_expecte: "Feilschen wird auf offenen Märkten vollständig erwartet und begrüßt.",
    etiquette_when_eating_local_traditional: "Beim Essen traditioneller Gerichte wie 'Swallow' immer nur die rechte Hand benutzen.",
    etiquette_never_use_your_left_hand_to_gi: "Benutze niemals die linke Hand, um Gegenstände zu geben oder anzunehmen.",
    etiquette_queueing_standing_in_line_is: "Anstehen ist eine absolute kulturelle Grundregel. Drängele dich niemals vor.",
    etiquette_tipping_10_15_in_restaurants: "10–15 % Trinkgeld in Restaurants ist sehr üblich, sofern nicht 'inkl. Service' angegeben.",
    etiquette_when_using_escalators_especia: "Auf Rolltreppen (bes. in der Londoner U-Bahn) immer rechts stehen, links gehen.",
    etiquette_a_standard_10_service_charge: "Ein Serviceentgelt von 10 % ist fast immer bereits in Ihrer Rechnung enthalten.",
    etiquette_brazilians_are_very_warm_and_o: "Brasilianer sind sehr herzlich und begrüßen oft mit einer Umarmung oder einem Wangenkuss.",
    etiquette_always_use_a_napkin_to_hold_fi: "Benutze immer eine Serviette, um Fingerfood wie Sandwiches zu halten — nicht mit bloßen Händen."
  },
  it: {
    etiquette_tipping_is_typically_5_10_br: "La mancia è tipicamente del 5-10%. Porta contante per i bar più piccoli.",
    etiquette_always_wait_for_the_pedestrian: "Aspetta sempre il semaforo verde pedonale (Ampelmännchen) prima di attraversare.",
    etiquette_sunday_is_a_day_of_rest_ruhet: "La domenica è un giorno di riposo (Ruhetag); la maggior parte dei negozi sarà chiusa.",
    etiquette_always_make_direct_eye_contact: "Mantieni sempre il contatto visivo quando si tintinna i bicchieri e si dice 'Prost'.",
    etiquette_service_is_included_service_c: "Il servizio è incluso (service compris), ma lasciare qualche spicciolo è apprezzato.",
    etiquette_always_distinctly_say_bonjour: "Dì sempre chiaramente 'Bonjour' quando entri in un negozio o saluti il personale.",
    etiquette_avoid_raising_your_voice_in_pu: "Evita di alzare la voce nei trasporti pubblici, nei caffè e nei ristoranti.",
    etiquette_tipping_is_generally_not_pract: "La mancia non è generalmente praticata e può essere considerata scortese.",
    etiquette_bowing_is_the_standard_greetin: "L'inchino è il saluto standard; le strette di mano sono molto meno comuni.",
    etiquette_always_remove_your_shoes_when: "Togli sempre le scarpe prima di entrare in case, ryokan e spazi tradizionali.",
    etiquette_it_is_considered_highly_impoli: "Mangiare o bere mentre si cammina per strada è considerato molto scortese.",
    etiquette_a_service_charge_coperto_is: "Un coperto viene di solito aggiunto automaticamente al conto del ristorante.",
    etiquette_greetings_often_involve_a_kiss: "I saluti spesso prevedono un bacio su entrambe le guance. Inizia sempre a destra.",
    etiquette_avoid_ordering_a_cappuccino_af: "Evita di ordinare un cappuccino dopo le 11; è considerato strettamente una bevanda mattutina.",
    etiquette_dress_conservatively_when_visi: "Vestiti in modo conservativo nelle chiese — spalle e ginocchia devono essere coperte.",
    etiquette_lunch_is_typically_very_late: "Il pranzo è tipicamente molto tardi (14-16) e la cena spesso dopo le 21.",
    etiquette_tipping_5_10_is_customary_acr: "Una mancia del 5-10% è consuetudine nei ristoranti e caffè, ma non obbligatoria.",
    etiquette_because_of_the_afternoon_siest: "A causa della siesta pomeridiana (14-17), molti negozi chiudono temporaneamente.",
    etiquette_always_greet_elders_with_high: "Saluta sempre gli anziani con grande rispetto, spesso con un leggero cenno del capo.",
    etiquette_haggling_is_completely_expecte: "Contrattare è completamente accettato e incoraggiato in tutti i mercati all'aperto.",
    etiquette_when_eating_local_traditional: "Quando mangi cibi tradizionali locali come 'swallow', usa solo la mano destra.",
    etiquette_never_use_your_left_hand_to_gi: "Non usare mai la mano sinistra per dare o ricevere oggetti da un'altra persona.",
    etiquette_queueing_standing_in_line_is: "Fare la fila è un pilastro culturale assoluto. Non tagliare mai la fila.",
    etiquette_tipping_10_15_in_restaurants: "Una mancia del 10-15% nei ristoranti è molto standard salvo che sia incluso il servizio.",
    etiquette_when_using_escalators_especia: "Sulle scale mobili (specialmente nella Tube di Londra), stai sempre a destra.",
    etiquette_a_standard_10_service_charge: "Un supplemento di servizio del 10% è quasi sempre già incluso nel conto.",
    etiquette_brazilians_are_very_warm_and_o: "I brasiliani sono molto calorosi e spesso salutano con un abbraccio o un bacio sulla guancia.",
    etiquette_always_use_a_napkin_to_hold_fi: "Usa sempre un tovagliolo per tenere i finger food come panini o pizza — non mangiare a mani nude."
  },
  pt: {
    etiquette_tipping_is_typically_5_10_br: "A gorjeta costuma ser de 5-10%. Tenha dinheiro em espécie em cafés menores.",
    etiquette_always_wait_for_the_pedestrian: "Espere sempre o sinal verde para pedestres (Ampelmännchen) antes de atravessar a rua.",
    etiquette_sunday_is_a_day_of_rest_ruhet: "O domingo é um dia de descanso (Ruhetag); a maioria das lojas estará fechada.",
    etiquette_always_make_direct_eye_contact: "Faça sempre contato visual direto ao brindar e dizer 'Prost'.",
    etiquette_service_is_included_service_c: "O serviço está incluído (service compris), mas deixar trocado é apreciado.",
    etiquette_always_distinctly_say_bonjour: "Diga sempre claramente 'Bonjour' ao entrar em uma loja ou cumprimentar a equipe.",
    etiquette_avoid_raising_your_voice_in_pu: "Evite levantar a voz em transporte público, cafés e restaurantes.",
    etiquette_tipping_is_generally_not_pract: "Gorjeta geralmente não é praticada e pode ser considerada rude.",
    etiquette_bowing_is_the_standard_greetin: "A reverência é o cumprimento padrão; apertos de mão são muito menos comuns.",
    etiquette_always_remove_your_shoes_when: "Sempre tire os sapatos ao entrar em casas, ryokans e espaços tradicionais.",
    etiquette_it_is_considered_highly_impoli: "Comer ou beber enquanto caminha na rua é considerado muito indelicado.",
    etiquette_a_service_charge_coperto_is: "Uma taxa de serviço (coperto) é geralmente adicionada automaticamente à conta.",
    etiquette_greetings_often_involve_a_kiss: "Os cumprimentos frequentemente envolvem um beijo em ambas as bochechas. Comece sempre pela direita.",
    etiquette_avoid_ordering_a_cappuccino_af: "Evite pedir um cappuccino após as 11 h; é estritamente visto como bebida matinal.",
    etiquette_dress_conservatively_when_visi: "Vista-se de forma conservadora ao visitar igrejas — ombros e joelhos devem estar cobertos.",
    etiquette_lunch_is_typically_very_late: "O almoço é tipicamente muito tarde (14h-16h) e o jantar frequentemente após as 21h.",
    etiquette_tipping_5_10_is_customary_acr: "Gorjeta de 5-10% é habitual em restaurantes e cafés, mas não obrigatória.",
    etiquette_because_of_the_afternoon_siest: "Por causa da sesta (14h-17h), muitas lojas menores fecham temporariamente.",
    etiquette_always_greet_elders_with_high: "Sempre cumprimente os mais velhos com muito respeito, muitas vezes com uma leve reverência.",
    etiquette_haggling_is_completely_expecte: "Regatear é totalmente esperado e encorajado em todos os mercados ao ar livre.",
    etiquette_when_eating_local_traditional: "Ao comer comidas tradicionais locais como 'swallow', use apenas a mão direita.",
    etiquette_never_use_your_left_hand_to_gi: "Nunca use a mão esquerda para dar ou receber itens de outra pessoa.",
    etiquette_queueing_standing_in_line_is: "Fazer fila é um pilar cultural absoluto. Nunca fure a fila.",
    etiquette_tipping_10_15_in_restaurants: "Gorjeta de 10-15% em restaurantes é muito padrão a menos que 'serviço incluído' esteja indicado.",
    etiquette_when_using_escalators_especia: "Nas escadas rolantes (especialmente no Metrô de Londres), sempre fique à direita.",
    etiquette_a_standard_10_service_charge: "Uma taxa de serviço de 10% quase sempre já está incluída na sua conta.",
    etiquette_brazilians_are_very_warm_and_o: "Os brasileiros são muito calorosos e frequentemente cumprimentam com um abraço ou um beijo na bochecha.",
    etiquette_always_use_a_napkin_to_hold_fi: "Use sempre um guardanapo para segurar finger foods — não coma com as mãos diretamente."
  },
  jp: {
    etiquette_tipping_is_typically_5_10_br: "チップは通常5〜10%です。小さなカフェには現金を持参してください。",
    etiquette_always_wait_for_the_pedestrian: "横断する前に必ず歩行者用青信号（Ampelmännchen）を待ちましょう。",
    etiquette_sunday_is_a_day_of_rest_ruhet: "日曜日は休憩日（Ruhetag）です。ほとんどの店は完全に閉まっています。",
    etiquette_always_make_direct_eye_contact: "乾杯して「プロースト」と言うときは、必ず直接アイコンタクトを取りましょう。",
    etiquette_service_is_included_service_c: "サービス料は含まれています（service compris）が、小銭を置くことも喜ばれます。",
    etiquette_always_distinctly_say_bonjour: "店に入るときやスタッフに挨拶するときは、必ず明確に「ボンジュール」と言いましょう。",
    etiquette_avoid_raising_your_voice_in_pu: "公共交通機関、カフェ、レストランでは声を上げないようにしましょう。",
    etiquette_tipping_is_generally_not_pract: "チップは一般的に行われておらず、失礼と見なされることもあります。",
    etiquette_bowing_is_the_standard_greetin: "お辞儀が標準的な挨拶です。握手はあまり一般的ではありません。",
    etiquette_always_remove_your_shoes_when: "家、旅館、伝統的な場所に入るときは必ず靴を脱いでください。",
    etiquette_it_is_considered_highly_impoli: "歩きながら食べたり飲んだりすることは、非常に失礼とされています。",
    etiquette_a_service_charge_coperto_is: "サービス料（coperto）は通常、自動的に請求書に追加されます。",
    etiquette_greetings_often_involve_a_kiss: "挨拶は両頬にキスを伴うことが多いです。必ず右から始めましょう。",
    etiquette_avoid_ordering_a_cappuccino_af: "午前11時以降にカプチーノを注文するのは避けましょう。朝の飲み物と見なされています。",
    etiquette_dress_conservatively_when_visi: "教会を訪問する際は保守的に服装してください — 肩と膝を覆う必要があります。",
    etiquette_lunch_is_typically_very_late: "昼食は通常かなり遅め（午後2〜4時）で、夕食は午後9時以降が多いです。",
    etiquette_tipping_5_10_is_customary_acr: "レストランやカフェでは5〜10%のチップが慣例ですが、義務ではありません。",
    etiquette_because_of_the_afternoon_siest: "午後のシエスタ（14〜17時）のため、多くの小さな店が一時的に閉まります。",
    etiquette_always_greet_elders_with_high: "年長者には常に深い敬意を示し、軽くお辞儀をすることが多いです。",
    etiquette_haggling_is_completely_expecte: "露天市場では値切ることが完全に期待され、推奨されています。",
    etiquette_when_eating_local_traditional: "「スワロー」などの伝統料理を食べるときは、必ず右手だけを使いましょう。",
    etiquette_never_use_your_left_hand_to_gi: "他の人に物を渡したり受け取ったりするときに、左手を使わないでください。",
    etiquette_queueing_standing_in_line_is: "列に並ぶことは絶対的な文化的な柱です。絶対に割り込まないでください。",
    etiquette_tipping_10_15_in_restaurants: "「サービス込み」と明記されていない限り、レストランでは通常10〜15%のチップが標準です。",
    etiquette_when_using_escalators_especia: "エスカレーター（特にロンドンの地下鉄）では右側に立ち、左側を歩くようにしてください。",
    etiquette_a_standard_10_service_charge: "通常、10%のサービス料がすでに請求書に含まれています。",
    etiquette_brazilians_are_very_warm_and_o: "ブラジル人はとても温かく、ハグや頬へのキスで挨拶することがよくあります。",
    etiquette_always_use_a_napkin_to_hold_fi: "サンドイッチやピザなどの指で食べる食べ物は、必ずナプキンを使って持ちましょう。"
  }
};

const localesDir = path.join(__dirname, 'client', 'src', 'locales');
const folders = fs.readdirSync(localesDir);

folders.forEach(folder => {
  if (folder === 'en') return; // English is already correct
  
  const filePath = path.join(localesDir, folder, 'translation.json');
  if (!fs.existsSync(filePath)) return;
  
  const translations = properTranslations[folder];
  if (!translations) return;
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!data.survival) data.survival = {};
    
    // Overwrite the [XX] prefixed values with proper translations
    Object.entries(translations).forEach(([key, value]) => {
      data.survival[key] = value;
    });
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ ${folder}: Injected ${Object.keys(translations).length} proper etiquette translations.`);
  } catch (err) {
    console.error(`❌ Failed to patch ${folder}:`, err.message);
  }
});

console.log('\nDone! All etiquette translations properly loaded.');
