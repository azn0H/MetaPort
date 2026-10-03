# MetaPort: nasazování a diagnostika na Raspberry Pi

Nová položka **Nasazování a disk** je dostupná superadminovi. Jde o skutečný backend: Git přes HTTPS, Docker Compose CLI, API GitHub/GitLab.com a Docker Engine disk usage. Backend běží na Linuxu vedle stejného Docker daemonu. Windows slouží pro vývoj, worker tam neběží. Self-hosted GitLab zatím není podporován.

## Aktualizace Pi

1. Zálohujte databázi MetaPortu a data spravovaných aplikací. Přeneste tuto změnu do svého checkoutu MetaPortu na Pi.
2. Vytvořte `sudo install -d -m 700 /opt/metaport-deploy`. Tato cesta musí být na hostiteli i v backendu shodná kvůli bind mountům Compose. Stav, tokeny a prostředí jsou uložené v `state.enc`; klíč `secret.key` má režim 0600. Zálohujte oba soubory společně a chraňte zálohu jako přístupové údaje. Šifrování nechrání před správcem hostitele.
3. Zachovejte existující `backend/.env`, nastavte silné `SECRET_KEY` a vlastní `ADMIN_PASSWORD_HASH`. Síť `sdilena_databazova_sit` a stávající porty zůstávají součástí instalace.
4. Spusťte `docker compose build metaport-backend metaport-frontend` a pak `docker compose up -d metaport-backend metaport-frontend`. Dockerfile obsahuje Git, Docker CLI a Compose plugin pro ARM64. Pi OS 64 bit je doporučená cílová platforma. Ověřte `docker compose exec metaport-backend docker compose version` a `docker compose exec metaport-backend git --version`.
5. Používejte právě jeden backend proces / uvicorn worker. Linux file lock brání více workerům provádět nasazení, ale konfigurace používá procesový zámek, nikoli distribuovanou databázi. Více API procesů nebo více replik není podporováno.
6. Přihlaste se jako superadmin. Přidejte pojmenované připojení a token. GitHub token potřebuje přístup k vybraným soukromým repozitářům (Contents read; klasický PAT `repo`), GitLab PAT `read_api` a `read_repository`. Pro různé projekty lze vytvořit různé připojení s omezenými tokeny. Seznam repozitářů je stránkovaný po 100.
7. Vyberte repozitář, větev, Compose cestu a prostředí `KEY=value`. Prostředí se používá jako Compose `--env-file` pro interpolaci; do kontejneru se dostane prostřednictvím `environment` v Compose souboru. Editor nikdy nenačítá uložené hodnoty, pouze názvy. Volba nahrazení mění celé prostředí. Nepoužívejte víceřádkové hodnoty. Neukládejte tajné hodnoty do git repozitáře.
8. Nejprve ručně nasaďte testovací aplikaci. Pak zapněte automatiku. Kontrola běží po 60 sekundách (minimálně 30, nastavení `METAPORT_POLL_SECONDS`), bez SSH a veřejných webhooků. Selhání stejného commitu se automaticky neopakuje; ruční Nasadit jej zopakuje. Nový commit spustí další pokus.

## Compose a převzetí existujících aplikací

Každý projekt má stabilní namespace `mp-<název>`. Po úspěšném nasazení nelze název změnit, protože je svázaný s volumes a kontejnery. Odebrání konfigurace zastaví správu projektu, ale nemaže kontejnery ani data. MetaPort automaticky nepřebírá starý Compose projekt. Před první migrací ověřte porty, `container_name`, externí sítě a skutečná data. Pro existující databázi použijte explicitní externí volume s jeho skutečným názvem; jinak Compose vytvoří nové volume pod novým namespace. Převzetí proveďte v plánovaném okně a se zálohou.

Každé nasazení má samostatný checkout. Relativní bind mounty do checkoutu jsou odmítnuté, aby se například `./data` při dalším nasazení nezměnilo na prázdnou složku. Použijte stabilní absolutní hostitelské cesty nebo named volumes. Absolutní bind cesty musí existovat na Pi. Compose soubor může být v podadresáři, ale project directory/build context je kořen repozitáře: přizpůsobte cesty tomuto pravidlu. Git submodules a Git LFS nejsou automaticky stahovány. Registry autentizaci pro soukromé Docker images je potřeba nastavit na hostiteli/backendu samostatně.

Build dostává jedinečné image tagy podle projektu, služby a commitu. Před výměnou se zachovají images existujících služeb pod `metaport-retained/...`. `build` a stažení images se provede před `up`; selhání těchto fází nevolá `down` ani `up`, běžící verze pokračuje. Samotné `up` může způsobit krátký výpadek a při chybě zanechat částečně aktualizovaný stack. `--wait` ověřuje running/healthy; bez healthchecku nejde o ověření správného chování aplikace. Přidejte vlastní healthchecky pro HTTP a databázi. One-shot migrační služby musí mít vhodně nastavené Compose dependencies.

