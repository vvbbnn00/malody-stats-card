> **Malody 玩家动画 SVG 状态卡片**

# Malody Stats Card 使用说明

中文 | [English](README.md)

> **提示**
>
> 本项目为非官方、非盈利的开源项目。如有侵权或不合适的内容，请联系维护者处理。

Malody Stats Card 可以把 Malody 玩家的资料渲染成一张可嵌入博客、主页或面板的动画 SVG 卡片。

当前支持两种数据提供方：

- `legacy`：默认模式，使用旧版 Malody 社区接口，需要在 `.env` 中提供账号密码
- `web-v2-experimental`：实验模式，使用新版 `malody.mugzone.net` 网页 API 的游客会话

> **动画说明**
>
> 卡片是动画 SVG。部分平台的缩略图或预览器只会截取第一帧，所以建议直接在浏览器中打开 SVG 来确认显示效果。

## 功能概览

- 动画 SVG 状态卡片
- JSON 资料接口，便于联调和集成
- 按 provider 隔离缓存，避免 `legacy` 和 `web-v2-experimental` 相互覆盖
- 自动缓存 schema 迁移，并在首次迁移时创建备份
- 已覆盖现有功能和实验功能的自动化测试

## 接口列表

| 用途 | Endpoint | 说明 |
| --- | --- | --- |
| 旧版资料 JSON | `/profile?uid=[UID]` | 默认 provider |
| 旧版卡片 SVG | `/card/default/[UID]` | 动画 SVG |
| 实验版资料 JSON | `/profile?uid=[UID]&provider=web-v2-experimental` | 新版网页 API 归一化后的结构 |
| 实验版卡片 SVG | `/card/default/[UID]?provider=web-v2-experimental` | 仍使用当前卡片渲染器 |
| 实验版资料快捷入口 | `/experimental/profile?uid=[UID]` | 等价于实验 provider |
| 实验版卡片快捷入口 | `/experimental/card/default/[UID]` | 等价于实验 provider |

## 查询参数

| 参数 | 适用接口 | 说明 |
| --- | --- | --- |
| `uid` | `/profile`、`/experimental/profile` | Malody 用户 ID |
| `hide` | 卡片接口 | 逗号分隔的模式列表，例如 `hide=4,5` |
| `provider` | `/profile`、`/card/default/[UID]` | 当前支持 `legacy` 和 `web-v2-experimental` |

当前卡片渲染器会识别这些模式 ID：`0`、`3`、`4`、`5`、`6`、`7`、`8`、`9`。非法的 `hide` 参数会被自动忽略。

## 响应头

| Header | 含义 |
| --- | --- |
| `X-Cache` | 卡片接口的缓存命中状态，值为 `HIT` 或 `MISS` |
| `X-Malody-Provider` | 本次响应使用的数据提供方 |
| `X-Malody-Experimental` | 实验接口会返回 `true` |

## 本地测试 URL

假设服务运行在 `http://127.0.0.1:3000`，可以直接测试这些地址：

