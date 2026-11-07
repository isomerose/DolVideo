# 돌잔치 영상 도구

Node.js 20 이상, FFmpeg 및 Playwright Chromium이 필요합니다. 설치 후 실행 중에는 외부 네트워크를 사용하지 않습니다.

```powershell
npm.cmd install
npx.cmd playwright install chromium
npm.cmd run preview -- --photos "G:\사진" --template travel-scrapbook --data example.json
npm.cmd run render -- --photos "G:\사진" --template travel-scrapbook --data example.json --output "G:\영상\돌잔치.mp4" --ffmpeg ".\vendor\ffmpeg\ffmpeg.exe"
```

미리보기 주소를 브라우저에서 열고 재생, 정지, 탐색할 수 있습니다. 종료는 Ctrl+C입니다. `--bgm 음악파일`을 추가하면 반복 및 트리밍합니다. 사진은 파일명 순서이며 JPG, PNG, WebP를 지원합니다. 입력 JSON의 초점은 0~1, 자막 위치는 화면의 0~100% 좌표입니다. 시간은 초 단위이며 자막 종료 시각은 포함하지 않습니다. 자막·초점 예제는 `example.json`을 참고하세요.

`templates/<id>/manifest.json`은 해상도(width/height, 짝수), fps, photoDuration, transition.duration, background, fontFamily, title 색상과 크기, zoom, bgm을 정의합니다. `template.html`과 `templates/shared/` CSS 및 JS를 수정하고 브라우저를 새로고침하세요. manifest나 입력 JSON 변경 시 미리보기 서버를 다시 시작해야 합니다. 템플릿은 `window.video`의 `ready` Promise, `renderAt(seconds)`, `durationSeconds`를 제공해야 합니다. 사진 분석은 입력 JSON의 focus를 만드는 별도 단계로 연결할 수 있습니다. CSS 애니메이션을 사용하지 말고 paused GSAP 타임라인을 seek하세요.

작업 중 프레임은 `.work`에 저장되고 완료·실패·Ctrl+C 시 삭제됩니다. 갑작스러운 프로세스 강제 종료나 전원 차단 후에는 수동 정리가 필요할 수 있습니다.

## 사진과 동영상

사진과 MP4(H.264), WebM을 같은 폴더에 넣으면 이름순으로 섞어 표시합니다. Chromium이 지원하는 코덱만 재생됩니다. 각 동영상은 사진과 같은 장면 길이로 표시되며, 영상이 더 짧으면 마지막 프레임에 멈춥니다. 원본 동영상의 소리는 출력하지 않으며 BGM만 지원합니다. `clips`에서 파일별 시작 초를 지정합니다. `focus`는 사진과 동영상 모두에 적용됩니다. 예시는 `example.json`을 참고하세요.

## Codex 분석 (선택 사항)

`npm.cmd run analyze -- --photos "사진폴더경로" --output analysis.json --ffmpeg "FFmpeg경로"`는 Codex CLI 로그인과 네트워크가 필요합니다. 각 사진과 동영상에서 5초 간격으로 추출한 최대 12장의 축소 프레임을 Codex 서비스에 전달합니다. 개인정보가 포함될 수 있으므로 전송에 동의한 자료에만 사용하세요. 결과의 `focus`와 `clips`는 추정값이므로 확인하고 수정한 뒤 `--data analysis.json`으로 사용하세요. 장면 선택은 시각적 추정이며, 소리나 더 긴 영상의 뒷부분은 분석하지 않습니다. 앱의 미리보기와 출력 자체는 여전히 오프라인으로 실행됩니다.
