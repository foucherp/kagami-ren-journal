/* Création et modification des contacts personnels, droits contrôlés par Supabase RLS. */
(()=>{
'use strict';
const URL='https://alzcnmmxumcqiermylik.supabase.co';
const KEY='sb_publishable_jqzqRJzA-Bj5p7d_T7OMnw_h9hlzsV2';
const client=window.supabase?.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const E=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const fields=[['nom','NOM / ALIAS',true],['role','RÔLE / ACTIVITÉ',true],['identite_civile','IDENTITÉ CIVILE'],['metatype','MÉTATYPE'],['affiliation','AFFILIATION'],['statut','STATUT']];
async function member(){
 if(!client)throw Error('Module Supabase indisponible');
 const {data:{session}}=await client.auth.getSession();
 if(!session)return null;
 const {data,error}=await client.from('opinion_members').select('member_id').eq('email',session.user.email.toLowerCase()).maybeSingle();
 if(error)throw error;
 return data?.member_id||null;
}
function dialog(){let d=document.getElementById('contact-editor');if(!d){d=E('dialog','opinion-dialog contact-editor');document.body.append(d);d.addEventListener('click',e=>{if(e.target===d)d.close()})}d.replaceChildren();return d}
function msg(d,value,error=false){const p=E('p','opinion-message'+(error?' error':''),value);d.append(p);return p}
function line(d,label,type='text',value='',required=false){const box=E('label','contact-field'),title=E('span','',label),input=E(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;input.value=value??'';input.required=required;input.maxLength=type==='textarea'?8000:200;box.append(title,input);d.append(box);return input}
async function login(d){
 msg(d,'Connectez-vous avec votre adresse autorisée pour gérer vos contacts.');
 const f=E('form','opinion-form'),email=E('input');email.type='email';email.required=true;email.placeholder='votre@email.fr';
 const b=E('button','opinion-button','RECEVOIR MON LIEN');b.type='submit';f.append(email,b);
 f.onsubmit=async e=>{e.preventDefault();b.disabled=true;const {error}=await client.auth.signInWithOtp({email:email.value.trim(),options:{emailRedirectTo:location.href,shouldCreateUser:true}});msg(d,error?'Erreur : '+error.message:'Vérifiez votre boîte mail.',!!error);b.disabled=false};d.append(f);
}
async function openEditor(kind,existing,onSaved){
 const d=dialog();d.append(E('h3','',existing?'MODIFIER LE CONTACT':'NOUVEAU CONTACT'));
 if(!client){msg(d,'Connexion Supabase indisponible.',true);d.showModal();return}
 let owner;try{owner=await member()}catch(e){msg(d,e.message,true);d.showModal();return}
 if(!owner){await login(d);d.showModal();return}
 if(owner!==kind||(existing&&existing.kind!==owner)){msg(d,'Seul le propriétaire de ce carnet peut modifier ses contacts.',true);d.showModal();return}
 const info=existing?.info||{},inputs={};
 for(const [key,label,required] of fields)inputs[key]=line(d,label,'text',info[key]|| (key==='nom'?existing?.name:key==='role'?existing?.role:'')||'',required);
 inputs.description=line(d,'DESCRIPTION','textarea',info.description||'');
 inputs.reseau=line(d,'RÉSEAU (0 À 12)','number',info.reseau??'');
 inputs.loyaute=line(d,'LOYAUTÉ (0 À 12)','number',info.loyaute??'');
 for(const key of ['reseau','loyaute']){inputs[key].min='0';inputs[key].max='12';inputs[key].step='1'}
 const imageLabel=E('label','contact-field'),imageTitle=E('span','','PORTRAIT (JPEG, PNG OU WEBP, MAX. 5 MO)'),image=E('input');image.type='file';image.accept='image/jpeg,image/png,image/webp';imageLabel.append(imageTitle,image);d.append(imageLabel);
 const controls=E('div','opinion-controls'),cancel=E('button','opinion-button secondary','ANNULER'),save=E('button','opinion-button','PUBLIER');
 cancel.type=save.type='button';cancel.onclick=()=>d.close();
 save.onclick=async()=>{
  if(!inputs.nom.value.trim()||!inputs.role.value.trim()){msg(d,'Le nom et le rôle sont obligatoires.',true);return}
  const file=image.files[0];
  if(file&&(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5242880)){msg(d,'Portrait non accepté : JPEG, PNG ou WebP, maximum 5 Mo.',true);return}
  for(const k of ['reseau','loyaute'])if(inputs[k].value!==''&&(!Number.isInteger(Number(inputs[k].value))||Number(inputs[k].value)<0||Number(inputs[k].value)>12)){msg(d,k+' doit être compris entre 0 et 12.',true);return}
  save.disabled=true;
  const id=existing?.metadataKey||'contact:'+crypto.randomUUID();
  let imagePath=existing?.image_storage_path||null;
  try{
   if(file){
    const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
    imagePath='players/'+owner+'/'+id.slice(8)+'-'+crypto.randomUUID()+'.'+ext;
    const {error}=await client.storage.from('character-portraits').upload(imagePath,file,{contentType:file.type,upsert:false});
    if(error)throw error;
   }
   const infoNext={...info};
   for(const [key] of fields)infoNext[key]=inputs[key].value.trim();
   infoNext.description=inputs.description.value.trim();
   for(const key of ['reseau','loyaute'])infoNext[key]=inputs[key].value===''?null:Number(inputs[key].value);
   const payload={name:infoNext.nom,role:infoNext.role,info:infoNext,image_storage_path:imagePath};
   const query=existing?client.from('characters').update(payload).eq('character_id',id):client.from('characters').insert({...payload,character_id:id,kind:owner,owner_member_id:owner,image:'images/JohnDoe.jpeg'});
   const {error}=await query;if(error)throw error;
   d.close();onSaved();
  }catch(e){msg(d,'Enregistrement impossible : '+e.message,true);save.disabled=false}
 };
 controls.append(cancel,save);d.append(controls);d.showModal();
}
window.RunnerContacts={openEditor,member};
})();
