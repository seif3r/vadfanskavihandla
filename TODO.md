# Fixlista / att göra

## Mindre funktioner

- [ ] Se hur många saker som ligger i de olika listorna, inklusive hur många av dem som är osedda
  - Var: antal (totalt + osedda) i listöversikten; bara en "uppdaterad"-markering på flikarna.
  - Antal = alla varor i listan, avbockade inräknade.
  - Osedd = tillagd av någon annan än jag. Blir sedd när den har scrollats fram på skärmen
    (synlig, inte nödvändigtvis förbiscrollad).
  - Synk mellan enheter om det inte belastar servern för mycket, annars lokalt per enhet.
    Förslag: spara sedda varu-id:n lokalt och skriv dem till Firestore (ett dokument per
    användare och lista) med fördröjning, så det blir en skrivning per listbesök, inte per vara.
    I så fall måste dokumentet in i `cleanUpList` och `deleteAccount`.
- [x] Ändra notiser så att man inte ser vad som är avbockat
  - Notiser nämner inga varor. Listans namn är rubriken, texten säger vem och om det var en
    eller flera: "Anna lade till en vara", "Anna tog bort varor".
  - Aldrig notis vid avbockning eller när en bock tas bort (så är det redan idag).
  - Ändras på båda ställena: `functions/` (push) och `hooks/useLiveUpdates.ts` (webb/Expo Go),
    plus texterna i `en.json` och `sv.json`.
- [x] Notis på avbockad eller borttagen? 1 min för avbockad är för kort
  - Väntetid efter personens senaste ändring: 2 min för tillagda varor, 5 min för borttagna.
  - Tillagt och borttaget får alltså varsin timer/bunt. Ändras i `functions/`
    (`DELAY_SECONDS`) och i appen (`NOTIFICATION_DELAY_SECONDS` i `constants/limits.ts`,
    `hooks/useLiveUpdates.ts`).
- [x] Jag ser inte vad jag skriver när jag lägger till artiklar
  - Android-appen: tangentbordet täcker inmatningsfältet, varje gång.
  - Inmatningen måste flytta upp ovanför tangentbordet (t.ex. `KeyboardAvoidingView` /
    `softwareKeyboardLayoutMode` i `app.json`). Testas i emulatorn.
- [x] Jag vill kunna ändra tillagda varor
  - Ändra namn, mängd och kategori.
  - Alla i gruppen får ändra, även avbockade varor.
  - Penna-ikon längst till höger på varje rad öppnar redigeringen.
  - Ingen notis vid ändring.
  - Kräver regeländring först (idag får bara `done`/`updatedBy` ändras), med samma
    längd- och kategorikontroller som när varan skapas. Ny kategori bör även uppdatera
    listans kategoriminne (`knownItems`).
- [ ] Kategoriminnet ska inte vara per användare utan hellre per lista
  - Minnet är redan per lista (`lists/{listId}/knownItems`), men laddas bara en gång per
    enhet och uppdateras bara med egna tillägg, så andras val syns först efter omstart.
  - Lösning: när liveuppdateringen av varorna ser en ny vara med kategori från någon annan,
    uppdatera den lokala `knownItems`-cachen från den. Inga extra läsningar mot servern.
- [ ] Skapa lista till sig själv
  - Varje användare får en egen privat grupp, "Mina listor", med bara sig själv som medlem.
  - Gruppen kan inte döpas om och ingen kan bjudas in. Listor i den delas aldrig senare.
  - Egen sektion högst upp i listöversikten.
  - Visar antal varor men inte osedda (funktion 1).
  - Att lösa: gruppen markeras (t.ex. `personal: true`) och namnet visas via `t()` så det
    följer språket. Reglerna stoppar inbjudningar, namnbyte, nya medlemmar, att lämna och att
    radera den. `joinGroup` vägrar koder till den. Skapas när den saknas (även för befintliga
    användare). `deleteAccount` tar redan bort grupper där man är ensam medlem.
- [ ] Inbjudningslänkar som öppnar appen och lägger till personen i gruppen
  - Delningstexten blir t.ex. "Du har bjudits in till gruppen X. Klicka här för att gå med
    i appen, eller gå med med inbjudningskoden XXX."
  - Finns redan: `/join?code=...` fyller i koden, och delningen går via `shareText`.
  - Länken är en https-länk till webbversionen
    (`https://seif3r.github.io/vadfanskavihandla/join?code=...`), eftersom
    `vadfanskavihandla://`-länkar inte är klickbara i de flesta meddelandeappar.
  - Webbsidan visar en knapp "Öppna i appen" (`vadfanskavihandla://join?code=...`), bara på
    mobil. Äkta Android App Links väljs bort (kräver `assetlinks.json` i domänens rot).
  - Länken går inte med automatiskt: skärmen visar "Gå med i X?" med knapparna "Gå med" och
    "Avbryt". Gruppnamnet hämtas från inbjudan, som redan sparar det.
  - Saknar personen konto följer koden med genom inloggning/registrering, och efteråt hamnar
    hen på samma fråga.

## Större funktioner

- [ ] Födelsedagslistor: listor i grupper som utesluter en vald medlem. Den medlemmen kan lägga
      till saker men ser inte vad som är kvar, och alla andra får notiser när något bockas av.
  - **Framtida funktion, ska specificeras bättre innan den byggs.**
  - En grupp kan skapa en önskelista i stället för en inköpslista, med lite andra regler.
  - Vem som helst i gruppen kan skapa en önskelista för vem som helst annan i gruppen.
    Listan (namn, mottagare, radering) kan bara ändras av andra än mottagaren.
  - Mottagaren ser bara sina egna önskningar och kan inte se vad som är köpt.
  - Andra kan lägga till förslag som mottagaren inte ser. De visas för övriga med annan färg
    och annan layout.
  - Övriga ser vem som bockat av något och kan reservera varor innan de köps.
  - Avbockning skickar notis till alla utom mottagaren, efter 2 min, t.ex.
    "Anna bockade av en vara i Kalles önskelista".
  - Efteråt rensas avbockade varor, men bara när någon (inte mottagaren) går in och rensar.
  - Per grupp: bara medlemmar i den gruppen ser och bockar av.
  - Måste säkras i reglerna, inte bara i appen. Det mottagaren inte får se (status,
    reservationer, andras förslag) måste ligga där reglerna kan neka mottagaren att läsa det,
    t.ex. i separata dokument.
  - Mottagaren får en notis, "En önskelista har skapats åt dig i gruppen X", om hen inte
    skapade listan själv.
  - Lämnar mottagaren gruppen ligger listan kvar tills någon annan i gruppen raderar den.
    Raderas gruppen raderas listan med den (via `cleanUpGroup`, som för andra listor).
  - Reserverade varor visas i rött (en färg i temat) med texten "Reserverad". Reservationen
    gäller tills någon rensar listan. Rensningen tar bort avbockade varor och alla
    reservationer; reserverade varor som inte är avbockade blir lediga igen.
