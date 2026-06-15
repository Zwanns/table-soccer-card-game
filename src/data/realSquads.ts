import type { CardRank } from '../cards/Card';
import type { NationalTeamSquad } from './squadTypes';

/**
 * Fictional modern-squad snapshot for Total Soccer: Mundial.
 *
 * Important: shirt numbers below are stable GAME numbers assigned by card slot,
 * not an attempt to mirror every official international-window registration.
 * This keeps all 15 numbers unique inside every squad and makes card rendering stable.
 */

const FIELD_RANKS = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
  'JOKER',
] as const satisfies readonly CardRank[];

const FIELD_NUMBERS = [
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  14,
  15,
  17,
  18,
] as const;

const NORTHERN_IRELAND_FIELD_NUMBERS = [
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  14,
  15,
  18,
] as const;

export const FICTIONAL_TEAM_SURNAMES: Record<string, readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
]> = {
  'al': ['Bardhani', 'Kelmendi', 'Dushku', 'Arlindi', 'Shkodrani', 'Berishaq', 'Vokshi', 'Lleshani', 'Gjonmira', 'Kastratiq', 'Drenova', 'Zogjani', 'Malajdin', 'Rugovani', 'Pashkolli'],
  'am': ['Vardanyan', 'Arzumanyan', 'Petrosyan', 'Sahakyan', 'Melikyan', 'Grigoryan', 'Tigranyan', 'Avedisyan', 'Karapetyan', 'Baghdasaryan', 'Hovsepyan', 'Minasyan', 'Nersisyan', 'Sargsyanik', 'Harutyunyan'],
  'ar': ['Valderos', 'Riquelmar', 'Sotelino', 'Benavidez', 'Maldorri', 'Castellano', 'Ferreyo', 'Lujanero', 'Alvariza', 'Montieles', 'Paredino', 'Rosalesi', 'Villagra', 'Dominguezal', 'Carranzio'],
  'at': ['Gruberwald', 'Steinacher', 'Kronberger', 'Hoffleiner', 'Wiesenthal', 'Brandstatter', 'Falkenried', 'Mairhofer', 'Leitnerbach', 'Schoberling', 'Auerstein', 'Reisingerhof', 'Kaltenbrunn', 'Winklhofer', 'Edelweissner'],
  'au': ['Braddock', 'McAllister', 'Whitmore', 'Hawthorn', 'Kendrick', 'Sullivanridge', 'Brockley', 'Ashford', 'Callahan', 'Redmond', 'Fairbairn', 'Kingswell', 'Darlington', 'Rutherford', 'Westbrook'],
  'be': ['Verhaegen', 'De Smette', 'Vandervael', 'Lambrechtsen', 'Claessens', 'Dewaer', 'Van Riel', 'Moreauvin', 'Lefevrain', 'Hendrickxen', 'Vercauter', 'Delcroix', 'Vandenbosch', 'Maesbrugge', 'De Witteval'],
  'br': ['Silveirao', 'Costalves', 'Ferreirinho', 'Santoroza', 'Oliveirado', 'Pereirinha', 'Barbosal', 'Nascimentoa', 'Ribeirinho', 'Carvalhao', 'Almeidoro', 'Moreirinha', 'Teixeiral', 'Limeiro', 'Dourado'],
  'by': ['Kravtsov', 'Hrybouski', 'Navumchyk', 'Lukashevich', 'Baranouski', 'Matskevich', 'Rudavets', 'Zalesski', 'Paliakou', 'Siarheichyk', 'Vasilevich', 'Karpovich', 'Bialkevich', 'Dubrovski', 'Minskievich'],
  'ca': ['MacKenzie', 'Bouchardet', 'Tremblayne', 'Whitfield', 'Beaumontvale', 'Lachance', 'Hargrove', 'Sinclairson', 'Morrissey', 'Fontaineau', 'Ellsworth', 'Mercierlane', 'Caldwell', 'Desrosiers', 'Northwood'],
  'ch': ['Freiwald', 'Zimmerli', 'Bachmannet', 'Meierhof', 'Rothen', 'Kellerlin', 'Schmidiger', 'Favretto', 'Morellin', 'Bernasconi', 'Luganofer', 'Aebischerin', 'Stauffacher', 'Wyssental', 'Albricht'],
  'ci': ['Kouadiole', 'Bakanoko', 'Diarassou', 'Yalouba', 'Koffiran', 'Soroani', 'Akessan', 'Nguessari', 'Toureba', 'Koneval', 'Bambari', 'Gbagoro', 'Zokouma', 'Djedjen', 'Abidjani'],
  'cl': ['Valenzora', 'Arayano', 'Contreral', 'Mardonesi', 'Sepulveda', 'Fuenzalida', 'Rojasmar', 'Quinteros', 'Vidalero', 'Bustamantez', 'Pizarroso', 'Carrascor', 'Latorrino', 'Montenegra', 'Aconcagua'],
  'cm': ['Mbokani', 'Nguemalo', 'Ekondor', 'Tchamadeu', 'Moukokoan', 'Biyemla', 'Fotsoari', 'Njikamou', 'Abessolo', 'Mangafo', 'Ndongala', 'Simekane', 'Essombey', 'Kamtchou', 'Doualari'],
  'co': ['Castanol', 'Quinteral', 'Renterizo', 'Vallejor', 'Arboleda', 'Montoyes', 'Cardenalo', 'Zuluagano', 'Ospinal', 'Barranquero', 'Medellano', 'Cafetero', 'Palenquez', 'Cordobero', 'Santanderi'],
  'cr': ['Morenaza', 'Quesadillo', 'Alvaradoz', 'Solanero', 'Vargasol', 'Urenata', 'Brenesal', 'Gamboari', 'Cartagino', 'Herediar', 'Ticoflor', 'Madrigal', 'Chaconero', 'Sanabriano', 'Puntareno'],
  'cz': ['Novakovic', 'Svobodin', 'Dvoracek', 'Prochazka', 'Cernovsky', 'Kralicek', 'Horaklin', 'Veselyan', 'Kadlecik', 'Sramek', 'Blazekor', 'Koubekar', 'Zemanek', 'Moravec', 'Plzenik'],
  'de': ['Schneiderfeld', 'Mullerhain', 'Bergmann', 'Krausser', 'Hoffstadt', 'Weberling', 'Fischerwald', 'Kellerhoff', 'Brandwein', 'Richtertal', 'Neumannhof', 'Vogelstein', 'Hartmann', 'Bruckner', 'Eisenbach'],
  'dk': ['Jorgensen', 'Nielsenborg', 'Sorensen', 'Larsenby', 'Kristiansen', 'Mikkelsen', 'Rasmussen', 'Hansenfjord', 'Pedersenholm', 'Frederiksen', 'Bjerregaard', 'Skovlund', 'Dahlgaard', 'Aalborgsen', 'Kolding'],
  'dz': ['Benkhelif', 'Mansouri', 'Belhaddad', 'Zerouali', 'Boudjema', 'Draouani', 'Kacemri', 'Hammouchi', 'Tlemcani', 'Aitmalek', 'Bensalah', 'Ouargli', 'Meziani', 'Cherifane', 'Kabylani'],
  'ec': ['Andrango', 'Quishpero', 'Zambranal', 'Cevalloro', 'Ibarrazo', 'Guamandino', 'Pichinchal', 'Montalvar', 'Cuencano', 'Ordonezal', 'Vallejoa', 'Ambatena', 'Loayzaro', 'Esmeraldi', 'Quitumbe'],
  'eg': ['El Masrani', 'Hassanour', 'Fahmidi', 'Abdelrahim', 'Zamaleki', 'Nileddin', 'Mahfouzi', 'Saidani', 'Iskandari', 'Ghazaly', 'Tantawi', 'Faragoun', 'Badrawi', 'Helwany', 'Qahirani'],
  'es': ['Valderama', 'Castellon', 'Serranoz', 'Montesino', 'Arandilla', 'Navarros', 'Iberico', 'Villalba', 'Herreral', 'Llorentez', 'Cordero', 'Alcazaro', 'Marbella', 'Segoviano', 'Riberos'],
  'fr': ['Beaumont', 'Lefranc', 'Morellet', 'Duchamp', 'Garnierot', 'Chevalin', 'Marchande', 'Laurentis', 'Rousselet', 'Fontaine', 'Delacroixan', 'Briandot', 'Charpentel', 'Montclair', 'Bellerive'],
  'gb-eng': ['Ashworth', 'Bradleyton', 'Crawford', 'Ellington', 'Harrington', 'Kingsley', 'Wexford', 'Chesterfield', 'Bromley', 'Fairhurst', 'Lockwood', 'Redgrave', 'Whitaker', 'Huxley', 'Northgate'],
  'gb-sct': ['MacAlpin', 'McBraid', 'Campbellson', 'Abernethy', 'Drummond', 'Falkirk', 'Inverley', 'MacCrae', 'Strathmore', 'Glenwood', 'McTavish', 'Kirkcaldy', 'Dunbarry', 'MacNairn', 'Highland'],
  'gb-wls': ['Aberdare', 'Llewelyn', 'Caradog', 'Brynmore', 'Gwynedd', 'Pritchard', 'Meredith', 'Powellyn', 'Ceredig', 'Rhondale', 'Taliesin', 'Owainson', 'Cardiffan', 'Pembroke', 'Maelor'],
  'ge': ['Kvariani', 'Beridzev', 'Tsiklauri', 'Mchedlidze', 'Gogolauri', 'Abashidze', 'Lomidzeni', 'Kiknadze', 'Tsereteli', 'Javakhish', 'Gurieli', 'Dadianuri', 'Kartveli', 'Rustaveli', 'Chkheidzari'],
  'gr': ['Papadakis', 'Nikolaidis', 'Georgiou', 'Kostakis', 'Anastasiou', 'Dimitriou', 'Makridis', 'Stavropoulos', 'Theodorou', 'Karagiannis', 'Pappasios', 'Athenakis', 'Pelopidas', 'Kritikos', 'Hellasios'],
  'hr': ['Kovaciri', 'Horvatin', 'Marinic', 'Vukovic', 'Bjelic', 'Dubravic', 'Zagorec', 'Perkovic', 'Kresimir', 'Radosevic', 'Slavonic', 'Dalmatin', 'Jadranic', 'Lovrenic', 'Modrinic'],
  'hu': ['Nagyfalvi', 'Kovacsor', 'Szabados', 'Tothvar', 'Vargahegy', 'Baloghan', 'Farkasdi', 'Molnari', 'Kissfalud', 'Horvathos', 'Puskari', 'Debreczeni', 'Budavari', 'Szegedyn', 'Aranyosi'],
  'ie': ['O Callaghan', 'Fitzroyan', 'Kellehern', 'Doylewick', 'Brennan', 'Flanagan', 'O Driscoll', 'Mahoney', 'Gallagher', 'Sullivan', 'Clonmore', 'Dublinley', 'Kildare', 'Shamrocke', 'Connolly'],
  'iq': ['Al Basri', 'Al Karimi', 'Baghdadi', 'Mosuli', 'Najafi', 'Tikriti', 'Haddadi', 'Rasheedi', 'Younisi', 'Qasimani', 'Al Zubair', 'Karbali', 'Samarrai', 'Furatani', 'Kadhimi'],
  'ir': ['Farahani', 'Tehrani', 'Kermani', 'Shirazian', 'Mazandar', 'Rezavand', 'Daryoushi', 'Mehrabi', 'Pahlavani', 'Zandipour', 'Ardestani', 'Kashanian', 'Tabrizi', 'Nourbakhsh', 'Sepahani'],
  'it': ['Rinaldini', 'Bellavita', 'Montanari', 'Ferrantino', 'Graziano', 'Lombardelli', 'Romagnoli', 'Veneziano', 'Belliniro', 'Contarini', 'Sorrentino', 'Capellini', 'Fioravanti', 'Marchetti', 'Palermino'],
  'jp': ['Takashiro', 'Morikawa', 'Fujimoto', 'Nakamori', 'Hasegai', 'Kobayato', 'Sakuragi', 'Yamashiro', 'Ishikawa', 'Tanemura', 'Kurosawa', 'Akitomo', 'Harukaze', 'Matsudai', 'Kawazaki'],
  'kr': ['Kimdaro', 'Parkjin', 'Leehwan', 'Choisung', 'Jungmin', 'Kanghoon', 'Yoonseok', 'Hanbit', 'Baekjun', 'Seohae', 'Limchan', 'Ohkyu', 'Moonjae', 'Shinwoo', 'Namguk'],
  'kz': ['Akhmetov', 'Nurgali', 'Sadykov', 'Bektasov', 'Tulegen', 'Karimuly', 'Altynbek', 'Kairatov', 'Zhanibek', 'Sarsenov', 'Temirlan', 'Orazbay', 'Kenesary', 'Astanaev', 'Stepanbek'],
  'ma': ['Benaziz', 'El Fassi', 'Marrakchi', 'Tangeri', 'Boussaid', 'Zerhouni', 'Aitnouri', 'Rabatani', 'Chraibi', 'Belkacem', 'Oudghiri', 'Taziani', 'Soussani', 'Maghrebi', 'Idrissi'],
  'ml': ['Diarrawo', 'Traoreba', 'Keitara', 'Sissokani', 'Coulibaro', 'Kouyatero', 'Bamakofo', 'Samakele', 'Tourema', 'Sangaren', 'Konateo', 'Bagayoko', 'Dembeleko', 'Fofanal', 'Mandingo'],
  'mx': ['Hernandero', 'Ramirezal', 'Guerreron', 'Zapatillo', 'Monterano', 'Oaxacano', 'Castillero', 'Valadez', 'Rangelito', 'Pueblano', 'Navarrox', 'Tapatio', 'Chihuaro', 'Meridano', 'Cruzado'],
  'ng': ['Okaforo', 'Adebayo', 'Chukwudi', 'Baloguno', 'Ezeani', 'Nwankaro', 'Ibrahimko', 'Oladipo', 'Ucheoma', 'Kanuari', 'Onyekachi', 'Ajibola', 'Musafo', 'Enyimba', 'Lagosian'],
  'nir': ['McKeown', 'Belford', 'Craigavon', 'O Neillan', 'Derryhill', 'Lisburne', 'McIlroy', 'Armaghan', 'Fermanagh', 'Downpatrick', 'Tyronewell', 'Magherin', 'Colerain', 'Antrimor', 'Ulsterry'],
  'nl': ['Van Dalen', 'De Vriesor', 'Bakkerdam', 'Janssenveld', 'Koopman', 'Vermeeran', 'Hendriks', 'Rotterveen', 'Aalsmeer', 'Vanderplas', 'Schaafman', 'Willemsen', 'Noordwijk', 'Kuyper', 'Dijkgraaf'],
  'no': ['Nordvik', 'Haalandor', 'Bergheim', 'Solbakken', 'Lundgaard', 'Olsenfjord', 'Eriksfjord', 'Tromsdal', 'Stavanger', 'Haugenvik', 'Bjornstad', 'Skarsgard', 'Moldegaard', 'Aasland', 'Vikingstad'],
  'pa': ['Balboza', 'Herreralis', 'Quinteron', 'Canalero', 'Penedoza', 'Sanmiguel', 'Arosemen', 'Chorrerano', 'Colonero', 'Darieni', 'Valderas', 'Coclesi', 'Panamero', 'Santanero', 'Molinarez'],
  'pe': ['Quispero', 'Huamanis', 'Ccalluchi', 'Incanari', 'Cusqueno', 'Arequipar', 'Pizarron', 'Chavarry', 'Condorcan', 'Mochica', 'Limezano', 'Cajamarco', 'Ayacuchan', 'Villanuev', 'Rimacero'],
  'pl': ['Kowalski', 'Nowaczyk', 'Wisniewski', 'Zielinowski', 'Kaminski', 'Wojcikowski', 'Lewicki', 'Mazurski', 'Kaczmarek', 'Szymanowicz', 'Pawlak', 'Gorski', 'Dabrowski', 'Krakowski', 'Warszawski'],
  'pt': ['Ferreirado', 'Oliveirinho', 'Coimbrano', 'Lisboeta', 'Braganca', 'Carvalhal', 'Moreirado', 'Pereirinho', 'Teixeirado', 'Azevedos', 'Salgueiro', 'Figueiredo', 'Madeirense', 'Portuense', 'Algarvio'],
  'py': ['Benitezal', 'Gamarro', 'Aguayo', 'Villalbino', 'Itapua', 'Guaranero', 'Encarnacion', 'Asunceno', 'Cacerizo', 'Riverolo', 'Sanabrio', 'Cabanero', 'Piribebuy', 'Canindeyu', 'Ypacarai'],
  'qa': ['Al Thaniq', 'Al Marriq', 'Al Kuwariq', 'Al Naimiq', 'Al Suwaidiq', 'Dohaani', 'Al Jassimq', 'Al Mansouriq', 'Al Rayyani', 'Al Wakraqi', 'Al Duhaili', 'Al Saadiq', 'Al Qatari', 'Al Khaldiq', 'Al Zubari'],
  'ro': ['Popescanu', 'Ionescu', 'Dumitrescu', 'Stanescu', 'Marinescu', 'Georgescu', 'Constantin', 'Vasilescu', 'Munteanu', 'Radulescu', 'Bucurestean', 'Ardeleanu', 'Moldoveanu', 'Petrescu', 'Dragomir'],
  'rs': ['Petrovic', 'Jovanovic', 'Nikolic', 'Stojanovar', 'Milosevic', 'Radovanic', 'Djordjevic', 'Savicevic', 'Kragujevic', 'Belgradic', 'Moravski', 'Vojvodic', 'Zlatiborac', 'Lazarevic', 'Obrenovic'],
  'sa': ['Al Harbi', 'Al Qahtani', 'Al Dosari', 'Al Shammari', 'Al Mutairi', 'Al Riyadhi', 'Al Najdi', 'Al Hilali', 'Al Tamimi', 'Al Jeddawi', 'Al Fahdi', 'Al Salehi', 'Al Rashidi', 'Al Yamami', 'Al Madani'],
  'se': ['Anderssonvik', 'Karlssonberg', 'Nilssonholm', 'Larssonby', 'Ekstrom', 'Svenssondal', 'Bergqvist', 'Lindgren', 'Osterlund', 'Uppsala', 'Malmstrom', 'Hedlund', 'Norrstrom', 'Bjorkman', 'Vastervik'],
  'si': ['Novakic', 'Kranjcic', 'Horvatnik', 'Zupancic', 'Potochnik', 'Mlakaric', 'Kosirnik', 'Vidmaric', 'Oblakov', 'Ljubljanec', 'Triglavic', 'Mariboric', 'Dolenc', 'Kovacnik', 'Rozmanec'],
  'sk': ['Novaksky', 'Horvathik', 'Kovacik', 'Vargovsky', 'Tothik', 'Durisec', 'Hamsikor', 'Bratislavik', 'Presovsky', 'Zilinsky', 'Mikulas', 'Sokolik', 'Oravec', 'Tatranec', 'Liptovsky'],
  'sn': ['Diopara', 'Ndiayal', 'Sarriko', 'Gueyane', 'Fayemba', 'Baobab', 'Dakarou', 'Cissokho', 'Mbacke', 'Thiamoro', 'Senghoran', 'Kaolack', 'Toubani', 'Fallouma', 'Wolofane'],
  'tn': ['Ben Salem', 'Trabelsian', 'Sfaxiani', 'Tunisari', 'Hammameti', 'Jazirian', 'Bouzidi', 'Mestiri', 'Kairouani', 'Gabesli', 'Mahdoui', 'Djerbani', 'Monastiri', 'Sahelani', 'Zitouni'],
  'tr': ['Yildirim', 'Demirhan', 'Karakaya', 'Ozdemir', 'Aydogan', 'Kilicsoy', 'Ankarali', 'Istanbey', 'Altintas', 'Sahinoglu', 'Kaplaner', 'Erdoganli', 'Yilmazer', 'Toprakci', 'Bozkurtan'],
  'ua': ['Kovalchuk', 'Shevchenko', 'Bondarenko', 'Melnyk', 'Tkachenko', 'Kravchenko', 'Hrytsenko', 'Petryuk', 'Savchuk', 'Romaniuk', 'Zakharchuk', 'Polishchuk', 'Vasylyn', 'Bilyi', 'Lysenko'],
  'us': ['Jefferson', 'Carterfield', 'Madison', 'Hamilton', 'Brooksman', 'Washingtoner', 'Kennedywell', 'Harrison', 'Cooperstown', 'Franklin', 'Lincolnwood', 'Marshall', 'Prescott', 'Sheridan', 'Arlington'],
  'uy': ['Bentancor', 'Monteverdi', 'Canelones', 'Riveratto', 'Suarezino', 'Lugarez', 'Coloniaro', 'Artigano', 'Maldonado', 'Salteno', 'Tacuarembo', 'Duraznero', 'Rochano', 'Paysandu', 'Charruano'],
  'uz': ['Karimov', 'Tashkentov', 'Nazarov', 'Rustamov', 'Bekmurod', 'Samarkandi', 'Bukhariy', 'Yuldashev', 'Tursunov', 'Khodjaev', 'Navoiyev', 'Fergani', 'Qodirov', 'Ergashev', 'Temurov'],
  've': ['Maracayo', 'Orinoco', 'Valerano', 'Caraceno', 'Bolivaro', 'Margarito', 'Zuliano', 'Andradez', 'Rondonal', 'Llanero', 'Guayanes', 'Barquero', 'Tachirano', 'Meridanoz', 'Cumana'],
  'za': ['Mkhize', 'Dlaminor', 'Nkosiwe', 'Molefe', 'Khumalani', 'Mbekazi', 'Sibanyoni', 'Pretoriano', 'Capeton', 'Zuluwayo', 'Sowetano', 'Ndlovini', 'Mabizela', 'Johannes', 'Bothaville'],
};

