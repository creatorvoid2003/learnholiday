
revoke all on table public.learning_classes from anon, authenticated;
revoke all on table public.learning_class_memberships from anon, authenticated;
revoke all on table public.learning_class_invites from anon, authenticated;

grant select, insert, update, delete on table public.learning_classes to authenticated;
grant select on table public.learning_class_memberships to authenticated;
grant select on table public.learning_class_invites to authenticated;
