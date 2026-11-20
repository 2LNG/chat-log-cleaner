const assert = require('node:assert/strict');
const { cleanLog, isNoise } = require('./cleaner.js');

const dated = [
  '4/11/26 오후 11:52, 사용자A : 첫 메시지',
  '4/11/26 오후 11:53, 사용자A : 두 번째 메시지',
  '4/11/26 오후 11:54, 사용자A : ㅋㅋㅋㅋ',
  '4/11/26 오후 11:55, 사용자B : 답변입니다',
  '4/11/26 오후 11:56, 사용자A : 마지막 메시지',
].join('\n');
assert.equal(cleanLog(dated).text, [
  '[사용자A]',
  '첫 메시지 두 번째 메시지',
  '[사용자B]',
  '답변입니다',
  '[사용자A]',
  '마지막 메시지',
].join('\n'));
assert.equal(cleanLog(dated).stats.joinedMessages, 1);
assert.equal(cleanLog(dated).stats.removedNoise, 1);
assert.equal(cleanLog(dated).stats.removedTimestamps, 5);

const plain = '사용자A : 첫째\n사용자A : 둘째\n사용자B : 셋째\n사용자B : 넷째';
assert.equal(cleanLog(plain).text, '[사용자A]\n첫째 둘째\n[사용자B]\n셋째 넷째');
assert.equal(cleanLog(plain, { joinConsecutive: false }).text, '[사용자A]\n첫째\n둘째\n[사용자B]\n셋째\n넷째');
assert.equal(cleanLog(plain, { groupSpeakers: false }).text, plain);
assert.equal(cleanLog(plain, { groupSpeakers: false, joinConsecutive: true }).text, plain);
assert.equal(cleanLog('사용자A : 1 \n사용자A :  2 ').text, '[사용자A]\n1 2');
assert.equal(cleanLog('사용자A : 앞\n사용자A : ㅎㅎ\n사용자A : 뒤').text, '[사용자A]\n앞 뒤');
assert.equal(cleanLog('사용자A : 앞\n이어서 쓰인 줄\n사용자A : 뒤').text, '[사용자A]\n앞\n이어서 쓰인 줄\n뒤');
assert.equal(cleanLog('사용자A : 앞\n\n사용자A : 뒤', { removeBlank: false }).text, '[사용자A]\n앞\n\n뒤');
assert.equal(cleanLog('사용자A : 앞\n\n사용자A : 뒤').text, '[사용자A]\n앞 뒤');
assert.equal(cleanLog('사용자A : 너무 웃겨ㅋㅋㅋ').text, '[사용자A]\n너무 웃겨ㅋㅋㅋ');
assert.equal(cleanLog('2026년 4월 11일 토요일\n사용자A : 테스트').text, '[사용자A]\n테스트');
assert.equal(isNoise('ㅎㅎ', 3), false);
assert.equal(isNoise('ㅎㅎ', 2), true);
assert.equal(isNoise('ㅋㅋ ㅠㅠ', 1), true);
assert.equal(isNoise('단어ㅋㅋㅋ', 1), false);
console.log('All tests passed.');
