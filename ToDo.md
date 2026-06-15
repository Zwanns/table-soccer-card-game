````md
# Total Soccer: Mundial
# Замена реальных фамилий игроков на вымышленные + Legal disclaimer

## Цель

Снизить юридические риски перед публичным продвижением игры.

Нужно:

1. Заменить реальные фамилии игроков во всех 65 сборных на вымышленные.
2. Фамилии должны быть уникальными во всей игре.
3. Фамилии должны быть написаны латиницей.
4. Фамилии должны сохранять национальный характер конкретной сборной.
5. Добавить legal/disclaimer текст в нижнюю часть главного меню.
6. Добавить отдельный legal/disclaimer пункт в About во все три языковые версии: EN, PL, UA.

---

## Ожидаемые файлы

Проверить и изменить при необходимости:

```text
src/data/realSquads.ts
src/data/defaultSquads.ts
src/data/squadTypes.ts
src/scenes/MenuScene.ts
src/scenes/SquadSelectScene.ts
src/scenes/GameScene.ts
src/scenes/ResultScene.ts
src/tests/squads.test.ts
src/tests/squadEditor.test.ts
src/tests/teamSelect.test.ts
src/tests/menuScene.test.ts
src/tests/project.test.ts
PROJECT_SPEC_FOR_CHATGPT.md
```

Если фактические названия отличаются — найти по поиску:

```text
realSquads
squad
players
shirtNumber
goalkeeper
ABOUT_CONTENT
About
© 2026
All rights reserved
```

---

# 1. Замена фамилий игроков

## Требования

Для каждой сборной заменить фамилии игроков на вымышленные.

Сохранять:

```text
flagCode
rank
shirtNumber
position / role
goalkeeper status
starting goalkeeper
структуру состава
```

Менять только имя/фамилию игрока.

Если структура игрока имеет поле:

```ts
name
```

то в него записать только фамилию.

Если структура имеет:

```ts
firstName
lastName
```

то:

```ts
firstName = ''
lastName = '<fictionalSurname>'
```

или адаптировать под текущую модель проекта.

В UI должно отображаться именно вымышленное имя/фамилия.

---

# 2. Порядок назначения фамилий

Для каждой команды использовать 15 фамилий в таком порядке:

```text
1. goalkeeper
2. rank 2
3. rank 3
4. rank 4
5. rank 5
6. rank 6
7. rank 7
8. rank 8
9. rank 9
10. rank 10
11. rank J
12. rank Q
13. rank K
14. rank A
15. rank JOKER
```

Если в конкретном файле порядок другой — сопоставить по роли/rank, но сохранить этот принцип.

---

# 3. Список вымышленных фамилий

Использовать этот список.

