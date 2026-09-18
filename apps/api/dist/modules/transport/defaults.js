import { db } from '../../db/index.js';
export async function ensureCollegeTransportDefaults(collegeId) {
    if (!(await db.schema.hasTable('college_transport_policies')))
        return;
    const existing = await db('college_transport_policies').where({ college_id: collegeId }).first();
    if (!existing) {
        await db('college_transport_policies').insert({
            college_id: collegeId,
            application_required: true,
            approval_required: true,
            assignment_payment_policy: 'PAY_BEFORE_ASSIGNMENT',
            allow_route_preference: true,
            allow_stop_change: true,
            allow_route_change: true,
            change_approval_required: true,
            allow_temporary_stop_change: true,
            allow_one_way_service: true,
            transport_pass_required: true,
            boarding_tracking_enabled: true,
            driver_panel_enabled: true,
            conductor_panel_enabled: true,
            vehicle_capacity_enforced: true,
            clearance_required: true,
            refund_policy: 'POLICY_BASED',
            cancellation_policy: 'APPROVAL_REQUIRED',
            academic_exit_auto_cancel: true,
        });
    }
}
export async function getTransportPolicy(collegeId) {
    await ensureCollegeTransportDefaults(collegeId);
    const policy = await db('college_transport_policies').where({ college_id: collegeId }).first();
    return {
        applicationRequired: !!policy?.application_required,
        approvalRequired: !!policy?.approval_required,
        assignmentPaymentPolicy: policy?.assignment_payment_policy ?? 'PAY_BEFORE_ASSIGNMENT',
        allowRoutePreference: !!policy?.allow_route_preference,
        allowStopChange: !!policy?.allow_stop_change,
        allowRouteChange: !!policy?.allow_route_change,
        changeApprovalRequired: !!policy?.change_approval_required,
        allowTemporaryStopChange: !!policy?.allow_temporary_stop_change,
        allowOneWayService: !!policy?.allow_one_way_service,
        transportPassRequired: !!policy?.transport_pass_required,
        boardingTrackingEnabled: !!policy?.boarding_tracking_enabled,
        driverPanelEnabled: !!policy?.driver_panel_enabled,
        conductorPanelEnabled: !!policy?.conductor_panel_enabled,
        vehicleCapacityEnforced: !!policy?.vehicle_capacity_enforced,
        clearanceRequired: !!policy?.clearance_required,
        refundPolicy: policy?.refund_policy ?? 'POLICY_BASED',
        cancellationPolicy: policy?.cancellation_policy ?? 'APPROVAL_REQUIRED',
        academicExitAutoCancel: !!policy?.academic_exit_auto_cancel,
    };
}
export async function listStops(collegeId, activeOnly = true) {
    let q = db('transport_stops').where({ college_id: collegeId });
    if (activeOnly)
        q = q.whereIn('status', ['ACTIVE']);
    const rows = await q.orderBy('name');
    return rows.map(serializeStop);
}
export async function listRoutes(collegeId, activeOnly = true) {
    let q = db('transport_routes').where({ college_id: collegeId });
    if (activeOnly)
        q = q.where('status', 'ACTIVE');
    const rows = await q.orderBy('code');
    return rows.map(serializeRoute);
}
export function serializeStop(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        code: row.code,
        name: row.name,
        landmark: row.landmark,
        address: row.address,
        latitude: row.latitude != null ? Number(row.latitude) : null,
        longitude: row.longitude != null ? Number(row.longitude) : null,
        zoneId: row.zone_id ? Number(row.zone_id) : null,
        status: row.status,
    };
}
export function serializeRoute(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        code: row.code,
        name: row.name,
        origin: row.origin,
        destination: row.destination,
        directionType: row.direction_type,
        estimatedDistance: row.estimated_distance != null ? Number(row.estimated_distance) : null,
        estimatedDuration: row.estimated_duration != null ? Number(row.estimated_duration) : null,
        status: row.status,
    };
}
export function serializeVehicle(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        vehicleNumber: row.vehicle_number,
        internalCode: row.internal_code,
        vehicleType: row.vehicle_type,
        manufacturer: row.manufacturer,
        model: row.model,
        year: row.year != null ? Number(row.year) : null,
        seatingCapacity: Number(row.seating_capacity),
        standingCapacity: row.standing_capacity != null ? Number(row.standing_capacity) : null,
        totalCapacity: Number(row.total_capacity),
        status: row.status,
        operationalStatus: row.operational_status,
    };
}
