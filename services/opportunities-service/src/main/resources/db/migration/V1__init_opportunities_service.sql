CREATE TABLE opportunity (
    id UUID PRIMARY KEY,
    created_by_sub VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    company VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    deadline DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_opportunity_status ON opportunity (status);
CREATE INDEX idx_opportunity_type ON opportunity (type);
CREATE INDEX idx_opportunity_created_by ON opportunity (created_by_sub);

CREATE TABLE application (
    id UUID PRIMARY KEY,
    opportunity_id UUID NOT NULL REFERENCES opportunity(id),
    applicant_sub VARCHAR(255) NOT NULL,
    cover_letter TEXT,
    resume_url VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (opportunity_id, applicant_sub)
);

CREATE INDEX idx_application_applicant ON application (applicant_sub);
CREATE INDEX idx_application_opportunity ON application (opportunity_id);
