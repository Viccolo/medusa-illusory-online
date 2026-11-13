const params = new URLSearchParams(location.search);
const pipeId = params.get('pipe') === 'off' ? '' : SETTINGS.datapipe_id;
const pid = Math.random().toString(36).slice(2, 12);
const filename = `medusa_illusory_${pid}.csv`;
let completed = false;
const showEnd = failed => {
  const body = completed
    ? `<p>以上で実験は終わりです。ご協力ありがとうございました。</p><p>作業完了コード：<b style="font-size:28px">${SETTINGS.completion_code}</b></p>
       <p>このコードを控えて，Yahoo!クラウドソーシングの画面に戻って入力してください。</p>`
      + (failed ? '<p>データの送信に失敗しました。お手数ですが，このページを閉じずに，Yahoo!クラウドソーシングのメッセージ機能で依頼者にお知らせください。</p>' : '')
    : '<p>申し訳ありません。お使いの環境ではこの実験に参加できません。</p>';
  jsPsych.getDisplayElement().innerHTML = `<div class="jspsych-content-wrapper"><div class="jspsych-content">${body}</div></div>`;
};
const jsPsych = initJsPsych({
  on_finish: () => { if (!pipeId) { jsPsych.data.get().localSave('csv', filename); showEnd(false); } },
  extensions: [{
    type: jsPsychExtensionPipe,
    params: {
      experiment_id: pipeId || 'none', filename, enabled: Boolean(pipeId),
      wait_message: '<p>データを送信しています。このままお待ちください。</p>',
      on_save: result => showEnd(!result.ok),
    },
  }],
});
const R = jsPsych.randomization;
jsPsych.data.addProperties({ pid, crowd_id: params.get('id') || '' });

const w = R.shuffle(SETTINGS.women), m = R.shuffle(SETTINGS.men);
const pairs = [];
for (let i = 0; i < SETTINGS.n_couples; i++) pairs.push([w[i], m[i]], [m[i], w[i]]);
const cells = [];
for (const cond of SETTINGS.conds) for (const side of SETTINGS.sides) cells.push({ cond, side });
const fileOf = t => `${t.l1}_${t.l2}_${t.cond}_${t.side}.png`;
const dimOrder = R.shuffle(SETTINGS.dims);
const blocks = dimOrder.map(dim => {
  const order = R.shuffle(pairs);
  const list = [];
  cells.forEach((c, k) => {
    const [l1, l2] = order[k];
    for (const target of ['L1', 'L2']) {
      const t = { dim: dim.key, l1, l2, cond: c.cond, side: c.side, target };
      t.target_side = (target === 'L1') === (c.side === 'L') ? 'L' : 'R';
      t.file = fileOf(t);
      list.push(t);
    }
  });
  return { dim, trials: R.shuffle(list) };
});
const mcPair = pairs[0];
const mcFiles = R.shuffle(['illusory', 'rotated']).map(cond => ({ cond, file: fileOf({ l1: mcPair[0], l2: mcPair[1], cond, side: 'L' }) }));

function guardForm(check) {
  const h = e => {
    const msg = check();
    if (msg) { e.preventDefault(); e.stopPropagation(); document.querySelector('.err').textContent = msg; }
  };
  document.addEventListener('submit', h, true);
  return () => document.removeEventListener('submit', h, true);
}
let unguard = () => {};
function scaleHtml(name) {
  return `<div class="scale"><span class="end">最も低い</span>
    ${[...Array(11).keys()].map(v => `<label><input type="radio" name="${name}" value="${v}"><br>${v}</label>`).join('')}
    <span class="end">最も高い</span></div>`;
}
function fitImage() {
  const im = document.querySelector('img.stim2d');
  if (!im) return;
  const wpx = Math.min(900, window.innerWidth * 0.9, (window.innerHeight - 230) * 1.5);
  im.style.width = Math.max(300, wpx) + 'px';
}