```ts
export const FICTIONAL_TEAM_SURNAMES: Record<string, string[]> = {
  al: ['Bardhani', 'Kelmendi', 'Dushku', 'Arlindi', 'Shkodrani', 'Berishaq', 'Vokshi', 'Lleshani', 'Gjonmira', 'Kastratiq', 'Drenova', 'Zogjani', 'Malajdin', 'Rugovani', 'Pashkolli'],
  am: ['Vardanyan', 'Arzumanyan', 'Petrosyan', 'Sahakyan', 'Melikyan', 'Grigoryan', 'Tigranyan', 'Avedisyan', 'Karapetyan', 'Baghdasaryan', 'Hovsepyan', 'Minasyan', 'Nersisyan', 'Sargsyanik', 'Harutyunyan'],
  ar: ['Valderos', 'Riquelmar', 'Sotelino', 'Benavidez', 'Maldorri', 'Castellano', 'Ferreyo', 'Lujanero', 'Alvariza', 'Montieles', 'Paredino', 'Rosalesi', 'Villagra', 'Dominguezal', 'Carranzio'],
  at: ['Gruberwald', 'Steinacher', 'Kronberger', 'Hoffleiner', 'Wiesenthal', 'Brandstatter', 'Falkenried', 'Mairhofer', 'Leitnerbach', 'Schoberling', 'Auerstein', 'Reisingerhof', 'Kaltenbrunn', 'Winklhofer', 'Edelweissner'],
  au: ['Braddock', 'McAllister', 'Whitmore', 'Hawthorn', 'Kendrick', 'Sullivanridge', 'Brockley', 'Ashford', 'Callahan', 'Redmond', 'Fairbairn', 'Kingswell', 'Darlington', 'Rutherford', 'Westbrook'],
  be: ['Verhaegen', 'De Smette', 'Vandervael', 'Lambrechtsen', 'Claessens', 'Dewaer', 'Van Riel', 'Moreauvin', 'Lefevrain', 'Hendrickxen', 'Vercauter', 'Delcroix', 'Vandenbosch', 'Maesbrugge', 'De Witteval'],
  br: ['Silveirao', 'Costalves', 'Ferreirinho', 'Santoroza', 'Oliveirado', 'Pereirinha', 'Barbosal', 'Nascimentoa', 'Ribeirinho', 'Carvalhao', 'Almeidoro', 'Moreirinha', 'Teixeiral', 'Limeiro', 'Dourado'],
  by: ['Kravtsov', 'Hrybouski', 'Navumchyk', 'Lukashevich', 'Baranouski', 'Matskevich', 'Rudavets', 'Zalesski', 'Paliakou', 'Siarheichyk', 'Vasilevich', 'Karpovich', 'Bialkevich', 'Dubrovski', 'Minskievich'],
  ca: ['MacKenzie', 'Bouchardet', 'Tremblayne', 'Whitfield', 'Beaumont', 'Lachance', 'Hargrove', 'Sinclairson', 'Morrissey', 'Fontaineau', 'Ellsworth', 'Mercierlane', 'Caldwell', 'Desrosiers', 'Northwood'],
  ch: ['Freiwald', 'Zimmerli', 'Bachmannet', 'Meierhof', 'Rothen', 'Kellerlin', 'Schmidiger', 'Favretto', 'Morellin', 'Bernasconi', 'Luganofer', 'Aebischerin', 'Stauffacher', 'Wyssental', 'Albricht'],
  ci: ['Kouadiole', 'Bakanoko', 'Diarassou', 'Yalouba', 'Koffiran', 'Soroani', 'Akessan', 'Nguessari', 'Toureba', 'Koneval', 'Bambari', 'Gbagoro', 'Zokouma', 'Djedjen', 'Abidjani'],
  cl: ['Valenzora', 'Arayano', 'Contreral', 'Mardonesi', 'Sepulveda', 'Fuenzalida', 'Rojasmar', 'Quinteros', 'Vidalero', 'Bustamantez', 'Pizarroso', 'Carrascor', 'Latorrino', 'Montenegra', 'Aconcagua'],
  cm: ['Mbokani', 'Nguemalo', 'Ekondor', 'Tchamadeu', 'Moukokoan', 'Biyemla', 'Fotsoari', 'Njikamou', 'Abessolo', 'Mangafo', 'Ndongala', 'Simekane', 'Essombey', 'Kamtchou', 'Doualari'],
  co: ['Castañol', 'Quinteral', 'Renterizo', 'Vallejor', 'Arboleda', 'Montoyes', 'Cardenalo', 'Zuluagano', 'Ospinal', 'Barranquero', 'Medellano', 'Cafetero', 'Palenquez', 'Cordobero', 'Santanderi'],
  cr: ['Morenaza', 'Quesadillo', 'Alvaradoz', 'Solanero', 'Vargasol', 'Urenata', 'Brenesal', 'Gamboari', 'Cartagino', 'Herediar', 'Ticoflor', 'Madrigal', 'Chaconero', 'Sanabria', 'Puntareno'],
  cz: ['Novakovic', 'Svobodin', 'Dvoracek', 'Prochazka', 'Cernovsky', 'Kralicek', 'Horaklin', 'Veselyan', 'Kadlecik', 'Sramek', 'Blazekor', 'Koubekar', 'Zemanek', 'Moravec', 'Plzenik'],
  de: ['Schneiderfeld', 'Mullerhain', 'Bergmann', 'Krausser', 'Hoffstadt', 'Weberling', 'Fischerwald', 'Kellerhoff', 'Brandwein', 'Richtertal', 'Neumannhof', 'Vogelstein', 'Hartmann', 'Bruckner', 'Eisenbach'],
  dk: ['Jorgensen', 'Nielsenborg', 'Sorensen', 'Larsenby', 'Kristiansen', 'Mikkelsen', 'Rasmussen', 'Hansenfjord', 'Pedersenholm', 'Frederiksen', 'Bjerregaard', 'Skovlund', 'Dahlgaard', 'Aalborgsen', 'Kolding'],
  dz: ['Benkhelif', 'Mansouri', 'Belhaddad', 'Zerouali', 'Boudjema', 'Draouani', 'Kacemri', 'Hammouchi', 'Tlemcani', 'Aitmalek', 'Bensalah', 'Ouargli', 'Meziani', 'Cherifane', 'Kabylani'],
  ec: ['Andrango', 'Quishpero', 'Zambranal', 'Cevalloro', 'Ibarrazo', 'Guamandino', 'Pichinchal', 'Montalvar', 'Cuencano', 'Ordonezal', 'Vallejoa', 'Ambatena', 'Loayzaro', 'Esmeraldi', 'Quitumbe'],
  eg: ['El Masrani', 'Hassanour', 'Fahmidi', 'Abdelrahim', 'Zamaleki', 'Nileddin', 'Mahfouzi', 'Saidani', 'Iskandari', 'Ghazaly', 'Tantawi', 'Faragoun', 'Badrawi', 'Helwany', 'Qahirani'],
  es: ['Valderama', 'Castellon', 'Serranoz', 'Montesino', 'Arandilla', 'Navarros', 'Iberico', 'Villalba', 'Herreral', 'Llorentez', 'Cordero', 'Alcazaro', 'Marbella', 'Segoviano', 'Riberos'],
  fr: ['Beaumont', 'Lefranc', 'Morellet', 'Duchamp', 'Garnierot', 'Chevalin', 'Marchande', 'Laurentis', 'Rousselet', 'Fontaine', 'Delacroixan', 'Briandot', 'Charpentel', 'Montclair', 'Bellerive'],
  'gb-eng': ['Ashworth', 'Bradleyton', 'Crawford', 'Ellington', 'Harrington', 'Kingsley', 'Wexford', 'Chesterfield', 'Bromley', 'Fairhurst', 'Lockwood', 'Redgrave', 'Whitaker', 'Huxley', 'Northgate'],
  'gb-sct': ['MacAlpin', 'McBraid', 'Campbellson', 'Abernethy', 'Drummond', 'Falkirk', 'Inverley', 'MacCrae', 'Strathmore', 'Glenwood', 'McTavish', 'Kirkcaldy', 'Dunbarry', 'MacNairn', 'Highland'],
  'gb-wls': ['Aberdare', 'Llewelyn', 'Caradog', 'Brynmore', 'Gwynedd', 'Pritchard', 'Meredith', 'Powellyn', 'Ceredig', 'Rhondale', 'Taliesin', 'Owainson', 'Cardiffan', 'Pembroke', 'Maelor'],
  ge: ['Kvariani', 'Beridzev', 'Tsiklauri', 'Mchedlidze', 'Gogolauri', 'Abashidze', 'Lomidzeni', 'Kiknadze', 'Tsereteli', 'Javakhish', 'Gurieli', 'Dadianuri', 'Kartveli', 'Rustaveli', 'Chkheidzari'],
  gr: ['Papadakis', 'Nikolaidis', 'Georgiou', 'Kostakis', 'Anastasiou', 'Dimitriou', 'Makridis', 'Stavropoulos', 'Theodorou', 'Karagiannis', 'Pappasios', 'Athenakis', 'Pelopidas', 'Kritikos', 'Hellasios'],
  hr: ['Kovacic', 'Horvatin', 'Marinic', 'Vukovic', 'Bjelic', 'Dubravic', 'Zagorec', 'Perkovic', 'Kresimir', 'Radosevic', 'Slavonic', 'Dalmatin', 'Jadranic', 'Lovrenic', 'Modrinic'],
  hu: ['Nagyfalvi', 'Kovacsor', 'Szabados', 'Tothvar', 'Vargahegy', 'Baloghan', 'Farkasdi', 'Molnari', 'Kissfalud', 'Horvathos', 'Puskari', 'Debreczeni', 'Budavari', 'Szegedyn', 'Aranyosi'],
  ie: ['O Callaghan', 'Fitzroyan', 'Kelleher', 'Doylewick', 'Brennan', 'Flanagan', 'O Driscoll', 'Mahoney', 'Gallagher', 'Sullivan', 'Clonmore', 'Dublinley', 'Kildare', 'Shamrocke', 'Connolly'],
  iq: ['Al Basri', 'Al Karimi', 'Baghdadi', 'Mosuli', 'Najafi', 'Tikriti', 'Haddadi', 'Rasheedi', 'Younisi', 'Qasimani', 'Al Zubair', 'Karbali', 'Samarrai', 'Furatani', 'Kadhimi'],
  ir: ['Farahani', 'Tehrani', 'Kermani', 'Shirazian', 'Mazandar', 'Rezavand', 'Daryoushi', 'Mehrabi', 'Pahlavani', 'Zandipour', 'Ardestani', 'Kashanian', 'Tabrizi', 'Nourbakhsh', 'Sepahani'],
  it: ['Rinaldini', 'Bellavita', 'Montanari', 'Ferrantino', 'Graziano', 'Lombardelli', 'Romagnoli', 'Veneziano', 'Belliniro', 'Contarini', 'Sorrentino', 'Capellini', 'Fioravanti', 'Marchetti', 'Palermino'],
  jp: ['Takashiro', 'Morikawa', 'Fujimoto', 'Nakamori', 'Hasegai', 'Kobayato', 'Sakuragi', 'Yamashiro', 'Ishikawa', 'Tanemura', 'Kurosawa', 'Akitomo', 'Harukaze', 'Matsudai', 'Kawazaki'],
  kr: ['Kimdaro', 'Parkjin', 'Leehwan', 'Choisung', 'Jungmin', 'Kanghoon', 'Yoonseok', 'Hanbit', 'Baekjun', 'Seohae', 'Limchan', 'Ohkyu', 'Moonjae', 'Shinwoo', 'Namguk'],
  kz: ['Akhmetov', 'Nurgali', 'Sadykov', 'Bektasov', 'Tulegen', 'Karimov', 'Altynbek', 'Kairatov', 'Zhanibek', 'Sarsenov', 'Temirlan', 'Orazbay', 'Kenesary', 'Astanaev', 'Stepanbek'],
  ma: ['Benaziz', 'El Fassi', 'Marrakchi', 'Tangeri', 'Boussaid', 'Zerhouni', 'Aitnouri', 'Rabatani', 'Chraibi', 'Belkacem', 'Oudghiri', 'Taziani', 'Soussani', 'Maghrebi', 'Idrissi'],
  ml: ['Diarrawo', 'Traoreba', 'Keitara', 'Sissokani', 'Coulibaro', 'Kouyate', 'Bamakofo', 'Samakele', 'Tourema', 'Sangare', 'Konateo', 'Bagayoko', 'Dembeleko', 'Fofanal', 'Mandingo'],
  mx: ['Hernandero', 'Ramirezal', 'Guerreron', 'Zapatillo', 'Monterano', 'Oaxacano', 'Castillero', 'Valadez', 'Rangelito', 'Pueblano', 'Navarrox', 'Tapatio', 'Chihuaro', 'Meridano', 'Cruzado'],
  ng: ['Okaforo', 'Adebayo', 'Chukwudi', 'Baloguno', 'Ezeani', 'Nwankaro', 'Ibrahimko', 'Oladipo', 'Ucheoma', 'Kanuari', 'Onyekachi', 'Ajibola', 'Musafo', 'Enyimba', 'Lagosian'],
  nir: ['McKeown', 'Belford', 'Craigavon', 'O Neillan', 'Derryhill', 'Lisburne', 'McIlroy', 'Armaghan', 'Fermanagh', 'Downpatrick', 'Tyronewell', 'Magherin', 'Colerain', 'Antrimor', 'Ulsterry'],
  nl: ['Van Dalen', 'De Vriesor', 'Bakkerdam', 'Janssenveld', 'Koopman', 'Vermeeran', 'Hendriks', 'Rotterveen', 'Aalsmeer', 'Vanderplas', 'Schaafman', 'Willemsen', 'Noordwijk', 'Kuyper', 'Dijkgraaf'],
  no: ['Nordvik', 'Haalandor', 'Bergheim', 'Solbakken', 'Lundgaard', 'Olsenfjord', 'Eriksen', 'Tromsdal', 'Stavanger', 'Haugenvik', 'Bjornstad', 'Skarsgard', 'Moldegaard', 'Aasland', 'Vikingstad'],
  pa: ['Balboza', 'Herreralis', 'Quinteron', 'Canalero', 'Penedoza', 'Sanmiguel', 'Arosemen', 'Chorrerano', 'Colonero', 'Darieni', 'Valderas', 'Coclesi', 'Panamero', 'Santanero', 'Molinarez'],
  pe: ['Quispero', 'Huamanis', 'Ccalluchi', 'Incanari', 'Cusqueno', 'Arequipar', 'Pizarron', 'Chavarry', 'Condorcan', 'Mochica', 'Limezano', 'Cajamarco', 'Ayacuchan', 'Villanuev', 'Rimacero'],
  pl: ['Kowalski', 'Nowaczyk', 'Wisniewski', 'Zielinski', 'Kaminski', 'Wojcikowski', 'Lewicki', 'Mazurski', 'Kaczmarek', 'Szymanski', 'Pawlak', 'Gorski', 'Dabrowski', 'Krakowski', 'Warszawski'],
  pt: ['Ferreirado', 'Oliveirinho', 'Coimbrano', 'Lisboeta', 'Braganca', 'Carvalhal', 'Moreirado', 'Pereirinho', 'Teixeirado', 'Azevedos', 'Salgueiro', 'Figueiredo', 'Madeirense', 'Portuense', 'Algarvio'],
  py: ['Benitezal', 'Gamarro', 'Aguayo', 'Villalbino', 'Itapua', 'Guaranero', 'Encarnacion', 'Asunceno', 'Cacerizo', 'Riverolo', 'Sanabrio', 'Cabanero', 'Piribebuy', 'Canindeyu', 'Ypacarai'],
  qa: ['Al Thaniq', 'Al Marriq', 'Al Kuwariq', 'Al Naimiq', 'Al Suwaidiq', 'Dohaani', 'Al Jassimq', 'Al Mansouriq', 'Al Rayyani', 'Al Wakraqi', 'Al Duhaili', 'Al Saadiq', 'Al Qatari', 'Al Khaldiq', 'Al Zubari'],
  ro: ['Popescanu', 'Ionescu', 'Dumitrescu', 'Stanescu', 'Marinescu', 'Georgescu', 'Constantin', 'Vasilescu', 'Munteanu', 'Radulescu', 'Bucurestean', 'Ardeleanu', 'Moldoveanu', 'Petrescu', 'Dragomir'],
  rs: ['Petrovic', 'Jovanovic', 'Nikolic', 'Stojanovic', 'Milosevic', 'Radovanic', 'Djordjevic', 'Savicevic', 'Kragujevic', 'Belgradic', 'Moravski', 'Vojvodic', 'Zlatiborac', 'Lazarevic', 'Obrenovic'],
  sa: ['Al Harbi', 'Al Qahtani', 'Al Dosari', 'Al Shammari', 'Al Mutairi', 'Al Riyadhi', 'Al Najdi', 'Al Hilali', 'Al Tamimi', 'Al Jeddawi', 'Al Fahdi', 'Al Salehi', 'Al Rashidi', 'Al Yamami', 'Al Madani'],
  se: ['Anderssonvik', 'Karlssonberg', 'Nilssonholm', 'Larssonby', 'Ekstrom', 'Svenssondal', 'Bergqvist', 'Lindgren', 'Osterlund', 'Uppsala', 'Malmstrom', 'Hedlund', 'Norrstrom', 'Bjorkman', 'Vastervik'],
  si: ['Novakic', 'Kranjcic', 'Horvatnik', 'Zupancic', 'Potochnik', 'Mlakar', 'Kosirnik', 'Vidmaric', 'Oblakov', 'Ljubljanec', 'Triglavic', 'Mariboric', 'Dolenc', 'Kovacnik', 'Rozmanec'],
  sk: ['Novaksky', 'Horvathik', 'Kovacik', 'Vargovsky', 'Tothik', 'Durisec', 'Hamsikor', 'Bratislavik', 'Presovsky', 'Zilinsky', 'Mikulas', 'Sokolik', 'Oravec', 'Tatranec', 'Liptovsky'],
  sn: ['Diopara', 'Ndiayal', 'Sarriko', 'Gueyane', 'Fayemba', 'Baobab', 'Dakarou', 'Cissokho', 'Mbacke', 'Thiamoro', 'Senghoran', 'Kaolack', 'Toubani', 'Fallouma', 'Wolofane'],
  tn: ['Ben Salem', 'Trabelsian', 'Sfaxiani', 'Tunisari', 'Hammameti', 'Jaziri', 'Bouzidi', 'Mestiri', 'Kairouani', 'Gabesli', 'Mahdoui', 'Djerbani', 'Monastiri', 'Sahelani', 'Zitouni'],
  tr: ['Yildirim', 'Demirhan', 'Karakaya', 'Ozdemir', 'Aydogan', 'Kilicsoy', 'Ankarali', 'Istanbey', 'Altintas', 'Sahinoglu', 'Kaplaner', 'Erdoganli', 'Yilmazer', 'Toprakci', 'Bozkurtan'],
  ua: ['Kovalchuk', 'Shevchenko', 'Bondarenko', 'Melnyk', 'Tkachenko', 'Kravchenko', 'Hrytsenko', 'Petryuk', 'Savchuk', 'Romaniuk', 'Zakharchuk', 'Polishchuk', 'Vasylyn', 'Bilyi', 'Lysenko'],
  us: ['Jefferson', 'Carterfield', 'Madison', 'Hamilton', 'Brooksman', 'Washingtoner', 'Kennedywell', 'Harrison', 'Cooperstown', 'Franklin', 'Lincolnwood', 'Marshall', 'Prescott', 'Sheridan', 'Arlington'],
  uy: ['Bentancor', 'Monteverdi', 'Canelones', 'Riveratto', 'Suarezino', 'Lugarez', 'Coloniaro', 'Artigano', 'Maldonado', 'Salteno', 'Tacuarembo', 'Duraznero', 'Rochano', 'Paysandu', 'Charruano'],
  uz: ['Karimov', 'Tashkentov', 'Nazarov', 'Rustamov', 'Bekmurod', 'Samarkandi', 'Bukhariy', 'Yuldashev', 'Tursunov', 'Khodjaev', 'Navoiyev', 'Fergani', 'Qodirov', 'Ergashev', 'Temurov'],
  ve: ['Maracayo', 'Orinoco', 'Valerano', 'Caraceno', 'Bolivaro', 'Margarito', 'Zuliano', 'Andradez', 'Rondonal', 'Llanero', 'Guayanes', 'Barquero', 'Tachirano', 'Meridanoz', 'Cumana'],
  za: ['Mkhize', 'Dlaminor', 'Nkosiwe', 'Molefe', 'Khumalani', 'Mbekazi', 'Sibanyoni', 'Pretoriano', 'Capeton', 'Zuluwayo', 'Sowetano', 'Ndlovini', 'Mabizela', 'Johannes', 'Bothaville'],
};
```

