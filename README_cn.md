> **年轻人的第一款Malody状态卡片**

# Malody Stats Card 使用说明文档

中文 | [English](README.md)

> **Warning**
>
> 该项目是完全非官方、非盈利的开源项目，若该项目存在任何侵权、违规行为，请与我联系，谢谢！


Malody Stats Card 提供了一个简易的方法来显示 Malody 用户的游戏数据卡片。你可以直接将其嵌入到你的博客、网站或其他需要的地方。

## 示例

以下是一些使用 Malody Stats Card 的示例：

### 默认卡片

[![Malody Stats Card](https://malody-stat-card.bzpl.tech/card/default/178813)](http://m.mugzone.net/accounts/user/178813)

### 自定义隐藏模式

使用 `hide` 参数可以选择隐藏某些模式。例如，以下链接隐藏了4,5,8和9模式。

[![Malody Stats Card](https://malody-stat-card.bzpl.tech/card/default/178813?hide=4,5,8,9)](http://m.mugzone.net/accounts/user/178813)

## 使用方法

想要在你的项目中使用 Malody Stats Card，你只需将下面的代码段嵌入到你的 Markdown 
文件或 HTML 文件中，并替换 `[UID]` 为你想展示的用户 ID。关于获取用户`[UID]`的方法，
请见[如何获取用户 UID](#如何获取用户-UID)。

### Markdown 代码

```markdown
[![Malody Stats Card](https://malody-stat-card.bzpl.tech/card/default/[UID])](http://m.mugzone.net/accounts/user/[UID])
```

### HTML 代码

```html
<a href="http://m.mugzone.net/accounts/user/[UID]">
    <img src="https://malody-stat-card.bzpl.tech/card/default/[UID]" alt="Malody Stats Card">
</a>
```

## 参数

目前支持以下参数：

- `hide`: 选择隐藏的模式。例如 `hide=4,5` 会隐藏4和5模式的统计数据。

若您想要设置参数，可以在链接后面加上 `?`，然后在 `?` 后面添加参数。例如：

```text
https://malody-stat-card.bzpl.tech/card/default/[UID]?hide=4,5
```

## 如何获取用户 UID

1. 访问Malody社区官网：[http://m.mugzone.net/index](http://m.mugzone.net/index)
2. 点击右上角的登录按钮，登录你的账号。
3. 登录成功后，点击右上角的头像，进入个人主页。
4. 在个人主页的地址栏中，可以看到类似 `http://m.mugzone.net/accounts/user/xxxxx` 的地址，
5. 其中的 `xxxxx` 就是你的 UID。

## 私有化部署

> **Warning**
> 
> 查询用户时会模拟登录游戏，为了防止影响您的游戏体验，建议您在使用时新建一个专用的账号，不要使用自己的主账号。

如果你想要在自己的服务器上部署 Malody Stats Card，你可以使用以下方法：

### 使用 Docker-Copmose

1. 克隆本仓库到你的服务器上。
2. 在项目根目录下创建一个名为 `.env` 的文件，内容如下：
    ```env
    uid=
    username=
    password=
    ```
    其中，`uid` 为你的 Malody 用户 UID，`username` 和 `password` 为你的 Malody 用户名和密码。
3. 在项目根目录下运行 `docker-compose up -d` 命令，等待部署完成。
4. 访问 `http://localhost:3000/card/default/[UID]` ，其中 `localhost` 为你的服务器地址，`[UID]`
为你的 Malody 用户 UID。
5. 如果你想要修改端口号，可以在 `docker-compose.yml` 文件中修改 `ports` 参数。
6. Enjoy it!

### 直接运行

1. 克隆本仓库到你的服务器上。
2. 在项目根目录下创建一个名为 `.env` 的文件，内容如下：
    ```env
    uid=
    username=
    password=
    ```
    其中，`uid` 为你的 Malody 用户 UID，`username` 和 `password` 为你的 Malody 用户名和密码。
3. 在项目根目录下运行 `npm install` 命令，等待依赖安装完成。
4. 在项目根目录下运行 `npm run start` 命令，项目将会运行在 `http://localhost:3000` 上。
5. 访问 `http://localhost:3000/card/default/[UID]` ，其中 `localhost` 为你的服务器地址，`[UID]`
为你的 Malody 用户 UID。
6. 若你想要修改端口号，可以在 `.env` 文件中新增 `PORT` 参数。

## 协议
本项目使用 MIT 协议进行许可。你可以在 [LICENSE](LICENSE) 文件中找到更多信息。

## 致谢
- [Malody](https://m.mugzone.net/)
- [flagicons](https://github.com/lipis/flag-icons)
- [github-readme-stats](https://github.com/anuraghazra/github-readme-stats)
- [ChatGPT](https://chat.openai.com)