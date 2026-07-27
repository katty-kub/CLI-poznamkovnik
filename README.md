# CLI poznámkovník

Tento projekt jsem vytvořila jako součást svého studia Node.js, Expressu a PostgreSQL.
Chtěla jsem si na jednom menším projektu vyzkoušet, jak spolu komunikuje příkazová
řádka, REST API a databáze.

```
CLI příkaz → Express REST API → PostgreSQL
```

Výsledkem je poznámkovník, který můžu ovládat přímo z terminálu. Umožňuje mi
poznámky vytvářet, zobrazovat, upravovat, mazat, vyhledávat v nich a filtrovat je
podle kategorie.

Projekt je zatím zaměřený hlavně na backend. V budoucnu k němu chci připojit také
frontend vytvořený v Reactu a TypeScriptu.

## Proč jsem tento projekt vytvořila

Nechtěla jsem se Node.js a Express učit jen z jednotlivých příkladů. Potřebovala
jsem si vyzkoušet celý postup od zadání příkazu až po uložení dat do databáze.

Na projektu jsem si procvičila hlavně:

-   Node.js a práci s argumenty z `process.argv`,

-   Express a rozdělení aplikace na routy a controllery,

-   tvorbu REST API,

-   celý CRUD,

-   `req.params`, `req.query` a `req.body`,

-   `fetch`, `async/await` a ošetření chyb,

-   parametrizované SQL dotazy,

-   připojení k PostgreSQL,

-   práci s proměnnými prostředí v `.env`,

-   integrační testy pomocí Node Test Runneru a Supertestu.

## Co aplikace umí

-   vytvořit novou poznámku,

-   zobrazit všechny poznámky,

-   zobrazit jednu poznámku podle ID,

-   upravit text nebo kategorii poznámky,

-   smazat poznámku,

-   vyhledat poznámku podle textu,

-   filtrovat poznámky podle kategorie,

-   spojit vyhledávání a filtrování,

-   ovládat API pomocí skutečných CLI příkazů,

-   vracet chyby v jednotném formátu.

## Použité technologie

-   Node.js

-   Express.js

-   PostgreSQL

-   node-postgres (`pg`)

-   dotenv

-   Nodemon

-   Node Test Runner

-   Supertest

## Co je potřeba před spuštěním

-   Node.js 18 nebo novější,

-   npm,

-   PostgreSQL,

-   volitelně rozšíření REST Client pro VS Code.

Verzi Node.js si můžu zkontrolovat příkazem:

```
node --version
```

## Instalace a spuštění krok za krokem

### 1\. Stažení projektu

Repozitář si naklonuji z GitHubu a přesunu se do jeho složky:

```
git clone
cd cli-poznamkovnik
```

Text `ODKAZ_NA_REPOZITAR` nahradím skutečným odkazem na svůj GitHub repozitář.

Pokud už mám projekt uložený v počítači, pouze si jeho složku otevřu ve VS Code
a v terminálu zkontroluji, že jsem v kořenové složce projektu.

### 2\. Instalace závislostí

Nainstaluji všechny balíčky uvedené v `package.json`:

```
npm install
```

### 3\. Vytvoření databáze

V PostgreSQL vytvořím databázi:

```
CREATE DATABASE cli_poznamkovnik;
```

Potom v této databázi spustím obsah souboru:

```
database/schema.sql
```

Z příkazové řádky můžu použít například:

```
psql -U postgres -d cli_poznamkovnik -f database/schema.sql
```

SQL soubor vytvoří tabulku `notes`:

| Sloupec | Typ | Význam |
| --- | --- | --- |
| `id` | integer | automaticky vytvořené ID a primární klíč |
| `text` | text | povinný text poznámky |
| `category` | varchar | kategorie, výchozí hodnota je `ostatni` |
| `created_at` | timestamptz | datum a čas vytvoření |

### 4\. Nastavení `.env`

Podle souboru `.env.example` vytvořím v kořenové složce vlastní soubor `.env`.

Ve Windows PowerShellu můžu použít:

```
Copy-Item .env.example .env
```

V macOS nebo Linuxu:

```
cp .env.example .env
```

Soubor `.env` potom otevřu a doplním své přístupové údaje:

```
PORT=3000
DATABASE_URL=postgresql://postgres:TVE_HESLO@localhost:5432/cli_poznamkovnik
API_URL=http://localhost:3000/api/notes
```

