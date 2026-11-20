// Before bed for Home Assistant dashboards: the screen time in the last hour before sleep,
// next to the night that followed, for the last nights on one timeline.
// A single ES module with no dependencies and no build step. The pure data functions are
// exported so test/data.test.mjs can run them under Node.

export const VERSION = "0.1.0";

const TAG = "life-dashboard-before-bed-card";
const PLATFORM = "life_dashboard";
const MIN = 60000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
// A session shorter than this is a nap, not a night.
const MIN_NIGHT = 2 * HOUR;
// A screen that reads "on" for longer than this was a phone that lost its connection.
const MAX_ON = 6 * HOUR;
// Two sleep periods of an on/off sensor this close together are one night.
const NIGHT_GAP = 30 * MIN;
const COMPARE_DAYS = 30;
// Nights each group needs before the comparison shows.
export const MIN_GROUP = 5;
const HISTORY_TTL = 10 * MIN;

const STRINGS = {
  en: {
    title: "Before bed",
    calm: "Calm evening",
    busy: "Busy evening",
    heroScreen: "screen on in the last {window} before sleep",
    heroPhone: "on the phone in the last {window} before sleep",
    heroEstimate: "on the phone in the last {window} before sleep, estimated",
    asleepFrom: "asleep from {time}",
    noData: "no data",
    legendScreen: "Screen on",
    legendPhone: "Phone in use",
    legendEstimate: "Phone in use, estimated",
    legendWindow: "Last {window} before sleep",
    legendAsleep: "Asleep",
    rowLabel: "{date}: {minutes} in the last {window} before sleep, asleep at {time} for {duration}",
    rowNoData: "{date}: no screen data, asleep at {time} for {duration}",
    cmpTitle: "Last {days} nights",
    cmpUnder: "Under {value}",
    cmpOver: "{value} or more",
    cmpNights: "{n} nights",
    cmpFellAsleep: "Fell asleep, average",
    cmpAsleep: "Asleep, average",
    cmpNote: "What your nights looked like, not what caused it.",
    cmpWaiting: "The comparison shows once both groups have {n} nights.",
    estimateNote: "Estimated from how the day's total grew between updates.",
    loading: "Loading the last nights",
    pickTitle: "Choose your sensors",
    pickBody: "Pick a sleep sensor and a screen sensor in the card settings.",
    missingTitle: "Sensor not found",
    missingBody: "{entity} does not exist. Check the entity in the card settings.",
    noNightsTitle: "No nights yet",
    noNightsBody: "{entity} has no night with a start and an end in its history yet.",
    edSleep: "Sleep sensor",
    edWake: "Wake-up sensor (only with a bedtime sensor)",
    edScreen: "Screen sensor",
    edTitle: "Title (optional)",
    edWindow: "Minutes before sleep",
    edNights: "Nights on the timeline",
    edThreshold: "Calm evening: under this many minutes",
    edCompare: "Compare the last 30 nights",
  },
  nl: {
    title: "Voor het slapen",
    calm: "Rustige avond",
    busy: "Drukke avond",
    heroScreen: "scherm aan in de laatste {window} voor het slapen",
    heroPhone: "op de telefoon in de laatste {window} voor het slapen",
    heroEstimate: "op de telefoon in de laatste {window} voor het slapen, geschat",
    asleepFrom: "in slaap vanaf {time}",
    noData: "geen gegevens",
    legendScreen: "Scherm aan",
    legendPhone: "Telefoon in gebruik",
    legendEstimate: "Telefoon in gebruik, geschat",
    legendWindow: "Laatste {window} voor het slapen",
    legendAsleep: "In slaap",
    rowLabel: "{date}: {minutes} in de laatste {window} voor het slapen, in slaap om {time}, {duration}",
    rowNoData: "{date}: geen schermgegevens, in slaap om {time}, {duration}",
    cmpTitle: "Laatste {days} nachten",
    cmpUnder: "Minder dan {value}",
    cmpOver: "{value} of meer",
    cmpNights: "{n} nachten",
    cmpFellAsleep: "In slaap gevallen, gemiddeld",
    cmpAsleep: "Geslapen, gemiddeld",
    cmpNote: "Hoe je nachten eruitzagen, niet waardoor het kwam.",
    cmpWaiting: "De vergelijking verschijnt zodra beide groepen {n} nachten hebben.",
    estimateNote: "Geschat uit hoe het dagtotaal groeide tussen updates.",
    loading: "De laatste nachten worden geladen",
    pickTitle: "Kies je sensoren",
    pickBody: "Kies een slaapsensor en een schermsensor in de instellingen van de kaart.",
    missingTitle: "Sensor niet gevonden",
    missingBody: "{entity} bestaat niet. Controleer de entiteit in de instellingen van de kaart.",
    noNightsTitle: "Nog geen nachten",
    noNightsBody: "{entity} heeft nog geen nacht met een begin en een einde in de geschiedenis.",
    edSleep: "Slaapsensor",
    edWake: "Sensor voor wakker worden (alleen bij een bedtijdsensor)",
    edScreen: "Schermsensor",
    edTitle: "Titel (optioneel)",
    edWindow: "Minuten voor het slapen",
    edNights: "Nachten op de tijdlijn",
    edThreshold: "Rustige avond: minder dan dit aantal minuten",
    edCompare: "De laatste 30 nachten vergelijken",
  },
  de: {
    title: "Vor dem Schlafen",
    calm: "Ruhiger Abend",
    busy: "Voller Abend",
    heroScreen: "Bildschirm an in den letzten {window} vor dem Schlafen",
    heroPhone: "am Handy in den letzten {window} vor dem Schlafen",
    heroEstimate: "am Handy in den letzten {window} vor dem Schlafen, geschätzt",
    asleepFrom: "eingeschlafen um {time}",
    noData: "keine Daten",
    legendScreen: "Bildschirm an",
    legendPhone: "Handy in Gebrauch",
    legendEstimate: "Handy in Gebrauch, geschätzt",
    legendWindow: "Letzte {window} vor dem Schlafen",
    legendAsleep: "Schlaf",
    rowLabel: "{date}: {minutes} in den letzten {window} vor dem Schlafen, eingeschlafen um {time}, {duration}",
    rowNoData: "{date}: keine Bildschirmdaten, eingeschlafen um {time}, {duration}",
    cmpTitle: "Letzte {days} Nächte",
    cmpUnder: "Unter {value}",
    cmpOver: "{value} oder mehr",
    cmpNights: "{n} Nächte",
    cmpFellAsleep: "Eingeschlafen, im Schnitt",
    cmpAsleep: "Geschlafen, im Schnitt",
    cmpNote: "Wie deine Nächte aussahen, nicht woran es lag.",
    cmpWaiting: "Der Vergleich erscheint, sobald beide Gruppen {n} Nächte haben.",
    estimateNote: "Geschätzt daraus, wie die Tagessumme zwischen Updates wuchs.",
    loading: "Die letzten Nächte werden geladen",
    pickTitle: "Sensoren wählen",
    pickBody: "Wähle in den Karteneinstellungen einen Schlafsensor und einen Bildschirmsensor.",
    missingTitle: "Sensor nicht gefunden",
    missingBody: "{entity} gibt es nicht. Prüfe die Entität in den Karteneinstellungen.",
    noNightsTitle: "Noch keine Nächte",
    noNightsBody: "{entity} hat noch keine Nacht mit Anfang und Ende im Verlauf.",
    edSleep: "Schlafsensor",
    edWake: "Aufwachsensor (nur mit einem Einschlafsensor)",
    edScreen: "Bildschirmsensor",
    edTitle: "Titel (optional)",
    edWindow: "Minuten vor dem Schlafen",
    edNights: "Nächte auf der Zeitleiste",
    edThreshold: "Ruhiger Abend: unter so vielen Minuten",
    edCompare: "Die letzten 30 Nächte vergleichen",
  },
  es: {
    title: "Antes de dormir",
    calm: "Tarde tranquila",
    busy: "Tarde ajetreada",
    heroScreen: "pantalla encendida en los últimos {window} antes de dormir",
    heroPhone: "con el teléfono en los últimos {window} antes de dormir",
    heroEstimate: "con el teléfono en los últimos {window} antes de dormir, estimado",
    asleepFrom: "dormido desde las {time}",
    noData: "sin datos",
    legendScreen: "Pantalla encendida",
    legendPhone: "Teléfono en uso",
    legendEstimate: "Teléfono en uso, estimado",
    legendWindow: "Últimos {window} antes de dormir",
    legendAsleep: "Dormido",
    rowLabel: "{date}: {minutes} en los últimos {window} antes de dormir, dormido a las {time}, {duration}",
    rowNoData: "{date}: sin datos de pantalla, dormido a las {time}, {duration}",
    cmpTitle: "Últimas {days} noches",
    cmpUnder: "Menos de {value}",
    cmpOver: "{value} o más",
    cmpNights: "{n} noches",
    cmpFellAsleep: "Hora de dormirse, media",
    cmpAsleep: "Tiempo dormido, media",
    cmpNote: "Cómo fueron tus noches, no qué lo causó.",
    cmpWaiting: "La comparación aparece cuando ambos grupos tienen {n} noches.",
    estimateNote: "Estimado a partir de cómo creció el total del día entre actualizaciones.",
    loading: "Cargando las últimas noches",
    pickTitle: "Elige tus sensores",
    pickBody: "Elige un sensor de sueño y un sensor de pantalla en los ajustes de la tarjeta.",
    missingTitle: "Sensor no encontrado",
    missingBody: "{entity} no existe. Revisa la entidad en los ajustes de la tarjeta.",
    noNightsTitle: "Aún no hay noches",
    noNightsBody: "{entity} aún no tiene ninguna noche con inicio y fin en su historial.",
    edSleep: "Sensor de sueño",
    edWake: "Sensor de despertar (solo con un sensor de hora de dormir)",
    edScreen: "Sensor de pantalla",
    edTitle: "Título (opcional)",
    edWindow: "Minutos antes de dormir",
    edNights: "Noches en la línea de tiempo",
    edThreshold: "Tarde tranquila: menos de estos minutos",
    edCompare: "Comparar las últimas 30 noches",
  },
  fr: {
    title: "Avant de dormir",
    calm: "Soirée calme",
    busy: "Soirée chargée",
    heroScreen: "écran allumé dans les {window} avant le sommeil",
    heroPhone: "sur le téléphone dans les {window} avant le sommeil",
    heroEstimate: "sur le téléphone dans les {window} avant le sommeil, estimation",
    asleepFrom: "endormi à partir de {time}",
    noData: "pas de données",
    legendScreen: "Écran allumé",
    legendPhone: "Téléphone utilisé",
    legendEstimate: "Téléphone utilisé, estimation",
    legendWindow: "Les {window} avant le sommeil",
    legendAsleep: "Sommeil",
    rowLabel: "{date} : {minutes} dans les {window} avant le sommeil, endormi à {time}, {duration}",
    rowNoData: "{date} : pas de données d'écran, endormi à {time}, {duration}",
    cmpTitle: "Les {days} dernières nuits",
    cmpUnder: "Moins de {value}",
    cmpOver: "{value} ou plus",
    cmpNights: "{n} nuits",
    cmpFellAsleep: "Endormissement, en moyenne",
    cmpAsleep: "Sommeil, en moyenne",
    cmpNote: "À quoi ressemblaient vos nuits, pas ce qui l'a causé.",
    cmpWaiting: "La comparaison s'affiche quand les deux groupes ont {n} nuits.",
    estimateNote: "Estimé d'après la hausse du total du jour entre deux mises à jour.",
    loading: "Chargement des dernières nuits",
    pickTitle: "Choisissez vos capteurs",
    pickBody: "Choisissez un capteur de sommeil et un capteur d'écran dans les réglages de la carte.",
    missingTitle: "Capteur introuvable",
    missingBody: "{entity} n'existe pas. Vérifiez l'entité dans les réglages de la carte.",
    noNightsTitle: "Pas encore de nuits",
    noNightsBody: "{entity} n'a pas encore de nuit avec un début et une fin dans son historique.",
    edSleep: "Capteur de sommeil",
    edWake: "Capteur de réveil (seulement avec un capteur d'heure du coucher)",
    edScreen: "Capteur d'écran",
    edTitle: "Titre (facultatif)",
    edWindow: "Minutes avant le sommeil",
    edNights: "Nuits sur la frise",
    edThreshold: "Soirée calme : moins de ce nombre de minutes",
    edCompare: "Comparer les 30 dernières nuits",
  },
  it: {
    title: "Prima di dormire",
    calm: "Serata tranquilla",
    busy: "Serata piena",
    heroScreen: "schermo acceso negli ultimi {window} prima di dormire",
    heroPhone: "al telefono negli ultimi {window} prima di dormire",
    heroEstimate: "al telefono negli ultimi {window} prima di dormire, stima",
    asleepFrom: "addormentato dalle {time}",
    noData: "nessun dato",
    legendScreen: "Schermo acceso",
    legendPhone: "Telefono in uso",
    legendEstimate: "Telefono in uso, stima",
    legendWindow: "Ultimi {window} prima di dormire",
    legendAsleep: "Sonno",
    rowLabel: "{date}: {minutes} negli ultimi {window} prima di dormire, addormentato alle {time}, {duration}",
    rowNoData: "{date}: nessun dato dello schermo, addormentato alle {time}, {duration}",
    cmpTitle: "Ultime {days} notti",
    cmpUnder: "Meno di {value}",
    cmpOver: "{value} o più",
    cmpNights: "{n} notti",
    cmpFellAsleep: "Addormentamento, in media",
    cmpAsleep: "Sonno, in media",
    cmpNote: "Come sono andate le tue notti, non che cosa l'ha causato.",
    cmpWaiting: "Il confronto appare quando entrambi i gruppi hanno {n} notti.",
    estimateNote: "Stimato da come è cresciuto il totale del giorno tra un aggiornamento e l'altro.",
    loading: "Caricamento delle ultime notti",
    pickTitle: "Scegli i sensori",
    pickBody: "Scegli un sensore del sonno e un sensore dello schermo nelle impostazioni della scheda.",
    missingTitle: "Sensore non trovato",
    missingBody: "{entity} non esiste. Controlla l'entità nelle impostazioni della scheda.",
    noNightsTitle: "Ancora nessuna notte",
    noNightsBody: "{entity} non ha ancora una notte con inizio e fine nella cronologia.",
    edSleep: "Sensore del sonno",
    edWake: "Sensore del risveglio (solo con un sensore dell'ora di addormentamento)",
    edScreen: "Sensore dello schermo",
    edTitle: "Titolo (facoltativo)",
    edWindow: "Minuti prima di dormire",
    edNights: "Notti sulla linea del tempo",
    edThreshold: "Serata tranquilla: meno di questi minuti",
    edCompare: "Confronta le ultime 30 notti",
  },
  pt: {
    title: "Antes de dormir",
    calm: "Noite calma",
    busy: "Noite agitada",
    heroScreen: "ecrã ligado nos últimos {window} antes de dormir",
    heroPhone: "no telemóvel nos últimos {window} antes de dormir",
    heroEstimate: "no telemóvel nos últimos {window} antes de dormir, estimativa",
    asleepFrom: "a dormir desde as {time}",
    noData: "sem dados",
    legendScreen: "Ecrã ligado",
    legendPhone: "Telemóvel em uso",
    legendEstimate: "Telemóvel em uso, estimativa",
    legendWindow: "Últimos {window} antes de dormir",
    legendAsleep: "A dormir",
    rowLabel: "{date}: {minutes} nos últimos {window} antes de dormir, adormeceu às {time}, {duration}",
    rowNoData: "{date}: sem dados do ecrã, adormeceu às {time}, {duration}",
    cmpTitle: "Últimas {days} noites",
    cmpUnder: "Menos de {value}",
    cmpOver: "{value} ou mais",
    cmpNights: "{n} noites",
    cmpFellAsleep: "Hora de adormecer, média",
    cmpAsleep: "Tempo a dormir, média",
    cmpNote: "Como foram as suas noites, não o que o causou.",
    cmpWaiting: "A comparação aparece quando ambos os grupos tiverem {n} noites.",
    estimateNote: "Estimado a partir de como o total do dia cresceu entre atualizações.",
    loading: "A carregar as últimas noites",
    pickTitle: "Escolha os sensores",
    pickBody: "Escolha um sensor de sono e um sensor de ecrã nas definições do cartão.",
    missingTitle: "Sensor não encontrado",
    missingBody: "{entity} não existe. Verifique a entidade nas definições do cartão.",
    noNightsTitle: "Ainda sem noites",
    noNightsBody: "{entity} ainda não tem uma noite com início e fim no histórico.",
    edSleep: "Sensor de sono",
    edWake: "Sensor de despertar (só com um sensor de hora de adormecer)",
    edScreen: "Sensor de ecrã",
    edTitle: "Título (opcional)",
    edWindow: "Minutos antes de dormir",
    edNights: "Noites na linha do tempo",
    edThreshold: "Noite calma: menos do que estes minutos",
    edCompare: "Comparar as últimas 30 noites",
  },
  ja: {
    title: "就寝前",
    calm: "落ち着いた夜",
    busy: "忙しい夜",
    heroScreen: "就寝前の{window}に画面がオン",
    heroPhone: "就寝前の{window}にスマホを使用",
    heroEstimate: "就寝前の{window}にスマホを使用(推定)",
    asleepFrom: "{time}から睡眠",
    noData: "データなし",
    legendScreen: "画面オン",
    legendPhone: "スマホ使用中",
    legendEstimate: "スマホ使用中(推定)",
    legendWindow: "就寝前の{window}",
    legendAsleep: "睡眠",
    rowLabel: "{date}: 就寝前の{window}に{minutes}、{time}に入眠、{duration}",
    rowNoData: "{date}: 画面のデータなし、{time}に入眠、{duration}",
    cmpTitle: "直近{days}夜",
    cmpUnder: "{value}未満",
    cmpOver: "{value}以上",
    cmpNights: "{n}夜",
    cmpFellAsleep: "入眠時刻(平均)",
    cmpAsleep: "睡眠時間(平均)",
    cmpNote: "これは夜の様子であり、原因を示すものではありません。",
    cmpWaiting: "両方のグループが{n}夜になると比較が表示されます。",
    estimateNote: "更新の間に1日の合計が増えた量からの推定です。",
    loading: "直近の夜を読み込み中",
    pickTitle: "センサーを選択",
    pickBody: "カードの設定で睡眠センサーと画面センサーを選んでください。",
    missingTitle: "センサーが見つかりません",
    missingBody: "{entity}は存在しません。カードの設定でエンティティを確認してください。",
    noNightsTitle: "まだ夜のデータがありません",
    noNightsBody: "{entity}の履歴には、開始と終了のある夜がまだありません。",
    edSleep: "睡眠センサー",
    edWake: "起床センサー(就寝時刻センサーの場合のみ)",
    edScreen: "画面センサー",
    edTitle: "タイトル(任意)",
    edWindow: "就寝前の分数",
    edNights: "タイムラインの夜数",
    edThreshold: "落ち着いた夜: この分数未満",
    edCompare: "直近30夜を比較",
  },
  zh: {
    title: "睡前",
    calm: "平静的夜晚",
    busy: "忙碌的夜晚",
    heroScreen: "睡前最后{window}屏幕亮着",
    heroPhone: "睡前最后{window}在用手机",
    heroEstimate: "睡前最后{window}在用手机(估算)",
    asleepFrom: "{time}入睡",
    noData: "无数据",
    legendScreen: "屏幕亮着",
    legendPhone: "使用手机",
    legendEstimate: "使用手机(估算)",
    legendWindow: "睡前最后{window}",
    legendAsleep: "睡眠",
    rowLabel: "{date}:睡前最后{window}内{minutes},{time}入睡,{duration}",
    rowNoData: "{date}:无屏幕数据,{time}入睡,{duration}",
    cmpTitle: "最近{days}晚",
    cmpUnder: "少于{value}",
    cmpOver: "{value}或更多",
    cmpNights: "{n}晚",
    cmpFellAsleep: "入睡时间(平均)",
    cmpAsleep: "睡眠时长(平均)",
    cmpNote: "这是你夜晚的样子,不代表原因。",
    cmpWaiting: "两组都有{n}晚后显示对比。",
    estimateNote: "根据两次更新之间当日总时长的增长估算。",
    loading: "正在加载最近的夜晚",
    pickTitle: "选择传感器",
    pickBody: "在卡片设置中选择一个睡眠传感器和一个屏幕传感器。",
    missingTitle: "未找到传感器",
    missingBody: "{entity}不存在。请在卡片设置中检查实体。",
    noNightsTitle: "还没有夜晚数据",
    noNightsBody: "{entity}的历史中还没有带开始和结束时间的夜晚。",
    edSleep: "睡眠传感器",
    edWake: "起床传感器(仅用于入睡时间传感器)",
    edScreen: "屏幕传感器",
    edTitle: "标题(可选)",
    edWindow: "睡前分钟数",
    edNights: "时间线上的夜晚数",
    edThreshold: "平静的夜晚:少于这个分钟数",
    edCompare: "对比最近30晚",
  },
  hi: {
    title: "सोने से पहले",
    calm: "शांत शाम",
    busy: "व्यस्त शाम",
    heroScreen: "सोने से पहले के आख़िरी {window} में स्क्रीन चालू",
    heroPhone: "सोने से पहले के आख़िरी {window} में फ़ोन पर",
    heroEstimate: "सोने से पहले के आख़िरी {window} में फ़ोन पर, अनुमान",
    asleepFrom: "{time} से नींद",
    noData: "डेटा नहीं",
    legendScreen: "स्क्रीन चालू",
    legendPhone: "फ़ोन इस्तेमाल में",
    legendEstimate: "फ़ोन इस्तेमाल में, अनुमान",
    legendWindow: "सोने से पहले के आख़िरी {window}",
    legendAsleep: "नींद",
    rowLabel: "{date}: सोने से पहले के आख़िरी {window} में {minutes}, {time} पर नींद आई, {duration}",
    rowNoData: "{date}: स्क्रीन का डेटा नहीं, {time} पर नींद आई, {duration}",
    cmpTitle: "पिछली {days} रातें",
    cmpUnder: "{value} से कम",
    cmpOver: "{value} या ज़्यादा",
    cmpNights: "{n} रातें",
    cmpFellAsleep: "नींद आने का समय, औसत",
    cmpAsleep: "नींद, औसत",
    cmpNote: "आपकी रातें कैसी रहीं, यह कारण नहीं बताता।",
    cmpWaiting: "तुलना तब दिखेगी जब दोनों समूहों में {n} रातें होंगी।",
    estimateNote: "अपडेट के बीच दिन का कुल समय कितना बढ़ा, उससे अनुमान।",
    loading: "पिछली रातें लोड हो रही हैं",
    pickTitle: "अपने सेंसर चुनें",
    pickBody: "कार्ड की सेटिंग में एक नींद सेंसर और एक स्क्रीन सेंसर चुनें।",
    missingTitle: "सेंसर नहीं मिला",
    missingBody: "{entity} मौजूद नहीं है। कार्ड की सेटिंग में एंटिटी जाँचें।",
    noNightsTitle: "अभी कोई रात नहीं",
    noNightsBody: "{entity} के इतिहास में अभी शुरुआत और अंत वाली कोई रात नहीं है।",
    edSleep: "नींद सेंसर",
    edWake: "जागने का सेंसर (सिर्फ़ सोने के समय वाले सेंसर के साथ)",
    edScreen: "स्क्रीन सेंसर",
    edTitle: "शीर्षक (वैकल्पिक)",
    edWindow: "सोने से पहले के मिनट",
    edNights: "टाइमलाइन पर रातें",
    edThreshold: "शांत शाम: इतने मिनट से कम",
    edCompare: "पिछली 30 रातों की तुलना करें",
  },
  ar: {
    title: "قبل النوم",
    calm: "مساء هادئ",
    busy: "مساء مزدحم",
    heroScreen: "الشاشة تعمل في آخر {window} قبل النوم",
    heroPhone: "على الهاتف في آخر {window} قبل النوم",
    heroEstimate: "على الهاتف في آخر {window} قبل النوم، تقدير",
    asleepFrom: "نائم منذ {time}",
    noData: "لا توجد بيانات",
    legendScreen: "الشاشة تعمل",
    legendPhone: "الهاتف قيد الاستخدام",
    legendEstimate: "الهاتف قيد الاستخدام، تقدير",
    legendWindow: "آخر {window} قبل النوم",
    legendAsleep: "نوم",
    rowLabel: "{date}: {minutes} في آخر {window} قبل النوم، نام في {time}، {duration}",
    rowNoData: "{date}: لا توجد بيانات للشاشة، نام في {time}، {duration}",
    cmpTitle: "آخر {days} ليلة",
    cmpUnder: "أقل من {value}",
    cmpOver: "{value} أو أكثر",
    cmpNights: "{n} ليالٍ",
    cmpFellAsleep: "وقت النوم، المتوسط",
    cmpAsleep: "مدة النوم، المتوسط",
    cmpNote: "هكذا كانت لياليك، وليس ما سبّب ذلك.",
    cmpWaiting: "تظهر المقارنة عندما يكون في كل مجموعة {n} ليالٍ.",
    estimateNote: "تقدير من مقدار زيادة مجموع اليوم بين التحديثات.",
    loading: "جارٍ تحميل الليالي الأخيرة",
    pickTitle: "اختر المستشعرات",
    pickBody: "اختر مستشعر نوم ومستشعر شاشة في إعدادات البطاقة.",
    missingTitle: "المستشعر غير موجود",
    missingBody: "{entity} غير موجود. تحقق من الكيان في إعدادات البطاقة.",
    noNightsTitle: "لا توجد ليالٍ بعد",
    noNightsBody: "لا يحتوي سجل {entity} بعد على ليلة لها بداية ونهاية.",
    edSleep: "مستشعر النوم",
    edWake: "مستشعر الاستيقاظ (فقط مع مستشعر وقت النوم)",
    edScreen: "مستشعر الشاشة",
    edTitle: "العنوان (اختياري)",
    edWindow: "الدقائق قبل النوم",
    edNights: "الليالي على الخط الزمني",
    edThreshold: "مساء هادئ: أقل من هذا العدد من الدقائق",
    edCompare: "قارن آخر 30 ليلة",
  },
};

