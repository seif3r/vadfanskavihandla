# Vad fan ska vi handla

En gemensam inköpslista för hushållet, så att den som står i affären alltid ser vad de andra just har lagt till.

Live: https://seif3r.github.io/vadfanskavihandla/

## Vad det gör

Du skapar ett konto och en grupp, till exempel "Hemma", och bjuder in dem du handlar med via en kod. Alla i gruppen ser gruppens listor och varandras ändringar direkt. Du kan lägga till varor med mängd och kategori, bocka av dem och rensa det avbockade. När någon lägger till eller tar bort varor kan de andra få en notis, och en persons ändringar samlas till en enda notis en minut efter den sista ändringen ("Anna lade till 3 varor: mjölk, ägg, bröd"). Att bocka av en vara är personligt och skickar ingen notis.

## Kom igång

### Krav

- Node 24 och npm
- Ett Firebase-projekt med Authentication (e-post och lösenord) och Cloud Firestore. Cloud Functions (notiser, inbjudningar, radering) kräver Blaze-planen.
- Firebase CLI (`npm install -g firebase-tools`) för att driftsätta regler, index och funktioner
- Java 21 eller senare, för regel- och funktionstesterna (de kör Firestore-emulatorn)
- Valfritt: Expo Go på telefonen för snabbtest, och ett Expo-konto med EAS CLI för riktiga Android-byggen med push

### Installation

```bash
git clone https://github.com/seif3r/vadfanskavihandla
cd vadfanskavihandla
npm install
```

### Konfiguration

Skapa en `.env.local` i projektets rot (den är git-ignorerad) med webbkonfigurationen från Firebase-konsolen, under Project settings › Your apps:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=ditt-värde
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=ditt-projekt.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=ditt-projekt
EXPO_PUBLIC_FIREBASE_APP_ID=ditt-värde
```

Alla variabler finns listade i `.env.example`, även de valfria för App Check och de lokala emulatorerna. Driftsätt sedan backend en gång:

```bash
firebase use ditt-projekt
firebase deploy --only firestore,functions
```

Hela uppsättningen, med regioner, Android-byggen och GitHub Pages, finns i [docs/setup.md](docs/setup.md).

### Kör projektet

```bash
npm run web       # i webbläsaren
npm run android   # i Android-emulatorn
npm start         # QR-kod för Expo Go på telefonen
```

Tester:

```bash
npm test                # appen: hjälpfunktioner, komponenter, skärmar och hooks
npm run test:rules      # säkerhetsreglerna, mot Firestore-emulatorn
npm run test:functions  # Cloud Functions, mot Firestore-emulatorn
```

GitHub Actions kör allt detta på varje pull request, och varje push till `main` publicerar webbversionen på GitHub Pages.

## Arkitektur

Appen är en Expo-app med en kodbas för Android, iOS och webb. Skärmarna i `app/` renderar bara och anropar hooks. Hooks i `hooks/` håller serverdata med TanStack Query och håller listorna levande med realtidslyssnare. Den enda koden som pratar med Firebase finns i `api/`, och den gör om alla Firebase-fel till översättningsnycklar. Säkerheten ligger i databasen: `firestore.rules` ser till att man bara når listorna i sina egna grupper, och validerar det som skrivs. Det som klienten inte får göra själv, som att gå med i en grupp, skicka samlade notiser, städa efter raderingar och radera konton, sköts av Cloud Functions i `functions/`.

```
vadfanskavihandla/
├── app/                  # Skärmar och routes (Expo Router); _layout.tsx sätter upp providers
├── components/           # Återanvändbara UI-komponenter
├── hooks/                # Datahooks (TanStack Query) och realtidsuppdateringar (useLiveUpdates)
├── context/              # Inloggning (AuthContext), öppen lista, synkstatus
├── api/                  # Enda vägen till Firebase; firebase.ts sätter upp klienten
├── helpers/              # Rena funktioner utan UI
├── types/                # Alla typer och interface
├── constants/            # Tema, textgränser och backend-inställningar
├── i18n/                 # Översättningar (svenska och engelska)
├── functions/            # Cloud Functions, ett eget Node-projekt
├── tests/                # Regeltester och skärmtester
├── docs/                 # Uppsättning (setup.md) och notiser (notifications.md)
├── firestore.rules       # Säkerhetsregler och datavalidering
└── firestore.indexes.json  # Index för Firestore-frågorna
```

## Teknisk stack

| Komponent | Val | Anledning |
| --- | --- | --- |
| App | Expo, React Native och TypeScript | En kodbas för Android, iOS och webb. Expo sköter byggen (EAS) och native-moduler. |
| Navigering | Expo Router | Filbaserad routing som fungerar likadant på webb och mobil. |
| Serverdata | TanStack Query | Cache, optimistiska uppdateringar och en plats där realtidsdata skrivs in. |
| Backend | Firebase: Authentication, Cloud Firestore och Cloud Functions | Inloggning, databas med realtidslyssnare och serverlogik i ett projekt, utan egen server. JavaScript-SDK:n gör att Expo Go och webben fungerar. |
| Notiser | Cloud Tasks, Expos push-tjänst och expo-notifications | Cloud Tasks väntar en minut och samlar ändringarna. Expo levererar till telefonerna, och på webben visas notiserna i appen. |
| Översättning | i18next | Appen är på svenska och engelska från början. |
| Hosting | GitHub Pages (webb) och EAS Build (Android) | Statisk export till Pages, och installerbara Android-byggen. |
| Tester och CI | Jest, Firestore-emulatorn och GitHub Actions | Säkerhetsreglerna och funktionerna testas mot en riktig, lokal databas. |

## Begränsningar

- Push-notiser fungerar bara i installerade Android-byggen. iOS är inte byggt än (det kräver Apples utvecklarprogram). På webben och i Expo Go visas notiser bara medan appen är öppen; ändringar som görs när appen är stängd syns i listan men ger ingen notis.
- Offline fungerar bäst på webben, där listorna sparas i webbläsaren. På telefonen finns bara det som har laddats sedan appen startade, så en telefon som startar appen utan täckning visar "Kunde inte laddas" tills den får nät.
- En vara kan inte redigeras efter att den lagts till. Man kan bara bocka av den eller ta bort den.
- "Ta bort avbockade" raderar för hela gruppen och kan inte ångras, även om det kräver två tryck.
- Inloggning finns bara med e-post och lösenord, inte med Google eller Apple.
- App Check skyddar bara webben. Det kan inte tvingas på än, eftersom telefonerna inte har något App Check-stöd.
- Appen finns inte i Google Play eller App Store, utan installeras som APK.
- Cloud Functions kräver Firebases Blaze-plan, även om ett hushålls användning ryms i gratiskvoterna.

## Utvecklat med

Claude Code (agentdriven utveckling) som del av kursen Next-Generation Software Development with AI.
