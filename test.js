const assert = require('node:assert/strict');
const { cleanLog, isNoise } = require('./cleaner.js');
const sample = [
  '4/11/26 오후 11:52, 담비 : 있을듯합니다!!!!',
  '4/11/26 오후 11:52, 담비 : ㅋㅋㅋㅋ',
  '4/11/26 오후 11:52, 이랑 : ㅠㅠㅠㅠ',
  '4/11/26 오후 11:52, 담비 : 일단 대가족이라 어릴때부터 차 끌었을거같아요',
  '4/11/26 오후 11:52, 이랑 : 차 정비 같은 시츄도 진짜 콤되겠다는 생각을 했어요 프하하하하...',
  '',
  '2026. 4. 11. 오후 11:52, 담비 : 너무 웃겨ㅋㅋㅋ',
  '2026년 4월 11일 토요일',
  '2026년 4월 11일 오후 11:52, 이랑 : ㅎ',
  '2026-04-11 23:52, 담비 : 다음 줄',
  '이 문장은 다음 줄입니다.'
].join('\n');
const result = cleanLog(sample, { groupSpeakers: false });
assert.equal(result.text, [
  '담비 : 있을듯합니다!!!!',
  '담비 : 일단 대가족이라 어릴때부터 차 끌었을거같아요',
  '이랑 : 차 정비 같은 시츄도 진짜 콤되겠다는 생각을 했어요 프하하하하...',
  '담비 : 너무 웃겨ㅋㅋㅋ',
  '담비 : 다음 줄',
  '이 문장은 다음 줄입니다.'
].join('\n'));
assert.equal(result.stats.removedNoise, 3);
assert.equal(result.stats.removedTimestamps, 8);
assert.equal(result.stats.removedEmpty, 1);
assert.equal(result.stats.removedDateHeadings, 1);
assert.equal(isNoise('ㅎㅎ', 3), false);
assert.equal(isNoise('ㅎㅎ', 2), true);
assert.equal(isNoise('ㅋㅋ ㅠㅠ', 1), true);
assert.equal(isNoise('너무 웃겨ㅋㅋㅋ', 1), false);
assert.equal(cleanLog('4/11/26 오후 11:52, 담비 : ㅋㅋ', { removeTime: false, groupSpeakers: false }).text, '4/11/26 오후 11:52, 담비 : ㅋㅋ');
assert.equal(cleanLog('담비 : ㅋ', { minRepeat: 2, groupSpeakers: false }).text, '담비 : ㅋ');
const dialogue = [
  '담비 : 다들 오해예요',
  '이랑 : 피에트로본인도헷갈릴듯 ',
  '이랑 : 너남친있어. . . ?',
  '담비 : 선배는 그냥 예쁜여자라ㅠㅠ ㅠㅠ',
  '이랑 : 그게쟤고 . . . ... ?',
  '담비 : 아뇨헤어졌는데요',
  '담비 : 이래서 헤어졌어요(찌질해서)',
  '이랑 : 이런**'
].join('\n');
assert.equal(cleanLog(dialogue).text, [
  '[담비]', '다들 오해예요',
  '[이랑]', '피에트로본인도헷갈릴듯 ', '너남친있어. . . ?',
  '[담비]', '선배는 그냥 예쁜여자라ㅠㅠ ㅠㅠ',
  '[이랑]', '그게쟤고 . . . ... ?',
  '[담비]', '아뇨헤어졌는데요', '이래서 헤어졌어요(찌질해서)',
  '[이랑]', '이런**'
].join('\n'));
assert.equal(cleanLog('4/11/26 오후 11:52, 담비 : 첫째\n4/11/26 오후 11:53, 담비 : 둘째\n4/11/26 오후 11:54, 이랑 : ㅋㅋ\n4/11/26 오후 11:55, 이랑 : 셋째').text,
  '[담비]\n첫째\n둘째\n[이랑]\n셋째');
assert.equal(cleanLog('담비 : 첫째\n이어서 쓰는 줄\n담비 : 둘째').text, '[담비]\n첫째\n이어서 쓰는 줄\n둘째');
assert.equal(cleanLog('담비 : 첫째\n이랑 : 둘째', { groupSpeakers: false }).text, '담비 : 첫째\n이랑 : 둘째');
console.log('All tests passed.');
