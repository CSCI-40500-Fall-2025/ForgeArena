--
-- T A B L E S
--

-- USERS Table
-- Stores public user data. This is linked to the auth.users table.
CREATE TABLE users (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username text UNIQUE,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PARTIES Table
-- Stores data about user-created parties or teams.
CREATE TABLE parties (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  created_by uuid REFERENCES users ON DELETE SET NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PARTY_MEMBERS Table (Junction Table)
-- Links users to parties, establishing membership.
CREATE TABLE party_members (
  party_id bigint REFERENCES parties ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (party_id, user_id)
);

-- BOSSES Table
-- Stores data for raid bosses.
CREATE TABLE bosses (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  total_hp bigint NOT NULL
);

-- RAIDS Table
-- Represents an active raid event against a boss.
CREATE TABLE raids (
  id bigserial PRIMARY KEY,
  boss_id bigint REFERENCES bosses ON DELETE CASCADE NOT NULL,
  current_hp bigint NOT NULL,
  is_active boolean DEFAULT true,
  started_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at timestamptz
);

-- WORKOUTS Table
-- Stores individual workout logs for users.
CREATE TABLE workouts (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users ON DELETE CASCADE NOT NULL,
  exercise_type text NOT NULL,
  reps integer,
  duration_seconds integer,
  xp_gained integer NOT NULL,
  logged_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CONTRIBUTIONS Table
-- Logs damage/effort contributed by users to a raid.
CREATE TABLE contributions (
  id bigserial PRIMARY KEY,
  raid_id bigint REFERENCES raids ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users ON DELETE CASCADE NOT NULL,
  damage_dealt integer NOT NULL,
  contributed_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- REWARDS Table
-- (Future-use table for granting rewards for quests, raids, etc.)
CREATE TABLE rewards (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users ON DELETE CASCADE NOT NULL,
  description text,
  is_claimed boolean DEFAULT false,
  granted_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- F U N C T I O N S
--

-- compute_hp() - Example function
-- A simple function to calculate HP based on a user's level.
CREATE OR REPLACE FUNCTION compute_hp(level integer)
RETURNS integer AS $$
BEGIN
  RETURN 100 + (level * 10);
END;
$$ LANGUAGE plpgsql;

-- calc_damage() - Example function
-- Calculates damage based on a workout. Let's say 1 rep = 2 damage.
CREATE OR REPLACE FUNCTION calc_damage(reps integer, duration_seconds integer)
RETURNS integer AS $$
BEGIN
  -- A more complex formula could go here
  RETURN reps * 2;
END;
$$ LANGUAGE plpgsql;


--
-- R O W   L E V E L   S E C U R I T Y   (RLS)
--

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bosses ENABLE ROW LEVEL SECURITY;
ALTER TABLE raids ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

--
-- P O L I C I E S
--

-- USERS Policies:
-- 1. Users can see all other users' public profiles.
-- 2. Users can only update their own profile.
CREATE POLICY "Allow public read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- WORKOUTS Policies:
-- 1. A user can only see, create, update, or delete their own workouts.
CREATE POLICY "Allow full access to own workouts" ON workouts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- PARTIES & PARTY_MEMBERS Policies:
-- 1. Any authenticated user can create a party.
-- 2. Users can only see parties they are a member of.
-- 3. Users can only see members of parties they are also in.
CREATE POLICY "Authenticated users can create parties" ON parties FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can view parties they are a member of" ON parties FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM party_members WHERE party_members.party_id = parties.id AND party_members.user_id = auth.uid()
  )
);
CREATE POLICY "Users can manage their own party memberships" ON party_members FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view members of their own parties" ON party_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM party_members AS pm WHERE pm.party_id = party_members.party_id AND pm.user_id = auth.uid()
  )
);

-- RAIDS, BOSSES, CONTRIBUTIONS Policies:
-- For simplicity, let's allow all authenticated users to see raids and contribute.
-- More complex rules could restrict this to party members.
CREATE POLICY "Allow read access to all authenticated users" ON bosses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access to all authenticated users" ON raids FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to make contributions" ON contributions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can only see their own contributions" ON contributions FOR SELECT USING (auth.uid() = user_id);

-- REWARDS Policies:
-- 1. A user can only see and manage their own rewards.
CREATE POLICY "Allow full access to own rewards" ON rewards FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);