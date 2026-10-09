# Paged.js et Chromium pour le livre, aperçu calculé côté serveur

Décision du 3 octobre 2026 : le livre est composé en HTML et CSS, paginé par
Paged.js et imprimé par Chromium ; l'aperçu du livre est calculé par ce même
Chromium, côté serveur, et non dans le navigateur de l'adulte. Le prototype
jetable a tenu les points propres au PDF sur un livre d'essai de 145 pages,
composé en trois secondes. Il a aussi montré que des pages calculées dans le
navigateur ne sont celles du PDF que sous Chromium : sous WebKit, le moteur de
Safari et des iPad, 111 pages sur 145 diffèrent. Calculer l'aperçu côté
serveur est donc ce qui permet de tenir « même mise en page à la page près »
sur tout appareil.

Typst, l'alternative sans navigateur, n'a pas été essayé, sur décision du
porteur : le choix repose sur le fait que Paged.js suffit, non sur une
comparaison. Vivliostyle a été écarté pour sa licence AGPL.

Ce choix a un prix accepté. Paged.js est peu maintenu, sans version stable
depuis 2023, et un de ses défauts a déjà dû être contourné. Les coupures
(veuves, orphelines, blocs insécables) sont celles de Chromium, dont la version
sera figée. Chaque recalcul de l'aperçu est un rendu sur le serveur, avec son
délai et son coût. Les tests du prototype seront repris comme filet, non son
code.

La décision serait rouverte si le Chromium de Linux ne donnait pas les mêmes
pages ou ne tenait pas dans l'hébergement, ou si l'aperçu calculé côté serveur
se révélait trop lent à l'usage : rien de cela n'a été vérifié. Verdicts,
mesures et réserves sont dans
[l'architecture](../architecture.md#résultats-du-prototype-pdf-3-octobre-2026).
