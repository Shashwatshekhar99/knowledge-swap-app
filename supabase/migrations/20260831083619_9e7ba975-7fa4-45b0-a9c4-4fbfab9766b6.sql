-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  college TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are readable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- SKILL OFFERINGS
CREATE TABLE public.skill_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  what_youll_learn TEXT,
  experience TEXT,
  session_duration INTEGER NOT NULL DEFAULT 60,
  format TEXT NOT NULL DEFAULT 'Online',
  availability TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT skill_offerings_format_check CHECK (format IN ('Online','In Person','Either')),
  CONSTRAINT skill_offerings_price_check CHECK (price >= 0)
);
CREATE INDEX skill_offerings_provider_idx ON public.skill_offerings(provider_id);
CREATE INDEX skill_offerings_category_idx ON public.skill_offerings(category);
CREATE INDEX skill_offerings_active_idx ON public.skill_offerings(is_active);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_offerings TO authenticated;
GRANT SELECT ON public.skill_offerings TO anon;
GRANT ALL ON public.skill_offerings TO service_role;
ALTER TABLE public.skill_offerings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active offerings are readable" ON public.skill_offerings FOR SELECT USING (is_active OR auth.uid() = provider_id);
CREATE POLICY "Users can create their own offerings" ON public.skill_offerings FOR INSERT TO authenticated WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Users can update their own offerings" ON public.skill_offerings FOR UPDATE TO authenticated USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Users can delete their own offerings" ON public.skill_offerings FOR DELETE TO authenticated USING (auth.uid() = provider_id);

-- SESSION REQUESTS
CREATE TABLE public.session_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES public.skill_offerings(id) ON DELETE CASCADE ON UPDATE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  message TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT session_requests_status_check CHECK (status IN ('pending','accepted','declined','completed','cancelled')),
  CONSTRAINT session_requests_not_self CHECK (requester_id <> provider_id)
);
CREATE INDEX session_requests_requester_idx ON public.session_requests(requester_id);
CREATE INDEX session_requests_provider_idx ON public.session_requests(provider_id);
GRANT SELECT, INSERT, UPDATE ON public.session_requests TO authenticated;
GRANT ALL ON public.session_requests TO service_role;
ALTER TABLE public.session_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can read requests" ON public.session_requests FOR SELECT TO authenticated USING (auth.uid() = requester_id OR auth.uid() = provider_id);
CREATE POLICY "Users can create requests as themselves" ON public.session_requests FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = requester_id
  AND auth.uid() <> provider_id
  AND EXISTS (SELECT 1 FROM public.skill_offerings o WHERE o.id = offering_id AND o.provider_id = session_requests.provider_id AND o.is_active)
);
CREATE POLICY "Participants can update requests" ON public.session_requests FOR UPDATE TO authenticated USING (auth.uid() = requester_id OR auth.uid() = provider_id) WITH CHECK (auth.uid() = requester_id OR auth.uid() = provider_id);

-- workflow enforcement
CREATE OR REPLACE FUNCTION public.enforce_request_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status IN ('completed','declined','cancelled') THEN
      RAISE EXCEPTION 'This request can no longer be changed';
    END IF;
    IF NEW.status IN ('accepted','declined') THEN
      IF OLD.status <> 'pending' THEN
        RAISE EXCEPTION 'Only pending requests can be accepted or declined';
      END IF;
      IF auth.uid() IS DISTINCT FROM OLD.provider_id THEN
        RAISE EXCEPTION 'Only the provider can accept or decline a request';
      END IF;
    ELSIF NEW.status = 'completed' THEN
      IF OLD.status <> 'accepted' THEN
        RAISE EXCEPTION 'Only accepted sessions can be completed';
      END IF;
    ELSIF NEW.status = 'cancelled' THEN
      IF OLD.status <> 'pending' THEN
        RAISE EXCEPTION 'Only pending requests can be cancelled';
      END IF;
      IF auth.uid() IS DISTINCT FROM OLD.requester_id THEN
        RAISE EXCEPTION 'Only the requester can cancel a request';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER session_requests_workflow BEFORE UPDATE ON public.session_requests FOR EACH ROW EXECUTE FUNCTION public.enforce_request_workflow();

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.session_requests(id) ON DELETE CASCADE ON UPDATE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reviews_unique_per_session UNIQUE (request_id, reviewer_id)
);
CREATE INDEX reviews_reviewee_idx ON public.reviews(reviewee_id);
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are readable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Participants can review completed sessions" ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = reviewer_id
  AND reviewer_id <> reviewee_id
  AND EXISTS (
    SELECT 1 FROM public.session_requests r
    WHERE r.id = request_id
      AND r.status = 'completed'
      AND auth.uid() IN (r.requester_id, r.provider_id)
      AND reviewee_id IN (r.requester_id, r.provider_id)
  )
);

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER skill_offerings_updated_at BEFORE UPDATE ON public.skill_offerings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- new user handling (also claims the seeded demo profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE demo_id CONSTANT UUID := '11111111-1111-4111-8111-111111111111';
BEGIN
  IF lower(NEW.email) = 'demo@skillswap.app' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = demo_id) THEN
    UPDATE public.profiles SET id = NEW.id, email = NEW.email WHERE id = demo_id;
    RETURN NEW;
  END IF;
  INSERT INTO public.profiles (id, full_name, email, college, bio)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'college',
    NEW.raw_user_meta_data->>'bio'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED DATA