function createSquad(
  flagCode: string,
  fieldNumbers: readonly number[] = FIELD_NUMBERS,
): NationalTeamSquad {
  const surnames = FICTIONAL_TEAM_SURNAMES[flagCode];

  if (!surnames) {
    throw new Error(`Missing fictional surnames for flagCode: ${flagCode}`);
  }

  const fieldPlayers = Object.fromEntries(
    FIELD_RANKS.map((rank, index) => [
      rank,
      {
        rank,
        name: surnames[index + 1],
        shirtNumber: fieldNumbers[index],
      },
    ]),
  ) as NationalTeamSquad['fieldPlayers'];

  return {
    flagCode,
    fieldPlayers,
    goalkeeper: {
      id: 'gk',
      name: surnames[0],
      shirtNumber: 1,
    },
  };
}

export const REAL_SQUADS: readonly NationalTeamSquad[] = [
  createSquad('al'),
  createSquad('dz'),
  createSquad('ar'),
  createSquad('am'),
  createSquad('au'),
  createSquad('at'),
  createSquad('by'),
  createSquad('be'),
  createSquad('br'),
  createSquad('cm'),
  createSquad('ca'),
  createSquad('cl'),
  createSquad('co'),
  createSquad('cr'),
  createSquad('hr'),
  createSquad('cz'),
  createSquad('dk'),
  createSquad('ec'),
  createSquad('eg'),
  createSquad('gb-eng'),
  createSquad('fr'),
  createSquad('ge'),
  createSquad('de'),
  createSquad('gr'),
  createSquad('hu'),
  createSquad('ir'),
  createSquad('iq'),
  createSquad('ie'),
  createSquad('it'),
  createSquad('ci'),
  createSquad('jp'),
  createSquad('kz'),
  createSquad('ml'),
  createSquad('mx'),
  createSquad('ma'),
  createSquad('nl'),
  createSquad('ng'),
  createSquad('nir', NORTHERN_IRELAND_FIELD_NUMBERS),
  createSquad('no'),
  createSquad('pa'),
  createSquad('py'),
  createSquad('pe'),
  createSquad('pl'),
  createSquad('pt'),
  createSquad('qa'),
  createSquad('ro'),
  createSquad('sa'),
  createSquad('gb-sct'),
  createSquad('sn'),
  createSquad('rs'),
  createSquad('sk'),
  createSquad('si'),
  createSquad('za'),
  createSquad('kr'),
  createSquad('es'),
  createSquad('se'),
  createSquad('ch'),
  createSquad('tn'),
  createSquad('tr'),
  createSquad('ua'),
  createSquad('uy'),
  createSquad('us'),
  createSquad('uz'),
  createSquad('ve'),
  createSquad('gb-wls'),
];

export function getRealSquad(
  flagCode: string,
): NationalTeamSquad | undefined {
  return REAL_SQUADS.find(
    (squad) => squad.flagCode === flagCode,
  );
}

export function requireRealSquad(
  flagCode: string,
): NationalTeamSquad {
  const squad = getRealSquad(flagCode);

  if (!squad) {
    throw new Error(
      `Missing real squad for flagCode: ${flagCode}`,
    );
  }

  return squad;
}