---

# 4. Проверка уникальности фамилий

Добавить тест или validator.

Требования:

```text
все фамилии уникальны глобально;
нет пустых фамилий;
все фамилии написаны латиницей;
нет настоящих известных фамилий из старого realSquads;
количество фамилий на команду равно количеству игроков в составе;
каждый игрок получил новую фамилию.
```

Допустимый regex:

```ts
/^[A-Za-z][A-Za-z '\-]*$/
```

Если проект не использует пробелы/апострофы в фамилиях, можно упростить и заменить фамилии с `Al ...`, `Van ...`, `O ...`, `De ...` на слитное написание.

---

# 5. Добавить disclaimer в нижнюю часть главного меню

В нижней части главного меню добавить текст:

```text
© 2026 Total Soccer: Mundial. All rights reserved.
This is an unofficial football card game. It is not affiliated with FIFA, UEFA, national football associations, clubs, leagues, or players. All team names, player names, kits, card backs, and visual elements used in the game are fictional or stylized unless otherwise stated.
```

## Требования к отображению

```text
текст небольшой;
цвет не должен спорить с меню;
расположить внизу экрана;
не перекрывать кнопки;
должен помещаться на ширине экрана;
можно использовать wordWrap;
можно разбить на 2 строки;
не должен мигать вместе с логотипом;
не должен быть кнопкой.
```