const consent = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `<div class="left">
    <h3>人物の写真の印象に関する実験</h3>
    <p>この度は，実験にご参加いただき，誠にありがとうございます。</p>
    <p>本研究では，人間の認知特性を明らかにすることを目的として，コンピュータを用いた調査を行います。所要時間は，準備や説明を含めて約15分です。</p>
    <p>本研究への参加は，参加者の皆様の自由な意思によるものであり，参加を辞退されても不利益は一切ございません。また，参加に同意された後でも，理由を問わず，途中で同意を撤回できます。その場合も，不利益が生じることはございません。</p>
    <p>なお，本研究を通じて得られた情報は，本研究に直接関わる目的以外には使用されません。研究の成果は学術論文や学会発表などで公表されることがありますが，データは匿名化し，統計処理した結果だけを公表するため，個人が特定されることはございません。匿名化したデータは，ほかの研究者が結果を検証できるよう，学術研究用のデータリポジトリで公開します。公開するデータには，氏名など個人を特定できる情報は含まれません。</p>
    <p>謝礼はYahoo!クラウドソーシングを通して支払われます。実験の最後に作業完了コードが表示されますので，必ず控えて，Yahoo!クラウドソーシングのページに戻って入力してください。</p>
    <p>本研究は，九州大学大学院人間環境学府倫理委員会の承認 (承認番号: 2024-012) を得た上で実施されています。</p>
    <p>本研究に関するお問い合わせは，以下の連絡先にお願いいたします。<br>担当者: 山田祐樹<br>連絡先 (email): yamadayuk@gmail.com</p>
    <p>パソコンで参加してください。スマートフォンやタブレットでは参加できません。</p></div>`,
  choices: ['同意して参加する'],
};
const browserCheck = {
  type: jsPsychBrowserCheck,
  features: ['width', 'height', 'browser', 'browser_version', 'mobile', 'os'],
  minimum_width: params.has('debug') ? 0 : 1024, minimum_height: params.has('debug') ? 0 : 700,
  inclusion_function: d => !d.mobile && window.matchMedia('(pointer: fine)').matches && window.matchMedia('(hover: hover)').matches &&
    !(navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform)),
  exclusion_message: () => '<p>申し訳ありません。この実験は，マウスを使えるパソコンで，画面の幅が1024画素以上，高さが700画素以上の環境でのみ参加できます。</p>',
  window_resize_message: '<p>ブラウザの窓を大きくしてください。</p><p>幅：<span id="browser-check-min-width"></span>，高さ：<span id="browser-check-min-height"></span></p><p>いまの幅：<span id="browser-check-actual-width"></span>，高さ：<span id="browser-check-actual-height"></span></p>',
  resize_fail_button_text: '大きくできない',
};
const demographics = {
  type: jsPsychSurveyHtmlForm,
  preamble: '<p>あなたについて教えてください。</p>',
  html: `<p>年齢：<input name="age" type="number" min="18" max="100" required> 歳</p>
    <p>性別：<label><input type="radio" name="gender" value="male" required>男性</label>
    <label><input type="radio" name="gender" value="female">女性</label>
    <label><input type="radio" name="gender" value="none">回答しない</label></p>`,
  button_label: '次へ',
  data: { phase: 'demographics' },
};
const fullscreen = {
  type: jsPsychFullscreen, fullscreen_mode: true,
  message: '<p>ここから画面を全体表示にします。</p>', button_label: '全体表示にする',
};
const intro = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `<div class="left"><h3>課題の説明</h3>
    <p>これから，2人の人物が写った画像をお見せします。1人は壁の前に立っている人物，もう1人は壁に掛かった写真などに写っている人物です。</p>
    <p>課題は3つに分かれています。それぞれの課題で，評価していただく特徴が違います。課題ごとに，はじめに特徴の説明があります。</p>
    <p>各画面では，左右どちらかの人物について評価していただきます。どちらの人物を評価するかは，画像の上に示します。</p></div>`,
  choices: ['次へ'],
};
function dimExplain(dim, b) {
  return [{
    type: jsPsychSurveyHtmlForm,
    preamble: `<div class="left"><h3>課題${b + 1} (全3課題)</h3><p>これからご説明するポイントに沿って，「${dim.name}」について，画像に写っている人物に対して評価を行っていただきます。</p>
      <p>「${dim.name}」とは，${dim.def}</p></div>`,
    html: `<p>以上の説明に従って，最も${dim.name}のある者を選んでください。</p>
      <p>${R.shuffle(dim.check).map(c => `<label style="margin:0 12px"><input type="radio" name="check" value="${c}" required>${c}</label>`).join('')}</p>`,
    button_label: '次へ',
    data: { phase: 'definition', dim: dim.key, block: b + 1 },
    on_finish: x => { x.check_correct = x.response.check === '人間'; },
  }, {
    type: jsPsychHtmlButtonResponse,
    stimulus: `<p>最も説明に合うのは「人間」です。</p><p>説明をよく理解した上で，次のページへ進んでください。</p>`,
    choices: ['評価を始める'],
  }];
}
function mainTrial(t, dim, b, k) {
  const who = t.target_side === 'L' ? '左' : '右';
  return {
    type: jsPsychSurveyHtmlForm,
    preamble: `<p class="q2d">画像の<b>${who}の人物</b>の${dim.name}を評価してください。</p><img class="stim2d" src="${SETTINGS.stim_dir + t.file}">`,
    html: `<div class="rate2d">${scaleHtml('rating')}</div><div class="err"></div>`,
    button_label: '次へ',
    data: { phase: 'main', block: b + 1, trial_no: k + 1, ...t },
    on_load: () => {
      fitImage();
      unguard = guardForm(() => document.querySelector('input[name=rating]:checked') ? '' : '数字を選んでください。');
    },
    on_finish: d => { unguard(); d.rating = Number(d.response.rating); },
  };
}
const attention = {
  type: jsPsychSurveyHtmlForm,
  html: `<div class="left"><p>この画面では画像は表示しません。以下の質問には，説明を読んでいるかを確かめるため，必ず「3」を選んでください。</p>
    <p>今日の天気はどうですか：
    ${[1, 2, 3, 4, 5].map(v => `<label><input type="radio" name="acq" value="${v}" required>${v}</label>`).join(' ')}</p></div>`,
  button_label: '次へ',
  data: { phase: 'attention' },
  on_finish: d => { d.acq_pass = d.response.acq === '3'; },
};
const attentionBlock = R.randomInt(0, 2);
const mainTimeline = [];
blocks.forEach((bl, b) => {
  const tl = bl.trials.map((t, k) => mainTrial(t, bl.dim, b, k));
  if (b === attentionBlock) tl.splice(R.randomInt(4, 12), 0, attention);
  mainTimeline.push(...dimExplain(bl.dim, b), ...tl);
});
const mcIntro = {
  type: jsPsychHtmlButtonResponse,
  stimulus: '<p>最後に，画像の見え方について2つおたずねします。</p>',
  choices: ['次へ'],
};
const mcTrials = mcFiles.map((f, k) => ({
  type: jsPsychSurveyHtmlForm,
  preamble: `<img class="stim2d" src="${SETTINGS.stim_dir + f.file}">`,
  html: `<div class="circle-q">この画像で，写真の人物の周りに四角い枠が見えますか：
    <label><input type="radio" name="frame" value="yes">見える</label>
    <label><input type="radio" name="frame" value="no">見えない</label></div><div class="err"></div>`,
  button_label: '次へ',
  data: { phase: 'manipulation', mc_no: k + 1, cond: f.cond, file: f.file },
  on_load: () => { fitImage(); unguard = guardForm(() => document.querySelector('input[name=frame]:checked') ? '' : '答えを選んでください。'); },
  on_finish: d => { unguard(); d.frame_seen = d.response.frame === 'yes'; },
}));
const post = {
  type: jsPsychSurveyHtmlForm,
  html: `<div class="left"><p>実験について気づいたことや感想があれば書いてください (任意)：<br><textarea name="comment" rows="4" cols="70"></textarea></p></div>`,
  button_label: '送信する',
  data: { phase: 'post' },
  on_finish: () => { completed = true; const v = validity(); jsPsych.data.addProperties({ valid: v.valid, exclusion: v.reason }); },
};
function validity() {
  const d = jsPsych.data.get(), reason = [];
  if (!d.filter({ phase: 'attention' }).values().every(x => x.acq_pass)) reason.push('attention');
  if (!d.filter({ phase: 'definition' }).values().every(x => x.check_correct)) reason.push('definition');
  const r = d.filter({ phase: 'main' }).values().map(x => x.rating);
  if (r.length === 0 || new Set(r).size === 1) reason.push('same_rating');
  return { valid: reason.length === 0, reason: reason.join('+') };
}
const files = new Set([...blocks.flatMap(bl => bl.trials.map(t => SETTINGS.stim_dir + t.file)), ...mcFiles.map(f => SETTINGS.stim_dir + f.file)]);
const preload = { type: jsPsychPreload, images: [...files] };
window.addEventListener('resize', fitImage);
jsPsych.run([preload, consent, browserCheck, demographics, fullscreen, intro, ...mainTimeline, mcIntro, ...mcTrials, post]);
