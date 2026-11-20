/* Pure text transformation: no network requests or external dependencies. */
(function (root) {
  'use strict';

  const calendarPrefix = String.raw`(?:\d{1,4}\s*[./-]\s*\d{1,2}\s*[./-]\s*\d{1,2}\.?|\d{4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일)`;
  const clock = String.raw`(?:(?:오전|오후|AM|PM|am|pm)\s*)?\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:오전|오후|AM|PM|am|pm))?`;
  // Date/time prefix on exported KakaoTalk messages (keep speaker + message).
  const datedMessage = new RegExp(String.raw`^\s*(?:${calendarPrefix})\s*,?\s*(?:\([^)]+\)\s*)?${clock}\s*,\s*(.+)$`);
  // Some exports contain just time, followed by comma and speaker.
  const timeOnlyMessage = new RegExp(String.raw`^\s*${clock}\s*,\s*([^:：\n]{1,100}\s*[:：]\s*.*)$`);
  // Date separators in KakaoTalk exports.
  const dateSeparator = new RegExp(String.raw`^\s*(?:[-─—=]{2,}\s*)?(?:${calendarPrefix})(?:\s*\([^)]*\)|\s*[월화수목금토일]요일?)?\s*(?:[-─—=]{2,})?\s*$`);
  const koreanDateHeading = /^\s*\d{4}년\s*\d{1,2}월\s*\d{1,2}일\s*[월화수목금토일]요일\s*$/;
  const speakerLine = /^\s*[^\n:：]{1,100}\s*[:：]\s*(.*)$/;
  const noiseChars = /^[ㅋㅎㅠㅜ\s]+$/u;

  function isNoise(message, minCount) {
    const compact = message.replace(/\s+/g, '');
    return compact.length >= minCount && noiseChars.test(compact);
  }

  function stripTimestamp(line) {
    const dated = line.match(datedMessage);
    if (dated && speakerLine.test(dated[1])) return { line: dated[1], removed: true };
    const timed = line.match(timeOnlyMessage);
    if (timed) return { line: timed[1], removed: true };
    return { line, removed: false };
  }

  function cleanLog(source, settings) {
    const opts = Object.assign({ removeTime: true, removeRepeat: true, removeBlank: true, minRepeat: 1, groupSpeakers: true, joinConsecutive: true }, settings || {});
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
        if (dateSeparator.test(line) || koreanDateHeading.test(line)) {
          stats.removedDateHeadings++;
          continue;
        }
        const stripped = stripTimestamp(line);
        if (stripped.removed) stats.removedTimestamps++;
        line = stripped.line;
      }
      if (opts.removeRepeat) {
        const match = line.match(speakerLine);
        // Filter only entire speaker messages, never arbitrary continuation lines.
        if (match && isNoise(match[1], minRepeat)) {
          stats.removedNoise++;
          continue;
        }
      }
      if (opts.removeBlank && line.trim() === '') {
        stats.removedEmpty++;
        continue;
      }
      if (opts.groupSpeakers) {
        // A speaker changes only on a recognized dialogue line. Continuation lines
        // remain under the most recent speaker without adding another heading.
        const speaker = line.match(/^\s*([^\n:：]{1,100}?)\s*[:：]\s*(.*)$/);
        if (speaker) {
          const name = speaker[1].trim();
          if (name !== currentSpeaker) {
            result.push('[' + name + ']');
            stats.speakerGroups++;
            currentSpeaker = name;
            lastMessageIndex = -1;
          }
          const message = speaker[2].trim();
          if (opts.joinConsecutive && lastMessageIndex >= 0 && message) {
            // Keep intentional spacing inside each message; add one separator
            // only between consecutive messages by the same speaker.
            result[lastMessageIndex] = result[lastMessageIndex].trimEnd() + ' ' + message;
            stats.joinedMessages++;
          } else {
            result.push(message);
            lastMessageIndex = result.length - 1;
          }
          continue;
        }
      }
      result.push(line);
      lastMessageIndex = -1;
    }
    stats.outputLines = result.length;
    return { text: result.join('\n'), stats };
  }

  root.ChatLogCleaner = { cleanLog, isNoise, stripTimestamp };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ChatLogCleaner;
})(typeof window !== 'undefined' ? window : globalThis);