Рекомендуемый стиль:

```ts
fontSize: 12 или 13
align: 'center'
wordWrap width: 900-1100
alpha: 0.82
```

---

# 6. Добавить отдельный пункт Legal / Disclaimer в About

В About добавить отдельный раздел после основного описания.

## EN

```text
Legal / Disclaimer

© 2026 Total Soccer: Mundial. All rights reserved.

This is an unofficial football card game. It is not affiliated with FIFA, UEFA, national football associations, clubs, leagues, or players.

All team names, player names, kits, card backs, and visual elements used in the game are fictional or stylized unless otherwise stated.
```

## PL

```text
Informacje prawne / Zastrzezenie

© 2026 Total Soccer: Mundial. Wszelkie prawa zastrzezone.

To jest nieoficjalna pilkarska gra karciana. Gra nie jest powiazana z FIFA, UEFA, krajowymi federacjami pilkarskimi, klubami, ligami ani pilkarzami.

Wszystkie nazwy druzyn, nazwiska zawodnikow, stroje, rewersy kart oraz elementy wizualne uzyte w grze sa fikcyjne lub stylizowane, chyba ze zaznaczono inaczej.
```

## UA

```text
Правова інформація / Дисклеймер

© 2026 Total Soccer: Mundial. Усі права захищено.

Це неофіційна футбольна карткова гра. Вона не пов'язана з FIFA, UEFA, національними футбольними асоціаціями, клубами, лігами або футболістами.

Усі назви команд, прізвища гравців, форми, сорочки карт і візуальні елементи, використані в грі, є вигаданими або стилізованими, якщо не зазначено інше.
```