INSERT INTO public.profiles (id, full_name, email, college, bio) VALUES
('11111111-1111-4111-8111-111111111111','Demo Student','demo@skillswap.app','Shri Ram College of Commerce','Final-year commerce student. I love breaking down finance concepts and helping juniors prep for placements.'),
('22222222-2222-4222-8222-222222222221','Ananya Sharma','ananya.sharma@example.edu','SRCC, Delhi University','Consulting enthusiast. 12+ case interviews and counting.'),
('22222222-2222-4222-8222-222222222222','Rohan Mehta','rohan.mehta@example.edu','IIT Bombay','CS senior. I like teaching people who think they can''t code.'),
('22222222-2222-4222-8222-222222222223','Priya Nair','priya.nair@example.edu','NIFT Bengaluru','Design student, Canva power user, obsessed with clean layouts.'),
('22222222-2222-4222-8222-222222222224','Arjun Desai','arjun.desai@example.edu','NMIMS Mumbai','Finance major, ex-investment banking intern.'),
('22222222-2222-4222-8222-222222222225','Sara Iqbal','sara.iqbal@example.edu','Ashoka University','Debate society president. Public speaking is a skill, not a talent.'),
('22222222-2222-4222-8222-222222222226','Kabir Singh','kabir.singh@example.edu','Manipal Institute of Technology','Street photographer and part-time gear nerd.'),
('22222222-2222-4222-8222-222222222227','Meera Krishnan','meera.krishnan@example.edu','Christ University Bengaluru','Marketing student running a 40k-follower page.'),
('22222222-2222-4222-8222-222222222228','Dev Patel','dev.patel@example.edu','BITS Pilani','Data analyst intern. SQL is my love language.');

INSERT INTO public.skill_offerings (id, provider_id, title, category, description, what_youll_learn, experience, session_duration, format, availability, price) VALUES
('33333333-3333-4333-8333-000000000001','11111111-1111-4111-8111-111111111111','Financial Statement Analysis','Finance','Learn to read a balance sheet, P&L and cash flow statement the way analysts actually do, using real annual reports.','Ratio analysis, quality of earnings, red flags in cash flow, and how to compare two companies quickly.','Interned at a boutique equity research firm and analysed 30+ annual reports.',60,'Online','Weekdays after 6 PM',0),
('33333333-3333-4333-8333-000000000002','11111111-1111-4111-8111-111111111111','Excel & Financial Modelling','Finance','From lookups and pivot tables to a clean three-statement model you can actually defend in an interview.','Shortcuts, INDEX-MATCH, pivot tables, model structure and simple DCF mechanics.','Built models for two case competitions and won one of them.',90,'Either','Weekends, 11 AM - 4 PM',0),
('33333333-3333-4333-8333-000000000003','22222222-2222-4222-8222-222222222221','Case Interview Preparation','Consulting','Mock case interviews with structured feedback so you stop rambling and start structuring.','Market sizing, profitability cases, structuring frameworks and interview communication.','Participated in 12+ consulting case interviews and helped juniors prepare for placements.',60,'Online','Weekdays after 7 PM',0),
('33333333-3333-4333-8333-000000000004','22222222-2222-4222-8222-222222222222','Python for Non-Coders','Technology','A gentle, zero-jargon start to Python for students from non-technical backgrounds.','Variables, loops, functions, and automating a boring spreadsheet task end to end.','Teaching assistant for an intro programming course for two semesters.',60,'Online','Tue & Thu evenings',0),
('33333333-3333-4333-8333-000000000005','22222222-2222-4222-8222-222222222223','Canva for Beginners','Design','Make posters, decks and social posts that look designed instead of decorated.','Layout basics, type pairing, colour systems, and building a reusable brand kit.','Designed collateral for 6 college fests and 2 student startups.',45,'Online','Weekends, afternoons',0),
('33333333-3333-4333-8333-000000000006','22222222-2222-4222-8222-222222222224','PowerPoint Storytelling','Communication','Turn a pile of slides into a story a jury or recruiter actually follows.','Slide narrative, the one-message-per-slide rule, data visuals and executive summaries.','Made the final round of three national B-school case competitions.',45,'Either','Weekdays after 8 PM',0),
('33333333-3333-4333-8333-000000000007','22222222-2222-4222-8222-222222222225','Public Speaking Without Panic','Communication','Practical drills for people whose voice shakes the moment a mic appears.','Breathing and pacing, opening lines, handling blanks, and Q&A composure.','Three years in the debate society, 20+ competitive speeches.',45,'In Person','Mon, Wed, Fri mornings',0),
('33333333-3333-4333-8333-000000000008','22222222-2222-4222-8222-222222222226','Photography Basics','Creative','Get off auto mode. Works with a DSLR, mirrorless or just your phone.','Exposure triangle, composition, natural light and a simple editing workflow.','Shot two campus fests and sell prints at local markets.',60,'In Person','Weekend mornings',0),
('33333333-3333-4333-8333-000000000009','22222222-2222-4222-8222-222222222227','Digital Marketing Basics','Marketing','How organic and paid growth actually work, explained with campaigns I have run.','Funnels, content calendars, basic ad targeting and reading your analytics.','Grew a student community page from 0 to 40k followers.',60,'Online','Weekdays after 6 PM',0),
('33333333-3333-4333-8333-000000000010','22222222-2222-4222-8222-222222222227','LinkedIn Profile Optimization','Career','A working session where we rewrite your headline, about section and experience bullets together.','Keyword-friendly headlines, achievement bullets, and outreach messages that get replies.','Reviewed 50+ profiles during placement season.',30,'Online','Flexible, most evenings',0),
('33333333-3333-4333-8333-000000000011','22222222-2222-4222-8222-222222222228','SQL Fundamentals','Technology','Query a real database from your first ten minutes. No setup headaches.','SELECT, JOINs, GROUP BY, subqueries and thinking in tables.','Data analyst intern writing production SQL daily.',60,'Online','Weeknights',0),
('33333333-3333-4333-8333-000000000012','22222222-2222-4222-8222-222222222226','Guitar for Beginners','Lifestyle','Four chords, one strumming pattern, and you can play most songs you like.','Chord shapes, rhythm, transitions and practising without frustration.','Playing for 7 years, taught 5 friends from scratch.',45,'In Person','Saturday afternoons',0),
('33333333-3333-4333-8333-000000000013','22222222-2222-4222-8222-222222222222','DSA Interview Warm-up','Academics','Pattern-based problem solving for internship interviews, not a 500-problem grind.','Arrays, hashing, two pointers, recursion patterns and how to talk while you solve.','Cleared internship interviews at two product companies.',60,'Online','Sunday mornings',0);