Text `TVE_HESLO` nahradím svým skutečným heslem k PostgreSQL.

Soubor `.env` neposílám na GitHub, protože obsahuje údaje určené pouze pro můj
počítač. Soubor `.env.example` je bezpečná ukázka toho, jaké proměnné projekt
potřebuje.

### 5\. Spuštění serveru

Pro vývojový režim s automatickým restartováním serveru používám:

```
npm run dev
```

Pro běžné spuštění:

```
npm start
```

Po správném spuštění se v terminálu zobrazí:

```
Server běží na http://localhost:3000
API poznámek: http://localhost:3000/api/notes
```

Funkčnost serveru můžu ověřit pomocí:

```
GET http://localhost:3000/api/health
```

Očekávaná odpověď:

```
{
  "status": "ok"
}
```

### 6\. Spuštění CLI

Server nechám běžet a otevřu si druhý terminál. V něm můžu vyzkoušet například:

```
npm run cli -- list
npm run cli -- add "Procvičit Express" node
npm run cli -- search "Express"
```

### 7\. Spuštění testů

Automatické testy spustím příkazem:

```
npm test
```

Stručný postup spuštění celého projektu je tedy:

```
1. npm install
2. vytvořit databázi cli_poznamkovnik
3. spustit database/schema.sql
4. vytvořit a doplnit .env
5. npm run dev
6. v druhém terminálu používat npm run cli -- ...
7. npm test
```

## REST API

| Operace | Metoda | Endpoint |
| --- | --- | --- |
| zobrazení všech poznámek | `GET` | `/api/notes` |
| zobrazení jedné poznámky | `GET` | `/api/notes/:id` |
| vytvoření poznámky | `POST` | `/api/notes` |
| částečná úprava poznámky | `PATCH` | `/api/notes/:id` |
| smazání poznámky | `DELETE` | `/api/notes/:id` |
| vyhledávání | `GET` | `/api/notes?search=express` |
| filtrování | `GET` | `/api/notes?category=node` |
| vyhledávání a filtrování | `GET` | `/api/notes?search=router&category=node` |

### Vytvoření poznámky

```
POST /api/notes
Content-Type: application/json
```

```
{
  "text": "Procvičit Express Router",
  "category": "node"
}
```

Při úspěšném vytvoření API vrátí stavový kód `201 Created`.

### Načtení poznámek

```
GET /api/notes
GET /api/notes/1
```

### Úprava poznámky

Použila jsem metodu `PATCH`, protože při úpravě nemusím posílat celou poznámku.
Posílám pouze hodnoty, které chci změnit.

```
PATCH /api/notes/1
Content-Type: application/json
```

Změna pouze textu:

```
{
  "text": "PATCH už umím"
}
```

Změna textu i kategorie:

```
{
  "text": "Procvičit controllery",
  "category": "express"
}
```

Controller sestaví SQL dotaz podle polí, která skutečně dostane. Hodnoty
nevkládám přímo do SQL řetězce, ale předávám je jako parametry `$1`, `$2` a
další. Tím snižuji riziko SQL injection.

### Smazání poznámky

```
DELETE /api/notes/1
```

### Vyhledávání a filtrování

Vyhledávání nerozlišuje velká a malá písmena a hledá zadaný text uvnitř
poznámky:

```
GET /api/notes?search=express
```

Filtrovat můžu také podle kategorie:

```
GET /api/notes?category=node
```

Obě možnosti lze spojit:

```
GET /api/notes?search=router&category=node
```

## Ovládání pomocí CLI

V prvním terminálu musí běžet server:

```
npm run dev
```

Ve druhém terminálu můžu zadávat příkazy:

```
npm run cli -- list
npm run cli -- list --category node
npm run cli -- show 1
npm run cli -- add "Procvičit Express" node
npm run cli -- edit 1 --text "Procvičit Express Router"
npm run cli -- edit 1 --category express
npm run cli -- delete 1
npm run cli -- search "Express"
npm run cli -- help
```

Například po zadání příkazu `add` proběhne tento postup:

1.  Node.js načte argumenty z `process.argv`.

2.  Soubor `cli.js` z nich vytvoří JSON.

3.  `fetch` pošle požadavek `POST /api/notes`.

4.  Express předá požadavek správné routě a controlleru.

5.  Controller provede parametrizovaný `INSERT` do PostgreSQL.

6.  API vrátí vytvořenou poznámku a CLI vypíše její ID.

## Testy

