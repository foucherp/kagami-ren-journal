/* Affichage discret du membre authentifié sur les pages publiques. */
(async()=>{
 try{
  if(!window.supabase?.createClient)return;
  const c=window.supabase.createClient('https://alzcnmmxumcqiermylik.supabase.co','sb_publishable_jqzqRJzA-Bj5p7d_T7OMnw_h9hlzsV2',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const {data:{session}}=await c.auth.getSession();
  if(!session?.user?.email)return;
  const {data,error}=await c.from('opinion_members').select('member_id').eq('email',session.user.email.toLowerCase()).maybeSingle();
  if(error||!data?.member_id)return;
  const name=data.member_id.charAt(0).toUpperCase()+data.member_id.slice(1);
  const status=document.querySelector('.top .status');
  if(status){status.append(document.createTextNode(' : '+name+' actif'));return;}
  const home=document.getElementById('authenticated-member');
  if(home){home.textContent='LIAISON ISOLÉE : '+name+' actif';home.hidden=false;}
 }catch(e){console.warn('Statut de connexion indisponible',e)}
})();