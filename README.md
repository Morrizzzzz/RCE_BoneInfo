# BoneInfo — doorzoekbare webversie

Een complete statische Nederlandstalige zoekwebsite voor de BoneInfo Access-database. Geen Access, serverdatabase, betaalde dienst, API-sleutel, installatie of build nodig voor publicatie. De browser leest de meegeleverde JSON-export. De website is alleen-lezen.

## Publiceren op GitHub Pages

1. Pak `boneinfo-github-pages.zip` uit.
2. Maak een GitHub-repository, bijvoorbeeld `boneinfo`. Een openbare repository werkt met GitHub Free.
3. Upload de **inhoud** van de uitgepakte map naar de hoofdmap van de repository: `index.html` moet direct in de hoofdmap staan, naast `app.js`, `search.js`, `style.css` en de map `data`. Upload niet alleen het ZIP-bestand. Laat de mappenstructuur intact.
4. Commit de bestanden naar `main`.
5. Open **Settings → Pages**. Kies bij **Source**: **Deploy from a branch**. Selecteer **main** en **/(root)** en klik **Save**.
6. Wacht op de publicatie en gebruik **Visit site** in hetzelfde scherm. Bij een projectrepository is de URL doorgaans `https://GEBRUIKERSNAAM.github.io/boneinfo/`.

Alle assetpaden zijn relatief en werken ook onder een repository-subpad. `.nojekyll` schakelt Jekyll uit. De scripts (inclusief Leaflet en Proj4js) worden lokaal meegeleverd. Er zijn geen webfonts, analytics of CDN-afhankelijkheden voor scripts. De achtergrondkaart wordt online opgehaald bij PDOK/Kadaster. De gegevens worden volledig openbaar toegankelijk wanneer je deze site publiceert.

GitHub-handleiding: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Lokaal bekijken (Windows)

Open een terminal in de uitgepakte map en voer uit:

```shell
python -m http.server 8000
```

Open vervolgens http://localhost:8000 . Als `python` niet wordt herkend, probeer `py -m http.server 8000`. Stop de server met Ctrl+C. Dubbelklikken op `index.html` werkt niet wegens browserbeperkingen op modules en lokale JSON-bestanden.

## Mogelijkheden

- Vrije tekst over alle clustergegevens, taxonomie en literatuur.
- Filters op provincie, plaats/gemeente, complextype, diersoort, diergroep, archeologische periode, jaren, onderzoeker/instantie, literatuur en clusternummer.
- Tekst is niet hoofdletter- of accentgevoelig. Woorden worden met AND gecombineerd; `*` en `?` zijn wildcards. Substrings worden gevonden. Geen querytaal met OR of aanhalingstekens.
- Soortfilter zoekt woorden binnen één taxon, inclusief Nederlandse, Latijnse en Engelse namen en taxonomie. Diergroep en diersoort zijn onafhankelijke clusterfilters: ze hoeven niet op dezelfde soortvermelding te slaan.
- Sorteren, pagina's van 25 clusters en detailvensters met alle oorspronkelijke clustergegevens, soorten, opmerkingen, taxonomie en literatuur.
- URL bewaart filters en paginanummer; clusterlink opent het detailvenster.
- CSV van **alle gevonden clusters**, één rij per cluster, puntkomma's en UTF-8 met BOM voor Excel. Soorten en literatuur staan samengevoegd in aparte kolommen. Potentiële spreadsheetformules worden als tekst geëxporteerd.
- Volledige JSON-download met zeven inhoudelijke tabellen voor relationeel hergebruik.

## Bron en conversie

Bron: https://cultureelerfgoed.info/BoneInfo/
Bestand: https://cultureelerfgoed.info/BoneInfo/BoneInfo_V01_10.mdb
Opgehaald/export gemaakt: 26 oktober 2026. Dit is de exportdatum, niet de actualiteitsdatum van de oorspronkelijke gegevens.
SHA-256 MDB: `73f99c7865531000b89a0c9dd3f31f6173103aabf2b2c9e7d86f267ea9b76e89`.

| Tabel | Records |
| --- | ---: |
| tblZoo_cluster | 2.434 |
| tblZoo_diersoort | 28.808 |
| tblDiersoort | 1.390 |
| tblZoo_publicatie | 4.593 |
| tblPeriodiek | 313 |
| tblPeriode | 54 |
| tblOmvang | 5 |

