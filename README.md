# My Little Village

친구와 천천히 놀 수 있는 세 가지 3D 공간입니다. 소스는 [snowy-winter-village](https://github.com/seonyoungyoo16/snowy-winter-village) 하나에 모았고, 친구들에게 공유한 기존 겨울 마을 주소를 그대로 유지합니다. Three.js 기본 도형과 Firebase 익명 접속을 사용하며 경쟁·점수·AI API가 없습니다.

- [눈 내리는 겨울 마을](https://seonyoungyoo16.github.io/snowy-winter-village/): 눈사람, 모닥불, 썰매
- [물결 수족관](https://seonyoungyoo16.github.io/snowy-winter-village/aquarium/): 먹이 주기, 해파리 쉼터, 사진 찍기
- [책숲 도서관](https://seonyoungyoo16.github.io/snowy-winter-village/library/): 앉아서 책 읽기, 창밖 하늘, 완독 스탬프, 주황 고양이 귤이

처음에는 같은 **친구 초대 주소**로 접속하세요. 각 화면의 공간 이동 버튼이 같은 친구 그룹을 유지하고, 닉네임·캐릭터를 이어서 사용합니다. 다른 공간의 친구 이름과 따라가기 버튼도 표시합니다. 정상 클라이언트에서 방마다 네 명까지 만날 수 있습니다.

## 한 저장소에서 개발하기

```powershell
npm ci
npm run build
npm test
npm run preview
```

미리보기: http://127.0.0.1:4191/snowy-winter-village/library/

`winter/`, `aquarium/`, `library/`에 각 공간의 소스·검사·다운로드 HTML이 있습니다. `npm run build`가 세 공간을 함께 빌드해 GitHub Pages의 `docs/`에 모읍니다. Pages 설정은 `main` 브랜치의 `/docs`입니다. 게임별 HTML은 시각 자산과 라이브러리를 내장한 단일 파일이고 친구 연결에는 인터넷이 필요합니다.

`npm run test:live`는 기존 Firebase에 임시 익명 계정과 무작위 시험 방을 만들어 규칙·상태 공유를 확인한 뒤 자신의 시험 데이터만 정리합니다. 관리자 인증 정보는 포함하지 않습니다.

## 기록과 연결

겨울 마을의 기존 저장소에 세 프로젝트의 커밋 이력을 병합해 보존했습니다. [통합 기록](HISTORY.md)에서 가져온 시점을 확인할 수 있습니다. 별도 서브모듈이나 삭제될 저장소를 빌드 의존성으로 사용하지 않습니다.

기존 `snowyroom-8a8a5` Firebase Spark 프로젝트와 규칙을 그대로 사용합니다. 세 공간이 같은 무료 할당량을 함께 사용하며, 새 서버·유료 서비스는 추가하지 않았습니다. 공간별 방 접두어와 브라우저 저장 키를 유지해 기존 눈사람·책갈피·읽던 쪽을 이어갑니다. 실제 사용량은 Firebase 콘솔에서 확인합니다.

도서관 고양이는 공통 시각으로 생활 경로를 계산하고 교감 동작만 기존 친구 상태로 공유합니다. 고양이 용품은 왼쪽 쉼터 한곳에 모았습니다. 책 세 권은 각각 5쪽의 짧은 창작 이야기이며 수동으로 쪽을 넘깁니다. 완독 안내는 책마다 한 번 표시합니다. AstronomyAPI는 비밀키를 공개 HTML에 넣지 않도록 통합하지 않았습니다.

실제 휴대폰·Safari·Windows 알림 배너는 별도 확인 범위입니다. 각 공간의 `QA.md`에 자동 검사와 브라우저 확인 범위를 구분해 두었습니다.

코드 MIT. Three.js와 Jua 글꼴의 라이선스는 각 폴더 및 배포 HTML에도 포함되어 있습니다.
