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
assert.equal(cleanLog('사용자A : 시작\n하\nㅋ\nㅋ', { selectedSpeakers: ['사용자A'] }).text,
  '[사용자A]\n시작 하 ㅋ ㅋ');
assert.equal(cleanLog('사용자A : 하\nㅋ\nㅋ\n사용자B : 응답', { selectedSpeakers: speakers }).text,
  '[사용자A]\n하 ㅋ ㅋ\n[사용자B]\n응답');
assert.equal(cleanLog('[사용자A]\n하\nㅋ\nㅋ', { selectedSpeakers: ['사용자A'] }).text,
  '[사용자A]\n하 ㅋ ㅋ');
assert.equal(cleanLog('사용자A : 내용: 내부 구분\n이어지는 내용: 계속', { selectedSpeakers: ['사용자A'] }).text,
  '[사용자A]\n내용: 내부 구분\n이어지는 내용: 계속');
assert.equal(cleanLog('사용자A : 첫줄\n다음줄\n사용자A : 세번째', { selectedSpeakers: ['사용자A'], joinConsecutive: false }).text,
  '[사용자A]\n첫줄\n다음줄\n세번째');
console.log('All tests passed.');

// v7 — repeated-character truncation (speaker names remain unchanged).
assert.equal(cleanLog('사용자A : 하 ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ', { selectedSpeakers: ['사용자A'] }).text, '[사용자A]\n하 ㅋㅋㅋㅋ');
assert.equal(cleanLog('사용자A : ㅠㅠㅠㅠㅠ !!!!! ㅎㅎㅎㅎ ㅎㅎㅎㅎㅎ', { selectedSpeakers: ['사용자A'] }).text, '[사용자A]\nㅠㅠㅠㅠ !!!! ㅎㅎㅎㅎ ㅎㅎㅎㅎ');
assert.equal(cleanLog('사용자A : 우와아아아아아', { selectedSpeakers: ['사용자A'] }).text, '[사용자A]\n우와아아아아');
assert.equal(cleanLog('사용자A : ㅋㅋㅋㅋㅋㅋㅋ', { selectedSpeakers: ['사용자A'] }).text, '');
assert.equal(cleanLog('사용자A : ㅋㅋㅋㅋㅋㅋㅋ', { selectedSpeakers: ['사용자A'], removeRepeat: false }).text, '[사용자A]\nㅋㅋㅋㅋ');
assert.equal(cleanLog('사용자A : 하 ㅋㅋㅋㅋㅋ', { selectedSpeakers: ['사용자A'], limitRepeats: false }).text, '[사용자A]\n하 ㅋㅋㅋㅋㅋ');
assert.equal(cleanLog('사용자A : !!!!!!!', { selectedSpeakers: ['사용자A'], groupSpeakers: false }).text, '사용자A : !!!!');
assert.equal(cleanLog('미선택 : !!!!!', { selectedSpeakers: ['사용자A'] }).text, '미선택 : !!!!!');
assert.equal(cleanLog('사용자A : 하\nㅋㅋㅋㅋㅋㅋㅋ', { selectedSpeakers: ['사용자A'] }).text, '[사용자A]\n하 ㅋㅋㅋㅋ');
assert.equal(cleanLog('사용자A : 하 ㅋㅋㅋㅋㅋㅋㅋ\n사용자A : !!!!!', { selectedSpeakers: ['사용자A'] }).text, '[사용자A]\n하 ㅋㅋㅋㅋ !!!!');
