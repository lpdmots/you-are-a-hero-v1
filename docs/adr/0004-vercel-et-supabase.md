# Vercel pour l'application, Supabase pour la base, les comptes et les fichiers

Décision du 8 octobre 2026 : l'application est hébergée chez Vercel, à son
adresse par défaut, et s'appuie sur Supabase pour PostgreSQL, les comptes et
le stockage des fichiers. L'accord de principe du brief devient une
décision au moment où le plan de réalisation est validé : le code s'écrit
dès sa première ligne contre une base, des comptes et un stockage précis, et
les règles d'accès entre classes en dépendent.

Supabase est souscrit directement, non par la Marketplace de Vercel, pour
que la base reste indépendante de l'hébergeur si le PDF devait un jour être
produit ailleurs. Neon, autre PostgreSQL proposé par Vercel, n'a pas été
comparé en détail : il ne fournit pas à lui seul les comptes et les
fichiers. Render reste l'alternative pour la production du PDF, non pour
l'application.

Ce choix a un prix accepté. Les comptes, les règles d'accès et le stockage
sont liés à Supabase ; en changer reprendrait ces trois parties. Aucun
fournisseur n'apporte l'accès de classe sans adresse électronique, qui reste
à concevoir. Le porteur garde l'offre gratuite tant que l'usage le permet,
ouverture comprise, et ne prend l'offre Pro que lorsqu'un plafond approche
(F14, révisé le 23 octobre 2026) : l'offre gratuite ne fait aucune
sauvegarde, que remplace la sauvegarde de la nuit vers S3, images comprises,
et ne met le projet en sommeil qu'après une semaine sans activité.

La décision serait rouverte si l'accès de classe ne pouvait pas être tenu
avec les comptes de Supabase, ou si la production du PDF ne tenait pas chez
Vercel au point de déplacer aussi l'application. L'ordre de construction et
les vérifications sont dans le [plan de réalisation](../plan.md) ; la
comparaison des fournisseurs et les faits relevés dans
[l'architecture](../architecture.md#hébergement-applicatif-base-et-services-associés).