INSERT INTO public.session_requests (id, offering_id, requester_id, provider_id, message, preferred_date, preferred_time, status, created_at) VALUES
('44444444-4444-4444-8444-000000000001','33333333-3333-4333-8333-000000000002','22222222-2222-4222-8222-222222222225','11111111-1111-4111-8111-111111111111','I have a finance case competition next month and my Excel is honestly weak. Could you walk me through model structure?',CURRENT_DATE + 3,'6:00 PM','pending', now() - interval '2 days'),
('44444444-4444-4444-8444-000000000002','33333333-3333-4333-8333-000000000001','22222222-2222-4222-8222-222222222223','11111111-1111-4111-8111-111111111111','Design student here trying to understand annual reports for a brand strategy project. Total beginner!',CURRENT_DATE + 5,'7:30 PM','pending', now() - interval '1 day'),
('44444444-4444-4444-8444-000000000003','33333333-3333-4333-8333-000000000003','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222221','I am preparing for consulting placements and would like help with market sizing.',CURRENT_DATE + 2,'8:00 PM','accepted', now() - interval '4 days'),
('44444444-4444-4444-8444-000000000004','33333333-3333-4333-8333-000000000011','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222228','Need SQL for a summer analytics internship. Comfortable with Excel, zero SQL.',CURRENT_DATE - 4,'7:00 PM','completed', now() - interval '10 days'),
('44444444-4444-4444-8444-000000000005','33333333-3333-4333-8333-000000000002','22222222-2222-4222-8222-222222222227','11111111-1111-4111-8111-111111111111','Marketing student who wants to stop being scared of spreadsheets.',CURRENT_DATE - 6,'5:00 PM','completed', now() - interval '14 days');

INSERT INTO public.reviews (request_id, reviewer_id, reviewee_id, rating, comment) VALUES
('44444444-4444-4444-8444-000000000004','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222228',5,'Dev explained JOINs better than my entire semester course. Left with a query I could actually reuse.'),
('44444444-4444-4444-8444-000000000005','22222222-2222-4222-8222-222222222227','11111111-1111-4111-8111-111111111111',5,'Super patient and did not make me feel stupid for asking basic Excel questions.'),
('44444444-4444-4444-8444-000000000004','22222222-2222-4222-8222-222222222228','11111111-1111-4111-8111-111111111111',4,'Came prepared with exactly what he wanted to learn. Easy session.');