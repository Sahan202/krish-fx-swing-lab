-- Update the public course copy without changing its existing URL slug.
update public.courses
set description = 'A structured Forex mentorship combining Supply & Demand, Market Structure, Timeframe Confirmation, Liquidity, Price Action, and Fundamentals to build disciplined, repeatable, consistently profitable trading concepts'
where slug = 'swing-trading-foundations';
