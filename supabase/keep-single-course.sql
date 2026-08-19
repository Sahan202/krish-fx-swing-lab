-- Keeps Swing Trading Foundations and removes the other seeded courses.
-- This cascades to their lessons and enrollments.
delete from public.courses
where slug <> 'swing-trading-foundations';
