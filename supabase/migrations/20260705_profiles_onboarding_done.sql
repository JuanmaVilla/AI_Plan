-- 2026-07-05 · Recordar por usuario si ya completó la guía interactiva.
-- Aplicado en remoto vía MCP: profiles_onboarding_done.
alter table profiles add column onboarding_done boolean not null default false;
