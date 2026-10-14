// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_init.sql';
import m0001 from './0001_baseline_test.sql';
import m0002 from './0002_training_plan.sql';
import m0003 from './0003_baseline_tests.sql';
import m0004 from './0004_training_animation.sql';
import m0005 from './0005_striped_blazing_skull.sql';
import m0006 from './0006_pale_nemesis.sql';
import m0007 from './0007_striped_wendell_vaughn.sql';
import m0008 from './0008_damp_vivisector.sql';
import m0009 from './0009_outstanding_gravity.sql';
import m0010 from './0010_plan_session.sql';
import m0011 from './0011_session_source.sql';
import m0012 from './0012_brown_the_call.sql';

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
    m0004,
    m0005,
    m0006,
    m0007,
    m0008,
    m0009,
    m0010,
    m0011,
    m0012,
  }
}