export function missingStrings() {
  const keys = Object.keys(STRINGS.en);
  return Object.entries(STRINGS).flatMap(([language, table]) =>
    keys.filter((key) => typeof table[key] !== "string").map((key) => [language, key]));
}

export function translate(language, key, values = {}) {
  const base = String(language || "en").split("-")[0].toLowerCase();
  const template = STRINGS[base]?.[key] ?? STRINGS.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ""));
}

// ---------------------------------------------------------------- time

/** An ISO 8601 string, epoch seconds or epoch milliseconds, as milliseconds; else null. */
export function toInstant(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value < 1e11 ? value * 1000 : value;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const clockFormats = new Map();

/** Minutes since local midnight of an instant. */
export function clockMinutes(instant, timeZone) {
  const key = timeZone || "";
  if (!clockFormats.has(key)) {
    clockFormats.set(key, new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }));
  }
  const parts = clockFormats.get(key).formatToParts(new Date(instant));
  const part = (type) => Number(parts.find((p) => p.type === type)?.value) || 0;
  return part("hour") * 60 + part("minute");
}

/** Minutes since local noon, so an evening and the night after it are one rising number. */
export function sinceNoon(instant, timeZone) {
  return (clockMinutes(instant, timeZone) + 720) % 1440;
}

export function dayKey(instant, timeZone) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(instant));
}

