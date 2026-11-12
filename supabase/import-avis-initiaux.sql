-- Import initial des avis archivés dans les fichiers JSON.
-- À lancer APRÈS supabase/avis.sql dans le SQL Editor de Supabase.
-- Idempotent : un avis déjà publié dans Supabase n'est jamais écrasé.
-- Source : personnages.json et contacts/*/personnages.json.
-- Nombre d'avis préparés : 14.

insert into public.character_opinions (character_id, member_id, body)
values
  ('team:makoto', 'vesper', 'Makoto est un orc de peu de mots. Un homme efficace, fiable, qui ne ressent visiblement aucun besoin de démontrer ses capacités avant de les employer. J''apprécie cette retenue. Quand la situation exige une intervention physique, il agit sans discours inutile. Une certaine forme de sagesse. Je soupçonne néanmoins qu''il cache un sens de l''humour plus développé qu''il ne veut bien le laisser paraître.'),
  ('team:naphria', 'vesper', 'Naphria possède une conception assez particulière de la résolution des problèmes. Là où certains envisagent la négociation, le contournement ou la patience, elle sait reconnaître les situations dans lesquelles une quantité judicieusement calculée d''explosifs constitue une réponse parfaitement raisonnable.

Ce qui pourrait sembler inquiétant chez une personne moins compétente devient, entre ses mains, une véritable démonstration de précision.

J''apprécie les gens qui maîtrisent leur art. Et je dois reconnaître que Naphria maîtrise le sien avec une élégance toute particulière.'),
  ('team:plurk', 'vesper', 'Plurk est un professionnel remarquablement compétent. Il possède cette qualité rare qui consiste à prévoir les ennuis avant même que nous ayons eu le temps de nous y précipiter. Une aptitude que je considère comme particulièrement précieuse dans notre métier.

Quoi qu''il en soit, c''est un compagnon fiable, et j''apprécie de travailler avec lui.'),
  ('team:silk', 'vesper', 'Onee-chan possède un talent remarquable pour obtenir des gens ce qu''ils n''avaient aucune intention de lui accorder. Elle prétend parfois que je manque de diplomatie. Je préfère considérer que nous avons simplement des méthodes complémentaires. Nous avons traversé suffisamment de choses ensemble pour que je sache une chose : je lui confierais ma vie sans hésiter. Je ne lui confierais peut-être pas le choix de ma prochaine cravate.'),
  ('team:vesper', 'vesper', 'Un individu tout à fait recommandable, à ce qu''on m''a dit. Poli, ponctuel, convenablement habillé et capable de résoudre certains désaccords avec une remarquable économie de mots.

On lui reproche parfois un attachement excessif aux principes, une certaine rigidité et une tendance à considérer qu''une cravate bien nouée constitue déjà un début de civilisation. Je trouve ces critiques particulièrement injustes.

Quant à ses compétences, je préfère laisser les autres en juger. L''autosatisfaction manque singulièrement d''élégance.

Il paraît néanmoins qu''il tire plutôt bien.'),
  ('common:cassandra', 'vesper', 'Cassandra possède cette qualité rare : elle sait que le professionnalisme n''interdit ni l''élégance ni les bonnes manières. J''apprécie particulièrement de travailler avec elle. Quant à son regard… disons qu''il m''arrive d''oublier, l''espace d''un instant, que nous sommes censés parler affaires. Une distraction que je ne m''autorise pas souvent.'),
  ('common:cassandra', 'silk', 'Je n''ai pas bien compris ce que mon frère pouvait lui trouver.'),
  ('contact:ash', 'vesper', 'Je crois que les scientifiques de Kagamori Biosystems avaient une définition assez particulière du mot échec.

Ash n''avait pas donné les résultats attendus. Il ne correspondait pas à ce que l''on avait prévu pour lui. Leur conclusion était donc parfaitement logique, du moins selon leurs critères : il fallait s''en débarrasser.

Je me suis souvent demandé ce qu''il fallait avoir perdu de son humanité pour considérer qu''une vie pouvait être jetée parce qu''elle ne répondait pas à un cahier des charges.

Naoko et moi avons décidé qu''il viendrait avec nous. Je n''ai jamais regretté cette décision.

Il est parfois difficile de savoir ce que représente une famille lorsque l''on n''en a jamais véritablement eu. J''ai ma sœur, bien entendu. Et puis il y a Naoko. Et Ash.

Je suppose que cela fait de moi un grand frère. Une responsabilité que je prends très au sérieux, même si je ne suis pas certain de toujours savoir comment m''y prendre.

Ash mérite de découvrir ce qu''il souhaite devenir, plutôt que de vivre avec le souvenir de ce que d''autres avaient décidé qu''il serait.

Et tant que je serai là, personne ne décidera à nouveau de sa valeur à sa place.'),
  ('contact:edward-hudson', 'vesper', 'Monsieur Hudson possède trois qualités essentielles chez un armurier : il connaît sa marchandise, respecte ses engagements et ne manifeste aucune curiosité déplacée.

Je trouve cette dernière qualité particulièrement appréciable. Certains commerçants semblent considérer chaque achat comme une invitation à discuter de votre vie privée. Edward, lui, comprend qu''un client qui demande des munitions souhaite généralement des munitions, pas une conversation.

Nos relations sont excellentes. Je paie mes factures, il fournit du matériel de qualité. Une forme d''harmonie commerciale que bien des corporations gagneraient à étudier.'),
  ('contact:hiroshi-takamura', 'vesper', 'Hiro-san est un homme de goût, ce qui constitue déjà une excellente raison de partager un verre avec lui. Nous ne sommes pas toujours d''accord sur le whisky, mais je crois que nos désaccords font partie du plaisir.

Il connaît la valeur d''une parole donnée et sait respecter les silences. Je ne lui demande pas ce qui concerne son clan ; il ne me demande pas ce qui concerne mes activités. C''est une forme de courtoisie que j''apprécie sincèrement.

Il tient toujours à régler la première tournée. J''insiste pour payer la seconde. Nous n''avons jamais jugé nécessaire de modifier cet arrangement.'),
  ('contact:ichida-takako', 'vesper', 'Takako-san est une femme qui connaît parfaitement les règles du monde corporatiste. Elle sait quand parler, quand se taire et, surtout, à qui s''adresser. Des qualités que j''apprécie.

Nous avons partagé quelques moments agréables, sans jamais chercher à leur donner davantage de sens qu''ils n''en avaient. Certaines rencontres n''ont pas vocation à devenir de grandes histoires.

Je conserve d''elle un excellent souvenir. Et nos conversations restent toujours intéressantes, même lorsqu''elles ne concernent ni les affaires ni le passé.

Il est finalement assez rare de pouvoir dire d''une ancienne liaison qu''elle s''est terminée avec autant de courtoisie qu''elle avait commencé.'),
  ('contact:naoko-mizuhara', 'vesper', 'Il existe des dettes que l''on peut rembourser avec de l''argent, des services ou quelques faveurs judicieusement rendues. Et puis il existe celles pour lesquelles aucune monnaie n''a jamais été inventée.

Naoko m''a offert quelque chose que je n''avais jamais véritablement possédé : la possibilité de choisir ma propre vie.

Elle aurait pu détourner les yeux. Continuer ses recherches, obéir aux ordres et se convaincre que tout cela était nécessaire. Cela aurait été tellement plus simple. Mais elle a choisi de nous voir comme des êtres humains, et non comme des expériences.

Je lui dois ma liberté. Peut-être même davantage.

Je ne suis pas certain de lui avoir jamais dit à quel point elle compte pour moi. Certaines choses sont étrangement difficiles à exprimer, même lorsque l''on trouve habituellement les mots avec une certaine facilité.

Si quelqu''un me demandait ce qu''elle représente à mes yeux, je crois que je répondrais simplement ceci : elle est ce qui se rapproche le plus d''une mère que j''aie jamais connue.

Je ne lui ai jamais dit. Peut-être un jour.'),
  ('contact:razor', 'vesper', 'Notre première rencontre fut assez peu conventionnelle. Razor souhaitait me casser quelques os. Je trouvais cette entrée en matière regrettable, mais nous n''avons pas eu le loisir d''en débattre.

Quelques individus encore moins courtois que lui ont interrompu notre conversation. Nous avons donc réglé ensemble un problème plus pressant.

Razor possède une conception assez directe des relations humaines. Il parle fort, frappe fort et considère manifestement la diplomatie comme une perte de temps. Pourtant, derrière cette apparence intimidante se cache un homme dont la loyauté ne fait aucun doute.

Nous avons peu de choses en commun, hormis peut-être une certaine idée de l''honneur. Et, à bien y réfléchir, c''est déjà beaucoup.'),
  ('contact:yuki-stardust', 'vesper', 'Yuki Stardust est une jeune femme dont le sens de la mesure semble avoir été sacrifié sur l''autel de l''expression artistique. Ses tenues, sa musique, son attitude… Tout chez elle paraît conçu pour attirer l''attention.

Je devrais probablement trouver cela épuisant. Curieusement, c''est tout le contraire.

Il est assez rafraîchissant de rencontrer quelqu''un qui considère les conventions comme de simples suggestions. Je ne partage pas cette philosophie, naturellement. Mais j''apprécie ceux qui savent la défendre avec autant de panache.

Nous nous connaissons peu. Je lui ai simplement rendu un petit service, un soir. Rien qui mérite une chanson, j''espère.')
on conflict (character_id, member_id) do nothing;

-- Vérification : consulter la liste et le nombre de lignes importées.
select character_id, member_id, left(body, 100) as extrait,
       char_length(body) as longueur
from public.character_opinions
where (character_id, member_id) in (
  ('team:makoto', 'vesper'),
  ('team:naphria', 'vesper'),
  ('team:plurk', 'vesper'),
  ('team:silk', 'vesper'),
  ('team:vesper', 'vesper'),
  ('common:cassandra', 'vesper'),
  ('common:cassandra', 'silk'),
  ('contact:ash', 'vesper'),
  ('contact:edward-hudson', 'vesper'),
  ('contact:hiroshi-takamura', 'vesper'),
  ('contact:ichida-takako', 'vesper'),
  ('contact:naoko-mizuhara', 'vesper'),
  ('contact:razor', 'vesper'),
  ('contact:yuki-stardust', 'vesper')
)
order by character_id, member_id;
