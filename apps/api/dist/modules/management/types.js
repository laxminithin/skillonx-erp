/**
 * Management & Executive Portal — shared types.
 *
 * The portal is a READ + GOVERN + APPROVE + ANALYZE layer. It never owns
 * transactional domain state; it authorizes executive access via the
 * `management.*` capability family and then consumes canonical domain read
 * services. The ManagementActor shares the same core shape as every domain
 * actor (facultyUserId / collegeId / departmentId / role / name), so it can be
 * handed directly to canonical read functions once the executive request has
 * cleared the management capability check.
 */
export {};
