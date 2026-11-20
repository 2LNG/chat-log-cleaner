(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const fileInput = $('file-input');
  const dropZone = $('drop-zone');
  const previewLimit = 12000;
  let originalText = null;
  let originalFilename = '';
  let outputText = '';
  let candidates = [];
  let selectedSpeakers = new Set();

  function setStatus(message, error) {
    $('status').textContent = message;
    $('status').classList.toggle('error', Boolean(error));
  }

  function niceSize(bytes) {
    return bytes < 1024 ? bytes + ' B' : bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function displayPreview(element, text) {
    element.classList.remove('empty');
    element.textContent = text.length > previewLimit ? text.slice(0, previewLimit) + '\n\n… (미리보기는 앞부분만 표시됩니다. 다운로드 파일에는 전체가 포함됩니다.)' : text || '(내용 없음)';
  }

  function getSettings() {
    return {
      removeTime: $('opt-time').checked,
      removeRepeat: $('opt-repeat').checked,
      removeBlank: $('opt-blank').checked,
      groupSpeakers: $('opt-group').checked,
      joinConsecutive: $('opt-join').checked,
      limitRepeats: $('opt-limit-repeats').checked,
      minRepeat: Number($('repeat-min').value),
      selectedSpeakers: Array.from(selectedSpeakers)
    };
  }

  function renderSpeakerChoices() {
    const wrap = $('speaker-candidates');
    wrap.replaceChildren();
    const selectedCount = selectedSpeakers.size;
    $('speaker-summary').textContent = originalText === null
      ? 'TXT 파일을 선택하면 화자 후보가 표시됩니다'
      : !candidates.length ? '화자 후보를 찾지 못했습니다'
      : `화자 선택 (${selectedCount}명 / 후보 ${candidates.length}명)`;
    $('speaker-hint').textContent = originalText === null
      ? '실제 화자를 선택해야 [이름] 묶기와 메시지 필터링이 적용됩니다.'
      : selectedCount ? '선택한 화자의 메시지만 화자 구역으로 묶습니다. 다른 텍스트는 그대로 둡니다.'
      : '화자를 한 명 이상 선택하세요. 선택 전에는 화자 묶기와 반복 메시지 삭제가 적용되지 않습니다.';
    for (const candidate of candidates) {
      const label = document.createElement('label');
      label.className = 'speaker-choice';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = selectedSpeakers.has(candidate.name);
      checkbox.setAttribute('aria-label', candidate.name + ' 선택');
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) selectedSpeakers.add(candidate.name);
        else selectedSpeakers.delete(candidate.name);
        renderSpeakerChoices();
        refresh();
      });
      const name = document.createElement('span');
      name.className = 'speaker-name';
      name.textContent = candidate.name;
      const count = document.createElement('span');
      count.className = 'candidate-count';
      count.textContent = candidate.count.toLocaleString('ko-KR') + '회';
      label.append(checkbox, name, count);
      wrap.appendChild(label);
    }
  }
  $('speaker-select-all').addEventListener('click', () => {
    selectedSpeakers = new Set(candidates.map(candidate => candidate.name));
    renderSpeakerChoices(); refresh();
  });
  $('speaker-select-none').addEventListener('click', () => {
    selectedSpeakers.clear(); renderSpeakerChoices(); refresh();
  });

  function refresh() {
    $('threshold-area').classList.toggle('muted', !$('opt-repeat').checked);
    $('join-option').classList.toggle('muted', !$('opt-group').checked);
    $('opt-join').disabled = !$('opt-group').checked;
    $('repeat-min').disabled = !$('opt-repeat').checked;
    if (originalText === null) return;
    const cleaned = window.ChatLogCleaner.cleanLog(originalText, getSettings());
    outputText = cleaned.text;
    const stats = cleaned.stats;
    displayPreview($('before-preview'), originalText);
    displayPreview($('after-preview'), outputText);
    $('before-count').textContent = stats.originalLines.toLocaleString('ko-KR') + '줄';
    $('after-count').textContent = stats.outputLines.toLocaleString('ko-KR') + '줄';
    $('counts').textContent = '시간 표시 ' + stats.removedTimestamps.toLocaleString('ko-KR') + '개 제거 · 반복 메시지 ' + stats.removedNoise.toLocaleString('ko-KR') + '개 삭제 · 화자 구역 ' + stats.speakerGroups.toLocaleString('ko-KR') + '개 · 메시지 합침 ' + stats.joinedMessages.toLocaleString('ko-KR') + '개 · 빈 줄 ' + stats.removedEmpty.toLocaleString('ko-KR') + '개 삭제';
    $('download').disabled = false;
    setStatus('옵션을 변경하면 미리보기가 즉시 갱신됩니다.');
  }

  async function openFile(file) {
    if (!file) return;
    if (!/\.txt$/i.test(file.name) && file.type !== 'text/plain') {
      setStatus('TXT 형식의 파일을 선택해 주세요.', true);
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setStatus('파일이 너무 큽니다. 30MB 이하의 TXT 파일을 선택해 주세요.', true);
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      let decoded;
      try { decoded = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
      catch (_) { decoded = new TextDecoder('euc-kr').decode(buffer); }
      originalText = decoded;
      candidates = window.ChatLogCleaner.findSpeakerCandidates(decoded);
      selectedSpeakers.clear(); // Explicit opt-in avoids interpreting body text as speakers.
      renderSpeakerChoices();
      originalFilename = file.name;
      $('file-name').textContent = file.name;
      $('file-size').textContent = niceSize(file.size);
      $('file-detail').hidden = false;
      dropZone.classList.add('has-file');
      refresh();
    } catch (error) {
      setStatus('파일을 읽지 못했습니다. 다른 TXT 파일로 다시 시도해 주세요.', true);
    }
  }

  renderSpeakerChoices();
  $('choose-file').addEventListener('click', (event) => { event.stopPropagation(); fileInput.click(); });
  $('change-file').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { openFile(fileInput.files[0]); fileInput.value = ''; });
  dropZone.addEventListener('click', (event) => { if (event.target.closest('button')) return; fileInput.click(); });
  dropZone.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInput.click(); } });
  for (const eventName of ['dragenter', 'dragover']) {
    dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.add('dragging'); });
  }
  for (const eventName of ['dragleave', 'drop']) {
    dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.remove('dragging'); });
  }
  dropZone.addEventListener('drop', (event) => openFile(event.dataTransfer.files[0]));
  for (const id of ['opt-time', 'opt-repeat', 'opt-blank', 'opt-group', 'opt-join', 'opt-limit-repeats', 'repeat-min']) $(id).addEventListener('change', refresh);

  $('download').addEventListener('click', () => {
    if (originalText === null) return;
    const blob = new Blob(['\uFEFF', outputText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = originalFilename.replace(/\.txt$/i, '') + '_정리.txt';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('정리된 TXT 파일의 다운로드를 시작했습니다.');
  });
})();
