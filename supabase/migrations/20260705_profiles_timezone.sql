-- 2026-07-05 · Zona horaria del usuario (para calcular "hoy"/semana bien).
-- El server corre en UTC; sin esto, a la noche "hoy" salta al día siguiente.
-- Aplicado en remoto vía MCP: profiles_timezone.
alter table profiles add column timezone text not null default 'America/Argentina/Buenos_Aires';
