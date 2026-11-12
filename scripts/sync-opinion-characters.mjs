// GitHub Actions uniquement. Ne jamais exécuter avec une clé secrète côté navigateur.
import {readFile} from 'node:fs/promises';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Configuration manquante : ajouter SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans les secrets GitHub Actions.');
  process.exit(1);
}
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
  throw new Error('SUPABASE_URL invalide.');
}
const manifest = JSON.parse(await readFile('index-personnages.json', 'utf8'));
if (!Array.isArray(manifest.personnages) || !manifest.personnages.length) {
  throw new Error('Manifeste vide ou invalide : synchronisation interrompue.');
}
const ids = manifest.personnages.map(p => p.metadataKey);
if (ids.some(id => typeof id !== 'string' || !/^[a-z]+:[a-z0-9-]+$/.test(id))) {
  throw new Error('Un personnage possède un metadataKey absent ou invalide.');
}
if (new Set(ids).size !== ids.length) {
  throw new Error('Des metadataKey sont dupliqués.');
}
const endpoint = url.replace(/\/$/, '') + '/rest/v1/opinion_characters?on_conflict=character_id';
const res = await fetch(endpoint, {
  method: 'POST',
  headers: {
    apikey: key,
    Authorization: 'Bearer ' + key,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal'
  },
  body: JSON.stringify(ids.map(character_id => ({character_id})))
});
if (!res.ok) {
  const response = (await res.text()).slice(0, 500);
  if (res.status === 404 && response.includes('PGRST205') && response.includes('opinion_characters')) {
    throw new Error('Table opinion_characters absente de Supabase. Exécuter une seule fois supabase/securite-avis.sql dans le SQL Editor de Supabase, puis relancer le workflow.');
  }
  throw new Error('Échec de la synchronisation Supabase (HTTP ' + res.status + ') : ' + response);
}
console.log(ids.length + ' personnages autorisés dans Supabase. Les anciennes entrées sont conservées pour ne pas casser les avis existants.');
