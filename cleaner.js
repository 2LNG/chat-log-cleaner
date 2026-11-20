/* Local-only text transformations. No external requests or dependencies. */
(function (root) {
  'use strict';
  const calendar = String.raw`(?:\d{1,4}\s*[./-]\s*\d{1,2}\s*[./-]\s*\d{1,2}\.?|\d{4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일)`;
  const clock = String.raw`(?:(?:오전|오후|AM|PM|am|pm)\s*)?\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:오전|오후|AM|PM|am|pm))?`;
  const datedMessage = new RegExp(String.raw`^\s*${calendar}\s*,?\s*(?:\([^)]+\)\s*)?${clock}\s*,\s*(.*)$`);
  const timeOnlyMessage = new RegExp(String.raw`^\s*${clock}\s*,\s*(.*)$`);
  const dateSeparator = new RegExp(String.raw`^\s*(?:[-─—=]{2,}\s*)?${calendar}(?:\s*\([^)]*\)|\s*[월화수목금토일]요일?)?\s*(?:[-─—=]{2,})?\s*$`);
  const koreanDateHeading = /^\s*\d{4}년\s*\d{1,2}월\s*\d{1,2}일\s*[월화수목금토일]요일\s*$/;
  // Only a prefix at the beginning of the line is a speaker candidate.
  const speakerPrefix = /^\s*([^\n:：]{1,100}?)\s*[:：]\s*(.*)$/;
  const noiseChars = /^[ㅋㅎㅠㅜ\s]+$/u;
  const bracketSpeaker = /^\s*\[([^\]\n]{1,100})\]\s*$/;

  // Keep at most four identical non-whitespace characters in a row.
  function limitRepeatedChars(message) {
    return message.replace(/([^\s])\1{4,}/gu, '$1$1$1$1');
  }
  function isNoise(message, minCount) {
    const compact = message.replace(/\s+/g, '');
    return compact.length >= minCount && noiseChars.test(compact);
  }
  function stripTimestamp(line) {
    const dated = line.match(datedMessage);
    if (dated) return { line: dated[1], removed: true };
    const timed = line.match(timeOnlyMessage);
    if (timed && speakerPrefix.test(timed[1])) return { line: timed[1], removed: true };
    return { line, removed: false };
  }
  function parseSpeaker(line, allowed) {
    const bracket = line.match(bracketSpeaker);
    if (bracket && allowed.has(bracket[1].trim())) return { name: bracket[1].trim(), message: '', heading: true };
    const match = line.match(speakerPrefix);
    if (!match) return null;
    const name = match[1].trim();
    if (!allowed.has(name)) return null;
    return { name, message: match[2] };
  }
  function findSpeakerCandidates(source) {
    const counts = new Map();
    const normalized = String(source).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    for (const original of normalized.split('\n')) {
      const stripped = stripTimestamp(original).line;
      const bracket = stripped.match(bracketSpeaker);
      const match = stripped.match(speakerPrefix);
      if (!match && !bracket) continue;
      const name = (match ? match[1] : bracket[1]).trim();
      if (!name || name.length > 50) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    return Array.from(counts, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'));
  }
  function cleanLog(source, settings) {
    const opts = Object.assign({ removeTime: true, removeRepeat: true, removeBlank: true, minRepeat: 1, groupSpeakers: true, joinConsecutive: true, limitRepeats: true, selectedSpeakers: [] }, settings || {});
    // Strict allowlist: unknown names and colon-containing body text are never parsed as speakers.
    const allowed = new Set(Array.isArray(opts.selectedSpeakers) ? opts.selectedSpeakers : []);
    const minRepeat = Math.max(1, Number(opts.minRepeat) || 1);
    const normalized = String(source).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const lines = normalized.split('\n');
    const result = [];
    const stats = { originalLines: lines.length, outputLines: 0, removedTimestamps: 0, removedNoise: 0, removedEmpty: 0, removedDateHeadings: 0, speakerGroups: 0, joinedMessages: 0 };
    let currentSpeaker = null;
    let lastMessageIndex = -1;
    function appendMessage(message, isContinuation) {
      const trimmed = (opts.limitRepeats ? limitRepeatedChars(message) : message).trim();
      if (!trimmed) return;
      if (opts.joinConsecutive && lastMessageIndex >= 0) {
        result[lastMessageIndex] = result[lastMessageIndex].trimEnd() + ' ' + trimmed;
        stats.joinedMessages++;
      } else {
        result.push(trimmed);
        lastMessageIndex = result.length - 1;
      }
    }
    for (const originalLine of lines) {
      let line = originalLine;
      if (opts.removeTime) {
        if (dateSeparator.test(line) || koreanDateHeading.test(line)) { stats.removedDateHeadings++; continue; }
        const stripped = stripTimestamp(line);
        if (stripped.removed) stats.removedTimestamps++;
        line = stripped.line;
      }
      const parsed = parseSpeaker(line, allowed);
      if (opts.removeRepeat && parsed && !parsed.heading && isNoise(parsed.message, minRepeat)) {
        stats.removedNoise++;
        continue;
      }
      if (opts.removeBlank && !line.trim()) { stats.removedEmpty++; continue; }
      if (opts.groupSpeakers && parsed) {
        if (parsed.name !== currentSpeaker) {
          result.push('[' + parsed.name + ']');
          stats.speakerGroups++;
          currentSpeaker = parsed.name;
          lastMessageIndex = -1;
        }
        if (!parsed.heading) appendMessage(parsed.message, false);
        continue;
      }
      // Non-prefixed lines after a selected speaker belong to that speaker's
      // multiline message. A bare ㅋ/ㅎ/ㅠ line here is *not* a new message,
      // so it must not be removed by the standalone-message noise filter.
      // Explicit but unselected "name : message" headers remain untouched.
      if (opts.groupSpeakers && currentSpeaker && line.trim() &&
          !speakerPrefix.test(line) && !bracketSpeaker.test(line) &&
          !(datedMessage.test(originalLine) || timeOnlyMessage.test(originalLine))) {
        appendMessage(line, true);
        continue;
      }
      // When grouping is off, still shorten repetitions inside the selected speaker's message.
      if (parsed && !parsed.heading && opts.limitRepeats) {
        result.push(line.replace(parsed.message, limitRepeatedChars(parsed.message)));
      } else {
        result.push(line);
      }
      // Do not attach unknown speakers or unrelated lines to selected messages.
      currentSpeaker = null;
      lastMessageIndex = -1;
    }
    stats.outputLines = result.length;
    return { text: result.join('\n'), stats };
  }
  root.ChatLogCleaner = { cleanLog, findSpeakerCandidates, isNoise, stripTimestamp, limitRepeatedChars };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ChatLogCleaner;
})(typeof window !== 'undefined' ? window : globalThis);
