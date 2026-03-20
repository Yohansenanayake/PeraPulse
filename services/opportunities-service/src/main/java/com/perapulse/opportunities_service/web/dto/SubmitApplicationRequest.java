package com.perapulse.opportunities_service.web.dto;

import jakarta.validation.constraints.Size;

public record SubmitApplicationRequest(
    String coverLetter,
    @Size(max = 500) String resumeUrl
) {}