Automatický rollback se neprovádí. UI ukazuje předchozí image tagy. Úspěšné release a jejich historii správce zachovává pod `/opt/metaport-deploy/projects/<id>/`. Pro ruční obnovu zvolte předchozí úspěšný release z historie (`GET /api/v1/deployments`), jeho původní Compose soubor a sourozeneckou složku `<release>-control` s `project.env` a `images.json`; použijte stejný `--project-name mp-<název>`, `--project-directory <release>`, `--env-file <control>/project.env`, oba `-f` soubory a `up -d --no-build --pull never --wait`. Před obnovou ověřte dostupnost images a kompatibilitu aktuální databáze. Zachované tagy lze použít do ručního Compose override pro služby bez build. Databázové migrace ani externí vedlejší účinky se takto nevracejí.

Historie, checkouty a zachované images záměrně nejsou automaticky mazány. Mohou zabírat místo; úklid je samostatné rozhodnutí až po diagnostice a kontrole potřeby obnovy. Backend log ukazuje postup, časy a exit kód; záměrně neukládá syrový výstup Git/Compose/Dockerfile, který může vypsat hesla. Podrobnou chybu reprodukujte důvěryhodným příkazem na Pi s chráněným terminálem.

## Diagnostika

Měření čte Docker Engine disk usage (ekvivalent podkladů `docker system df -v`). Celkový údaj `LayersSize` počítá image vrstvy jednou; velikosti jednotlivých images obsahují sdílené vrstvy. Tabulka zobrazuje logickou, sdílenou a unikátní velikost. Cache, writable layers a volumes jsou zobrazené samostatně; kategorie se mohou překrývat a nelze je prostě sečíst na využití hostitelského disku.

API zobrazuje pouze vybraná pole diagnostiky, nikoli environment nebo labels kontejnerů. Velikost logu se načte jen když je cesta viditelná backendu; s běžným Docker socket mountem bývá neznámá. Bind mounty ukazují skutečné zdroje, ale velikost není měřená. Volume UsageData může být nedostupné podle driveru. Žádná chybějící velikost se nevydává za nulu.

Doporučení vychází z nevyužité nesdílené cache, unikátních vrstev images bez kontejnerů a růstu build images oproti poslednímu úspěšnému nasazení. Potenciální úspory nejsou garantované ani sčitatelné. Zachované recovery images nejsou doporučené k odstranění. Pro analýzu konkrétního Dockerfile lze volitelně spustit [Dive](https://github.com/wagoodman/dive) na Pi; jeho waste odhad není jistota. Vhodné změny jsou `.dockerignore`, vícefázový build, odstranění cache balíčků ve stejné vrstvě a přesun runtime dat mimo image. MetaPort nikdy automaticky nemaže volumes, databáze, images ani cache.

## Autentizace

Původní SSO endpoint přijímal nepodepsané role z klientského tokenu. Pro nové privilegované nasazování je to nepřijatelné: nyní ověřuje RS256 podpis, issuer, audience, exp a sub. Pro SSO nastavte `SSO_ISSUER`, `SSO_AUDIENCE`, `SSO_JWKS_URL` (HTTPS); bez nich SSO vrací 503. Heslové přihlášení funguje dál. Přístup k repozitářům, prostředí, diagnostice a nasazování má pouze superadmin. Nasazujte jen důvěryhodný kód: Docker socket dovoluje správu hostitele.

## Ověření na Pi před používáním

- Ruční nasazení malé aplikace s healthcheckem, GitHub i GitLab soukromý repozitář, automatický nový commit na development.
- Chybný Dockerfile: původní kontejnery musí zůstat aktivní. Nezdravý nový image: status failed a zachované předchozí tagy.
- Restart backendu během nasazení: přerušené nasazení se označí failed, skutečné kontejnery zkontrolujte.
- Ověřte stabilitu volumes/bind cest a manuální obnovu, dostupnost externích sítí a ARM images.
- Porovnejte diagnostiku s `docker system df -v`, ne s prostým součtem velikostí images.
- Zkontrolujte, že tokeny a hodnoty prostředí nejsou v API odpovědích ani fázovém logu.

Lokální testy používají skutečné API a šifrované úložiště s izolovanými náhradami Git/Docker operací. Nenahrazují integraci s Docker daemonem ani Raspberry Pi.

## Lokální výsledky ověření

Produkční build frontendu (`tsc -b` a Vite) prošel. Backend API/regresní testy ověřují autorizaci, šifrování a skrytí secrets, validaci vstupů, zachování prostředí, build failure bez `up/down`, úspěšné nasazení s `--wait`, selhání healthchecku, odmítnutí nestabilních bind mountů a deduplikaci diagnostiky. Testy Git/Docker operace izolují; přístup k reálnému Docker daemonu v této vývojové relaci není dostupný a Pi nebylo kontaktováno.
