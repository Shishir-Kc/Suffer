CREATE TABLE reports (
 id TEXT PRIMARY KEY, trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
 reported_user_id TEXT NOT NULL REFERENCES users(id), filed_by_user_id TEXT NOT NULL REFERENCES users(id),
 reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')), created_at INTEGER NOT NULL
);
CREATE TABLE report_approvals (
 id TEXT PRIMARY KEY, report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
 approver_user_id TEXT NOT NULL REFERENCES users(id), created_at INTEGER NOT NULL,
 UNIQUE(report_id,approver_user_id)
);
CREATE TABLE penalties (
 id TEXT PRIMARY KEY, trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id), minutes INTEGER NOT NULL CHECK(minutes > 0),
 source TEXT NOT NULL CHECK(source IN ('tbq_failure','report')), source_id TEXT NOT NULL, created_at INTEGER NOT NULL,
 UNIQUE(source,source_id)
);
