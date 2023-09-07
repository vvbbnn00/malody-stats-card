> **The First Malody Stats Card for Youngsters**

# Malody Stats Card User Guide

[中文](README_cn.md) | English

> **Warning**
>
> This project is entirely unofficial, non-profit, and open-source. If any infringement or violations are found in this project, please contact me. Thank you!

The Malody Stats Card offers a simple way to display a Malody user's game data card. You can directly embed it into your blog, website, or any other desired location.

## Examples

Here are some examples of using the Malody Stats Card:

### Default Card

[![Malody Stats Card](https://malody-stat-card.bzpl.tech/card/default/178813)](http://m.mugzone.net/accounts/user/178813)

### Custom Hide Mode

By using the `hide` parameter, you can choose to hide certain modes. For instance, the link below hides modes 4, 5, 8, and 9.

[![Malody Stats Card](https://malody-stat-card.bzpl.tech/card/default/178813?hide=4,5,8,9)](http://m.mugzone.net/accounts/user/178813)

## Usage

To use the Malody Stats Card in your project, just embed the code snippet below into your Markdown or HTML file, replacing `[UID]` with the user ID you wish to display. For guidance on obtaining the user's `[UID]`, see [How to Obtain User UID](#how-to-obtain-user-uid).

### Markdown Code

```markdown
[![Malody Stats Card](https://malody-stat-card.bzpl.tech/card/default/[UID])](http://m.mugzone.net/accounts/user/[UID])
```

### HTML Code

```html
<a href="http://m.mugzone.net/accounts/user/[UID]">
    <img src="https://malody-stat-card.bzpl.tech/card/default/[UID]" alt="Malody Stats Card">
</a>
```

## Parameters

The following parameters are currently supported:

- `hide`: Choose the modes to hide. For instance, `hide=4,5` will hide the statistics for modes 4 and 5.

To set parameters, you can add a `?` to the end of the link, followed by the parameters. For example:

```text
https://malody-stat-card.bzpl.tech/card/default/[UID]?hide=4,5
```

## How to Obtain User UID

1. Visit the official Malody community site: [http://m.mugzone.net/index](http://m.mugzone.net/index)
2. Click the login button in the top right corner to log into your account.
3. Once logged in, click on your profile picture in the top right corner to enter your personal page.
4. In the address bar of the personal page, you will see an address like `http://m.mugzone.net/accounts/user/xxxxx`.
5. The `xxxxx` is your UID.

## Private Deployment

> **Warning**
>
> When querying a user, it will simulate game login. To prevent affecting your gaming experience, it's recommended that you create a dedicated account for this purpose and not use your main account.

If you want to deploy the Malody Stats Card on your own server, you can use the following methods:

### Using Docker-Compose

1. Clone this repository to your server.
2. Create a `.env` file in the project root directory with the following content:
    ```env
    uid=
    username=
    password=
    ```
   Here, `uid` is your Malody user UID, and `username` and `password` are your Malody username and password.
3. Run the command `docker-compose up -d` in the project root directory and wait for the deployment to finish.
4. Visit `http://localhost:3000/card/default/[UID]`, where `localhost` is your server address and `[UID]` is your Malody user UID.
5. If you wish to change the port number, modify the `ports` parameter in the `docker-compose.yml` file.
6. Enjoy it!

### Direct Execution

1. Clone this repository to your server.
2. Create a `.env` file in the project root directory with the following content:
    ```env
    uid=
    username=
    password=
    ```
   Here, `uid` is your Malody user UID, and `username` and `password` are your Malody username and password.
3. Run the command `npm install` in the project root directory and wait for the dependencies to install.
4. Run the command `npm run start` in the project root directory. The project will run at `http://localhost:3000`.
5. Visit `http://localhost:3000/card/default/[UID]`, where `localhost` is your server address and `[UID]` is your Malody user UID.
6. If you wish to change the port number, add a `PORT` parameter to the `.env` file.

## License
This project is licensed under the MIT License. More information can be found in the [LICENSE](LICENSE) file.

## Acknowledgements
- [Malody](https://m.mugzone.net/)
- [flagicons](https://github.com/lipis/flag-icons)
- [github-readme-stats](https://github.com/anuraghazra/github-readme-stats)
- [ChatGPT](https://chat.openai.com)