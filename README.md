# Роли в команде — короткий опрос

Статическая страница: 7 блоков по 10 баллов, распределение по утверждениям и сумма по 8 ролям; результат можно отправить в WhatsApp.

## Сайт

**https://cooldcoolt.github.io/belbin/**

## Деплой (GitHub Pages)

1. Один раз: **Settings → Pages → Build and deployment → Source** — ветка **`gh-pages`**, папка **`/ (root)`**. После первого успешного запуска Actions ветка `gh-pages` появится сама.
2. Каждый пуш в **`main`** обновляет сайт (workflow **Deploy to GitHub Pages**). Статус: вкладка **Actions**.

Локально: `python3 -m http.server 8080` в корне проекта.
