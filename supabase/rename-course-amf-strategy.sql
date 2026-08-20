-- Renames the existing course without changing its URL slug.
update public.courses
set title = 'AMF Strategy'
where slug = 'swing-trading-foundations';
