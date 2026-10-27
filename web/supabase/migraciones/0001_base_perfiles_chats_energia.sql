-- SynthZ v2 · base: perfiles, chats, mensajes y energía diaria. Cada persona solo ve lo suyo (RLS).

create type public.color_perfil as enum ('aurora','azul','violeta','coral','menta','oro','rosa','noche');
create type public.rango as enum ('synther','symmetrix','zflow','prime');
create type public.rol_mensaje as enum ('user','assistant','system');

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  usuario text unique check (usuario ~ '^[a-z0-9_]{3,20}$'),
  nombre text not null default '' check (char_length(nombre) <= 40),
  bio text not null default '' check (char_length(bio) <= 160),
  pronombres text not null default '' check (char_length(pronombres) <= 20),
  color public.color_perfil not null default 'aurora',
  rango public.rango not null default 'synther',
  creado timestamptz not null default now()
);

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  dueno uuid not null references public.perfiles(id) on delete cascade,
  titulo text not null default 'Nuevo chat' check (char_length(titulo) <= 120),
  modo text not null default 'automatica' check (modo in ('automatica','una','comparar','sintesis')),
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
create index chats_dueno_actualizado on public.chats (dueno, actualizado desc);

create table public.mensajes (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  rol public.rol_mensaje not null,
  contenido text not null,
  ia text,
  proveedor text,
  respaldo boolean not null default false,
  fuentes jsonb not null default '[]'::jsonb,
  energia_milesimas integer not null default 0 check (energia_milesimas >= 0),
  creado timestamptz not null default now()
);
create index mensajes_chat_creado on public.mensajes (chat_id, creado);

create table public.energia_diaria (
  persona uuid not null references public.perfiles(id) on delete cascade,
  dia date not null,
  usada_milesimas integer not null default 0 check (usada_milesimas >= 0),
  primary key (persona, dia)
);

create function public.nuevo_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end $$;
create trigger al_crear_cuenta after insert on auth.users
  for each row execute function public.nuevo_perfil();

alter table public.perfiles enable row level security;
alter table public.chats enable row level security;
alter table public.mensajes enable row level security;
alter table public.energia_diaria enable row level security;

create policy perfil_propio_ver on public.perfiles for select to authenticated using (id = (select auth.uid()));
create policy perfil_propio_editar on public.perfiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()) and rango = (select p.rango from public.perfiles p where p.id = (select auth.uid())));

create policy chats_propios on public.chats for all to authenticated
  using (dueno = (select auth.uid())) with check (dueno = (select auth.uid()));

create policy mensajes_propios on public.mensajes for all to authenticated
  using (exists (select 1 from public.chats c where c.id = chat_id and c.dueno = (select auth.uid())))
  with check (exists (select 1 from public.chats c where c.id = chat_id and c.dueno = (select auth.uid())));

create policy energia_propia_ver on public.energia_diaria for select to authenticated using (persona = (select auth.uid()));

revoke all on public.perfiles, public.chats, public.mensajes, public.energia_diaria from anon, authenticated;
grant select, update (usuario, nombre, bio, pronombres, color) on public.perfiles to authenticated;
grant select, insert, update, delete on public.chats, public.mensajes to authenticated;
grant select on public.energia_diaria to authenticated;
