// When to alert user
export let notification_alerts_mins = [60, 15];

interface Messaage
{
    id: number,
    title: string,
    msg: string,
    icon: string,
}
export const msg_warning: Messaage =
{
    id: 0,
    title: "Warning",
    msg: "You have " + notification_alerts_mins[0] + " remaining!",
    icon: "warning",
}
export const msg_critical: Messaage =
{
    id: 1,
    title: "Critical",
    msg: "Parking expiring in: " + notification_alerts_mins[1] + " mins!!",
    icon: "critical",
}

export interface UiColorDefs
{
    red: string,
    yellow: string,
    purple: string,
    green: string,
}
export const ui_color_defs: UiColorDefs =
{
    red: "#bf2924",
    yellow: "#efe856",
    purple: "#973bf9",
    green: "#3ac957"
}

export interface Emojis
{
    gps: string,
    save: string,
    clock: string,
    timer: string,
    delete: string,
    edit: string,
}
export const emojis: Emojis =
{
    gps: "⚲",
    save: "💾",
    clock: "🕓",
    timer: "⏱",
    delete: "🗑️",
    //delete: "🗑",
    edit: "✎",
}

// Will be used to save into json
export interface InputValues
{
    parking_level: string | null,
    parking_type: string,
    parked_time: Date,
    timed_parking: number | null,
    gps_location: [string, [number, number]] | null
    notes: string | null
    //run_in_background: boolean,
}
export interface AppColor
{
    primary: string,
    secondary: string,
    background: string,
}


// Used in next release
// e.g. setup Westfield, Secure parking etc
export interface ParkingProfile
{
    name: string,
    default_hours: number | null,
    parking_levels: [string] | null,
    default_parking_level: number | null, // idx of parking_levels
}