/* Journaux Supabase indépendants : écriture réservée au propriétaire, chiffrement AES-GCM. */
(()=>{
'use strict';
const URL='https://alzcnmmxumcqiermylik.supabase.co',KEY='sb_publishable_jqzqRJzA-Bj5p7d_T7OMnw_h9hlzsV2';
const client=window.supabase?.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const owner=location.pathname.toLowerCase().includes('hesperis')?'hesperis':'vesper';
const prefix=owner.toUpperCase()+'_',table=owner+'_journal';
let authorized=false,stored=[],available=false;
const legacy=()=>owner==='vesper'&&typeof entries!=='undefined'&&Array.isArray(entries)?entries:[];
async function load(){
 if(!client)return legacy();
 const {data,error}=await client.from(table).select('id,entry_data').order('id',{ascending:false});
 if(error){console.warn('Journal Supabase indisponible',error);return legacy()}
 available=true;stored=(data||[]).map(x=>({...x.entry_data,id:x.id}));
 return stored.length?stored:legacy();
}
async function init(){
 if(!client)return {entries:legacy(),editable:false};
 const {data:{session}}=await client.auth.getSession();
 if(session){
  const {data}=await client.from('opinion_members').select('member_id').eq('email',session.user.email.toLowerCase()).maybeSingle();
  authorized=data?.member_id===owner;
 }
 let all=await load();
 // Première migration : insertion sans écrasement, avec conservation des archives chiffrées.
 if(authorized&&available&&stored.length===0&&legacy().length){
  const {error}=await client.from(table).upsert(legacy().map(e=>({id:e.id,entry_data:e})),{onConflict:'id',ignoreDuplicates:true});
  if(error)console.error('Import du journal impossible',error);
  else all=await load();
 }
 return {entries:all,editable:authorized};
}
const bytes64=bytes=>btoa(String.fromCharCode(...bytes));
const from64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function decryptLines(entry,password){
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:from64(entry.salt),iterations:310000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
 return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:from64(entry.iv)},key,from64(entry.ciphertext))));
}
function nextId(all){const taken=new Set(all.map(e=>e.id));let n=Math.max(0,...all.filter(e=>e.id?.startsWith(prefix)).map(e=>Number(e.id.slice(prefix.length))||0))+1;while(taken.has(prefix+String(n).padStart(3,'0')))n++;return prefix+String(n).padStart(3,'0')}
async function encryptLines(lines,password){
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt']);
 const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(lines))));
 return {salt:bytes64(salt),iv:bytes64(iv),ciphertext:bytes64(cipher)};
}
const node=(tag,label,value)=>{const n=document.createElement(tag);if(label)n.textContent=label;if(value!==undefined)n.value=value;return n};
async function edit(entry,onSaved){
 if(!authorized||!available)return;
 const existing=entry||{},d=document.createElement('dialog');
 let suggested=prefix+'001';
 if(!entry){const all=await load();suggested=nextId(all);}
 d.style.cssText='background:#10131b;color:#e9e6ec;border:1px solid #9b6679;padding:25px;width:min(680px,94vw);max-height:90vh;overflow:auto';
 const title=node('h2',entry?'MODIFIER L’ARCHIVE':'NOUVELLE ARCHIVE');d.append(title);
 const fields={};
 for(const [key,label,defaultValue] of [['id','Identifiant',existing.id||suggested],['date','Date',existing.date||''],['title','Titre',existing.title||''],['summary','Résumé',existing.summary||''],['location','Lieu',existing.location||'Seattle // Localisation masquée']]){
  const wrap=node('label',label);wrap.style.cssText='display:block;margin:12px 0;font-size:12px;color:#b9a4b0';
  const input=node('input','',defaultValue);input.style.cssText='display:block;width:100%;margin-top:5px;padding:10px;background:#1d202a;color:white;border:1px solid #64505c';input.required=true;
  if(key==='id')input.readOnly=true;
  wrap.append(input);fields[key]=input;d.append(wrap);
 }
 const encrypted=!!existing.private;
 const privateWrap=node('label','🔒 Entrée privée (transcription chiffrée)');privateWrap.style.cssText='display:block;margin:14px 0';
 const privateToggle=document.createElement('input');privateToggle.type='checkbox';privateToggle.checked=encrypted;privateToggle.disabled=encrypted;privateWrap.prepend(privateToggle);d.append(privateWrap);
 const passwordWrap=node('label',encrypted?'Mot de passe actuel pour déchiffrer':'Mot de passe de chiffrement');passwordWrap.style.cssText='display:block;margin:10px 0';
 const password=node('input','');password.type='password';password.autocomplete='new-password';password.placeholder=encrypted?'Mot de passe actuel':'Choisir un mot de passe';password.style.cssText='display:block;width:100%;padding:10px;background:#1d202a;color:white';passwordWrap.append(password);d.append(passwordWrap);
 const passwordConfirm=node('input','');passwordConfirm.type='password';passwordConfirm.autocomplete='new-password';passwordConfirm.placeholder='Confirmer le mot de passe';passwordConfirm.style.cssText='display:block;width:100%;padding:10px;background:#1d202a;color:white';d.append(passwordConfirm);
 const syncPrivate=()=>{passwordWrap.hidden=!privateToggle.checked;passwordConfirm.hidden=!privateToggle.checked||encrypted};privateToggle.addEventListener('change',syncPrivate);syncPrivate();
 const label=node('label','Transcription : une ligne par paragraphe ; préfixer les didascalies par [stage]');
 label.style.cssText='display:block;margin-top:14px;font-size:12px;color:#b9a4b0';
 const body=node('textarea','',encrypted?'':(existing.lines||[]).map(l=>(l.type==='stage'?'[stage] ':'')+l.text).join('\n'));
 body.rows=12;body.style.cssText='display:block;width:100%;margin-top:8px;padding:12px;background:#1d202a;color:white;border:1px solid #64505c';
 if(encrypted){body.disabled=true;body.placeholder='Saisir le mot de passe actuel pour déverrouiller la transcription';}
 label.append(body);d.append(label);
 const status=node('p','');status.style.color='#dba1a9';d.append(status);
 let unlocked=!encrypted;
 if(encrypted){
  const unlock=node('button','DÉVERROUILLER LA TRANSCRIPTION');unlock.type='button';unlock.style.cssText='padding:10px;margin-top:10px;background:#35232e;color:white;border:1px solid #986878';
  unlock.onclick=async()=>{if(!password.value){status.textContent='Saisis le mot de passe actuel.';return}unlock.disabled=true;try{const lines=await decryptLines(existing,password.value);body.value=lines.map(l=>(l.type==='stage'?'[stage] ':'')+l.text).join('\n');body.disabled=false;unlocked=true;status.textContent='Transcription déverrouillée. Modifications possibles.';unlock.remove()}catch(e){status.textContent='Mot de passe incorrect ou déchiffrement impossible.';unlock.disabled=false}};
  d.append(unlock);
 }
 const actions=node('div');actions.style.cssText='display:flex;gap:12px;margin-top:18px';
 const save=node('button','ENREGISTRER'),cancel=node('button','ANNULER');
 for(const b of [save,cancel])b.style.cssText='padding:10px 16px;background:#35232e;color:white;border:1px solid #986878;cursor:pointer';
 cancel.onclick=()=>d.close();
 save.onclick=async()=>{
  const result={...existing};
  for(const [k,v] of Object.entries(fields))result[k]=v.value.trim();
  if(!new RegExp('^'+prefix+'[0-9]{3,}$').test(result.id)||!result.title||!result.date){status.textContent='Identifiant '+prefix+'###, titre et date requis.';return}
  if(encrypted&&!unlocked){status.textContent='Déverrouille la transcription avant d’enregistrer.';return}
  const lines=body.value.split(/\r?\n/).filter(x=>x.trim()).map(line=>line.startsWith('[stage]')?{type:'stage',text:line.slice(7).trim()}:{type:'speech',text:line.trim()});
  if(privateToggle.checked){
   if(!password.value||(!encrypted&&password.value!==passwordConfirm.value)){status.textContent='Saisis un mot de passe valide et sa confirmation.';return}
   try{Object.assign(result,await encryptLines(lines,password.value));result.private=true;delete result.lines}
   catch(err){status.textContent='Chiffrement impossible : '+err.message;return}
  }else{result.private=false;result.lines=lines;delete result.salt;delete result.iv;delete result.ciphertext}

  save.disabled=true;
  const {error}=entry
   ?await client.from(table).update({entry_data:result}).eq('id',result.id)
   :await client.from(table).insert({id:result.id,entry_data:result});
  if(error){status.textContent='Enregistrement impossible : '+error.message;save.disabled=false;return}
  d.close();onSaved();
 };
 actions.append(save,cancel);
 if(entry){
  const del=node('button','SUPPRIMER');del.style.cssText='padding:10px 16px;background:#642b36;color:white;border:1px solid #c27b83;cursor:pointer;margin-left:auto';
  del.onclick=async()=>{
   if(!confirm('Supprimer définitivement '+existing.id+' ? Cette action est irréversible.'))return;
   del.disabled=true;
   const {error}=await client.from(table).delete().eq('id',existing.id);
   if(error){status.textContent='Suppression impossible : '+error.message;del.disabled=false;return}
   d.close();onSaved();
  };
  actions.append(del);
 }
 d.append(actions);document.body.append(d);d.addEventListener('close',()=>d.remove());d.showModal();
}
window.RunnerJournal={init,load,edit,get canEdit(){return authorized}};
window.VesperJournal=window.RunnerJournal;
})();
).test(result.id)||!result.title||!result.date){status.textContent='Identifiant '+prefix+'###, titre et date requis.';return}
  if(!encrypted){
   const lines=body.value.split(/\r?\n/).filter(x=>x.trim()).map(line=>line.startsWith('[stage]')?{type:'stage',text:line.slice(7).trim()}:{type:'speech',text:line.trim()});
   if(privateToggle.checked){
    if(!password.value||password.value!==passwordConfirm.value){status.textContent='Saisis un mot de passe et une confirmation identique.';return}
    try{Object.assign(result,await encryptLines(lines,password.value));result.private=true;delete result.lines}
    catch(err){status.textContent='Chiffrement impossible : '+err.message;return}
   }else{result.private=false;result.lines=lines}
  }
  save.disabled=true;
  const {error}=await client.from(table).upsert({id:result.id,entry_data:result},{onConflict:'id'});
  if(error){status.textContent='Enregistrement impossible : '+error.message;save.disabled=false;return}
  d.close();onSaved();
 };
 actions.append(save,cancel);
 if(entry){
  const del=node('button','SUPPRIMER');del.style.cssText='padding:10px 16px;background:#642b36;color:white;border:1px solid #c27b83;cursor:pointer;margin-left:auto';
  del.onclick=async()=>{
   if(!confirm('Supprimer définitivement '+existing.id+' ? Cette action est irréversible.'))return;
   del.disabled=true;
   const {error}=await client.from(table).delete().eq('id',existing.id);
   if(error){status.textContent='Suppression impossible : '+error.message;del.disabled=false;return}
   d.close();onSaved();
  };
  actions.append(del);
 }
 d.append(actions);document.body.append(d);d.addEventListener('close',()=>d.remove());d.showModal();
}
window.VesperJournal={init,load,edit,get canEdit(){return authorized}};
})();
).test(result.id)||!result.title||!result.date){status.textContent='Identifiant '+prefix+'###, titre et date requis.';return}
  if(encrypted&&!unlocked){status.textContent='Déverrouille la transcription avant d’enregistrer.';return}
  const lines=body.value.split(/\r?\n/).filter(x=>x.trim()).map(line=>line.startsWith('[stage]')?{type:'stage',text:line.slice(7).trim()}:{type:'speech',text:line.trim()});
  if(privateToggle.checked){
   if(!password.value||(!encrypted&&password.value!==passwordConfirm.value)){status.textContent='Saisis un mot de passe valide et sa confirmation.';return}
   try{Object.assign(result,await encryptLines(lines,password.value));result.private=true;delete result.lines}
   catch(err){status.textContent='Chiffrement impossible : '+err.message;return}
  }else{result.private=false;result.lines=lines;delete result.salt;delete result.iv;delete result.ciphertext}

  save.disabled=true;
  const {error}=entry
   ?await client.from(table).update({entry_data:result}).eq('id',result.id)
   :await client.from(table).insert({id:result.id,entry_data:result});
  if(error){status.textContent='Enregistrement impossible : '+error.message;save.disabled=false;return}
  d.close();onSaved();
 };
 actions.append(save,cancel);
 if(entry){
  const del=node('button','SUPPRIMER');del.style.cssText='padding:10px 16px;background:#642b36;color:white;border:1px solid #c27b83;cursor:pointer;margin-left:auto';
  del.onclick=async()=>{
   if(!confirm('Supprimer définitivement '+existing.id+' ? Cette action est irréversible.'))return;
   del.disabled=true;
   const {error}=await client.from(table).delete().eq('id',existing.id);
   if(error){status.textContent='Suppression impossible : '+error.message;del.disabled=false;return}
   d.close();onSaved();
  };
  actions.append(del);
 }
 d.append(actions);document.body.append(d);d.addEventListener('close',()=>d.remove());d.showModal();
}
window.RunnerJournal={init,load,edit,get canEdit(){return authorized}};
window.VesperJournal=window.RunnerJournal;
})();
).test(result.id)||!result.title||!result.date){status.textContent='Identifiant '+prefix+'###, titre et date requis.';return}
  if(!encrypted){
   const lines=body.value.split(/\r?\n/).filter(x=>x.trim()).map(line=>line.startsWith('[stage]')?{type:'stage',text:line.slice(7).trim()}:{type:'speech',text:line.trim()});
   if(privateToggle.checked){
    if(!password.value||password.value!==passwordConfirm.value){status.textContent='Saisis un mot de passe et une confirmation identique.';return}
    try{Object.assign(result,await encryptLines(lines,password.value));result.private=true;delete result.lines}
    catch(err){status.textContent='Chiffrement impossible : '+err.message;return}
   }else{result.private=false;result.lines=lines}
  }
  save.disabled=true;
  const {error}=await client.from(table).upsert({id:result.id,entry_data:result},{onConflict:'id'});
  if(error){status.textContent='Enregistrement impossible : '+error.message;save.disabled=false;return}
  d.close();onSaved();
 };
 actions.append(save,cancel);
 if(entry){
  const del=node('button','SUPPRIMER');del.style.cssText='padding:10px 16px;background:#642b36;color:white;border:1px solid #c27b83;cursor:pointer;margin-left:auto';
  del.onclick=async()=>{
   if(!confirm('Supprimer définitivement '+existing.id+' ? Cette action est irréversible.'))return;
   del.disabled=true;
   const {error}=await client.from(table).delete().eq('id',existing.id);
   if(error){status.textContent='Suppression impossible : '+error.message;del.disabled=false;return}
   d.close();onSaved();
  };
  actions.append(del);
 }
 d.append(actions);document.body.append(d);d.addEventListener('close',()=>d.remove());d.showModal();
}
window.VesperJournal={init,load,edit,get canEdit(){return authorized}};
})();
