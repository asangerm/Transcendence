-- Table: users
CREATE TABLE users (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255),
    display_name   VARCHAR(255) NOT NULL UNIQUE,
    avatar_url     TEXT DEFAULT '/uploads/avatars/default.png',
    is_online      INTEGER DEFAULT 0,
    wins           INTEGER DEFAULT 0,
    losses         INTEGER DEFAULT 0,
    google_id      VARCHAR(255) UNIQUE,
    two_factor_enabled INTEGER DEFAULT 0,
    two_factor_secret VARCHAR(255),
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: friends
CREATE TABLE friends (
    user_id    INTEGER NOT NULL,
    friend_id  INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id)
);

-- Table: games
CREATE TABLE games (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

-- Table: tournaments
CREATE TABLE tournaments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         VARCHAR(255) NOT NULL,
    game_id      INTEGER NOT NULL,
    started_at   DATETIME,
    ended_at     DATETIME,
    finished     INTEGER DEFAULT 0,
    winner_id    INTEGER,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (winner_id) REFERENCES users(id)
);

-- Table: matches
CREATE TABLE matches (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id             INTEGER NOT NULL,
    player1_id          INTEGER NOT NULL,
    player2_id          INTEGER NOT NULL,
    winner_id           INTEGER,
    score_p1            INTEGER NOT NULL,
    score_p2            INTEGER NOT NULL,
    tournament_id       INTEGER,
    winner_to_match_id  INTEGER,
    loser_to_match_id   INTEGER,
    played_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (winner_to_match_id) REFERENCES matches(id),
    FOREIGN KEY (loser_to_match_id) REFERENCES matches(id)
);

-- Table: high_scores
CREATE TABLE high_scores (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id     INTEGER NOT NULL,
    user_id     INTEGER NOT NULL,
    score       INTEGER NOT NULL,
    achieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table: sessions
CREATE TABLE sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    refresh_token   VARCHAR(500) NOT NULL UNIQUE,
    expires_at      DATETIME NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: friend_requests
CREATE TABLE friend_requests (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id       INTEGER NOT NULL,
    receiver_id     INTEGER NOT NULL,
    status          VARCHAR(20) DEFAULT 'pending',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    UNIQUE(sender_id, receiver_id)
);