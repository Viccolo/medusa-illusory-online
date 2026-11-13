const SETTINGS = {
  datapipe_id: 'Ue6d6m1q5w89',
  completion_code: '211224',
  stim_dir: 'stim/',
  women: ['W1', 'W2', 'W3', 'W4'],
  men: ['M1', 'M2', 'M3', 'M4'],
  n_couples: 4,
  conds: ['real', 'illusory', 'rotated', 'none'],
  sides: ['L', 'R'],
  dims: [
    { key: 'experience', name: '経験性', def: '人物が空腹，恐怖，痛み，楽しみ，怒り，欲求，性格，意識，誇り，恥ずかしさ，喜びなどを感じる能力です。', check: ['人間', '猫', '蜘蛛'] },
    { key: 'agency', name: '行為主体性', def: '人物が自制，道徳，記憶，感情，計画，コミュニケーション，思考などを体験する能力です。', check: ['人間', '猫', '蜘蛛'] },
    { key: 'realness', name: '現実性', def: '人物が現実世界の一部である程度を示すものです。', check: ['人間', 'ユニコーン', '神様'] },
  ],
};
