-- Table: users
CREATE TABLE users (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255),
    display_name   VARCHAR(255) NOT NULL UNIQUE,
    avatar_url     TEXT DEFAULT '/uploads/default.png',
    is_online      INTEGER DEFAULT 0,
    wins           INTEGER DEFAULT 0,
    losses         INTEGER DEFAULT 0,
    google_id      VARCHAR(255) UNIQUE,
    two_factor_method TEXT DEFAULT 'authenticator',
    phone_number   VARCHAR(20) NULL,
    two_factor_enabled INTEGER DEFAULT 0,
    two_factor_secret VARCHAR(255),
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table pour stocker les codes temporaires (SMS ou email)
CREATE TABLE two_factor_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code VARCHAR(6) NOT NULL,
    method TEXT NOT NULL, -- 'sms' | 'email'
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
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
    name         TEXT NOT NULL,
    game_id      INTEGER NOT NULL,
    status       TEXT DEFAULT 'pending', -- pending | ongoing | finished
    started_at   DATETIME,
    ended_at     DATETIME,
    winner_id    INTEGER,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (game_id) REFERENCES games(id)
);
CREATE TABLE participants (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    name          TEXT NOT NULL,
    seed          INTEGER, -- position initiale dans l’arbre (1, 2, 3, etc.)
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);
CREATE TABLE tournament_matches (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id   INTEGER NOT NULL,
    round           INTEGER NOT NULL,
    match_number    INTEGER NOT NULL,  -- numéro du match dans le round
    player1_id      INTEGER,
    player2_id      INTEGER,
    winner_id       INTEGER,
    next_match_id   INTEGER,  -- lien vers le match suivant
    position_in_next INTEGER, -- 1 = joueur1 du prochain match, 2 = joueur2
    finished        INTEGER DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (player1_id) REFERENCES participants(id),
    FOREIGN KEY (player2_id) REFERENCES participants(id),
    FOREIGN KEY (winner_id) REFERENCES participants(id),
    FOREIGN KEY (next_match_id) REFERENCES tournament_matches(id)
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
    played_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id)
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