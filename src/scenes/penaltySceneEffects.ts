export type PenaltySceneOutcome = 'goal' | 'post' | 'save';

export type PenaltyImpactSceneEffect = {
  flyingMessage: 'GOAL!!' | 'Post!' | 'Goalkeeper!!';
  flyingMessageTone: PenaltySceneOutcome;
  soundKey: 'sound-penalty-goal' | 'sound-goalpost' | 'sound-goalkeeper-save';
};

export function getPenaltyImpactSceneEffect(outcome: PenaltySceneOutcome): PenaltyImpactSceneEffect {
  switch (outcome) {
    case 'goal':
      return {
        flyingMessage: 'GOAL!!',
        flyingMessageTone: 'goal',
        soundKey: 'sound-penalty-goal'
      };
    case 'post':
      return {
        flyingMessage: 'Post!',
        flyingMessageTone: 'post',
        soundKey: 'sound-goalpost'
      };
    case 'save':
      return {
        flyingMessage: 'Goalkeeper!!',
        flyingMessageTone: 'save',
        soundKey: 'sound-goalkeeper-save'
      };
  }
}
