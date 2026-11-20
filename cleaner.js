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
      const match = stripped.match(speakerPrefix);
      if (!match) continue;
      const name = match[1].trim();
      if (!name || name.length > 50) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    return Array.from(counts, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'));
  }
  function cleanLog(source, settings) {
    const opts = Object.assign({ removeTime: true, removeRepeat: true, removeBlank: true, minRepeat: 1, groupSpeakers: true, joinConsecutive: true, selectedSpeakers: [] }, settings || {});
    // Strict allowlist: unknown names and colon-containing body text are never parsed as speakers.
    const allowed = new Set(Array.isArray(opts.selectedSpeakers) ? opts.selectedSpeakers : []);
    const minRepeat = Math.max(1, Number(opts.minRepeat) || 1);
    const normalized = String(source).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const lines = normalized.split('\n');
    const result = [];
    const stats = { originalLines: lines.length, outputLines: 0, removedTimestamps: 0, removedNoise: 0, removedEmpty: 0, removedDateHeadings: 0, speakerGroups: 0, joinedMessages: 0 };
    let currentSpeaker = null;
    let lastMessageIndex = -1;
    for (const originalLine of lines) {
      let line = originalLine;
      if (opts.removeTime) {
        if (dateSeparator.test(line) || koreanDateHeading.test(line)) { stats.removedDateHeadings++; continue; }
        const stripped = stripTimestamp(line);
        if (stripped.removed) stats.removedTimestamps++;
        line = stripped.line;
      }
      const parsed = parseSpeaker(line, allowed);
      if (opts.removeRepeat && parsed && isNoise(parsed.message, minRepeat)) { stats.removedNoise++; continue; }
      if (opts.removeBlank && !line.trim()) { stats.removedEmpty++; continue; }
      if (opts.groupSpeakers && parsed) {
        if (parsed.name !== currentSpeaker) {
          result.push('[' + parsed.name + ']');
          stats.speakerGroups++;
          currentSpeaker = parsed.name;
          lastMessageIndex = -1;
        }
        const message = parsed.message.trim();
        if (opts.joinConsecutive && lastMessageIndex >= 0 && message) {
          result[lastMessageIndex] = result[lastMessageIndex].trimEnd() + ' ' + message;
          stats.joinedMessages++;
        } else {
          result.push(message);
          lastMessageIndex = result.length - 1;
        }
        continue;
      }
      result.push(line);
      // Do not attach unknown lines to a selected person's previous message.
      currentSpeaker = null;
      lastMessageIndex = -1;
    }
    stats.outputLines = result.length;
    return { text: result.join('\n'), stats };
  }
  root.ChatLogCleaner = { cleanLog, findSpeakerCandidates, isNoise, stripTimestamp };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ChatLogCleaner;
})(typeof window !== 'undefined' ? window : globalThis);
