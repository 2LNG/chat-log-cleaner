const assert = require('node:assert/strict');
const { cleanLog, findSpeakerCandidates, isNoise } = require('./cleaner.js');
const speakers = ['사용자A', '사용자B'];
const input = [
  '4/11/26 오후 11:52, 사용자A : 첫 번째 메시지',
  '4/11/26 오후 11:53, 사용자A : 두 번째: 내용이 있어요',
  '4/11/26 오후 11:54, 사용자A : ㅋㅋㅋ',
  '4/11/26 오후 11:55, 사용자B : 세 번째 메시지',
].join('\n');
assert.equal(cleanLog(input, { selectedSpeakers: speakers }).text,
  '[사용자A]\n첫 번째 메시지 두 번째: 내용이 있어요\n[사용자B]\n세 번째 메시지');
assert.equal(cleanLog(input, { selectedSpeakers: speakers }).stats.removedNoise, 1);
assert.equal(cleanLog(input, { selectedSpeakers: speakers }).stats.removedTimestamps, 4);
assert.equal(cleanLog(input).text,
  '사용자A : 첫 번째 메시지\n사용자A : 두 번째: 내용이 있어요\n사용자A : ㅋㅋㅋ\n사용자B : 세 번째 메시지');
assert.equal(cleanLog('사용자A : 발언 중 등장한 이름: 문장입니다\n사용자A : 다음 메시지', { selectedSpeakers: ['사용자A'] }).text,
  '[사용자A]\n발언 중 등장한 이름: 문장입니다 다음 메시지');
assert.equal(cleanLog('사용자A : 첫 메시지\n미선택화자 : 내용: 더 있어요\n사용자A : 다음 메시지', { selectedSpeakers: ['사용자A'] }).text,
  '[사용자A]\n첫 메시지\n미선택화자 : 내용: 더 있어요\n[사용자A]\n다음 메시지');
assert.equal(cleanLog('사용자A : 첫째\n사용자A : 둘째', { selectedSpeakers: ['사용자A'], joinConsecutive: false }).text,
  '[사용자A]\n첫째\n둘째');
assert.equal(cleanLog('사용자A : 첫째\n사용자A : 둘째', { selectedSpeakers: ['사용자A'], groupSpeakers: false }).text,
  '사용자A : 첫째\n사용자A : 둘째');
assert.equal(cleanLog('사용자A : ㅋㅋㅋ\n미선택화자 : ㅋㅋㅋ', { selectedSpeakers: ['사용자A'] }).text,
  '미선택화자 : ㅋㅋㅋ');
assert.equal(cleanLog('2026년 4월 11일 토요일\n사용자A : 본문', { selectedSpeakers: ['사용자A'] }).text,
  '[사용자A]\n본문');
assert.equal(isNoise('ㅎㅎ', 3), false);
assert.equal(isNoise('ㅎㅎ', 2), true);
assert.deepEqual(findSpeakerCandidates('사용자A : 첫째\n사용자B : 둘째\n사용자A : 셋째'),
  [{ name: '사용자A', count: 2 }, { name: '사용자B', count: 1 }]);
console.log('All tests passed.');
