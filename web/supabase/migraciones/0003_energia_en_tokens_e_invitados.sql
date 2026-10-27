-- La energía se cuenta en tokens (100 % = 25.000 al día). Invitados se cuentan por huella (dispositivo + conexión).
alter table public.energia_diaria rename column usada_milesimas to usada_tokens;
alter table public.mensajes rename column energia_milesimas to energia_tokens;

create table public.uso_invitados (
  huella text not null check (char_length(huella) between 8 and 80),
  dia date not null,
  usada_tokens integer not null default 0 check (usada_tokens >= 0),
  mensajes integer not null default 0 check (mensajes >= 0),
  primary key (huella, dia)
);
alter table public.uso_invitados enable row level security;
revoke all on public.uso_invitados from anon, authenticated;

create function public.gastar_energia(p_persona uuid, p_tokens integer)
returns integer language sql security invoker set search_path = '' as $$
  insert into public.energia_diaria (persona, dia, usada_tokens)
  values (p_persona, (now() at time zone 'America/Bogota')::date, greatest(p_tokens, 0))
  on conflict (persona, dia) do update set usada_tokens = public.energia_diaria.usada_tokens + greatest(p_tokens, 0)
  returning usada_tokens;
$$;

create function public.gastar_invitado(p_huella text, p_tokens integer, p_mensaje boolean)
returns table (usada_tokens integer, mensajes integer) language sql security invoker set search_path = '' as $$
  insert into public.uso_invitados as u (huella, dia, usada_tokens, mensajes)
  values (p_huella, (now() at time zone 'America/Bogota')::date, greatest(p_tokens, 0), case when p_mensaje then 1 else 0 end)
  on conflict (huella, dia) do update
    set usada_tokens = u.usada_tokens + greatest(p_tokens, 0),
        mensajes = u.mensajes + case when p_mensaje then 1 else 0 end
  returning u.usada_tokens, u.mensajes;
$$;

revoke all on function public.gastar_energia(uuid, integer) from public, anon, authenticated;
revoke all on function public.gastar_invitado(text, integer, boolean) from public, anon, authenticated;
grant execute on function public.gastar_energia(uuid, integer) to service_role;
grant execute on function public.gastar_invitado(text, integer, boolean) to service_role;
grant select, insert, update on public.uso_invitados to service_role;
grant select, insert, update on public.energia_diaria to service_role;
