-- Marca de tarea terminada (tacha, no borra). Independiente del avance 0–100%.
alter table public.tasks
  add column if not exists done boolean not null default false;