---

# 7. About UI

Если текущий About уже имеет языковые версии EN / PL / UA, добавить новый пункт в каждую версию.

Не удалять существующее описание игры.

Если текст не помещается:

```text
увеличить высоту текстовой области;
уменьшить fontSize;
добавить/сохранить scroll;
сохранить Back button внизу.
```

---

# 8. Не менять

Не менять:

```text
GameEngine
AI
Penalty AI
TournamentEngine
PenaltyShootoutEngine
правила игры
механику карт
формы
рубашки колод
флаги
турнирные сетки
layout игрового поля
```

Задача касается только:

```text
данных составов;
тестов/валидаторов;
главного меню;
About content;
документации.
```

---

# 9. Тесты

Обновить или добавить тесты.

Проверить:

```text
все игроки имеют вымышленные фамилии;
все фамилии уникальны глобально;
фамилии написаны латиницей;
количество игроков в каждой сборной не изменилось;
shirtNumber не изменился;
rank не изменился;
goalkeeper не исчез;
JOKER остался;
MenuScene содержит disclaimer в footer;
About EN содержит Legal / Disclaimer;
About PL содержит Informacje prawne / Zastrzezenie;
About UA содержит Правова інформація / Дисклеймер;
Rules не сломались;
Back button в About работает.
```

