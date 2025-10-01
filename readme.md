> [!TIP]
> Проект выполнен в рамках двух лабораторных работ по предмету "Web-разработка". Вариант 2.

<div align="center">
  <h1>
    <img alt="logo" src="./img/logo.png" height="30" width="30"/>
    FileManager
  </h1>
</div>
Приложение представляет собой файловый менеджер некоторого облачного
хранилища.

![user home +.png](img/user%20home%20%2B.png)

## Функционал

| Client (Frontend)                                                                      | Server (Backend)                                |
|----------------------------------------------------------------------------------------|-------------------------------------------------|
| [На главной странице отображается список файлов и папок корня хранилища](list-files)   | [REST API - Swagger-документация](rest-api)     |
| [Пользователь может открыть страницу папки и посмотреть её содержимое](finder-display) | API проверяет правильность ввода входных данных |
| [Поиск папок и файлов](search-files_finder)                                            | Фильтрация и поиск объектов                     |
| [Фильтрация файлов](type-file)                                                         | [SQL — PostgreSQL](docker-sql)                  |
| [Реализован виджет просмотра файла](widget-file)                                       | Разграничение хранилища между admin и user      |
| [Редактирование текстовых файлов с сохранением на сервере](edit-file)                  | Хеширование паролей в SQL                       |
| [Страница входа](login-user)                                                           | Bearer-токены                                   |
| [Панель администратора](admin-panel)                                                   |                                                 |
| [Переключение дневной и ночной темы](theme)                                            |                                                 |
| [Drag-and-drop](drop)                                                                  |                                                 |
| [Отображение файлов сеткой или списком](grid-list)                                     |                                                 |
| [Перемещение файла в папку перетаскиванием](move-drop)                                 |                                                 |

### Client (Frontend)
<a id="list-files"></a>
#### Отображения списка файлов и папок корня хранилища
![list-files.png](img/screenshot/list-files.png)

<a id="finder-display"></a>
#### Открытие папки и просмотр ее содержимого
![finder-display.gif](img/gif/finder-display.gif)

<a id="search-files_finder"></a>
#### Поиск папок и файлов
![search-files_finder.gif](img/gif/search-files_finder.gif)

<a id="type-file"></a>
#### Фильтрация файлов
![type-file.gif](img/gif/type-file.gif)

<a id="widget-file"></a>
#### Виджет просмотра файла
![widget-file.gif](img/gif/widget-file.gif)

<a id="edit-file"></a>
#### Редактирование текстовых файлов
![edit-file.gif](img/gif/edit-file.gif)

<a id="login-user"></a>
#### Страница входа
![login-user.gif](img/gif/login-user.gif)

<a id="admin-panel"></a>
#### Панель администратора
![admin-panel.png](img/screenshot/admin-panel.png)

<a id="theme"></a>
#### Темы
![theme.gif](img/gif/theme.gif)

<a id="drop"></a>
#### Drag-and-drop
![drop.gif](img/gif/drop.gif)

<a id="grid-list"></a>
#### Отображение файлов сеткой или списком
![grid-list.gif](img/gif/grid-list.gif)

<a id="move-drop"></a>
#### Перемещение файла в папку перетаскиванием
![move-drop.gif](img/gif/move-drop.gif)

### Server (Backend)
<a id="rest-api"></a>
#### Swagger-документация (REST-API)
![rest-api.gif](img/gif/rest-api.gif)

<a id="docker-sql"></a>
#### SQL — PostgreSQL
![docker-sql.png](img/screenshot/docker-sql.png)