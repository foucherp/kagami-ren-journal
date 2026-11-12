// Migration ponctuelle des portraits GitHub vers Supabase Storage.
// À lancer depuis GitHub Actions ; la clé service_role ne quitte jamais le runner.
import {readFile} from 'node:fs/promises';
import {extname} from 'node:path';
const base=process.env.SUPABASE_URL?.replace(/\/$/,'');
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!base||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(base)||!key)throw Error('Secrets Supabase manquants ou invalides');
const headers={apikey:key,Authorization:'Bearer '+key};
async function request(url,options={}){
 const r=await fetch(url,{...options,headers:{...headers,...options.headers}});
 if(!r.ok)throw Error(r.status+' '+(await r.text()).slice(0,350));
 return r;
}
const {personnages}=JSON.parse(await readFile('index-personnages.json','utf8'));
let done=0,skipped=0,failed=0;
for(const p of personnages){
 if(!p.image||p.image==='images/JohnDoe.jpeg'){skipped++;continue}
 const id=p.metadataKey;
 const ext=extname(p.image).toLowerCase();
 const mime=ext==='.png'?'image/png':ext==='.webp'?'image/webp':'image/jpeg';
 const path='legacy/'+id.replace(/[^a-z0-9:-]/g,'-').replace(':','/')+ext;
 try{
  const check=await request(base+'/rest/v1/characters?character_id=eq.'+encodeURIComponent(id)+'&select=character_id,image_storage_path');
  const row=(await check.json())[0];
  if(!row)throw Error('Fiche absente en base : '+id);
  if(row.image_storage_path){skipped++;continue}
  const bytes=await readFile(p.image);
  if(bytes.length>5242880)throw Error('Image supérieure à 5 Mo');
  await request(base+'/storage/v1/object/character-portraits/'+path,{
   method:'POST',headers:{'Content-Type':mime,'x-upsert':'false'},body:bytes
  }).catch(async e=>{
   // Un fichier déjà importé peut être réutilisé lors d'une reprise.
   if(!String(e).includes('409'))throw e;
  });
  await request(base+'/rest/v1/characters?character_id=eq.'+encodeURIComponent(id),{
   method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},
   body:JSON.stringify({image_storage_path:path})
  });
  done++;console.log('OK '+id);
 }catch(e){failed++;console.error('ERREUR '+id+': '+e.message)}
}
console.log(JSON.stringify({imported:done,skipped,failed}));
if(failed)process.exitCode=1;
