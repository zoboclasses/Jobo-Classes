-- Sample data. Run after 0001_init.sql.
insert into public.courses (id, title, description, price_inr, is_published) values
  ('11111111-1111-1111-1111-111111111111', 'SSC CGL Complete Course', 'Full preparation for SSC CGL: Quant, Reasoning, English and GK with video lectures, mock tests and notes.', 1999, true);

insert into public.videos (id, course_id, title, duration_minutes, position, is_free) values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Introduction & Strategy (Free Demo)', 18, 1, true),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Quant: Percentages Masterclass', 42, 2, false);
insert into public.video_sources (video_id, url) values
  ('22222222-2222-2222-2222-222222222221', 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
  ('22222222-2222-2222-2222-222222222222', 'https://www.youtube.com/embed/dQw4w9WgXcQ');

insert into public.notes (id, course_id, title, position, is_free) values
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'Sample Notes: Number System', 1, true),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'Complete Quant Formula Book', 2, false);
insert into public.note_files (note_id, url) values
  ('33333333-3333-3333-3333-333333333331', 'https://example.com/sample-notes.pdf'),
  ('33333333-3333-3333-3333-333333333332', 'https://example.com/full-notes.pdf');

insert into public.mock_tests (id, course_id, title, duration_minutes, position, is_free) values
  ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'Free Mini Mock Test', 10, 1, true);
insert into public.questions (test_id, question, options, correct_index, marks, negative_marks, position) values
  ('44444444-4444-4444-4444-444444444441', 'What is 25% of 480?', '["100","110","120","130"]', 2, 2, 0.5, 1),
  ('44444444-4444-4444-4444-444444444441', 'Synonym of "abundant"?', '["scarce","plentiful","rare","empty"]', 1, 2, 0.5, 2);

-- Make yourself admin (find your user id in Supabase Auth > Users):
-- update public.profiles set role = 'admin' where id = 'YOUR-USER-UUID';
