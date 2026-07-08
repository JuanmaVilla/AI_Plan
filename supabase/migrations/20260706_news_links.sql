-- Novedades: agregar links de resumen del avance y del trabajo en sí.
-- summary_link → link a un resumen (Excel, Google Docs, n8n, etc.)
-- work_link    → link para ver el trabajo en sí.
alter table news_entries add column if not exists summary_link text;
alter table news_entries add column if not exists work_link    text;