/** The evening a night belongs to: 23:30 and 00:30 after it are the same evening. */
export function eveningKey(start, timeZone) {
  return dayKey(start - 12 * HOUR, timeZone);
}

// ---------------------------------------------------------------- history

/**
 * History rows as { at, state, attributes }, oldest first. Reads the compressed rows of
 * `history/history_during_period` (`s`, `a`, `lu` in seconds) and plain state objects.
 */
export function historyRows(rows) {
  const out = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row || typeof row !== "object") continue;
    const at = toInstant(row.lu ?? row.last_updated ?? row.lc ?? row.last_changed);
    const state = row.s ?? row.state;
    if (at === null || typeof state !== "string") continue;
    out.push({ at, state, attributes: row.a ?? row.attributes ?? {} });
  }
  return out.sort((a, b) => a.at - b.at);
}

// ---------------------------------------------------------------- sleep

function validNight(start, end) {
  return start !== null && end !== null && end - start >= MIN_NIGHT && end - start <= DAY;
}

/**
 * The night in a sensor's attributes: `start` and `end` (Life Dashboard's last sleep), a
 * `stages` list, or the parallel stage lists of the official Android Companion app.
 */
export function nightOf(attributes, keys = {}) {
  if (!attributes || typeof attributes !== "object") return null;
  let start = toInstant(attributes[keys.start || "start"]);
  let end = toInstant(attributes[keys.end || "end"]);
  if (start === null || end === null) {
    const stages = Array.isArray(attributes.stages) ? attributes.stages : null;
    const starts = stages ? stages.map((s) => toInstant(s?.start)) : (attributes.stageStartTimes ?? []).map(toInstant);
    const ends = stages ? stages.map((s) => toInstant(s?.end)) : (attributes.stageEndTimes ?? []).map(toInstant);
    const from = starts.filter((v) => v !== null);
    const to = ends.filter((v) => v !== null);
    if (!from.length || !to.length) return null;
    start = Math.min(...from);
    end = Math.max(...to);
  }
  if (!validNight(start, end)) return null;
  const asleep = Number(attributes.asleep_minutes);
  return { start, end, asleep: Number.isFinite(asleep) && asleep > 0 ? asleep : (end - start) / MIN };
}

