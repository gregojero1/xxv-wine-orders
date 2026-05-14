-- Fonction RPC pour vérifier le mot de passe admin
-- À ajouter dans une migration Supabase

create or replace function check_admin_password(input_password text)
returns boolean
language plpgsql
security definer
as $$
declare
  stored_hash text;
begin
  select password_hash into stored_hash
  from admin_users
  where username = 'admin'
  limit 1;

  if stored_hash is null then
    return false;
  end if;

  return stored_hash = crypt(input_password, stored_hash);
end;
$$;

-- Changer le mot de passe admin :
-- update admin_users set password_hash = crypt('nouveau_mot_de_passe', gen_salt('bf')) where username = 'admin';