Všechny testy spustím příkazem:

```
npm test
```

V projektu mám otestované:

-   celý postup `CREATE → READ → UPDATE → DELETE`,

-   odpověď `404` po smazání poznámky,

-   vyhledávání a filtrování,

-   odmítnutí prázdného textu,

-   odmítnutí prázdného požadavku `PATCH`,

-   neplatné ID,

-   neexistující endpoint,

-   CLI příkazy `add` a `search`.

API testy používají testovací databázový objekt v paměti. Díky tomu nemění moje
skutečné poznámky v PostgreSQL a při spuštění testů nemusí běžet server.

## Struktura projektu

```
cli-poznamkovnik/
├── database/
│   └── schema.sql
├── src/
│   ├── controllers/
│   │   └── notes.controller.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   ├── routes/
│   │   └── notes.routes.js
│   ├── app.js
│   └── db.js
├── tests/
│   ├── cli.test.js
│   └── notes.api.test.js
├── .env.example
├── .gitignore
├── cli.js
├── notes.json
├── package.json
├── requests.http
├── server.js
└── README.md
```

## Jak jsem projekt rozdělila

| Část | K čemu slouží |
| --- | --- |
| `routes` | propojují HTTP metody a URL se správnými controllery |
| `controllers` | kontrolují vstupy, pracují s databází a vytvářejí odpovědi |
| `db.js` | vytváří PostgreSQL connection pool |
| `middleware` | zpracovává chyby a neexistující cesty |
| `cli.js` | převádí příkazy z terminálu na HTTP požadavky |
| `app.js` | sestavuje Express aplikaci |
| `server.js` | spouští server pomocí `listen` |

### Proč mám zvlášť `app.js` a `server.js`

Soubor `app.js` pouze vytvoří Express aplikaci. Díky tomu ho můžu importovat do
testů, aniž by se automaticky spustil skutečný server.

Soubor `server.js` aplikaci opravdu spouští pomocí metody `listen`.

### Proč už v projektu nemám `index.js`

V první verzi projektu jsem měla stejný server v souborech `index.js` i
`server.js`. Mohla jsem potom omylem upravit jeden soubor, zatímco npm spouštělo
druhý. Proto jsem duplicitu odstranila a jako jediný spouštěcí soubor používám
`server.js`.

## Zpracování chyb

API vrací chyby v jednotném formátu:

```
{
  "error": {
    "status": 400,
    "message": "Text poznámky je povinný"
  }
}
```

Použité stavové kódy:

-   `400` – neplatný vstup,

-   `404` – poznámka nebo cesta neexistuje,

-   `500` – neočekávaná chyba serveru nebo databáze.

## Původní soubor `notes.json`

Soubor `notes.json` pochází z první verze projektu. Aktuální aplikace ho už
nepoužívá, protože poznámky ukládá do PostgreSQL. Zatím jsem ho v projektu
ponechala, abych viděla, jak se aplikace postupně vyvíjela.

## Co chci doplnit dál

V další verzi bych chtěla vytvořit frontend v Reactu a TypeScriptu, který bude
používat stejné API.

Plánuji doplnit:

-   seznam poznámek,

-   formulář pro vytvoření a úpravu,

-   vyhledávací pole,

-   filtrování podle kategorie,

-   mazání s potvrzením,

-   stavy loading, error a empty state,

-   unit testy React komponent.

## Co mi projekt dal

Na projektu jsem si poprvé propojila více částí backendové aplikace do jednoho
celku. Lépe jsem pochopila, že CLI není samotná databáze ani server. Je to klient,
který pošle požadavek na API. API požadavek zpracuje a teprve potom pracuje s
PostgreSQL.

Také jsem si vyzkoušela, proč se větší aplikace rozdělují do více souborů a proč
je důležité oddělit spuštění serveru od vytvoření Express aplikace.

## Zdroje

-   [Node.js – Introduction to Node.js](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)

-   [Node.js – Test runner](https://nodejs.org/api/test.html)

-   [Express – Routing](https://expressjs.com/en/guide/routing.html)

-   [Express – Error handling](https://expressjs.com/en/guide/error-handling.html)

-   [node-postgres – Queries](https://node-postgres.com/features/queries)

-   [PostgreSQL – CREATE TABLE](https://www.postgresql.org/docs/current/sql-createtable.html)

-   [TutorialsPoint – Node.js Console](https://www.tutorialspoint.com/nodejs/nodejs_console.htm)