/** One night per evening, oldest first. "last" keeps the newest report, "longest" the longest. */
export function onePerEvening(nights, timeZone, keep = "last") {
  const byEvening = new Map();
  for (const night of nights) {
    const key = eveningKey(night.start, timeZone);
    const held = byEvening.get(key);
    if (!held || keep === "last" || night.end - night.start > held.end - held.start) byEvening.set(key, night);
  }
  return [...byEvening.values()].sort((a, b) => a.start - b.start);
}

/** Nights from the history of a sensor whose attributes carry the night. */
export function nightsFromAttributes(rows, timeZone, keys = {}) {
  return onePerEvening(rows.map((row) => nightOf(row.attributes, keys)).filter(Boolean), timeZone, "last");
}

/** The periods a row list reads "on", closed at `until` when still on. */
export function onPeriods(rows, until) {
  const periods = [];
  let since = null;
  for (const row of rows) {
    if (row.state === "on") {
      if (since === null) since = row.at;
    } else if (since !== null) {
      periods.push([since, row.at]);
      since = null;
    }
  }
  if (since !== null && until > since) periods.push([since, until]);
  return periods;
}

/** Nights from a sensor that is on while asleep, such as a bed sensor or a helper. */
export function nightsFromOnOff(rows, until, timeZone) {
  const merged = [];
  for (const [from, to] of onPeriods(rows, until)) {
    const last = merged[merged.length - 1];
    if (last && from - last[1] <= NIGHT_GAP) last[1] = to;
    else merged.push([from, to]);
  }
  // A period that is still running has no end yet, so it is not a night.
  const nights = merged.filter(([start, end]) => end < until && validNight(start, end))
    .map(([start, end]) => ({ start, end, asleep: (end - start) / MIN }));
  return onePerEvening(nights, timeZone, "longest");
}

/** Nights from two timestamp sensors: when sleep began and when it ended. */
export function nightsFromTimestamps(startRows, endRows, timeZone) {
  const ends = [...new Set(endRows.map((row) => toInstant(row.state)).filter((v) => v !== null))].sort((a, b) => a - b);
  const nights = [];
  for (const start of new Set(startRows.map((row) => toInstant(row.state)).filter((v) => v !== null))) {
    const end = ends.find((value) => value > start);
    if (end !== undefined && validNight(start, end)) nights.push({ start, end, asleep: (end - start) / MIN });
  }
  return onePerEvening(nights, timeZone, "last");
}

// ---------------------------------------------------------------- screen

const UNIT_MINUTES = { d: 1440, h: 60, min: 1, s: 1 / 60, ms: 1 / 60000 };

/**
 * A block is { from, to, minutes, exact, apps? }: `minutes` of screen somewhere between
 * `from` and `to`. A screen on/off sensor gives blocks that are full; a counter gives the
 * growth between two updates; the app gives a slot per quarter of an hour.
 */
export function blocksFromOnOff(rows, until) {
  return onPeriods(rows, until)
    .filter(([from, to]) => to - from <= MAX_ON)
    .map(([from, to]) => ({ from, to, minutes: (to - from) / MIN, exact: true }));
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
}

/** The start of the local day an instant is in, to the minute. */
export function localMidnight(instant, timeZone) {
  return Math.floor(instant / MIN) * MIN - clockMinutes(instant, timeZone) * MIN;
}

/**
 * Blocks from a sensor that counts the day's screen time and starts over each day, such as
 * Life Dashboard's screen time today or history_stats. Each rise is a block that ends at
 * the update and starts at the update before it, or at the sync before it when `ticks`
 * (the moments the phone synced) are given: a value that did not change leaves no row.
 *
 * The minutes between the last update of a day and its end never show on such a sensor:
 * the next update is already the new day. With `finals`, the rows of a sensor that holds
 * the finished total of the day before (Life Dashboard's screen time yesterday), they are
 * the difference, placed before the day boundary that `boundary(from, to)` returns.
 */
export function blocksFromCounter(rows, factor = 1, ticks = [], { finals = [], boundary = () => null } = {}) {
  const read = (list) => list.map((row) => ({ at: row.at, value: Number(row.state) * factor }))
    .filter((sample) => Number.isFinite(sample.value) && sample.value >= 0);
  const samples = read(rows);
  const totals = read(finals);
  const gaps = [];
  for (let i = 1; i < samples.length; i += 1) {
    if (samples[i].value !== samples[i - 1].value) gaps.push(samples[i].at - samples[i - 1].at);
  }
  const typical = Math.min(Math.max(median(gaps) ?? HOUR, MIN), 2 * HOUR);
  const sortedTicks = [...ticks].sort((a, b) => a - b);
  const blocks = [];
  const add = (from, to, minutes) => {
    if (!(minutes > 0.01) || to <= from) return;
    blocks.push({ from: Math.min(from, to - minutes * MIN), to, minutes, exact: false });
  };
  for (let i = 1; i < samples.length; i += 1) {
    const { at, value } = samples[i];
    const previous = samples[i - 1];
    let tick = null;
    for (const candidate of sortedTicks) {
      if (candidate > at - 30000) break;
      tick = candidate;
    }
    const reset = value < previous.value;
    const minutes = reset ? value : value - previous.value;
    const from = tick !== null && tick >= previous.at ? tick
      : reset ? previous.at : Math.max(previous.at, at - Math.max(minutes * MIN, typical));
    if (!reset) {
      add(from, at, minutes);
      continue;
    }
    // A lower value is a new day: what it reads now was used since the day began.
    const edge = boundary(from, at);
    const split = edge !== null && edge > from && edge <= at ? edge : null;
    const final = totals.find((total) => Math.abs(total.at - at) <= 5 * MIN && total.value >= previous.value);
    if (final) add(from, split ?? at, final.value - previous.value);
    add(split ?? from, at, value);
  }
  return blocks.sort((a, b) => a.from - b.from);
}

