-- ============================================
-- SofiGlow — Configuración de Supabase
-- Copia y pega TODO este archivo en el SQL Editor
-- de tu proyecto de Supabase, y dale "Run".
-- ============================================

-- 1. Crear la tabla de productos
create table if not exists products (
  id text primary key,
  name text not null,
  price integer,
  category text not null,
  image text not null
);

-- 2. Activar seguridad a nivel de fila (RLS)
alter table products enable row level security;

-- 3. Cualquier persona (clientes del sitio) puede LEER los productos
create policy "Cualquiera puede ver productos"
on products for select
to anon, authenticated
using (true);

-- 4. Solo un usuario que haya iniciado sesión (el admin) puede EDITAR precios
create policy "Solo usuarios logueados pueden actualizar productos"
on products for update
to authenticated
using (true)
with check (true);

-- Con esto: el sitio público (index.html) solo puede leer.
-- Solo quien inicie sesión en admin.html (con el usuario y contraseña
-- que crees en Authentication) puede cambiar precios.
