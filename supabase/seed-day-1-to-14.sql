-- Adds a 14-day swing trading path to Swing Trading Foundations.
-- Run once in Supabase SQL Editor, then add each VdoCipher ID from the Admin page.
with course as (select id from public.courses where slug = 'swing-trading-foundations')
update public.lessons l set title = 'Day ' || l.lesson_order, description = 'Krish FX Swing Lab - Day ' || l.lesson_order where l.course_id = (select id from course) and l.lesson_order between 1 and 3;

insert into public.lessons (course_id, title, description, lesson_order)
select c.id, 'Day ' || d.day, 'Krish FX Swing Lab - Day ' || d.day, d.day
from public.courses c cross join generate_series(4, 14) as d(day)
where c.slug = 'swing-trading-foundations'
and not exists (select 1 from public.lessons l where l.course_id = c.id and l.lesson_order = d.day);