function appRows(apps) {
  const rows = Array.isArray(apps) ? apps
    : apps && typeof apps === "object" ? Object.entries(apps).map(([pkg, row]) => (typeof row === "object" ? { package: pkg, ...row } : { package: pkg, minutes: row }))
      : [];
  return rows.map((row) => {
    const minutes = Number(row?.minutes);
    const pkg = typeof row?.package === "string" && row.package ? row.package : null;
    const name = typeof row?.name === "string" && row.name.trim() ? row.name.trim() : null;
    return Number.isFinite(minutes) && minutes > 0 && (pkg || name) ? { package: pkg, name, minutes } : null;
  }).filter(Boolean);
}

/**
 * Blocks from a `slots` attribute: a list of { start, minutes, apps }, each `slotMinutes`
 * long (or with its own `end`). This is the shape the Life Dashboard app will send.
 */
export function blocksFromSlots(slots, slotMinutes = 15) {
  const length = Number(slotMinutes) > 0 ? Number(slotMinutes) : 15;
  const blocks = [];
  for (const slot of Array.isArray(slots) ? slots : []) {
    const from = toInstant(slot?.start);
    const to = toInstant(slot?.end) ?? (from === null ? null : from + length * MIN);
    const minutes = Number(slot?.minutes);
    if (from === null || to === null || to <= from || !Number.isFinite(minutes) || minutes <= 0) continue;
    blocks.push({ from, to, minutes: Math.min(minutes, (to - from) / MIN), exact: true, apps: appRows(slot.apps) });
  }
  return blocks.sort((a, b) => a.from - b.from);
}

/** A span without the given intervals, as pieces. */
export function without(from, to, intervals) {
  let pieces = [[from, to]];
  for (const [a, b] of intervals) {
    pieces = pieces.flatMap(([start, end]) => {
      if (b <= start || a >= end) return [[start, end]];
      return [[start, Math.min(a, end)], [Math.max(b, start), end]].filter(([s, e]) => e > s);
    });
  }
  return pieces;
}

/**
 * Where a block's minutes can have been. An estimated block cannot say when inside it the
 * phone was used, so the time asleep is taken out when the rest still holds its minutes:
 * a phone that synced in the morning then puts the evening's minutes in the evening.
 */
export function blockPieces(block, asleep = []) {
  if (block.exact || !asleep.length) return [[block.from, block.to]];
  const pieces = without(block.from, block.to, asleep);
  const room = pieces.reduce((sum, [a, b]) => sum + (b - a), 0);
  return room >= block.minutes * MIN ? pieces : [[block.from, block.to]];
}

function shareIn(block, from, to, asleep) {
  const pieces = blockPieces(block, asleep);
  const room = pieces.reduce((sum, [a, b]) => sum + (b - a), 0);
  if (room <= 0) return 0;
  const inside = pieces.reduce((sum, [a, b]) => sum + Math.max(0, Math.min(b, to) - Math.max(a, from)), 0);
  return inside / room;
}

/** Minutes of screen between two instants, with each block spread evenly over its span. */
export function minutesIn(blocks, from, to, asleep = []) {
  let total = 0;
  for (const block of blocks) {
    if (block.to <= from || block.from >= to) continue;
    total += block.minutes * shareIn(block, from, to, asleep);
  }
  return total;
}

/** The apps between two instants, most used first. */
export function appsIn(blocks, from, to) {
  const byApp = new Map();
  for (const block of blocks) {
    if (!block.apps?.length || block.to <= from || block.from >= to) continue;
    const share = shareIn(block, from, to, []);
    for (const app of block.apps) {
      const key = app.package || `name:${(app.name || "").toLowerCase()}`;
      const held = byApp.get(key) ?? { package: app.package, name: app.name, minutes: 0 };
      held.minutes += app.minutes * share;
      held.name = held.name || app.name;
      byApp.set(key, held);
    }
  }
  return [...byApp.values()].filter((app) => app.minutes >= 0.5).sort((a, b) => b.minutes - a.minutes);
}

/**
 * Each night with `before`: the minutes of screen in the window before it began, or null
 * when the screen history does not reach that far back.
 */
export function withScreen(nights, blocks, { window = 60, coveredFrom = null, exact = true } = {}) {
  const asleep = exact ? [] : nights.map((night) => [night.start, night.end]);
  return nights.map((night) => {
    const from = night.start - window * MIN;
    const covered = coveredFrom !== null && from >= coveredFrom;
    return {
      ...night,
      before: covered ? Math.min(window, minutesIn(blocks, from, night.start, asleep)) : null,
      apps: covered ? appsIn(blocks, from, night.start) : [],
    };
  });
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * The nights under the threshold against the others: how many, when they began on average
 * (minutes since noon) and how long they lasted. Null until both groups have enough nights.
 */
export function compareNights(nights, threshold, timeZone, minGroup = MIN_GROUP) {
  const known = nights.filter((night) => night.before !== null && night.before !== undefined);
  const calm = known.filter((night) => night.before < threshold);
  const busy = known.filter((night) => night.before >= threshold);
  const group = (list) => ({
    nights: list.length,
    fellAsleep: list.length ? average(list.map((night) => sinceNoon(night.start, timeZone))) : null,
    asleep: list.length ? average(list.map((night) => night.asleep)) : null,
  });
  return { ready: calm.length >= minGroup && busy.length >= minGroup, calm: group(calm), busy: group(busy) };
}

/** The hours the timeline spans, in minutes since noon, around the nights it shows. */
export function axisFor(nights, window, timeZone) {
  if (!nights.length) return { from: 9 * 60, to: 21 * 60 };
  const starts = nights.map((night) => sinceNoon(night.start, timeZone));
  const ends = nights.map((night, index) => starts[index] + (night.end - night.start) / MIN);
  const from = Math.floor((Math.min(...starts) - window - 30) / 60) * 60;
  const to = Math.ceil((Math.max(...ends) + 30) / 60) * 60;
  return { from, to: Math.min(Math.max(to, from + 6 * 60), from + 18 * 60) };
}

export function axisTicks(axis) {
  const span = axis.to - axis.from;
  const step = span <= 8 * 60 ? 120 : span <= 13 * 60 ? 180 : 240;
  const ticks = [];
  for (let at = axis.from; at <= axis.to; at += step) ticks.push(at);
  return ticks;
}

/** What kind of sensor an entity is for this card. */
export function sleepKind(entityId, stateObj) {
  const domain = String(entityId).split(".")[0];
  if (domain === "binary_sensor" || domain === "input_boolean" || domain === "switch") return "onoff";
  if (stateObj?.attributes?.device_class === "timestamp") return "timestamp";
  return "attributes";
}

export function screenKind(entityId, stateObj) {
  if (Array.isArray(stateObj?.attributes?.slots)) return "slots";
  const domain = String(entityId).split(".")[0];
  if (domain === "binary_sensor" || domain === "input_boolean" || domain === "switch") return "onoff";
  return "counter";
}

// ---------------------------------------------------------------- formatting

const unitFormats = new Map();
function unitFormat(language, unit, display = "narrow") {
  const key = `${language}|${unit}|${display}`;
  if (!unitFormats.has(key)) {
    unitFormats.set(key, new Intl.NumberFormat(language, { style: "unit", unit, unitDisplay: display }));
  }
  return unitFormats.get(key);
}

/** "7h 12m" in the user's language. */
export function formatDuration(minutes, language = "en") {
  if (!(minutes >= 0) || !Number.isFinite(minutes)) return "";
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours && rest) {
    return `${unitFormat(language, "hour").format(hours)} ${unitFormat(language, "minute").format(rest)}`;
  }
  return hours ? unitFormat(language, "hour").format(hours) : unitFormat(language, "minute").format(rest);
}

/** "60 min", for the window. */
export function formatMinutes(minutes, language = "en") {
  return unitFormat(language, "minute", "short").format(Math.round(minutes));
}

export function localeSettings(hass) {
  const locale = hass?.locale ?? {};
  const language = locale.language || hass?.language || "en";
  const timeZone = locale.time_zone === "server" ? hass?.config?.time_zone || undefined : undefined;
  let hour12;
  if (locale.time_format === "12" || locale.time_format === "am_pm") hour12 = true;
  else if (locale.time_format === "24") hour12 = false;
  else {
    const source = locale.time_format === "system" ? undefined : language;
    hour12 = new Intl.DateTimeFormat(source, { hour: "numeric" }).resolvedOptions().hour12 === true;
  }
  return { language, timeZone, hour12 };
}

/** A clock time; minutes since noon are formatted through a fixed day in UTC. */
export function formatClock(instant, { language, timeZone, hour12 }, short = false) {
  const cycle = hour12 ? { hour12: true } : { hourCycle: "h23" };
  const options = short && hour12 ? { hour: "numeric" } : { hour: hour12 ? "numeric" : "2-digit", minute: "2-digit" };
  return new Intl.DateTimeFormat(language, { ...options, ...cycle, timeZone }).format(new Date(instant));
}

export function formatSinceNoon(minutes, settings, short = false) {
  return formatClock(Date.UTC(2024, 0, 1, 12) + Math.round(minutes) * MIN, { ...settings, timeZone: "UTC" }, short);
}

export function hashColor(text) {
  let hash = 0;
  for (const ch of String(text)) hash = (hash * 31 + ch.codePointAt(0)) % 360;
  return `hsl(${hash} 45% 42%)`;
}

