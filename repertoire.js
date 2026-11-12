(async()=>{
'use strict';
const root=document.getElementById('directory-content'),tabs=document.getElementById('directory-tabs'),search=document.getElementById('npc-search'),total=document.getElementById('total');
const profiles=[['team',"L'ÉQUIPE"],['common','COMMUN'],...['vesper','silk','makoto','plurk','naphria'].map(id=>[id,'CONTACTS '+id.toUpperCase()])];
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n};
// Le manifeste contient désormais toutes les fiches et les chemins des portraits.
async function json(path){try{const r=await fetch(path,{cache:'no-store'});return r.ok?await r.json():{}}catch{return {}}}
const [manifest,data]=await Promise.all([json('index-personnages.json'),json('personnages.json')]);
// Lecture prioritaire de Supabase ; retour aux JSON si la base est indisponible.
// Les avis utilisent les metadataKey historiques, inchangés.
async function databasePeople(){
 if(!window.supabase?.createClient)return null;
 try{
  const client=window.supabase.createClient('https://alzcnmmxumcqiermylik.supabase.co','sb_publishable_jqzqRJzA-Bj5p7d_T7OMnw_h9hlzsV2',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const {data:rows,error}=await client.from('characters').select('character_id,name,role,kind,episode,image,legacy_path,info,image_storage_path').order('name');
  if(error||!rows?.length)throw error||new Error('Table vide');
  const ids=new Set(rows.map(r=>r.character_id));
  if((manifest.personnages||[]).some(p=>!ids.has(p.metadataKey)))throw new Error('Migration incomplète');
  return rows.map(r=>({
   name:r.info?.nom||r.name,role:r.info?.role||r.role||'',kind:r.kind,episode:r.episode,
   metadataKey:r.character_id,path:r.image||'',legacyPath:r.legacy_path||'',image_storage_path:r.image_storage_path,
   url:r.image_storage_path?client.storage.from('character-portraits').getPublicUrl(r.image_storage_path).data.publicUrl:encodeURI(r.image||'images/JohnDoe.jpeg'),
   info:r.info||{}
  }));
 }catch(e){console.warn('Lecture Supabase indisponible, utilisation des fichiers JSON :',e);return null}
}
const dbPeople=await databasePeople();
let active=new URLSearchParams(location.search).get('tab')||'team';
if(!profiles.some(p=>p[0]===active))active='team';
const people=[];
try{
const contactIds=[...new Set((dbPeople||manifest.personnages||[]).filter(p=>p.kind!=='team'&&p.kind!=='common').map(p=>p.kind))];
for(const id of contactIds)if(!profiles.some(p=>p[0]===id))profiles.push([id,'CONTACTS '+id.toUpperCase()]);
if(dbPeople){people.push(...dbPeople)}
else {
 const contactMetadata=await Promise.all(contactIds.map(id=>manifest.personnages?.some(p=>p.kind===id)?json('contacts/'+id+'/personnages.json'):Promise.resolve({})));
 for(const item of manifest.personnages||[]){
  const ownerIndex=contactIds.indexOf(item.kind);
  const metadata=ownerIndex>=0?contactMetadata[ownerIndex]:data;
  const info=metadata[item.metadataKey]||metadata[item.legacyPath]||metadata[item.image]||{};
  people.push({name:info.nom||item.name,role:info.role||item.role,path:item.image,legacyPath:item.legacyPath,url:encodeURI(item.image),kind:item.kind,metadataKey:item.metadataKey,episode:item.episode||null,info});
 }
}
people.sort((a,b)=>a.name.localeCompare(b.name,'fr'));
const opinionApi=window.RunnerOpinions?await window.RunnerOpinions.init(manifest):null;
const selected=new URLSearchParams(location.search).get('person');
if(selected){const p=people.find(x=>(x.path===selected||x.legacyPath===selected));if(p){active=p.kind;search.value=p.name}}
function section(parent,title,value,cls){if(!value)return;const s=el('section','person-section');s.append(el('h4','',title),el('p',cls||'',value));parent.append(s)}
function card(p){const card=el('div','person-card'),head=el('div','person-head'),img=el('img');img.src=p.url||'images/JohnDoe.jpeg';img.onerror=()=>{if(!img.src.endsWith('/JohnDoe.jpeg'))img.src='images/JohnDoe.jpeg'};img.alt='Portrait de '+p.name;img.loading='lazy';head.append(img);
const facts=el('div','person-facts'),i=p.info||{};facts.append(el('h3','',p.name),el('div','person-role',p.role.toUpperCase()));
const dl=el('dl');for(const [k,v] of [['Identité civile',i.identite_civile||'Inconnu'],['Métatype',i.metatype||'Inconnu'],['Affiliation',i.affiliation||'Inconnu'],['Statut',i.statut||'Inconnu']]){if(v)dl.append(el('dt','',k),el('dd','',v))}
facts.append(dl);
if(!['team','common'].includes(p.kind)){const ratings=[['RÉSEAU',i.reseau],['LOYAUTÉ',i.loyaute]].filter(([,v])=>Number.isInteger(v)&&v>=0&&v<=12);if(ratings.length){const panel=el('div','contact-ratings');for(const [label,value] of ratings){const block=el('div','contact-rating'),heading=el('div','contact-rating-label'),cells=el('div','contact-rating-cells');heading.append(el('span','',label),el('span','',value+' / 12'));for(let n=0;n<12;n++){const cell=el('span','contact-rating-cell'+(n<value?' filled':''));cell.setAttribute('aria-hidden','true');cells.append(cell)}block.setAttribute('role','img');block.setAttribute('aria-label',label+' : '+value+' sur 12');block.append(heading,cells);panel.append(block)}facts.append(panel)}}
head.append(facts);card.append(head);if(p.kind!=='team'&&p.kind!=='common'&&p.metadataKey?.startsWith('contact:')){const edit=el('button','opinion-button','✎ MODIFIER CE CONTACT');edit.type='button';edit.onclick=()=>window.RunnerContacts?.openEditor(p.kind,p,()=>location.reload());card.append(edit)}section(card,'INFORMATIONS CONNUES',i.description||'Inconnu');const merged=opinionApi?opinionApi.merge(p,{}):{};
for(const [author,opinion] of Object.entries(merged)){if(typeof opinion!=='string'||!opinion.trim())continue;const member=manifest.personnages?.find(x=>x.kind==='team'&&normalize(x.name)===normalize(author));section(card,'AVIS DE '+(member?.name||author).toLocaleUpperCase('fr'),opinion,'person-opinion')}
if(opinionApi)opinionApi.addButton(card,p,merged,()=>{const opened=card.parentElement;if(opened){const fresh=cardFn(p);card.replaceWith(fresh)}});
if(i.premiere_apparition&&/^VESPER_\d{3,}$/.test(i.premiere_apparition)){const sec=el('section','person-section');sec.append(el('h4','','PREMIÈRE APPARITION'));const a=el('a','',i.premiere_apparition);a.href='archive.html?id='+encodeURIComponent(i.premiere_apparition);sec.append(a);card.append(sec)}return card}
const cardFn=card;
function row(p,globalSearch=false){const wrap=el('div','person-row'),btn=el('button','npc');btn.type='button';btn.setAttribute('aria-expanded','false');btn.append(el('span','npc-name',p.name),el('span','npc-role',p.role));if(globalSearch){const label=profiles.find(([id])=>id===p.kind)?.[1]||p.kind;btn.append(el('span','npc-category',p.kind==='team'?'TEAM':p.kind==='common'?'COMMUN':label.replace('CONTACTS ','CONTACT ')))}btn.onclick=()=>{const previous=wrap.querySelector('.person-card');if(previous){previous.remove();btn.setAttribute('aria-expanded','false');return}const container=wrap.parentElement;container.querySelectorAll('.person-card').forEach(n=>n.remove());container.querySelectorAll('.npc[aria-expanded=true]').forEach(n=>n.setAttribute('aria-expanded','false'));wrap.append(card(p));btn.setAttribute('aria-expanded','true')};wrap.append(btn);return wrap}
function render(){tabs.replaceChildren();for(const [id,label] of profiles){const b=el('button','directory-tab',label);b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected',String(active===id));b.onclick=()=>{active=id;search.value='';history.replaceState(null,'',location.pathname+'?tab='+id);render()};tabs.append(b)}
root.replaceChildren();if(active!=='team'&&active!=='common'&&window.RunnerContacts){const add=el('button','opinion-button','＋ CRÉER UN CONTACT');add.type='button';add.style.marginBottom='18px';add.onclick=()=>window.RunnerContacts.openEditor(active,null,()=>location.reload());root.append(add)}const q=normalize(search.value.trim());if(q){const results=people.filter(p=>[p.name,p.role,p.info.affiliation,p.info.identite_civile,p.kind,profiles.find(([id])=>id===p.kind)?.[1],p.episode].some(v=>normalize(v).includes(q)));total.textContent=results.length+' RÉSULTAT'+(results.length>1?'S':'');if(!results.length){root.append(el('p','directory-state','AUCUN RÉSULTAT DANS LES RÉPERTOIRES'));return}results.forEach(p=>root.append(row(p,true)));return}const shown=people.filter(p=>p.kind===active);total.textContent=shown.length+' PERSONNAGE'+(shown.length>1?'S':'');
if(!shown.length){root.append(el('p','directory-state',q?'AUCUN RÉSULTAT':'AUCUNE FICHE DANS CET ONGLET'));return}
if(active==='common'){const groups=new Map();for(const p of shown){const k=p.episode||'AUTRES';if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p)}for(const [code,group] of [...groups].sort((a,b)=>a[0].localeCompare(b[0], 'fr',{numeric:true}))){const details=el('details','episode'),summary=el('summary'),list=el('div','episode-list');summary.append(el('span','',code),el('span','directory-count',group.length+' PERSONNAGE'+(group.length>1?'S':'')));group.forEach(p=>list.append(row(p)));details.append(summary,list);root.append(details)}}
else shown.forEach(p=>root.append(row(p)));
if(selected){const p=shown.find(p=>p.path===selected||p.legacyPath===selected);if(p){const target=[...root.querySelectorAll('.person-row')].find(r=>r.querySelector('.npc-name')?.textContent===p.name);if(target){const parent=target.closest('details');if(parent)parent.open=true;target.querySelector('.npc')?.click()}}}
}
search.addEventListener('input',render);render();
}catch(e){root.replaceChildren(el('p','directory-state','RÉPERTOIRE INDISPONIBLE // '+e.message));total.textContent='ERREUR'}
})();