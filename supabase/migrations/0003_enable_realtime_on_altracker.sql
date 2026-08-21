-- Cross-device sync: without membership in this publication the client's
-- postgres_changes subscription silently receives nothing.
alter publication supabase_realtime add table altracker.schools;
alter publication supabase_realtime add table altracker.teachers;
alter publication supabase_realtime add table altracker.classes;
alter publication supabase_realtime add table altracker.lessons;

-- REPLICA IDENTITY FULL puts the whole old row in DELETE events. With the
-- default (primary key only) a subscription filtered on user_id never matches
-- a delete, so removals would not propagate to your other devices.
alter table altracker.schools  replica identity full;
alter table altracker.teachers replica identity full;
alter table altracker.classes  replica identity full;
alter table altracker.lessons  replica identity full;