---

# 10. Документация

Обновить:

```text
PROJECT_SPEC_FOR_CHATGPT.md
README.md при необходимости
```

Добавить:

```text
Составы используют вымышленные фамилии игроков.
Игра не использует реальные имена футболистов.
Игра не связана с FIFA, UEFA, федерациями, клубами, лигами или игроками.
Флаги используются как идентификаторы стран.
Формы, рубашки и визуальные элементы являются стилизованными.
```

---

# 11. Проверка

Запустить:

```bash
npm test
npm run build
npm run dev
```

Если есть отдельные валидаторы:

```bash
npm run validate:kits
npm run validate:covers
```

тоже запустить.

---

# 12. Формат отчета

После выполнения вывести:

```text
Замена фамилий и добавление legal disclaimer завершены.

Созданные файлы:
- ...

Измененные файлы:
- ...

Фамилии игроков:
- реальные фамилии заменены:
- всего сборных:
- всего игроков:
- все фамилии уникальны:
- все фамилии латиницей:

Disclaimer в главном меню:
- добавлен:
- расположение:
- перенос строк:

About:
- EN legal section:
- PL legal section:
- UA legal section:

Сохранены ли ranks / shirtNumbers / goalkeeper / JOKER:
- ...

Изменялись ли GameEngine / AI / Penalty AI / TournamentEngine:
- да / нет

Результат npm run validate:kits:
- ...

Результат npm run validate:covers:
- ...

Результат npm test:
- ...

Результат npm run build:
- ...

Результат npm run dev:
- ...

После отчета остановиться.

```

---

## Важно
In-app Browser недоступен (iab), поэтому визуальный скрин/клик-тест через него не делать.