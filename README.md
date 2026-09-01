# 타임어택 PWA

GitHub Pages 업로드용 빌드입니다.

## 배포
1. GitHub에서 새 저장소를 만듭니다.
2. 이 폴더 안 파일 전체를 저장소 최상위(root)에 업로드합니다.
3. 저장소의 Settings → Pages로 이동합니다.
4. Build and deployment의 Source를 `Deploy from a branch`로 선택합니다.
5. Branch를 `main`, Folder를 `/(root)`로 선택하고 Save 합니다.
6. 생성된 GitHub Pages 주소로 접속합니다.

## 중요
- GitHub Pages는 정적 호스팅이라 Netlify Functions는 실행되지 않습니다.
- 서버시간 API 호출 실패 시 앱은 브라우저 시간 fallback을 사용합니다.
- Google Calendar OAuth를 사용할 경우 Authorized JavaScript origins에 실제 GitHub Pages origin을 추가해야 합니다.
- `essential;` BGM은 YouTube 외부 임베드 허용 및 인터넷 연결이 필요합니다.
