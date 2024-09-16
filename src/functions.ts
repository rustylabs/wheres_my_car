import {Geolocation} from '@capacitor/geolocation';
import type {LocalNotificationDescriptor} from '@capacitor/local-notifications';
import {LocalNotifications} from '@capacitor/local-notifications';
import type {InputValues} from './structures';
import {Filesystem, Directory, Encoding} from '@capacitor/filesystem';
import {Preferences} from '@capacitor/preferences';

import * as fs from 'fs';


export let latitude: number | null = null;
export let longitude: number | null = null;


// When you press "TImed/free hours" it will invert and stuff
// This function will run BEFORE is_timed_parking's value is changed
export function timed_parking_change(input_values: InputValues, is_timed_parking: boolean): InputValues
{
    if (is_timed_parking == true)
    {
        input_values.timed_parking = null   
    }
    console.log("is_timed_parking: " + is_timed_parking)
    return input_values
}

interface JsonHandlerStructure
{
    write(input_values: InputValues): void;
    read(input_values: InputValues): Promise<string | null>;
    delete(): void;
}

// Deals with reading and writing
export class JsonHandler implements JsonHandlerStructure
{
    readonly filepath = "./input_values.json";
    readonly key = "saved_current_parking";

    async write(input_values: InputValues)
    {
        //console.log("input_values.timed_parking: " + input_values.timed_parking)
        //console.log("input_values: " + JSON.stringify(input_values))

        //await fs.promises.writeFile("./input_values.json", JSON.stringify(input_values))
        /*
        await Filesystem.writeFile(
        {
            path: this.filepath,
            data: JSON.stringify(input_values),
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
        })
        */
        await Preferences.set(
        {
            key: this.key,
            value: JSON.stringify(input_values),
        })

        console.log("Saved json to file")
    }
    async read(): Promise<string | null>
    {
        const contents = await Preferences.get({key: this.key});
        return contents.value 

    }
    async delete()
    {
        /*
        await Filesystem.deleteFile(
        {
            path: this.filepath,
            directory: Directory.Documents,
        });
        */
        await Preferences.remove({key: this.key});

        console.log("Deleted json file")
    }
}

export const getLocation = async () =>
{
    const position = await Geolocation.getCurrentPosition();

    latitude = position.coords.latitude;
    longitude = position.coords.longitude;

    console.log("position: ", position);

    return position.coords;
}


export function get_time_remaining(parked_time: Date, add: number): number
{
    // Returns in minutes

    let parked_time_due = parked_time.getHours()*60 + parked_time.getMinutes() + add

    let parked_time_due_hours: bigint = BigInt(parked_time_due) / 60n;
    let parked_time_due_mins: bigint = BigInt(parked_time_due) - parked_time_due_hours*60n;


    /*
        let hours: bigint = BigInt(mins_remaining) / 60n;
        let minutes: bigint = BigInt(mins_remaining) - hours*60n;

    */


    //let parked_time_due= new Date(parked_time.getTime() + add * 60 * 1000);
    const current_time = new Date();

    //console.log(current_time.getHours(), parked_time_due_hours)

    //console.log(parked_time.getMinutes())

    let hours: bigint = parked_time_due_hours - BigInt(current_time.getHours())
    let minutes = parked_time_due_mins - BigInt(current_time.getMinutes())


    let remaining_minutes: number = Number(hours)*60 + Number(minutes);


    return remaining_minutes;
}

// Hours remaining: H:-20 M:-6
export function display_time_remaining(parked_time: Date, mins_remaining: number): string
{

    let hours: bigint = BigInt(mins_remaining) / 60n;
    let minutes: bigint = BigInt(mins_remaining) - hours*60n;


    let return_value: string = `H:${hours} M:${minutes}`

    return return_value;
}

/*
async function createNotificationChannel()
{
    await LocalNotifications.createChannel(
    {
        id: "default",
        name: "Default Channel",
        importance: LocalNotifications.ChannelImportance.LOW,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C"
    });
}
*/
// There to work with Android as it does not work with android
export async function notification_channel_config()
{

    const result = await LocalNotifications.checkPermissions();
    console.log(result);
    
    if (result.display != "granted")
    {
        Notification.requestPermission()
    }

    console.log("notification_channel_config() is called")
    await LocalNotifications.createChannel(
    {
        id: "default",
        name: "default",
        description: "This is default notification",
        vibration: true,
    })

    LocalNotifications.registerActionTypes(
    {
        types:[
        {
            id: "CHECK_IN",
            actions: [
            {
                id: "CHECK_IN",
                title: "Check in",
                foreground: true,
            }]
        }]
    })
}

export async function cancel_notification(msg_id: number)
{

    LocalNotifications.cancel(
    {
        notifications: [{id: msg_id}],
    })
}

export async function notification(title: string, msg: string, icon: string, timed_message: number | null, msg_id: number)
{
    let seconds_delay = 3;
    if (timed_message != null && timed_message > seconds_delay)
    {
        seconds_delay = timed_message;
    }
    console.log("notification() called");
    
    ///*
    try
    {
        await LocalNotifications.schedule(
        {
            notifications: [
            {
                title: title,
                body: msg,
                id: msg_id,
                // Schedule the notification for immediate delivery
                schedule: {at: new Date(Date.now() + 1000 * seconds_delay)},
                smallIcon: icon,
                //schedule: {at: new Date(Date.now())},
                //channelId: "default",
                //actionTypeId: "CHECK_IN",
                
                //sound: undefined,
                //attachments: undefined,
                //actionTypeId: "",
                //extra: null
                
            }]
        });
    }
    catch(err)
    {
        console.log("Cannot use notification due to: " + err);
    }
    //*/
}



// Converts 24 hour time to nicely format
export function return_formatted_time(parked_time: Date, add: number): string
{
    // add should take only minutes
    let hours: number;
    let minutes: number;
    let ampm: string = "am";

    let return_value: string;

    let parked_time_edited = new Date(parked_time.getTime() + add * 60 * 1000);

    hours = parked_time_edited.getHours();
    minutes = parked_time_edited.getMinutes();

    if (hours > 12)
    {
        hours = hours - 12
        ampm = "pm"
    }

    // Convert 9 to 09 minutes
    if (minutes <= 9)
    {
        return_value = `${hours}:0${minutes} ${ampm}`;
    }
    else
    {
        return_value = `${hours}:${minutes} ${ampm}`;
    }

    return return_value;
}

/*
export const getLocation = async () => {
    try {
        // Check if Geolocation is supported
        if (!('geolocation' in navigator)) throw new Error('Geolocation is not supported by this browser.');

        // Request permission to access the user's location
        await navigator.permissions.query({ name: 'geolocation' });
        
        // Get the user's current position
        const position = await navigator.geolocation.getCurrentPosition(
        (position) => {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
        },
        (error) => {
            console.error(`Error occurred while getting location: ${error.message}`);
        }
        );
    } catch (err) {
        console.error(err);
    }
};
*/
/*
export function getLocation()
{
    try {
        // Check if Geolocation is supported
        if (!('geolocation' in navigator)) throw new Error('Geolocation is not supported by this browser.');

        // Request permission to access the user's location
        navigator.permissions.query({ name: 'geolocation' });
        
        // Get the user's current position
        const position = navigator.geolocation.getCurrentPosition(
        (position) => {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
        },
        (error) => {
            console.error(`Error occurred while getting location: ${error.message}`);
        }
        );
    } catch (err) {
        console.error(err);
    }
};
*/

    /*
  onMount(() => {
    getLocation();
  });
  */