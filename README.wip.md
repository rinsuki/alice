# Project Alice

trying to create yet another ActivityPub server (highly experimental, dont expect to be completed)

WARNING: **CURRENTLY THIS PROJECT IS NOT SUITABLE FOR PRODUCTION USE**. this project is still stated as experimental, and it might be gave up to migrates exists data in the future, so HIGHLY NOT RECOMMEND TO RUNNING ON PUBLIC ENVIRONMENT. If you really want to run it on public internet, recommend to run on droppable (sub)domains, like `alice01.lab.example.com` instead of `alice.example.com`

## Target

- small amount users (~ 100 users, just server owner and some bots/friends)
- low resource usage (it should be works on 512MB RAM (and maybe some swaps needed), except build phase)
- server administrator have a some technical skills (e.g. can read/write TypeScript + Node.js project that uses TypeORM and PostgreSQL)

## Supported Environments

- Client:
  - Latest Firefox ESR
    - but actually tested on Firefox Nightly instead; feel free to open issues if not working on latest Firefox ESR
- Server:
  - Kubernetes (containerd.io backend) or Docker
    - Other than x86_64 or aarch64 Linux (e.g. RISC-V, Windows, etc...) is currently not supported
    - rootless container is not supported, but _might be_ works
  - PostgreSQL 15.x
  - 512GB or more RAM (with some swaps)
- Develop:
  - x86_64 or aarch64 machine
  - Linux or macOS
    - Windows? i dont know
  - Node.js 18.x or later

## サポートする/しないもの 

### サポートするもの

- [ ] Mastodon にある機能 (のほとんど)
- [ ] ActivityPub+α (WebFinger, etc...) を実装しているサーバーとの通信
  - 想定している対象: Mastodon, Misskey, notestock
- [ ] Mastodon 互換 API (`/api/v[12]/*`)
  - 想定しているクライアント: iMast, SubwayTooter
- [ ] 複数回のブースト
  - TODO: `/api/v1/statuses/:id/unreblog` どうするのか
- [ ] 引用ブースト
  - 対応していないサーバー (e.g. 本家Mastodon) の互換のために通常ブーストもAPに乗せる
  - REST API は Fedibird 互換にする
  - ActivityPub は Fedibird や Misskey と互換があるようにする
- [ ] 外部サーバーの outbox を読む (過去の鍵投稿とか見たい)
  - インターフェースは要検討… outbox を /vX/search する？

### サポートする _かも_ しれないもの

期待しないでください！

- [ ] キーワード通知 (Misskeyのアンテナみたいな)
  - リストに追加でもいいか？
- [ ] もっといいフィルター (e.g. 特定のユーザーが特定の単語を使った場合のみ非表示)
  - Mastodon API との互換をどうするのか
- [ ] リモートサーバーの絵文字 `:amogus@mastodon.social:`
- [ ] Mastodon からの DB 移行
  - できるのか？

### 今のところサポートする気がないもの

- リンクのOGPの取得/表示
  - Project Alice 自体はHTMLにOGP情報を付与する
  - ActivityPub で外部から来た投稿にOGP情報が埋め込まれていることがあったら考えてもいいかも
- リレーへの参加
- 絵文字リアクション
- Tor/I2P のサーバーへの対応

## サポートしないもの

- isCat (Misskey)
- パブリック登録


## Special Thanks

- Mastodon https://github.com/mastodon/mastodon
- Misskey https://github.com/misskey-dev/misskey