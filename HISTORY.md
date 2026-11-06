# 저장소 통합 기록 · 2026-11-07

세 프로젝트를 squash 없이 subtree 병합해 원본 커밋 이력을 보존했습니다.

| 소스 | 이 폴더로 가져온 마지막 커밋 | 현재 위치 |
| --- | --- | --- |
| snowy-winter-village | `73d2cf8d8baaa08146593b42eed783a0b6883e61` | `winter/` |
| little-blue-aquarium | `a77c496842bb4af37874859630f381c35c0ff30c` | `aquarium/` |
| little-lantern-library | `c8b4aa17c8cc217c442fb0d28a465f9ca0c8187d` | `library/` |

세 커밋이 현재 저장소의 조상인지 확인했습니다. 원본 저장소의 전체 ref를 포함한 Git bundle 복구 사본도 로컬에 만들고 검증했습니다. 원본 세 저장소에는 main 외 다른 원격 브랜치·태그, 이슈·PR·릴리스가 없는 것을 확인했습니다.

배포 경로를 `/my-little-village/`, `/my-little-village/aquarium/`, `/my-little-village/library/`로 모았습니다. 기존 Firebase 방 식별자, 브라우저 저장 키와 데이터베이스 보안 규칙은 바꾸지 않았습니다.