- 旧版资料 JSON：[http://127.0.0.1:3000/profile?uid=178813](http://127.0.0.1:3000/profile?uid=178813)
- 旧版卡片 SVG：[http://127.0.0.1:3000/card/default/178813](http://127.0.0.1:3000/card/default/178813)
- 旧版卡片隐藏部分模式：[http://127.0.0.1:3000/card/default/178813?hide=4,5,8,9](http://127.0.0.1:3000/card/default/178813?hide=4,5,8,9)
- 实验版资料 JSON：[http://127.0.0.1:3000/profile?uid=178813&provider=web-v2-experimental](http://127.0.0.1:3000/profile?uid=178813&provider=web-v2-experimental)
- 实验版资料快捷入口：[http://127.0.0.1:3000/experimental/profile?uid=178813](http://127.0.0.1:3000/experimental/profile?uid=178813)
- 实验版卡片 SVG：[http://127.0.0.1:3000/experimental/card/default/178813](http://127.0.0.1:3000/experimental/card/default/178813)
- 非法 provider 示例：[http://127.0.0.1:3000/profile?uid=178813&provider=future](http://127.0.0.1:3000/profile?uid=178813&provider=future)

如果你想直接看响应头，可以使用：

```bash
curl -i "http://127.0.0.1:3000/card/default/178813"
curl -i "http://127.0.0.1:3000/profile?uid=178813&provider=web-v2-experimental"
curl -i "http://127.0.0.1:3000/experimental/card/default/178813"
```

## 嵌入方式

请把 `https://your-host.example.com` 和 `[UID]` 替换成你自己的地址和用户 ID。

### Markdown

```markdown
[![Malody Stats Card](https://your-host.example.com/card/default/[UID])](https://malody.mugzone.net/player/[UID])
```

### HTML

```html
<a href="https://malody.mugzone.net/player/[UID]">
    <img src="https://your-host.example.com/card/default/[UID]" alt="Malody Stats Card">
</a>
```

### 实验版 provider 示例

```markdown
[![Malody Stats Card](https://your-host.example.com/card/default/[UID]?provider=web-v2-experimental)](https://malody.mugzone.net/player/[UID])
```

## Provider 说明

### `legacy`

- `/profile` 和 `/card/default/[UID]` 的默认行为
- 使用旧版 Malody 接口
- 必须在 `.env` 中提供账号密码
- 更适合作为当前项目中的默认稳定方案

### `web-v2-experimental`

- 使用新版 `https://malody.mugzone.net/` 网页 API 的游客访问能力
- 基础资料拉取不依赖账号密码
- 返回结构会被归一化，保证现有卡片渲染器仍可使用
- 明确标记为实验功能，上游一旦改版可能需要再次适配

## 如何获取 UID

当前公开玩家页的地址形式为：

```text
https://malody.mugzone.net/player/[UID]
```

打开玩家主页后，复制 URL 中的数字 ID 即可。

## 私有化部署

### 方式一：Docker Compose

1. 克隆本仓库。
2. 如果要使用默认的 `legacy` provider，请在项目根目录创建 `.env`：

   ```env
   uid=
   username=
   password=
   PORT=3000
   ```

3. 启动服务：

   ```bash
   docker compose up -d
   ```

4. 打开 `http://localhost:3000/card/default/[UID]`。

仓库中的 Compose 文件名是 [`docker-compose.yaml`](docker-compose.yaml)。
容器会在运行时读取 `.env`，该文件不会被打进镜像。
资料缓存和图片缓存会通过挂载的 `database/` 与 `cache/` 目录持久化。

### 方式二：直接运行

1. 克隆本仓库。
2. 安装依赖：

   ```bash
   npm install
   ```

3. 如果要使用默认的 `legacy` provider，请创建 `.env`：

   ```env
   uid=
   username=
   password=
   PORT=3000
   ```

   如果你只测试 `web-v2-experimental`，可以不填写 legacy 账号密码。

4. 启动服务：

   ```bash
   npm run start
   ```

5. 打开 `http://localhost:3000/card/default/[UID]`。

## 缓存、存储与迁移

- 资料和 token 缓存存放在 `database/malody.db`
- 图片缓存存放在 `cache/`
- 数据存储带有 schema version
- 从旧缓存结构首次迁移时，会自动生成 `database/malody.db.bak-v1`
- 不同 provider 的缓存记录相互隔离，不会互相覆盖

默认情况下，资料缓存和图片缓存的有效期都是 2 小时。

## 测试

运行自动化测试：

```bash
npm test
```

当前测试覆盖了：

- 基础路由行为
- 非法参数处理
- 卡片接口缓存头
- 实验 provider 路由分发
- 新版网页 API 数据归一化
- 数据库迁移与 provider 隔离

## 协议

本项目基于 MIT License。详见 [LICENSE](LICENSE)。

## 致谢

- [Malody](https://malody.mugzone.net/)
- [flagicons](https://github.com/lipis/flag-icons)
- [github-readme-stats](https://github.com/anuraghazra/github-readme-stats)