function appName(app) {
  if (app.name) return app.name;
  const last = String(app.package || "?").split(".").filter(Boolean).pop() || "?";
  return last.charAt(0).toUpperCase() + last.slice(1);
}

// ---------------------------------------------------------------- DOM

// DOM is only ever built through these helpers: values reach the page as text nodes and
// attribute values, never as markup.
function el(tag, attributes = {}, ...children) {
  return applyTo(document.createElement(tag), attributes, children);
}
function svg(tag, attributes = {}, ...children) {
  return applyTo(document.createElementNS("http://www.w3.org/2000/svg", tag), attributes, children);
}
function applyTo(node, attributes, children) {
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false) continue;
    if (name === "style" && typeof value === "object") {
      for (const [prop, v] of Object.entries(value)) if (v !== undefined && v !== null) node.style.setProperty(prop, String(v));
    } else node.setAttribute(name, String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

const MOON = "M14.5 2.5A9.5 9.5 0 1 0 21.5 15 7.5 7.5 0 0 1 14.5 2.5z";

const STYLE = `
  :host {
    --_screen: var(--life-dashboard-before-bed-screen, #a86a00);
    --_sleep: var(--life-dashboard-before-bed-sleep, #5b4bc4);
    --_ok: var(--life-dashboard-before-bed-calm, var(--success-color, #43a047));
    --_ink: var(--primary-text-color, #1c1c1c);
    --_muted: var(--secondary-text-color, #5f6368);
    --_hairline: var(--divider-color, rgba(127, 127, 127, 0.25));
    --_raised: color-mix(in srgb, var(--_ink) 6%, transparent);
    --_accent: var(--primary-color, #03a9f4);
    display: block;
    height: 100%;
  }
  :host([dark]) {
    --_screen: var(--life-dashboard-before-bed-screen, #f7c56c);
    --_sleep: var(--life-dashboard-before-bed-sleep, #a99bfa);
  }
  ha-card { height: 100%; box-sizing: border-box; }
  .root { container-type: inline-size; padding: 16px; color: var(--_ink); }
  button { font: inherit; color: inherit; }
  button:focus-visible { outline: 2px solid var(--_accent); outline-offset: 2px; }

  .head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-bottom: 14px; min-height: 36px; }
  .chip { width: 36px; height: 36px; border-radius: var(--ha-tile-icon-border-radius, 12px); flex: none;
    display: grid; place-items: center; color: var(--_sleep);
    background: color-mix(in srgb, var(--_sleep) 18%, transparent); }
  .chip svg { width: 20px; height: 20px; fill: currentColor; display: block; }
  .head .names { min-width: 0; flex: 1 1 110px; }
  .head .t { font-weight: 500; font-size: 15px; line-height: 1.3; }
  .head .s { color: var(--_muted); font-size: 12.5px; }
  .pill { margin-inline-start: auto; flex: none; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
    white-space: nowrap; }
  .pill.calm { color: var(--_ok); background: color-mix(in srgb, var(--_ok) 16%, transparent); }
  .pill.busy { color: var(--_screen); background: color-mix(in srgb, var(--_screen) 16%, transparent); }

  .hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; margin-bottom: 14px; }
  .box { background: var(--_raised); border-radius: 14px; padding: 12px; }
  .box .v { font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; line-height: 1.2; }
  .box .k { color: var(--_muted); font-size: 12px; margin-top: 2px; }
  @container (max-width: 300px) { .hero { grid-template-columns: minmax(0, 1fr); } }

  .apps { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
  .app { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; background: var(--_raised);
    border-radius: 999px; padding: 3px 10px 3px 3px; max-width: 100%; }
  .app .ico { width: 20px; height: 20px; border-radius: 6px; display: grid; place-items: center; color: #fff;
    font-weight: 700; font-size: 10px; flex: none; }
  .app .n { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .app b { font-variant-numeric: tabular-nums; font-weight: 600; }

  .tl { display: grid; gap: 5px; }
  .row { display: grid; grid-template-columns: 50px minmax(0, 1fr) 44px; gap: 8px; align-items: center; font-size: 11px;
    background: none; border: 0; padding: 1px 0; margin: 0; text-align: start; cursor: pointer; border-radius: 6px; width: 100%; }
  .row .d { color: var(--_muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row .m { text-align: end; font-variant-numeric: tabular-nums; color: var(--_muted); white-space: nowrap; }
  .row[aria-pressed="true"] .d, .row[aria-pressed="true"] .m { color: var(--_ink); font-weight: 700; }
  .track { position: relative; height: 16px; background: var(--_raised); border-radius: 5px; overflow: hidden; direction: ltr; }
  .row[aria-pressed="true"] .track { box-shadow: 0 0 0 1px var(--_hairline); }
  .track > span { position: absolute; top: 0; bottom: 0; }
  .track .win { background: color-mix(in srgb, var(--_screen) 20%, transparent);
    border-inline-end: 1px solid color-mix(in srgb, var(--_screen) 60%, transparent); box-sizing: border-box; }
  .track .sl { top: 4px; bottom: 4px; background: color-mix(in srgb, var(--_sleep) 70%, transparent); border-radius: 4px; }
  .track .ph { top: 1px; bottom: 1px; background: var(--_screen); border-radius: 2px; min-width: 2px; }
  .track .ph.est { min-width: 0; border-radius: 0; }

  .axis { display: grid; grid-template-columns: 50px minmax(0, 1fr) 44px; gap: 8px; font-size: 10px; color: var(--_muted); margin-top: 4px; }
  .ticks { position: relative; height: 13px; direction: ltr; }
  .ticks span { position: absolute; transform: translateX(-50%); white-space: nowrap; }
  .ticks span:first-child { transform: none; }
  .ticks span.end { transform: translateX(-100%); }
  @container (max-width: 340px) { .ticks span:nth-child(even) { display: none; } }

  .key { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 10px; font-size: 11px; color: var(--_muted); }
  .key span { display: inline-flex; align-items: center; gap: 5px; }
  .key i { width: 12px; height: 8px; border-radius: 2px; display: block; flex: none; }
  .key i.ph { background: var(--_screen); }
  .key i.win { background: color-mix(in srgb, var(--_screen) 20%, transparent);
    border-inline-end: 1px solid color-mix(in srgb, var(--_screen) 60%, transparent); box-sizing: border-box; }
  .key i.sl { background: color-mix(in srgb, var(--_sleep) 70%, transparent); height: 6px; }

  .cmp { margin-top: 14px; border-top: 1px solid var(--_hairline); padding-top: 12px; font-size: 12.5px; }
  .cmp table { width: 100%; border-collapse: collapse; }
  .cmp caption { text-align: start; font-weight: 500; font-size: 13px; padding-bottom: 6px; }
  .cmp th, .cmp td { padding: 3px 0; text-align: end; font-variant-numeric: tabular-nums; font-weight: 400; }
  .cmp th[scope="row"], .cmp td:first-child { text-align: start; color: var(--_muted); padding-inline-end: 8px; }
  .cmp thead th { color: var(--_muted); font-size: 11.5px; vertical-align: bottom; padding-inline-start: 8px; }
  .cmp thead small { display: block; font-size: 11px; }
  .cmp tbody td { font-weight: 600; font-size: 14px; }
  .note { margin: 8px 0 0; color: var(--_muted); font-size: 11.5px; }
  .foot { margin-top: 12px; color: var(--_muted); font-size: 11.5px; }

  .empty { padding: 20px 4px; text-align: center; }
  .empty-figure { font-size: 16px; font-weight: 500; }
  .empty-body { margin: 6px 0 0; color: var(--_muted); font-size: 13px; overflow-wrap: anywhere; }
  .vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
`;

// ---------------------------------------------------------------- loading

function sibling(hass, entityId, key) {
  const entities = hass?.entities ?? {};
  const device = entities[entityId]?.device_id;
  if (!device) return null;
  return Object.values(entities).find((entry) => entry.device_id === device && entry.translation_key === key &&
    (!entry.platform || entry.platform === PLATFORM))?.entity_id ?? null;
}

async function history(hass, ids, start, attributes) {
  if (!ids.length) return {};
  const rows = await hass.callWS({
    type: "history/history_during_period",
    start_time: new Date(start).toISOString(),
    end_time: new Date().toISOString(),
    entity_ids: ids,
    minimal_response: !attributes,
    no_attributes: !attributes,
    significant_changes_only: false,
  });
  return rows ?? {};
}

/** Everything the card draws, from the two sensors and their history. */
export async function loadModel(hass, config, now = Date.now()) {
  const { timeZone } = localeSettings(hass);
  const window = clampNumber(config.window, 15, 180, 60);
  const compare = config.compare !== false;
  const shown = clampNumber(config.nights, 3, 14, 7);
  const days = compare ? COMPARE_DAYS : shown + 1;
  const start = now - (days + 1) * DAY;
  const sleepId = config.sleep_entity;
  const screenId = config.screen_entity;
  const sleepState = hass.states?.[sleepId];
  const screenState = hass.states?.[screenId];
  const sKind = sleepKind(sleepId, sleepState);
  const kind = screenKind(screenId, screenState);
  const wakeId = sKind === "timestamp" && typeof config.wake_entity === "string" ? config.wake_entity : null;
  const syncId = kind === "counter" ? sibling(hass, screenId, "last_screen_time_sync") : null;
  const finalId = kind === "counter" ? sibling(hass, screenId, "screen_time_yesterday") : null;

  const [withAttributes, plain] = await Promise.all([
    sKind === "attributes" ? history(hass, [sleepId], start, true) : {},
    history(hass, [
      ...(sKind === "attributes" ? [] : [sleepId, wakeId]),
      ...(kind === "slots" ? [] : [screenId, syncId, finalId]),
    ].filter(Boolean), start, false),
  ]);

  let nights;
  if (sKind === "attributes") {
    const keys = { start: config.start_attribute, end: config.end_attribute };
    const rows = historyRows(withAttributes[sleepId]);
    // The state itself carries the newest night, also when the recorder holds nothing yet.
    if (sleepState) rows.push({ at: now, state: sleepState.state, attributes: sleepState.attributes ?? {} });
    nights = nightsFromAttributes(rows, timeZone, keys);
  } else if (sKind === "onoff") {
    nights = nightsFromOnOff(historyRows(plain[sleepId]), now, timeZone);
  } else {
    nights = nightsFromTimestamps(historyRows(plain[sleepId]), historyRows(plain[wakeId]), timeZone);
  }
  nights = nights.filter((night) => night.start >= start);

  let blocks;
  let coveredFrom = null;
  if (kind === "slots") {
    const attributes = screenState.attributes;
    blocks = blocksFromSlots(attributes.slots, attributes.slot_minutes);
    coveredFrom = toInstant(attributes.since) ?? (blocks.length ? blocks[0].from : null);
  } else {
    const rows = historyRows(plain[screenId]);
    coveredFrom = rows.length ? rows[0].at : null;
    if (kind === "onoff") blocks = blocksFromOnOff(rows, now);
    else {
      const factor = UNIT_MINUTES[screenState?.attributes?.unit_of_measurement] ?? 1;
      const ticks = historyRows(plain[syncId]).map((row) => toInstant(row.state) ?? row.at);
      const finalFactor = UNIT_MINUTES[hass.states?.[finalId]?.attributes?.unit_of_measurement] ?? factor;
      const finals = historyRows(plain[finalId]).map((row) => ({ ...row, state: String(Number(row.state) * finalFactor / factor) }));
      // The day starts at midnight, or at the hour the phone's day boundary is set to.
      const reset = toInstant(screenState?.attributes?.last_reset);
      const shift = reset === null ? 0 : clockMinutes(reset, timeZone) * MIN;
      const boundary = (from, to) => {
        let edge = localMidnight(to, timeZone) + shift;
        if (edge > to) edge -= DAY;
        return edge > from ? edge : null;
      };
      blocks = blocksFromCounter(rows, factor, ticks, { finals, boundary });
    }
  }
  const exact = kind !== "counter";
  const all = withScreen(nights, blocks, { window, coveredFrom, exact });
  return {
    kind,
    exact,
    window,
    blocks,
    nights: all,
    shown: all.slice(-shown),
    comparison: compare ? compareNights(all, clampNumber(config.threshold, 1, 120, 15), timeZone) : null,
    threshold: clampNumber(config.threshold, 1, 120, 15),
    days: COMPARE_DAYS,
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && value !== null && value !== "" ? Math.min(Math.max(number, min), max) : fallback;
}

/** The sensors the card can read without help, for the picker's first guess. */
export function guessEntities(hass) {
  const entries = Object.values(hass?.entities ?? {});
  const ids = Object.keys(hass?.states ?? {});
  const sleep = entries.find((entry) => entry.translation_key === "last_sleep_asleep" && (!entry.platform || entry.platform === PLATFORM))?.entity_id ??
    ids.find((id) => id.startsWith("sensor.") && id.endsWith("_last_sleep_asleep")) ??
    ids.find((id) => id.startsWith("sensor.") && id.endsWith("_health_connect_sleep_duration")) ?? "";
  const screen = ids.find((id) => id.startsWith("binary_sensor.") && id.endsWith("_interactive")) ??
    entries.find((entry) => entry.translation_key === "screen_time_today" && (!entry.platform || entry.platform === PLATFORM))?.entity_id ??
    ids.find((id) => id.startsWith("sensor.") && id.endsWith("_screen_time_today")) ?? "";
  return { sleep_entity: sleep, screen_entity: screen };
}

// ---------------------------------------------------------------- card

const Base = globalThis.HTMLElement ?? class {};

class BeforeBedCard extends Base {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(el("style", {}, STYLE));
    this._card = el("ha-card");
    this._root = el("div", { class: "root" });
    this._card.append(this._root);
    this.shadowRoot.append(this._card);
    this._selected = null;
  }

  static getConfigElement() {
    return document.createElement(`${TAG}-editor`);
  }

  static getStubConfig(hass) {
    return guessEntities(hass);
  }

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    for (const key of ["sleep_entity", "screen_entity", "wake_entity"]) {
      if (config[key] !== undefined && config[key] !== null && typeof config[key] !== "string") {
        throw new Error(`\`${key}\` must be an entity id`);
      }
    }
    this._config = { ...config };
    this._seen = undefined;
    this._model = undefined;
    this._selected = null;
    if (this._hass) this._update();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._config) this._update();
  }

  get hass() {
    return this._hass;
  }

  getCardSize() {
    return 7;
  }

  getGridOptions() {
    return { columns: 12, rows: "auto", min_columns: 6 };
  }

  _t(key, values) {
    return translate(localeSettings(this._hass).language, key, values);
  }

  _update() {
    const hass = this._hass;
    const { sleep_entity: sleepId, screen_entity: screenId, wake_entity: wakeId } = this._config;
    this.toggleAttribute("dark", hass?.themes?.darkMode === true);
    const sleep = hass?.states?.[sleepId];
    const screen = hass?.states?.[screenId];
    const slots = screenKind(screenId, screen) === "slots";
    // The screen sensor changes all day; its history is only read again after a while.
    const dataKey = JSON.stringify([sleepId, screenId, wakeId, Boolean(sleep), Boolean(screen), sleep?.last_updated,
      hass?.states?.[wakeId]?.last_updated, slots ? screen?.last_updated : Math.floor(Date.now() / HISTORY_TTL)]);
    const viewKey = JSON.stringify([dataKey, hass?.locale?.language, hass?.locale?.time_format, hass?.locale?.time_zone,
      hass?.themes?.darkMode]);
    if (dataKey !== this._dataKey) {
      this._dataKey = dataKey;
      if (sleep && screen) this._load(dataKey);
      else this._model = undefined;
    }
    if (viewKey !== this._seen) {
      this._seen = viewKey;
      this._render();
    }
  }

  _load(key) {
    loadModel(this._hass, this._config)
      .then((model) => { if (key === this._dataKey) { this._model = model; this._failed = false; this._render(); } })
      .catch(() => { if (key === this._dataKey) { this._model = undefined; this._failed = true; this._render(); } });
  }

  _render() {
    if (!this._hass || !this._config) return;
    this._renders = (this._renders ?? 0) + 1;
    this._root.replaceChildren(...[this._build()].flat(Infinity).filter(Boolean));
  }

  _empty(title, body) {
    return [
      this._head(null),
      el("div", { class: "empty" }, el("div", { class: "empty-figure" }, title), body ? el("p", { class: "empty-body" }, body) : null),
    ];
  }

  _head(subtitle, pill) {
    return el("div", { class: "head" },
      el("span", { class: "chip", "aria-hidden": "true" }, svg("svg", { viewBox: "0 0 24 24" }, svg("path", { d: MOON }))),
      el("div", { class: "names" }, el("div", { class: "t" }, this._config.title || this._t("title")),
        subtitle ? el("div", { class: "s" }, subtitle) : null),
      pill ?? null);
  }

  _build() {
    const { sleep_entity: sleepId, screen_entity: screenId } = this._config;
    if (!sleepId || !screenId) return this._empty(this._t("pickTitle"), this._t("pickBody"));
    for (const entity of [sleepId, screenId]) {
      if (!this._hass.states?.[entity]) return this._empty(this._t("missingTitle"), this._t("missingBody", { entity }));
    }
    const model = this._model;
    if (!model) return this._empty(this._failed ? this._t("noNightsTitle") : this._t("loading"));
    if (!model.shown.length) return this._empty(this._t("noNightsTitle"), this._t("noNightsBody", { entity: sleepId }));

    const settings = localeSettings(this._hass);
    const { language, timeZone } = settings;
    const d = (minutes) => formatDuration(minutes, language);
    const windowText = formatMinutes(model.window, language);
    const nights = model.shown;
    const picked = nights.find((night) => night.start === this._selected) ?? nights[nights.length - 1];
    const dateOf = (night, long = false) => new Intl.DateTimeFormat(language, long
      ? { timeZone, weekday: "long", day: "numeric", month: "long" }
      : { timeZone, weekday: "short", day: "numeric" }).format(new Date(night.start - 12 * HOUR));
    const before = (night) => (night.before === null ? null : `${model.exact ? "" : "~"}${d(night.before)}`);

    const axis = axisFor(nights, model.window, timeZone);
    const span = axis.to - axis.from;
    const asleepSpans = model.exact ? [] : model.nights.map((night) => [night.start, night.end]);

    const rows = nights.map((night) => {
      const rel = sinceNoon(night.start, timeZone);
      // The instant at the left edge of this row.
      const origin = night.start - (rel - axis.from) * MIN;
      const pct = (instant) => Math.max(0, Math.min(100, ((instant - origin) / MIN / span) * 100));
      const bar = (cls, from, to, style = {}) => (pct(to) > pct(from) || cls.startsWith("ph")
        ? el("span", { class: cls, style: { left: `${pct(from)}%`, width: `${pct(to) - pct(from)}%`, ...style } }) : null);
      const edge = [origin, origin + span * MIN];
      const marks = [];
      for (const block of model.blocks) {
        if (block.to <= edge[0] || block.from >= edge[1]) continue;
        if (block.exact) { marks.push(bar("ph", block.from, block.to)); continue; }
        const pieces = blockPieces(block, asleepSpans);
        const room = pieces.reduce((sum, [a, b]) => sum + (b - a), 0) / MIN;
        const opacity = Math.max(0.2, Math.min(1, block.minutes / room));
        for (const [from, to] of pieces) {
          if (to > edge[0] && from < edge[1]) marks.push(bar("ph est", from, to, { opacity: opacity.toFixed(2) }));
        }
      }
      const values = { date: dateOf(night, true), window: windowText, time: formatClock(night.start, settings),
        duration: d(night.asleep), minutes: before(night) };
      const row = el("button", { type: "button", class: "row", "aria-pressed": String(night === picked),
        "aria-label": this._t(night.before === null ? "rowNoData" : "rowLabel", values),
        title: this._t(night.before === null ? "rowNoData" : "rowLabel", values) },
      el("span", { class: "d" }, dateOf(night)),
      el("div", { class: "track", "aria-hidden": "true" },
        bar("win", night.start - model.window * MIN, night.start),
        bar("sl", night.start, night.end),
        marks),
      el("span", { class: "m" }, before(night) ?? "-"));
      row.addEventListener("click", () => { this._selected = night.start; this._render(); });
      return row;
    });

    const tickList = axisTicks(axis);
    const ticks = tickList.map((at, index) => el("span", { class: index === tickList.length - 1 && at === axis.to ? "end" : null,
      style: { left: `${((at - axis.from) / span) * 100}%` } }, formatSinceNoon(at, settings, true)));

    const calm = picked.before !== null && picked.before < model.threshold;
    const pill = picked.before === null ? null
      : el("span", { class: `pill ${calm ? "calm" : "busy"}` }, this._t(calm ? "calm" : "busy"));
    const heroKey = model.kind === "onoff" ? "heroScreen" : model.exact ? "heroPhone" : "heroEstimate";
    const legendKey = model.kind === "onoff" ? "legendScreen" : model.exact ? "legendPhone" : "legendEstimate";
    const apps = picked.apps.slice(0, 4).map((app) => {
      const name = appName(app);
      return el("span", { class: "app" },
        el("span", { class: "ico", "aria-hidden": "true", style: { background: hashColor(app.package || name) } },
          Array.from(name)[0]?.toUpperCase() ?? "?"),
        el("span", { class: "n" }, name), el("b", {}, d(app.minutes)));
    });

    return [
      this._head(dateOf(picked, true), pill),
      el("div", { class: "hero" },
        el("div", { class: "box" }, el("div", { class: "v" }, before(picked) ?? this._t("noData")),
          el("div", { class: "k" }, this._t(heroKey, { window: windowText }))),
        el("div", { class: "box" }, el("div", { class: "v" }, d(picked.asleep)),
          el("div", { class: "k" }, this._t("asleepFrom", { time: formatClock(picked.start, settings) })))),
      apps.length ? el("div", { class: "apps" }, apps) : null,
      el("div", { class: "tl" }, rows),
      el("div", { class: "axis", "aria-hidden": "true" }, el("span"), el("div", { class: "ticks" }, ticks), el("span")),
      el("div", { class: "key" },
        el("span", {}, el("i", { class: "ph" }), this._t(legendKey)),
        el("span", {}, el("i", { class: "win" }), this._t("legendWindow", { window: windowText })),
        el("span", {}, el("i", { class: "sl" }), this._t("legendAsleep"))),
      this._comparison(model, settings),
      model.exact ? null : el("div", { class: "foot" }, this._t("estimateNote")),
    ];
  }

  _comparison(model, settings) {
    const comparison = model.comparison;
    if (!comparison) return null;
    if (!comparison.ready) {
      return el("div", { class: "cmp" }, el("p", { class: "note", style: { margin: "0" } }, this._t("cmpWaiting", { n: MIN_GROUP })));
    }
    const { language } = settings;
    const threshold = formatMinutes(model.threshold, language);
    const column = (key, group) => el("th", { scope: "col" }, this._t(key, { value: threshold }),
      el("small", {}, this._t("cmpNights", { n: group.nights })));
    return el("div", { class: "cmp" },
      el("table", {},
        el("caption", {}, this._t("cmpTitle", { days: model.days })),
        el("thead", {}, el("tr", {}, el("td", {}), column("cmpUnder", comparison.calm), column("cmpOver", comparison.busy))),
        el("tbody", {},
          el("tr", {}, el("th", { scope: "row" }, this._t("cmpFellAsleep")),
            el("td", {}, formatSinceNoon(comparison.calm.fellAsleep, settings)),
            el("td", {}, formatSinceNoon(comparison.busy.fellAsleep, settings))),
          el("tr", {}, el("th", { scope: "row" }, this._t("cmpAsleep")),
            el("td", {}, formatDuration(comparison.calm.asleep, language)),
            el("td", {}, formatDuration(comparison.busy.asleep, language))))),
      el("p", { class: "note" }, this._t("cmpNote")));
  }
}

