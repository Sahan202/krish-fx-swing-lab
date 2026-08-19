-- Run this once in Supabase SQL Editor after schema.sql.
insert into public.lessons (course_id, title, description, lesson_order)
select id, 'Welcome to Swing Trading', 'Understand how the course works and set your learning goals.', 1 from public.courses where slug = 'swing-trading-foundations'
union all select id, 'Risk Management Essentials', 'Learn position sizing, stop losses, and protecting your capital.', 2 from public.courses where slug = 'swing-trading-foundations'
union all select id, 'Building a Trading Plan', 'Create a repeatable process for every trade.', 3 from public.courses where slug = 'swing-trading-foundations'
union all select id, 'Understanding Market Structure', 'Identify trends, ranges, and key decision points.', 1 from public.courses where slug = 'market-structure-mastery'
union all select id, 'Support and Resistance', 'Map the price levels that matter.', 2 from public.courses where slug = 'market-structure-mastery'
union all select id, 'Reading Price Action', 'Use candles and momentum to confirm a setup.', 3 from public.courses where slug = 'market-structure-mastery';
