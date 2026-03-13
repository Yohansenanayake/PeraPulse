CREATE TABLE user_profile (
    id UUID PRIMARY KEY,
    keycloak_sub VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL,
    display_name VARCHAR(255),
    email VARCHAR(255),
    department VARCHAR(255),
    grad_year INT,
    bio TEXT,
    linkedin_url VARCHAR(500),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profile_role ON user_profile (role);

CREATE TABLE role_request (
    id UUID PRIMARY KEY,
    user_sub VARCHAR(255) NOT NULL,
    requested_role VARCHAR(50) NOT NULL DEFAULT 'ALUMNI',
    graduation_year INT,
    evidence_text TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    reviewed_by_sub VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_role_request_status ON role_request (status);
CREATE INDEX idx_role_request_user_sub_status ON role_request (user_sub, status);