Relaties: `tblZoo_cluster.Zoonr` koppelt soorten en publicaties; `DiersoortID` verwijst naar `tblDiersoort.diersoortID`; `Periodiek` verwijst naar `tblPeriodiek.PeriodiekID`. Ook niet-gebruikte taxa zijn bewaard in JSON. De Access-hulptabellen, zoekindexen, tijdelijke selecties, VBA en formulieren zijn niet nodig voor deze website en zijn niet geëxporteerd. Alle velden van de zeven inhoudelijke tabellen zijn behouden als strings. Lege/null-waarden worden door deze conversie als lege string weergegeven. Datumvelden behouden de mdbtools-exportnotatie (maand/dag/jaar bij Datum_invoer).

Alle soortvermeldingen en publicaties verwijzen naar een bestaand cluster. **17 soortvermeldingen hebben geen bijbehorend taxon**. Ze zijn behouden, inclusief hun oorspronkelijke ID en opmerkingen; de website markeert ze als niet gekoppeld. Bronwaarden worden niet stilzwijgend gerepareerd. Schrijfvarianten en historische gemeentenamen zijn bewaard.

## Datering: expliciete interpretatie

- Niet-lege jaarvelden met een waarde anders dan 0 hebben voorrang.
- Jaar 0 wordt voor de zoekfunctie als ontbrekend behandeld; een kalenderjaar nul bestaat niet in deze v.Chr./n.Chr.-weergave. Bij 0 of een lege waarde worden de numerieke grenzen van de gekoppelde bronperiode gebruikt. Het detailvenster en de export tonen de oorspronkelijke waarden.
- Periode `Onbekend` levert geen geschatte grens op. Het filter Onbekend selecteert clusters waarvan ten minste één periodecode Onbekend is.
- Jaar- en periodefilters selecteren overlappende intervallen, inclusief de grenzen. Bij onvoldoende datering valt een cluster buiten een actief tijdsfilter. Een omgekeerd zoekinterval levert geen resultaten op.
- Alle periodegrenzen volgen `tblPeriode`: “heden” is in deze historische tabel geen dynamische huidige datum. Sommige paleolithische omschrijvingen verwijzen naar C14; de zoekfunctie kalibreert of herinterpreteert deze chronologie niet. Gebruik de oorspronkelijke codes, omschrijvingen en publicaties bij wetenschappelijke interpretatie.
- Beschrijvingen kunnen een preciezere datering bevatten dan de gestructureerde velden. Er wordt geen datering uit vrije tekst afgeleid.

## Gegevens later bijwerken

De website synchroniseert niet automatisch. Voor herhaalbare conversie is `scripts/export_database.py` meegeleverd (Python standaardbibliotheek plus MDB Tools). Op Ubuntu/WSL:

```shell
sudo apt install mdbtools
python3 scripts/export_database.py /pad/naar/BoneInfo_V01_10.mdb
npm test
```

Commit daarna het vernieuwde `data/boneinfo.json`. De website heeft Python en MDB Tools alleen voor deze conversiestap nodig. Tests bevatten steekproeven en verwachte aantallen van de meegeleverde bronversie; pas deze bewust aan wanneer de bron gewijzigd is.

## Controle

Automatische tests controleren aantallen, behoud van relaties, ontbrekende taxa, vrije tekst/wildcards, gecombineerde filters, periode-overlap, nuljaren en CSV-escaping. Browsercontrole uitgevoerd voor laden, gecombineerde locatie/soortfilters, openen van clustergegevens, herladen van een detail-URL en bediening van CSV-export. GitHub-publicatie is niet uitgevoerd; daarvoor is upload naar je eigen repository nodig.

## Bestanden aanpassen

- `index.html`: tekst, formulier en pagina-indeling.
- `style.css`: vormgeving en responsive regels.
- `app.js`: interface, details, URL-status en CSV.
- `search.js`: relaties en zoeklogica.
- `data/boneinfo.json`: gegevens en bronmetadata.

De site is een zelfstandige webversie, geen officiële RCE-website. Bronvermelding staat op de pagina. Er wordt geen nieuwe licentie voor de oorspronkelijke gegevens geclaimd.


## Nieuw: interactieve verspreidingskaart

De kaart staat boven de resultatenlijst en volgt **alle** zoekfilters. Het aantal is altijd het aantal onderzoeksclusters dat voldoet aan de zoekcriteria, niet het aantal botten of het aantal soortvermeldingen. Filter voor de verspreiding van een diersoort bij voorkeur via het veld Diersoort, in plaats van vrije tekst (die ook beschrijvingen en literatuur doorzoekt).

| Weergave | Aggregatie | Gebruik |
| --- | --- | --- |
| Bronlocaties | Zelfde RD-coördinaat samengevoegd | Inspectie van geregistreerde locaties |
| 1 × 1 km | 1 km² per cel | Lokale patronen |
| 5 × 5 km | 25 km² per cel | Omgeving en regio |
| 10 × 10 km | 100 km² per cel | Regionaal overzicht (standaard) |
| 25 × 25 km | 625 km² per cel | Landelijk overzicht |

