# Logo « Il était une classe » — guide d'usage

Logo décidé par le porteur le 21 octobre 2026, à l'issue de trois séries de
pistes : le **dragon-livre**. Ce dossier en tient les fichiers et les règles
d'usage ; la [présentation](presentation.html) le montre en situation.

## 1. L'idée

Le livre ouvert est un petit dragon : ses pages sont ses ailes, griffues aux
coins, et sa queue pend du dos du livre comme le ruban d'un signet, en
ondulant sous la page de gauche jusqu'à sa pointe en flèche. Le symbole ne
porte aucune lettre : il sert aux deux noms, « Il était une classe » et
« Once Upon a Classroom ».

## 2. Les versions

Le même dragon existe en trois tailles de dessin ; on prend celle qui
convient à la taille d'affichage.

| Version | Fichier | Quand s'en servir |
| --- | --- | --- |
| Grande, avec fumée | `svg/dragon-grand.svg` | Accueil du site, couverture et dos des livres imprimés, affiche de classe ; à partir de 96 px ou 20 mm de large. |
| Moyenne, sans fumée | `svg/dragon-moyen.svg` | En-tête de l'application, courriels, versions avec le nom ; de 32 px à 96 px, ou de 8 à 20 mm. |
| Petite, simplifiée | `svg/dragon-petit.svg` | Icône d'onglet et petites tailles, sous 32 px : ni queue, ni épines fines, ni fumée, tête agrandie. |

Avec le nom :

| Assemblage | Français | Anglais |
| --- | --- | --- |
| Horizontal (dragon moyen) — assemblage principal | `svg/il-etait-une-classe-horizontal.svg` | `svg/once-upon-a-classroom-horizontal.svg` |
| Empilé (dragon grand, nom sur deux lignes) | `svg/il-etait-une-classe-empile.svg` | `svg/once-upon-a-classroom-empile.svg` |
| Nom seul | `svg/il-etait-une-classe-nom.svg` | `svg/once-upon-a-classroom-nom.svg` |

Chaque fichier existe aussi en `-noir` (une couleur, sur fond clair) et en
`-blanc` (sur fond sombre ou sur le bleu canard). Des PNG transparents sont
dans `png/`. Les icônes du site sont dans `web/` (voir § 7).

## 3. Couleurs

| Nom | HEX | RVB | CMJN indicatif | Rôle |
| --- | --- | --- | --- | --- |
| Bleu canard | `#0B6A73` | 11 106 115 | C90 M8 J0 N55 | Le dragon. |
| Graphite | `#1E2226` | 30 34 38 | C21 M11 J0 N85 | Le nom. |

Ce sont les deux couleurs de référence de l'application
([design](../../docs/design.md)). Le bleu canard sur blanc donne un contraste
d'environ 6,3:1. Les valeurs CMJN sont une conversion automatique : pour
l'impression, les faire valider par l'imprimeur sur épreuve ; aucune teinte
Pantone n'est choisie.

Fonds permis : couleur sur blanc ou sur le fond « bureau » `#F1F2EE` ;
blanc sur bleu canard ou sur graphite ; noir sur blanc. Sur une photo, la
version blanche ou noire, sur une zone calme.

## 4. Espace libre et tailles minimales

- **Espace libre :** autour du logo, garder au moins la hauteur de la tête du
  dragon (des cornes au menton) sur chaque côté. Il grandit avec le logo.
- **Tailles minimales :** assemblage horizontal 120 px ou 30 mm de large ;
  dragon moyen 32 px ou 8 mm ; en dessous, dragon petit, jusqu'à 16 px.

## 5. Typographie

Le nom est écrit dans la **cursive traditionnelle des écoles françaises**,
Playwrite FR Trad (décidé le 22 octobre 2026, à la place de Vollkorn), au
**trait épaissi** d'un contour de sa couleur large de 3,5 % du corps. C'est
aussi la cursive de tout le site (prénoms des élèves, étiquettes, accueil).
Licence SIL Open Font License, qui permet l'usage dans un logo ; la police et
sa licence sont dans `sources/`. Dans les fichiers, le nom est **dessiné en
tracés**, attaques et liaisons de la police comprises : pour une affiche, un
livre ou un document, prendre ces fichiers plutôt que de retaper le nom.
Seule exception, l'application, qui l'écrit en texte avec la même police et
le même épaississement, pour qu'il reste lu par les lecteurs d'écran. Le
contour d'épaississement est un trait dans les SVG : un logiciel de dessin
le garde tel quel, ou le « vectorise » si un imprimeur le demande.

La capitale I de cette cursive est le I bouclé de l'école : un lecteur
étranger peut y lire un J ; la version anglaise n'a pas de I.

## 6. À ne pas faire

Déformer, étirer ou tourner le logo ; changer ses couleurs hors de la
palette ; ajouter ombre, contour, dégradé ou effet ; déplacer ou
redimensionner le dragon par rapport au nom ; mettre la fumée sur un logo de
moins de 96 px ; poser le logo en couleur sur un fond chargé.

## 7. Intégration au site

`web/` contient `favicon.ico` (16, 32 et 48 px, dessin petit), `favicon.svg`,
`apple-touch-icon.png` (180 px), `icon-192.png`, `icon-512.png`,
`maskable-512.png` (dessin moyen, blanc sur bleu canard), `site.webmanifest`
et les lignes à mettre dans `<head>` (`head-snippet.html`).

Dans l'application depuis le 22 octobre 2026 : `favicon.ico`, `icon.svg` et
`apple-icon.png` dans `app/src/app/` (conventions de Next.js, qui écrit les
balises lui-même) ; le dragon moyen et le nom dans la barre du haut
(`composants/Logo.tsx`, le dragon seul sur téléphone) ; le dragon grand en tête
des écrans d'entrée (`composants/EntreeIllustree.tsx`). Les tracés y viennent
de `svg/` (`composants/traces-du-dragon.ts`) : après un changement du dessin,
les recopier. Le manifeste d'application installable n'est pas posé.

## 8. Refaire les fichiers

Les fichiers maîtres de `svg/` sont produits par `sources/construire.py`, à
partir du dessin écrit en coordonnées et de la police
`sources/PlaywriteFRTrad-400.ttf` ; le nom y est mis en forme par HarfBuzz
(paquet Python `uharfbuzz`, à installer), puis transformé en tracés.
`python3 sources/construire.py` écrit dans `sources/sortie/`. Les versions `-noir` et `-blanc`, les PNG et
les icônes du site sont tirés des maîtres avec les scripts du skill
`logo-design` (`export_variants.py`, `render_png.py`).

## 9. Points ouverts

- **Marque :** non déposée ; une recherche d'antériorité (INPI, EUIPO,
  recherche d'images) est recommandée avant un dépôt.
- **Mascotte :** le porteur envisage le dragon en mascotte du site ; cela
  touche F11.6 (« sans mascotte à ce stade ») et se décide à part.
- **Maquette :** elle n'affiche pas ce logo.
