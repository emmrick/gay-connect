select cron.alter_job(22, schedule := '* * * * *');
select cron.alter_job(10, schedule := '*/5 * * * *');
select cron.alter_job(26, schedule := '*/5 * * * *');
select cron.alter_job(25, schedule := '*/30 * * * *');
select cron.alter_job(1, schedule := '*/15 * * * *');
select cron.alter_job(7, schedule := '*/15 * * * *');