// ---------------------------------------------------------------- editor

class BeforeBedEditor extends Base {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    this._render();
  }

  _schema() {
    const onOff = ["sensor", "binary_sensor", "input_boolean"];
    const schema = [
      { name: "sleep_entity", required: true, selector: { entity: { domain: onOff } } },
    ];
    const sleepId = this._config.sleep_entity;
    if (sleepId && sleepKind(sleepId, this._hass?.states?.[sleepId]) === "timestamp") {
      schema.push({ name: "wake_entity", selector: { entity: { domain: "sensor", device_class: "timestamp" } } });
    }
    schema.push(
      { name: "screen_entity", required: true, selector: { entity: { domain: onOff } } },
      { name: "title", selector: { text: {} } },
      { name: "window", selector: { number: { min: 15, max: 180, step: 15, mode: "slider" } } },
      { name: "nights", selector: { number: { min: 3, max: 14, mode: "slider" } } },
      { name: "threshold", selector: { number: { min: 5, max: 60, step: 5, mode: "slider" } } },
      { name: "compare", selector: { boolean: {} } },
    );
    return schema;
  }

  _label(name) {
    const key = { sleep_entity: "edSleep", wake_entity: "edWake", screen_entity: "edScreen", title: "edTitle",
      window: "edWindow", nights: "edNights", threshold: "edThreshold", compare: "edCompare" }[name];
    return translate(localeSettings(this._hass).language, key ?? name);
  }

  _render() {
    if (!this.shadowRoot || !this.isConnected || !this._hass) return;
    if (!customElements.get("ha-form")) {
      if (!this._waiting) {
        this._waiting = true;
        customElements.whenDefined("ha-form").then(() => this._render());
      }
      return;
    }
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (item) => this._label(item.name);
      this._form.addEventListener("value-changed", (event) => {
        event.stopPropagation();
        const config = { ...this._config, ...event.detail.value };
        for (const [key, value] of Object.entries(config)) {
          if (value === "" || value === undefined || value === null) delete config[key];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.shadowRoot.replaceChildren(this._form);
    }
    this._form.hass = this._hass;
    const schema = this._schema();
    const key = JSON.stringify(schema);
    if (key !== this._schemaKey) {
      this._schemaKey = key;
      this._form.schema = schema;
    }
    this._form.data = { window: 60, nights: 7, threshold: 15, compare: true, ...this._config };
  }
}

if (typeof customElements !== "undefined") {
  if (!customElements.get(TAG)) customElements.define(TAG, BeforeBedCard);
  if (!customElements.get(`${TAG}-editor`)) customElements.define(`${TAG}-editor`, BeforeBedEditor);
}

if (typeof window !== "undefined") {
  window.customCards = window.customCards || [];
  if (!window.customCards.some((card) => card.type === TAG)) {
    window.customCards.push({
      type: TAG,
      name: "Life Dashboard Before Bed",
      description: "Screen time in the last hour before sleep, next to the night that followed.",
      preview: true,
      documentationURL: "https://github.com/owen282000/life-dashboard-before-bed-card",
    });
  }
}