Rasters zijn berekend in **EPSG:28992**, uitgelijnd op de oorsprong (0, 0). Een coördinaat op een celgrens wordt aan de cel ten oosten/noorden toegewezen (floor-indexering, halfopen intervallen). Alleen bezette cellen worden getoond. De numerieke telklassen in de legenda zijn vast: 1, 2–5, 6–10, 11–25, 26–50, 51+. Een cel met meer clusters kan meer onderzoek vertegenwoordigen; afwezigheid van resultaten bewijst geen afwezigheid van materiaal. Vergelijk aantallen tussen celgroottes met aandacht voor het verschil in oppervlakte.

De keuze is een **weergaveresolutie, geen locatienauwkeurigheid**. De bron bevat geen uniforme expliciete onzekerheidsstraal. Afgeronde coördinaten blijven afgerond; ook een coördinaat op meters kan onnauwkeurig zijn. De bereikcontrole is alleen een plausibiliteitscontrole, geen volledige validatie van de vindplaats.

Van alle 2.434 clusters worden 2.040 gekarteerd. 376 hebben lege/nulcoördinaten en 18 liggen buiten het gekozen RD-controlebereik (0 < X < 300.000 en 300.000 < Y < 625.000) of zijn ongeldig. Er worden geen schijnlocaties via plaatscentroïden gemaakt. Mogelijk verwisselde X/Y of waarden in kilometers worden niet automatisch gerepareerd. Uitgesloten records blijven in zoeklijst/CSV staan; onder de kaart kun je hun bronwaarden en uitsluitreden apart downloaden.

Klik op een cel of punt om alle bijbehorende clusters onder de kaart te bekijken. Klik vervolgens op een cluster voor alle details. Deze kaartselectie verandert de zoekfilters niet. De knop Zoom naar resultaten toont de volledige gefilterde spreiding. Bij veranderende filters blijft het kaartvenster verder behouden, zodat je gebieden kunt vergelijken. Wisselen van resultaatpagina verandert de kaart niet. De gekozen resolutie wordt bewaard in de URL.

GeoJSON-export bevat de huidige punten of rastercellen, clusteraantallen, cluster-ID's, RD-celorigin, celgrootte en oppervlak. Geometrie is WGS84 lengte-/breedtegraad (OGC:CRS84), zodat het bestand direct in QGIS te openen is. Bron- en export-CRS staan in metadata. De kaart gebruikt Proj4js met een zevenparameter-RD/WGS84-transformatie voor visualisatie (geen RDNAPTRANS-grid voor landmeetkundige nauwkeurigheid). RD-coördinaten in de bron worden niet gewijzigd. Polygonranden worden tussen de hoeken bemonsterd vóór transformatie.

Zonder filters: 1.153 unieke bronlocaties, 783 bezette 1km-cellen, 425 bezette 5km-cellen, 242 bezette 10km-cellen en 79 bezette 25km-cellen. De som blijft steeds 2.040 clusters. Onderzoeksclusters op dezelfde bronlocatie zijn geen onafhankelijke vindplaatsen.

### Deze update publiceren

Upload de volledige inhoud van het ZIP-bestand naar dezelfde hoofdmap van **Morrizzzzz/RCE_BoneInfo**, en vervang de bestaande bestanden. Voeg ook de nieuwe bestanden **map.js**, **spatial.js** en de volledige map **vendor** toe. De gegevensexport is ongewijzigd. De GitHub Pages-instelling kan blijven staan op main / (root). Ververs na de deployment eventueel met Ctrl+F5. De bestaande website-URL blijft gelijk.

De map `vendor` bevat Leaflet 1.9.4 (BSD-2-Clause) en Proj4js 2.15.0 (MIT), inclusief licenties. De ondergrond gebruikt de grijze BRT Achtergrondkaart van PDOK/Kadaster via de EPSG:3857 WMTS-matrix. Bij een tegelstoring blijven de gegevenslaag en de zoeklijst werken en verschijnt een melding. Publicatie vereist geen API-sleutels.

Tests: `npm test` voert zowel de oorspronkelijke zoektests als de ruimtelijke tests uit. De ruimtelijke tests verifiëren telbehoud op alle resoluties, celgrenzen, samenvallende locaties, uitsluitredenen, gefilterde en lege datasets, GeoJSON-ringen en controlepunten die onafhankelijk met pyproj zijn omgerekend.
