import type { GameLanguage } from '../i18n/languageStore';

export const TUTORIAL_TEXTS = {
  en: {
    'tutorial.welcome.title': 'Tutorial Match',
    'tutorial.welcome.message':
      'Build your attack by moving through opponent cards line by line.\nReach the goalkeeper to take a shot on goal.\nEach beaten opponent card, except the goalkeeper (GK), goes into your deck.',
    'tutorial.basicRule.title': 'Basic rule',
    'tutorial.basicRule.message':
      'Your deck card can beat an opponent card if its rank is equal, higher, or the card follows a special rule.',
    'tutorial.drawNine.message': 'Draw a card from the deck.',
    'tutorial.beatSeven.message': "This is a Nine (9). It can beat the opponent defender's Seven (7).",
    'tutorial.turnoverRule.title': 'Ball lost (turnover)',
    'tutorial.turnoverRule.message': 'If the attack fails, the ball is lost and the turn passes to the other team.',
    'tutorial.specialRule.title': 'Special rule:',
    'tutorial.specialRule.message':
      'Six (6) beats Ace (A)\nSeven (7) beats King (K)\nEight (8) beats Queen (Q)\nNine (9) beats Jack (J)\nTwo (2) beats Joker',
    'tutorial.drawSix.message': 'Draw a card from the deck.',
    'tutorial.beatAce.message': 'This is a Six (6). It can be used against Ace (A).',
    'tutorial.clearDefense.title': 'Keep going',
    'tutorial.clearDefense.message': 'Clear the defense line, then you will reach the goalkeeper.',
    'tutorial.goalkeeper.title': 'Goalkeeper (GK)',
    'tutorial.goalkeeper.message':
      'To score a goal, you need to beat the goalkeeper card. The attacking card must be higher than the goalkeeper card or follow a special rule.',
    'tutorial.drawShot.message':
      'A card of the same rank as the goalkeeper cannot beat it, but it gives you an extra shot on goal (a rebound).\nA card lower than the goalkeeper card will lose the ball. The goalkeeper card rank will then change randomly.\nIMPORTANT: the goalkeeper cannot be Joker or Two (2).',
    'tutorial.takeShot.message': 'Click the goalkeeper card to take a shot on goal.',
    'tutorial.turnoverAfterGoal.title': 'Goal!',
    'tutorial.turnoverAfterGoal.message': 'After conceding a goal, the team restores its defense and starts its attack.',
    'tutorial.midfieldSupport.title': 'Midfielder joins the attack',
    'tutorial.midfieldSupport.message':
      'Your midfielders can help in attack.\nBut they can only play against the card directly opposite them - on their own flank.',
    'tutorial.selectLeftMidfielder.message':
      'Select your right midfielder.\nIMPORTANT: your midfielder card must be higher than the opponent midfielder card or follow a special rule.',
    'tutorial.oppositeMidfielderBeaten.title': 'Midfielder joins on the flank',
    'tutorial.oppositeMidfielderBeaten.message':
      'The midfielder card acts only on its own flank and beats the midfielder directly opposite.\nIMPORTANT: your midfielder card must be higher than the opponent midfielder card or follow a special rule.',
    'tutorial.oppositeSlotRule.title': 'Only on the same flank',
    'tutorial.oppositeSlotRule.message': 'Left vs left, center vs center, right vs right.',
    'tutorial.emptySlot.title': 'Free zone',
    'tutorial.emptySlot.message':
      'You cannot use a midfielder against an empty slot.\nOpen zones can only be used by attacking cards from the deck.',
    'tutorial.drawLowAfterMidfielder.message': "Draw a card from the deck and try to break through the opponent's midfield line.",
    'tutorial.loseAfterMidfielder.message':
      "This is a Three (3), and right now it cannot beat any card in the opponent's midfield. Try using it against Brazil's center midfielder.",
    'tutorial.openZone.title': 'Open zone',
    'tutorial.openZone.message':
      'A midfielder joined the attack, but the ball was lost, so one free zone was left for the counter-attack.',
    'tutorial.drawCounterattackCard.message': 'Draw a card from the deck to make the counter-attack.',
    'tutorial.passThroughOpenZone.title': 'Use the open zone',
    'tutorial.passThroughOpenZone.message':
      "This is a Three (3), and right now it cannot beat any card in the opponent's midfield, but it can use the free zone.\nMove through it and continue your attack.",
    'tutorial.ready.title': 'That is it!',
    'tutorial.ready.message':
      'Now play the rest of the match yourself.\nTry different move combinations to find the best strategy for your team.',
    'tutorial.guard.tryCard': 'Try this card.',
    'tutorial.guard.pressContinue': 'Press Continue first.',
    'tutorial.guard.useDeck': 'Use the highlighted deck.',
    'tutorial.guard.useOppositeLane': 'Use the opposite lane.',
    'tutorial.guard.tryMidfielder': 'Try the highlighted midfielder.',
    'tutorial.guard.midfielderCannotPlay': 'This midfielder cannot play here.',
    'tutorial.guard.passOpenZone': 'Pass through the highlighted open zone.',
    'tutorial.button.continue': 'Continue'
  },
  pl: {
    'tutorial.welcome.title': 'Mecz treningowy',
    'tutorial.welcome.message':
      'Buduj swój atak, przechodząc przez karty przeciwnika linia po linii.\nDotrzyj do bramkarza, aby oddać strzał na bramkę.\nKażda pokonana karta przeciwnika, oprócz bramkarza (GK), trafia do twojej talii.',
    'tutorial.basicRule.title': 'Podstawowa zasada',
    'tutorial.basicRule.message':
      'Twoja karta z talii może pokonać kartę przeciwnika, jeśli ma taki sam lub wyższy rang albo podlega zasadzie specjalnej.',
    'tutorial.drawNine.message': 'Dobierz kartę z talii.',
    'tutorial.beatSeven.message': 'To Dziewiątka (9). Może pokonać Siódemkę (7), kartę obrońcy przeciwnika.',
    'tutorial.turnoverRule.title': 'Strata piłki (zmiana tury)',
    'tutorial.turnoverRule.message': 'Jeśli atak się nie uda, piłka zostaje stracona, a tura przechodzi do drugiej drużyny.',
    'tutorial.specialRule.title': 'Zasada specjalna:',
    'tutorial.specialRule.message':
      'Szóstka (6) bije Asa (A)\nSiódemka (7) bije Króla (K)\nÓsemka (8) bije Damę (Q)\nDziewiątka (9) bije Waleta (J)\nDwójka (2) bije Jokera',
    'tutorial.drawSix.message': 'Dobierz kartę z talii.',
    'tutorial.beatAce.message': 'To Szóstka (6). Można jej użyć przeciwko Asowi (A).',
    'tutorial.clearDefense.title': 'Graj dalej',
    'tutorial.clearDefense.message': 'Wyczyść linię obrony, a potem dojdziesz do bramkarza.',
    'tutorial.goalkeeper.title': 'Bramkarz (GK)',
    'tutorial.goalkeeper.message':
      'Aby zdobyć gola, musisz pokonać kartę bramkarza. Karta atakująca musi być wyższa od karty bramkarza albo podlegać zasadzie specjalnej.',
    'tutorial.drawShot.message':
      'Karta o takim samym rangu jak bramkarz nie może go pokonać, ale daje dodatkowy strzał na bramkę (dobitkę).\nKarta niższa od karty bramkarza spowoduje stratę piłki. Ranga karty bramkarza zostanie wtedy losowo zmieniona.\nWAŻNE: bramkarzem nie może być Joker ani Dwójka (2).',
    'tutorial.takeShot.message': 'Kliknij kartę bramkarza, aby oddać strzał na bramkę.',
    'tutorial.turnoverAfterGoal.title': 'Gol!',
    'tutorial.turnoverAfterGoal.message': 'Po straconym golu drużyna odbudowuje obronę i zaczyna swoją akcję.',
    'tutorial.midfieldSupport.title': 'Podłączenie pomocnika do ataku',
    'tutorial.midfieldSupport.message':
      'Twoi pomocnicy mogą pomóc w ataku.\nAle mogą grać tylko przeciwko karcie dokładnie naprzeciwko siebie - na swoim skrzydle.',
    'tutorial.selectLeftMidfielder.message':
      'Wybierz swojego prawego pomocnika.\nWAŻNE: karta twojego pomocnika musi być wyższa od karty pomocnika przeciwnika albo podlegać zasadzie specjalnej.',
    'tutorial.oppositeMidfielderBeaten.title': 'Podłączenie pomocnika na skrzydle',
    'tutorial.oppositeMidfielderBeaten.message':
      'Karta pomocnika działa tylko na swoim skrzydle i pokonuje pomocnika dokładnie naprzeciwko.\nWAŻNE: karta twojego pomocnika musi być wyższa od karty pomocnika przeciwnika albo podlegać zasadzie specjalnej.',
    'tutorial.oppositeSlotRule.title': 'Tylko na swoim skrzydle',
    'tutorial.oppositeSlotRule.message': 'Lewy na lewego, środkowy na środkowego, prawy na prawego.',
    'tutorial.emptySlot.title': 'Wolna strefa',
    'tutorial.emptySlot.message':
      'Nie możesz użyć pomocnika przeciwko pustemu slotowi.\nOtwarte strefy mogą wykorzystywać tylko karty atakujące z talii.',
    'tutorial.drawLowAfterMidfielder.message': 'Dobierz kartę z talii i spróbuj przebić nią linię pomocy przeciwnika.',
    'tutorial.loseAfterMidfielder.message':
      'To Trójka (3) i teraz nie jest w stanie pokonać żadnej karty z pomocy przeciwnika. Spróbuj użyć jej przeciwko środkowemu pomocnikowi Brazylii.',
    'tutorial.openZone.title': 'Otwarta strefa',
    'tutorial.openZone.message':
      'Pomocnik podłączył się do ataku, ale piłka została stracona, dlatego została jedna wolna strefa do kontrataku.',
    'tutorial.drawCounterattackCard.message': 'Dobierz kartę z talii do przeprowadzenia kontrataku.',
    'tutorial.passThroughOpenZone.title': 'Wykorzystaj otwartą strefę',
    'tutorial.passThroughOpenZone.message':
      'To Trójka (3) i teraz nie jest w stanie pokonać żadnej karty z pomocy przeciwnika, ale może wykorzystać wolną strefę.\nPrzejdź przez nią i kontynuuj swój atak.',
    'tutorial.ready.title': 'To wszystko!',
    'tutorial.ready.message':
      'Teraz dograj resztę meczu samodzielnie.\nPróbuj różnych kombinacji ruchów, aby znaleźć najlepszą strategię dla swojej drużyny.',
    'tutorial.guard.tryCard': 'Spróbuj tej karty.',
    'tutorial.guard.pressContinue': 'Najpierw naciśnij Dalej.',
    'tutorial.guard.useDeck': 'Użyj podświetlonej talii.',
    'tutorial.guard.useOppositeLane': 'Użyj tego samego korytarza.',
    'tutorial.guard.tryMidfielder': 'Spróbuj podświetlonego pomocnika.',
    'tutorial.guard.midfielderCannotPlay': 'Ten pomocnik nie może tu zagrać.',
    'tutorial.guard.passOpenZone': 'Przejdź przez podświetloną otwartą strefę.',
    'tutorial.button.continue': 'Dalej'
  },
  uk: {
    'tutorial.welcome.title': 'Навчальний матч',
    'tutorial.welcome.message':
      'Будуй свою атаку, проходячи карти суперника лінія за лінією.\nДоберись до голкіпера, щоб пробити по воротах. \nКожна пробита карта суперника, окрім голкіпера (GK), переходить у твою колоду.',
    'tutorial.basicRule.title': 'Базове правило',
    'tutorial.basicRule.message':
      'Твоя карта з колоди може побити карту суперника, якщо її ранг такий самий, вищий або ця карта підпадає під спец. правило.',
    'tutorial.drawNine.message': 'Візьми карту з колоди.',
    'tutorial.beatSeven.message': 'Це Дев’ятка (9). Нею можна побити карту захисника суперника сімку (7).',
    'tutorial.turnoverRule.title': 'Втрата м’яча (перехід ходу)',
    'tutorial.turnoverRule.message': 'Якщо атака не вдалася, м’яч буде втрачено, а хід перейде до іншої команди.',
    'tutorial.specialRule.title': 'Спеціальне правило:',
    'tutorial.specialRule.message': 'Шістка (6) б’є Туза (А) \nСімка (7) б’є Короля (K) \nВісімка (8) б’є Даму (Q) \nДев’ятка (9) б’є Вальта (J) \nДвійка (2) б’є Joker',
    'tutorial.drawSix.message': 'Візьми карту з колоди.',
    'tutorial.beatAce.message': 'Це Шістка (6). Її можна використати проти Туза (А).',
    'tutorial.clearDefense.title': 'Грай далі',
    'tutorial.clearDefense.message': 'Пройди лінію захисту, і ти дістанешся голкіпера.',
    'tutorial.goalkeeper.title': 'Голкіпер (GK)',
    'tutorial.goalkeeper.message': 'Щоб забити гол, треба побити карту голкіпера. Для цього атакуюча карта має бути вищою за карту голкіпера або підпадати під спеціальне правило.',
    'tutorial.drawShot.message': 'Карта такого ж рангу, як і карта голкіпера, не може її побити, але дасть можливість додаткового удару по воротах (добивання). \nКарта нижчого рангу за курту голкіпера, призведе до втрати м’яча. Але при цьому ранг карти голкіпера буде рандомно змінено. \nВАЖЛИВО: голкіпером не може бути Joker або Двійка (2).',
    'tutorial.takeShot.message': 'Натисни на карту голкіпера, щоб нанести удар по воротам.',
    'tutorial.turnoverAfterGoal.title': 'Гол!',
    'tutorial.turnoverAfterGoal.message': 'Після пропущеного м’яча команда відновлює свій захист і почиинає свою атаку.',
    'tutorial.midfieldSupport.title': 'Підключення півзахисника до атаки',
    'tutorial.midfieldSupport.message':
      'Твої півзахисники можуть допомогти в атаці.\nАле вони можуть грати лише проти карти навпроти себе - по свому флангу.',
    'tutorial.selectLeftMidfielder.message': 'Вибери свого правого півзахисника. \nВАЖЛИВО: карта твого півзахисника має бути вищою за карту півзахисника суперника, або підпадати під спеціальне правило.',
    'tutorial.oppositeMidfielderBeaten.title': 'Підключення півзахисника по флангу',
    'tutorial.oppositeMidfielderBeaten.message': 'Карта півзахисника діє лише на свому фланзі та пробиває півзахисника навпроти себе.  \nВАЖЛИВО: карта твого півзахисника має бути вищою за карту півзахисника суперника, або підпадати під спеціальне правило.',
    'tutorial.oppositeSlotRule.title': 'Лише по свому флангу',
    'tutorial.oppositeSlotRule.message': 'Лівий проти лівого, центральний проти центрального, правий проти правого.',
    'tutorial.emptySlot.title': 'Вільна зона',
    'tutorial.emptySlot.message':
      'Не можна використовувати півзахисника проти порожнього слоту.\nВідкриті зони можуть використовувати лише атакувальні карти з колоди.',
    'tutorial.drawLowAfterMidfielder.message': 'Візьми карту з колоди і спробуй пробити нею лінію півзахисту суперника.',
    'tutorial.loseAfterMidfielder.message': 'Це Трійка (3) і зараз вона не в стані пробити жодну карту з півзахисту суперника. Спробуй використати її проти центрального півзахисника Бразилії.',
    'tutorial.openZone.title': 'Відкрита зона',
    'tutorial.openZone.message':
      'Півзахисник підключився до атаки, але м’яч було втрачено, тому залишилася вільна зона для контратаки.',
    'tutorial.drawCounterattackCard.message': 'Візьми карту з колоди для проведення контратаки.',
    'tutorial.passThroughOpenZone.title': 'Використай відкриту зону',
    'tutorial.passThroughOpenZone.message':
      'Це Трійка (3) і зараз вона не в стані пробити жодну карту з півзахисту суперника, але можна використати вільну зону.\nПройди через неї та продовж свою атаку.',
    'tutorial.ready.title': 'Ось і все!',
    'tutorial.ready.message': 'Тепер дограй решту матчу самостійно. \nПробуй різні комбінації ходів, щоб знайти найкращу стратегію для своєї команди.',
    'tutorial.guard.tryCard': 'Спробуй цю карту.',
    'tutorial.guard.pressContinue': 'Спочатку натисни Далі.',
    'tutorial.guard.useDeck': 'Використай підсвічену колоду.',
    'tutorial.guard.useOppositeLane': 'Використай той самий коридор.',
    'tutorial.guard.tryMidfielder': 'Спробуй підсвіченого півзахисника.',
    'tutorial.guard.midfielderCannotPlay': 'Цей півзахисник не може тут зіграти.',
    'tutorial.guard.passOpenZone': 'Пройди через підсвічену відкриту зону.',
    'tutorial.button.continue': 'Далі'
  }
} as const;

export type TutorialTextKey = keyof (typeof TUTORIAL_TEXTS)['en'];

export function getTutorialText(language: GameLanguage, key: TutorialTextKey): string {
  return TUTORIAL_TEXTS[language][key];
}
