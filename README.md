# 대화 로그 정리기

카카오톡 TXT 대화 내역에서 날짜·시간 접두사를 제거하고, 의미 없는 한글 자모 반복 메시지를 걸러내고, 연속된 같은 화자의 발화를 묶는 **서버 없는 정적 웹사이트**입니다.

## 사용 방법

1. `index.html`을 브라우저에서 열거나 GitHub Pages 주소에 접속합니다.
2. `.txt` 파일을 업로드합니다 (끌어다 놓기 가능).
3. 시간 표시 제거 / 반복 메시지 제거 / 화자별 대화 묶기 / 빈 줄 제거 옵션을 선택합니다.
4. 정리 전후 미리보기를 확인하고 **정리된 TXT 다운로드**를 누릅니다.

모든 처리는 브라우저의 JavaScript로 수행됩니다. 파일이나 대화 내용은 서버로 업로드되지 않습니다. 외부 스크립트·분석 도구도 사용하지 않습니다. UTF-8 및 CP949(EUC-KR) 형식을 지원하며, 최대 30MB까지 처리합니다.

## GitHub Pages 배포

1. GitHub에서 **Public** 저장소를 새로 만듭니다 (예: `chat-log-cleaner`).
2. 이 폴더의 `index.html`, `styles.css`, `cleaner.js`, `app.js` 파일을 저장소 **루트**에 업로드합니다.
3. 저장소의 **Settings → Pages → Build and deployment** 에서 **Deploy from a branch**를 선택합니다.
4. Branch를 `main`, Folder를 `/(root)`로 정하고 **Save**를 누릅니다.
5. 배포가 완료되면 `https://사용자이름.github.io/chat-log-cleaner/` 로 접속할 수 있습니다.

GitHub Pages는 사이트 파일 자체를 공개하지만 업로드된 대화 내용은 공개하지 않습니다. **실제 대화 TXT 파일을 GitHub 저장소에 올리지 마세요.**


## 라이선스

MIT
