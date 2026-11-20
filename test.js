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
const result = cleanLog(sample);
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
assert.equal(cleanLog('4/11/26 오후 11:52, 담비 : ㅋㅋ', { removeTime: false }).text, '4/11/26 오후 11:52, 담비 : ㅋㅋ');
assert.equal(cleanLog('담비 : ㅋ', { minRepeat: 2 }).text, '담비 : ㅋ');
console.log('All tests passed.');
